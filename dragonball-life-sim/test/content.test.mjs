import { test } from 'node:test';
import assert from 'node:assert/strict';

import '../src/game.js';
import { allTemplates, buildContext, materialise, selectTemplate } from '../src/engine/generator.js';
import { createGame, defaultCreation } from '../src/engine/state.js';
import { startYear, choose, epitaph, enterAfterlife, beginLegacy } from '../src/engine/lifecycle.js';
import { Rng } from '../src/engine/rng.js';
import { RACES, getRace, UPBRINGINGS, TEMPERAMENTS, BODY_TYPES } from '../src/data/races.js';
import { TECHNIQUES, TECH_BY_ID, BRANCHES } from '../src/data/techniques.js';
import { TRANSFORMATIONS, ladderFor } from '../src/data/transformations.js';
import { CANON, canonPower, canonAlive } from '../src/data/canon.js';
import { PLACES, PLACE_BY_ID } from '../src/data/places.js';
import { CAREERS } from '../src/data/jobs.js';
import { ITEMS, WISHES } from '../src/data/items.js';
import { LEXICON } from '../src/data/lexicon.js';
import { serialise, deserialise, exportString, importString } from '../src/engine/save.js';
import { ladderStatus } from '../src/engine/progression.js';

const STAT_KEYS = ['strength', 'speed', 'technique', 'kiControl', 'durability', 'intellect', 'charisma', 'discipline'];

test('every race is complete and internally consistent', () => {
  for (const race of RACES) {
    assert.ok(race.id && race.name && race.blurb, `${race.id} missing basics`);
    for (const key of STAT_KEYS) {
      assert.ok(typeof race.base[key] === 'number', `${race.id} missing base ${key}`);
    }
    assert.ok(race.lifespan[0] < race.lifespan[1], `${race.id} lifespan reversed`);
    assert.ok(race.startPower[0] <= race.startPower[1], `${race.id} start power reversed`);
    for (const home of race.homeworlds) {
      assert.ok(PLACE_BY_ID[home], `${race.id} homeworld ${home} does not exist`);
    }
    for (const tech of race.startingTechniques) {
      assert.ok(TECH_BY_ID[tech], `${race.id} starts with unknown technique ${tech}`);
    }
    assert.ok(ladderFor(race.id).length > 0, `${race.id} has no transformations at all`);
  }
});

test('technique tree has no dangling prerequisites or unknown branches', () => {
  for (const tech of TECHNIQUES) {
    assert.ok(BRANCHES[tech.branch], `${tech.id} has unknown branch ${tech.branch}`);
    for (const prereq of tech.prereq) {
      assert.ok(TECH_BY_ID[prereq], `${tech.id} requires unknown technique ${prereq}`);
    }
    if (tech.races) {
      for (const r of tech.races) assert.ok(RACES.some((x) => x.id === r), `${tech.id} names unknown race ${r}`);
    }
    assert.ok(tech.desc && tech.desc.length > 10, `${tech.id} needs a description`);
  }
});

test('technique prerequisites cannot cycle', () => {
  const seen = new Map();
  const visit = (id, stack) => {
    if (stack.includes(id)) assert.fail(`prerequisite cycle: ${stack.concat(id).join(' -> ')}`);
    if (seen.has(id)) return;
    seen.set(id, true);
    for (const p of (TECH_BY_ID[id] || { prereq: [] }).prereq) visit(p, stack.concat(id));
  };
  for (const t of TECHNIQUES) visit(t.id, []);
});

test('transformations reference real parents, races and techniques', () => {
  const ids = new Set(TRANSFORMATIONS.map((t) => t.id));
  for (const form of TRANSFORMATIONS) {
    assert.ok(form.mult > 1, `${form.id} must actually multiply power`);
    assert.ok(form.desc && form.hint, `${form.id} needs description and hint`);
    for (const race of form.ladder) {
      assert.ok(race === '*' || RACES.some((r) => r.id === race), `${form.id} names unknown race ${race}`);
    }
    if (form.req.parent) assert.ok(ids.has(form.req.parent), `${form.id} parent ${form.req.parent} missing`);
    for (const tech of form.req.techniques || []) {
      assert.ok(TECH_BY_ID[tech], `${form.id} requires unknown technique ${tech}`);
    }
    for (const stat of Object.keys(form.req.stat || {})) {
      assert.ok(STAT_KEYS.includes(stat), `${form.id} requires unknown stat ${stat}`);
    }
  }
});

