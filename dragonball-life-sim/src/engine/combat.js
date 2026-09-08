// Fights. Resolved as a short exchange model rather than a single dice roll, so
// that techniques, transformations and condition all show up in the narration.

import { clamp } from './rng.js';
import { render } from './text.js';
import { combatPower, winChance, zenkaiBoost, bestForm, powerTier } from './stats.js';
import { getTransformation } from '../data/transformations.js';
import { TECH_BY_ID } from '../data/techniques.js';
import { hasPerk } from '../data/races.js';
import { getKiColor } from '../data/kicolors.js';

/** Effective power for a non-player fighter. */
export function opponentPower(opponent) {
  return Math.max(1, opponent.power || 1);
}

/**
 * Fight resolution. `opponent` is an NPC-shaped object with a `power`.
 * Returns a structured result the caller turns into prose and consequences.
 */
export function fight(state, rng, opponent, opts = {}) {
  const c = state.character;
  const form = opts.form === null ? null : (opts.form !== undefined ? opts.form : bestForm(c));
  const mine = combatPower(c, { form });
  const theirs = opponentPower(opponent) * (opts.opponentMult || 1);

  const rounds = [];
  let myHp = 100 * (c.vitals.health / 100);
  let theirHp = 100;
  let myKi = c.vitals.ki;
  const maxRounds = opts.maxRounds || 6;

  const bigTechs = c.techniques
    .map((id) => TECH_BY_ID[id])
    .filter((t) => t && t.effect && t.effect.atk)
    .sort((a, b) => b.effect.atk - a.effect.atk);

  const edge = Math.log10(Math.max(1, mine) / Math.max(1, theirs));
  let usedSignature = false;

  for (let r = 0; r < maxRounds && myHp > 0 && theirHp > 0; r++) {
    // Each exchange is a contested roll around the power gap, with room for upsets.
    const swing = rng.gauss(edge * 1.6, 1.0);
    const luck = hasPerk(c, 'luck') ? rng.float(0, 0.5) : 0;
    const roll = swing + luck;

    let tech = null;
    if (bigTechs.length && myKi > 12 && rng.chance(0.45)) {
      tech = rng.pick(bigTechs.slice(0, 3));
      myKi -= tech.effect.kiCost || 8;
      if (!usedSignature && c.signature && rng.chance(0.4)) usedSignature = true;
    }

    if (roll > 0.25) {
      const dmg = clamp(18 + roll * 14 + (tech ? tech.effect.atk * 0.35 : 0), 8, 70);
      theirHp -= dmg;
      rounds.push({ side: 'me', tech: tech ? tech.name : null, damage: Math.round(dmg), beat: 'landed' });
    } else if (roll < -0.25) {
      const dmg = clamp(18 - roll * 14, 8, 70);
      myHp -= dmg;
      rounds.push({ side: 'them', damage: Math.round(dmg), beat: 'hit' });
    } else {
      rounds.push({ side: 'even', damage: 0, beat: 'even' });
    }
  }

  let won;
  if (theirHp <= 0 && myHp > 0) won = true;
  else if (myHp <= 0 && theirHp > 0) won = false;
  else won = rng.chance(winChance(mine, theirs));

  const margin = Math.abs(myHp - theirHp);
  const closeCall = margin < 22;
  const damageTaken = clamp(Math.round(100 - myHp), 0, 100);

  // Near-death is the interesting case: it is where Saiyans get stronger.
  const nearDeath = myHp <= 12;
  let zenkai = 0;
  if (nearDeath && !opts.noZenkai) {
    zenkai = zenkaiBoost(c, rng, closeCall ? 1.2 : 0.8);
  }

  const lethal = !won && (myHp <= 0) && rng.chance(opts.lethality ?? 0.22);

  return {
    won, rounds, damageTaken, closeCall, nearDeath, zenkai, lethal,
    myPower: Math.round(mine), theirPower: Math.round(theirs),
    form: form ? form.id : null,
    formName: form ? form.name : null,
    kiColorName: c.kiColor ? (getKiColor(c.kiColor) || {}).name : null,
    usedSignature,
    kiSpent: Math.max(0, c.vitals.ki - myKi),
    ratio: mine / Math.max(1, theirs),
  };
}

