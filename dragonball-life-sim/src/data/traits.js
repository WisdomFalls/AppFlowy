// Traits.
//
// Two sources, and they behave differently. Blood traits come from your
// parents and are set before you draw breath: you do not earn them and you
// cannot lose them. Earned traits are what a life does to somebody, and they
// arrive when the conditions are met, sometimes whether you wanted them or not.
//
// A trait's `effect` is read by the systems that care. Nothing here reaches
// into the engine itself, so a trait is always a number somewhere else.

export const TRAIT_KINDS = { blood: 'In the blood', earned: 'Earned', origin: 'From how you grew up' };

export const TRAITS = [
  // ------------------------------------------------------------ inherited
  {
    id: 'genius', kind: 'blood', name: 'Genius', rarity: 0.06,
    desc: 'Things arrive whole, and much sooner than they should.',
    effect: { learnSpeed: 1.45, trialEase: 0.12, iq: 22 },
    line: 'You worked it out before they finished explaining it.',
  },
  {
    id: 'slow_study', kind: 'blood', name: 'Slow Study', rarity: 0.09, bad: true,
    desc: 'It goes in eventually. Everything takes two passes.',
    effect: { learnSpeed: 0.62, trialEase: -0.08, iq: -14 },
    line: 'It takes you twice as long and then it never leaves.',
  },
  {
    id: 'prodigy_body', kind: 'blood', name: 'Prodigious Body', rarity: 0.07,
    desc: 'Muscle answers faster than it has any right to.',
    effect: { trainMult: 1.35, potential: 18 },
    line: 'Your body learns things your head has not agreed to yet.',
  },
  {
    id: 'frail', kind: 'blood', name: 'Frail', rarity: 0.08, bad: true,
    desc: 'Everything hurts you more than it hurts other people.',
    effect: { damageTaken: 1.3, healRate: 0.7, maxHealth: -15 },
    line: 'You bruise like fruit and you always have.',
  },
  {
    id: 'huge_reserves', kind: 'blood', name: 'Deep Reserves', rarity: 0.08,
    desc: 'Your ki does not run out when other people\'s does.',
    effect: { kiMult: 1.4, staminaMult: 1.2 },
    line: 'You are still going long after you should not be.',
  },
  {
    id: 'battle_read', kind: 'blood', name: 'Reads a Fight', rarity: 0.07,
    desc: 'You see the punch a beat before it is thrown.',
    effect: { dodge: 0.1, battleInstinct: 22 },
    line: 'You move before you have decided to.',
  },
  {
    id: 'legendary_blood', kind: 'blood', name: 'Legendary Blood', rarity: 0.015, races: ['saiyan', 'halfsaiyan'],
    desc: 'The thing that happens once every thousand years, and it happened to you.',
    effect: { trainMult: 1.5, powerMult: 1.6, rage: 0.2 },
    line: 'Something in your line skipped a thousand years and landed on you.',
  },
  {
    id: 'royal_line', kind: 'blood', name: 'Royal Line', rarity: 0.04, races: ['saiyan', 'frostdemon', 'shinjin'],
    desc: 'People who have never met you know your family name.',
    effect: { fameFloor: 12, charisma: 8 },
    line: 'Your name opens doors and closes others.',
  },
  {
    id: 'thick_skull', kind: 'blood', name: 'Thick Skull', rarity: 0.1,
    desc: 'Concussions happen to other people.',
    effect: { damageTaken: 0.85, durability: 10 },
    line: 'Things bounce off you that should not.',
  },
  {
    id: 'short_fuse', kind: 'blood', name: 'Short Fuse', rarity: 0.11, bad: true,
    desc: 'You are angry before you know why.',
    effect: { rage: 0.25, charisma: -6, tensionGain: 1.3 },
    line: 'It goes from nothing to everything with no step in between.',
  },
  {
    id: 'long_lived', kind: 'blood', name: 'Long-Lived Stock', rarity: 0.07,
    desc: 'Everyone in your family died annoyed at how long it took.',
    effect: { lifespan: 1.2, agingRate: 0.85 },
    line: 'Your grandmother buried three doctors.',
  },
  {
    id: 'lucky', kind: 'blood', name: 'Born Lucky', rarity: 0.06,
    desc: 'Things go your way slightly more often than they should.',
    effect: { luck: 25 },
    line: 'It keeps working out and you have stopped questioning it.',
  },

  // -------------------------------------------------------- from upbringing
  {
    id: 'feral', kind: 'origin', name: 'Feral', from: ['animals'],
    desc: 'You learned to hunt before you learned to talk.',
    effect: { charisma: -10, speed: 8, battleInstinct: 12 },
    line: 'You still hear things other people do not.',
  },
  {
    id: 'self_made', kind: 'origin', name: 'Self-Made', from: ['self_raised', 'street'],
    desc: 'Nobody taught you anything, so nothing you know is borrowed.',
    effect: { discipline: 10, trialEase: 0.06 },
    line: 'Everything you have, you worked out on your own.',
  },
  {
    id: 'drilled', kind: 'origin', name: 'Drilled', from: ['saiyan_creche', 'warrior_clan'],
    desc: 'Graded at three and never allowed to forget the number.',
    effect: { trainMult: 1.2, discipline: 8, happinessFloor: -8 },
    line: 'You know exactly where you ranked, and you always will.',
  },
  {
    id: 'catalogued', kind: 'origin', name: 'Catalogued', from: ['lab'],
    desc: 'You have a serial number and somebody still has the file.',
    effect: { intellect: 8, charisma: -8, durability: 8 },
    line: 'Somewhere there is a folder with your growth curve in it.',
  },
  {
    id: 'occupied', kind: 'origin', name: 'Grew Up Occupied', from: ['conquered'],
    desc: 'Somebody else\'s flag over your town for your whole childhood.',
    effect: { discipline: 6, tensionGain: 1.15, karmaFloor: -5 },
    line: 'You learned very young which questions not to ask out loud.',
  },
  {
    id: 'well_loved', kind: 'origin', name: 'Well Loved', from: ['foster', 'farm', 'city'],
    desc: 'Somebody was pleased to see you every single day.',
    effect: { charisma: 8, happinessFloor: 10, healRate: 1.15 },
    line: 'You have a baseline other people had to build.',
  },

  // ------------------------------------------------------------- earned
  {
    id: 'iron_will', kind: 'earned', name: 'Iron Will', when: (c) => c.stats.discipline >= 85,
    desc: 'You do not stop because stopping is not one of the things you do.',
    effect: { staminaMult: 1.25, trialEase: 0.1 },
    line: 'Somewhere along the way, quitting stopped being available to you.',
  },
  {
    id: 'scarred', kind: 'earned', name: 'Scarred', when: (c) => (c.scars || []).length >= 3,
    desc: 'Three fights that never fully healed.',
    effect: { damageTaken: 0.9, charisma: -4, fameFloor: 5 },
    line: 'People read your history off you before you speak.',
  },
  {
    id: 'killer', kind: 'earned', name: 'Killer', when: (c, s) => (s.stats.kills || 0) >= 3,
    desc: 'You have done it enough times that it is a thing you do.',
    effect: { karmaFloor: -20, tensionGain: 1.4, battleInstinct: 10 },
    line: 'It got easier, and that is the part that should worry you.',
  },
  {
    id: 'merciful', kind: 'earned', name: 'Merciful', when: (c, s) => c.karma >= 55 && (s.stats.kills || 0) === 0,
    desc: 'You have never finished anybody, and people know it.',
    effect: { charisma: 10, karmaFloor: 30, respectGain: 1.2 },
    line: 'You have put a lot of people down and never kept one there.',
  },
  {
    id: 'famous', kind: 'earned', name: 'Known Everywhere', when: (c) => c.fame >= 70,
    desc: 'Strangers on other worlds have opinions about you.',
    effect: { charisma: 6, fameFloor: 60 },
    line: 'You cannot go anywhere without somebody already knowing.',
  },
  {
    id: 'feared', kind: 'earned', name: 'Feared', when: (c) => c.karma <= -50 && c.fame >= 40,
    desc: 'The room changes when you walk into it, and not for the better.',
    effect: { charisma: -12, intimidate: 0.3, fameFloor: 40 },
    line: 'People go quiet, and they were not quiet before.',
  },
  {
    id: 'survivor', kind: 'earned', name: 'Survivor', when: (c) => !!c.flags.brink_of_death && !!c.flags.died_once,
    desc: 'You have been all the way to the edge and come back.',
    effect: { damageTaken: 0.85, healRate: 1.2 },
    line: 'You have died before. It informs your approach.',
  },
  {
    id: 'grieving', kind: 'earned', name: 'Carrying It', when: (c) => !!c.flags.was_not_there,
    desc: 'You were not there when it mattered and you know exactly how far away you were.',
    effect: { happinessFloor: -12, discipline: 6, trainMult: 1.1 },
    line: 'You train harder now. It is not really about the training.',
  },
  {
    id: 'teacher', kind: 'earned', name: 'Teacher', when: (c, s) => (s.stats.taught || 0) >= 2,
    desc: 'Other people fight the way you do now.',
    effect: { charisma: 8, respectGain: 1.25 },
    line: 'Somebody out there throws your punch.',
  },
  {
    id: 'wanderer', kind: 'earned', name: 'Wanderer', when: (c, s) => Object.keys(s.world.planets || {}).length >= 4,
    desc: 'Four worlds and none of them home.',
    effect: { intellect: 6, charisma: 4, happinessFloor: -5 },
    line: 'You have stopped calling anywhere home and started giving coordinates.',
  },
];

