import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Rng, clamp, hashSeed } from '../src/engine/rng.js';
import { render, variantCount, tidy, numberish, zeni } from '../src/engine/text.js';
import { createMemory, noveltyWeight, remember, addFact, findFacts, openThread, advanceThread } from '../src/engine/memory.js';
import { validateEffects, buildAiEvent, sanitiseText } from '../src/engine/aieffects.js';
import { combatPower, winChance, powerTier, trainingRate } from '../src/engine/stats.js';
import { createGame } from '../src/engine/state.js';

test('rng is deterministic for a given seed', () => {
  const a = new Rng('goku');
  const b = new Rng('goku');
  const c = new Rng('vegeta');
  const seqA = Array.from({ length: 20 }, () => a.next());
  const seqB = Array.from({ length: 20 }, () => b.next());
  const seqC = Array.from({ length: 20 }, () => c.next());
  assert.deepEqual(seqA, seqB, 'same seed must replay identically');
  assert.notDeepEqual(seqA, seqC, 'different seeds must diverge');
});

test('rng survives a serialisation round trip', () => {
  const a = new Rng(12345);
  a.next(); a.next();
  const restored = Rng.fromJSON(JSON.parse(JSON.stringify(a.toJSON())));
  assert.equal(restored.next(), new Rng(12345).next.call(Object.assign(new Rng(12345), a.toJSON())));
});

test('rng helpers stay inside their bounds', () => {
  const r = new Rng(7);
  for (let i = 0; i < 500; i++) {
    const n = r.int(3, 9);
    assert.ok(n >= 3 && n <= 9, `int out of range: ${n}`);
    const g = r.gauss(50, 20, 0, 100);
    assert.ok(g >= 0 && g <= 100, `gauss out of range: ${g}`);
  }
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(r.pick([]), undefined);
  assert.equal(hashSeed('a'), hashSeed('a'));
});

test('grammar expands alternatives, banks and slots', () => {
  const r = new Rng(3);
  const out = render('{A|B} #daypart# with [who].', { who: 'Piccolo' }, r);
  assert.match(out, /^(A|B) /);
  assert.ok(out.includes('Piccolo'));
  assert.ok(!out.includes('#'), 'no unexpanded bank markers');
  assert.ok(!out.includes('{'), 'no unexpanded alternatives');
  assert.ok(!out.includes('['), 'no unfilled slots');
});

test('grammar leaves unknown slots visible rather than printing undefined', () => {
  const out = render('Hello [missing].', {}, new Rng(1));
  assert.ok(out.includes('[missing]'));
  assert.ok(!out.includes('undefined'));
});

test('grammar produces many distinct renderings', () => {
  const template = '{You wake|You surface|You come round} #daypart#, #weather#.';
  assert.ok(variantCount(template) > 300, 'template should have hundreds of variants');
  const r = new Rng(11);
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(render(template, {}, r));
  assert.ok(seen.size > 80, `expected varied output, got ${seen.size} distinct in 200`);
});

test('tidy fixes spacing and sentence case', () => {
  assert.equal(tidy('hello  ,  world . next'), 'Hello, world. Next');
  assert.equal(tidy('one. two'), 'One. Two');
});

test('number formatting stays readable at Dragon Ball scales', () => {
  assert.equal(numberish(950), '950');
  assert.match(numberish(3_000_000), /3 million/);
  assert.match(numberish(4.2e12), /trillion/);
  assert.match(zeni(2_500_000), /2.5M Zeni/);
});

test('memory suppresses a repeated shape and forgives over time', () => {
  const m = createMemory();
  const slots = { npcId: 'npc_1' };
  const fresh = noveltyWeight(m, 'spar', slots, 20);
  remember(m, { templateId: 'spar', slots, year: 20, title: 'Spar', text: 'x' });
  assert.ok(noveltyWeight(m, 'spar', slots, 20) < fresh * 0.01, 'same year must be crushed');
  assert.ok(noveltyWeight(m, 'spar', slots, 25) < noveltyWeight(m, 'spar', slots, 40), 'suppression must decay');
  assert.ok(noveltyWeight(m, 'spar', { npcId: 'npc_2' }, 21) > noveltyWeight(m, 'spar', slots, 21),
    'a different cast is a different beat');
});

