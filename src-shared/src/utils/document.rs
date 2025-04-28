use crate::types::document::{Document, DocumentDate, DocumentType};

pub fn format_document_name_shorter(doc: &Document) -> String {
    let mut res = String::new();
    match doc.info.date {
        None => res.push_str("未知年份"),
        Some(DocumentDate::Year(year)) => res.push_str(format!("{}年", year).as_str()),
        Some(DocumentDate::Grade(grade)) => res.push_str(format!("{}级", grade).as_str()),
    }
    res.push_str(doc.info.name.as_str());
    match doc.info.typ {
        DocumentType::MidExam => res.push_str("期中"),
        DocumentType::FinalExam => res.push_str("期末"),
        _ => (),
    }
    for tag in doc.info.filter.iter().chain(doc.info.tags.iter()) {
        res.push_str(format!("-{}", tag).as_str())
    }
    res
}
