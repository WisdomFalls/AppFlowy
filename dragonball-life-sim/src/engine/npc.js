// People. Everyone who is not the player is an NPC record: generated strangers,
// family, and canon characters wrapped in the same shape so every system can
// treat them identically.

import { clamp } from './rng.js';
import { generateFullName, generateTitle, generateEpithet, generateSignatureName } from '../data/names.js';
import { RACES, getRace, raceHasTail } from '../data/races.js';
import { getCanon, canonPower, canonAlive } from '../data/canon.js';
import { getPlace } from '../data/places.js';
import { canonLook, SPECIES_LOOK } from '../data/canonlooks.js';
import { render } from './text.js';

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

const APPEARANCE_HAIR = ['cropped black', 'a long braid', 'wild and unwashed', 'shaved', 'silver, prematurely',
  'dyed something impractical', 'tied back hard', 'lavender', 'a single stubborn cowlick', 'none at all'];
const APPEARANCE_EYES = ['dark', 'pale grey', 'green', 'red-rimmed', 'gold', 'one clouded over', 'black, no visible iris'];
const APPEARANCE_MARK = ['a scar through one eyebrow', 'burn scars along the jaw', 'a family tattoo',
  'four fingers on the left hand', 'no marks at all', 'a brand on the shoulder', 'a broken nose that set badly'];
const CLOTHING = ['a patched training gi', 'battle armour a size too big', 'a good coat, badly kept',
  'work clothes and nothing else', 'Frieza Force issue with the insignia scraped off', 'monastic robes',
  'a city suit', 'whatever was on the floor', 'weighted training gear', 'a uniform from an army that no longer exists'];
const GEAR = ['a cracked scouter', 'a sword that has been re-hilted twice', 'nothing at all', 'a capsule case',
  'a senzu bean they will not admit to', 'a photograph they do not explain', 'a dented flask',
  'their teacher\'s weighted wristbands'];
const MOODS = ['steady', 'restless', 'grieving', 'furious about something', 'quietly pleased',
  'exhausted', 'obsessive', 'content', 'frightened', 'spoiling for a fight'];

const GOALS = ['to be the strongest', 'to find their missing sibling', 'to open a school',
  'to avenge a dead world', 'to be left alone', 'to get rich', 'to be remembered',
  'to protect one specific person', 'to see the Dragon Balls used properly',
  'to prove their teacher wrong', 'to die well', 'to never fight again',
  'to beat you specifically', 'to earn a name worth saying'];

/** A brand new person, appropriate to the era and place. */
const NPC_HAIR = ['spiked', 'wild', 'long', 'ponytail', 'bob', 'cropped', 'mohawk', 'bald', 'braid', 'topknot',
  'flame', 'pigtails', 'afro', 'buzz', 'sidepart'];
const NPC_MARKS = ['scar_cheek', 'scar_brow', 'burn_arm', 'dots', 'tattoo_arm', 'birthmark', 'missing_ear'];
const NPC_ACC = ['headband', 'bandana', 'glasses', 'earring', 'necklace', 'wristbands', 'scarf', 'hat', 'cape'];

/**
 * An appearance record in the same shape the player uses, so one drawing
 * routine serves everybody. Species decides the ground rules, the roll does
 * the rest, and it is stored rather than regenerated so a person looks the
 * same every time you see them.
 */
