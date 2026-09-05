// The action economy.
//
// A year is a finite thing. Every activity costs slots out of a yearly budget,
// some activities have their own hard limits, and there is a ceiling on how
// much power training can add in one year. Without this you can stand still and
// press "train" until you are stronger than the setting allows.

import { clamp } from './rng.js';
import { getRace, hasPerk, maturity } from '../data/races.js';
import { trainingRate } from './stats.js';

/** How many slots this character gets in a year. */
export function yearBudget(state) {
  const c = state.character;
  const bio = maturity(c);

  let slots;
  if (bio < 4) slots = 1;
  else if (bio < 8) slots = 2;
  else if (bio < 13) slots = 3;
  else if (bio < 18) slots = 4;
  else if (bio < 32) slots = 5;
  else if (bio < 55) slots = 6;      // you finally know how to spend a year
  else if (bio < 70) slots = 5;
  else if (bio < 85) slots = 4;
  else slots = 3;

  if (hasPerk(c, 'infiniteStamina')) slots += 1;   // androids never need to rest
  if (hasPerk(c, 'meditative')) slots += 1;
  if (c.stats.discipline >= 80) slots += 1;
  if (c.vitals.health < 30) slots -= 1;
  if (c.inAfterlife) slots += 1;                    // the dead have nothing but time

  return clamp(slots, 1, 9);
}

/** Reset the per-year counters. Called once per age-up. */
export function resetYearBudget(state) {
  const c = state.character;
  c.slotsMax = yearBudget(state);
  c.slotsLeft = c.slotsMax;
  c.yearUse = {};
  c.yearPowerGained = 0;
  c.yearPowerCap = trainingCapForYear(state);
}

export function slotsLeft(state) {
  const c = state.character;
  if (c.slotsLeft === undefined) resetYearBudget(state);
  return c.slotsLeft;
}

export function slotsMax(state) {
  const c = state.character;
  if (c.slotsMax === undefined) resetYearBudget(state);
  return c.slotsMax;
}

/** Can this action be run right now? Returns a reason string when it cannot. */
export function actionBlocked(state, action) {
  const c = state.character;
  const cost = action.slots ?? 1;
  if (slotsLeft(state) < cost) {
    return cost === 1 ? 'No time left this year.' : `Needs ${cost} slots; you have ${slotsLeft(state)}.`;
  }
  if (action.maxPerYear !== undefined) {
    const used = (c.yearUse && c.yearUse[action.id]) || 0;
    if (used >= action.maxPerYear) {
      return action.maxPerYear === 1
        ? 'Once a year, and you have had it.'
        : `Only ${action.maxPerYear} a year. You have used ${used}.`;
    }
  }
  return null;
}

export function chargeAction(state, action) {
  const c = state.character;
  c.slotsLeft = Math.max(0, slotsLeft(state) - (action.slots ?? 1));
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
  const rate = trainingRate(c, { intensity: 1.6, placeMult: 2.5, gearMult: 2.1, mentorMult: 2 });
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

/** Slot costs by label, so the UI and the data stay in step. */
export const COST_LABEL = { 1: 'A moment', 2: 'A season', 3: 'Most of the year' };

export function costLabel(action) {
  return COST_LABEL[action.slots ?? 1] || 'A season';
}
