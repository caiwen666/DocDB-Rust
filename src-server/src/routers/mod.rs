mod document;
mod file;

use crate::middleware;
use salvo::Router;

pub fn get_router() -> Router {
    let document_router = Router::with_path("document")
        .push(Router::with_path("index").get(document::index))
        .push(
            Router::new()
                .hoop(middleware::auth_middleware)
                .push(Router::with_path("add").post(document::add))
                .push(Router::with_path("delete").get(document::delete))
                .push(Router::with_path("update").post(document::update)),
        );
    let file_router = Router::with_path("file")
        .hoop(middleware::auth_middleware)
        .push(Router::with_path("upload").post(file::upload))
        .push(Router::with_path("download").get(file::download))
        .push(Router::with_path("exists").get(file::exists));
    let router = Router::new().push(document_router).push(file_router);
    router
}
