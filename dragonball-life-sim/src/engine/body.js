// What a fight takes and does not give back.
//
// Scars are cosmetic. These are not: an arm you no longer have, an eye that
// stopped working, a tail somebody cut off. Each one costs something real and
// permanently, and each one has an answer - a prosthetic, a regeneration, a
// wish - that costs something else.

import { clamp } from './rng.js';
import { getRace, hasPerk } from '../data/races.js';

export const INJURIES = {
  lost_arm: {
    id: 'lost_arm', name: 'a missing arm', mark: 'stump_arm', side: true,
    desc: 'Taken off above the elbow. You have relearned everything one-handed.',
    stats: { strength: -10, technique: -8 }, powerMult: 0.82,
    prosthetic: 'mech_arm',
  },
  lost_hand: {
    id: 'lost_hand', name: 'a missing hand', mark: 'stump_hand', side: true,
    desc: 'The hand is gone. The arm works.',
    stats: { technique: -6, strength: -3 }, powerMult: 0.93,
    prosthetic: 'mech_arm',
  },
  lost_eye: {
    id: 'lost_eye', name: 'a lost eye', mark: 'missing_eye', side: true,
    desc: 'Depth perception is a thing you have had to rebuild from scratch.',
    stats: { speed: -5, technique: -4 }, powerMult: 0.94,
    prosthetic: 'mech_eye',
  },
  lost_leg: {
    id: 'lost_leg', name: 'a missing leg', mark: 'stump_leg', side: true,
    desc: 'Below the knee. Flight helps. Standing does not.',
    stats: { speed: -12, strength: -4 }, powerMult: 0.85,
    prosthetic: 'mech_leg',
  },
  lost_tail: {
    id: 'lost_tail', name: 'a severed tail', mark: null,
    desc: 'Cut at the base. Whatever it was for, it is not for that any more.',
    stats: {}, powerMult: 1,
  },
  broken_back: {
    id: 'broken_back', name: 'a spine that never set right', mark: null,
    desc: 'It healed. It did not heal straight.',
    stats: { speed: -8, durability: -6 }, powerMult: 0.88,
  },
  ruined_lungs: {
    id: 'ruined_lungs', name: 'ruined lungs', mark: null,
    desc: 'Something burned out of you that does not grow back. You tire early now.',
    stats: { durability: -8, discipline: -2 }, powerMult: 0.9,
  },
};

export const PROSTHETICS = {
  mech_arm: { id: 'mech_arm', name: 'a mechanical arm', restores: 0.85, stats: { strength: 4 } },
  mech_leg: { id: 'mech_leg', name: 'a mechanical leg', restores: 0.85, stats: { speed: 3 } },
  mech_eye: { id: 'mech_eye', name: 'an artificial eye', restores: 0.9, stats: { technique: 2 } },
};

export function injuries(character) {
  return character.injuries || (character.injuries = []);
}

export function hasInjury(character, id) {
  return injuries(character).some((i) => i.id === id);
}

/**
 * Take a permanent injury. Returns the line to show, or null if it did not
 * apply (already have it, or the body regrows it before anyone can notice).
 */
export function maim(state, rng, id, from, opts = {}) {
  const c = state.character;
  const spec = INJURIES[id];
  if (!spec || hasInjury(c, id)) return null;

  // Namekians and Buu regrow limbs in the time it takes to say so. Androids
  // do not bleed, but they do come apart, and theirs stays off until repaired.
  if (hasPerk(c, 'regeneration') && id !== 'lost_tail' && !opts.force) {
    return `${from ? from + ' takes' : 'You lose'} the limb, and it is back before the shock is.`;
  }

  const entry = {
    id, from: from || 'nobody in particular', year: c.birthYear + c.age,
    side: spec.side ? rng.pick(['left', 'right']) : null,
    prosthetic: null,
  };
  injuries(c).push(entry);

  if (spec.mark) {
    c.scars = c.scars || [];
    c.scars.push({ year: entry.year, mark: spec.mark, from: entry.from, text: `${spec.name}, from ${entry.from}.` });
  }
  if (id === 'lost_tail') c.tail = false;
  applyInjuryStats(c, spec, 1);
  c.power = Math.max(1, Math.round(c.power * spec.powerMult));

  return opts.text || `You lose ${entry.side ? 'the ' + entry.side + ' one' : 'it'}. ${spec.desc}`;
}

