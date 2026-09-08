// Game state: the character, the world, and everyone in it.

import { Rng, clamp, hashSeed } from './rng.js';
import { createMemory, addFact } from './memory.js';
import { CREATABLE_RACES, getRace, sexesFor, UPBRINGINGS, BODY_TYPES, TEMPERAMENTS, hasPerk, maturity, raceHasTail } from '../data/races.js';
import { getPlace } from '../data/places.js';
import { getPlanet } from '../data/planets.js';
import { eraName, worldPowerBaseline } from '../data/timeline.js';
import { generateFullName } from '../data/names.js';
import { rollOrigin } from './origins.js';
import { inheritTraits, originTraits, traitEffect } from '../data/traits.js';
import { emptyPurse, currencyFor, priceIn, credit } from '../data/currency.js';
import { makeFamily, resetNpcCounter } from './npc.js';
import { STAT_KEYS, kiMaxFor, healthMaxFor, staminaMaxFor, lifeExpectancy, combatPower, powerTier } from './stats.js';

export const SAVE_VERSION = 3;

export const APPEARANCE = {
  hair: ['spiked black', 'long black', 'cropped', 'shaved bald', 'wild and untamed', 'neat side-part',
    'a single stubborn cowlick', 'braided', 'lavender', 'white', 'orange', 'blue', 'a topknot'],
  eyes: ['black', 'dark brown', 'green', 'red', 'grey', 'gold', 'one of each', 'pale blue', 'no visible iris'],
  build: BODY_TYPES.map((b) => b.name),
  marking: ['a scar across the nose', 'a birthmark shaped like a star', 'burn scars on both forearms',
    'six dots on the forehead', 'a missing fingertip', 'no markings at all', 'a family tattoo',
    'a third eye', 'antenna', 'pale patches across the shoulders', 'a cracked tooth'],
};

export function defaultCreation(rng) {
  const raceId = rng.pick(CREATABLE_RACES).id;
  const race = getRace(raceId);
  return {
    name: generateFullName(rng, raceId),
    raceId,
    sex: rng.pick(sexesFor(raceId)),
    upbringingId: rng.pick(UPBRINGINGS).id,
    temperamentId: rng.pick(TEMPERAMENTS).id,
    bodyId: rng.pick(BODY_TYPES).id,
    fightingStyle: rng.pick(['martial_arts', 'martial_arts', 'weapons', 'both']),
    hair: rng.pick(race.hairColours.length ? race.hairColours : APPEARANCE.hair),
    eyes: rng.pick(APPEARANCE.eyes),
    marking: rng.pick(APPEARANCE.marking),
    birthYear: 737,
    placeId: rng.pick(race.homeworlds),
  };
}

