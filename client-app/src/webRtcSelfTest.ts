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

type Variant = {
  name: string;
  config?: RTCConfiguration;
  //Non-standard second constructor argument of old Chrome.
  constraints?: object;
  dataChannel: boolean;
};

//Connects two local peers, isolating browser support from signaling and the remote peer.
async function runVariant({ name, config = {}, constraints, dataChannel }: Variant) {
  const Connection = RTCPeerConnection as unknown as new (
    config: RTCConfiguration,
    constraints?: object,
  ) => RTCPeerConnection;
  const a = new Connection({ iceServers: [], ...config }, constraints);
  const b = new Connection({ iceServers: [], ...config }, constraints);
  try {
    const channel = dataChannel
      ? a.createDataChannel("self-test", { maxRetransmits: 1, ordered: false })
      : null;
    const opened = channel
      ? new Promise<string>((resolve) => (channel.onopen = () => resolve("data channel open")))
      : new Promise<string>((resolve) => {
          a.oniceconnectionstatechange = () =>
            a.iceConnectionState === "connected" && resolve("ice connected");
        });
    const offer = await a.createOffer(dataChannel ? {} : { offerToReceiveAudio: true });
    debugLog(`self-test ${name} offer:`, sectionLines(offer.sdp));
    await a.setLocalDescription(offer);
    await b.setRemoteDescription(await gathered(a));
    await b.setLocalDescription(await b.createAnswer());
    await a.setRemoteDescription(await gathered(b));
    const result = await Promise.race([
      opened,
      new Promise<string>((resolve) => setTimeout(() => resolve("timed out"), 5000)),
    ]);
    debugLog(`self-test ${name}:`, result);
  } catch (error) {
    debugLog(`self-test ${name} failed`, error);
  } finally {
    a.close();
    b.close();
  }
}

export default async function webRtcSelfTest() {
  await runVariant({ name: "data", dataChannel: true });
  await runVariant({ name: "audio", dataChannel: false });
  try {
    const certificate = await RTCPeerConnection.generateCertificate({
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    } as AlgorithmIdentifier);
    await runVariant({ name: "rsa data", config: { certificates: [certificate] }, dataChannel: true });
  } catch (error) {
    debugLog("self-test rsa certificate failed", error);
  }
  await runVariant({
    name: "rtp data",
    constraints: { optional: [{ RtpDataChannels: true }] },
    dataChannel: true,
  });
}
