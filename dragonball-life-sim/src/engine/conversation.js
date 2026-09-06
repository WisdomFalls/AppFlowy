// What you talk about, and how it sounds.
//
// Every conversation in the game used to read the same: two people of
// unspecified ages sitting somewhere having an uncomplicated afternoon. A
// nought-year-old was catching up with their mother like old friends.
//
// A conversation now has a topic, and which topics are open depends on how old
// you are, who they are to you, how well you know each other, and what species
// you both are. A small child asks their father to show them something. A
// grown one who left comes back and asks about the planet.

import { clamp } from './rng.js';
import { render } from './text.js';
import { maturity, getRace } from '../data/races.js';
import { getCanon } from '../data/canon.js';
import { getPlace } from '../data/places.js';
import { eraName } from '../data/timeline.js';

/**
 * Topics. `when` decides whether a topic is open at all; `weight` decides how
 * likely it is to come up when the game picks for you.
 *
 *   minAge / maxAge  - your biological age
 *   relations        - who they have to be to you
 *   reveals          - what you learn: knowledge, a fact, a technique, a stat
 */
export const TOPICS = [
  // ------------------------------------------------------ very small
  {
    id: 'be_carried', name: 'Be near them', minAge: 0, maxAge: 3, weight: 8,
    relations: ['parent', 'sibling', 'mentor', 'friend'],
    lines: [
      '{You do not have words yet|Nothing is said, because you cannot|You have no idea what any of it means}. '
      + '{[who] talks anyway, the whole time|[who] carries you about and keeps up a commentary|[who] tells you things you will not remember}.',
      '{You are handed between people|Somebody is always holding you|You sleep through most of it}. '
      + '{[who] is the one who is always there|You know [who] by smell before you know them by face}.',
    ],
    effect: { closeness: 12, trust: 8, happiness: 6 },
  },
  {
    id: 'tantrum', name: 'Make it their problem', minAge: 1, maxAge: 5, weight: 5,
    relations: ['parent', 'sibling'],
    lines: [
      '{You scream until something happens|You will not be put down|You have discovered volume}. '
      + '{[who] holds out for about nine minutes|It works, which teaches you something unhelpful|[who] does not give in, and you respect that later}.',
    ],
    effect: { closeness: 3, tension: 5, happiness: 4 },
  },
  {
    id: 'show_me', name: 'Ask them to show you something', minAge: 3, maxAge: 13, weight: 9,
    relations: ['parent', 'sibling', 'mentor', 'friend'],
    lines: [
      '{You want to see it again|You ask about forty times|You will not stop asking}. '
      + '{[who] shows you how to hold your hands|[who] makes you do it slowly, which is unbearable|[who] laughs and shows you anyway}. '
      + '{You get it wrong for a year|It is the first real thing anybody teaches you|You practise it on a wall until somebody stops you}.',
    ],
    effect: { closeness: 10, respect: 6 },
    teaches: 'stat',
  },
  {
    id: 'why_questions', name: 'Ask why about everything', minAge: 3, maxAge: 10, weight: 7,
    relations: ['parent', 'sibling', 'mentor', 'friend', 'acquaintance'],
    lines: [
      '{You ask why until they run out|Every answer produces two more questions|You are relentless}. '
      + '{[who] gets as far as the third why and gives up|[who] answers all of them, seriously, which nobody has ever done for them|[who] starts making things up around the fifth one}.',
    ],
    effect: { closeness: 8, stats: { intellect: 2 } },
  },

  // ---------------------------------------------------------- growing up
  {
    id: 'ask_about_race', name: 'Ask what we are', minAge: 6, weight: 8,
    relations: ['parent', 'sibling', 'mentor', 'elder'],
    sameRace: true,
    lines: [
      '{You want to know what we are|You have worked out you are not like the others here|Somebody said a word and you want to know what it meant}. '
      + '[who] {tells you properly|takes a long time getting to it|does not soften any of it}. [loreLine]',
    ],
    effect: { closeness: 8, knowledge: 1, stats: { intellect: 2 } },
    lore: 'race',
  },
  {
    id: 'ask_before', name: 'Ask what it was like before', minAge: 8, weight: 9,
    relations: ['parent', 'sibling', 'mentor', 'elder', 'friend'],
    lines: [
      '{You ask about before you were born|You want to know what it was like|You have never asked and you ask now}. '
      + '[who] {is quiet for a while first|starts somewhere else entirely and works back|answers like they have been waiting years for somebody to ask}. [loreLine]',
    ],
    effect: { closeness: 12, trust: 8, knowledge: 1 },
    lore: 'past',
  },
  {
    id: 'ask_about_them', name: 'Ask about them, not you', minAge: 10, weight: 8,
    relations: ['parent', 'sibling', 'mentor', 'friend', 'spouse', 'lover', 'student', 'acquaintance'],
    lines: [
      '{You ask about them for once|It occurs to you that you have never asked|You want to know who they were before you}. '
      + '[who] {is thrown by it|talks for two hours|tells you one thing and then stops, and the one thing is enormous}. [selfLine]',
    ],
    effect: { closeness: 14, trust: 12, knowledge: 1 },
    lore: 'self',
  },
  {
    id: 'argue', name: 'Have it out', minAge: 12, weight: 6,
    relations: ['parent', 'sibling', 'spouse', 'rival', 'friend'],
    lines: [
      '{It has been building|You say the thing you have been not saying|Neither of you was planning this}. '
      + '{It goes badly and then it goes somewhere|You both say too much|Somebody walks out and comes back}. '
      + '{You understand each other better and like each other less|It clears something|Nothing is resolved and everything is different}.',
    ],
    effect: { closeness: 6, tension: -14, trust: 10, happiness: -6 },
  },
  {
    id: 'advice', name: 'Ask what you should do', minAge: 12, weight: 7,
    relations: ['parent', 'mentor', 'elder', 'friend', 'spouse'],
    lines: [
      '{You do not know what to do and you say so|You ask outright|It costs you something to ask}. '
      + '[who] {does not tell you what to do, which is worse|tells you exactly what to do and is right|says the thing you already knew}.',
    ],
    effect: { closeness: 10, trust: 10, stats: { discipline: 2, intellect: 2 } },
  },

  // ------------------------------------------------------------- grown
  {
    id: 'catch_up', name: 'Catch up', minAge: 17, weight: 8,
    relations: ['parent', 'sibling', 'friend', 'mentor', 'student', 'acquaintance'],
    needsGap: true,
    lines: [
      '{You have not seen them in years|It has been long enough to be awkward|You almost do not go}. '
      + '{You pick it up somewhere near where you left it|They look older and so do you|The first ten minutes are terrible and then it is fine}. '
      + '{Neither of you says the years out loud|You leave meaning to come back sooner|It is easier than you had made it in your head}.',
    ],
    effect: { closeness: 16, trust: 8, happiness: 10 },
  },
  {
    id: 'talk_shop', name: 'Talk about the work', minAge: 15, weight: 7,
    relations: ['mentor', 'student', 'rival', 'friend', 'spouse'],
    lines: [
      '{You talk about it properly|Two people who do the same thing, talking about the thing|It gets technical fast}. '
      + '{You disagree about something small for an hour|They are right about one thing and you will not admit it|You both come away with something}.',
    ],
    effect: { closeness: 8, respect: 12, stats: { technique: 2, kiControl: 1 } },
  },
  {
    id: 'the_world', name: 'Talk about what is happening', minAge: 12, weight: 7,
    relations: ['parent', 'sibling', 'friend', 'mentor', 'spouse', 'acquaintance', 'student', 'rival'],
    lines: [
      '{You talk about what is going on|Neither of you can do anything about any of it|It is all anyone is talking about}. '
      + '[worldLine] {Neither of you has a plan|They are more frightened than they are letting on|You are both pretending this is a normal conversation}.',
    ],
    effect: { closeness: 8, stats: { intellect: 2 } },
    lore: 'world',
  },
  {
    id: 'the_dead', name: 'Talk about the ones who are gone', minAge: 12, weight: 6,
    relations: ['parent', 'sibling', 'spouse', 'friend', 'mentor'],
    needsDead: true,
    lines: [
      '{Their name comes up|Somebody mentions them and the room changes|You bring it up, which surprises you both}. '
      + '{You talk about [lost] for a long time|Neither of you cries and it is close|You laugh about something they did, which helps}. '
      + '{It is the first time either of you has said the name out loud in years|You should do this more often|Nobody else remembers them the same way}.',
    ],
    effect: { closeness: 20, trust: 16, happiness: -4 },
  },
  {
    id: 'quiet', name: 'Sit with them and say nothing', minAge: 14, weight: 5,
    relations: ['spouse', 'lover', 'parent', 'friend', 'sibling', 'mentor'],
    lines: [
      '{Neither of you says much|You sit outside until it gets dark|It is not a conversation and it is not nothing}. '
      + '{This is what it is with them|You do not have to be interesting|It is the easiest hour of your week}.',
    ],
    effect: { closeness: 12, trust: 10, happiness: 12 },
  },
  {
    id: 'children_talk', name: 'Talk about the children', minAge: 20, weight: 6,
    relations: ['spouse', 'parent', 'sibling'],
    needsChild: true,
    lines: [
      '{You talk about [child]|Neither of you knows what you are doing|You compare notes on somebody who cannot hear you}. '
      + '{They are worried about something you had not noticed|You agree on almost nothing and it does not matter|It turns out you are both frightened of the same thing}.',
    ],
    effect: { closeness: 14, trust: 12 },
  },
  {
    id: 'old_talk', name: 'Talk like people who have known each other a long time', minAge: 45, weight: 6,
    relations: ['spouse', 'friend', 'sibling', 'rival', 'mentor', 'student'],
    lines: [
      '{You have had this conversation eleven times|Neither of you minds|It is not about the content}. '
      + '{They finish two of your sentences and get one wrong|You have run out of new things and it is fine|There is nobody left who remembers what you both remember}.',
    ],
    effect: { closeness: 14, trust: 12, happiness: 10 },
  },
];

