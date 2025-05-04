use crate::config::CONFIG;
use crate::utils::result::{CommandError, Result};
use anyhow::anyhow;
use reqwest::blocking::multipart;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use std::path::PathBuf;
use std::sync::LazyLock;

pub static CLIENT: LazyLock<reqwest::blocking::Client> = LazyLock::new(|| {
    reqwest::blocking::ClientBuilder::new()
        .danger_accept_invalid_certs(true)
        .build()
        .unwrap()
});

#[derive(Debug, Deserialize)]
struct Response<T> {
    code: u16,
    data: Option<T>,
    msg: String,
}

pub fn client_get<T: for<'de> Deserialize<'de> + Debug>(url: &str) -> Result<T> {
    let config = CONFIG
        .read()
        .map_err(|e| anyhow!("获取配置信息时出错：{}", e))?;
    let remote = config.remote.clone();
    let token = config.token.clone();
    drop(config);
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(token.as_str()).map_err(|e| anyhow!("token无效：{}", e))?,
    );
    let rep = CLIENT
        .get(format!("{}{}", remote, url))
        .headers(headers)
        .send()
        .map_err(|e| anyhow!("请求服务器时出错：{}", e))?;
    if rep.status() != StatusCode::OK {
        return Err(CommandError::from(anyhow!(
            "请求服务器失败：{:?}",
            rep.status()
        )));
    }
    let data: Response<T> = rep
        .json()
        .map_err(|e| anyhow!("解析服务器返回时出错：{}", e))?;
    if data.code != 200 {
        return Err(CommandError::from(anyhow!("请求服务器失败：{:?}", data)));
    }
    Ok(data.data.unwrap())
}

pub fn client_post<I: Serialize, O: for<'de> Deserialize<'de> + Debug>(
    url: &str,
    input: &I,
) -> Result<O> {
    let config = CONFIG
        .read()
        .map_err(|e| anyhow!("获取配置信息时出错：{}", e))?;
    let remote = config.remote.clone();
    let token = config.token.clone();
    drop(config);
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(token.as_str()).map_err(|e| anyhow!("token无效：{}", e))?,
    );
    let rep = CLIENT
        .post(format!("{}{}", remote, url))
        .headers(headers)
        .json(input)
        .send()
        .map_err(|e| anyhow!("请求服务器时出错：{}", e))?;
    if rep.status() != StatusCode::OK {
        return Err(CommandError::from(anyhow!(
            "请求服务器失败：{:?}",
            rep.status()
        )));
    }
    let data: Response<O> = rep
        .json()
        .map_err(|e| anyhow!("解析服务器返回时出错：{}", e))?;
    if data.code != 200 {
        return Err(CommandError::from(anyhow!("请求服务器失败：{:?}", data)));
    }
    Ok(data.data.unwrap())
}

pub fn client_post_file(url: &str, path: &PathBuf) -> Result<()> {
    let config = CONFIG
        .read()
        .map_err(|e| anyhow!("获取配置信息时出错：{}", e))?;
    let remote = config.remote.clone();
    let token = config.token.clone();
    drop(config);
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(token.as_str()).map_err(|e| anyhow!("token无效：{}", e))?,
    );
    let file_part = multipart::Form::new().file("file", path)?;
    let res = CLIENT
        .post(format!("{}{}", remote, url))
        .headers(headers)
        .multipart(file_part)
        .send()
        .map_err(|e| anyhow!("请求服务器时出错：{}", e))?;
    if res.status() != StatusCode::OK {
        return Err(CommandError::from(anyhow!(
            "请求服务器失败：{:?}",
            res.status()
        )));
    }
    let data: Response<()> = res
        .json()
        .map_err(|e| anyhow!("解析服务器返回时出错：{}", e))?;
    if data.code != 200 {}
    Ok(())
}