export function createGame(creation, seedInput) {
  const seed = seedInput === undefined || seedInput === null || seedInput === ''
    ? Math.floor(Math.random() * 4294967295)
    : (typeof seedInput === 'number' ? seedInput : hashSeed(String(seedInput)));
  const rng = new Rng(seed);
  resetNpcCounter(0);

  const race = getRace(creation.raceId);
  const birthYearIn = creation.birthYear ?? 737;

  // You pick a species, a century and a name. Everything else about where you
  // came from is rolled against what that species was doing in that century.
  const origin = rollOrigin(rng, creation.raceId, birthYearIn, { placeId: creation.placeId });
  const upbringing = UPBRINGINGS.find((u) => u.id === (creation.upbringingId || origin.upbringingId)) || UPBRINGINGS[6];
  const temperament = TEMPERAMENTS.find((t) => t.id === (creation.temperamentId || origin.temperamentId)) || TEMPERAMENTS[2];
  const body = BODY_TYPES.find((b) => b.id === (creation.bodyId || origin.bodyId)) || BODY_TYPES[2];

  const stats = {};
  for (const k of STAT_KEYS) {
    const base = race.base[k] ?? 45;
    stats[k] = clamp(Math.round(rng.gauss(base, 8, 5, 95)
      + (upbringing.stats[k] || 0) + (temperament.stats[k] || 0) + (body.stats[k] || 0)), 1, 95);
  }

  const [plo, phi] = race.startPower;
  const startPower = Math.max(1, Math.round(rng.float(plo, phi) * upbringing.power));

  const birthYear = birthYearIn;
  const placeId = creation.placeId && getPlace(creation.placeId)
    ? creation.placeId
    : (origin.placeId || race.homeworlds[0]);

  const character = {
    name: creation.name || generateFullName(rng, creation.raceId),
    raceId: creation.raceId,
    sex: (() => {
      const allowed = sexesFor(creation.raceId);
      if (allowed.includes(creation.sex)) return creation.sex;
      return allowed.includes('male') ? 'male' : allowed[0];
    })(),
    appearance: Object.assign({
      build: body.name,
      buildShape: body.id,
      hairStyle: 'spiked', hairColour: 'black',
      eyeShape: 'sharp', eyeColour: 'black',
      skin: 'light', face: 'square', outfit: 'casual',
      marks: [], customMark: '', accessories: [], customAccessory: '',
      heightCm: 175, weightKg: 70, stance: 'formless', stanceName: '',
    }, origin.look || {}, creation.look || {}),

    // Rolled, not chosen. These are the numbers a life sim should not let you
    // shop for: what you could become, how fast you read a fight, how quick
    // you are, and how the universe treats you.
    potential: origin.potential,
    battleInstinct: origin.battleInstinct,
    iq: origin.iq,
    luck: origin.luck,
    looks: origin.looks,

    // What your blood gave you, and what your upbringing added. Set before
    // anything else happens and never chosen.
    traits2: [],
    // What the life leaves on the body. Each entry is drawn on the portrait
    // and listed in the record, with who or what did it.
    scars: [],
    upbringingId: upbringing.id,
    temperamentId: temperament.id,
    bodyId: body.id,

    age: 0,
    birthYear,
    alive: true,
    death: null,
    inAfterlife: false,
    keptBody: false,
    // Which of the twelve universes this life actually started in - Sadala
    // is Universe 6, not 7, and travel logic needs to keep knowing that
    // even after you leave, not just while you happen to be standing there.
    universe: getPlanet(getPlace(placeId).planet).universe || 7,

    stats,
    vitals: { health: 100, healthMax: 100, happiness: 65, ki: 40, kiMax: 60, stamina: 100, staminaMax: 100 },
    power: startPower,
    peakPower: startPower,
    zenkaiCount: 0,

    fame: origin.lineageFameBonus || 0,
    karma: temperament.tags.includes('evil') ? -10 : temperament.tags.includes('good') ? 10 : 0,
    zeni: Math.round(5000 * upbringing.wealth),

    techniques: race.startingTechniques.slice(),
    transformations: [],
    activeForm: null,
    signature: null,
    extraPerks: [],
    traits: temperament.tags.slice(),

    placeId,
    career: null,
    education: null,
    items: [],
    senzu: 0,

    mentors: [],
    tail: raceHasTail(creation.raceId),
    fightingStyle: ['martial_arts', 'weapons', 'both'].includes(creation.fightingStyle) ? creation.fightingStyle : 'martial_arts',
    flags: origin.lineage ? { saiyanLineage: origin.lineage } : {},
    achievements: [],
    lifeExpectancy: 80,
    trainingFocus: null,
    yearsInAfterlife: 0,
    institution: null,
    faction: null,
    factionRank: 0,
    factionStanding: 0,
    photos: [],
    captures: [],
  };
  // Traits, before the derived numbers, because several of them move those.
  character.traits2 = inheritTraits(rng, creation.parents || [], creation.raceId)
    .concat(originTraits(upbringing.id));
  character.potential = clamp(character.potential + traitEffect(character, 'potential'), 1, 120);
  character.battleInstinct = clamp(character.battleInstinct + traitEffect(character, 'battleInstinct'), 1, 120);
  character.iq = clamp(character.iq + traitEffect(character, 'iq'), 40, 200);
  character.luck = clamp(character.luck + traitEffect(character, 'luck'), 1, 120);
  for (const k of STAT_KEYS) {
    const bump = traitEffect(character, k);
    if (bump) character.stats[k] = clamp(character.stats[k] + bump, 1, 99);
  }
  const powerMult = traitEffect(character, 'powerMult');
  if (powerMult !== 1) character.power = Math.max(1, Math.round(character.power * powerMult));
  character.peakPower = character.power;

  // You are born holding whatever the place you were born settles in. A
  // Saiyan on Planet Vegeta has never seen a Zeni note.
  character.purse = emptyPurse();
  const bornCurrency = currencyFor(getPlace(placeId).planet);
  credit(character, bornCurrency.id, priceIn(character.zeni, bornCurrency.id));
  character.zeni = character.purse.zeni;

  character.vitals.kiMax = kiMaxFor(character);
  character.vitals.ki = character.vitals.kiMax;
  character.vitals.healthMax = healthMaxFor(character);
  character.vitals.health = character.vitals.healthMax;
  character.vitals.staminaMax = staminaMaxFor(character);
  character.vitals.stamina = character.vitals.staminaMax;
  character.lifeExpectancy = lifeExpectancy(character, rng);

  // A body at birth is not a body at eighteen. Without this, height and
  // weight show full adult figures for the entire first year, since
  // driftBody() (which does this same scaling) does not run until the
  // player's first age-up. adultHeight/adultWeight are cached now, in the
  // same shape driftBody() expects, so growth continues from the real
  // adult figure rather than from this shrunk starting point.
  {
    const bio = maturity(character);
    if (bio < 18) {
      const a = character.appearance;
      const scale = 0.34 + 0.66 * Math.min(1, bio / 18);
      a.adultHeight = a.heightCm;
      a.adultWeight = a.weightKg;
      a.heightCm = Math.round(a.adultHeight * scale);
      a.weightKg = Math.max(3, Math.round(a.adultWeight * Math.pow(scale, 2.4)));
    }
  }

  const state = {
    version: SAVE_VERSION,
    seed,
    rng: rng.toJSON(),
    createdAt: Date.now(),
    character,
    npcs: {},
    world: {
      year: birthYear,
      flags: {},
      resolved: [],
      divergences: [],
      activeThreats: [],
      tournamentWins: 0,
      dragonBalls: 0,
      dragonBallSet: null,
      wishesUsed: [],
      news: [],
    },
    memory: createMemory(),
    log: [],
    pending: null,
    aiEnabled: true,
    aiCalls: 0,
    // Headless callers (tests, the soak harness) flip this on so fights resolve
    // without a UI driving them turn by turn.
    autoBattle: false,
    legacy: null,
    stats: { fights: 0, wins: 0, losses: 0, kills: 0, deaths: 0, yearsPlayed: 0, techniquesLearned: 0 },
  };

  // Family
  const family = makeFamily(rng, character, birthYear);
  for (const npc of family) state.npcs[npc.id] = npc;

  state.rng = rng.toJSON();

  addFact(state.memory, {
    type: 'birth', year: 0, weight: 5,
    text: `Born ${race.name.toLowerCase() === 'earthling' ? 'a Human'
      : (/^[aeiou]/i.test(race.name) ? 'an ' : 'a ') + race.name} on ${getPlace(placeId).name} in Age ${birthYear}.`,
    tags: ['origin'],
  });
  if (family.length) {
    addFact(state.memory, {
      type: 'family', year: 0, weight: 4,
      text: `Raised by ${family.filter((f) => f.relation === 'parent').map((f) => f.name).join(' and ') || 'nobody in particular'}.`,
      tags: ['origin', 'family'],
    });
  }

  return state;
}

