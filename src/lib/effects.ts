"use client";
import confetti from "canvas-confetti";

export function celebrate(big = false) {
  if (typeof window === "undefined") return;
  const base = { spread: 70, ticks: 120, zIndex: 9999, colors: ["#58cc02", "#2DD4BF", "#ffc800", "#ff4b4b", "#06B6D4"] };
  confetti({ ...base, particleCount: big ? 160 : 60, origin: { y: 0.6 } });
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 80, angle: 60, origin: { x: 0, y: 0.7 } }), 250);
    setTimeout(() => confetti({ ...base, particleCount: 80, angle: 120, origin: { x: 1, y: 0.7 } }), 400);
  }
}

export function sparkle(x = 0.5, y = 0.5) {
  confetti({ particleCount: 24, spread: 360, startVelocity: 18, ticks: 60, gravity: 0.6, scalar: 0.8, shapes: ["star"], colors: ["#ffc800", "#fff59d", "#ffd54f"], origin: { x, y }, zIndex: 9999 });
}

let ctx: AudioContext | null = null;
function audio() {
  if (typeof window === "undefined") return null;
  try {
    ctx = ctx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}
function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.15) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}
export const sounds = {
  correct() { tone(660, 0, 0.12); tone(880, 0.1, 0.18); },
  wrong() { tone(220, 0, 0.18, "square", 0.08); tone(180, 0.15, 0.25, "square", 0.08); },
  complete() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25)); },
  tick() { tone(1200, 0, 0.04, "sine", 0.05); },
};
export function isSoundOn(): boolean {
  try { return localStorage.getItem("sound") !== "off"; } catch { return true; }
}