function applyInjuryStats(character, spec, sign) {
  for (const [k, v] of Object.entries(spec.stats || {})) {
    character.stats[k] = clamp((character.stats[k] || 0) + v * sign, 1, 100);
  }
}

/** What is currently missing, in a form the record and the UI can print. */
export function injuryList(character) {
  return injuries(character).map((e) => {
    const spec = INJURIES[e.id] || {};
    const p = e.prosthetic ? PROSTHETICS[e.prosthetic] : null;
    return {
      id: e.id, year: e.year, from: e.from, side: e.side,
      name: spec.name || e.id,
      desc: spec.desc || '',
      prosthetic: p ? p.name : null,
      fixable: !!spec.prosthetic && !e.prosthetic,
      needs: spec.prosthetic || null,
    };
  });
}

/** Something you can have fitted, and what it costs you to be without it. */
export function prostheticOptions(character) {
  return injuries(character)
    .filter((e) => !e.prosthetic && INJURIES[e.id] && INJURIES[e.id].prosthetic)
    .map((e) => ({ entry: e, spec: INJURIES[e.id], part: PROSTHETICS[INJURIES[e.id].prosthetic] }));
}

/** Fit one. Gives most of the lost ground back, and none of the lost flesh. */
export function fitProsthetic(state, injuryId, quality = 1) {
  const c = state.character;
  const entry = injuries(c).find((e) => e.id === injuryId && !e.prosthetic);
  if (!entry) return { ok: false, text: 'Nothing to fit.' };
  const spec = INJURIES[injuryId];
  const part = PROSTHETICS[spec.prosthetic];
  if (!part) return { ok: false, text: 'Nothing to fit.' };

  entry.prosthetic = part.id;
  entry.quality = quality;
  // Give back most of what the injury took, scaled by how good the work is.
  const back = part.restores * quality;
  for (const [k, v] of Object.entries(spec.stats || {})) {
    c.stats[k] = clamp((c.stats[k] || 0) - v * back, 1, 100);
  }
  for (const [k, v] of Object.entries(part.stats || {})) {
    c.stats[k] = clamp((c.stats[k] || 0) + v * quality, 1, 100);
  }
  c.power = Math.max(1, Math.round(c.power / (spec.powerMult + (1 - spec.powerMult) * (1 - back))));
  return {
    ok: true, part,
    text: `${part.name.charAt(0).toUpperCase()}${part.name.slice(1)}, fitted and calibrated. `
      + (quality >= 1 ? 'It moves like the original did, near enough.'
        : 'It is not the original. It will do.'),
  };
}

/** Undo everything: a wish, a Namekian healer, a proper regeneration tank. */
export function restoreBody(state) {
  const c = state.character;
  const list = injuries(c);
  if (!list.length) return { ok: false, text: 'There is nothing to put back.' };
  for (const e of list) {
    const spec = INJURIES[e.id];
    if (!spec) continue;
    if (!e.prosthetic) {
      applyInjuryStats(c, spec, -1);
      c.power = Math.max(1, Math.round(c.power / spec.powerMult));
    }
    if (e.id === 'lost_tail' && getRace(c.raceId).perks.includes('oozaru')) c.tail = true;
    if (spec.mark) c.scars = (c.scars || []).filter((s) => s.mark !== spec.mark);
  }
  const n = list.length;
  c.injuries = [];
  return { ok: true, text: `Everything that was taken off you is back on. ${n === 1 ? 'It' : 'All of it'} works.` };
}
