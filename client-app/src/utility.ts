export const typedEntries = Object.entries as <T, TKey extends keyof T>(
  o: T,
) => [Extract<TKey, string>, T[TKey]][];

export function extractObjectDiff<T>(
  source: T,
  update: T,
  ...omitTypes: string[]
): Partial<T> {
  return typedEntries(update ?? {})
    .filter((entry) => !omitTypes.includes(typeof entry[1]))
    .reduce((acc, [key, value]) => {
      if (source?.[key] !== value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<T>);
}

export function inlineThrow(err: string | Error): never {
  throw typeof err === "string" ? new Error(err) : err;
}

//https://gist.github.com/LeverOne/1308368
export function uuidV4() {
  let result = "";
  for (
    let step = 0;
    step++ < 36;
    result +=
      (step * 51) & 52
        ? (step ^ 15 ? 8 ^ (Math.random() * (step ^ 20 ? 16 : 4)) : 4).toString(
            16,
          )
        : "-"
  );
  return result;
}

export function match<TMatch extends keyof any, TResult>(
  value: TMatch,
  output: Record<TMatch, TResult>,
) {
  return output[value];
}

export function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

//Chromium < 72 lacks connectionState, which is where modern offers stop working unmodified.
const isLegacyWebRtc =
  typeof RTCPeerConnection !== "undefined" &&
  !("connectionState" in RTCPeerConnection.prototype);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//Old Chromium (e.g. Tizen 4's 56) rejects modern data channel offers: it chokes on
//a=extmap-allow-mixed, needs the pre-2017 SCTP syntax and only accepts a data section with mid "data".
//Answers mirror the offer, so the original mid is restored before the answer goes back.
export function adaptOfferForLegacyWebRtc(offer: RTCSessionDescriptionInit) {
  const mid = offer.sdp && /^a=mid:(\S+)/m.exec(offer.sdp)?.[1];
  if (!isLegacyWebRtc || !offer.sdp || !mid) {
    return { offer, restoreAnswer: (answer: RTCSessionDescriptionInit) => answer };
  }
  const renameMid = (sdp: string, from: string, to: string) =>
    sdp
      .replace(new RegExp(`^a=group:BUNDLE ${escapeRegExp(from)}(?=\\r?$)`, "m"), `a=group:BUNDLE ${to}`)
      .replace(new RegExp(`^a=mid:${escapeRegExp(from)}(?=\\r?$)`, "m"), `a=mid:${to}`);
  const sctpPort = /^a=sctp-port:(\d+)/m.exec(offer.sdp)?.[1] ?? "5000";
  const sdp = renameMid(offer.sdp, mid, "data")
    .replace(/^a=extmap-allow-mixed\r?\n/gm, "")
    .replace(/^(m=application \d+) UDP\/DTLS\/SCTP webrtc-datachannel/m, `$1 DTLS/SCTP ${sctpPort}`)
    .replace(/^a=sctp-port:\d+/m, `a=sctpmap:${sctpPort} webrtc-datachannel 1024`);
  return {
    offer: { type: offer.type, sdp },
    restoreAnswer: (answer: RTCSessionDescriptionInit): RTCSessionDescriptionInit => ({
      type: answer.type,
      sdp: answer.sdp && renameMid(answer.sdp, "data", mid),
    }),
  };
}
