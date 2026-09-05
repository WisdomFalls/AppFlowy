// The turn loop. A year is: passive drift, then a short queue of generated
// events the player answers one at a time, then the bookkeeping.

import { clamp } from './rng.js';
import { render } from './text.js';
import { generateEvent, resolveChoice, buildContext, directorBias } from './generator.js';
import { addFact, recallSummary } from './memory.js';
import { relationshipTick, makeNpc, makeChild } from './npc.js';
import { getRace, hasPerk } from '../data/races.js';
import { getPlace } from '../data/places.js';
import { TIMELINE, eraName, worldPowerBaseline } from '../data/timeline.js';
import { agingDecay, naturalDeathChance, combatPower, powerTier, kiMaxFor, lifeExpectancy, STAT_KEYS } from './stats.js';
import { getRng, saveRng, currentYear, livingNpcs, adjust, place as placeOf, characterSummary } from './state.js';
import { getCareer } from '../data/jobs.js';
import { getItem } from '../data/items.js';

const DEATH_CAUSES = {
  age: ['Old age', 'The body simply stopped', 'Died in their sleep'],
  health: ['Injuries that never healed', 'A body used past its limits', 'Complications, finally'],
};

/** Begin a new year. Returns the first event, or null if nothing happens. */
export function startYear(state) {
  const rng = getRng(state);
  const c = state.character;

  c.age += 1;
  state.stats.yearsPlayed++;
  if (c.inAfterlife) c.yearsInAfterlife = (c.yearsInAfterlife || 0) + 1;

  const entries = [];
  entries.push(...passiveYear(state, rng));

  // Career bookkeeping
  if (c.career) {
    c.career.years += 1;
    const career = getCareer(c.career.id);
    const rung = career.rungs[c.career.rung];
    if (rung) adjust(state, { zeni: Math.round(rung.pay * 0.15) });
  }

  // Passive income and item effects
  for (const id of c.items) {
    const item = getItem(id);
    if (item && item.passive && item.passive.income) adjust(state, { zeni: item.passive.income });
  }
  if (c.techniques.includes('senzu_farming') && rng.chance(0.7)) c.senzu += 1;

  // NPCs live their own year.
  for (const npc of Object.values(state.npcs)) {
    if (npc.alive) {
      relationshipTick(rng, npc, c);
      const npcRace = getRace(npc.raceId);
      const npcSpan = npc.isCanon ? Infinity : (npcRace.lifespan[0] + npcRace.lifespan[1]) / 2;
      if (npc.age > npcSpan * 0.8 && rng.chance(0.02 + (npc.age - npcSpan * 0.8) * 0.01)) {
        npc.alive = false;
        npc.deadSince = currentYear(state);
        npc.causeOfDeath = 'age';
        entries.push({ kind: 'loss', text: `${npc.name} died this year. ${render('#grief#', {}, rng)}` });
        addFact(state.memory, { type: 'death', text: `${npc.name} died of old age.`, year: c.age, weight: 4, subject: npc.id, tags: ['loss'] });
        if (npc.closeness > 60) {
          adjust(state, { happiness: -14 });
          c.flags.grief = true;
        }
      }
    }
  }

  // How many events this year: busier lives generate more.
  let count = rng.weighted([1, 2, 3], (n) => [30, 50, 20][n - 1]);
  if (c.age < 4) count = 1;

  state.turn = {
    year: currentYear(state),
    age: c.age,
    count,
    used: [],
    queue: [],
    index: 0,
    entries,
    done: false,
  };

  // Events are generated one at a time rather than all at once, so the second
  // event of a year sees what the first one did to you.
  const first = nextGenerated(state, rng);
  if (first) state.turn.queue.push(first);
  else state.turn.done = true;

  saveRng(state, rng);
  if (state.turn.done) finishYear(state);
  return currentEvent(state);
}

/** Generate the next event for this year against current state. */
function nextGenerated(state, rng) {
  const t = state.turn;
  if (!t || t.used.length >= t.count) return null;
  const ctx = buildContext(state, rng);
  const bias = directorBias(state, ctx);
  const event = generateEvent(state, rng, { bias, exclude: t.used });
  if (!event) return null;
  t.used.push(event.templateId);
  return event;
}