export function makeAppearance(rng, raceId, sex) {
  const sp = SPECIES_LOOK[raceId] || SPECIES_LOOK.other;
  const hairless = ['namekian', 'frostdemon', 'majin', 'bioandroid', 'kryllian'].includes(raceId);
  const build = rng.pick(['small', 'wiry', 'lean', 'balanced', 'balanced', 'stocky', 'massive']);
  const base = {
    saiyan: [168, 66], halfsaiyan: [170, 64], earthling: [168, 62], namekian: [196, 78],
    frostdemon: [158, 52], majin: [180, 96], android: [170, 64], bioandroid: [198, 92],
    shinjin: [150, 46], tuffle: [140, 40], yardratian: [146, 38], cerealian: [172, 66],
    kryllian: [174, 70],
  }[raceId] || [168, 64];
  return {
    skin: sp.skin,
    face: rng.chance(0.5) ? sp.face : rng.pick(['square', 'round', 'angular', 'long']),
    eyeShape: rng.pick(['sharp', 'round', 'narrow', 'heavy', 'wide']),
    eyeColour: rng.chance(0.55) ? sp.eyeColour : rng.pick(['black', 'brown', 'green', 'blue', 'grey', 'gold']),
    hairStyle: hairless ? 'bald' : (rng.chance(0.4) ? sp.hairStyle : rng.pick(NPC_HAIR)),
    hairColour: sp.hairColour,
    outfit: rng.chance(0.55) ? sp.outfit : rng.pick(['casual', 'coat', 'gi_orange', 'gi_blue', 'gi_black', 'lab']),
    buildShape: build,
    heightCm: Math.round(rng.gauss(base[0], 9, 90, 260)),
    weightKg: Math.round(rng.gauss(base[1], 8, 20, 300)),
    marks: rng.chance(0.35) ? [rng.pick(NPC_MARKS)] : [],
    accessories: rng.chance(0.4) ? [rng.pick(NPC_ACC)] : [],
    // Rolled independently of build, same as the player.
    bust: Math.round(rng.gauss(1, 0.28, 0.55, 1.75) * 100) / 100,
    // Some people change how they look; most do not.
    vain: rng.chance(0.22),
  };
}

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
    sex: opts.sex || rng.pick(['male', 'female']),
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
    trust: opts.trust ?? rng.int(15, 45),
    knowledge: opts.knowledge ?? 0,
    tags: rng.sample(PERSONALITY_TAGS, rng.int(2, 3)),
    goal: rng.pick(GOALS),
    look: null,
    placeId: opts.placeId || 'east_city',
    metAt: year,
    metHow: opts.metHow || 'chance',
    history: [],
    techniques: [],
    transformations: [],
    isCanon: false,
    signature: rng.chance(0.25) ? generateSignatureName(rng) : null,

    appearance: opts.appearance || makeAppearance(rng, raceId, opts.sex || 'male'),

    // The dossier. Most of it stays hidden until you have earned a look at it.
    look: {
      hair: rng.pick(APPEARANCE_HAIR),
      eyes: rng.pick(APPEARANCE_EYES),
      mark: rng.pick(APPEARANCE_MARK),
      clothing: rng.pick(CLOTHING),
    },
    gear: rng.pick(GEAR),
    mood: rng.pick(MOODS),
    zeni: Math.round(Math.pow(10, rng.float(3, 6.4))),
    homePlaceId: opts.placeId || 'east_city',
    kin: {
      parents: rng.chance(0.55) ? [generateFullName(rng, raceId), generateFullName(rng, raceId)] : [],
      lost: rng.chance(0.4) ? generateFullName(rng, raceId) : null,
    },
    hasDragonBall: false,
    wall: null,
    growthFocus: rng.pick(['power', 'technique', 'family', 'money', 'peace']),
    tail: raceHasTail(raceId),
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
    kryllian: tags.includes('hivekind') ? 70 : 0.5,
  };
  return rng.weighted(RACES.map((r) => r.id), (id) => weights[id] ?? 1);
}

