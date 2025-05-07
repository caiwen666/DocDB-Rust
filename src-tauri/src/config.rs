use crate::database;
use crate::database::update_database;
use serde::{Deserialize, Serialize};
use src_shared::types::document::Document;
use std::env;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::{borrow::Cow, collections::HashMap};
use tokio::sync::{OnceCell, RwLock};

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

pub async fn db() -> &'static RwLock<Database> {
    pub static DB: OnceCell<RwLock<Database>> = OnceCell::const_new();
    DB.get_or_init(|| async {
        let data = tokio::fs::read_to_string(Cwd::from_data().push("data.json").path())
            .await
            .expect("Failed to read data.json.");
        let data: HashMap<String, Document> =
            serde_json::from_str(data.as_str()).expect("Failed to parse data.json.");
        let mut database = Database {
            data,
            index: HashMap::new(),
            name_index: HashMap::new(),
        };
        database::build_index(&mut database);
        RwLock::new(database)
    })
    .await
}

pub async fn check_database_update() {
    loop {
        let res = update_database().await;
        if res.is_err() {
            eprintln!("{:?}", res);
        }
        // 这里需要把更新周期单独拿出来
        // 写在 sleep 函数中，会等待 sleep 结束后才会释放锁
        let cycle = config().await.read().await.update_cycle;
        tokio::time::sleep(tokio::time::Duration::from_secs(cycle as u64)).await;
    }
}

pub async fn config() -> &'static RwLock<Config> {
    pub static CONFIG: OnceCell<RwLock<Config>> = OnceCell::const_new();
    CONFIG
        .get_or_init(|| async {
            let data = tokio::fs::read_to_string(Cwd::from_root().push("config.json").path())
                .await
                .expect("Cannot read config.json.");
            let config: Config =
                serde_json::from_str(data.as_str()).expect("Cannot parse config.json");
            RwLock::new(config)
        })
        .await
}

pub async fn save_config() {
    let data = config().await.read().await;
    let data = serde_json::to_string_pretty(&(*data)).unwrap();
    tokio::fs::write(Cwd::from_root().push("config.json").path(), data)
        .await
        .expect("Failed to save config.json.");
}

pub static CWD: LazyLock<PathBuf> = LazyLock::new(|| {
    let cwd = PathBuf::from(env::current_dir().unwrap());
    // 检查目录结构，没有就创建
    let mut now = cwd.clone();
    now.push("data");
    if !now.exists() || !now.is_dir() {
        std::fs::create_dir(now.clone()).expect("Failed to create 'data'");
    }
    let mut target = now.clone();
    target.push("files");
    if !target.exists() || !target.is_dir() {
        std::fs::create_dir(target).expect("Failed to create 'data/files'");
    }
    let mut target = now.clone();
    target.push("tmp");
    if !target.exists() || !target.is_dir() {
        std::fs::create_dir(target).expect("Failed to create 'data/tmp'");
    }
    let mut target = now.clone();
    target.push("data.json");
    if !target.exists() || !target.is_file() {
        std::fs::write(target, "{}").expect("Failed to create 'data/data.json'")
    }
    cwd
});

pub struct Cwd {
    path: PathBuf,
}
impl Cwd {
    pub fn from_root() -> Self {
        Self { path: CWD.clone() }
    }
    pub fn from_data() -> Self {
        let mut path = CWD.clone();
        path.push("data");
        Self { path }
    }
    pub fn from_file() -> Self {
        let mut path = CWD.clone();
        path.push("data");
        path.push("files");
        Self { path }
    }
    pub fn from_tmp() -> Self {
        let mut path = CWD.clone();
        path.push("data");
        path.push("tmp");
        Self { path }
    }
    pub fn push<'a>(mut self, path: impl Into<Cow<'a, str>>) -> Self {
        let s: Cow<str> = path.into();
        self.path.push(s.as_ref());
        self
    }
    pub fn path(self) -> PathBuf {
        self.path
    }
}
