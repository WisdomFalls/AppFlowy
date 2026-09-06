// The action economy.
//
// The first version of this had a global slot budget as well as per-action
// limits, and the two fought each other: at biological nine you got three
// slots, training cost two of them, and a year was over after one session
// even though the action itself allowed three. The budget is gone. What is
// left is what actually stops the exploit:
//
//   1. Each action has its own yearly limit, which scales with how old you
//      are - a toddler gets fewer goes at everything than an adult.
//   2. Training grants power against a separate yearly ceiling, so pressing
//      the same button is subject to diminishing returns however many times
//      the limit lets you press it.
//
// A year is still finite. It is finite per activity, which is legible, rather
// than in one pooled number, which was not.

import { clamp } from './rng.js';
import { getRace, hasPerk, maturity } from '../data/races.js';
import { trainingRate } from './stats.js';

/**
 * How much of a year this character can get through, as a multiplier on every
 * action's own limit. Small children and the very old do less of everything;
 * androids and the disciplined do more; the dead have nothing but time.
 */
export function yearCapacity(state) {
  const c = state.character;
  const bio = maturity(c);

  let mult;
  if (bio < 3) mult = 0.34;
  else if (bio < 6) mult = 0.5;
  else if (bio < 10) mult = 0.7;
  else if (bio < 14) mult = 0.85;
  else if (bio < 60) mult = 1;
  else if (bio < 75) mult = 0.85;
  else if (bio < 90) mult = 0.7;
  else mult = 0.55;

  if (hasPerk(c, 'infiniteStamina')) mult += 0.2;
  if (hasPerk(c, 'meditative')) mult += 0.1;
  if (c.stats.discipline >= 80) mult += 0.15;
  if (c.vitals.health < 30) mult -= 0.25;
  if (c.vitals.health < 10) mult -= 0.15;
  if (c.inAfterlife) mult += 0.25;

  return clamp(mult, 0.25, 1.7);
}

/** This action's limit for this character this year, after age scaling. */
export function limitFor(state, action) {
  const base = typeof action.maxPerYear === 'function'
    ? action.maxPerYear(state)
    : action.maxPerYear;
  if (base === undefined || base === null) return Infinity;
  if (base <= 0) return 0;
  // Never scale a once-a-year thing down to nothing.
  return Math.max(1, Math.round(base * yearCapacity(state)));
}

export function usedThisYear(state, actionId) {
  const c = state.character;
  return (c.yearUse && c.yearUse[actionId]) || 0;
}

/** Reset the per-year counters. Called once per age-up. */
export function resetYearBudget(state) {
  const c = state.character;
  c.yearUse = {};
  c.yearPowerGained = 0;
  c.yearPowerCap = trainingCapForYear(state);
  delete c.slotsMax;
  delete c.slotsLeft;
}

/** Can this action be run right now? Returns a reason string when it cannot. */
export function actionBlocked(state, action) {
  const gate = ageGate(state, action);
  if (gate) return gate;
  const limit = limitFor(state, action);
  if (limit === Infinity) return null;
  const used = usedThisYear(state, action.id);
  if (used >= limit) {
    return limit === 1
      ? 'Once a year, and you have had it.'
      : `${limit} a year, and you have used ${used}.`;
  }
  return null;
}

/**
 * Some things you simply cannot do yet. A one-year-old is not hunting Dragon
 * Balls, and a five-year-old is not inventing a transformation.
 */
export function ageGate(state, action) {
  const c = state.character;
  if (action.minMaturity === undefined) return null;
  const bio = maturity(c);
  if (bio >= action.minMaturity) return null;
  const race = getRace(c.raceId);
  const rate = race.maturityRate ?? 1;
  const yearsOff = Math.max(1, Math.ceil((action.minMaturity - bio) / Math.max(0.2, rate)));
  return action.tooYoung || `You are too young. About ${yearsOff} year${yearsOff > 1 ? 's' : ''} yet.`;
}

export function chargeAction(state, action) {
  const c = state.character;
  c.yearUse = c.yearUse || {};
  c.yearUse[action.id] = (c.yearUse[action.id] || 0) + 1;
}

/**
 * The most power training may add this year. Deliberately generous - a good
 * year can still roughly double you - but finite, so no amount of clicking
 * turns a five-year-old into a planet buster.
 */
export function trainingCapForYear(state) {
  const c = state.character;
  const rate = trainingRate(c, { state, intensity: 1.6, placeMult: 2.5, gearMult: 2.1, mentorMult: 2 });
  const ceiling = clamp(rate * 2.4, 0.05, 1.3);
  return Math.max(3, Math.round(c.power * ceiling));
}

/**
 * Register power gained from training. Returns what was actually granted after
 * the yearly ceiling, so callers can report the honest number.
 */
export function grantTrainingPower(state, requested) {
  const c = state.character;
  if (c.yearPowerCap === undefined) c.yearPowerCap = trainingCapForYear(state);
  if (c.yearPowerGained === undefined) c.yearPowerGained = 0;

  const room = Math.max(0, c.yearPowerCap - c.yearPowerGained);
  const granted = Math.max(0, Math.min(requested, room));
  c.yearPowerGained += granted;
  if (granted > 0) {
    c.power += granted;
    c.peakPower = Math.max(c.peakPower, c.power);
  }
  return { granted, capped: granted < requested, room: room - granted };
}

export function trainingRoomLeft(state) {
  const c = state.character;
  if (c.yearPowerCap === undefined) return trainingCapForYear(state);
  return Math.max(0, c.yearPowerCap - (c.yearPowerGained || 0));
}

/** How long an action takes, purely as flavour on the row now. */
export const COST_LABEL = { 0: 'A moment', 1: 'An afternoon', 2: 'A season', 3: 'Most of the year' };

export function costLabel(action) {
  return action.cost || COST_LABEL[action.slots ?? 1] || 'A season';
}