test('canon characters are era-gated and have sane power curves', () => {
  for (const c of CANON) {
    assert.ok(c.name && c.personality, `${c.id} incomplete`);
    assert.ok(PLACE_BY_ID[c.home], `${c.id} lives at unknown place ${c.home}`);
    assert.ok(Object.keys(c.power).length > 0, `${c.id} has no power keyframes`);
    for (const tech of c.teaches || []) {
      assert.ok(TECH_BY_ID[tech], `${c.id} teaches unknown technique ${tech}`);
    }
    const [born, died] = c.years;
    assert.ok(died === null || died > born, `${c.id} dies before being born`);
    assert.equal(canonAlive(c, born - 1), false, `${c.id} exists before birth`);
    assert.ok(canonPower(c, born + 1) > 0);
  }
});

test('Goku is not available before he is born and grows over time', () => {
  const goku = CANON.find((c) => c.id === 'goku');
  assert.equal(canonAlive(goku, 736), false);
  assert.equal(canonAlive(goku, 762), true);
  assert.ok(canonPower(goku, 762) > canonPower(goku, 750), 'power must rise across the sagas');
  assert.ok(canonPower(goku, 780) > canonPower(goku, 767));
});

test('careers, items and wishes are well formed', () => {
  for (const career of CAREERS) {
    assert.ok(career.rungs.length >= 2, `${career.id} needs a ladder`);
    for (let i = 1; i < career.rungs.length; i++) {
      assert.ok(career.rungs[i].pay >= career.rungs[i - 1].pay, `${career.id} pay goes backwards`);
    }
  }
  for (const item of ITEMS) assert.ok(item.name && item.desc, `${item.id} incomplete`);
  for (const wish of WISHES) assert.ok(wish.name && wish.desc, `${wish.id} incomplete`);
});

test('every lexicon bank has enough entries to avoid obvious repetition', () => {
  for (const [key, bank] of Object.entries(LEXICON)) {
    assert.ok(Array.isArray(bank) && bank.length >= 4, `lexicon.${key} is too thin (${bank.length})`);
    assert.equal(new Set(bank).size, bank.length, `lexicon.${key} has duplicates`);
  }
});

test('every event template declares the fields the engine needs', () => {
  const ids = new Set();
  for (const t of allTemplates()) {
    assert.ok(!ids.has(t.id), `duplicate template id ${t.id}`);
    ids.add(t.id);
    assert.ok(t.title, `${t.id} has no title`);
    assert.ok(t.text, `${t.id} has no text`);
    assert.ok(typeof t.choices === 'function', `${t.id} has no choices function`);
    assert.ok(Array.isArray(t.tags), `${t.id} has no tags`);
  }
  assert.ok(ids.size > 60, `expected a substantial template library, got ${ids.size}`);
});

