import io from "socket.io-client";
import { SIGNALING_URL } from "../constants";



export function createSignalClient(opts: SocketIOClient.ConnectOpts) {
  return io(SIGNALING_URL, {
    transports: ["websocket"],
    ...opts
  });
}

export function createRTCPeerConnection() {
  return new RTCPeerConnection({
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }]
  });
}