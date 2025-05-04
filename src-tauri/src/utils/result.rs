use serde::Serialize;
use specta::Type;
use std::fmt::{Debug, Display, Formatter};
use std::num::ParseIntError;

#[derive(Debug, Type)]
pub struct CommandError {
    #[specta(type = String)]
    pub inner: anyhow::Error,
}

impl Display for CommandError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        std::fmt::Display::fmt(&self.inner, f)
    }
}

impl std::error::Error for CommandError {}

impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&format!("{:#}", self.inner))
    }
}

impl From<anyhow::Error> for CommandError {
    fn from(error: anyhow::Error) -> Self {
        Self { inner: error }
    }
}

impl From<std::io::Error> for CommandError {
    fn from(value: std::io::Error) -> Self {
        Self {
            inner: value.into(),
        }
    }
}

impl From<tauri::Error> for CommandError {
    fn from(value: tauri::Error) -> Self {
        Self {
            inner: value.into(),
        }
    }
}

impl From<ParseIntError> for CommandError {
    fn from(value: ParseIntError) -> Self {
        Self {
            inner: value.into(),
        }
    }
}

pub type Result<T> = std::result::Result<T, CommandError>;
