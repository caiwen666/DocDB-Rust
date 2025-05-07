use crate::client::request_json;
use crate::config::{db, Cwd, Database};
use crate::document::touch_document;
use crate::event::ProgressEvent;
use crate::utils::result::Result;
use anyhow::anyhow;
use reqwest::Method;
use src_shared::types::document::Document;
use std::collections::HashMap;
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
