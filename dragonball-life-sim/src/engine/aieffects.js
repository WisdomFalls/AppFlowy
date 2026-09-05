// Validation for model-authored events.
//
// The model writes the fiction and proposes consequences; this file is the
// referee. Every number is clamped, every unknown key dropped, and anything
// that would break the simulation is simply not applied. That is what makes it
// safe to let a language model invent events at runtime.

import { clamp } from './rng.js';
import { adjust, currentYear, addNpc } from './state.js';
import { addFact } from './memory.js';
import { makeNpc } from './npc.js';
import { STAT_KEYS } from './stats.js';

const LIMITS = {
  health: [-45, 45],
  happiness: [-35, 35],
  ki: [-60, 60],
  karma: [-25, 25],
  fame: [-12, 18],
  power_pct: [-8, 30],
  stat: [-7, 7],
};

function num(value, [lo, hi]) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(Math.round(n), lo, hi);
}

export function sanitiseText(value, max = 900) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Normalise a model-proposed effect block into something safe to apply. */
export function validateEffects(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;

  for (const key of ['health', 'happiness', 'ki', 'karma', 'fame']) {
    if (raw[key] !== undefined) out[key] = num(raw[key], LIMITS[key]);
  }
  if (raw.power_pct !== undefined) out.power_pct = num(raw.power_pct, LIMITS.power_pct);
  if (raw.zeni !== undefined) {
    const n = Number(raw.zeni);
    out.zeni = Number.isFinite(n) ? Math.round(n) : 0;
  }
  if (raw.stats && typeof raw.stats === 'object') {
    const stats = {};
    for (const k of STAT_KEYS) {
      if (raw.stats[k] !== undefined) stats[k] = num(raw.stats[k], LIMITS.stat);
    }
    if (Object.keys(stats).length) out.stats = stats;
  }
  if (typeof raw.meet === 'string' && raw.meet.trim()) out.meet = sanitiseText(raw.meet, 40);
  if (typeof raw.relation === 'string') out.relation = sanitiseText(raw.relation, 20);
  if (typeof raw.fact === 'string' && raw.fact.trim()) out.fact = sanitiseText(raw.fact, 160);
  if (raw.injury === true) out.injury = true;
  return out;
}

const ALLOWED_RELATIONS = ['friend', 'rival', 'enemy', 'acquaintance', 'mentor', 'student', 'lover', 'colleague'];

/** Apply validated effects. Zeni is capped relative to what the player has. */
export function applyAiEffects(state, rng, effects) {
  const safe = validateEffects(effects);
  const c = state.character;
  const changes = {};

  for (const key of ['health', 'happiness', 'ki', 'karma', 'fame']) {
    if (safe[key] !== undefined) changes[key] = safe[key];
  }
  if (safe.stats) changes.stats = safe.stats;
  if (safe.zeni !== undefined) {
    // A model cannot mint or destroy an unbounded fortune in one scene.
    const ceiling = Math.max(150000, Math.round(c.zeni * 0.5));
    changes.zeni = clamp(safe.zeni, -Math.min(c.zeni, ceiling), ceiling);
  }
  if (safe.power_pct !== undefined && safe.power_pct !== 0) {
    changes.powerMult = 1 + safe.power_pct / 100;
  }
  adjust(state, changes);

  const notes = [];
  if (safe.meet) {
    const npc = makeNpc(rng, {
      year: currentYear(state),
      placeId: c.placeId,
      name: safe.meet,
      relation: ALLOWED_RELATIONS.includes(safe.relation) ? safe.relation : 'acquaintance',
      powerScale: 1,
    });
    addNpc(state, npc);
    notes.push(`${npc.name} is now part of your life.`);
  }
  if (safe.fact) {
    addFact(state.memory, {
      type: 'event', text: safe.fact, year: c.age, weight: 2, tags: ['ai'],
    });
  }
  if (safe.injury) {
    adjust(state, { health: -8 });
  }
  return { changes, notes, safe };
}

/**
 * Turn a raw model response into an event the engine can present. Returns null
 * if the shape is unusable, which is the signal to fall back to procedural
 * generation.
 */
export function buildAiEvent(raw, id) {
  if (!raw || typeof raw !== 'object') return null;
  const title = sanitiseText(raw.title, 70);
  const text = sanitiseText(raw.text, 900);
  if (!title || !text) return null;

  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  const built = [];
  for (let i = 0; i < choices.length && built.length < 4; i++) {
    const ch = choices[i];
    if (!ch || typeof ch !== 'object') continue;
    const label = sanitiseText(ch.label, 64);
    const outcome = sanitiseText(ch.outcome, 600);
    if (!label || !outcome) continue;
    built.push({
      id: `ai${i}`,
      label,
      hint: sanitiseText(ch.hint, 90) || null,
      danger: ch.danger === true,
      locked: false,
      lockReason: null,
      outcome,
      effects: validateEffects(ch.effects),
    });
  }
  if (built.length < 2) return null;

  return {
    templateId: id || 'ai_event',
    ai: true,
    slots: {},
    title,
    text,
    tags: ['ai', ...(Array.isArray(raw.tags) ? raw.tags.slice(0, 3).map((t) => sanitiseText(t, 20)) : [])],
    choices: built,
    kind: 'event',
  };
}
