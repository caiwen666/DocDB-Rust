use crate::client::request_json;
use crate::config::{db, Cwd, Database};
use crate::document::touch_document;
use crate::event::ProgressEvent;
use crate::utils::result::Result;
use anyhow::anyhow;
use reqwest::Method;
use src_shared::types::document::{Document, DocumentType};
use src_shared::utils::document::DocumentNameFormatter;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_specta::Event;

/// 建立数据库索引，根据 database 的 data 字段建立
pub fn build_index(database: &mut Database) {
    // 清空数据
    database.name_index.clear();
    database.index.clear();
    // 建立索引
    for (_, doc) in &database.data {
        // id 到 document
        assert!(
            !database.index.contains_key(&doc.id),
            "Checking database failed! Exist two same document ids.\n{:#?}\n{:#?}",
            database.index.get(&doc.id).unwrap(),
            doc
        );
        database.index.insert(doc.id, doc.clone());
        // 试卷名称
        let mut arr = database.name_index.get_mut(&doc.info.name);
        if arr.is_none() {
            database.name_index.insert(doc.info.name.clone(), vec![]);
            arr = database.name_index.get_mut(&doc.info.name);
        }
        let arr = arr.unwrap();
        arr.push(doc.clone());
        // TODO 感觉以后改成复制指针可能好点，现在先这样
    }
}

#[tauri::command]
#[specta::specta]
/// 获取数据库的摘要信息
/// (科目数量, 试卷总数)
pub async fn get_database_summary() -> (usize, usize) {
    let database = db().await.read().await;
    (database.name_index.len(), database.data.len())
}

#[tauri::command]
#[specta::specta]
/// 更新数据库
pub async fn update_database() -> Result<bool> {
    let remote_index: HashMap<String, Document> =
        request_json(Method::GET, "/document/index", |o| o)
            .await?
            .try_unwrap()?;
    // 写文件
    tokio::fs::write(
        Cwd::from_data().push("data.json").path(),
        serde_json::to_string(&remote_index).unwrap().as_str(),
    )
    .await
    .map_err(|e| anyhow!("写入文件时出错：{}", e))?;
    let mut database = db().await.write().await;
    database.data = remote_index;
    // 重新建立索引
    build_index(&mut database);
    Ok(true)
}

#[tauri::command]
#[specta::specta]
pub async fn hot_cache(handle: AppHandle) -> Result<()> {
    let database = db().await.read().await;
    let mut ok = 0;
    ProgressEvent(ok, database.data.len() as isize).emit(&handle)?;
    for (md5, _) in &database.data {
        touch_document(md5).await?;
        ok += 1;
        ProgressEvent(ok, database.data.len() as isize).emit(&handle)?;
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn export_database(handle: AppHandle, target: String) -> Result<()> {
    let mut entries = tokio::fs::read_dir(target.as_str()).await?;
    if entries.next_entry().await?.is_some() {
        return Err(anyhow!("导出的目录不为空！请清空后重试！").into());
    }
    let database = db().await.read().await;
    let mut ok = 0;
    ProgressEvent(ok, database.data.len() as isize).emit(&handle)?;
    for item in database.data.values() {
        let mut path = PathBuf::from(target.as_str());
        // 首先是课程名称
        path.push(item.info.name.as_str());
        // 然后是试卷类型
        match item.info.typ {
            DocumentType::FinalExam => path.push("期末"),
            DocumentType::MidExam => path.push("期中"),
            DocumentType::Other => path.push("题库或其他"),
        };
        // 看一下有没有 filter
        if item.info.filter.len() > 0 {
            let mut filter = item.info.filter.clone();
            filter.sort();
            path.push(filter.join(""));
        }
        // 创建目录
        tokio::fs::create_dir_all(path.as_path()).await?;
        // 然后是试卷名称
        let name = if item.info.typ == DocumentType::Other {
            // 目前其他类型一般是题库什么的，这里最好是特殊处理一下
            let mut builder = DocumentNameFormatter::new(item).show_tags(true);
            if item.info.date.is_some() {
                builder = builder.show_year(true);
                builder = builder.show_answer(true);
            }
            builder.format()
        } else {
            DocumentNameFormatter::new(item)
                .show_year(true)
                .show_answer(true)
                .show_identifier(true)
                .show_tags(true)
                .format()
        };
        path.push(format!("{}.pdf", name));
        tokio::fs::copy(
            Cwd::from_file().push(format!("{}.pdf", item.md5)).path(),
            path,
        )
        .await?;
        ok += 1;
        ProgressEvent(ok, database.data.len() as isize).emit(&handle)?;
    }
    Ok(())
}