/** Wrap a canon character as an NPC in the player's life. */
export function makeCanonNpc(rng, canonId, year, relation = 'acquaintance') {
  const c = getCanon(canonId);
  if (!c) return null;
  const look = canonLook(canonId, year, c.race);
  return {
    id: 'canon_' + canonId,
    appearance: { heightCm: 170, weightKg: 68, ...look },
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
    tail: raceHasTail(c.race),
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
  const ANDROID_KIN = ['android', 'bioandroid', 'half_android', 'frost_android'];
  const FROST_KIN = ['frostdemon', 'half_frostkin', 'frost_android'];
  const isEarthlingLike = (r) => r === 'earthling' || r === 'halfsaiyan';
  if (mix === 'earthling+saiyan' || mix === 'earthling+halfsaiyan' || mix === 'halfsaiyan+saiyan') raceId = 'halfsaiyan';
  else if (character.raceId === 'halfsaiyan' && p === 'halfsaiyan') raceId = 'halfsaiyan';
  else if (isEarthlingLike(character.raceId) && ANDROID_KIN.includes(p)) raceId = 'half_android';
  else if (isEarthlingLike(p) && ANDROID_KIN.includes(character.raceId)) raceId = 'half_android';
  else if (isEarthlingLike(character.raceId) && FROST_KIN.includes(p)) raceId = 'half_frostkin';
  else if (isEarthlingLike(p) && FROST_KIN.includes(character.raceId)) raceId = 'half_frostkin';
  else if (FROST_KIN.includes(character.raceId) && ANDROID_KIN.includes(p)) raceId = 'frost_android';
  else if (FROST_KIN.includes(p) && ANDROID_KIN.includes(character.raceId)) raceId = 'frost_android';
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

const FOCUS_PATHS = ['power', 'technique', 'family', 'money', 'peace'];

/**
 * An NPC's own year. They train, stall, break through, learn things, get rich,
 * grow up and choose a direction - so a friend you have known for thirty years
 * is not the person you met.
 *
 * Returns a line of news when something happened worth hearing about.
 */
const DRIFT_HAIR = ['spiked', 'wild', 'long', 'ponytail', 'bob', 'cropped', 'mohawk', 'bald', 'braid', 'topknot',
  'flame', 'pigtails', 'afro', 'buzz', 'sidepart'];

/**
 * People change how they look. Not often, and mostly the ones who care: a new
 * haircut, something they started wearing, a scar that did not heal, and grey
 * when the species is one that goes grey.
 */
export function driftAppearance(rng, npc, year) {
  const a = npc.appearance;
  if (!a || npc.isCanon) return null;
  const race = getRace(npc.raceId);
  const hairless = ['namekian', 'frostdemon', 'majin', 'bioandroid'].includes(npc.raceId);
  let news = null;

  if (!hairless && rng.chance(a.vain ? 0.14 : 0.03)) {
    const was = a.hairStyle;
    a.hairStyle = rng.pick(DRIFT_HAIR.filter((h) => h !== was));
    news = `${npc.name} has done something to their hair.`;
  }
  if (rng.chance(a.vain ? 0.1 : 0.03)) {
    a.outfit = rng.pick(['casual', 'coat', 'gi_orange', 'gi_blue', 'gi_black', 'armour_saiyan', 'namek_robe']);
  }
  if (rng.chance(0.04)) {
    const acc = rng.pick(NPC_ACC);
    a.accessories = a.accessories || [];
    if (!a.accessories.includes(acc)) {
      a.accessories.push(acc);
      if (!news) news = `${npc.name} is wearing something new.`;
    }
  }
  // Grey, once, when the species ages at anything like a human rate.
  if (!a.wentGrey && npc.age > 55 && (race.agingRate ?? 1) >= 0.7 && rng.chance(0.08)) {
    a.wentGrey = true;
    a.hairColour = rng.chance(0.5) ? 'silver' : 'white';
    news = `${npc.name} has gone grey.`;
  }
  const order = ['small', 'wiry', 'lean', 'balanced', 'stocky', 'massive'];
  const i = order.indexOf(a.buildShape);
  if (i >= 0 && npc.growthFocus === 'power' && npc.age < 45 && i < order.length - 1 && rng.chance(0.04)) {
    a.buildShape = order[i + 1];
  }
  return news;
}

/** A fight leaves something behind on them too. */
export function scarNpc(rng, npc, from) {
  const a = npc.appearance;
  if (!a || npc.isCanon) return null;
  if (['namekian', 'majin', 'android', 'bioandroid'].includes(npc.raceId)) return null;
  a.marks = a.marks || [];
  const pool = ['scar_cheek', 'scar_brow', 'scar_chest', 'scar_arm', 'burn_arm']
    .filter((m) => !a.marks.includes(m));
  if (!pool.length) return null;
  const mark = rng.pick(pool);
  a.marks.push(mark);
  npc.scarStory = npc.scarStory || [];
  npc.scarStory.push({ mark, from: from || 'a fight', year: npc.birthYear + npc.age, text: `A scar from ${from || 'a fight'}.` });
  return `${npc.name} carries something from that fight now.`;
}

export function progressNpc(rng, npc, year, opts = {}) {
  if (!npc.alive || npc.isCanon) return null;
  let news = null;

  // Children pick a direction somewhere in their teens.
  if (npc.age === 12 || (npc.age > 12 && !npc.growthFocus)) {
    npc.growthFocus = rng.pick(FOCUS_PATHS);
    if (npc.relation === 'child') {
      news = `${npc.name} has decided what they are: ${
        { power: 'a fighter, obviously', technique: 'a student of technique', family: 'the sort who stays home',
          money: 'far more interested in money than in training', peace: 'not interested in fighting at all' }[npc.growthFocus]
      }.`;
    }
  }

  const focus = npc.growthFocus || 'power';

  if (focus === 'power' || focus === 'technique') {
    if (npc.wall) {
      // Stuck. Everybody gets stuck.
      const years = year - npc.wall;
      if (years >= rng.int(2, 5)) {
        npc.wall = null;
        npc.power = Math.round(npc.power * rng.float(1.7, 3.1));
        news = `${npc.name} has broken through whatever they were stuck on. They are not the same fighter.`;
      } else {
        npc.power = Math.round(npc.power * rng.float(0.99, 1.02));
      }
    } else {
      const rate = focus === 'power' ? rng.float(1.04, 1.18) : rng.float(1.02, 1.1);
      npc.power = Math.round(npc.power * (npc.age < 40 ? rate : 1 + (rate - 1) * 0.4));
      if (rng.chance(0.12)) {
        npc.wall = year;
        if (rng.chance(0.4)) news = `${npc.name} has hit a wall and knows it.`;
      }
    }
    if (focus === 'technique' && rng.chance(0.14) && opts.techniquePool) {
      const known = npc.techniques || [];
      const options = opts.techniquePool.filter((t) => !known.includes(t));
      if (options.length) {
        const learned = rng.pick(options);
        npc.techniques = known.concat(learned);
        if (rng.chance(0.5)) news = `${npc.name} has learned something new.`;
      }
    }
    // A form, if their species has one and they have grown into it.
    if (opts.formsFor && rng.chance(0.06)) {
      const forms = opts.formsFor(npc);
      // Only the forms a power level alone can explain. A ritual or a mentor is
      // the player's story, not background bookkeeping.
      const next = forms.find((f) => !(npc.transformations || []).includes(f.id)
        && f.req.power && npc.power >= f.req.power * 1.5
        && !f.req.custom && !(f.req.mentors || []).length && !(f.req.techniques || []).length);
      if (next) {
        npc.transformations = (npc.transformations || []).concat(next.id);
        news = `${npc.name} can do something they could not do before. ${next.name}.`;
      }
    }
  } else if (focus === 'money') {
    npc.zeni = Math.round((npc.zeni || 1000) * rng.float(1.05, 1.4));
    npc.power = Math.round(npc.power * rng.float(0.99, 1.03));
    if (rng.chance(0.05)) news = `${npc.name} has done extremely well for themselves.`;
  } else if (focus === 'family') {
    npc.power = Math.round(npc.power * rng.float(0.98, 1.04));
    if (npc.age > 18 && npc.age < 50 && rng.chance(0.09)) {
      npc.children = (npc.children || 0) + 1;
      news = `${npc.name} has a child.`;
    }
  } else {
    npc.power = Math.round(npc.power * rng.float(0.97, 1.02));
  }

  if (rng.chance(0.25)) {
    npc.mood = rng.pick(['steady', 'restless', 'grieving', 'furious about something', 'quietly pleased',
      'exhausted', 'obsessive', 'content', 'frightened', 'spoiling for a fight']);
  }
  const lookNews = driftAppearance(rng, npc, year);
  if (lookNews && !news) news = lookNews;
  if (rng.chance(0.04)) npc.hasDragonBall = true;

  return news;
}

/** Yearly drift in a relationship when nothing specific happens. */
export function relationshipTick(rng, npc, character) {
  if (!npc.alive) return;
  npc.age += 1;
  // Decay slows as a bond deepens: people you have known for thirty years do
  // not become strangers because you skipped a year.
  const depth = (npc.closeness + (npc.trust ?? 30)) / 200;
  const neglect = rng.float(0, 3.2) * (1 - depth * 0.75);
  const familyBond = RELATIONS[npc.relation]?.family ? 1.2 : 0;
  const married = npc.relation === 'spouse' ? 1.5 : 0;
  npc.closeness = clamp(npc.closeness - neglect + familyBond + married
    + (npc.tags.includes('loyal') ? 1.5 : 0), 0, 100);
  npc.trust = clamp((npc.trust ?? 30) + (npc.closeness > 60 ? 0.6 : -0.3), 0, 100);
  npc.tension = clamp(npc.tension + rng.float(-1.5, 1.2) + (npc.tags.includes('jealous') ? 0.8 : 0), 0, 100);
  if (npc.relation === 'rival' || npc.relation === 'nemesis') {
    // Rivals train harder than anyone, because you are the reason.
    npc.power = Math.round(npc.power * rng.float(1.05, 1.28));
  }
  if (npc.romance > 0) npc.romance = clamp(npc.romance - rng.float(0, 1.5) + (npc.closeness > 65 ? 1.2 : 0), 0, 100);
}

/**
 * A shorthand read on who somebody is, for the systems that need to speak
 * about a spouse or partner as a person rather than a stat block. Nothing
 * here is stored; it is recomputed from what the NPC already carries.
 */
export function spouseFlavor(npc) {
  const tags = npc.tags || [];
  return {
    fighter: (npc.power || 0) > 1000 || npc.isCanon,
    gentle: tags.some((t) => t === 'gentle' || t === 'kind' || t === 'patient'),
    fierce: tags.some((t) => t === 'reckless' || t === 'vengeful' || t === 'ambitious' || t === 'brave'),
    vain: tags.includes('vain') || !!(npc.appearance && npc.appearance.vain),
    jealous: tags.includes('jealous'),
    funny: tags.includes('funny'),
    grim: tags.includes('grim') || tags.includes('cold'),
  };
}

/** The wedding you actually get, not a generic one, going by who is standing next to you. */
export function weddingLine(npc, rng) {
  const f = spouseFlavor(npc);
  if (f.fighter && f.fierce) {
    return render(`{Half the guests could level a city and at least one of them nearly does|Somebody destroys part of the venue and it is still the best day of the year|The vows are short, because neither of you is built for standing still that long}.`, {}, rng);
  }
  if (f.fighter) {
    return render(`{It is disciplined and quiet, more like a promotion than a party|Everyone in the room could kill you and nobody does|The toast is one sentence, and it is enough}.`, {}, rng);
  }
  if (f.vain) {
    return render(`{Nothing about the day is understated, on purpose|What you are wearing gets more attention than the vows, and neither of you minds|It is the kind of wedding people are still talking about a decade later}.`, {}, rng);
  }
  if (f.gentle) {
    return render(`{It is a small wedding, exactly as quiet as they wanted it|Nobody makes a scene, which is the whole point|It is soft, brief, and exactly right}.`, {}, rng);
  }
  if (f.funny) {
    return render(`{Somebody's toast goes on twice as long as it should and gets funnier every minute|The ceremony keeps almost breaking down into laughing|It is not a solemn day and was never going to be}.`, {}, rng);
  }
  return render(`{It is a small wedding|It is an enormous wedding|Somewhere in between, and better for it}.`, {}, rng);
}

/** How a year spent on a partner actually goes, by who they are. */
export function courtLine(npc, rng) {
  const f = spouseFlavor(npc);
  if (f.fighter) return render(`{You spend the year sparring as often as you talk, and call that romance|Half your dates end in a friendly beating|You relax the only way either of you knows how, which is not very}.`, {}, rng);
  if (f.vain) return render(`{You go somewhere with good light and better company|They pick everything, and they are right every time|It is extravagant and you do not regret a zeni of it}.`, {}, rng);
  if (f.gentle) return render(`{You go somewhere with no fighting in it and mean to keep it that way|A whole year of nothing important, which turns out to be everything|Quiet, mostly, and better for it}.`, {}, rng);
  if (f.grim) return render(`{Neither of you says much, and somehow that is the point|It is not a loud year, and you would not trade it|Some of the best time you spend together is spent in silence}.`, {}, rng);
  return render(`{You go somewhere with no fighting in it|You are extremely bad at relaxing and they find that funny|A whole year of nothing important}.`, {}, rng);
}

/** A birth reaction shaped by who is holding the other end of it. */
export function birthLine(npc, rng) {
  const f = spouseFlavor(npc);
  if (f.fighter) return render(`{They are already talking about training|"Look at the grip on this one"|They hold the baby like something they need to protect, which is new}.`, {}, rng);
  if (f.gentle) return render(`{They cry, quietly, and do not explain why|They do not put the baby down for the first two days|It is the softest you have ever seen them}.`, {}, rng);
  if (f.funny) return render(`{They are already making jokes about who the kid takes after|"This one's going to be trouble, I can tell"|They will not stop narrating what the baby is thinking}.`, {}, rng);
  return render(`{Small, loud, and already stronger than they should be|They have your eyes and somebody else's temper|You hold them and something in your chest reorganises itself}.`, {}, rng);
}

/**
 * What you actually know about somebody, gated by how well you know them.
 * Everything unknown reads as a blank rather than being silently omitted, so
 * the gaps are visible and worth closing.
 */
export function dossier(npc, opts = {}) {
  const k = opts.full ? 4 : (npc.knowledge || 0);
  const unknown = '—';
  const race = getRace(npc.raceId);
  const rows = [];

  rows.push({ label: 'Species', value: race.short });
  rows.push({ label: 'Sex', value: npc.sex === 'female' ? 'Female' : 'Male' });
  rows.push({ label: 'Age', value: String(npc.age) });
  rows.push({ label: 'Standing', value: relationLabel(npc) });
  rows.push({ label: 'Mood', value: k >= 1 ? npc.mood : unknown });
  // Knowing somebody well tells you how dangerous they are. It does not hand
  // you a number: that takes ki sense or a scouter, and the caller supplies
  // the reading because only it knows what you are carrying.
  rows.push({
    label: 'Power',
    value: opts.powerRead !== undefined
      ? opts.powerRead
      : (k >= 2 ? Math.round(npc.power).toLocaleString('en-US')
        : k >= 1 ? approximatePower(npc.power) : unknown),
  });
  rows.push({ label: 'Wearing', value: k >= 1 && npc.look ? npc.look.clothing : unknown });
  rows.push({
    label: 'Looks',
    value: k >= 1 && npc.look ? `${npc.look.hair} hair, ${npc.look.eyes} eyes, ${npc.look.mark}` : unknown,
  });
  rows.push({ label: 'Carries', value: k >= 2 ? npc.gear : unknown });
  rows.push({
    label: 'Techniques',
    value: k >= 2 ? ((npc.techniques || []).length ? npc.techniques.length + ' known' : 'nothing formal') : unknown,
  });
  rows.push({
    label: 'Forms',
    value: k >= 3 ? ((npc.transformations || []).length ? npc.transformations.length + ' unlocked' : 'none') : unknown,
  });
  rows.push({ label: 'Wants', value: k >= 2 ? npc.goal : unknown });
  rows.push({ label: 'Money', value: k >= 3 ? Math.round(npc.zeni || 0).toLocaleString('en-US') + ' Zeni' : unknown });
  rows.push({ label: 'Lives', value: k >= 3 ? getPlace(npc.homePlaceId || 'east_city').name : unknown });
  rows.push({
    label: 'Family',
    value: k >= 3 && npc.kin
      ? [(npc.kin.parents || []).join(' and ') || 'nobody they name',
        npc.kin.lost ? `${npc.kin.lost}, dead` : null].filter(Boolean).join('; ')
      : unknown,
  });
  rows.push({ label: 'Dragon Ball', value: k >= 4 ? (npc.hasDragonBall ? 'Has one' : 'No') : unknown });
  return rows;
}

function approximatePower(p) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, p))));
  return `around ${Math.round(p / magnitude) * magnitude}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function describeNpc(npc) {
  const race = getRace(npc.raceId);
  const bits = [race.short, npc.title].filter(Boolean);
  return `${npc.name}${npc.epithet ? ' ' + npc.epithet : ''} - ${bits.join(', ')}`;
}

export function relationLabel(npc) {
  return RELATIONS[npc.relation]?.label || 'Acquaintance';
}

/**
 * Overall feeling. Weighted so a genuinely close platonic bond can reach 100 -
 * the old formula quietly capped friendship in the seventies, which made every
 * long relationship feel stuck.
 */
export function bondScore(npc) {
  const trust = npc.trust ?? 30;
  const raw = npc.closeness * 0.5 + npc.respect * 0.22 + trust * 0.28
    + npc.romance * 0.12 - npc.tension * 0.45;
  return clamp(Math.round(raw), -50, 100);
}

const BOND_TIERS = [
  [92, 'Inseparable'], [78, 'Very close'], [62, 'Close'], [46, 'Friendly'],
  [30, 'Familiar'], [14, 'Acquainted'], [0, 'Distant'], [-20, 'Cold'], [-100, 'Hostile'],
];

export function bondLabel(npc) {
  const score = bondScore(npc);
  for (const [floor, label] of BOND_TIERS) if (score >= floor) return label;
  return 'Hostile';
}

const ROMANCE_TIERS = [
  [90, 'Devoted'], [72, 'In love'], [54, 'Serious'], [36, 'Courting'],
  [18, 'Interested'], [1, 'A spark'],
];

export function romanceLabel(npc) {
  const r = npc.romance || 0;
  for (const [floor, label] of ROMANCE_TIERS) if (r >= floor) return label;
  return null;
}

/** What you have worked out about somebody, from nothing to their whole file. */
export const KNOWLEDGE_LEVELS = [
  'You barely know them',
  'You know roughly what they can do',
  'You have seen them fight properly',
  'You know what they are hiding',
  'You know them completely',
];

export function knowledgeLabel(npc) {
  return KNOWLEDGE_LEVELS[Math.min(4, npc.knowledge || 0)];
}

/** Learning about somebody: sparring, time, or reading their mind. */
export function learnAbout(npc, amount = 1) {
  npc.knowledge = Math.min(4, (npc.knowledge || 0) + amount);
  return npc.knowledge;
}
