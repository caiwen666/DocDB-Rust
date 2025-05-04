use crate::config::UPLOADED_FILE_PATH;
use crate::result::{AppResult, Success};
use crate::service::file::is_file_exists;
use crate::utils::async_func;
use anyhow::anyhow;
use salvo::fs::NamedFile;
use salvo::{Request, Response, handler};
use serde_json::Value;
use src_shared::utils::file::compute_md5;

#[handler]
pub async fn upload(req: &mut Request) -> AppResult {
    let file = req
        .file("file")
        .await
        .ok_or(anyhow!("Failed to get the file data"))?;
    let md5 = compute_md5(file.path())
        .map_err(|e| anyhow!("Failed to compute the md5 of the uploaded file: {}", e))?;
    let dest = format!("{}/{}", UPLOADED_FILE_PATH, md5);
    tokio::fs::copy(file.path(), &dest)
        .await
        .map_err(|e| anyhow!("Failed to copy the file: {}", e))?;
    Ok(Success::from(Value::Null))
}

#[handler]
pub async fn download(req: &mut Request, res: &mut Response) {
    let app_result = async_func(async {
        let md5 = req
            .query::<String>("md5")
            .ok_or(anyhow!("The md5 of the file is required"))?;
        let file_name = format!("{}.pdf", md5);
        tokio::fs::try_exists(format!("{}/{}.pdf", UPLOADED_FILE_PATH, md5))
            .await
            .map_err(|e| anyhow!("The target is not found: {}", e))?;
        NamedFile::builder(UPLOADED_FILE_PATH)
            .attached_name(&file_name)
            .send(req.headers(), res)
            .await;
        Ok(Success::from(()))
    })
    .await;
    match app_result {
        Ok(_) => (),
        Err(e) => res.render(e),
    };
}

#[handler]
pub async fn exists(req: &mut Request) -> AppResult {
    let md5 = req
        .query::<String>("md5")
        .ok_or(anyhow!("The md5 of the file is required"))?;
    Ok(Success::from(is_file_exists(md5.as_str()).await))
}
