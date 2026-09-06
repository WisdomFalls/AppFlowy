// Power level mathematics. Dragon Ball power is exponential, so growth here is
// multiplicative: a percentage gain per year of training that compounds. That
// reproduces the shape of the series, where a decade of work multiplies you by
// thousands rather than adding a flat amount.

import { clamp } from './rng.js';
import { traitEffect } from '../data/traits.js';
import { getRace, hasPerk } from '../data/races.js';
import { getTransformation } from '../data/transformations.js';
import { techniquePower } from '../data/techniques.js';
import { ceilingDamping, masteryMult } from './mastery.js';

export const STAT_KEYS = ['strength', 'speed', 'technique', 'kiControl', 'durability', 'intellect', 'charisma', 'discipline'];

export const STAT_LABELS = {
  strength: 'Strength', speed: 'Speed', technique: 'Technique', kiControl: 'Ki Control',
  durability: 'Durability', intellect: 'Intellect', charisma: 'Charisma', discipline: 'Discipline',
};

/** How well the body performs at this age, given the race's aging rate. */
export function ageFactor(character) {
  const race = getRace(character.raceId);
  const bio = character.age * race.agingRate;
  if (bio < 4) return 0.25;
  if (bio < 10) return 0.75;
  if (bio < 16) return 1.25;      // childhood spurt: the Gohan effect
  if (bio < 30) return 1.0;
  if (bio < 42) return 0.85;
  if (bio < 55) return 0.62;
  if (bio < 70) return 0.4;
  if (bio < 90) return 0.22;
  return 0.1;
}

/** Physical decline applied to stats each year past the prime. */
export function agingDecay(character) {
  const race = getRace(character.raceId);
  const bio = character.age * race.agingRate;
  if (bio < 35) return 0;
  if (bio < 50) return 0.35;
  if (bio < 65) return 0.9;
  if (bio < 80) return 1.8;
  return 3.0;
}

/**
 * One year of training. Returns the multiplicative growth rate applied to base
 * power, before injury and event modifiers.
 */
export function trainingRate(character, opts = {}) {
  // Blood and upbringing move how fast a body answers.
  const race = getRace(character.raceId);
  const intensity = opts.intensity ?? 1.0;      // 0.4 light .. 2.0 suicidal
  const placeMult = opts.placeMult ?? 1.0;
  const mentorMult = opts.mentorMult ?? 1.0;
  const gearMult = opts.gearMult ?? 1.0;

  const discipline = 0.55 + (character.stats.discipline / 100) * 0.9;
  const kiSkill = 0.8 + (character.stats.kiControl / 100) * 0.4;
  const base = 0.11;

  let rate = base * race.growth.power * intensity * placeMult * mentorMult *
    gearMult * discipline * kiSkill * ageFactor(character);

  // The higher you climb the harder each further step is, which is why the
  // series keeps needing new transformations rather than more push-ups.
  const scale = Math.log10(Math.max(10, character.power));
  rate *= clamp(1.5 - scale * 0.075, 0.28, 1.5);

  if (hasPerk(character, 'infiniteStamina')) rate *= 0.6;   // androids grow by upgrade
  if (hasPerk(character, 'arrogance') && intensity < 1.2) rate *= 0.6;
  if (hasPerk(character, 'innatePower') && intensity >= 1.2) rate *= 1.8;
  if (hasPerk(character, 'fastLearner')) rate *= 1.15;
  if (character.vitals.health < 40) rate *= 0.6;
  if (character.vitals.happiness < 25) rate *= 0.8;

  // The roof. Past the ceiling your current form supports, work stops paying.
  if (opts.state) rate *= ceilingDamping(opts.state);

  return (Math.max(0, rate)) * traitEffect(character, 'trainMult');
}

/** Apply a zenkai: near-death survival permanently raises the ceiling. */
export function zenkaiBoost(character, rng, severity = 1) {
  if (!hasPerk(character, 'zenkai') && !hasPerk(character, 'zenkaiWeak')) return 0;
  const strength = hasPerk(character, 'zenkai') ? 1 : 0.45;
  const mult = 1 + rng.float(0.18, 0.75) * severity * strength;
  const before = character.power;
  character.power = Math.round(character.power * mult);
  character.zenkaiCount = (character.zenkaiCount || 0) + 1;
  return character.power - before;
}

/** Best transformation currently unlocked, or null. */
export function bestForm(character) {
  let best = null;
  for (const id of character.transformations) {
    const t = getTransformation(id);
    if (!t) continue;
    if (!best || t.mult > best.mult) best = t;
  }
  return best;
}

/**
 * Combat power. Base power scaled by form, condition and technique library.
 * `form` may be forced; otherwise the best available form is used.
 */
