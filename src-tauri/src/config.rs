use crate::database;
use crate::database::update_database;
use serde::{Deserialize, Serialize};
use src_shared::types::document::Document;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{LazyLock, RwLock};
use std::{env, fs};

/// 数据库
pub struct Database {
    /// md5-Document
    pub data: HashMap<String, Document>,
    /// id-Document
    pub index: HashMap<usize, Document>,
    /// 课程名称-试卷集合
    pub name_index: HashMap<String, Vec<Document>>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
/// 配置文件
pub struct Config {
    pub remote: String,
    pub token: String,
    pub watermark: bool,
    pub dev_tools: bool,
    pub update_cycle: u32,
    pub pdf_tools: String,
}

pub static DATABASE: LazyLock<RwLock<Database>> = LazyLock::new(|| {
    let mut path = CWD.clone();
    path.push("data");
    path.push("data.json");
    let data =
        fs::read_to_string(path).expect("Initialize the database failed. Cannot read data.json.");
    let data = serde_json::from_str(data.as_str()).unwrap();
    let mut database = Database {
        data,
        index: HashMap::new(),
        name_index: HashMap::new(),
    };
    database::build_index(&mut database);
    RwLock::new(database)
});

pub static CWD: LazyLock<PathBuf> = LazyLock::new(|| {
    #[cfg(debug_assertions)]
    let cwd = PathBuf::from(env::current_dir().unwrap());

    #[cfg(not(debug_assertions))]
    let cwd = PathBuf::from(env::current_dir().unwrap());

    // 检查目录结构，没有就创建
    let mut now = cwd.clone();
    now.push("data");
    if !now.exists() || !now.is_dir() {
        fs::create_dir(now.clone()).expect("Failed to create 'data'");
    }
    let mut target = now.clone();
    target.push("files");
    if !target.exists() || !target.is_dir() {
        fs::create_dir(target).expect("Failed to create 'data/files'");
    }
    let mut target = now.clone();
    target.push("tmp");
    if !target.exists() || !target.is_dir() {
        fs::create_dir(target).expect("Failed to create 'data/tmp'");
    }
    let mut target = now.clone();
    target.push("data.json");
    if !target.exists() || !target.is_file() {
        fs::write(target, "{}").expect("Failed to create 'data/data.json'")
    }

    cwd
});

pub static CONFIG: LazyLock<RwLock<Config>> = LazyLock::new(|| {
    let mut path = CWD.clone();
    path.push("config.json");
    let data = fs::read_to_string(path).expect("Cannot read config.json.");
    let config: Config = serde_json::from_str(data.as_str()).expect("Cannot parse config.json");
    RwLock::new(config)
});

pub fn check_database_update() {
    loop {
        let res = update_database();
        if res.is_err() {
            eprintln!("{:?}", res);
        }
        std::thread::sleep(std::time::Duration::from_secs(
            CONFIG.read().unwrap().update_cycle as u64,
        ));
    }
}