/** Filled in from the world, so a topic says something true. */
function loreFor(state, npc, kind) {
  const c = state.character;
  const year = c.birthYear + c.age;
  const race = getRace(c.raceId);

  if (kind === 'race') {
    return {
      saiyan: `"We were a warrior race. We were also somebody else's army, and most people leave that part out. `
        + `Before the Cold Empire there was Sadala, and before Sadala there was a Saiyan called Yamoshi who went further than anyone since. `
        + `They still tell it as a warning."`,
      halfsaiyan: `"Half of you comes from a people who conquered for a living, and the other half from a planet that never noticed. `
        + `That is not a weakness. Every one of you has gone further than the pure-blooded ones expected."`,
      namekian: `"We were one people on one world and then we were almost none. Everything you know, somebody chose to keep. `
        + `The dragon, the language, the way you hold your hands - all of it came through a very narrow gap."`,
      frostdemon: `"Our family has ruled longer than most species have existed. That is not a boast, it is a burden, `
        + `and it is why nobody in it has ever had to work at anything."`,
      earthling: `"We are not the strongest thing on this planet, let alone off it. What we have is technique, `
        + `and about four hundred years of people refusing to accept that."`,
      majin: `"There was one of you before there was anything else. That is as much as anybody will tell you, `
        + `and most of them will not say it twice."`,
      android: `"Somebody built you and had reasons. Those reasons were theirs, not yours."`,
      shinjin: `"We are grown from a tree, and the tree is older than the universe it stands in."`,
    }[c.raceId] || `"There is not much written down about what we are. Most of what I know, somebody told me the way I am telling you."`;
  }

  if (kind === 'past') {
    if (c.flags.homeworld_destroyed) {
      return `"There was a planet. Red sky, gravity that would put you on your knees, and about a million of us. `
        + `It is not there any more and nobody talks about the day properly. I was not on it. That is the whole reason I am here."`;
    }
    return `"${eraName(year - c.age)}. It was quieter, or it was not and I was younger. `
      + `Half the people I could name for you are dead and the other half you have met."`;
  }

  if (kind === 'self') {
    const canon = npc.canonId ? getCanon(npc.canonId) : null;
    if (canon && canon.personality) return `"${canon.personality}"`;
    const bits = [];
    if (npc.kin && npc.kin.lost) bits.push(`They mention ${npc.kin.lost} once and do not go back to it.`);
    if (npc.goal) bits.push(`What they want, it turns out, is ${npc.goal}.`);
    if (npc.wall) bits.push('They admit they have been stuck on the same thing for years.');
    return bits.join(' ') || 'It turns out you had them completely wrong about one thing.';
  }

  if (kind === 'world') {
    const place = getPlace(c.placeId);
    return `${eraName(year)}. ${place.desc}`;
  }
  return '';
}

