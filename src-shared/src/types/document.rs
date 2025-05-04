use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Type, Clone, Debug)]
#[serde(tag = "type", content = "year")]
/// 试卷的日期信息
pub enum DocumentDate {
    /// xxxx年，指试卷在这一年被使用
    Year(u16),
    /// xxxx级，指试卷在这一级的学生使用
    Grade(u16),
}

#[derive(Serialize, Deserialize, Type, Clone, Debug)]
/// 试卷类型信息
pub enum DocumentType {
    /// 期末考试
    FinalExam,
    /// 期中考试
    MidExam,
    /// 其他（机考）
    Other,
}

#[derive(Serialize, Deserialize, Type, Clone, Debug)]
/// 试卷信息
pub struct DocumentInfo {
    /// 试卷名称
    pub name: String,
    /// 课程代码
    pub identifier: Option<String>,
    /// 试卷的日期信息
    pub date: Option<DocumentDate>,
    #[serde(rename = "type")]
    /// 试卷类型
    pub typ: DocumentType,
    /// 是否含有答案
    pub answer: bool,
    /// 试卷页数
    pub page: u16,
    /// 筛选标签
    pub filter: Vec<String>,
    /// 标志标签
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Type, Clone, Debug)]
/// 试卷实体
pub struct Document {
    /// 试卷编号
    pub id: usize,
    /// 试卷文件的 md5 值
    pub md5: String,
    /// 试卷的信息
    pub info: DocumentInfo,
}

#[derive(Serialize, Deserialize, Type, Clone, Debug)]
/// 选中的试卷，附加取回的信息
pub struct SelectedDocument {
    // 是否彩印，这个仅供前端使用，后端不考虑彩印的特殊处理
    pub color: bool,
    // 份数
    pub count: usize,
    // 待取回试卷信息
    pub doc: Document,
}

/// 兼容旧格式
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OldDocumentDate {
    pub year: u16,
    pub year_type: u8,
}
impl From<OldDocumentDate> for DocumentDate {
    fn from(value: OldDocumentDate) -> Self {
        match value.year_type {
            0 => DocumentDate::Year(value.year),
            1 => DocumentDate::Grade(value.year),
            typ => panic!(
                "Failed to convert {:#?} to DocumentDate. Unrecognized year type {}!",
                value, typ
            ),
        }
    }
}
impl From<DocumentDate> for OldDocumentDate {
    fn from(value: DocumentDate) -> Self {
        match value {
            DocumentDate::Grade(year) => Self { year, year_type: 1 },
            DocumentDate::Year(year) => Self { year, year_type: 0 },
        }
    }
}
#[derive(Deserialize, Serialize, Debug)]
pub struct OldDocumentInfo {
    pub name: String,
    pub identifier: Option<String>,
    pub date: Option<OldDocumentDate>,
    #[serde(rename = "type")]
    pub typ: u8,
    pub answer: bool,
    pub page: u16,
    pub filter: Vec<String>,
    pub tags: Vec<String>,
}
impl From<OldDocumentInfo> for DocumentInfo {
    fn from(value: OldDocumentInfo) -> Self {
        let typ = match value.typ {
            0 => DocumentType::FinalExam,
            1 => DocumentType::MidExam,
            2 => DocumentType::Other,
            typ => panic!(
                "Failed to convert {:#?} to DocumentInfo. Unrecognized year type {}!",
                value, typ
            ),
        };
        Self {
            name: value.name,
            identifier: value.identifier,
            date: value.date.map(|v| v.into()),
            typ,
            answer: value.answer,
            page: value.page,
            filter: value.filter,
            tags: value.tags,
        }
    }
}
impl From<DocumentInfo> for OldDocumentInfo {
    fn from(value: DocumentInfo) -> Self {
        let typ = match value.typ {
            DocumentType::FinalExam => 0,
            DocumentType::MidExam => 1,
            DocumentType::Other => 2,
        };
        Self {
            name: value.name,
            identifier: value.identifier,
            date: value.date.map(|v| v.into()),
            typ,
            answer: value.answer,
            page: value.page,
            filter: value.filter,
            tags: value.tags,
        }
    }
}
#[derive(Serialize, Deserialize)]
pub struct OldDocument {
    pub id: usize,
    pub md5: String,
    pub info: OldDocumentInfo,
}
impl From<OldDocument> for Document {
    fn from(value: OldDocument) -> Self {
        Self {
            id: value.id,
            md5: value.md5,
            info: value.info.into(),
        }
    }
}
impl From<Document> for OldDocument {
    fn from(value: Document) -> Self {
        Self {
            id: value.id,
            md5: value.md5,
            info: value.info.into(),
        }
    }
}

#[derive(Serialize, Deserialize, Type, Clone, Debug)]
pub struct DocumentParseInfo {
    pub md5: String,
    pub path: String,
    pub page: usize,
    pub name: String,
}