/**
 * Splice a model-authored event into this year's queue. Called by the UI after
 * an async AI request resolves, so generation never blocks the turn.
 */
export function insertEvent(state, event) {
  const t = state.turn;
  if (!t || t.done || !event) return currentEvent(state);
  // If an event is already on screen, queue this one behind it. Splicing at the
  // current index would swap the card the player is reading out from under the
  // answer they are about to give.
  const at = t.queue[t.index] ? t.index + 1 : t.index;
  t.queue.splice(at, 0, event);
  t.count += 1;
  return t.queue[t.index];
}

/** How many events are still owed this year, for the UI's progress hint. */
export function eventsRemaining(state) {
  const t = state.turn;
  if (!t || t.done) return 0;
  return Math.max(0, t.count - t.used.length) + (t.queue.length - t.index - 1);
}

/** Replace the text of the most recent log entry, for AI re-narration. */
export function renarrateLast(state, text) {
  const t = state.turn;
  if (!t || !t.entries.length || !text) return;
  for (let i = t.entries.length - 1; i >= 0; i--) {
    if (t.entries[i].kind === 'event') {
      t.entries[i].outcome = text;
      t.entries[i].aiNarrated = true;
      return;
    }
  }
}

export function currentEvent(state) {
  const t = state.turn;
  if (!t || t.done) return null;
  return t.queue[t.index] || null;
}

/** Answer the current event. Returns the next event, or null when the year ends. */
export function choose(state, choiceId) {
  const t = state.turn;
  if (!t || t.done) return null;
  const event = t.queue[t.index];
  if (!event) {
    t.done = true;
    finishYear(state);
    return null;
  }

  const rng = getRng(state);
  const result = resolveChoice(state, rng, event, choiceId);
  saveRng(state, rng);

  t.entries.push({
    kind: 'event',
    title: event.title,
    text: event.text,
    outcome: result.text,
    tags: event.tags,
    templateId: event.templateId,
  });

  for (const f of result.facts || []) {
    addFact(state.memory, { type: f.type || 'event', text: f.text, year: state.character.age, weight: f.weight ?? 1, tags: f.tags || [] });
  }

  if (result.outcome && result.outcome.death) {
    die(state, result.outcome.death);
    t.done = true;
    return null;
  }
  if (result.outcome && result.outcome.reincarnate) {
    state.character.flags.reincarnated = true;
    t.done = true;
    finishYear(state);
    return null;
  }

  t.index += 1;
  if (t.index >= t.queue.length) {
    const rng2 = getRng(state);
    const more = nextGenerated(state, rng2);
    saveRng(state, rng2);
    if (more) {
      t.queue.push(more);
    } else {
      t.done = true;
      finishYear(state);
      return null;
    }
  }
  return t.queue[t.index];
}

/** Skip the rest of the year's events (used by "let it happen"). */
export function skipRemaining(state) {
  const t = state.turn;
  let guard = 0;
  while (t && !t.done && guard++ < 20) {
    const ev = t.queue[t.index];
    if (!ev) break;
    choose(state, ev.choices.length ? ev.choices[ev.choices.length - 1].id : 'c0');
  }
}

function passiveYear(state, rng) {
  const c = state.character;
  const race = getRace(c.raceId);
  const entries = [];

  // Physical drift
  const decay = agingDecay(c);
  if (decay > 0) {
    for (const k of ['strength', 'speed', 'durability']) {
      c.stats[k] = clamp(c.stats[k] - rng.float(0, decay), 1, 100);
    }
    if (decay > 1.5) c.stats.technique = clamp(c.stats.technique + rng.float(0, 0.4), 1, 100);
  }

  // Recovery and mood
  const heal = c.inAfterlife ? 30 : (16 + c.stats.durability * 0.2 + (hasPerk(c, 'regeneration') ? 25 : 0));
  adjust(state, { health: heal, ki: 999 });
  const moodDrift = rng.float(-4, 4)
    + (livingNpcs(state).filter((n) => n.closeness > 55).length * 0.8)
    - (c.career && c.career.performance < 30 ? 3 : 0);
  adjust(state, { happiness: moodDrift });

  c.vitals.kiMax = kiMaxFor(c);

  // Hard training accrues toward forms that ask for it.
  if (c.flags.trainedHardThisYear) {
    c.flags.hardTrainingYears = (c.flags.hardTrainingYears || 0) + 1;
    c.flags.trainedHardThisYear = false;
  }
  // Living in Super Saiyan is how it becomes effortless.
  if (c.transformations.includes('ssj') && (c.flags.ssjYears || 0) < 99) {
    c.flags.ssjYears = (c.flags.ssjYears || 0) + 1;
    if (c.flags.ssjYears >= 3 && c.stats.discipline > 55) c.flags.ssj_mastery = true;
  }

  return entries;
}

