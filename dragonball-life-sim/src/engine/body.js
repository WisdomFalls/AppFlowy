// What a fight takes and does not give back.
//
// Scars are cosmetic. These are not: an arm you no longer have, an eye that
// stopped working, a tail somebody cut off. Each one costs something real and
// permanently, and each one has an answer - a prosthetic, a regeneration, a
// wish - that costs something else.

import { clamp } from './rng.js';
import { getRace, hasPerk, raceHasTail } from '../data/races.js';

export const INJURIES = {
  lost_arm: {
    id: 'lost_arm', name: 'a missing arm', mark: 'missing_arm', side: true,
    desc: 'Taken off above the elbow. You have relearned everything one-handed.',
    stats: { strength: -10, technique: -8 }, powerMult: 0.82,
    prosthetic: 'mech_arm',
  },
  lost_hand: {
    id: 'lost_hand', name: 'a missing hand', mark: 'scar_arm', side: true,
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
    id: 'lost_leg', name: 'a missing leg', mark: 'missing_leg', side: true,
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
  // Blunt force does not take a limb - it breaks what is under the skin and
  // leaves the limb attached and wrong. Blade injuries above already read as
  // a cutting effect (lost the piece cleanly); this is the same severity
  // read a different way.
  shattered_knee: {
    id: 'shattered_knee', name: 'a knee that never set right', mark: null,
    desc: 'Something in there is still in pieces. You favour it without meaning to.',
    stats: { speed: -9, strength: -3 }, powerMult: 0.9,
  },
  missing_fingers: {
    id: 'missing_fingers', name: 'a hand missing fingers', mark: 'scar_arm', side: true,
    desc: 'Not the whole hand. Enough of it that grip is a conscious act now.',
    stats: { technique: -5 }, powerMult: 0.96,
  },
  burned_badly: {
    id: 'burned_badly', name: 'burn scarring across half your body', mark: 'burn_face',
    desc: 'Ki does not cut. It cooks. The skin healed over, eventually, in a way that does not match the rest of you.',
    stats: { charisma: -4, durability: -4 }, powerMult: 0.93,
  },
  // Not a wound with an edge to it - something inside just stopped, the way
  // Vegeta's heart gave out from the Heart Virus. A senzu bean and a year's
  // rest do not fix this; a real replacement does.
  organ_failure: {
    id: 'organ_failure', name: 'an organ that no longer works on its own', mark: null,
    desc: 'Something in you gave out. Nothing about how you fight looks different, right up until it matters.',
    stats: { durability: -14, discipline: -3 }, powerMult: 0.8,
    prosthetic: 'artificial_organ',
  },
};

export const PROSTHETICS = {
  mech_arm: { id: 'mech_arm', name: 'a mechanical arm', restores: 0.85, stats: { strength: 4 }, mark: 'cyber_arm' },
  mech_leg: { id: 'mech_leg', name: 'a mechanical leg', restores: 0.85, stats: { speed: 3 }, mark: 'cyber_leg' },
  mech_eye: { id: 'mech_eye', name: 'an artificial eye', restores: 0.9, stats: { technique: 2 }, mark: 'cyber_eye' },
  artificial_organ: { id: 'artificial_organ', name: 'an artificial organ', restores: 0.8, stats: { durability: 2 }, mark: null },
};

/** Who can fit one, and how well, in a given year and place. */
export const FITTERS = [
  { id: 'capsule', name: 'Capsule Corporation', quality: 1.0, cost: 400000, from: 750,
    where: ['earth'], blurb: 'Bulma has done stranger jobs and will bill you for this one.' },
  { id: 'gero', name: 'a Red Ribbon research annexe', quality: 1.0, cost: 0, from: 745, until: 767,
    where: ['earth'], karma: -12,
    blurb: 'They will do it for nothing, and there is a reason it is for nothing.' },
  { id: 'imperial', name: 'a Frieza Force medical bay', quality: 0.85, cost: 120000, from: 730,
    where: ['frieza_79'], karma: -4, blurb: 'Standard issue. They fit hundreds a year and it shows.' },
  { id: 'local', name: 'a back-street engineer', quality: 0.6, cost: 45000, from: 700,
    where: null, blurb: 'They mostly do agricultural machinery. They are willing to try.' },
];

export function fittersFor(year, planetId) {
  return FITTERS.filter((f) => year >= f.from && (!f.until || year <= f.until)
    && (!f.where || f.where.includes(planetId)));
}

export function injuries(character) {
  return character.injuries || (character.injuries = []);
}

export function hasInjury(character, id) {
  return injuries(character).some((i) => i.id === id);
}

/**
 * Take a permanent injury. Returns the line to show, or null if it did not
 * apply (already have it, or the body regrows it before anyone can notice).
 * Takes the character directly - the player's, or an ally's or captive's -
 * so a fight or a bad accident can maim anyone the same way.
 */
export function maim(c, rng, id, from, opts = {}) {
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
  entry.statLedger = {};
  bumpStats(c, spec.stats, 1, 1, entry.statLedger);
  entry.powerLedger = c.power;
  c.power = Math.max(1, Math.round(c.power * spec.powerMult));
  entry.powerLedger = entry.powerLedger - c.power;

  return opts.text || `You lose ${entry.side ? 'the ' + entry.side + ' one' : 'it'}. ${spec.desc}`;
}

function applyInjuryStats(character, spec, sign) {
  for (const [k, v] of Object.entries(spec.stats || {})) {
    character.stats[k] = clamp(Math.round((character.stats[k] || 0) + v * sign), 1, 100);
  }
}

/**
 * Apply a stat change and record exactly what was applied, so undoing it later
 * returns the character to the number they started on rather than to whatever
 * rounding leaves behind.
 */
function bumpStats(character, stats, sign, scale = 1, ledger = null) {
  for (const [k, v] of Object.entries(stats || {})) {
    const before = character.stats[k] || 0;
    const after = clamp(Math.round(before + v * sign * scale), 1, 100);
    character.stats[k] = after;
    if (ledger) ledger[k] = (ledger[k] || 0) + (after - before);
  }
}

function undoLedger(character, ledger) {
  for (const [k, v] of Object.entries(ledger || {})) {
    character.stats[k] = clamp(Math.round((character.stats[k] || 0) - v), 1, 100);
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

/** Fit one. Gives most of the lost ground back, and none of the lost flesh.
 * Takes the character directly, same as maim() - the player's own, or
 * whoever an engineer is actually working on. */
export function fitProsthetic(c, injuryId, quality = 1) {
  const entry = injuries(c).find((e) => e.id === injuryId && !e.prosthetic);
  if (!entry) return { ok: false, text: 'Nothing to fit.' };
  const spec = INJURIES[injuryId];
  const part = PROSTHETICS[spec.prosthetic];
  if (!part) return { ok: false, text: 'Nothing to fit.' };

  entry.prosthetic = part.id;
  entry.quality = quality;
  // The portrait stops showing a stump and starts showing what replaced it.
  if (spec.mark) c.scars = (c.scars || []).filter((s) => s.mark !== spec.mark);
  if (part.mark) {
    c.scars = c.scars || [];
    c.scars.push({ year: c.birthYear + c.age, mark: part.mark, from: 'fitted', text: `${part.name}, fitted.` });
  }
  // Give back most of what the injury took, scaled by how good the work is.
  const back = part.restores * quality;
  entry.restored = back;
  entry.fitLedger = {};
  bumpStats(c, spec.stats, -1, back, entry.fitLedger);
  bumpStats(c, part.stats, 1, quality, entry.fitLedger);
  const powerBefore = c.power;
  c.power = Math.max(1, Math.round(c.power + entry.powerLedger * back));
  entry.fitPower = c.power - powerBefore;
  return {
    ok: true, part,
    text: `${part.name.charAt(0).toUpperCase()}${part.name.slice(1)}, fitted and calibrated. `
      + (quality >= 1 ? 'It moves like the original did, near enough.'
        : 'It is not the original. It will do.'),
  };
}

/** Undo everything: a wish, a Namekian healer, a proper regeneration tank.
 * Takes the character directly, same as maim() and fitProsthetic(). */
export function restoreBody(c) {
  const list = injuries(c);
  if (!list.length) return { ok: false, text: 'There is nothing to put back.' };
  for (const e of list) {
    const spec = INJURIES[e.id];
    if (!spec) continue;
    // Reverse exactly what was applied, in the order it was applied.
    if (e.prosthetic) {
      undoLedger(c, e.fitLedger);
      if (e.fitPower) c.power = Math.max(1, c.power - e.fitPower);
    }
    undoLedger(c, e.statLedger);
    if (e.powerLedger) c.power = Math.max(1, c.power + e.powerLedger);
    if (e.id === 'lost_tail' && raceHasTail(c.raceId)) c.tail = true;
    if (spec.mark) c.scars = (c.scars || []).filter((s) => s.mark !== spec.mark);
    const part = e.prosthetic ? PROSTHETICS[e.prosthetic] : null;
    if (part && part.mark) c.scars = (c.scars || []).filter((s) => s.mark !== part.mark);
  }
  const n = list.length;
  c.injuries = [];
  return { ok: true, text: `Everything that was taken off you is back on. ${n === 1 ? 'It' : 'All of it'} works.` };
}

/**
 * A body a senzu bean cannot touch, put back together with hardware instead
 * of flesh. Partial fits whatever is currently missing and stops there;
 * full does the same and then gives the rest of the body an overhaul on
 * top of it - the "Full Mecha Android Saiyan" reading of the request,
 * where the species never changes, only how much of it is still organic.
 */
export function mechanize(c, degree = 'partial') {
  const fitted = [];
  for (const opt of prostheticOptions(c)) {
    const res = fitProsthetic(c, opt.entry.id, degree === 'full' ? 1 : 0.85);
    if (res.ok) fitted.push(res.part.name);
  }
  c.flags = c.flags || {};
  const before = c.power;
  if (degree === 'full') {
    c.flags.full_mecha = true;
    c.flags.partial_mecha = false;
    c.power = Math.max(1, Math.round(c.power * 1.4));
    c.stats.durability = clamp(Math.round(c.stats.durability + 12), 1, 100);
    c.stats.strength = clamp(Math.round(c.stats.strength + 6), 1, 100);
  } else {
    c.flags.partial_mecha = true;
    c.power = Math.max(1, Math.round(c.power * 1.15));
    c.stats.durability = clamp(Math.round(c.stats.durability + 5), 1, 100);
  }
  return {
    ok: true, fitted, gained: c.power - before,
    text: degree === 'full'
      ? `Full mechanization. ${fitted.length ? `Everything that was gone - ${fitted.join(', ')} - is metal now, and so is a great deal that was not gone.` : 'Nothing was missing, and the overhaul still touches all of it.'} Whatever you were, you are also something else now.`
      : `Partial mechanization. ${fitted.length ? `${fitted.join(', ')}, replaced in one long session.` : 'There was nothing to fit, so the work stops at what was already lost.'}`,
  };
}
