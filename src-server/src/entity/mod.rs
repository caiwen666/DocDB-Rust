use crate::entity::db::tb_document;
use crate::entity::db::tb_document::Model;
use src_shared::types::document::{Document, DocumentDate, DocumentInfo, DocumentType};

pub mod db;

impl From<tb_document::Model> for Document {
    fn from(value: Model) -> Self {
        Self {
            id: value.id as usize,
            md5: value.md5,
            info: DocumentInfo {
                name: value.name,
                identifier: value.identifier,
                date: match value.year_type {
                    Some(year_type) => match year_type.as_str() {
                        "Grade" => Some(DocumentDate::Grade(
                            value.year.expect("Year shouldn't be empty!") as u16,
                        )),
                        "Year" => Some(DocumentDate::Year(
                            value.year.expect("Year shouldn't be empty!") as u16,
                        )),
                        _ => None,
                    },
                    _ => None,
                },
                typ: match value.r#type.as_str() {
                    "FinalExam" => DocumentType::FinalExam,
                    "MidExam" => DocumentType::MidExam,
                    _ => DocumentType::Other,
                },
                answer: match value.answer {
                    0 => false,
                    _ => true,
                },
                page: value.page as u16,
                filter: serde_json::from_str::<Vec<String>>(value.filter.as_str())
                    .expect("Failed to parse the filter"),
                tags: serde_json::from_str::<Vec<String>>(value.tags.as_str())
                    .expect("Failed to parse the tags"),
            },
        }
    }
}

impl From<Document> for tb_document::Model {
    fn from(value: Document) -> Self {
        Self {
            id: value.id as i32,
            md5: value.md5,
            name: value.info.name,
            identifier: value.info.identifier,
            page: value.info.page as i32,
            answer: if value.info.answer { 1 } else { 0 },
            r#type: match value.info.typ {
                DocumentType::FinalExam => "FinalExam".to_string(),
                DocumentType::MidExam => "MidExam".to_string(),
                _ => "Other".to_string(),
            },
            year: match value.info.date {
                Some(DocumentDate::Grade(year)) => Some(year as i32),
                Some(DocumentDate::Year(year)) => Some(year as i32),
                _ => None,
            },
            year_type: match value.info.date {
                Some(DocumentDate::Grade(_)) => Some("Grade".to_string()),
                Some(DocumentDate::Year(_)) => Some("Year".to_string()),
                _ => None,
            },
            filter: serde_json::to_string(&value.info.filter).expect("Failed to parse the filter"),
            tags: serde_json::to_string(&value.info.tags).expect("Failed to parse the tags"),
        }
    }
}
