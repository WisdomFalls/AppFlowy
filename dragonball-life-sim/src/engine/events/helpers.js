// Shared machinery for event templates.

import { clamp } from '../rng.js';
import { addFact, openThread, findThread, advanceThread } from '../memory.js';
import { adjust, addNpc, findNpc, setFlag, setWorldFlag } from '../state.js';
import { makeNpc, makeCanonNpc, nextNpcId, bondScore } from '../npc.js';
import { canonAvailable, getCanon, canonPower, canonPlace } from '../../data/canon.js';
import { trainingRate, combatPower, powerTier } from '../stats.js';
import { createBattle, autoResolve, battleAftermath } from '../battle.js';
import { getPlace, PLACES } from '../../data/places.js';
import { zeni, numberish } from '../text.js';
import { currencyFor, priceIn, formatMoney } from '../../data/currency.js';

/** Apply changes and return a change summary for the log. */
export function apply(ctx, changes) {
  adjust(ctx.state, changes);
  return summarise(changes);
}

export function summarise(changes = {}) {
  const out = [];
  const label = {
    health: 'Health', happiness: 'Happiness', ki: 'Ki', fame: 'Fame',
    karma: 'Karma', zeni: 'Zeni', power: 'Power',
  };
  for (const [k, v] of Object.entries(changes)) {
    if (k === 'stats') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sv) out.push({ key: sk, delta: sv });
      }
    } else if (k === 'powerMult') {
      if (v !== 1) out.push({ key: 'Power', delta: null, note: `x${v.toFixed(2)}` });
    } else if (label[k] && v) {
      out.push({ key: label[k], delta: v });
    }
  }
  return out;
}

export function fact(ctx, text, opts = {}) {
  return addFact(ctx.memory, {
    type: opts.type || 'event',
    text,
    year: ctx.age,
    weight: opts.weight ?? 1,
    subject: opts.subject || null,
    tags: opts.tags || [],
  });
}

/** Create and register a stranger appropriate to here and now. */
export function stranger(ctx, opts = {}) {
  const npc = makeNpc(ctx.rng, {
    year: ctx.year,
    placeId: ctx.character.placeId,
    powerScale: opts.powerScale ?? 1,
    ...opts,
  });
  if (opts.powerTarget) npc.power = Math.max(1, Math.round(opts.powerTarget));
  addNpc(ctx.state, npc);
  return npc;
}

/** Introduce a canon character into the player's life, once. */
export function meetCanon(ctx, canonId, relation = 'acquaintance') {
  const existing = findNpc(ctx.state, 'canon_' + canonId);
  if (existing) return existing;
  const npc = makeCanonNpc(ctx.rng, canonId, ctx.year, relation);
  if (!npc) return null;
  addNpc(ctx.state, npc);
  fact(ctx, `Met ${npc.name}.`, { type: 'met', weight: 3, subject: npc.id, tags: ['canon'] });
  return npc;
}

/**
 * Canon characters plausibly present. Not "alive somewhere in the universe" -
 * standing on this planet, in this year, according to where the series had
 * them. Meeting Goku on Yardrat in 745 is a bug, not a cameo.
 */
export function canonHere(ctx, filter = () => true) {
  return canonAvailable(ctx.year, (c) => {
    if (!filter(c)) return false;
    const at = getPlace(canonPlace(c, ctx.year));
    if (!at) return true;
    if (at.id === ctx.character.placeId) return true;
    if (at.planet === ctx.place.planet) return true;
    // The gods go where they like, and the dead are all in one place.
    if (c.tags.includes('divine') && ctx.place.tags.includes('divine')) return true;
    if (ctx.character.inAfterlife && at.planet === 'otherworld') return true;
    return false;
  });
}

/** Everyone from the series who is on a given world this year. */
export function canonOnPlanet(year, planetId) {
  return canonAvailable(year, (c) => {
    const at = getPlace(canonPlace(c, year));
    return at && at.planet === planetId;
  });
}

export function relate(ctx, npc, changes = {}) {
  if (!npc) return;
  if (changes.closeness) npc.closeness = clamp(npc.closeness + changes.closeness, 0, 100);
  if (changes.respect) npc.respect = clamp(npc.respect + changes.respect, 0, 100);
  if (changes.tension) npc.tension = clamp(npc.tension + changes.tension, 0, 100);
  if (changes.romance) npc.romance = clamp(npc.romance + changes.romance, 0, 100);
  // Trust is a real field on every NPC and callers have been passing it for a
  // while; it was silently dropped here.
  if (changes.trust) npc.trust = clamp((npc.trust ?? 30) + changes.trust, 0, 100);
  if (changes.knowledge) npc.knowledge = Math.min(4, (npc.knowledge || 0) + changes.knowledge);
  if (changes.relation) npc.relation = changes.relation;
  if (changes.power) npc.power = Math.max(1, Math.round(npc.power * changes.power));
  if (changes.note) npc.history.push({ year: ctx.year, note: changes.note });
}

