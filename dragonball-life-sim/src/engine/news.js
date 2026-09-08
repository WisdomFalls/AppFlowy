// Word from beyond your own life.
//
// A life sim where the only things that ever happened were things you did is
// a smaller galaxy than the one this is set in. Most years get one of two
// kinds of headline: a real one, when something the game already tracks -
// your own reach crossing a tier, an institution you built getting a name of
// its own, a planet going quiet for good - actually happens, and an ambient
// one the rest of the time, so the place keeps moving whether or not you are
// the one moving it.

import { getPlanet, PLANETS } from '../data/planets.js';
import { getPlace } from '../data/places.js';
import { factionsPresent } from '../data/factions.js';
import { render } from './text.js';

// worlds.js already tracks per-planet destruction in state.world.planets,
// but worlds.js is itself a caller of this module (purgeArea reports a full
// purge here) - reading the record directly avoids a worlds.js <-> news.js
// import cycle rather than pulling in worlds.js's own planetDestroyed().
function isGone(state, planetId) {
  const rec = state.world.planets && state.world.planets[planetId];
  return !!(rec && (rec.destroyed || rec.purged));
}

const MAX_NEWS = 60;

/** Append one headline, oldest trimmed off past MAX_NEWS. Silently skips an
 * exact repeat of the most recent line from the same year - ambient rolls
 * can otherwise print the same headline twice in a row. */
export function pushNews(state, { headline, tag = 'ambient', scope = 'galaxy' }) {
  if (!headline) return;
  state.world.news = state.world.news || [];
  const year = state.world.year;
  const last = state.world.news[state.world.news.length - 1];
  if (last && last.headline === headline && last.year === year) return;
  state.world.news.push({ year, headline, tag, scope });
  if (state.world.news.length > MAX_NEWS) state.world.news.splice(0, state.world.news.length - MAX_NEWS);
}

/** Most recent first. */
export function newsFeed(state, limit = 30) {
  return (state.world.news || []).slice(-limit).reverse();
}

function currentUniverse(state) {
  const place = getPlace(state.character.placeId);
  const planet = place && getPlanet(place.planet);
  return (planet && planet.universe) || 7;
}

const AMBIENT_TEMPLATES = [
  `Trade ships report {a delay|a shortage|higher prices than usual|an outright blockade} at [planet]. `
    + `{Nobody official will say why|The listed reason does not add up|It is being called "routine"}.`,
  `A {tournament|sparring circuit|open challenge} on [planet] draws a bigger crowd than usual this year.`,
  `[planet] reports {an unusually quiet year|a strong harvest|a population boom|a wave of new arrivals}.`,
  `Something came down hard on [planet] and nobody official has confirmed what it was.`,
  `A minor territorial dispute breaks out near [planet]. `
    + `{It is expected to blow over|Locals are already choosing sides|Neither side is backing down}.`,
  `Scholars on [planet] claim to have found {a ruin|a wreck|a buried structure|writing} nobody can date.`,
  `A bounty board somewhere near [planet] adds a name nobody recognises yet.`,
  `[faction] is reported active again, this time near [planet].`,
  `A fighter nobody has heard of levels a city block on [planet] and walks away from it. Nobody has come forward to explain.`,
  `Weather stations on [planet] log {a storm nobody predicted|the coldest season on record|three straight years without rain}.`,
  `A ship registered out of [planet] goes missing. `
    + `{It is presumed lost|Search parties have not found wreckage|Insurance has already paid out, which tells you something}.`,
  `Word from [planet]: {a local strongman has been dethroned|a new power broker has emerged and nobody elected them|`
    + `the old guard is not happy about the new one}.`,
  `A market on [planet] {crashes overnight|doubles in a week|stops accepting a currency it took for years, with no warning}.`,
];

const FACTION_TEMPLATES = new Set(['[faction] is reported active again, this time near [planet].']);

/** Called once a year, and not every year gets one - a galaxy this size does
 * not stop for you, but it also does not narrate itself just because you are
 * listening. */
export function ambientNews(state, rng) {
  if (!rng.chance(0.55)) return null;
  const universe = currentUniverse(state);
  const year = state.world.year;
  const pool = PLANETS.filter((p) => (p.universe || 7) === universe && p.population && !isGone(state, p.id));
  if (!pool.length) return null;
  const planet = rng.pick(pool);
  const factions = factionsPresent(year, planet.id, universe);
  const templates = AMBIENT_TEMPLATES.filter((t) => !FACTION_TEMPLATES.has(t) || factions.length);
  const tpl = rng.pick(templates);
  const ctx = { planet: planet.name, faction: factions.length ? rng.pick(factions).name : '' };
  const headline = render(tpl, ctx, rng);
  pushNews(state, { headline, tag: 'ambient', scope: 'galaxy' });
  return { headline };
}
