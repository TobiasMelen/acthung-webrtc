use std::env;

use warp::Filter;

#[tokio::main]
async fn main() {
    // GET /hello/warp => 200 OK with body "Hello, warp!"
    let hello = warp::path!("hello" / String).map(|name| format!("Hello, {}!", name));

    let port = env::args()
        .skip_while(|s| s != "-p" && s != "--port")
        .nth(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(3030);
    warp::serve(hello).run(([127, 0, 0, 1], port)).await;
}