// ------------------------------------------------------------------ helpers

export function getRng(state) {
  return Rng.fromJSON(state.rng);
}

export function saveRng(state, rng) {
  state.rng = rng.toJSON();
}

export function currentYear(state) {
  return state.character.birthYear + state.character.age;
}

export function place(state) {
  return getPlace(state.character.placeId);
}

export function npcList(state, filter = () => true) {
  return Object.values(state.npcs).filter(filter);
}

export function livingNpcs(state) {
  return npcList(state, (n) => n.alive);
}

export function npcsByRelation(state, relation) {
  return npcList(state, (n) => n.relation === relation);
}

export function addNpc(state, npc) {
  state.npcs[npc.id] = npc;
  return npc;
}

export function findNpc(state, id) {
  return state.npcs[id];
}

export function characterSummary(state) {
  const c = state.character;
  const race = getRace(c.raceId);
  return {
    name: c.name,
    race: race.name,
    age: c.age,
    year: currentYear(state),
    era: eraName(currentYear(state)),
    place: place(state).name,
    power: c.power,
    combat: Math.round(combatPower(c)),
    tier: powerTier(combatPower(c)),
    baseline: Math.round(worldPowerBaseline(currentYear(state))),
  };
}

/** Compact snapshot handed to the AI layer. Kept small on purpose. */
export function aiContext(state) {
  const c = state.character;
  const race = getRace(c.raceId);
  const p = place(state);
  return {
    name: c.name,
    race: race.name,
    age: c.age,
    year: currentYear(state),
    era: eraName(currentYear(state)),
    location: p.name,
    locationDesc: p.desc,
    power: Math.round(combatPower(c)),
    tier: powerTier(combatPower(c)),
    health: Math.round(c.vitals.health),
    happiness: Math.round(c.vitals.happiness),
    karma: Math.round(c.karma),
    fame: Math.round(c.fame),
    zeni: Math.round(c.zeni),
    traits: c.traits.slice(0, 5),
    forms: c.transformations.slice(),
    techniques: c.techniques.slice(0, 12),
    career: c.career ? `${c.career.title}` : 'unemployed',
  };
}

