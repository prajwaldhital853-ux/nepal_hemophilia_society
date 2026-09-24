let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

/** Short alert tone when a new admin notification arrives. */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    const tone = ctx.createOscillator();
    tone.type = "sine";
    tone.frequency.setValueAtTime(880, now);
    tone.frequency.setValueAtTime(660, now + 0.12);
    tone.connect(gain);
    tone.start(now);
    tone.stop(now + 0.45);
  } catch {
    // Browsers may block audio until user interaction — ignore.
  }
}
