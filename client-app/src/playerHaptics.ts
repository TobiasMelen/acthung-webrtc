// iOS haptic feedback via hidden checkbox[switch] workaround
// Based on https://github.com/tijnjh/ios-haptics
//
// On each user gesture we schedule flush checkpoints at regular intervals.
// When a haptic is queued, the nearest checkpoint fires it — typically
// within ~100ms since the player is constantly pressing turn buttons.

let labelEl: HTMLLabelElement | null = null;
let pendingTaps = 0;
let scheduledTimeouts: number[] = [];

const CHECKPOINT_INTERVAL = 120;
const CHECKPOINT_DURATION = 10000;

function ensureCheckbox() {
  if (labelEl) return labelEl;
  labelEl = document.createElement("label");
  labelEl.ariaHidden = "true";
  labelEl.style.display = "none";
  const inputEl = document.createElement("input");
  inputEl.type = "checkbox";
  inputEl.setAttribute("switch", "");
  labelEl.appendChild(inputEl);
  document.body.appendChild(labelEl);
  return labelEl;
}

function tap() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(50);
      return;
    }
    ensureCheckbox().click();
  } catch {
    // ignore
  }
}

function flushHaptics() {
  if (pendingTaps <= 0) return;
  pendingTaps--;
  tap();
}

// On each user gesture, replace scheduled checkpoints with fresh ones
function scheduleCheckpoints() {
  for (const id of scheduledTimeouts) clearTimeout(id);
  scheduledTimeouts = [];
  for (
    let t = CHECKPOINT_INTERVAL;
    t <= CHECKPOINT_DURATION;
    t += CHECKPOINT_INTERVAL
  ) {
    scheduledTimeouts.push(window.setTimeout(flushHaptics, t));
  }
  // Also flush immediately in case haptics are already pending
  flushHaptics();
}

document.addEventListener("touchend", scheduleCheckpoints, true);

export function hapticSingle() {
  pendingTaps += 1;
}

export function hapticDouble() {
  pendingTaps += 2;
}

export function hapticTriple() {
  pendingTaps += 3;
}
