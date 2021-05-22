declare interface WebSocket {
  accept(): void;
}

declare class WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

declare interface ResponseInit {
  webSocket?: WebSocket;
}
