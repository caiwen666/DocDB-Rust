use crate::db::inner_db;
use crate::result::{AppResult, Success};
use crate::service::document::{
    delete_document, get_document_by_md5, insert_document, is_document_exists, update_document,
};
use crate::service::file::is_file_exists;
use anyhow::anyhow;
use salvo::handler;
use salvo::prelude::*;
use serde_json::json;
use src_shared::types::document::Document;
use src_shared::utils::document::DocumentNameFormatter;
use tracing::log::info;

#[handler]
pub async fn index() -> AppResult {
    let the_inner_db = inner_db().await.read().await;
    Ok(Success::from(json!(*the_inner_db)))
}

#[handler]
pub async fn add(req: &mut Request) -> AppResult {
    let doc = req.parse_json::<Document>().await?;
    if !is_file_exists(doc.md5.as_str()).await {
        return Err(anyhow!("Haven't handed in the file yet!").into());
    }
    if is_document_exists(doc.md5.as_str()).await {
        return Err(anyhow!("Already have the same document!").into());
    }
    let doc = insert_document(doc).await?;
    info!(
        "成功添加试卷\n+ {}",
        DocumentNameFormatter::new(&doc).show_all().format()
    );
    Ok(Success::from(doc))
}

#[handler]
pub async fn delete(req: &mut Request) -> AppResult {
    let md5 = req
        .query::<String>("md5")
        .ok_or(anyhow!("md5 is required"))?;
    if !is_document_exists(md5.as_str()).await {
        return Err(anyhow!("Document not found!").into());
    }
    let doc = delete_document(md5.as_str()).await?;
    info!(
        "成功删除试卷\n- {}",
        DocumentNameFormatter::new(&doc).show_all().format()
    );
    Ok(Success::from(doc))
}

#[handler]
pub async fn update(req: &mut Request) -> AppResult {
    let doc = req.parse_json::<Document>().await?;
    if !is_document_exists(doc.md5.as_str()).await {
        return Err(anyhow!("Document not found!").into());
    }
    let old_doc = get_document_by_md5(doc.md5.as_str()).await.unwrap();
    update_document(&doc).await?;
    info!(
        "成功更新试卷\n- {}\n+ {}",
        DocumentNameFormatter::new(&old_doc).show_all().format(),
        DocumentNameFormatter::new(&doc).show_all().format()
    );
    Ok(Success::from(doc))
}
