import debugLog from "./debugLog";

export const sectionLines = (sdp = "") =>
  sdp
    .split(/\r?\n/)
    .filter((line) => /^(m=|a=(mid|group|sctp))/.test(line))
    .join(" | ");

const gathered = (connection: RTCPeerConnection) =>
  new Promise<RTCSessionDescriptionInit>((resolve) => {
    const done = () => resolve(connection.localDescription!.toJSON());
    if (connection.iceGatheringState === "complete") return done();
    connection.onicecandidate = (event) => event.candidate === null && done();
  });

//Connects two local peers over a data channel, isolating browser support from signaling and the remote peer.
export default async function webRtcSelfTest() {
  const a = new RTCPeerConnection({ iceServers: [] });
  const b = new RTCPeerConnection({ iceServers: [] });
  try {
    const channel = a.createDataChannel("self-test", { maxRetransmits: 1, ordered: false });
    const opened = new Promise<void>((resolve) => (channel.onopen = () => resolve()));
    await a.setLocalDescription(await a.createOffer());
    const offer = await gathered(a);
    debugLog("self-test offer:", sectionLines(offer.sdp));
    await b.setRemoteDescription(offer);
    await b.setLocalDescription(await b.createAnswer());
    await a.setRemoteDescription(await gathered(b));
    const result = await Promise.race([
      opened.then(() => "data channel open"),
      new Promise<string>((resolve) => setTimeout(() => resolve("timed out"), 5000)),
    ]);
    debugLog("self-test:", result);
  } catch (error) {
    debugLog("self-test failed", error);
  } finally {
    a.close();
    b.close();
  }
}