export function killNpc(ctx, npc, cause) {
  if (!npc || !npc.alive) return;
  npc.alive = false;
  npc.deadSince = ctx.year;
  npc.causeOfDeath = cause || 'unknown';
  fact(ctx, `${npc.name} died. ${cause ? cause + '.' : ''}`.trim(), {
    type: 'death', weight: 5, subject: npc.id, tags: ['loss'],
  });
}

/** Open (or heat up) a running arc. */
export function thread(ctx, kind, subject, opts = {}) {
  const existing = findThread(ctx.memory, kind, subject);
  if (existing) {
    existing.heat = clamp(existing.heat + (opts.heat ?? 10), 0, 100);
    existing.lastYear = ctx.year;
    return existing;
  }
  return openThread(ctx.memory, {
    kind, subject, year: ctx.year,
    title: opts.title || kind,
    maxStage: opts.maxStage ?? 3,
    heat: opts.heat ?? 50,
    data: opts.data || {},
  });
}

export function bumpThread(ctx, kind, subject, heat = 8) {
  const t = findThread(ctx.memory, kind, subject);
  if (t) advanceThread(ctx.memory, t, ctx.year, heat);
  return t;
}

/** One year's training, returning power gained and any injury. */
export function trainYear(ctx, opts = {}) {
  const c = ctx.character;
  const gearMult = c.items.includes('gravity_chamber') ? 2.1
    : c.items.includes('gravity_capsule') ? 1.6
      : c.items.includes('heavy_weights') ? 1.4
        : c.items.includes('weighted_clothing') ? 1.25 : 1;
  const rate = trainingRate(c, {
    state: ctx.state,
    intensity: opts.intensity ?? 1,
    placeMult: opts.placeMult ?? ctx.place.training,
    mentorMult: opts.mentorMult ?? 1,
    gearMult,
  });
  const before = c.power;
  const gained = Math.max(1, Math.round(before * rate));
  c.power = before + gained;
  c.peakPower = Math.max(c.peakPower, c.power);

  let injury = 0;
  const risk = (opts.intensity ?? 1) * 0.07 + (c.items.includes('gravity_chamber') ? 0.06 : 0);
  if (ctx.rng.chance(risk)) injury = ctx.rng.int(6, 26);
  return { gained, rate, injury, total: c.power };
}

export function powerLine(gained) {
  // Varied so that three training years in a row do not read as three copies
  // of the same sentence.
  return `{Power level up ${numberish(gained)}|Power level: up ${numberish(gained)}|+${numberish(gained)} power level|Power level rises ${numberish(gained)}}.`;
}

/** Somewhere else to be, biased toward interesting places. */
export function elsewhere(ctx, filter = () => true) {
  const pool = PLACES.filter((p) => p.id !== ctx.character.placeId && filter(p));
  return ctx.rng.pick(pool);
}

export function moveTo(ctx, placeId) {
  ctx.character.placeId = placeId;
  const p = getPlace(placeId);
  fact(ctx, `Moved to ${p.name}.`, { type: 'move', weight: 2, tags: ['travel'] });
  return p;
}

/** Format a Zeni figure for choice hints. */
export function money(n) {
  return zeni(n);
}

/**
 * The same figure, said the way it would actually be said here. Prices and
 * payouts are authored in Zeni-equivalent value everywhere in the engine
 * (character.zeni stays that internal accounting unit - see the comment on
 * priceIn() in currency.js) but a Sadala-born Saiyan has never held a Zeni
 * note and should not be told a price in one. This is purely a display
 * conversion: it changes what a line of narration says, never what
 * character.zeni actually holds or what a choice is gated on.
 */
export function localMoney(ctx, amount) {
  const cur = currencyFor(getPlace(ctx.character.placeId).planet);
  return formatMoney(priceIn(amount, cur.id), cur.id);
}

export function canAfford(ctx, amount) {
  return ctx.character.zeni >= amount;
}

/** Standard "you got hurt" bundle. */
export function hurt(ctx, amount, note) {
  const changes = { health: -amount, happiness: -Math.round(amount / 4) };
  apply(ctx, changes);
  return note || '';
}

export function odds(ctx, p) {
  return ctx.rng.chance(clamp(p, 0.01, 0.99));
}

/** Scale a threat to the player, so encounters stay meaningful all game. */
export function scaledFoePower(ctx, factor = 1, spread = 0.5) {
  const mine = combatPower(ctx.character);
  const anchor = Math.max(mine, ctx.baseline * 0.02);
  return Math.max(1, Math.round(anchor * factor * ctx.rng.float(1 - spread, 1 + spread)));
}