test('memory keeps facts queryable and bounded', () => {
  const m = createMemory();
  for (let i = 0; i < 400; i++) {
    addFact(m, { type: 'event', text: 'thing ' + i, year: i, weight: i % 5 });
  }
  assert.ok(m.facts.length <= 220, 'fact list must stay bounded');
  addFact(m, { type: 'death', text: 'somebody died', year: 40, weight: 9 });
  assert.equal(findFacts(m, { type: 'death' }).length, 1);
});

test('threads advance and close', () => {
  const m = createMemory();
  const t = openThread(m, { kind: 'rivalry', subject: 'npc_1', year: 10, maxStage: 2 });
  advanceThread(m, t, 12);
  assert.equal(t.closed, false);
  advanceThread(m, t, 14);
  assert.equal(t.closed, true);
});

test('AI effects are clamped and unknown keys dropped', () => {
  const out = validateEffects({
    health: -100000, happiness: 900, power_pct: 5000, karma: '25',
    stats: { strength: 99, notAStat: 5 }, arbitrary: 'ignored',
  });
  assert.equal(out.health, -45);
  assert.equal(out.happiness, 35);
  assert.equal(out.power_pct, 30);
  assert.equal(out.stats.strength, 7);
  assert.equal(out.stats.notAStat, undefined);
  assert.equal(out.arbitrary, undefined);
});

test('AI events are rejected unless well formed', () => {
  assert.equal(buildAiEvent(null, 'x'), null);
  assert.equal(buildAiEvent({ title: 'Only a title' }, 'x'), null);
  assert.equal(buildAiEvent({ title: 'T', text: 'B', choices: [{ label: 'a', outcome: 'b' }] }, 'x'), null,
    'one choice is not a decision');
  const ok = buildAiEvent({
    title: 'A Knock', text: 'Somebody is at the door.',
    choices: [
      { label: 'Open', outcome: 'It is a stranger.', effects: { happiness: 5 } },
      { label: 'Ignore', outcome: 'They leave.', effects: { happiness: -2 } },
    ],
  }, 'ai_1');
  assert.equal(ok.choices.length, 2);
  assert.equal(ok.ai, true);
});

test('AI text is stripped of markup', () => {
  assert.equal(sanitiseText('<script>alert(1)</script>hello'), 'alert(1)hello');
  assert.equal(sanitiseText('<b>bold</b>'), 'bold');
});

test('power maths behaves at Dragon Ball scales', () => {
  assert.ok(winChance(1e6, 1e3) > 0.9);
  assert.ok(winChance(1e3, 1e6) < 0.1);
  assert.ok(winChance(100, 100) > 0.45 && winChance(100, 100) < 0.55);
  assert.ok(winChance(1e12, 1) <= 0.98, 'an upset must always be possible');
  assert.ok(winChance(1, 1e12) >= 0.02);
  assert.equal(powerTier(5), 'Civilian');
  assert.match(powerTier(1e13), /God of Destruction/);
});

test('training returns diminishing rates as power climbs', () => {
  const make = (power) => ({
    raceId: 'saiyan', age: 20, power, transformations: [], techniques: [], extraPerks: [],
    stats: { strength: 60, speed: 60, technique: 50, kiControl: 50, durability: 60, intellect: 50, charisma: 50, discipline: 60 },
    vitals: { health: 100, happiness: 70, ki: 60, kiMax: 60 },
  });
  const low = trainingRate(make(100), { intensity: 1 });
  const high = trainingRate(make(1e9), { intensity: 1 });
  assert.ok(low > high, 'growth rate must fall as power rises');
  assert.ok(high > 0, 'growth must never stop entirely');
});

test('combat power reflects condition and form', () => {
  const s = createGame({
    name: 'T', raceId: 'saiyan', sex: 'male', upbringingId: 'warrior_clan',
    temperamentId: 'proud', bodyId: 'balanced', birthYear: 737, placeId: 'planet_vegeta',
  }, 'combat-test');
  s.character.power = 10000;
  const healthy = combatPower(s.character);
  s.character.vitals.health = 20;
  assert.ok(combatPower(s.character) < healthy, 'being hurt must cost power');
  s.character.vitals.health = 100;
  s.character.transformations.push('ssj');
  assert.ok(combatPower(s.character) > healthy * 10, 'Super Saiyan must matter');
});
