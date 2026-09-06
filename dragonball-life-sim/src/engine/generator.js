// The event generator.
//
// Nothing here is a written scene. A template declares when it may fire, which
// entities it needs, a *shape* of prose, and a set of choices whose outcomes
// are computed from live state. Selection is weighted by fitness against the
// current situation and divided by how recently that exact shape was used, so
// the same beat with the same cast effectively cannot recur.

import { render } from './text.js';
import { noveltyWeight, remember, threadPressure } from './memory.js';
import { getRace, hasPerk, maturity } from '../data/races.js';
import { getPlace } from '../data/places.js';
import { eraName, worldPowerBaseline } from '../data/timeline.js';
import { combatPower, powerTier } from './stats.js';
import { currentYear, livingNpcs, findNpc } from './state.js';
import { applyAiEffects } from './aieffects.js';

const REGISTRY = new Map();

/** Register a template (or a list of them). */
export function registerEvents(templates) {
  for (const t of [].concat(templates)) {
    if (REGISTRY.has(t.id)) throw new Error('Duplicate event template id: ' + t.id);
    REGISTRY.set(t.id, t);
  }
}

export function allTemplates() {
  return Array.from(REGISTRY.values());
}

export function getTemplate(id) {
  return REGISTRY.get(id);
}

/** Everything a template needs to decide whether it fits and what to say. */
export function buildContext(state, rng) {
  const c = state.character;
  const year = currentYear(state);
  const place = getPlace(c.placeId);
  const race = getRace(c.raceId);
  return {
    state,
    rng,
    character: c,
    stats: c.stats,
    vitals: c.vitals,
    memory: state.memory,
    world: state.world,
    year,
    age: c.age,
    bioAge: maturity(c),
    place,
    race,
    era: eraName(year),
    power: combatPower(c),
    tier: powerTier(combatPower(c)),
    baseline: worldPowerBaseline(year),
    npcs: livingNpcs(state),
    flag: (f) => !!c.flags[f],
    worldFlag: (f) => !!state.world.flags[f],
    has: (t) => c.techniques.includes(t),
    hasForm: (t) => c.transformations.includes(t),
    hasItem: (i) => c.items.includes(i),
    perk: (p) => hasPerk(c, p),
    rel: (relation) => livingNpcs(state).filter((n) => n.relation === relation),
    ratio: combatPower(c) / Math.max(1, worldPowerBaseline(year)),
  };
}

function eligible(template, ctx) {
  // Some beats are once-in-a-life by nature: a first word, a first lesson.
  const uses = ctx.memory.templateUse[template.id] || 0;
  if (template.once && uses >= 1) return false;
  if (template.maxUses !== undefined && uses >= template.maxUses) return false;
  if (template.minAge !== undefined && ctx.age < template.minAge) return false;
  if (template.maxAge !== undefined && ctx.age > template.maxAge) return false;
  if (template.minBioAge !== undefined && ctx.bioAge < template.minBioAge) return false;
  if (template.maxBioAge !== undefined && ctx.bioAge > template.maxBioAge) return false;
  if (template.minYear !== undefined && ctx.year < template.minYear) return false;
  if (template.maxYear !== undefined && ctx.year > template.maxYear) return false;
  if (template.races && !template.races.includes(ctx.character.raceId)) return false;
  if (template.notRaces && template.notRaces.includes(ctx.character.raceId)) return false;
  if (template.placeTags && !template.placeTags.some((t) => ctx.place.tags.includes(t))) return false;
  if (template.requiresAfterlife && !ctx.character.inAfterlife) return false;
  if (!template.requiresAfterlife && ctx.character.inAfterlife && !template.allowAfterlife) return false;
  if (template.when && !template.when(ctx)) return false;
  return true;
}

/**
 * Pick a template. `bias` lets the director push categories without hard-coding
 * a script: it multiplies weights for templates carrying matching tags.
 */
