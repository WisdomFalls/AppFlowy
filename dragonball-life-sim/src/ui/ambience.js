// Procedural ambience. Not a soundtrack - there is nowhere to put licensed
// music in a single self-contained HTML file without either bloating it far
// past reason or reaching out to a server this game does not otherwise need.
// Instead this is three detuned oscillators through a low-pass filter, and
// the only thing that changes between "training" and "somebody is trying to
// kill you" is which knobs are turned. Off by default - browsers refuse to
// play audio before a user gesture anyway, and plenty of people would rather
// not have a hum regardless.

const MOODS = {
  calm: { freqs: [110, 165, 220], filter: 900, gain: 0.05, detune: 3 },
  tense: { freqs: [98, 147, 196], filter: 500, gain: 0.06, detune: 9 },
  battle: { freqs: [82, 123.5, 164.8], filter: 340, gain: 0.075, detune: 15 },
};

let ctx = null;
let master = null;
let filter = null;
let oscs = null;
let currentMood = 'calm';
let enabled = false;

function ensureContext() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(master);
    master.connect(ctx.destination);
    const m = MOODS[currentMood];
    oscs = m.freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = i === 1 ? m.detune : i === 2 ? -m.detune : 0;
      o.connect(filter);
      o.start();
      return o;
    });
    return ctx;
  } catch (e) {
    return null;
  }
}

function applyMood(mood, rampSeconds) {
  const m = MOODS[mood];
  if (!m || !ctx || !oscs) return;
  const t = ctx.currentTime + rampSeconds;
  oscs[0].frequency.linearRampToValueAtTime(m.freqs[0], t);
  oscs[1].frequency.linearRampToValueAtTime(m.freqs[1], t);
  oscs[2].frequency.linearRampToValueAtTime(m.freqs[2], t);
  oscs[1].detune.linearRampToValueAtTime(m.detune, t);
  oscs[2].detune.linearRampToValueAtTime(-m.detune, t);
  filter.frequency.linearRampToValueAtTime(m.filter, t);
  if (enabled) master.gain.linearRampToValueAtTime(m.gain, t);
}

/** Turn the ambience on or off. Must be called from inside a user gesture
 * (a click) the first time, or the browser will simply ignore it. */
export function setAmbienceEnabled(on) {
  enabled = !!on;
  try {
    if (!enabled) {
      if (master && ctx) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      return;
    }
    if (!ensureContext()) { enabled = false; return; }
    if (ctx.state === 'suspended') ctx.resume();
    applyMood(currentMood, 0.8);
  } catch (e) {
    enabled = false;
  }
}

export function isAmbienceEnabled() {
  return enabled;
}

/** What the game is doing right now: 'calm', 'tense', or 'battle'. Safe to
 * call constantly - it is a no-op whenever ambience is off. */
export function setMood(mood) {
  if (!MOODS[mood] || mood === currentMood) { if (MOODS[mood]) currentMood = mood; return; }
  currentMood = mood;
  if (!enabled || !ctx) return;
  try { applyMood(mood, 1.4); } catch (e) { /* audio is best-effort */ }
}