/** Turn a fight result into prose, with variety drawn from the lexicon. */
export function narrateFight(result, rng, opponentName) {
  const lines = [];
  if (result.formName) {
    lines.push(render(`{You go|You drop into|You take} ${result.formName}`
      + `${result.kiColorName ? `, ${result.kiColorName} ki spilling out immediately` : ''}`
      + ` {before the first exchange|the moment it starts|without announcing it}.`, {}, rng));
  } else if (result.kiColorName && rng.chance(0.35)) {
    lines.push(render(`{Your ki comes up ${result.kiColorName} before anything else does|`
      + `The first thing anyone sees is the ${result.kiColorName}|Same colour it always is}.`, {}, rng));
  }
  const shown = result.rounds.slice(0, 3);
  for (const round of shown) {
    if (round.side === 'me') {
      lines.push(render(round.tech
        ? `You open with ${round.tech} and #landed#.`
        : `{You move first|You do not wait|You close the distance} and #landed#.`, {}, rng));
    } else if (round.side === 'them') {
      lines.push(render(`[foe] #hit#.`, { foe: opponentName }, rng));
    } else {
      lines.push(render(`{Neither of you gives anything away|You trade nothing but distance|The exchange goes nowhere}.`, {}, rng));
    }
  }
  if (result.won) {
    lines.push(render(result.closeCall
      ? `{It is closer than you want to admit|You win it by about a second|Another exchange and it goes the other way}. #aftermath#`
      : `{It is not close|You end it|They do not get up}. #aftermath#`, {}, rng));
  } else {
    lines.push(render(result.nearDeath
      ? `{You wake up later|You come round some time after|The next thing you know}, #injury#.`
      : `{You lose|It goes badly|You are outclassed and you know it}. #injury#.`, {}, rng));
  }
  return lines.join(' ');
}

/**
 * Tournament bracket. Returns the placement and a round-by-round record.
 * Entrants are NPC-shaped objects.
 */
export function runTournament(state, rng, entrants, opts = {}) {
  const c = state.character;
  const field = entrants.slice();
  const record = [];
  let round = 1;
  let alive = field.slice();
  let eliminated = false;
  let placement = alive.length + 1;

  while (alive.length > 0 && !eliminated) {
    const foe = alive.shift();
    const res = fight(state, rng, foe, { lethality: opts.lethality ?? 0.04, maxRounds: 5 });
    record.push({ round, foe: foe.name, foePower: foe.power, won: res.won, result: res });
    state.stats.fights++;
    if (res.won) {
      state.stats.wins++;
      round++;
      if (alive.length === 0) {
        placement = 1;
        break;
      }
    } else {
      state.stats.losses++;
      eliminated = true;
      placement = alive.length + 2;
      return { placement, record, won: false, lastResult: res };
    }
  }
  return { placement, record, won: placement === 1, lastResult: record.length ? record[record.length - 1].result : null };
}

/** Build a plausible tournament field for a year and power baseline. */
export function buildField(rng, makeFighter, size, baseline) {
  const out = [];
  for (let i = 0; i < size; i++) {
    // Later rounds are exponentially harder.
    const scale = Math.pow(2.6, i - size * 0.45);
    out.push(makeFighter(Math.max(1, baseline * scale * rng.float(0.5, 1.8)), i));
  }
  return out.sort((a, b) => a.power - b.power);
}

export function describeGap(mine, theirs) {
  const r = mine / Math.max(1, theirs);
  if (r > 50) return 'They are not remotely in your class.';
  if (r > 6) return 'You are clearly stronger.';
  if (r > 1.5) return 'You have the edge.';
  if (r > 0.66) return 'This is close to even.';
  if (r > 0.16) return 'They are stronger than you.';
  if (r > 0.02) return 'They are far beyond you.';
  return `This is suicide. They are ${powerTier(theirs)}.`;
}
