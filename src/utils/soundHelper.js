// Subtle synthesized sound effects using the Web Audio API (no external sound files required)
let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem("aero_sound_enabled");
  return saved !== null ? saved === "true" : true;
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("aero_sound_enabled", enabled ? "true" : "false");
  }
}

// Gentle watery bubble pop sound
export function playBubbleSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startTime = ctx.currentTime;
    const duration = 0.08;

    // Pitch sweep upward then drop slightly (bubble pop)
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, startTime);
    osc.frequency.exponentialRampToValueAtTime(840, startTime + 0.04);
    osc.frequency.exponentialRampToValueAtTime(700, startTime + duration);

    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (e) {
    // Audio context may be restricted by browser policy before first user gesture
  }
}

// Sparkly chime for pack pulls & achievements
export function playChimeSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + i * 0.07;
      const duration = 0.35;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.06, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    // Audio context may be restricted
  }
}
