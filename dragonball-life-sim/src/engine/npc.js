// People. Everyone who is not the player is an NPC record: generated strangers,
// family, and canon characters wrapped in the same shape so every system can
// treat them identically.

import { clamp } from './rng.js';
import { generateFullName, generateTitle, generateEpithet, generateSignatureName } from '../data/names.js';
import { RACES, getRace } from '../data/races.js';
import { getCanon, canonPower, canonAlive } from '../data/canon.js';
import { getPlace } from '../data/places.js';

export const RELATIONS = {
  parent: { label: 'Parent', family: true },
  sibling: { label: 'Sibling', family: true },
  child: { label: 'Child', family: true },
  spouse: { label: 'Spouse', family: true },
  lover: { label: 'Partner', family: false },
  friend: { label: 'Friend', family: false },
  bestfriend: { label: 'Best Friend', family: false },
  rival: { label: 'Rival', family: false },
  mentor: { label: 'Master', family: false },
  student: { label: 'Student', family: false },
  enemy: { label: 'Enemy', family: false },
  nemesis: { label: 'Nemesis', family: false },
  acquaintance: { label: 'Acquaintance', family: false },
  colleague: { label: 'Colleague', family: false },
  pet: { label: 'Companion', family: true },
  fusion: { label: 'Fusion Partner', family: false },
};

let npcCounter = 0;
export function resetNpcCounter(n = 0) { npcCounter = n; }

export function nextNpcId() {
  return 'npc_' + (++npcCounter);
}

const PERSONALITY_TAGS = ['loyal', 'jealous', 'brave', 'greedy', 'kind', 'cold', 'funny', 'grim',
  'ambitious', 'lazy', 'honest', 'devious', 'protective', 'reckless', 'patient', 'vain',
  'curious', 'superstitious', 'blunt', 'gentle', 'vengeful', 'generous'];

const GOALS = ['to be the strongest', 'to find their missing sibling', 'to open a school',
  'to avenge a dead world', 'to be left alone', 'to get rich', 'to be remembered',
  'to protect one specific person', 'to see the Dragon Balls used properly',
  'to prove their teacher wrong', 'to die well', 'to never fight again',
  'to beat you specifically', 'to earn a name worth saying'];

/** A brand new person, appropriate to the era and place. */
export function makeNpc(rng, opts = {}) {
  const raceId = opts.raceId || pickRaceFor(rng, opts);
  const race = getRace(raceId);
  const year = opts.year || 750;
  const age = opts.age ?? rng.int(opts.minAge ?? 14, opts.maxAge ?? 55);
  const powerScale = opts.powerScale ?? 1;

  const base = {};
  for (const [k, v] of Object.entries(race.base)) {
    base[k] = clamp(Math.round(rng.gauss(v, 12, 5, 98)), 1, 99);
  }

  const [lo, hi] = race.startPower;
  let power = rng.float(lo, hi) * powerScale;
  // Grown adults have had time to train.
  power *= Math.pow(1.09, clamp(age - 12, 0, 40)) * rng.float(0.5, 2.2);

  const npc = {
    id: opts.id || nextNpcId(),
    name: opts.name || generateFullName(rng, raceId),
    raceId,
    canonId: null,
    sex: opts.sex || rng.pick(['male', 'female', 'nonbinary', 'male', 'female']),
    age,
    birthYear: year - age,
    alive: true,
    deadSince: null,
    causeOfDeath: null,
    title: opts.title || generateTitle(rng, raceId),
    epithet: rng.chance(0.18) ? generateEpithet(rng) : null,
    stats: base,
    power: Math.max(1, Math.round(power)),
    relation: opts.relation || 'acquaintance',
    closeness: opts.closeness ?? rng.int(20, 55),
    respect: opts.respect ?? rng.int(20, 60),
    tension: opts.tension ?? rng.int(0, 25),
    romance: opts.romance ?? 0,
    tags: rng.sample(PERSONALITY_TAGS, rng.int(2, 3)),
    goal: rng.pick(GOALS),
    look: null,
    placeId: opts.placeId || 'east_city',
    metAt: year,
    metHow: opts.metHow || 'chance',
    history: [],
    techniques: [],
    isCanon: false,
    signature: rng.chance(0.25) ? generateSignatureName(rng) : null,
  };
  return npc;
}