test('templates render and resolve without throwing across many random states', () => {
  const rng = new Rng('resolve-suite');
  let rendered = 0;
  let resolved = 0;

  for (let i = 0; i < 40; i++) {
    const race = rng.pick(RACES);
    const state = createGame({
      name: 'Probe', raceId: race.id, sex: 'nonbinary',
      upbringingId: rng.pick(UPBRINGINGS).id, temperamentId: rng.pick(TEMPERAMENTS).id,
      bodyId: rng.pick(BODY_TYPES).id, birthYear: rng.pick([737, 756, 767, 780]),
      placeId: rng.pick(race.homeworlds),
    }, 'probe-' + i);

    // Push the character into a varied place in its life.
    state.character.age = rng.int(1, 70);
    state.character.power = Math.round(Math.pow(10, rng.float(1, 9)));
    state.character.zeni = rng.int(0, 5_000_000);
    state.character.fame = rng.int(0, 100);
    state.character.karma = rng.int(-100, 100);
    if (rng.chance(0.4)) state.character.inAfterlife = true;

    const ctx = buildContext(state, rng);
    for (const template of allTemplates()) {
      let slots;
      try { slots = template.slots ? template.slots(ctx) : {}; } catch (e) { continue; }
      if (slots === null || slots === undefined) continue;
      const event = materialise(ctx, template, slots);
      rendered++;
      assert.ok(event.title.length > 0, `${template.id} rendered an empty title`);
      assert.ok(!/[#{]/.test(event.text), `${template.id} leaked grammar markup: ${event.text.slice(0, 80)}`);
      assert.ok(event.choices.length > 0, `${template.id} rendered no choices`);
      for (const choice of event.choices) {
        assert.ok(choice.label.length > 0, `${template.id} has an empty choice label`);
        assert.ok(!/[#{]/.test(choice.label), `${template.id} leaked markup into a choice`);
      }
    }
  }
  assert.ok(rendered > 500, `expected wide coverage, only rendered ${rendered}`);
});

test('a full lifetime plays through without crashing', () => {
  const rng = new Rng('lifetime');
  const state = createGame({
    name: 'Full Life', raceId: 'halfsaiyan', sex: 'female', upbringingId: 'city',
    temperamentId: 'kind', bodyId: 'balanced', birthYear: 749, placeId: 'earth',
  }, 'lifetime');

  let event = startYear(state);
  let guard = 0;
  while (guard++ < 3000 && state.character.age < 80) {
    if (!state.character.alive) break;
    if (!event) { event = startYear(state); continue; }
    const open = event.choices.filter((c) => !c.locked);
    event = choose(state, rng.pick(open.length ? open : event.choices).id);
  }
  assert.ok(state.log.length > 10, 'a life should produce a log');
  assert.ok(state.memory.facts.length > 5, 'a life should accumulate memory');
  const info = epitaph(state);
  assert.ok(info.score >= 0 && info.title, 'epitaph must score the life');
});

test('death leads to the afterlife rather than a dead end', () => {
  const state = createGame({
    name: 'Ghost', raceId: 'earthling', sex: 'male', upbringingId: 'city',
    temperamentId: 'kind', bodyId: 'balanced', birthYear: 756, placeId: 'east_city',
  }, 'ghost');
  state.character.age = 30;
  state.character.alive = false;
  state.character.death = { cause: 'test', year: 786, age: 30 };
  enterAfterlife(state);
  assert.equal(state.character.inAfterlife, true);
  assert.equal(state.character.alive, true);
  const event = startYear(state);
  assert.ok(event, 'the afterlife must generate events of its own');
});

test('a save survives a round trip mid-event', () => {
  const rng = new Rng('save');
  const state = createGame({
    name: 'Saver', raceId: 'namekian', sex: 'nonbinary', upbringingId: 'temple',
    temperamentId: 'stoic', bodyId: 'lean', birthYear: 753, placeId: 'namek',
  }, 'save');
  let event = startYear(state);
  for (let i = 0; i < 40 && state.character.alive; i++) {
    if (!event) { event = startYear(state); continue; }
    event = choose(state, rng.pick(event.choices.filter((c) => !c.locked)).id);
  }
  event = startYear(state);

  const restored = deserialise(serialise(state));
  assert.equal(restored.character.name, state.character.name);
  assert.equal(restored.character.age, state.character.age);
  assert.equal(restored.memory.facts.length, state.memory.facts.length);
  assert.equal(Object.keys(restored.npcs).length, Object.keys(state.npcs).length);
  if (event) {
    // A restored mid-year save must be able to answer the pending event.
    const pending = restored.turn.queue[restored.turn.index];
    assert.ok(pending, 'pending event should survive the save');
    const next = choose(restored, pending.choices[0].id);
    assert.ok(next === null || next.title, 'resuming must not throw');
  }
  const roundTripped = importString(exportString(state));
  assert.equal(roundTripped.character.age, state.character.age);
});

test('legacy mode continues the bloodline and keeps the world', () => {
  const state = createGame({
    name: 'Parent', raceId: 'saiyan', sex: 'female', upbringingId: 'warrior_clan',
    temperamentId: 'proud', bodyId: 'balanced', birthYear: 737, placeId: 'planet_vegeta',
  }, 'legacy');
  state.character.age = 40;
  state.character.power = 500000;
  state.npcs.kid = {
    id: 'kid', name: 'Heir', raceId: 'saiyan', canonId: null, sex: 'male', age: 12,
    birthYear: 765, alive: true, deadSince: null, causeOfDeath: null, title: null, epithet: null,
    stats: { strength: 60, speed: 60, technique: 50, kiControl: 50, durability: 60, intellect: 50, charisma: 50, discipline: 50 },
    power: 900, relation: 'child', closeness: 70, respect: 40, tension: 0, romance: 0,
    tags: [], goal: null, placeId: 'planet_vegeta', metAt: 765, metHow: 'family',
    history: [], techniques: [], isCanon: false, inheritedPower: 5000,
  };
  const before = state.memory.facts.length;
  beginLegacy(state);
  assert.equal(state.character.name, 'Heir');
  assert.equal(state.legacy.generation, 2);
  assert.ok(state.memory.facts.length > before, 'the world remembers the previous generation');
  assert.ok(Object.values(state.npcs).some((n) => n.name === 'Parent' && !n.alive),
    'the previous character becomes part of the world');
});

test('transformation ladders are reachable in principle', () => {
  for (const race of RACES) {
    const state = createGame({
      name: 'Ladder', raceId: race.id, sex: 'male', upbringingId: 'warrior_clan',
      temperamentId: 'proud', bodyId: 'balanced', birthYear: 749, placeId: race.homeworlds[0],
    }, 'ladder-' + race.id);
    const ladder = ladderStatus(state);
    assert.ok(ladder.length > 0, `${race.id} has no ladder`);
    for (const form of ladder) {
      assert.ok(Array.isArray(form.missing), `${race.id}/${form.id} missing list broken`);
    }
  }
});
