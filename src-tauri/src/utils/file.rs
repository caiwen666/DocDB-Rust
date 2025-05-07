use crate::config::{config, db, Cwd};
use crate::utils::result::{CommandError, Result};
use anyhow::anyhow;
use md5::{Digest, Md5};
use src_shared::types::document::DocumentParseInfo;
use src_shared::utils::file::compute_md5;
use std::path::Path;
use std::process::{ExitStatus, Stdio};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;

/// 解析 pdf 信息
#[tauri::command]
#[specta::specta]
pub async fn parse_pdf(paths: Vec<String>) -> Result<Vec<DocumentParseInfo>> {
    let mut res: Vec<DocumentParseInfo> = Vec::new();
    let mut input = String::from("PARSE\n");
    let database = db().await.read().await;

    // 先把拖入文件缓存过来
    for path in paths {
        let name = Path::new(path.as_str())
            .file_name()
            .unwrap()
            .to_str()
            .unwrap();
        let md5 = compute_md5(path.clone())?;
        if database.data.contains_key(md5.as_str()) {
            return Err(CommandError::from(anyhow!("{} 已经存在于数据库中！", path)));
        }
        if res.iter().find(|v| v.md5 == md5).is_some() {
            return Err(CommandError::from(anyhow!("{} 文件重复！", path)));
        }
        let target = Cwd::from_file().push(format!("{}.pdf", md5)).path();
        tokio::fs::copy(path.clone(), target.clone()).await?;
        let target = target.display().to_string();
        input.push_str(target.as_str());
        input.push('\n');
        res.push(DocumentParseInfo {
            md5,
            name: String::from(name),
            path: target,
            page: 0,
        })
    }
    input.push_str("END");
    let pdf_app = Cwd::from_root()
        .push("bin")
        .push(config().await.read().await.pdf_tools.as_str())
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
    let output = child.wait_with_output().await?;
    if !output.status.success() {
        return Err(CommandError::from(anyhow!(
            "pdf 处理失败！\n{}",
            String::from_utf8_lossy(&output.stderr)
        )));
    }

    let output = String::from_utf8_lossy(&output.stdout);

    for (idx, line) in output.lines().into_iter().enumerate() {
        res[idx].page = line.parse()?;
    }

    Ok(res)
}

pub fn compute_str_md5(s: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(s.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)
}
