use crate::client::{client_get, client_post, client_post_file};
use crate::config::{CONFIG, CWD, DATABASE};
use crate::database::update_database;
use crate::event::ProgressEvent;
use crate::utils::result::{CommandError, Result};
use anyhow::anyhow;
use regex::Regex;
use src_shared::types::document::{Document, SelectedDocument};
use src_shared::utils::document::DocumentNameFormatter;
use std::io::Write;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use tauri::AppHandle;
use tauri_specta::Event;

#[tauri::command]
#[specta::specta]
/// 按关键字搜索试卷
pub fn search_document(keyword: String) -> Vec<Document> {
    let pattern = keyword.split("").collect::<Vec<&str>>().join(".*");
    let re = Regex::new(pattern.as_str());
    if re.is_err() {
        return vec![];
    }
    let re = re.unwrap();
    let mut result = vec![];
    let database = DATABASE.read().unwrap();
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
pub fn get_document(id: usize) -> Option<Document> {
    let database = DATABASE.read().unwrap();
    database.index.get(&id).map(|v| v.clone())
}

#[tauri::command]
#[specta::specta]
/// 打开指定md5的文件
/// 尽量不要传递试卷id，试卷id未必是试卷的唯一标识符
pub fn open_document(md5: String) {
    let mut cwd = CWD.clone();
    cwd.push("data");
    cwd.push("files");
    cwd.push(format!("{}.pdf", md5));
    let _ = open::that(cwd);
}

#[tauri::command]
#[specta::specta]
/// 通过md5获取试卷实体
pub fn get_document_by_md5(md5: String) -> Option<Document> {
    let database = DATABASE.read().unwrap();
    database.data.get(md5.as_str()).map(|v| v.clone())
}

/// 打包试卷到一个pdf
/// list 给出打包的目标和要求
/// double 为是否要打包成双面
/// 返回打包后 pdf 的名称
#[tauri::command]
#[specta::specta]
pub fn fetch_document(
    handle: AppHandle,
    list: Vec<SelectedDocument>,
    double: bool,
) -> Result<String> {
    let mut file_path = CWD.clone();
    file_path.push("data");
    file_path.push("files");
    let mut font_path = CWD.clone();
    font_path.push("font.ttf");
    let mut tmp_path = CWD.clone();
    tmp_path.push("data");
    tmp_path.push("tmp");
    let mut input = format!("PACK\n{}\n{}\n", font_path.display(), tmp_path.display());
    let config = CONFIG.read().map_err(|_| anyhow!("读取配置文件时出错！"))?;
    if !config.watermark {
        input.push_str("CLOSE_WATERMARK\n");
    }
    for item in list {
        let mut target = file_path.clone();
        target.push(format!("{}.pdf", item.doc.md5));
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
    let mut pdf_app = CWD.clone();
    pdf_app.push("bin");
    pdf_app.push(config.pdf_tools.as_str());
    let mut child = Command::new(pdf_app)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|_| anyhow!("启动pdf处理进程时失败！"))?;
    let mut stdin = child
        .stdin
        .take()
        .ok_or(anyhow!("获取pdf处理进程输入管道时错误！"))?;
    writeln!(stdin, "{}", input)?;
    drop(stdin);
    let stdout = child
        .stdout
        .as_mut()
        .ok_or(anyhow!("获取pdf处理进程输出管道时错误！"))?;
    let reader = BufReader::new(stdout);
    for line in reader.lines() {
        let line = line?;
        if line.starts_with("DONE ") {
            return Ok(line[5..].to_string());
        } else if line == "-1" {
            ProgressEvent(-1, -1).emit(&handle)?;
        } else {
            let progress: Vec<&str> = line.split(" ").collect();
            ProgressEvent(progress[0].parse()?, progress[1].parse()?).emit(&handle)?;
        }
    }
    let exit_status = child.wait()?;
    Err(CommandError::from(anyhow!(
        "异常的退出状态：{:#?}",
        exit_status
    )))
}

/// 删除试卷
#[tauri::command]
#[specta::specta]
pub fn delete_document(md5: String) -> Result<()> {
    client_get::<Document>(format!("/document/delete?md5={}", md5).as_str())?;
    update_database()?;
    Ok(())
}

/// 更新试卷
#[tauri::command]
#[specta::specta]
pub fn update_document(doc: Document) -> Result<()> {
    let _unused: Document = client_post("/document/update", &doc)?;
    update_database()?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn add_document(doc: Document) -> Result<()> {
    // 检查是否提交了文件
    if !client_get::<bool>(format!("/file/exists?md5={}", doc.md5).as_str())? {
        // 提交文件
        let mut file_path = CWD.clone();
        file_path.push("data");
        file_path.push("files");
        file_path.push(format!("{}.pdf", doc.md5));
        client_post_file("/file/upload", &file_path)?;
    }
    let _unused: Document = client_post("/document/add", &doc)?;
    update_database()?;
    Ok(())
}
