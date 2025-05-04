use crate::config::{CWD, DATABASE};
use crate::utils::result::{CommandError, Result};
use anyhow::anyhow;
use md5::{Digest, Md5};
use src_shared::types::document::DocumentParseInfo;
use src_shared::utils::file::compute_md5;
use std::fs;
use std::io::Write;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Command, Stdio};

/// 解析 pdf 信息
#[tauri::command]
#[specta::specta]
pub fn parse_pdf(paths: Vec<String>) -> Result<Vec<DocumentParseInfo>> {
    let mut res: Vec<DocumentParseInfo> = Vec::new();
    let mut input = String::from("PARSE\n");
    let database = DATABASE
        .read()
        .map_err(|e| anyhow!("读取数据库失败 {}", e))?;
    let mut file_path = CWD.clone();
    file_path.push("data");
    file_path.push("files");

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
        let mut target = file_path.clone();
        target.push(format!("{}.pdf", md5).as_str());
        fs::copy(path.clone(), target.clone())?;
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
    let mut pdf_app = CWD.clone();
    pdf_app.push("bin");
    pdf_app.push("app.exe");
    let mut child = Command::new(pdf_app)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| anyhow!("启动pdf处理进程时失败 {}", e))?;
    let mut stdin = child
        .stdin
        .take()
        .ok_or(anyhow!("获取pdf处理进程输入管道时错误！"))?;
    writeln!(stdin, "{}", input)?;
    drop(stdin);
    let exit_status = child.wait()?;
    if !exit_status.success() {
        return Err(CommandError::from(anyhow!("解析 pdf 时失败！")));
    }
    let stdout = child.stdout.as_mut().unwrap();
    let reader = BufReader::new(stdout);
    for (index, line) in reader.lines().into_iter().enumerate() {
        let line = line?;
        res[index].page = line.parse()?;
    }
    Ok(res)
}

pub fn compute_str_md5(s: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(s.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)
}
