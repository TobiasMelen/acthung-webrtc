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

//Chromium < 72 lacks connectionState, and every such version expects the old SCTP syntax.
const isLegacyWebRtc =
  typeof RTCPeerConnection !== "undefined" &&
  !("connectionState" in RTCPeerConnection.prototype);

export function toLegacyCompatibleDescription(
  description: RTCSessionDescriptionInit,
): RTCSessionDescriptionInit {
  //Chromium < 71 rejects the whole description on this line, which only matters for media streams.
  let sdp = description.sdp?.replace(/^a=extmap-allow-mixed\r?\n/gm, "");
  if (isLegacyWebRtc && sdp) {
    //Early 2017 Chromium (e.g. 56) can't parse the spec SCTP syntax, answers mirror the offer's syntax.
    const sctpPort = /^a=sctp-port:(\d+)/m.exec(sdp)?.[1] ?? "5000";
    sdp = sdp
      .replace(
        /^(m=application \d+) UDP\/DTLS\/SCTP webrtc-datachannel/m,
        `$1 DTLS/SCTP ${sctpPort}`,
      )
      .replace(
        /^a=sctp-port:\d+/m,
        `a=sctpmap:${sctpPort} webrtc-datachannel 1024`,
      );
  }
  return { type: description.type, sdp };
}
