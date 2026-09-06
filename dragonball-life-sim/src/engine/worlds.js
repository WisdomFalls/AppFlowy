// Standing on a world: what you have done there, what it thinks of you, and
// who turns up when you go too far.

import { clamp } from './rng.js';
import { PLANETS, getPlanet, travelYears, TRAVEL_METHODS, planetExists } from '../data/planets.js';
import { getPlace, PLACES } from '../data/places.js';
import { canonAvailable, canonPower, getCanon } from '../data/canon.js';
import { combatPower } from './stats.js';
import { addFact } from './memory.js';
import { adjust } from './state.js';
import { spreadWord, DEED_SCALE } from './settlement.js';

export function worldRecord(state, planetId) {
  state.world.planets = state.world.planets || {};
  if (!state.world.planets[planetId]) {
    state.world.planets[planetId] = { influence: 0, fear: 0, love: 0, ruled: false, purged: false, visits: 0 };
  }
  return state.world.planets[planetId];
}

export function standingOn(state, planetId) {
  const r = worldRecord(state, planetId);
  if (r.purged) return 'Erased';
  if (r.ruled) return 'Ruled by you';
  if (r.fear > 60) return 'Terrified of you';
  if (r.love > 60) return 'Loyal to you';
  if (r.fear > 30) return 'Wary of you';
  if (r.love > 30) return 'Fond of you';
  if (r.influence > 20) return 'Knows your name';
  return 'Does not know you';
}

/** Which travel methods this character can actually use, and what they cost. */
export function travelOptions(state, targetPlanetId) {
  const c = state.character;
  const here = getPlace(c.placeId).planet;
  const out = [];

  // A freighter does not cross universes. Kai Kai does, an angel does, and a
  // ring signed off by a god of destruction does. Nothing else.
  const from = getPlanet(here);
  const to = getPlanet(targetPlanetId);
  const myUniverse = (from && from.universe) || c.universe || 7;
  const theirUniverse = (to && to.universe) || 7;
  if (myUniverse !== theirUniverse) {
    const ways = [];
    if (c.techniques.includes('kai_kai')) ways.push({ id: 'kai_kai', name: 'Kai Kai', years: 0, cost: 0, blurb: 'Across the boundary, in one step.' });
    if (c.mentors.includes('whis') || c.mentors.includes('beerus') || c.flags.angel_escort) {
      ways.push({ id: 'angel', name: 'Carried by an angel', years: 0, cost: 0, blurb: 'Whis takes you, and finds the whole thing mildly amusing.' });
    }
    if (c.flags.zeno_pass || c.flags.won_tournament_of_power) {
      ways.push({ id: 'pass', name: 'The ring you were given', years: 0, cost: 0, blurb: 'Somebody very high up cleared this in advance.' });
    }
    return ways;
  }
  for (const method of TRAVEL_METHODS) {
    let usable = false;
    let cost = 0;
    const from = getPlanet(here);
    // A world with nobody on it has no spaceport and nothing to book.
    // Namek has no spaceport. Earth has Capsule Corp. The test is whether
    // anybody on this world builds or berths something that leaves it.
    const spaceport = !!(from && from.population !== 'none'
      && !/none to speak of|spiritual|primitive/i.test(from.tech || ''));
    if (method.id === 'instant') usable = c.techniques.includes('instant_transmission') || c.techniques.includes('kai_kai');
    else if (method.id === 'ship') usable = c.items.includes('spaceship');
    else if (method.id === 'pod') usable = c.items.includes('attack_ball');
    else if (method.id === 'flight') usable = (c.stats.speed || 0) >= 80 && c.techniques.includes('bukujutsu');
    else if (method.id === 'passage') {
      // The ordinary way anybody crosses space: buy a seat. This is why the
      // travel screen used to be empty for every character without a ship.
      usable = spaceport;
      cost = Math.round(18000 + travelYears(here, targetPlanetId, 'passage') * 22000);
    } else if (method.id === 'stowaway') {
      usable = spaceport;
      cost = 0;
    }
    if (!usable) continue;
    out.push({
      ...method,
      cost,
      years: travelYears(here, targetPlanetId, method.id),
    });
  }
  return out;
}

/**
 * Go somewhere. Travel that takes years actually takes them: the world moves
 * on, everyone ages, and you arrive later than you left.
 */
export function travelTo(state, rng, placeId, methodId) {
  const c = state.character;
  const dest = getPlace(placeId);
  const years = travelYears(getPlace(c.placeId).planet, dest.planet, methodId);
  c.placeId = placeId;
  worldRecord(state, dest.planet).visits += 1;

  addFact(state.memory, {
    type: 'travel', year: c.age, weight: 3, tags: ['travel'],
    text: years > 0 ? `Travelled to ${dest.name}. It took ${years} year${years === 1 ? '' : 's'}.`
      : `Stepped straight to ${dest.name}.`,
  });
  return { years, dest };
}

