use crate::config::CONFIG;
use crate::entity::db::tb_document;
use sea_orm::{ConnectOptions, Database, DatabaseConnection, EntityTrait};
use src_shared::types::document::Document;
use std::collections::HashMap;
use tokio::sync::{OnceCell, RwLock};
use tracing::log;
use tracing::log::info;

#[inline]
pub async fn db() -> &'static DatabaseConnection {
    pub static DB: OnceCell<DatabaseConnection> = OnceCell::const_new();
    DB.get_or_init(|| async {
        let mut opt = ConnectOptions::new(&CONFIG.database.url);
        opt.sqlx_logging(true) // Disable SQLx log
            .sqlx_logging_level(log::LevelFilter::Trace); // Or set SQLx log level
        Database::connect(opt)
            .await
            .expect("Failed to connect the database!")
    })
    .await
}

#[inline]
pub async fn inner_db() -> &'static RwLock<HashMap<String, Document>> {
    pub static INNER_DB: OnceCell<RwLock<HashMap<String, Document>>> = OnceCell::const_new();
    INNER_DB
        .get_or_init(|| async {
            info!("Loading the database into memory...");
            let list = tb_document::Entity::find()
                .all(db().await)
                .await
                .expect("Failed to load the database's data!");
            let mut map = HashMap::new();
            for item in list {
                map.insert(item.md5.clone(), Document::from(item.clone()));
            }
            RwLock::new(map)
        })
        .await
}
