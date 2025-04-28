use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};
use specta::datatype::reference::Reference;
use specta::datatype::StructType;
use specta::{DataType, Generics, Type, TypeCollection};
use std::borrow::Cow;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter};

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

impl From<dyn std::error::Error> for CommandError {
    fn from(value: Box<dyn Error>) -> Self {
        Self {
            inner: value.into(),
        }
    }
}

pub type Result<T> = std::result::Result<T, CommandError>;
