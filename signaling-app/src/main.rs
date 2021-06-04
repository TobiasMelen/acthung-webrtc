use futures::{stream::SplitSink, SinkExt, StreamExt};
use serde_json::{from_str, to_string, Value};
use std::{collections::HashMap, env, sync::Arc};
use tokio::sync::RwLock;
use warp::{
    ws::{Message, WebSocket, Ws},
    Filter,
};

type Clients = Arc<RwLock<HashMap<String, SplitSink<WebSocket, Message>>>>;

#[tokio::main]
async fn main() {
    let clients: Clients = Arc::new(RwLock::new(HashMap::new()));
    // GET /hello/warp => 200 OK with body "Hello, warp!"
    let connect_to_socket = warp::path!(String)
        .and(warp::ws())
        .and(warp::any().map(move || clients.clone()))
        .map(|path: String, ws: Ws, clients: Clients| {
            ws.on_upgrade(|websocket| async move {
                let (sink, mut stream) = websocket.split();
                clients.write().await.insert(path.clone(), sink);
                while let Some(next) = stream.next().await {
                    let message = match next {
                        Ok(message) => message,
                        Err(error) => {
                            println!("Error on message: {}", error);
                            continue;
                        }
                    };
                    let mut json: Value = match message
                        .to_str()
                        .and_then(|string| from_str(string).map_err(|_| ()))
                        {
                            Ok(json) => json,
                            Err(_) => continue
                        };
                    let json_object = match json.as_object_mut(){
                        Some(value) => value,
                        None => continue
                    };
                    if let Some(receiver_id) = json_object.get("to") {
                        let to = receiver_id.as_str().unwrap_or("").to_string();
                        json_object.remove("to");
                        println!("allkeys {:?}", clients.write().await.keys());
                        println!("to {:?}", clients.write().await.get_mut(&to));
                        if let Some(sink) = clients.write().await.get_mut(&to) {
                            println!("Sending message to {}", to);
                            let message = Message::text(to_string(json_object).unwrap());
                            sink.send(message).await.unwrap();
                        };
                    };
                }
                println!("removing {}", path);
                clients.write().await.remove(&path);
            })
        });

    let port = env::args()
        .skip_while(|s| s != "-p" && s != "--port")
        .nth(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(3030);
    println!("Starting server on port {0}", port);
    warp::serve(connect_to_socket)
        .run(([0, 0, 0, 0], port))
        .await;
}
