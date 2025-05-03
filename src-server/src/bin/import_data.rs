use sea_orm::EntityTrait;
use src_server::db::db;
use src_server::entity::db::tb_document;
use src_shared::types::document::{Document, OldDocument};
use src_shared::utils::document::DocumentNameFormatter;
use std::collections::HashMap;

// WARNING!!!!!
// 此操作会增量式地将数据导入到数据库中。执行此操作的时候数据库应该清空

#[tokio::main]
async fn main() {
    let data = tokio::fs::read_to_string("src-server/data/data.json")
        .await
        .unwrap();
    let data: HashMap<String, OldDocument> = serde_json::from_str(&data).unwrap();
    let data: HashMap<String, Document> = data
        .into_iter()
        .map(|(k, v)| (k, Document::from(v)))
        .collect();
    for doc in data.values() {
        let doc_model = tb_document::Model::from(doc.clone());
        let active_model: tb_document::ActiveModel = doc_model.into();
        tb_document::Entity::insert(active_model)
            .exec(db().await)
            .await
            .unwrap();
        println!(
            "Inserted document: {}",
            DocumentNameFormatter::new(doc).show_all().format()
        )
    }
}
