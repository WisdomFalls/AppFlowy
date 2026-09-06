// Form ceilings.
//
// Raw training has a roof, and the roof is set by the last form you unlocked.
// This is the shape the series actually has: Goku trains for three years and
// gains a factor of ten, then stalls until he goes Super Saiyan, then stalls
// again until he masters it. Grinding push-ups past your ceiling does almost
// nothing. You break through by finding the next form, or by mastering the one
// you already have until it holds more than it was built to hold.

import { clamp } from './rng.js';
import { ladderFor, getTransformation } from '../data/transformations.js';

/** Best form owned, by multiplier. Local so this module stays a leaf. */
function bestForm(character) {
  let best = null;
  for (const id of character.transformations || []) {
    const t = getTransformation(id);
    if (!t) continue;
    if (!best || t.mult > best.mult) best = t;
  }
  return best;
}

/** Where raw training stops working, for a character at their current rung. */
export function ceilingFor(state) {
  const c = state.character;
  const ladder = ladderFor(c.raceId).slice().sort((a, b) => a.mult - b.mult);
  const owned = new Set(c.transformations);

  // The next rung you have not taken sets the roof: you can train up to
  // comfortably past its entry requirement, and then you are simply stuck at
  // the door until you open it.
  const next = ladder.find((f) => !owned.has(f.id) && f.req && f.req.power);
  let base;
  if (next) {
    base = next.req.power * 1.6;
  } else {
    // Nothing left on the ladder. The roof becomes your best form's own
    // ceiling, which is very high but not infinite.
    const best = bestForm(c);
    const top = ladder[ladder.length - 1];
    const anchor = (best && best.req && best.req.power) || (top && top.req && top.req.power) || 1000;
    base = anchor * 250;
  }

  // A form you have worn until it fits holds more than one you just found.
  const best = bestForm(c);
  const m = best ? masteryOf(c, best.id) : 0;
  base *= 1 + (m / 100) * 1.4;

  // Species that grow without a ladder at all (Earthlings, most of them) are
  // not meant to be capped by a form they can never reach.
  if (!ladder.length) base = Math.max(base, c.power * 6);

  return Math.max(120, base);
}

/** 0 at nowhere near the roof, 1 at it. */
export function ceilingPressure(state) {
  return clamp(state.character.power / ceilingFor(state), 0, 1.4);
}

/** The training multiplier the ceiling imposes. Falls away sharply at the top. */
export function ceilingDamping(state) {
  const p = ceilingPressure(state);
  if (p < 0.6) return 1;
  return clamp(1 - Math.pow((p - 0.6) / 0.42, 2.4), 0.04, 1);
}

/** What is actually stopping you, in words, or null if nothing is. */
export function ceilingBlock(state) {
  const p = ceilingPressure(state);
  if (p < 0.82) return null;
  const c = state.character;
  const ladder = ladderFor(c.raceId).slice().sort((a, b) => a.mult - b.mult);
  const owned = new Set(c.transformations);
  const next = ladder.find((f) => !owned.has(f.id) && f.req && f.req.power);
  const best = bestForm(c);
  return {
    at: p >= 1,
    next: next || null,
    form: best || null,
    mastery: best ? masteryOf(c, best.id) : 0,
    text: p >= 1
      ? (next
        ? `Training has stopped giving anything back. Your body is at the edge of what this shape holds. ${next.name} is the door.`
        : 'Training has stopped giving anything back. You are at the top of what your species is built to do, and past this it is the form itself that has to grow.')
      : 'The gains are getting thin. You are approaching what this shape holds.',
  };
}

// ------------------------------------------------------------------ mastery

export function masteryOf(character, formId) {
  return (character.formMastery && character.formMastery[formId]) || 0;
}

export function trainMastery(character, formId, amount) {
  if (!formId) return 0;
  character.formMastery = character.formMastery || {};
  const before = masteryOf(character, formId);
  const after = clamp(before + amount, 0, 100);
  character.formMastery[formId] = after;
  return Math.round(after) - Math.round(before);
}

/**
 * What mastery buys inside the form: more of the multiplier, less of the
 * drain. An unmastered form is a blunt instrument that empties you.
 */
export function masteryMult(character, formId) {
  const m = masteryOf(character, formId);
  return 0.82 + (m / 100) * 0.43;      // 0.82x raw, up to 1.25x fully mastered
}

export function masteryDrain(character, formId) {
  const m = masteryOf(character, formId);
  return 1.45 - (m / 100) * 0.95;      // 1.45x raw drain, down to 0.5x
}

export function masteryLabel(m) {
  if (m >= 95) return 'second nature';
  if (m >= 75) return 'mastered';
  if (m >= 50) return 'comfortable';
  if (m >= 25) return 'usable';
  if (m > 0) return 'raw';
  return 'untouched';
}

/** Every owned form and how well it is worn, for the UI. */
export function masteryList(character) {
  return (character.transformations || []).map((id) => {
    const f = getTransformation(id);
    if (!f) return null;
    const m = masteryOf(character, id);
    return {
      id, name: f.name, mult: f.mult, mastery: Math.round(m), label: masteryLabel(m),
      power: Math.round(f.mult * masteryMult(character, id) * 100) / 100,
      drain: Math.round(f.drain * masteryDrain(character, id) * 10) / 10,
    };
  }).filter(Boolean);
}