function pickRaceFor(rng, opts) {
  const place = opts.placeId ? getPlace(opts.placeId) : null;
  const tags = place ? place.tags : [];
  const weights = {
    earthling: tags.includes('urban') || tags.includes('civilised') ? 60 : 20,
    saiyan: tags.includes('saiyan') ? 60 : 2,
    halfsaiyan: tags.includes('urban') ? 2 : 1,
    namekian: tags.includes('namek') ? 70 : 2,
    frostdemon: tags.includes('imperial') ? 25 : 1,
    majin: 1,
    android: tags.includes('tech') || tags.includes('lab') ? 12 : 2,
    bioandroid: tags.includes('lab') ? 8 : 0.4,
    shinjin: tags.includes('divine') ? 40 : 0.3,
    tuffle: 1.5,
    yardratian: tags.includes('spirit') ? 60 : 1,
    cerealian: 1.5,
  };
  return rng.weighted(RACES.map((r) => r.id), (id) => weights[id] ?? 1);
}

/** Wrap a canon character as an NPC in the player's life. */
export function makeCanonNpc(rng, canonId, year, relation = 'acquaintance') {
  const c = getCanon(canonId);
  if (!c) return null;
  return {
    id: 'canon_' + canonId,
    name: c.name,
    raceId: c.race,
    canonId,
    sex: c.sex || 'unknown',
    age: Math.max(1, year - c.years[0]),
    birthYear: c.years[0],
    alive: canonAlive(c, year),
    deadSince: null,
    causeOfDeath: null,
    title: null,
    epithet: null,
    stats: {},
    power: Math.round(canonPower(c, year)),
    relation,
    closeness: 25,
    respect: 30,
    tension: 5,
    romance: 0,
    tags: [c.temperament],
    goal: null,
    placeId: c.home,
    metAt: year,
    metHow: 'canon',
    history: [],
    techniques: c.teaches || [],
    isCanon: true,
    personality: c.personality,
    quirk: c.quirk,
    canonTags: c.tags,
  };
}

/** Parents, and possibly siblings, for a newborn player character. */
export function makeFamily(rng, character, year) {
  const out = [];
  const race = getRace(character.raceId);
  const parentRace = character.raceId === 'halfsaiyan'
    ? ['saiyan', 'earthling']
    : [character.raceId, character.raceId];

  if (race.perks.includes('asexualBirth') && rng.chance(0.6)) {
    // Namekians can produce a single child alone.
    const parent = makeNpc(rng, {
      raceId: character.raceId, relation: 'parent', year,
      age: rng.int(60, 300), closeness: 60, respect: 55, placeId: character.placeId,
      metHow: 'family',
    });
    parent.name = parent.name;
    parent.title = 'Elder';
    out.push(parent);
    return out;
  }

  if (character.raceId === 'android' || character.raceId === 'bioandroid') {
    const creator = makeNpc(rng, {
      raceId: 'earthling', relation: 'parent', year, age: rng.int(45, 75),
      closeness: rng.int(10, 45), respect: rng.int(30, 70), placeId: 'red_ribbon_lab',
      metHow: 'creator', title: 'Doctor',
    });
    creator.tags.push('obsessive');
    out.push(creator);
    return out;
  }

  for (let i = 0; i < 2; i++) {
    const p = makeNpc(rng, {
      raceId: parentRace[i], relation: 'parent', year,
      age: rng.int(20, 44), closeness: rng.int(45, 80), respect: rng.int(40, 75),
      placeId: character.placeId, metHow: 'family',
      sex: i === 0 ? 'female' : 'male',
    });
    out.push(p);
  }

  const siblings = rng.weighted([0, 1, 2, 3], (n) => [45, 32, 16, 7][n]);
  for (let i = 0; i < siblings; i++) {
    out.push(makeNpc(rng, {
      raceId: character.raceId, relation: 'sibling', year,
      age: rng.int(0, 14), closeness: rng.int(30, 75), respect: rng.int(20, 60),
      tension: rng.int(5, 45), placeId: character.placeId, metHow: 'family',
    }));
  }
  return out;
}

