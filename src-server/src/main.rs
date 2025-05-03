use salvo::prelude::TcpListener;
use salvo::{Listener, Server};
use src_server::config::CONFIG;
use src_server::db::inner_db;
use src_server::routers::get_router;
use tracing::info;

#[tokio::main]
async fn main() {
    let _guard = clia_tracing_config::build()
        .filter_level(&CONFIG.log.filter_level)
        .with_ansi(CONFIG.log.with_ansi)
        .to_stdout(CONFIG.log.to_stdout)
        .with_source_location(false)
        .with_target(false)
        .with_thread_names(false)
        .with_thread_ids(false)
        .directory(&CONFIG.log.directory)
        .file_name(&CONFIG.log.file_prefix)
        .rolling(&CONFIG.log.rolling)
        .init();
    let _unused = inner_db().await;
    let acceptor = TcpListener::new(format!("{}:{}", CONFIG.server.host, CONFIG.server.port))
        .bind()
        .await;
    info!(
        "Started server on {}:{}",
        CONFIG.server.host, CONFIG.server.port
    );
    let router = get_router();
    Server::new(acceptor).serve(router).await;
}