function finishYear(state) {
  const rng = getRng(state);
  const c = state.character;

  // Fire the world timeline even if the player ignored it.
  for (const ev of TIMELINE) {
    if (ev.year === currentYear(state) && !state.world.resolved.includes(ev.id)
      && !(ev.cancelIf && state.world.flags[ev.cancelIf])) {
      state.world.resolved.push(ev.id);
      state.turn.entries.push({ kind: 'world', text: `${ev.name}. ${ev.blurb}` });
      addFact(state.memory, { type: 'history', text: `${ev.name} happened.`, year: c.age, weight: 3, tags: ['history'] });
    }
  }

  // Natural death, unless a wish says otherwise.
  if (!c.inAfterlife && c.alive && !c.flags.immortal && rng.chance(naturalDeathChance(c))) {
    die(state, rng.pick(DEATH_CAUSES.age));
  } else if (!c.inAfterlife && c.alive && c.vitals.health <= 0) {
    // Bottoming out your health is a crisis, not an automatic ending. Half the
    // time somebody gets to you, or your species simply refuses to stop.
    const tough = hasPerk(c, 'regeneration') || hasPerk(c, 'hardToKill') || c.senzu > 0;
    if (c.senzu > 0) {
      c.senzu -= 1;
      c.vitals.health = 100;
      state.turn.entries.push({ kind: 'survival', text: 'You were carrying a senzu bean. It is gone now, and you are not.' });
    } else if (rng.chance(tough ? 0.2 : 0.4)) {
      die(state, rng.pick(DEATH_CAUSES.health));
    } else {
      c.vitals.health = 14;
      c.flags.brink_of_death = true;
      state.turn.entries.push({ kind: 'survival', text: 'You should not have survived this year. You did.' });
    }
  }

  state.log.push({
    year: state.turn.year,
    age: state.turn.age,
    entries: state.turn.entries.slice(),
  });
  if (state.log.length > 200) state.log.shift();

  saveRng(state, rng);
}

export function die(state, cause) {
  const c = state.character;
  if (!c.alive && c.inAfterlife) return;
  c.alive = false;
  c.death = { cause, year: currentYear(state), age: c.age };
  state.stats.deaths = (state.stats.deaths || 0) + 1;
  c.flags.died_once = true;
  addFact(state.memory, {
    type: 'death', text: `Died at ${c.age}. ${cause}.`, year: c.age, weight: 10, tags: ['death'],
  });
  if (state.turn) {
    state.turn.entries.push({ kind: 'death', text: `${cause}. You are ${c.age}.` });
    state.turn.done = true;
    state.log.push({ year: state.turn.year, age: state.turn.age, entries: state.turn.entries.slice() });
  }
}

/** Move a dead character into the Other World and keep playing. */
export function enterAfterlife(state) {
  const c = state.character;
  c.inAfterlife = true;
  c.alive = true;
  c.vitals.health = 100;
  c.vitals.happiness = clamp(c.vitals.happiness, 20, 100);
  c.placeId = 'check_in';
  c.yearsInAfterlife = 0;
  c.flags.judged = false;
  addFact(state.memory, { type: 'afterlife', text: 'Arrived in the Other World.', year: c.age, weight: 6, tags: ['death'] });
  return state;
}

