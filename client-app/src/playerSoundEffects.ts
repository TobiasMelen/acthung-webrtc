import slapUrl from "../assets/slap.mp3";
import bopUrl from "../assets/bop.mp3";
import kachingUrl from "../assets/kaching.mp3";

type SoundEffect = { buffer: AudioBuffer; startOffset: number };

// Pre-fetch raw audio data at module load (no AudioContext needed yet)
const rawBuffers = {
  slap: fetch(slapUrl).then((res) => res.arrayBuffer()),
  bop: fetch(bopUrl).then((res) => res.arrayBuffer()),
  kaching: fetch(kachingUrl).then((res) => res.arrayBuffer()),
};

let audioCtx: AudioContext;
let sounds: Record<string, Promise<SoundEffect>>;

function trimLeadingSilence(decoded: AudioBuffer): SoundEffect {
  const data = decoded.getChannelData(0);
  const threshold = 0.05;
  let startOffset = 0;
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > threshold) {
      startOffset = i / decoded.sampleRate;
      break;
    }
  }
  return { buffer: decoded, startOffset };
}

// Create AudioContext and decode sounds — must be called from user gesture
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext ||
    //@ts-ignore
    window.webkitAudioContext)();
  // Override silent mode on iOS Safari 17+
  if ("audioSession" in navigator) {
    (navigator as any).audioSession.type = "playback";
  }
  audioCtx.resume();
  sounds = {
    slap: rawBuffers.slap
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then(trimLeadingSilence),
    bop: rawBuffers.bop
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then(trimLeadingSilence),
    kaching: rawBuffers.kaching
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then(trimLeadingSilence),
  };
}

const unlock = () => {
  initAudio();
  document.removeEventListener("touchstart", unlock);
  document.removeEventListener("click", unlock);
};
document.addEventListener("touchstart", unlock);
document.addEventListener("click", unlock);

function playSound(name: keyof typeof rawBuffers, volume = 0.3) {
  if (!audioCtx || !sounds) return;
  audioCtx
    .resume()
    .then(() => sounds[name])
    .then(({ buffer, startOffset }) => {
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      const gain = audioCtx.createGain();
      gain.gain.value = volume;
      source.connect(gain).connect(audioCtx.destination);
      source.start(0, startOffset);
    });
}

export function playDeath() {
  playSound("slap", 0.3);
}

export function playBop() {
  playSound("bop", 0.5);
}

export function playKaching() {
  playSound("kaching", 0.5);
}
