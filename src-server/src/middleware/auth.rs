use crate::config::CONFIG;
use crate::result::{AppError, AppResult, Success};
use crate::utils::async_func;
use salvo::{Depot, FlowCtrl, Request, Response, handler};

#[handler]
pub async fn auth_middleware(
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
    ctrl: &mut FlowCtrl,
) {
    let app_result = async_func(async {
        if let Some(token) = req.header::<String>("Authorization") {
            if token == CONFIG.service.token {
                Ok(Success::from(()))
            } else {
                Err(AppError::Unauthorized)
            }
        } else {
            Err(AppError::Unauthorized)
        }
    })
    .await;
    match app_result {
        Ok(_) => {
            ctrl.call_next(req, depot, res).await;
        }
        Err(err) => {
            res.render(err);
            ctrl.skip_rest()
        }
    }
}
