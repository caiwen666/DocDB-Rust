use crate::result::AppResult;

pub async fn async_func<F>(f: F) -> AppResult
where
    F: Future<Output = AppResult>,
{
    f.await
}