export function selectTemplate(ctx, opts = {}) {
  const bias = opts.bias || {};
  const exclude = new Set(opts.exclude || []);
  const pool = [];

  for (const t of REGISTRY.values()) {
    if (exclude.has(t.id)) continue;
    if (!eligible(t, ctx)) continue;

    let slots;
    try {
      slots = t.slots ? t.slots(ctx) : {};
    } catch (err) {
      continue;
    }
    if (slots === null || slots === undefined) continue;

    let w = typeof t.weight === 'function' ? t.weight(ctx) : (t.weight ?? 10);
    if (!(w > 0)) continue;

    for (const tag of t.tags || []) {
      if (bias[tag]) w *= bias[tag];
    }
    w *= noveltyWeight(ctx.memory, t.id, slots, ctx.year, { fatigue: !t.noFatigue });
    if (w <= 0) continue;
    pool.push({ template: t, slots, weight: w });
  }

  if (!pool.length) return null;
  return ctx.rng.weighted(pool, (p) => p.weight);
}

/** Turn a chosen template + slots into a presentable event. */
export function materialise(ctx, template, slots) {
  const rng = ctx.rng;
  const view = { ...slots, ...viewOf(ctx) };
  const title = render(typeof template.title === 'function' ? template.title(ctx, slots) : template.title, view, rng);
  const bodySrc = typeof template.text === 'function' ? template.text(ctx, slots) : template.text;
  const text = render(bodySrc, view, rng);

  const rawChoices = (template.choices ? template.choices(ctx, slots) : []) || [];
  const choices = rawChoices
    .filter((ch) => !ch.hidden)
    .map((ch, i) => ({
      id: ch.id || `c${i}`,
      label: render(ch.label, view, rng),
      hint: ch.hint ? render(ch.hint, view, rng) : null,
      danger: ch.danger || false,
      locked: ch.locked || false,
      lockReason: ch.lockReason || null,
      freeText: !!ch.freeText,
      placeholder: ch.placeholder || null,
      interpret: ch.interpret || null,
    }));

  return {
    templateId: template.id,
    slots,
    title,
    text,
    tags: template.tags || [],
    choices,
    kind: template.kind || 'event',
    aiHint: typeof template.aiHint === 'function' ? template.aiHint(ctx, slots) : template.aiHint || null,
  };
}

function viewOf(ctx) {
  return {
    me: ctx.character.name,
    age: ctx.age,
    year: ctx.year,
    place: ctx.place.name,
    placeDesc: ctx.place.desc,
    race: ctx.race.name,
    era: ctx.era,
    tier: ctx.tier,
  };
}

/**
 * Build a specific template regardless of weighting. Used for events the world
 * imposes on you - a canon saga arriving, a scripted beat you cannot dodge.
 */
export function forceEvent(state, rng, templateId, extra = {}) {
  const template = REGISTRY.get(templateId);
  if (!template) return null;
  const ctx = buildContext(state, rng);
  if (extra.evId) ctx.forceEvId = extra.evId;
  // Whatever the caller wants the forced card to know about itself.
  ctx.forceSlots = extra;
  let slots;
  try { slots = template.slots ? template.slots(ctx) : {}; } catch (err) { return null; }
  if (slots === null || slots === undefined) return null;
  const event = materialise(ctx, template, Object.assign(slots, extra));
  event.forced = true;
  return event;
}

/** Full pipeline: pick something that fits, and build it. */
export function generateEvent(state, rng, opts = {}) {
  const ctx = buildContext(state, rng);
  const picked = selectTemplate(ctx, opts);
  if (!picked) return null;
  const event = materialise(ctx, picked.template, picked.slots);
  return event;
}

