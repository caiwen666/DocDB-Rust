use crate::db::{db, inner_db};
use crate::entity::db::tb_document;
use anyhow::anyhow;
use sea_orm::QueryFilter;
use sea_orm::{ColumnTrait, Unchanged};
use sea_orm::{EntityTrait, NotSet};
use src_shared::types::document::Document;

pub async fn is_document_exists(md5: &str) -> bool {
    let the_inner_db = inner_db().await.read().await;
    the_inner_db.contains_key(md5)
}

pub async fn insert_document(mut doc: Document) -> Result<Document, anyhow::Error> {
    let model_doc = tb_document::Model::from(doc.clone());
    let mut active_doc: tb_document::ActiveModel = model_doc.into();
    active_doc.id = NotSet;
    let res = tb_document::Entity::insert(active_doc)
        .exec(db().await)
        .await
        .map_err(|e| anyhow!("Failed to insert the document: {}", e))?;
    let id = res.last_insert_id;
    doc.id = id as usize;
    let mut the_inner_db = inner_db().await.write().await;
    the_inner_db.insert(doc.md5.clone(), doc.clone());
    Ok(doc)
}

pub async fn delete_document(md5: &str) -> Result<Document, anyhow::Error> {
    let res = tb_document::Entity::delete_many()
        .filter(tb_document::Column::Md5.eq(md5))
        .exec(db().await)
        .await
        .map_err(|e| anyhow!("Failed to delete the document: {}", e))?;
    if res.rows_affected == 0 {
        return Err(anyhow!("Failed to delete the document"));
    }
    let mut the_inner_db = inner_db().await.write().await;
    let res = the_inner_db.remove(md5).unwrap();
    Ok(res)
}

pub async fn update_document(doc: &Document) -> Result<(), anyhow::Error> {
    let the_inner_db = inner_db().await.read().await;
    let mut local_doc = the_inner_db
        .get(&doc.md5)
        .expect("Document not found")
        .clone();
    drop(the_inner_db);
    local_doc.info = doc.info.clone();
    let model_doc = tb_document::Model::from(local_doc.clone());
    let mut active_doc: tb_document::ActiveModel = model_doc.into();
    active_doc.id = Unchanged(local_doc.id as i32);
    active_doc.md5 = Unchanged(local_doc.md5.clone());
    tb_document::Entity::update(active_doc)
        .filter(tb_document::Column::Md5.eq(doc.md5.clone()))
        .exec(db().await)
        .await
        .map_err(|e| anyhow!("Failed to update the document: {}", e))?;
    let mut the_inner_db = inner_db().await.write().await;
    the_inner_db.insert(doc.md5.clone(), local_doc);
    Ok(())
}

pub async fn get_document_by_md5(md5: &str) -> Option<Document> {
    let the_inner_db = inner_db().await.read().await;
    the_inner_db.get(md5).map(|v| v.clone())
}
