// Transformation gating. Each form declares a requirement object; the custom
// clauses below are the story conditions - a ritual, an absorption, a death -
// that a raw stat check cannot express.

import { TRANSFORMATIONS, ladderFor, getTransformation } from '../data/transformations.js';
import { getPlace } from '../data/places.js';
import { hasPerk } from '../data/races.js';
import { combatPower } from './stats.js';
import { livingNpcs } from './state.js';

const CUSTOM = {
  blutz_wave: (state) => {
    const c = state.character;
    if (!c.tail) return false;
    if (c.flags.power_ball) return true;
    const p = getPlace(c.placeId);
    return ['earth', 'planet_vegeta', 'sadala'].includes(p.planet);
  },
  ssj_hours: (state) => !!state.character.flags.ssj_mastery,
  ssb_hours: (state) => !!state.character.flags.ssb_mastery,
  blue_refined: (state) => !!state.character.flags.brink_of_death
    && (state.character.flags.hardTrainingYears || 0) >= 2,
  god_ritual: (state) => !!state.character.flags.god_ritual
    || state.character.mentors.includes('whis') || state.character.mentors.includes('beerus'),
  destroyer_path: (state) => !!state.character.flags.destroyer_training
    || state.character.mentors.includes('beerus'),
  // Never actually reachable before this - nothing anywhere set the flag,
  // which meant Ultra Instinct Sign could not be unlocked at all, by anyone,
  // ever. The organic path canon actually uses is a beating, not a ritual:
  // Goku surfaces Sign only after Jiren puts him down hard, not through
  // training alone. brink_of_death and humiliated (battle.js's finish())
  // are exactly that - nearly dying, or losing badly outmatched - so either
  // is the trigger, on top of the power and stat floor already required.
  // Whis (or another angel) can still show a fighter the door directly,
  // same as the god-tier forms above.
  ui_trigger: (state) => !!state.character.flags.ui_trigger
    || !!state.character.flags.humiliated
    || !!state.character.flags.brink_of_death
    || state.character.mentors.includes('whis'),
  namek_fusion: (state) => !!state.character.flags.assimilated,
  dragon_wish_potential: (state) => !!state.character.flags.wish_potential,
  unlock_ritual: (state) => !!state.character.flags.potential_unlocked,
  trained_at_all: (state) => (state.character.flags.hardTrainingYears || 0) >= 3,
  extreme_isolation_training: (state) => !!state.character.flags.isolation_training,
  absorbed_one: (state) => (state.character.flags.absorbed || 0) >= 1,
  absorbed_two: (state) => (state.character.flags.absorbed || 0) >= 2,
  absorbed_three: (state) => (state.character.flags.absorbed || 0) >= 3,
  upgrade_2: (state) => (state.character.flags.upgrades || 0) >= 1,
  upgrade_3: (state) => (state.character.flags.upgrades || 0) >= 2,
  possessed_someone: (state) => !!state.character.flags.possessed,
  has_potara: (state) => state.character.items.includes('potara'),
  has_fusion_partner: (state) => livingNpcs(state).some((n) =>
    n.closeness > 60 && n.power > combatPower(state.character) * 0.4 && n.power < combatPower(state.character) * 2.5),
  wished_for_power: (state) => !!state.character.flags.wished_power,
};

/** Which requirement clauses are unmet, as readable strings. */
export function missingRequirements(state, form) {
  const c = state.character;
  const req = form.req || {};
  const missing = [];

  if (req.power && c.power < req.power) missing.push(`power level ${Math.round(req.power).toLocaleString('en-US')}`);
  if (req.parent && !c.transformations.includes(req.parent)) {
    const p = getTransformation(req.parent);
    missing.push(p ? p.name : req.parent);
  }
  for (const [k, v] of Object.entries(req.stat || {})) {
    if ((c.stats[k] || 0) < v) missing.push(`${k} ${v}`);
  }
  for (const f of req.flags || []) if (!c.flags[f]) missing.push(f.replace(/_/g, ' '));
  if (req.anyFlag && !req.anyFlag.some((f) => c.flags[f])) {
    // Emotion is the usual door, but it is not the only one. A fighter who has
    // trained far past the threshold overflows into the form on their own -
    // which is what stops a huge power level from being a dead end.
    const waiver = (req.power || 1) * (req.flagWaiverMult || 25);
    if (!req.power || c.power < waiver) {
      missing.push('a moment strong enough to trigger it');
    }
  }
  for (const t of req.traits || []) {
    if (t === 'tail' && !c.tail) missing.push('a tail');
    else if (t !== 'tail' && !c.traits.includes(t) && !hasPerk(c, t)) missing.push(t);
  }
  for (const m of req.mentors || []) if (!c.mentors.includes(m)) missing.push(`training under ${m.replace(/_/g, ' ')}`);
  for (const t of req.techniques || []) if (!c.techniques.includes(t)) missing.push(t.replace(/_/g, ' '));
  if (req.age && c.age < req.age) missing.push(`age ${req.age}`);
  if (req.custom) {
    const fn = CUSTOM[req.custom];
    if (fn && !fn(state)) missing.push(req.custom.replace(/_/g, ' '));
  }
  return missing;
}

export function requirementsMet(state, form) {
  return missingRequirements(state, form).length === 0;
}

/** Forms this character could attempt right now. */
export function unlockableForms(state) {
  const c = state.character;
  return ladderFor(c.raceId).filter((f) =>
    !c.transformations.includes(f.id) && requirementsMet(state, f));
}

/** Forms one or two clauses away, for the progression screen. */
export function nearbyForms(state, limit = 4) {
  const c = state.character;
  return ladderFor(c.raceId)
    .filter((f) => !c.transformations.includes(f.id))
    .map((f) => ({ form: f, missing: missingRequirements(state, f) }))
    .filter((x) => x.missing.length > 0)
    .sort((a, b) => a.missing.length - b.missing.length || a.form.tier - b.form.tier)
    .slice(0, limit);
}

/** Attempt a transformation. Success is likely but never certain. */
export function tryUnlockForm(state, rng, formId) {
  const form = getTransformation(formId);
  const c = state.character;
  if (!form) return { unlocked: false, text: 'Nothing happens.' };
  if (c.transformations.includes(formId)) return { unlocked: false, text: 'You already have this.' };

  const missing = missingRequirements(state, form);
  if (missing.length) {
    return { unlocked: false, text: `Something is still missing: ${missing.slice(0, 2).join(', ')}.`, missing };
  }

  const powerMargin = form.req.power ? c.power / form.req.power : 1.5;
  const chance = Math.min(0.95, 0.42 + Math.log10(Math.max(1, powerMargin)) * 0.35
    + (c.stats.discipline - 50) / 250 + (c.vitals.health - 60) / 400);

  if (rng.chance(chance)) {
    c.transformations.push(formId);
    if (formId === 'ssj') c.flags.went_super = true;
    return { unlocked: true, form, text: `Everything you have goes into one place.` };
  }
  return { unlocked: false, form, text: `You get right up against it.` };
}

export function describeRequirement(state, form) {
  const missing = missingRequirements(state, form);
  return missing.length ? `Needs: ${missing.join(', ')}` : 'Available now';
}

/** Every form in the character's ladder, annotated for the UI. */
export function ladderStatus(state) {
  const c = state.character;
  return ladderFor(c.raceId).map((f) => ({
    id: f.id, name: f.name, tier: f.tier, mult: f.mult, desc: f.desc, hint: f.hint,
    owned: c.transformations.includes(f.id),
    missing: c.transformations.includes(f.id) ? [] : missingRequirements(state, f),
  }));
}