/** A child of the player and a partner, inheriting race and a slice of stats. */
export function makeChild(rng, character, partner, year) {
  let raceId = character.raceId;
  const p = partner ? partner.raceId : character.raceId;
  const mix = [character.raceId, p].sort().join('+');
  if (mix === 'earthling+saiyan' || mix === 'earthling+halfsaiyan' || mix === 'halfsaiyan+saiyan') raceId = 'halfsaiyan';
  else if (character.raceId === 'halfsaiyan' && p === 'halfsaiyan') raceId = 'halfsaiyan';
  else if (p && rng.chance(0.5)) raceId = p;

  const child = makeNpc(rng, {
    raceId, relation: 'child', year, age: 0,
    closeness: 70, respect: 40, tension: 0, placeId: character.placeId, metHow: 'family',
  });
  // Children inherit potential, which is why the second generation outclasses the first.
  const parentPower = Math.max(1, character.power);
  child.inheritedPower = Math.max(1, Math.round(Math.pow(parentPower, 0.42) * rng.float(0.8, 2.4)));
  child.power = Math.max(1, Math.round(child.inheritedPower * 0.02));
  for (const k of Object.keys(child.stats)) {
    const parentStat = character.stats[k] ?? 50;
    const otherStat = partner && partner.stats && partner.stats[k] !== undefined ? partner.stats[k] : 50;
    child.stats[k] = clamp(Math.round(rng.gauss((parentStat + otherStat) / 2, 10, 5, 95)), 1, 99);
  }
  child.parentIds = [character.id || 'player', partner ? partner.id : null].filter(Boolean);
  return child;
}

/** Yearly drift in a relationship when nothing specific happens. */
export function relationshipTick(rng, npc, character) {
  if (!npc.alive) return;
  npc.age += 1;
  const neglect = rng.float(0, 3.2);
  const familyBond = RELATIONS[npc.relation]?.family ? 0.5 : 0;
  npc.closeness = clamp(npc.closeness - neglect + familyBond + (npc.tags.includes('loyal') ? 1.5 : 0), 0, 100);
  npc.tension = clamp(npc.tension + rng.float(-1.5, 1.2) + (npc.tags.includes('jealous') ? 0.8 : 0), 0, 100);
  if (npc.relation === 'rival' || npc.relation === 'nemesis') {
    // Rivals train too. That is the point of them.
    npc.power = Math.round(npc.power * rng.float(1.02, 1.24));
  } else if (!npc.isCanon && npc.age < 45) {
    npc.power = Math.round(npc.power * rng.float(1.0, 1.08));
  }
  if (npc.romance > 0) npc.romance = clamp(npc.romance - rng.float(0, 1.5) + (npc.closeness > 65 ? 1.2 : 0), 0, 100);
}

export function describeNpc(npc) {
  const race = getRace(npc.raceId);
  const bits = [race.short, npc.title].filter(Boolean);
  return `${npc.name}${npc.epithet ? ' ' + npc.epithet : ''} - ${bits.join(', ')}`;
}

export function relationLabel(npc) {
  return RELATIONS[npc.relation]?.label || 'Acquaintance';
}

/** Overall feeling, used for event gating and the relationship screen. */
export function bondScore(npc) {
  return clamp(Math.round(npc.closeness * 0.6 + npc.respect * 0.3 - npc.tension * 0.5 + npc.romance * 0.2), -50, 100);
}
