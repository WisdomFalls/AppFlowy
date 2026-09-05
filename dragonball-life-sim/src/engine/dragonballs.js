// The Dragon Balls.
//
// Seven of them, scattered, and each one has to be found rather than clicked
// for. A planet that has already given up a ball is much less likely to be
// hiding another, so collecting a set means going places.

import { clamp } from './rng.js';
import { PLACES, getPlace } from '../data/places.js';

export const GRID = 7;
const STAR_NAMES = ['One-Star', 'Two-Star', 'Three-Star', 'Four-Star', 'Five-Star', 'Six-Star', 'Seven-Star'];

const REGION_WORDS = [
  'the northern ice', 'a rainforest basin', 'a desert shelf', 'the seabed off a dead coast',
  'a mountain range nobody has named', 'under a city', 'a crater field', 'an island chain',
  'a salt flat', 'deep canyon country', 'an old battlefield', 'a forest that grew over ruins',
];

function planetsInPlay(state) {
  // One entry per distinct world, using its most notable place as the anchor.
  const byPlanet = new Map();
  for (const place of PLACES) {
    if (['otherworld', 'void'].includes(place.planet)) continue;
    if (!byPlanet.has(place.planet)) byPlanet.set(place.planet, place);
  }
  return Array.from(byPlanet.values());
}

/**
 * Scatter a fresh set. Each ball is placed on a world by weighted draw, and a
 * world's weight is quartered for every ball already sitting there - so two on
 * one planet happens, three is rare, and seven never.
 */
export function scatterBalls(state, rng) {
  const homePlace = getPlace(state.character.placeId);
  const worlds = planetsInPlay(state);
  const counts = {};
  const balls = [];

  for (let i = 0; i < 7; i++) {
    const place = rng.weighted(worlds, (p) => {
      const already = counts[p.planet] || 0;
      let w = 1;
      if (p.planet === homePlace.planet) w = 3.2;          // your own world first
      if (p.tags.includes('dragonballs')) w *= 2.4;
      if (p.tags.includes('civilised')) w *= 1.3;
      return w * Math.pow(0.25, already);
    });
    counts[place.planet] = (counts[place.planet] || 0) + 1;
    balls.push({
      star: i + 1,
      name: STAR_NAMES[i] + ' Ball',
      planet: place.planet,
      placeId: place.id,
      region: rng.pick(REGION_WORDS),
      x: rng.int(0, GRID - 1),
      y: rng.int(0, GRID - 1),
      found: false,
      surveyed: false,
    });
  }
  return {
    dragon: homePlace.planet === 'namek' || homePlace.planet === 'new_namek' ? 'Porunga' : 'Shenron',
    balls,
    createdYear: state.character.birthYear + state.character.age,
  };
}

export function ensureBallSet(state, rng) {
  if (!state.world.ballSet || !state.world.ballSet.balls) {
    state.world.ballSet = scatterBalls(state, rng);
  }
  return state.world.ballSet;
}

export function ballsHeld(state) {
  const set = state.world.ballSet;
  if (!set) return 0;
  return set.balls.filter((b) => b.found).length;
}

/** Balls still hidden on a given world. */
export function ballsOn(state, planet) {
  const set = state.world.ballSet;
  if (!set) return [];
  return set.balls.filter((b) => !b.found && b.planet === planet);
}

/** What the radar can tell you before you commit to a search. */
export function surveyPlanet(state, rng, planet) {
  const here = ballsOn(state, planet);
  const hasRadar = state.character.items.includes('dragon_radar');
  if (!hasRadar) {
    return here.length
      ? { count: null, hint: 'Rumours put something here. Nothing you would call evidence.' }
      : { count: null, hint: 'Nobody here has heard of anything like it.' };
  }
  return {
    count: here.length,
    hint: here.length === 0
      ? 'The radar is flat across the whole world. Nothing here.'
      : here.length === 1
        ? 'One signal, somewhere on this world.'
        : `${here.length} signals on this world.`,
  };
}

/** Begin a search on the world you are standing on. */
export function startHunt(state, rng, planet) {
  ensureBallSet(state, rng);
  const candidates = ballsOn(state, planet);
  const hasRadar = state.character.items.includes('dragon_radar');
  const scouter = state.character.items.includes('scouter');

  const pings = (hasRadar ? 6 : 3)
    + (scouter ? 1 : 0)
    + Math.floor((state.character.stats.intellect || 40) / 40);

  if (!candidates.length) {
    return { empty: true, planet, pings: 0, pingsLeft: 0, revealed: [], message: 'There is nothing on this world to find.' };
  }

  const target = rng.pick(candidates);
  return {
    empty: false,
    planet,
    star: target.star,
    ballName: target.name,
    region: target.region,
    x: target.x,
    y: target.y,
    pings,
    pingsLeft: pings,
    revealed: [],
    found: false,
    over: false,
    message: hasRadar
      ? `The radar has a fix on ${target.region}. Narrow it down.`
      : `Somebody swears there is one in ${target.region}. You have no radar, so this is mostly walking.`,
  };
}

function distanceReading(d) {
  if (d === 0) return 'On top of it.';
  if (d === 1) return 'The signal is screaming. It is right next to you.';
  if (d === 2) return 'Very close.';
  if (d <= 3) return 'Close. Getting warmer.';
  if (d <= 4) return 'A faint reading.';
  if (d <= 5) return 'Barely a flicker.';
  return 'Nothing out here.';
}

/** Search one square. */
export function pingSquare(state, hunt, rng, x, y) {
  if (hunt.over || hunt.pingsLeft <= 0) return { message: 'You are out of time to search.', over: true };
  if (hunt.revealed.some((r) => r.x === x && r.y === y)) {
    return { message: 'You have already been over that ground.', repeat: true };
  }

  const d = Math.max(Math.abs(hunt.x - x), Math.abs(hunt.y - y));
  hunt.pingsLeft -= 1;
  hunt.revealed.push({ x, y, d });

  if (d === 0) {
    hunt.found = true;
    hunt.over = true;
    const set = state.world.ballSet;
    const ball = set.balls.find((b) => b.star === hunt.star);
    if (ball) ball.found = true;
    return {
      message: `${hunt.ballName}. ${rng.pick([
        'Buried under two metres of rock and perfectly unscratched.',
        'Sitting in the open like it had been waiting.',
        'In the belly of something that objected to giving it up.',
        'Being used as a paperweight by somebody who had no idea.',
      ])}`,
      found: true,
      over: true,
      held: ballsHeld(state),
    };
  }

  if (hunt.pingsLeft <= 0) {
    hunt.over = true;
    return { message: `${distanceReading(d)} And that is the season gone.`, over: true, found: false, d };
  }
  return { message: distanceReading(d), d, over: false, found: false };
}

/** Once you have all seven you can call the dragon. */
export function summonReady(state) {
  return ballsHeld(state) >= 7;
}

/** Wishes scatter them again, and they go inert for a year. */
export function scatterAfterWish(state, rng) {
  state.world.ballSet = scatterBalls(state, rng);
  state.world.ballsInert = (state.character.birthYear + state.character.age) + 1;
}

export function ballsAreInert(state) {
  const year = state.character.birthYear + state.character.age;
  return !!(state.world.ballsInert && year < state.world.ballsInert);
}

/** A readable list for the UI. */
export function ballManifest(state) {
  const set = state.world.ballSet;
  if (!set) return [];
  return set.balls.map((b) => ({
    star: b.star,
    name: b.name,
    found: b.found,
    where: b.found ? 'In your hands' : (b.surveyed ? `${getPlace(b.placeId).name} - ${b.region}` : 'Somewhere'),
  }));
}
