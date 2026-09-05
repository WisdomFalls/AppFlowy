// Plays hundreds of complete lifetimes headlessly and reports on the three
// things that actually break a life sim: crashes, repetition, and a power
// curve that either stalls or runs away.

import { createGame, startYear, choose, epitaph, enterAfterlife, beginLegacy } from '../src/game.js';
import { RACES } from '../src/data/races.js';
import { UPBRINGINGS, TEMPERAMENTS, BODY_TYPES } from '../src/data/races.js';
import { Rng } from '../src/engine/rng.js';
import { combatPower, powerTier } from '../src/engine/stats.js';

const LIVES = Number(process.argv[2] || 200);
const MAX_AGE = Number(process.argv[3] || 90);

/** A plausible player: mostly sensible, occasionally reckless. */
function pickChoice(rng, event) {
  const open = event.choices.filter((c) => !c.locked);
  if (!open.length) return event.choices[0].id;
  const safe = open.filter((c) => !c.danger);
  if (safe.length && rng.chance(0.78)) return rng.pick(safe).id;
  return rng.pick(open).id;
}

const results = [];
const titleCounts = new Map();
const errors = [];
const templateHits = new Map();

for (let i = 0; i < LIVES; i++) {
  const rng = new Rng('soak-' + i);
  const race = rng.pick(RACES);
  const creation = {
    name: 'Subject ' + i,
    raceId: race.id,
    sex: rng.pick(['male', 'female', 'nonbinary']),
    upbringingId: rng.pick(UPBRINGINGS).id,
    temperamentId: rng.pick(TEMPERAMENTS).id,
    bodyId: rng.pick(BODY_TYPES).id,
    birthYear: rng.pick([720, 737, 749, 756, 761, 767, 774, 778, 780]),
    placeId: rng.pick(race.homeworlds),
  };

  let state;
  try {
    state = createGame(creation, 'soak-seed-' + i);
    state.autoBattle = true;   // nothing is driving the battle UI out here
    let event = startYear(state);
    let guard = 0;
    let afterlifeUsed = false;

    while (guard++ < 4000 && state.character.age < MAX_AGE) {
      if (!state.character.alive) {
        if (!state.character.inAfterlife && !afterlifeUsed && rng.chance(0.6)) {
          enterAfterlife(state);
          afterlifeUsed = true;
          event = null;
          continue;
        }
        break;
      }
      if (!event) { event = startYear(state); continue; }
      event = choose(state, pickChoice(rng, event));
    }

    const info = epitaph(state);
    results.push({
      race: race.id,
      age: state.character.age,
      alive: state.character.alive,
      power: combatPower(state.character),
      tier: powerTier(combatPower(state.character)),
      score: info.score,
      forms: state.character.transformations.length,
      techs: state.character.techniques.length,
      npcs: Object.keys(state.npcs).length,
      facts: state.memory.facts.length,
      years: state.log.length,
      entries: state.log.reduce((n, y) => n + y.entries.length, 0),
    });

    for (const year of state.log) {
      for (const entry of year.entries) {
        if (entry.title) titleCounts.set(entry.title, (titleCounts.get(entry.title) || 0) + 1);
        if (entry.templateId) templateHits.set(entry.templateId, (templateHits.get(entry.templateId) || 0) + 1);
      }
    }
  } catch (err) {
    errors.push(`life ${i} (${race.id}): ${err.message}\n${(err.stack || '').split('\n').slice(1, 4).join('\n')}`);
  }
}

const num = (n) => Math.round(n).toLocaleString('en-US');
const median = (arr) => {
  const a = arr.slice().sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : 0;
};

console.log(`\n=== ${LIVES} lifetimes, capped at age ${MAX_AGE} ===\n`);

if (errors.length) {
  console.log(`CRASHES: ${errors.length}`);
  for (const e of errors.slice(0, 5)) console.log('  ' + e);
} else {
  console.log('crashes: none');
}

const ages = results.map((r) => r.age);
const powers = results.map((r) => r.power);
const entries = results.map((r) => r.entries);
console.log(`survived to cap: ${results.filter((r) => r.alive).length}/${results.length}`);
console.log(`age at end     : median ${median(ages)}, range ${Math.min(...ages)}-${Math.max(...ages)}`);
console.log(`final power    : median ${num(median(powers))}, max ${num(Math.max(...powers))}`);
console.log(`events per life: median ${median(entries)}`);
console.log(`forms unlocked : median ${median(results.map((r) => r.forms))}, max ${Math.max(...results.map((r) => r.forms))}`);
console.log(`techniques     : median ${median(results.map((r) => r.techs))}`);
console.log(`people met     : median ${median(results.map((r) => r.npcs))}`);

const tiers = {};
for (const r of results) tiers[r.tier] = (tiers[r.tier] || 0) + 1;
console.log('\npower tiers reached:');
for (const [tier, n] of Object.entries(tiers).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${tier}`);
}

const totalEntries = [...titleCounts.values()].reduce((a, b) => a + b, 0);
const distinct = titleCounts.size;
console.log(`\ndistinct event titles: ${distinct} across ${num(totalEntries)} entries`);
console.log('most common titles (share of all entries):');
for (const [title, n] of [...titleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
  console.log(`  ${(n / totalEntries * 100).toFixed(1)}%  ${title}`);
}

const unused = [];
import('../src/engine/generator.js').then(({ allTemplates }) => {
  for (const t of allTemplates()) if (!templateHits.has(t.id)) unused.push(t.id);
  console.log(`\ntemplates never fired (${unused.length}): ${unused.join(', ') || 'none'}`);
  if (errors.length) process.exitCode = 1;
});
