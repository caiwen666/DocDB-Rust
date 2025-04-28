use crate::config::{Database, DATABASE};
use crate::database;

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
            database.name_index.insert(doc.info.name.clone(),vec![]);
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