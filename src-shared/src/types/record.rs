use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use crate::types::document::{DocumentInfo, OldDocumentInfo};

mod datetime_format {
    use chrono::{DateTime, Local, TimeZone};
    use serde::{Serializer, Deserializer, Deserialize};

    const FORMAT: &str = "%Y-%m-%d %H:%M:%S"; // 年-月-日 时:分:秒

    // 序列化函数
    pub fn serialize<S>(date: &DateTime<Local>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let formatted = date.format(FORMAT).to_string();
        serializer.serialize_str(&formatted)
    }

    // 反序列化函数
    pub fn deserialize<'de, D>(deserializer: D) -> Result<DateTime<Local>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Local
            .datetime_from_str(&s, FORMAT)
            .map_err(serde::de::Error::custom)
            .map(|dt| dt.with_timezone(&Local))
    }
}

#[derive(Serialize, Deserialize, Type, Clone)]
/// 操作记录的信息
pub struct RecordInfo {
    /// 操作 id
    pub id: usize,
    #[serde(with = "datetime_format")]
    #[specta(type = String)]
    /// 操作时间
    pub time: DateTime<Local>,
    /// 目标试卷 id
    #[serde(rename = "documentID")]
    pub document_id: usize,
    /// 操作文件的 md5
    pub md5: String
}

#[derive(Serialize, Deserialize, Type, Clone)]
#[serde(tag = "type")]
/// 操作记录实体
pub enum Record {
    /// 添加操作
    AddRecord {
        /// 操作记录信息
        info: RecordInfo,
        /// 添加的试卷信息
        target: DocumentInfo
    },
    /// 修改操作
    ModifyRecord {
        /// 操作记录信息
        info: RecordInfo,
        /// 新的试卷信息
        target: DocumentInfo
    },
    /// 删除操作
    DeleteRecord {
        /// 操作记录信息
        info: RecordInfo,
    }
}
#[derive(Serialize, Deserialize, Debug)]
pub struct OldRecord {
    pub id: usize,
    pub time: String,
    #[serde(rename = "documentID")]
    pub document_id: usize,
    pub file: String,
    pub operation: String,
    pub info: Option<OldDocumentInfo>,
}
impl From<OldRecord> for Record {
    fn from(value: OldRecord) -> Self {
        let record_debug = format!("{:#?}", value);
        let record_info = RecordInfo {
            id: value.id,
            time: Local.from_local_datetime(
                &NaiveDateTime::parse_from_str(
                    value.time.as_str(),
                    "%Y-%m-%d %H:%M:%S"
                ).expect(format!(
                    "Failed to convert {} to Record. Cannot parse time {}",
                    record_debug,
                    value.time
                ).as_str())
            ).unwrap(),
            document_id: value.document_id,
            md5: value.file,
        };
        match value.operation.as_str() {
            "create" => {
                Self::AddRecord {
                    info: record_info,
                    target: value.info.expect(format!(
                        "Failed to convert {} to Record. Expected document info.",
                        record_debug
                    ).as_str()).into(),
                }
            }
            "modify" => {
                Self::ModifyRecord {
                    info: record_info,
                    target: value.info.expect(format!(
                        "Failed to convert {} to Record. Expected document info.",
                        record_debug
                    ).as_str()).into(),
                }
            }
            "delete" => {
                Self::DeleteRecord {
                    info: record_info,
                }
            }
            typ => panic!("Failed to convert {} to Record. Unrecognized operation type {}.", record_debug, typ)
        }
    }
}
impl From<Record> for OldRecord {
    fn from(value: Record) -> Self {
        match value {
            Record::AddRecord {info, target}
            | Record::ModifyRecord {info, target}
            => Self {
                id: info.id,
                time: info.time.format("%Y-%m-%d %H:%M:%S").to_string(),
                document_id: info.document_id,
                file: info.md5,
                operation: "create".to_string(),
                info: Some(target.into()),
            },
            Record::DeleteRecord {info} => Self {
                id: info.id,
                time: info.time.format("%Y-%m-%d %H:%M:%S").to_string(),
                document_id: info.document_id,
                file: info.md5,
                operation: "create".to_string(),
                info: None,
            }
        }
    }
}