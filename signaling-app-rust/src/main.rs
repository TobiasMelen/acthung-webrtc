use std::env;

use warp::Filter;

#[tokio::main]
async fn main() {
    // GET /hello/warp => 200 OK with body "Hello, warp!"
    let hello = warp::path!("hello" / String).map(|name| format!("Hello, {}", name));

    let port = env::args()
        .skip_while(|s| s != "-p" && s != "--port")
        .nth(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(3030);
    println!("Starting server on port {0}", port);
    warp::serve(hello).run(([0, 0, 0, 0], port)).await;
}