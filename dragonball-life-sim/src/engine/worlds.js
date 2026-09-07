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
    state.world.planets[planetId] = { influence: 0, fear: 0, love: 0, ruled: false, purged: false, visits: 0, strain: 0, destroyed: false };
  }
  return state.world.planets[planetId];
}

// ------------------------------------------------------------ area purging
//
// A planet is not one button. It is however many named places PLACES.js
// actually lists for it, and "purge the planet" is what it looks like once
// every one of those has been gone through in turn - not a single click
// that erases a population the game never otherwise tracked as living
// anywhere in particular.

function placeRecord(state, placeId) {
  state.world.places = state.world.places || {};
  if (!state.world.places[placeId]) state.world.places[placeId] = { purged: false };
  return state.world.places[placeId];
}

/** Every named area on a planet, and whether it has already been emptied. */
export function planetAreas(state, planetId) {
  return PLACES.filter((p) => p.planet === planetId)
    .map((p) => ({ id: p.id, name: p.name, purged: !!placeRecord(state, p.id).purged }));
}

/** A planet only actually reads as gone once nothing named on it is left. */
export function planetFullyPurged(state, planetId) {
  const areas = PLACES.filter((p) => p.planet === planetId);
  return areas.length > 0 && areas.every((p) => placeRecord(state, p.id).purged);
}

/**
 * Purge wherever the character is actually standing, not the whole world in
 * one motion. Whoever is registered as living at that specific place - your
 * own family included, if that is where they happen to be - dies for it,
 * by name, and the cost scales with who they turned out to be rather than
 * a flat karma number nobody has to look at.
 */
export function purgeArea(state, rng, placeId) {
  const c = state.character;
  const place = getPlace(placeId);
  const planet = getPlanet(place.planet);
  const rec = placeRecord(state, placeId);
  if (rec.purged) {
    return { lines: [`There is nothing left at ${place.name} to purge.`], text: `There is nothing left at ${place.name} to purge.`, killed: [], lovedOnes: [] };
  }
  rec.purged = true;

  const LOVED = ['spouse', 'child', 'parent', 'sibling', 'lover', 'bestfriend'];
  const here = Object.values(state.npcs || {}).filter((n) => n.alive && n.placeId === placeId);
  const killed = [];
  const lovedOnes = [];
  for (const npc of here) {
    npc.alive = false;
    npc.deadSince = c.birthYear + c.age;
    npc.causeOfDeath = `Purged with ${place.name}, by ${c.name}`;
    killed.push(npc);
    if (LOVED.includes(npc.relation)) lovedOnes.push(npc);
  }

  addFact(state.memory, {
    type: 'world', year: c.age, weight: lovedOnes.length ? 10 : 9, tags: ['world', 'purge'],
    text: `Purged ${place.name} on ${planet.name}.${killed.length ? ` ${killed.length} ${killed.length === 1 ? 'person' : 'people'} died there.` : ' Nobody was there to die.'}`,
  });
  for (const npc of lovedOnes) {
    addFact(state.memory, {
      type: 'death', year: c.age, weight: 10, subject: npc.id, tags: ['loss', 'purge'],
      text: `${npc.name} died when you purged ${place.name}. You knew they were there.`,
    });
  }

  const happinessHit = -(6 + lovedOnes.length * 20);
  const karmaHit = -(18 + lovedOnes.length * 15);
  adjust(state, { happiness: happinessHit, karma: karmaHit, fame: 6 });
  spreadWord(state, { scale: killed.length ? DEED_SCALE.city : DEED_SCALE.street, karma: -20 });

  const lines = [`${place.name} is quiet now.${killed.length ? ' It was not, this morning.' : ' There was not much here to begin with.'}`];
  if (lovedOnes.length) {
    lines.push(`${lovedOnes.map((n) => n.name).join(', ')} ${lovedOnes.length === 1 ? 'was' : 'were'} there. You knew that before you started.`);
  }

  const fullyGone = planetFullyPurged(state, place.planet);
  if (fullyGone) {
    const record = worldRecord(state, place.planet);
    record.purged = true;
    record.ruled = false;
    c.flags.purged_a_world = true;
    lines.push(`${planet.name} is empty now. All of it.`);
  }

  const response = worldResponse(state, rng, place.planet, 'purge');
  if (response) lines.push(response.text);

  return { lines, text: lines.join(' '), killed, lovedOnes, fullyGone, response };
}

// -------------------------------------------------------- wild worlds

/**
 * A handful of worlds have nobody on them at all - creatures, not people -
 * which makes them the one place you can go completely all out without a
 * bystander anywhere in the blast radius. That freedom has its own cost:
 * enough of that, on a small enough rock, and you eventually do to it what
 * canon's strongest fighters do to planets without meaning to.
 */
export function wildTrainingRisk(state, planetId) {
  const record = worldRecord(state, planetId);
  if (record.destroyed) return 0;
  const power = combatPower(state.character);
  const threshold = 5e7;
  // Below half the threshold, nothing you do here adds up to anything -
  // no amount of repetition turns a light hit into a planet-cracking one.
  if (power < threshold * 0.5) return 0;
  const base = clamp((power / threshold - 1) * 0.1, 0, 0.7);
  const strain = clamp((record.strain || 0) * 0.01, 0, 0.2) * clamp(power / threshold, 0, 1);
  return clamp(base + strain, 0, 0.85);
}

export function planetDestroyed(state, planetId) {
  return !!worldRecord(state, planetId).destroyed;
}

