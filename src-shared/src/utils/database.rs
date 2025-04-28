use std::collections::HashMap;
use crate::types::document::{Document, OldDocument};
use anyhow::{anyhow, Result};
use crate::types::record::{OldRecord, Record};

pub fn load_data(data: String) -> Result<HashMap<String, Document>> {
    Ok(
        serde_json::from_str::<HashMap<String, OldDocument>>(data.as_str())
            .map_err(|e| anyhow!("解析数据库失败，{:#?}", e))?
            .into_iter()
            .map(|(md5, target)| (md5, target.into()))
            .collect()
    )
}

pub fn dump_data(data: &HashMap<String, Document>) -> Result<String> {
    serde_json::to_string(
        &data.iter()
            .map(|(md5, target)| (md5, OldDocument::from(target.clone())))
            .collect::<HashMap<&String, OldDocument>>()
    ).map_err(|e| anyhow!("导出数据库失败，{:#?}", e))
}

pub fn load_record(data: String) -> Result<Vec<Record>> {
    Ok(
        serde_json::from_str::<Vec<OldRecord>>(data.as_str())
            .map_err(|e| anyhow!("解析操作记录失败，{:#?}", e))?
            .into_iter()
            .map(|v| v.into())
            .collect()
    )
}

pub fn dump_record(data: &Vec<Record>) -> Result<String> {
    serde_json::to_string(
        &data.iter()
            .map(|v| OldRecord::from(v.clone()))
            .collect::<Vec<OldRecord>>()
    ).map_err(|e| anyhow!("导出操作记录失败，{:#?}", e))
}