/**
 * The topics open between these two people right now. Order is by weight, so
 * the caller can offer the whole list or let the game pick.
 */
export function topicsFor(state, npc) {
  const c = state.character;
  const bio = maturity(c);
  const year = c.birthYear + c.age;
  const gap = year - (npc.lastSeen || year);
  const dead = Object.values(state.npcs).filter((n) => !n.alive);
  const kids = Object.values(state.npcs).filter((n) => n.alive && n.relation === 'child');

  return TOPICS.filter((t) => {
    if (bio < (t.minAge ?? 0)) return false;
    if (t.maxAge !== undefined && bio > t.maxAge) return false;
    if (t.relations && !t.relations.includes(npc.relation)) return false;
    if (t.sameRace && npc.raceId !== c.raceId) return false;
    if (t.needsDead && !dead.length) return false;
    if (t.needsChild && !kids.length) return false;
    if (t.needsGap && gap < 3) return false;
    return true;
  }).sort((a, b) => (b.weight || 1) - (a.weight || 1));
}

/** Have the conversation. Returns text and the changes to apply. */
export function converse(state, rng, npc, topicId) {
  const topic = TOPICS.find((t) => t.id === topicId) || topicsFor(state, npc)[0];
  if (!topic) return null;
  const c = state.character;
  const dead = Object.values(state.npcs).filter((n) => !n.alive);
  const kids = Object.values(state.npcs).filter((n) => n.alive && n.relation === 'child');

  const view = {
    who: npc.name,
    lost: dead.length ? rng.pick(dead).name : 'them',
    child: kids.length ? rng.pick(kids).name : 'the child',
    loreLine: topic.lore ? loreFor(state, npc, topic.lore) : '',
    selfLine: topic.lore === 'self' ? loreFor(state, npc, 'self') : '',
    worldLine: topic.lore === 'world' ? loreFor(state, npc, 'world') : '',
  };
  const text = render(rng.pick(topic.lines), view, rng);
  npc.lastSeen = c.birthYear + c.age;
  return { topic, text, effect: topic.effect || {} };
}

/** A one-line description of what this topic is, for the button. */
export function topicHint(state, npc, topic) {
  const bio = maturity(state.character);
  if (topic.maxAge !== undefined && topic.maxAge <= 5) return 'You have no words yet.';
  if (topic.lore === 'race') return `What ${getRace(state.character.raceId).short}s are.`;
  if (topic.lore === 'past') return 'What it was like before you.';
  if (topic.lore === 'self') return `Who ${npc.name} was before you.`;
  if (topic.id === 'catch_up') return 'It has been years.';
  return topic.name;
}
