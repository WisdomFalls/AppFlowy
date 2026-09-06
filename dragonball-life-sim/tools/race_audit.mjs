// Plays several lifetimes per playable race and reports, race by race,
// whether the systems that should be open to everyone actually are: a
// career, a marriage, a technique or two, a form, a weapon worn if the style
// calls for one. A race that comes back at 0% on something every other race
// reaches is a reachability bug, not a coincidence.

import { createGame, startYear, choose, enterAfterlife } from '../src/game.js';
import { RACES, UPBRINGINGS, TEMPERAMENTS, BODY_TYPES } from '../src/data/races.js';
import { Rng } from '../src/engine/rng.js';
import { combatPower } from '../src/engine/stats.js';
import { getItem } from '../src/data/items.js';

const LIVES_PER_RACE = Number(process.argv[2] || 15);
const MAX_AGE = Number(process.argv[3] || 90);

function pickChoice(rng, event) {
  const open = event.choices.filter((c) => !c.locked);
  if (!open.length) return event.choices[0].id;
  const safe = open.filter((c) => !c.danger);
  if (safe.length && rng.chance(0.78)) return rng.pick(safe).id;
  return rng.pick(open).id;
}

const byRace = {};
const errors = [];

for (const race of RACES) {
  byRace[race.id] = {
    lives: 0, crashes: 0, techs: [], forms: [], careers: 0, marriages: 0,
    weaponsWorn: 0, transformUsed: 0, powers: [], children: 0, afterlifeEntered: 0,
  };
  for (let i = 0; i < LIVES_PER_RACE; i++) {
    const seed = `audit-${race.id}-${i}`;
    const rng = new Rng(seed);
    const creation = {
      name: 'Subject', raceId: race.id,
      sex: rng.pick(['male', 'female']),
      fightingStyle: rng.pick(['martial_arts', 'weapons', 'both']),
      upbringingId: rng.pick(UPBRINGINGS).id,
      temperamentId: rng.pick(TEMPERAMENTS).id,
      bodyId: rng.pick(BODY_TYPES).id,
      birthYear: rng.pick([720, 737, 749, 756, 761, 767, 774, 778, 780]),
      placeId: rng.pick(race.homeworlds),
    };
    try {
      const state = createGame(creation, seed);
      state.autoBattle = true;
      let event = startYear(state);
      let guard = 0;
      let afterlifeUsed = false;
      while (guard++ < 3000 && state.character.age < MAX_AGE) {
        if (!state.character.alive) {
          if (!state.character.inAfterlife && !afterlifeUsed && rng.chance(0.6)) {
            enterAfterlife(state);
            byRace[race.id].afterlifeEntered++;
            afterlifeUsed = true;
            event = null;
            continue;
          }
          break;
        }
        if (!event) { event = startYear(state); continue; }
        event = choose(state, pickChoice(rng, event));
      }
      const c = state.character;
      byRace[race.id].lives++;
      byRace[race.id].techs.push(c.techniques.length);
      byRace[race.id].forms.push(c.transformations.length);
      byRace[race.id].powers.push(combatPower(c));
      if (c.career) byRace[race.id].careers++;
      if (Object.values(state.npcs).some((n) => n.relation === 'spouse')) byRace[race.id].marriages++;
      byRace[race.id].children += Object.values(state.npcs).filter((n) => n.relation === 'child').length;
      const bag = c.bag || [];
      if (bag.some((e) => e.worn && getItem(e.id) && getItem(e.id).cat === 'weapon')) byRace[race.id].weaponsWorn++;
      if (c.transformations.length > 0) byRace[race.id].transformUsed++;
    } catch (err) {
      byRace[race.id].crashes++;
      errors.push(`${race.id} #${i}: ${err.message}\n${(err.stack || '').split('\n').slice(1, 3).join('\n')}`);
    }
  }
}

const median = (arr) => {
  if (!arr.length) return 0;
  const a = arr.slice().sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
};

console.log(`\n=== per-race audit: ${LIVES_PER_RACE} lives each, capped at age ${MAX_AGE} ===\n`);
console.log(
  'race'.padEnd(16), 'crash'.padStart(6), 'career%'.padStart(8), 'marry%'.padStart(7),
  'kids'.padStart(5), 'wpn%'.padStart(6), 'form%'.padStart(6), 'medTechs'.padStart(9),
  'medForms'.padStart(9), 'medPow'.padStart(12),
);
for (const race of RACES) {
  const r = byRace[race.id];
  const n = r.lives || 1;
  console.log(
    race.id.padEnd(16),
    String(r.crashes).padStart(6),
    (r.careers / n * 100).toFixed(0).padStart(7) + '%',
    (r.marriages / n * 100).toFixed(0).padStart(6) + '%',
    String(r.children).padStart(5),
    (r.weaponsWorn / n * 100).toFixed(0).padStart(5) + '%',
    (r.transformUsed / n * 100).toFixed(0).padStart(5) + '%',
    String(median(r.techs)).padStart(9),
    String(median(r.forms)).padStart(9),
    Math.round(median(r.powers)).toLocaleString('en-US').padStart(12),
  );
}

if (errors.length) {
  console.log(`\nCRASHES (${errors.length}):`);
  for (const e of errors.slice(0, 10)) console.log('  ' + e);
  process.exitCode = 1;
} else {
  console.log('\nno crashes across any race');
}