export function combatPower(character, opts = {}) {
  const form = opts.form === null ? null : (opts.form || bestForm(character));
  // A form you have not worn in gives you less than it says on the tin.
  const mult = form ? form.mult * masteryMult(character, form.id) : 1;
  const health = clamp(character.vitals.health / Math.max(1, character.vitals.healthMax || 100), 0.25, 1);
  const ki = clamp(0.55 + (character.vitals.ki / Math.max(1, character.vitals.kiMax)) * 0.45, 0.4, 1);
  const tech = techniquePower(character);
  const techFactor = 1 + (tech.atk + tech.def + tech.speed) / 260;
  const skill = 1 + ((character.stats.technique + character.stats.kiControl) / 200) * 0.5;
  const condition = opts.ignoreCondition ? 1 : health * ki;
  return Math.max(1, character.power * mult * techFactor * skill * condition);
}

/** A readable descriptor, because raw power levels stop meaning much at 1e12. */
export function powerTier(power) {
  const tiers = [
    [10, 'Civilian'], [50, 'Trained'], [200, 'Martial Artist'], [1000, 'Elite Fighter'],
    [10000, 'Planetary Threat'], [1e6, 'Saiyan Elite'], [1e8, 'Frieza Class'],
    [1e10, 'World Ender'], [1e12, 'Divine Class'], [1e14, 'God of Destruction Class'],
    [Infinity, 'Beyond Measure'],
  ];
  for (const [cap, label] of tiers) if (power < cap) return label;
  return 'Beyond Measure';
}

/** Odds of A beating B, with an upset floor so nothing is ever certain. */
export function winChance(powerA, powerB) {
  const ratio = Math.log10(Math.max(1, powerA) / Math.max(1, powerB));
  const raw = 1 / (1 + Math.exp(-ratio * 2.4));
  return clamp(raw, 0.02, 0.98);
}

export function statAverage(character, keys = STAT_KEYS) {
  return keys.reduce((n, k) => n + (character.stats[k] || 0), 0) / keys.length;
}

export function applyStatDelta(character, delta, cap = 100) {
  for (const [k, v] of Object.entries(delta || {})) {
    if (STAT_KEYS.includes(k)) {
      character.stats[k] = clamp((character.stats[k] || 0) + v, 1, cap);
    }
  }
}

/**
 * How much punishment the body holds. This is not a constant: a fighter who
 * has trained for thirty years and come back from three near-deaths is
 * physically harder to put down than the boy he was, and the number should
 * say so instead of everyone sharing one hundred hit points forever.
 */
export function healthMaxFor(character) {
  const race = getRace(character.raceId);
  const dur = character.stats.durability || 40;
  let max = 60 + dur * 0.8;                                   // 68 .. 140
  max += Math.min(60, (character.flags?.hardTrainingYears || 0) * 2.2);
  max += Math.min(70, (character.zenkaiCount || 0) * 9);      // scar tissue that helps
  max += Math.min(40, Math.log10(Math.max(10, character.power)) * 6);
  if (hasPerk(character, 'hardToKill')) max *= 1.15;
  if (hasPerk(character, 'regeneration')) max *= 1.08;
  max *= ageFactor(character) < 0.3 ? 0.8 : 1;                // the very old and the very small
  max *= traitEffect(character, 'healthMult') || 1;
  return Math.round(clamp(max, 45, 420));
}

/** Stamina pool. Same idea: conditioning is a thing you build. */
export function staminaMaxFor(character) {
  if (hasPerk(character, 'infiniteStamina')) return 100;
  const base = 55 + (character.stats.durability || 40) * 0.35 + (character.stats.discipline || 40) * 0.3;
  const trained = Math.min(45, (character.flags?.hardTrainingYears || 0) * 1.6);
  const mult = traitEffect(character, 'staminaMult') || 1;
  return Math.round(clamp((base + trained) * mult * (ageFactor(character) < 0.3 ? 0.85 : 1), 50, 240));
}

/** Maximum ki pool, which grows with control and technique. */
export function kiMaxFor(character) {
  // Deep reserves are a real thing somebody is born with.
  const base = 40 + character.stats.kiControl * 0.9 + character.stats.discipline * 0.3;
  const bonus = character.techniques.length * 2;
  return Math.round((Math.round(base + bonus)) * traitEffect(character, 'kiMult'));
}

export function lifeExpectancy(character, rng) {
  const race = getRace(character.raceId);
  const [lo, hi] = race.lifespan;
  let span = rng ? rng.int(lo, hi) : Math.round((lo + hi) / 2);
  span += Math.round((character.stats.durability - 50) * 0.25);
  if (hasPerk(character, 'hardToKill')) span = Math.round(span * 1.2);
  return span;
}

/** Chance of dying of natural causes this year. */
export function naturalDeathChance(character) {
  const span = character.lifeExpectancy || 80;
  const over = character.age - span;
  if (over < -10) return 0.0004;
  if (over < 0) return 0.004 + (10 + over) * 0.002;
  return clamp(0.08 + over * 0.06, 0, 0.85);
}