const PLANET_ACTS = {
  protect: { influence: 18, love: 22, fear: -6, karma: 14, fame: 8 },
  rule: { influence: 30, love: -6, fear: 26, karma: -12, fame: 14 },
  purge: { influence: 40, love: -60, fear: 60, karma: -45, fame: 25 },
  recruit: { influence: 14, love: 10, fear: 4, karma: -2, fame: 4 },
  hide: { influence: -6, love: 0, fear: -6, karma: 0, fame: -2 },
};

/** Do something to a world, and let the world answer. */
export function actOnWorld(state, rng, planetId, act) {
  // Whatever you do to a world, the rest of the universe hears about it.
  const scale = { rule: DEED_SCALE.world_ruled, purge: DEED_SCALE.world_destroyed,
    protect: DEED_SCALE.world_saved, recruit: DEED_SCALE.city }[act] || DEED_SCALE.city;
  const karma = { rule: -10, purge: -45, protect: 20, recruit: -2 }[act] || 0;
  spreadWord(state, { scale, karma });
  const planet = getPlanet(planetId);
  const record = worldRecord(state, planetId);
  const effect = PLANET_ACTS[act] || PLANET_ACTS.recruit;

  record.influence = clamp(record.influence + effect.influence, 0, 100);
  record.love = clamp(record.love + effect.love, 0, 100);
  record.fear = clamp(record.fear + effect.fear, 0, 100);
  if (act === 'rule') record.ruled = true;
  if (act === 'purge') { record.purged = true; record.ruled = false; }

  adjust(state, { karma: effect.karma, fame: effect.fame });

  const lines = [];
  if (act === 'purge') {
    lines.push(`${planet.name} is quiet now. ${planet.population === 'none' ? '' : 'It was not, this morning.'}`);
    state.character.flags.purged_a_world = true;
  } else if (act === 'rule') {
    lines.push(`${planet.name} answers to you. Whatever the law was here, you are the law now.`);
  } else if (act === 'protect') {
    lines.push(`They know who kept them alive. That travels further than you expect.`);
  } else if (act === 'recruit') {
    lines.push(`You leave with people who chose to come.`);
  }

  const response = worldResponse(state, rng, planetId, act);
  if (response) lines.push(response.text);

  addFact(state.memory, {
    type: 'world', year: state.character.age, weight: act === 'purge' ? 9 : 5, tags: ['world'],
    text: `${{ purge: 'Purged', rule: 'Took control of', protect: 'Defended', recruit: 'Recruited from', hide: 'Kept their head down on' }[act]} ${planet.name}.`,
  });

  return { lines, text: lines.join(' '), response };
}

/**
 * Who comes for you. A world with defenders sends them; a world under an
 * empire reports you; going far enough gets divine attention.
 */
export function worldResponse(state, rng, planetId, act) {
  const c = state.character;
  const planet = getPlanet(planetId);
  const year = state.character.birthYear + c.age;
  const hostile = act === 'purge' || act === 'rule';
  if (!hostile) return null;

  const living = (planet.defenders || [])
    .map((id) => getCanon(id))
    .filter((x) => x && year >= x.years[0] && (x.years[1] === null || year <= x.years[1]));

  if (living.length && rng.chance(0.8)) {
    const champion = rng.pick(living);
    c.flags.hunted_by_defenders = true;
    return {
      text: `${champion.name} is already on the way. This world has people who answer for it.`,
      foe: { name: champion.name, canonId: champion.id, power: Math.round(canonPower(champion, year)), raceId: champion.race },
    };
  }

  if (planet.alignment === 'imperial' || c.flags.imperial_attention) {
    return { text: 'The report goes up the chain the same afternoon. Somebody with a rank is now aware of you.' };
  }

  if (act === 'purge' && combatPower(c) > 1e9 && rng.chance(0.35)) {
    c.flags.divine_attention = true;
    return { text: 'Something a very long way away wakes up, asks a question, and is told your name.' };
  }
  return { text: 'Nobody comes. That is somehow worse.' };
}

/** Everything the player has done across the worlds, for the UI. */
export function worldManifest(state) {
  const year = state.character.birthYear + state.character.age;
  return PLANETS.filter((p) => !['otherworld', 'void'].includes(p.id))
    // A world that has not been settled yet, or was blown up last decade, is
    // not somewhere you can have standing.
    .filter((p) => planetExists(p.id, year) || worldRecord(state, p.id).visits > 0)
    .map((p) => {
    const r = worldRecord(state, p.id);
    return {
      id: p.id, name: p.name, standing: standingOn(state, p.id),
      influence: Math.round(r.influence), visits: r.visits,
      inhabitants: p.inhabitants, law: p.law, alignment: p.alignment,
      strength: p.strength, flora: p.flora,
      here: getPlace(state.character.placeId).planet === p.id,
      gone: !planetExists(p.id, year),
    };
  });
}
