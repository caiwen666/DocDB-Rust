use salvo::http::{ParseError, StatusCode};
use salvo::prelude::Json;
use salvo::{Response, Scribe};
use serde::Serialize;
use serde_json::Value;
use thiserror::Error;

pub struct Success(Value);

impl<T: Serialize> From<T> for Success {
    fn from(value: T) -> Self {
        Success(serde_json::json!({
            "code": 200,
            "data": value,
            "msg": "ok"
        }))
    }
}

impl Scribe for Success {
    fn render(self, res: &mut Response) {
        res.stuff(StatusCode::OK, Json(self.0));
    }
}

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Error: `{0}`")]
    AnyHow(#[from] anyhow::Error),
    #[error("Timeout Error")]
    Timeout,
    #[error("ParseError: `{0}`")]
    ParseError(#[from] ParseError),
    #[error("Unauthorized")]
    Unauthorized,
}

impl Scribe for AppError {
    fn render(self, res: &mut Response) {
        match self {
            AppError::AnyHow(e) => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 500,
                    "data": Value::Null,
                    "msg": format!("{}", e)
                })),
            ),
            AppError::Timeout => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 503,
                    "data": Value::Null,
                    "msg": "Timeout Error"
                })),
            ),
            AppError::ParseError(e) => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 400,
                    "data": Value::Null,
                    "msg": format!("Unexpected argument. {}", e)
                })),
            ),
            AppError::Unauthorized => res.stuff(
                StatusCode::OK,
                Json(serde_json::json!({
                    "code": 403,
                    "data": Value::Null,
                    "msg": "Unauthorized!"
                })),
            ),
        }
    }
}

pub type AppResult = Result<Success, AppError>;
