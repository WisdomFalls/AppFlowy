// What you can actually tell about somebody.
//
// A power level is a number a scouter reads out. Without one, and without ki
// sense, you do not get a number - you get an impression, which is what every
// character in this setting who is not holding a scouter actually has.
//
// Scouters also break. They were built to read the Frieza Force's own people
// and they cannot cope with anything past about a million, which is the joke
// the entire Namek saga runs on.

import { combatPower, powerTier } from './stats.js';

/** The reading a scouter can survive before the lens goes. */
export const SCOUTER_CEILING = 1000000;

export function hasScouter(character) {
  return (character.items || []).includes('scouter') || (character.items || []).includes('cyber_eye');
}

export function hasKiSense(character) {
  const t = character.techniques || [];
  return t.includes('ki_sense') || t.includes('ki_suppress') || t.includes('instant_transmission');
}

/** Can this character read exact numbers off anybody at all? */
export function canReadPower(character) {
  return hasKiSense(character) || hasScouter(character);
}

/**
 * How a power level reads to this character. Returns the string to show and
 * whether a scouter just died getting it.
 */
export function readPower(state, targetPower, opts = {}) {
  const c = state.character;
  const mine = combatPower(c);
  const ratio = targetPower / Math.max(1, mine);

  if (hasKiSense(c)) {
    // Ki sense is a feel, not a display, but a trained one is accurate.
    return { known: true, exact: true, broke: false, text: fmt(targetPower), how: 'ki sense' };
  }

  if (hasScouter(c)) {
    if (targetPower > SCOUTER_CEILING) {
      // The classic. It reads, it climbs, and then it does not exist any more.
      if (!opts.peek && !state.character.flags.scouter_broken) {
        state.character.flags.scouter_broken = true;
        const i = (c.items || []).indexOf('scouter');
        if (i > -1) c.items.splice(i, 1);
      }
      return {
        known: false, exact: false, broke: true,
        text: 'the scouter climbs, screams, and comes apart against the side of your head',
        how: 'scouter',
      };
    }
    return { known: true, exact: true, broke: false, text: fmt(targetPower), how: 'scouter' };
  }

  // No instrument and no training: you get what a person gets.
  return { known: false, exact: false, broke: false, how: 'instinct', text: impression(ratio) };
}

function fmt(n) {
  const v = Math.round(n);
  return v.toLocaleString('en-US');
}

/** A body's honest read on somebody else, with no numbers in it. */
function impression(ratio) {
  if (ratio > 400) return 'standing near them is like standing near weather';
  if (ratio > 60) return 'you cannot look directly at what they are';
  if (ratio > 12) return 'far past you, and not pretending otherwise';
  if (ratio > 3.5) return 'stronger than you, clearly';
  if (ratio > 1.4) return 'stronger than you, probably';
  if (ratio > 0.7) return 'about even, as far as you can tell';
  if (ratio > 0.2) return 'weaker than you';
  if (ratio > 0.02) return 'no threat';
  return 'nothing at all';
}

/**
 * The tier name is always available - everyone in this setting can tell a
 * fighter from a farmer - but the number behind it is not.
 */
export function describePower(state, targetPower, opts = {}) {
  const read = readPower(state, targetPower, opts);
  if (read.known) return `${read.text} (${powerTier(targetPower)})`;
  if (read.broke) return read.text;
  return read.text;
}

/** For rows and cards where only a short label fits. */
export function shortPower(state, targetPower) {
  const read = readPower(state, targetPower, { peek: true });
  if (read.known) return read.text;
  if (read.broke) return 'off the scale';
  return '?';
}
