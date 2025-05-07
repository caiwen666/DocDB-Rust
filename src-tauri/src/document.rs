use crate::client::{request, request_json};
use crate::config::{config, db, Cwd};
use crate::database::update_database;
use crate::event::ProgressEvent;
use crate::utils::result::{CommandError, Result};
use anyhow::anyhow;
use regex::Regex;
use reqwest::{multipart, Method};
use src_shared::types::document::{Document, SelectedDocument};
use src_shared::utils::document::DocumentNameFormatter;
use std::process::Stdio;
use tauri::AppHandle;
use tauri_specta::Event;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;

#[tauri::command]
#[specta::specta]
/// 按关键字搜索试卷
pub async fn search_document(keyword: String) -> Vec<Document> {
    let pattern = keyword.split("").collect::<Vec<&str>>().join(".*");
    let re = Regex::new(pattern.as_str());
    if re.is_err() {
        return vec![];
    }
    let re = re.unwrap();
    let mut result = vec![];
    let database = db().await.read().await;
    for (name, docs) in &database.name_index {
        if re.is_match(name.as_str()) {
            for doc in docs {
                result.push(doc.clone());
            }
        }
    }
    result
}

#[tauri::command]
#[specta::specta]
/// 根据试卷id获取试卷实体
pub async fn get_document(id: usize) -> Option<Document> {
    let database = db().await.read().await;
    database.index.get(&id).map(|v| v.clone())
}

#[tauri::command]
#[specta::specta]
/// 打开指定md5的文件
/// 尽量不要传递试卷id，试卷id未必是试卷的唯一标识符
pub async fn open_document(md5: String) {
    let _ = open::that(Cwd::from_file().push(format!("{}.pdf", md5)).path());
}

#[tauri::command]
#[specta::specta]
/// 通过md5获取试卷实体
pub async fn get_document_by_md5(md5: String) -> Option<Document> {
    let database = db().await.read().await;
    database.data.get(md5.as_str()).map(|v| v.clone())
}

/// 打包试卷到一个pdf
/// list 给出打包的目标和要求
/// double 为是否要打包成双面
/// 返回打包后 pdf 的名称
#[tauri::command]
#[specta::specta]
pub async fn fetch_document(
    handle: AppHandle,
    list: Vec<SelectedDocument>,
    double: bool,
) -> Result<String> {
    // 先检查是否有文件需要下载
    let mut ok = 0;
    ProgressEvent(ok, list.len() as isize).emit(&handle)?;
    for item in &list {
        touch_document(item.doc.md5.as_str()).await?;
        ok += 1;
        ProgressEvent(ok, list.len() as isize).emit(&handle)?;
    }
    ProgressEvent(-1, -1).emit(&handle)?;
    let font_path = Cwd::from_root().push("font.ttf").path();
    let tmp_path = Cwd::from_tmp().path();
    let mut input = format!("PACK\n{}\n{}\n", font_path.display(), tmp_path.display());
    let config = config().await.read().await;
    if !config.watermark {
        input.push_str("CLOSE_WATERMARK\n");
    }
    for item in list {
        let target = Cwd::from_file()
            .push(format!("{}.pdf", item.doc.md5))
            .path();
        input.push_str(
            format!(
                "{}\n{}\n{}\n{}\n{}\n{}\n",
                target.display(),
                if double { "double" } else { "single" },
                item.count,
                DocumentNameFormatter::new(&item.doc)
                    .show_year(true)
                    .show_tags(true)
                    .show_filter(true)
                    .format(),
                item.doc.info.page,
                item.doc.id
            )
            .as_str(),
        );
    }
    input.push_str("END");
    {
        let mut file = tokio::fs::File::create(Cwd::from_root().push("test.in").path())
            .await
            .map_err(|e| anyhow!("创建文件时出错：{}", e))?;
        file.write_all(input.as_bytes())
            .await
            .map_err(|e| anyhow!("写入文件时出错：{}", e))?;
    }
    let pdf_app = Cwd::from_root()
        .push("bin")
        .push(config.pdf_tools.as_str())
        .path();
    let mut child = Command::new(pdf_app)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()?;
    let mut stdin = child
        .stdin
        .take()
        .ok_or(anyhow!("获取pdf处理进程输入管道时错误！"))?;
    stdin.write_all(input.as_bytes()).await?;
    stdin.flush().await?;
    stdin.shutdown().await?;
    drop(stdin);
    let stdout = child
        .stdout
        .as_mut()
        .ok_or(anyhow!("获取pdf处理进程输出管道时错误！"))?;
    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();
    while let Some(line) = lines.next_line().await? {
        if line.starts_with("DONE ") {
            return Ok(line[5..].to_string());
        } else if line == "-1" {
            ProgressEvent(-1, -1).emit(&handle)?;
        } else {
            let progress: Vec<&str> = line.split(" ").collect();
            ProgressEvent(progress[0].parse()?, progress[1].parse()?).emit(&handle)?;
        }
    }
    let exit_status = child.wait().await?;
    Err(CommandError::from(anyhow!(
        "异常的退出状态：{:#?}",
        exit_status
    )))
}

/// 删除试卷
#[tauri::command]
#[specta::specta]
pub async fn delete_document(md5: String) -> Result<()> {
    request(Method::GET, format!("/document/delete?md5={}", md5), |o| o).await?;
    update_database().await?;
    Ok(())
}

/// 更新试卷
#[tauri::command]
#[specta::specta]
pub async fn update_document(doc: Document) -> Result<()> {
    request(Method::POST, "/document/update", |o| o.json(&doc)).await?;
    update_database().await?;
    Ok(())
}

/// 试卷添加之后需要手动调用 update_database
#[tauri::command]
#[specta::specta]
pub async fn add_document(doc: Document) -> Result<()> {
    // 检查是否提交了文件
    let handed: bool = request_json(Method::GET, format!("/file/exists?md5={}", doc.md5), |o| o)
        .await?
        .try_unwrap()?;
    if !handed {
        let file_part = multipart::Form::new()
            .file(
                "file",
                Cwd::from_file().push(format!("{}.pdf", doc.md5)).path(),
            )
            .await?;
        request(Method::POST, "/file/upload", |o| o.multipart(file_part)).await?;
    }
    request(Method::POST, "/document/add", |o| o.json(&doc)).await?;
    Ok(())
}

/// 这个函数会先判断本地是否存在了这个试卷对应的文件
/// 如果不存在，则会从服务器上下载
#[tauri::command]
#[specta::specta]
pub async fn touch_document(md5: &str) -> Result<()> {
    let file_path = Cwd::from_file().push(format!("{}.pdf", md5)).path();
    if file_path.exists() {
        return Ok(());
    }

    let resp = request(Method::GET, format!("/file/download?md5={}", md5), |o| o).await?;
    let data = resp
        .bytes()
        .await
        .map_err(|e| anyhow!("解析服务器返回时出错：{}", e))?;
    let mut file = tokio::fs::File::create(file_path)
        .await
        .map_err(|e| anyhow!("创建文件时出错：{}", e))?;
    file.write_all(data.as_ref())
        .await
        .map_err(|e| anyhow!("写入文件时出错：{}", e))?;
    Ok(())
}
