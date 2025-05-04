use crate::client::client_get;
use crate::config::{Database, CWD, DATABASE};
use crate::utils::result::Result;
use anyhow::anyhow;
use src_shared::types::document::Document;
use std::collections::HashMap;
use std::fs;

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
pub fn get_database_summary() -> (usize, usize) {
    let database = DATABASE.read().unwrap();
    (database.name_index.len(), database.data.len())
}

#[tauri::command]
#[specta::specta]
/// 更新数据库
pub fn update_database() -> Result<bool> {
    let remote_index: HashMap<String, Document> = client_get("/document/index")?;
    // 读取本地配置的md5
    let mut local_index_path = CWD.clone();
    local_index_path.push("data");
    local_index_path.push("data.json");
    // 写文件
    fs::write(
        local_index_path,
        serde_json::to_string(&remote_index).unwrap().as_str(),
    )
    .map_err(|e| anyhow!("写入文件时出错：{}", e))?;
    let mut database = DATABASE
        .write()
        .map_err(|e| anyhow!("更新本地数据库时出错：{}", e))?;
    database.data = remote_index;
    // 重新建立索引
    build_index(&mut database);
    Ok(true)
}