/** The scored obituary shown when a life truly ends. */
export function epitaph(state) {
  const c = state.character;
  const race = getRace(c.raceId);
  const power = combatPower(c);
  const score = Math.round(
    Math.log10(Math.max(10, power)) * 90
    + c.fame * 3
    + Math.abs(c.karma) * 1.2
    + c.techniques.length * 12
    + c.transformations.length * 45
    + state.world.tournamentWins * 120
    + state.stats.wins * 4
    + livingNpcs(state).filter((n) => n.closeness > 60).length * 20
    + (state.world.divergences.length * 200)
  );

  const titles = [
    [12000, 'Legend of the Age'], [7000, 'World Shaker'], [4000, 'Named in the Histories'],
    [2200, 'A Fighter People Remember'], [1200, 'Locally Famous'], [600, 'Respected'],
    [0, 'Lived and Died'],
  ];
  const title = titles.find(([n]) => score >= n)[1];

  return {
    name: c.name,
    race: race.name,
    age: c.age,
    year: currentYear(state),
    cause: c.death ? c.death.cause : 'Still going',
    power: Math.round(power),
    tier: powerTier(power),
    score,
    title,
    fame: Math.round(c.fame),
    karma: Math.round(c.karma),
    zeni: Math.round(c.zeni),
    techniques: c.techniques.length,
    forms: c.transformations.length,
    children: livingNpcs(state).filter((n) => n.relation === 'child').length,
    divergences: state.world.divergences.length,
    highlights: recallSummary(state.memory, 8),
  };
}

/** Continue as one of your children. The world keeps everything it learned. */
export function beginLegacy(state) {
  const kids = Object.values(state.npcs).filter((n) => n.relation === 'child' && n.alive);
  if (!kids.length) return null;
  const rng = getRng(state);
  const heir = kids.sort((a, b) => (b.inheritedPower || b.power) - (a.inheritedPower || a.power))[0];
  const old = state.character;

  const next = {
    ...old,
    name: heir.name,
    raceId: heir.raceId,
    sex: heir.sex,
    age: heir.age,
    birthYear: heir.birthYear,
    alive: true,
    inAfterlife: false,
    death: null,
    yearsInAfterlife: 0,
    stats: { ...heir.stats },
    power: Math.max(1, heir.inheritedPower || heir.power),
    peakPower: Math.max(1, heir.inheritedPower || heir.power),
    zenkaiCount: 0,
    vitals: { health: 100, happiness: 70, ki: 60, kiMax: 60 },
    techniques: (heir.techniques || []).slice(),
    transformations: [],
    activeForm: null,
    signature: null,
    mentors: [],
    career: null,
    items: old.items.slice(),
    senzu: old.senzu,
    zeni: Math.round(old.zeni * 0.6),
    fame: Math.round(old.fame * 0.3),
    karma: 0,
    flags: { heir_of: old.name },
    traits: [],
    achievements: [],
    tail: getRace(heir.raceId).perks.includes('oozaru'),
  };
  next.vitals.kiMax = kiMaxFor(next);
  next.vitals.ki = next.vitals.kiMax;
  next.lifeExpectancy = lifeExpectancy(next, rng);

  delete state.npcs[heir.id];
  // The previous character becomes a memory in the world.
  state.npcs['legacy_' + old.name] = {
    id: 'legacy_' + old.name, name: old.name, raceId: old.raceId, canonId: null,
    sex: old.sex, age: old.age, birthYear: old.birthYear, alive: false,
    deadSince: currentYear(state), causeOfDeath: old.death ? old.death.cause : 'unknown',
    title: 'Your parent', epithet: null, stats: old.stats, power: old.power,
    relation: 'parent', closeness: 70, respect: 70, tension: 0, romance: 0,
    tags: ['legend'], goal: null, placeId: old.placeId, metAt: heir.birthYear,
    metHow: 'family', history: [], techniques: old.techniques.slice(), isCanon: false,
  };

  state.legacy = {
    generation: (state.legacy ? state.legacy.generation : 1) + 1,
    ancestors: [...(state.legacy ? state.legacy.ancestors : []), { name: old.name, age: old.age, power: old.power, score: epitaph(state).score }],
  };
  state.character = next;
  state.turn = null;
  addFact(state.memory, {
    type: 'legacy', weight: 8, year: next.age,
    text: `${next.name} takes up where ${old.name} left off.`, tags: ['legacy'],
  });
  saveRng(state, rng);
  return state;
}