export function isChild(state) {
  return maturity(state.character) < 13;
}

export function isAdult(state) {
  return !isChild(state);
}

export function hasItem(state, id) {
  return state.character.items.includes(id);
}

export function giveItem(state, id) {
  if (!state.character.items.includes(id)) state.character.items.push(id);
}

export function spend(state, amount) {
  if (state.character.zeni < amount) return false;
  state.character.zeni -= amount;
  return true;
}

export function adjust(state, changes = {}) {
  const c = state.character;
  if (changes.health !== undefined) c.vitals.health = clamp(c.vitals.health + changes.health, 0, healthCap(c));
  if (changes.happiness !== undefined) c.vitals.happiness = clamp(c.vitals.happiness + changes.happiness, 0, 100);
  if (changes.ki !== undefined) c.vitals.ki = clamp(c.vitals.ki + changes.ki, 0, c.vitals.kiMax);
  if (changes.fame !== undefined) c.fame = clamp(c.fame + changes.fame, 0, 100);
  if (changes.karma !== undefined) c.karma = clamp(c.karma + changes.karma, -100, 100);
  if (changes.zeni !== undefined) c.zeni = Math.max(0, c.zeni + changes.zeni);
  if (changes.power !== undefined) {
    c.power = Math.max(1, c.power + changes.power);
    c.peakPower = Math.max(c.peakPower, c.power);
  }
  if (changes.powerMult !== undefined) {
    c.power = Math.max(1, Math.round(c.power * changes.powerMult));
    c.peakPower = Math.max(c.peakPower, c.power);
  }
  if (changes.stats) {
    for (const [k, v] of Object.entries(changes.stats)) {
      if (STAT_KEYS.includes(k)) c.stats[k] = clamp((c.stats[k] || 0) + v, 1, 100);
    }
  }
  c.vitals.kiMax = kiMaxFor(c);
  c.vitals.ki = Math.min(c.vitals.ki, c.vitals.kiMax);
  refreshCeilings(c);
}

/**
 * The ceilings move as the character does, so they are recomputed rather than
 * stored once. Old saves that predate them get them filled in here.
 */
export function healthCap(character) {
  const max = healthMaxFor(character);
  character.vitals.healthMax = max;
  return max;
}

export function refreshCeilings(character) {
  const hMax = healthMaxFor(character);
  const sMax = staminaMaxFor(character);
  character.vitals.healthMax = hMax;
  character.vitals.staminaMax = sMax;
  character.vitals.health = Math.min(character.vitals.health ?? hMax, hMax);
  if (character.vitals.stamina === undefined) character.vitals.stamina = sMax;
  character.vitals.stamina = Math.min(character.vitals.stamina, sMax);
  return character.vitals;
}

export function setFlag(state, flag, value = true) {
  state.character.flags[flag] = value;
}

export function flag(state, name) {
  return !!state.character.flags[name];
}

export function worldFlag(state, name) {
  return !!state.world.flags[name];
}

export function setWorldFlag(state, name, value = true) {
  state.world.flags[name] = value;
}