export const TRAIT_BY_ID = Object.fromEntries(TRAITS.map((t) => [t.id, t]));

export function getTrait(id) {
  return TRAIT_BY_ID[id];
}

/**
 * The sum of one effect key across every trait somebody has. Multiplicative
 * keys start at 1 and multiply; everything else adds.
 */
const MULTIPLICATIVE = ['learnSpeed', 'trainMult', 'kiMult', 'staminaMult', 'healthMult', 'damageTaken',
  'healRate', 'powerMult', 'lifespan', 'agingRate', 'tensionGain', 'respectGain'];

export function traitEffect(character, key) {
  const ids = character.traits2 || [];
  const mult = MULTIPLICATIVE.includes(key);
  let out = mult ? 1 : 0;
  for (const id of ids) {
    const t = TRAIT_BY_ID[id];
    if (!t || t.effect[key] === undefined) continue;
    if (mult) out *= t.effect[key];
    else out += t.effect[key];
  }
  return out;
}

export function hasTrait(character, id) {
  return (character.traits2 || []).includes(id);
}

/**
 * What a child inherits. Each parent trait has a real chance of passing, and
 * there is a small chance of something arriving from nowhere, because that is
 * how it works.
 */
export function inheritTraits(rng, parents = [], raceId) {
  const out = new Set();
  for (const parent of parents) {
    for (const id of parent.traits2 || []) {
      const t = TRAIT_BY_ID[id];
      if (!t || t.kind !== 'blood') continue;
      if (t.races && !t.races.includes(raceId)) continue;
      if (rng.chance(0.45)) out.add(id);
    }
  }
  // A roll of the dice on top, for a character with no parents on file.
  for (const t of TRAITS) {
    if (t.kind !== 'blood' || out.has(t.id)) continue;
    if (t.races && !t.races.includes(raceId)) continue;
    if (rng.chance(t.rarity * (parents.length ? 0.4 : 1))) out.add(t.id);
  }
  return [...out].slice(0, 3);
}

/** Traits an upbringing hands you. */
export function originTraits(upbringingId) {
  return TRAITS.filter((t) => t.kind === 'origin' && (t.from || []).includes(upbringingId)).map((t) => t.id);
}

/**
 * Anything the life has now earned. Returns the newly acquired ones so the
 * year can announce them.
 */
export function checkEarnedTraits(state) {
  const c = state.character;
  c.traits2 = c.traits2 || [];
  const gained = [];
  for (const t of TRAITS) {
    if (t.kind !== 'earned' || c.traits2.includes(t.id)) continue;
    let ok = false;
    try { ok = t.when(c, state); } catch (e) { ok = false; }
    if (ok) {
      c.traits2.push(t.id);
      gained.push(t);
    }
  }
  return gained;
}