/** Apply a chosen option. Returns the outcome block for the log. */
export function resolveChoice(state, rng, event, choiceId, params = null) {
  // Model-authored events carry their outcomes inline so that they survive a
  // save/load cycle without needing anything in the template registry.
  if (event.ai) {
    const choice = event.choices.find((c) => c.id === choiceId) || event.choices[0];
    const applied = choice ? applyAiEffects(state, rng, choice.effects) : { notes: [] };
    const text = [choice ? choice.outcome : 'The moment passes.', ...(applied.notes || [])].join(' ');
    remember(state.memory, {
      templateId: event.templateId, slots: { title: event.title },
      year: currentYear(state), title: event.title, text, tags: event.tags,
    });
    return { text, facts: [], tags: event.tags, followUp: null, outcome: null };
  }

  const template = REGISTRY.get(event.templateId);
  if (!template) return { text: 'The moment passes.', changes: {} };
  const ctx = buildContext(state, rng);
  // Anything the player typed or picked alongside the choice travels with it.
  ctx.params = params || {};
  ctx.forceSlots = event.slots || {};
  const choices = (template.choices ? template.choices(ctx, event.slots) : []) || [];
  const choice = choices.find((c, i) => (c.id || `c${i}`) === choiceId) || choices[0];
  if (!choice || !choice.effect) {
    return { text: 'Nothing much comes of it.', changes: {} };
  }

  let result;
  try {
    result = choice.effect(ctx, event.slots, rng) || {};
  } catch (err) {
    result = { text: 'It does not go the way anyone expected.', error: String(err && err.message) };
  }

  const view = { ...event.slots, ...viewOf(ctx), ...(result.view || {}) };
  const text = render(result.text || '', view, rng);

  remember(state.memory, {
    templateId: event.templateId,
    slots: event.slots,
    year: ctx.year,
    title: event.title,
    text,
    tags: event.tags,
  });

  return {
    text,
    facts: result.facts || [],
    tags: result.tags || [],
    followUp: result.followUp || null,
    aiHint: result.aiHint || null,
    outcome: result.outcome || null,
    battle: result.battle || null,
    tournament: result.tournament || null,
    // Handovers that take the year away from the event system: a bracket, the
    // survival board, or a trial the player has to actually play.
    survival: result.survival || null,
    trial: result.trial || null,
    hunt: result.hunt || null,
    followUpSlots: result.followUpSlots || null,
  };
}

/**
 * The director's bias table. It reads pressure from open threads and the
 * character's situation and nudges categories, which is what keeps a life
 * feeling like it has a plot rather than a shuffle of unrelated incidents.
 */
export function directorBias(state, ctx) {
  const bias = {};
  const c = state.character;

  const pressures = threadPressure(state.memory, ctx.year);
  if (pressures.length && pressures[0].pressure > 40) {
    const t = pressures[0].thread;
    bias[t.kind] = 2.6;
    bias.thread = 2.2;
  }

  // Under-powered for the era: push training and mentors.
  if (ctx.ratio < 0.05) { bias.training = 1.8; bias.mentor = 1.7; bias.opportunity = 1.4; }
  if (ctx.ratio > 3) { bias.threat = 1.9; bias.cosmic = 1.7; bias.fame = 1.3; }

  if (c.vitals.happiness < 30) { bias.social = 1.6; bias.comfort = 1.8; }
  if (c.vitals.health < 40) { bias.recovery = 2.0; bias.quiet = 1.5; }
  if (!c.career && ctx.bioAge > 17 && ctx.bioAge < 60) bias.career = 1.7;
  if (livingNpcs(state).filter((n) => ['friend', 'bestfriend', 'lover', 'spouse'].includes(n.relation)).length === 0) {
    bias.social = (bias.social || 1) * 1.8;
  }
  if (c.techniques.length < 3 && ctx.bioAge > 10) bias.technique = 1.6;
  if (c.karma < -40) bias.villain = 1.6;
  if (c.karma > 40) bias.hero = 1.5;
  if (c.fame > 50) bias.fame = (bias.fame || 1) * 1.4;

  return bias;
}

/** Helper for templates: a living NPC matching a filter, or null. */
export function pickNpc(ctx, filter = () => true) {
  const pool = ctx.npcs.filter(filter);
  if (!pool.length) return null;
  return ctx.rng.pick(pool);
}

export function npcSlot(npc) {
  if (!npc) return null;
  return { npcId: npc.id, npcName: npc.name, npcRelation: npc.relation };
}

export function slotNpc(state, slots) {
  return slots && slots.npcId ? findNpc(state, slots.npcId) : null;
}