/** Cutting loose entirely on a wild world. May end with there being no world left. */
export function trainAllOutOnWild(state, rng) {
  const c = state.character;
  const place = getPlace(c.placeId);
  const planet = getPlanet(place.planet);
  const record = worldRecord(state, place.planet);
  const risk = wildTrainingRisk(state, place.planet);
  record.strain = (record.strain || 0) + rng.int(8, 15);
  record.visits += 1;
  if (!rng.chance(risk)) return { destroyed: false, risk };

  record.destroyed = true;
  record.purged = true;
  record.ruled = false;

  const here = Object.values(state.npcs || {}).filter((n) => n.alive && n.placeId === place.id);
  for (const npc of here) {
    npc.alive = false;
    npc.deadSince = c.birthYear + c.age;
    npc.causeOfDeath = `Caught on ${planet.name} when it came apart`;
  }

  c.flags.destroyed_a_planet = true;
  adjust(state, { fame: 30, karma: here.length ? -20 : 0 });
  spreadWord(state, { scale: DEED_SCALE.world_destroyed, karma: here.length ? -20 : 0 });

  addFact(state.memory, {
    type: 'world', year: c.age, weight: 10, tags: ['world', 'destroyed'],
    text: `Went too far training on ${planet.name}. It is rubble now, and you are the reason.`
      + (here.length ? ` ${here.length} ${here.length === 1 ? 'person' : 'people'} died with it.` : ''),
  });

  // There is nowhere left to stand. The shockwave puts you back somewhere
  // that is still there.
  const fallback = PLACES.find((p) => p.planet === 'earth') || PLACES[0];
  c.placeId = fallback.id;

  return { destroyed: true, risk, planetName: planet.name, fallbackName: fallback.name, killed: here.length };
}

export function standingOn(state, planetId) {
  const r = worldRecord(state, planetId);
  if (r.destroyed) return 'Destroyed';
  if (r.purged) return 'Erased';
  const areas = planetAreas(state, planetId);
  const purgedCount = areas.filter((a) => a.purged).length;
  if (purgedCount > 0) return `${purgedCount}/${areas.length} areas emptied`;
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
  recruit: { influence: 14, love: 10, fear: 4, karma: -2, fame: 4 },
  hide: { influence: -6, love: 0, fear: -6, karma: 0, fame: -2 },
};

/**
 * Do something to a world, and let the world answer. Purge is handled
 * entirely by purgeArea() (called with wherever the character is actually
 * standing) - it acts one named place at a time, kills whoever is actually
 * registered as living there, and only marks the whole planet purged once
 * every place on it has gone through that. Every other act here still
 * reads as planet-wide, which is honest: protecting, ruling or recruiting
 * a world was never claiming to have physically covered every street on
 * it the way emptying one does.
 */
export function actOnWorld(state, rng, planetId, act, placeId) {
  if (act === 'purge') {
    return purgeArea(state, rng, placeId || state.character.placeId);
  }
  // Whatever you do to a world, the rest of the universe hears about it.
  const scale = { rule: DEED_SCALE.world_ruled,
    protect: DEED_SCALE.world_saved, recruit: DEED_SCALE.city }[act] || DEED_SCALE.city;
  const karma = { rule: -10, protect: 20, recruit: -2 }[act] || 0;
  spreadWord(state, { scale, karma });
  const planet = getPlanet(planetId);
  const record = worldRecord(state, planetId);
  const effect = PLANET_ACTS[act] || PLANET_ACTS.recruit;

  record.influence = clamp(record.influence + effect.influence, 0, 100);
  record.love = clamp(record.love + effect.love, 0, 100);
  record.fear = clamp(record.fear + effect.fear, 0, 100);
  if (act === 'rule') record.ruled = true;

  adjust(state, { karma: effect.karma, fame: effect.fame });

  const lines = [];
  if (act === 'rule') {
    lines.push(`${planet.name} answers to you. Whatever the law was here, you are the law now.`);
  } else if (act === 'protect') {
    lines.push(`They know who kept them alive. That travels further than you expect.`);
  } else if (act === 'recruit') {
    lines.push(`You leave with people who chose to come.`);
  }

  const response = worldResponse(state, rng, planetId, act);
  if (response) lines.push(response.text);

  addFact(state.memory, {
    type: 'world', year: state.character.age, weight: 5, tags: ['world'],
    text: `${{ rule: 'Took control of', protect: 'Defended', recruit: 'Recruited from', hide: 'Kept their head down on' }[act]} ${planet.name}.`,
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
  // Wild worlds have nobody on them to have an opinion of you - they do not
  // belong on a ledger of standing, only on the travel list.
  return PLANETS.filter((p) => !['otherworld', 'void'].includes(p.id) && !p.wild)
    // A world that has not been settled yet, or was blown up last decade, is
    // not somewhere you can have standing.
    .filter((p) => planetExists(p.id, year) || worldRecord(state, p.id).visits > 0)
    .map((p) => {
    const r = worldRecord(state, p.id);
    const areas = planetAreas(state, p.id);
    return {
      id: p.id, name: p.name, standing: standingOn(state, p.id),
      influence: Math.round(r.influence), visits: r.visits,
      inhabitants: p.inhabitants, law: p.law, alignment: p.alignment,
      strength: p.strength, flora: p.flora,
      here: getPlace(state.character.placeId).planet === p.id,
      gone: !planetExists(p.id, year) || r.purged || r.destroyed,
      areas,
    };
  });
}
