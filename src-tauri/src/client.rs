use crate::config::config;
use crate::utils::result::{CommandError, Result};
use anyhow::anyhow;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use reqwest::StatusCode;
use serde::Deserialize;
use std::borrow::Cow;
use std::fmt::Debug;
use tokio::sync::OnceCell;

#[derive(Debug, Deserialize)]
pub struct Response<T> {
    code: u16,
    data: Option<T>,
    msg: String,
}

impl<T> Response<T> {
    pub fn is_err(&self) -> bool {
        self.code != 200
    }
    pub fn is_none(&self) -> bool {
        self.data.is_none()
    }
    pub fn try_unwrap(self) -> Result<T> {
        if self.is_err() {
            return Err(CommandError::from(anyhow!(
                "请求服务器失败! Code: {}, Msg: {}",
                self.code,
                self.msg
            )));
        }
        if self.is_none() {
            return Err(CommandError::from(anyhow!(
                "请求服务器失败，服务器返回数据为空!"
            )));
        }
        Ok(self.data.unwrap())
    }
}

async fn get_instance() -> &'static reqwest::Client {
    static INSTANCE: OnceCell<reqwest::Client> = OnceCell::const_new();
    INSTANCE
        .get_or_init(|| async {
            let token = config().await.read().await.token.clone();
            let mut headers = HeaderMap::new();
            headers.insert(
                AUTHORIZATION,
                HeaderValue::from_str(token.as_str()).unwrap(),
            );
            reqwest::Client::builder()
                .default_headers(headers)
                .build()
                .unwrap()
        })
        .await
}

pub async fn request<'a>(
    method: reqwest::Method,
    url: impl Into<Cow<'a, str>>,
    f: impl FnOnce(reqwest::RequestBuilder) -> reqwest::RequestBuilder,
) -> Result<reqwest::Response> {
    let remote = config().await.read().await.remote.clone();
    let url: Cow<str> = url.into();
    let client = get_instance()
        .await
        .request(method, format!("{}{}", remote, url));
    let resp = f(client)
        .send()
        .await
        .map_err(|e| anyhow!("请求服务器时出错：{}", e))?;
    if resp.status() != StatusCode::OK {
        return Err(CommandError::from(anyhow!(
            "请求服务器失败：{:?}",
            resp.status()
        )));
    }
    Ok(resp)
}

pub async fn request_json<'a, T>(
    method: reqwest::Method,
    url: impl Into<Cow<'a, str>>,
    f: impl FnOnce(reqwest::RequestBuilder) -> reqwest::RequestBuilder,
) -> Result<Response<T>>
where
    T: for<'de> Deserialize<'de>,
{
    let url: Cow<str> = url.into();
    let resp = request(method, url, f).await?;
    let data = resp
        .json::<Response<T>>()
        .await
        .map_err(|e| anyhow!("解析服务器返回时出错：{}", e))?;
    Ok(data)
}