export function tierOf(power) {
  return powerTier(power);
}

/**
 * Hand a fight to the player, or resolve it headlessly when nothing is driving
 * the UI (the soak harness, tests, background brackets). Either way the caller
 * gets a `text` it can show and the world gets the same consequences.
 */
/** How somebody sounds in a fight, taken from who they are. */
function voiceFor(foe, ctx) {
  const canon = foe.canonId ? getCanon(foe.canonId) : null;
  const temperament = (canon && canon.temperament) || foe.temperament || '';
  const tags = (canon && canon.tags) || foe.tags || [];
  if (/cruel|cold|capricious|vain/.test(temperament) || tags.includes('villain') || tags.includes('emperor')) return 'cruel';
  if (/cheerful|earnest|childish|warm|brash/.test(temperament) || tags.includes('comic')) return 'cheerful';
  if (/proud|fierce|prickly|unstable/.test(temperament) || tags.includes('rival') || tags.includes('saiyan')) return 'proud';
  if (/timid|shy|coward/.test(temperament)) return 'frightened';
  return 'professional';
}

/**
 * Break one nominal enemy into a squad of named bodies. A "purge squad" is
 * five people, and it should fight like five people rather than like one
 * person with five times the health.
 */
export function squadOf(ctx, foe, count, opts = {}) {
  const n = Math.max(1, Math.min(6, Math.round(count)));
  if (n === 1) return [foe];
  const names = opts.names || null;
  // The leader carries most of it; the rest are the rest.
  const share = [0.42, 0.2, 0.14, 0.1, 0.08, 0.06].slice(0, n);
  const total = share.reduce((a, b) => a + b, 0);
  return share.map((w, i) => ({
    ...foe,
    name: names && names[i] ? names[i]
      : i === 0 ? (opts.leaderName || `${foe.name} - the one in charge`)
        : `${opts.memberName || 'one of them'} (${i + 1})`,
    power: Math.max(1, Math.round(foe.power * (w / total) * n * 0.62)),
    speedStat: (foe.speedStat ?? 50) + (i === 0 ? 6 : -4),
    canonId: i === 0 ? foe.canonId : null,
    npcId: i === 0 ? foe.npcId : null,
  }));
}

export function offerBattle(ctx, foe, opts = {}) {
  // A spar against somebody with an actual NPC record is only as honest as
  // they are - they show what npc.sparRestraint says they show, same as the
  // dedicated Spar action does. A generated one-off opponent (Hell, most
  // duels) has no record to read and just fights at what it was given.
  if ((opts.stakes || 'serious') === 'spar' && foe.restraint === undefined) {
    const npcId = opts.npcId || foe.npcId;
    const npc = npcId ? ctx.state.npcs[npcId] : null;
    if (npc) foe.restraint = npc.sparRestraint ?? 1;
  }
  const spec = {
    foe,
    foes: opts.foes || null,
    allies: opts.allies || null,
    stakes: opts.stakes || 'serious',
    reason: opts.reason || 'fight',
    protecting: !!opts.protecting,
    placeId: opts.placeId || ctx.character.placeId,
    intro: opts.intro || '',
    voice: opts.voice || voiceFor(foe, ctx),
    speedStat: foe.speedStat ?? (foe.stats && foe.stats.speed) ?? 50,
    context: {
      reason: opts.reason || 'fight',
      npcId: opts.npcId || foe.npcId || null,
      canonId: opts.canonId || foe.canonId || null,
      timelineId: opts.timelineId || null,
      // A caller-supplied context (factionId, and anything else a future
      // caller adds) used to be silently discarded here, rebuilt from
      // scratch with only the four fields above - which meant
      // battle.context.factionId never actually existed downstream.
      ...opts.context,
    },
  };

  if (!ctx.state.autoBattle) {
    return { text: opts.intro || '', battle: spec };
  }

  const battle = createBattle(ctx.state, ctx.rng, spec);
  autoResolve(ctx.state, ctx.rng, battle);
  const after = battleAftermath(ctx.state, ctx.rng, battle, opts);
  const summary = battle.outcome === 'won'
    ? `${foe.name} goes down.`
    : battle.outcome === 'lost' ? `${foe.name} puts you on the ground.`
      : battle.outcome === 'fled' ? 'You break off and go.'
        : `Neither of you finishes it.`;
  return {
    text: [opts.intro || '', summary, after.text].filter(Boolean).join(' '),
    outcome: after.death ? { death: after.death } : null,
    battleResult: battle.outcome,
  };
}

export { bondScore, findNpc, setFlag, setWorldFlag, numberish, nextNpcId, getCanon, canonPower };
