use serde::Deserialize;
use std::fs;
use std::sync::LazyLock;

const CONFIG_PATH: &str = "src-server/config.toml";
pub const UPLOADED_FILE_PATH: &str = "src-server/data/files";

#[derive(Deserialize)]
pub struct Config {
    pub server: Server,
    pub log: Log,
    pub database: Database,
    pub service: Service,
}

#[derive(Deserialize)]
pub struct Server {
    pub host: String,
    pub port: u16,
}

#[derive(Deserialize, Debug)]
pub struct Log {
    pub filter_level: String,
    pub with_ansi: bool,
    pub to_stdout: bool,
    pub directory: String,
    pub file_prefix: String,
    pub rolling: String,
}

#[derive(Deserialize)]
pub struct Database {
    pub url: String,
}

#[derive(Deserialize)]
pub struct Service {
    pub token: String,
}

pub static CONFIG: LazyLock<Config> = LazyLock::new(|| {
    let config_content = fs::read_to_string(CONFIG_PATH).expect("Failed to load the config!");
    let config: Config =
        toml::from_str(config_content.as_str()).expect("Failed to parse the config!");
    config
});
