// The things a life teaches you whether or not you go looking.
//
// Flight is the obvious one: in this setting nobody who fights walks anywhere
// after a certain point, and learning it is a moment rather than a purchase.
// Contacting somebody on another world is the other: once the galaxy is big,
// keeping a relationship alive across it has to be possible.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, relate, trainYear, powerLine, findNpc, stranger, meetCanon } from './helpers.js';
import { combatPower } from '../stats.js';
import { getPlace, PLACES } from '../../data/places.js';
import { PLANETS } from '../../data/planets.js';
import { getTechnique } from '../../data/techniques.js';
import { currencyFor, formatMoney, canAfford, debit, priceIn } from '../../data/currency.js';
import { maturity } from '../../data/races.js';
import { numberish } from '../text.js';
import { clamp } from '../rng.js';
import { startTrial } from '../trials.js';

/** People you know who are not on this world. */
function offWorld(ctx) {
  const here = getPlace(ctx.character.placeId).planet;
  return Object.values(ctx.state.npcs).filter((n) => {
    if (!n.alive) return false;
    const p = getPlace(n.placeId || 'east_city');
    return p && p.planet !== here && (n.closeness || 0) > 25;
  });
}

registerEvents([
  // ------------------------------------------------------------- flight
  {
    id: 'learn_flight', noFatigue: true, tags: ['training', 'milestone'], weight: 90,
    minBioAge: 7,
    when: (ctx) => !ctx.character.techniques.includes('bukujutsu')
      && ctx.character.stats.kiControl >= 28
      && !ctx.character.inAfterlife,
    slots: (ctx) => {
      const teachers = Object.values(ctx.state.npcs).filter((n) => n.alive
        && (n.techniques || []).includes('bukujutsu') && (n.closeness || 0) > 30);
      const who = teachers.length ? ctx.rng.pick(teachers) : null;
      return {
        who: who ? who.name : null,
        npcId: who ? who.id : null,
        drop: ctx.rng.pick(['a barn roof', 'a cliff nobody sensible goes near', 'the top of a water tower',
          'a rock in the middle of a river', 'a ledge you got onto and cannot get off']),
      };
    },
    title: 'Off The Ground',
    text: (ctx, s) => (s.who
      ? `{[who] has been doing it in front of you for years|You ask [who] how|You have watched [who] do it and never asked}.
         {"It is not jumping"|"Stop trying to push off anything"|"You are already doing most of it"}.
         {They make you stand on [drop] until you work it out|It takes an afternoon and then a month|You fall a great deal}.`
      : `{Nobody teaches you|You work it out on your own, badly|It happens by accident}.
         {You come off [drop] and do not land|Something catches, about a metre up|For four seconds you are not touching anything}.
         {You come down hard|You land on your face|It is the most frightening thing that has ever happened to you}.`),
    choices: (ctx, s) => [
      { id: 'stick', label: 'Keep at it until it holds',
        hint: 'You have to hold it yourself. Nobody can do this part for you.',
        effect: (c2, sl) => {
          if (sl.npcId) relate(c2, findNpc(c2.state, sl.npcId), { closeness: 12, respect: 10 });
          // Flight is a thing you hold, not a thing you buy, so it is played.
          const trial = startTrial(c2.state, c2.rng, {
            kind: 'endurance',
            purpose: 'technique',
            // Almost everybody in this setting can fly. The test is whether
            // you hold it today, not whether you are capable of it at all.
            difficulty: 1,
            label: 'Off the ground',
            blurb: 'Hold it. The moment you think about it you are on the floor.',
            payload: { techId: 'bukujutsu' },
          });
          return {
            text: `{You go back up|You climb it again|You get back on the roof}. `
              + `{The trick is not pushing. The trick is not stopping|`
              + `It is entirely a matter of not letting go|Everything depends on the next thirty seconds}.`,
            changes: [],
            trial,
          };
        } },
      { id: 'later', label: 'Leave it for now', danger: false, effect: (c2) => ({
        text: `{You put it down|It frightens you and you do not say so|There is time}. `
          + `{You walk everywhere for another few years|It will come back around|Somebody laughs at you for it later}.`,
        changes: apply(c2, { happiness: -4 }),
      }) },
    ],
  },

  // ------------------------------------------------- talking across space
  {
    id: 'long_distance', tags: ['social', 'world'], weight: 26,
    minBioAge: 12,
    when: (ctx) => offWorld(ctx).length > 0,
    slots: (ctx) => {
      const away = offWorld(ctx);
      if (!away.length) return null;
      const npc = ctx.rng.weighted(away, (n) => 1 + (n.closeness || 0) / 20);
      const gap = ctx.year - (npc.lastSeen || ctx.year);
      return { ...npcSlot(npc), gap: Math.max(1, gap), where: getPlace(npc.placeId || 'east_city').name };
    },
    title: (ctx, s) => `Word From ${s.npcName}`,
    text: `{It takes a while to reach you|The signal is bad and it is them|Somebody hands you a message that has been three months in transit}.
      [npcName], on [where]. {[gap] years since you were in the same room|You have not spoken in [gap] years|It has been [gap] years}.`,
    choices: (ctx, s) => [
      { id: 'answer', label: 'Answer properly', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 14, trust: 10 });
        if (npc) npc.lastSeen = c2.year;
        return { text: `{You send back more than you meant to|It takes three attempts to say anything true|`
          + `You talk into the thing for an hour and send all of it}. `
          + `{The reply comes back months later and is worth the wait|You do this now, every year|It is not the same and it is something}.`,
        changes: apply(c2, { happiness: 14 }) };
      } },
      { id: 'go', label: 'Go and see them', hint: 'It is a long way.', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const dest = getPlace(npc && npc.placeId ? npc.placeId : 'east_city');
        const instant = c2.character.techniques.includes('instant_transmission');
        if (instant) {
          c2.character.placeId = dest.id;
          if (npc) { npc.lastSeen = c2.year; relate(c2, npc, { closeness: 22, trust: 14 }); }
          return { text: `{You lock onto them and go|It takes no time at all, which never stops being strange|`
            + `You are there before you have finished deciding}. {They are not ready for you|`
            + `They put food in front of you within four minutes|You stay a while}.`,
          changes: apply(c2, { happiness: 22 }) };
        }
        const cur = currencyFor(getPlace(c2.character.placeId).planet);
        const fare = priceIn(400000, cur.id);
        if (!canAfford(c2.character, cur.id, fare)) {
          return { text: `{Passage costs ${formatMoney(fare, cur.id)} and you do not have it|`
            + `You price it up and put it away|There is no way to get there this year}.`,
          changes: apply(c2, { happiness: -8 }) };
        }
        debit(c2.character, cur.id, fare);
        c2.character.placeId = dest.id;
        if (npc) { npc.lastSeen = c2.year; relate(c2, npc, { closeness: 26, trust: 18 }); }
        return { text: `{You buy passage and spend most of a year asleep|`
          + `${formatMoney(fare, cur.id)}, and a berth the size of a coffin|You go}. `
          + `{They do not know you are coming|They are older than the last picture|You should have done this sooner}.`,
        changes: apply(c2, { happiness: 24 }) };
      } },
      { id: 'nothing', label: 'Leave it unanswered', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: -10, trust: -8 });
        return { text: `{You mean to answer|You draft something and do not send it|You put it somewhere and it stays there}. `
          + `{Another year goes by|They stop sending|Neither of you says anything about it afterwards}.`,
        changes: apply(c2, { happiness: -6 }) };
      } },
    ],
  },

  // -------------------------------------------- somewhere to train properly
  {
    id: 'build_chamber', noFatigue: true, tags: ['world', 'training', 'property'], weight: 22,
    minBioAge: 18,
    when: (ctx) => !ctx.character.flags.has_chamber && ctx.character.home
      && combatPower(ctx.character) > 100000,
    slots: (ctx) => {
      const smart = Object.values(ctx.state.npcs).filter((n) => n.alive
        && ((n.stats && n.stats.intellect >= 75) || n.canonId === 'bulma' || n.canonId === 'gero')
        && (n.closeness || 0) > 30);
      return {
        who: smart.length ? ctx.rng.pick(smart).name : null,
        npcId: smart.length ? smart[0].id : null,
        mine: ctx.character.iq >= 130,
      };
    },
    title: 'A Room That Runs Faster',
    text: (ctx, s) => `{You have been thinking about it for years|It comes up because you have run out of places to train|
      Somebody mentions the Lookout and you cannot stop thinking about it}.
      A room with its own gravity and its own clock. ${s.mine
    ? '{You could build it|You have worked out most of it already|The maths is not beyond you}.'
    : s.who
      ? '{[who] could build it|You could not begin to build it. [who] could|[who] laughs and then stops laughing and starts sketching}.'
      : '{You would need somebody far cleverer than you|There is nobody within reach who could|You do not know anyone who could build it}.'}`,
    choices: (ctx, s) => {
      const list = [];
      const cur = currencyFor(getPlace(ctx.character.placeId).planet);
      const cost = priceIn(14000000, cur.id);
      if (s.mine) {
        list.push({
          id: 'build_self', label: `Build it yourself - ${formatMoney(cost, cur.id)}`,
          effect: (c2) => {
            if (!canAfford(c2.character, cur.id, cost)) {
              return { text: `You cost it out. ${formatMoney(cost, cur.id)}. You are a long way short.`, changes: [] };
            }
            debit(c2.character, cur.id, cost);
            c2.character.flags.has_chamber = true;
            c2.character.chamber = { built: true, rate: 2.6, aging: 1.6 };
            fact(c2, 'Built a training chamber that runs faster than the world outside it.',
              { type: 'property', weight: 8, tags: ['training'] });
            return { text: `{It takes two years and most of your money|`
              + `You get the gravity right before you get the clock right|Nothing explodes, which surprises everybody}. `
              + `{A day in there is a week out here|You will age faster than the people waiting outside|That is the trade}.`,
            changes: apply(c2, { happiness: 20, stats: { intellect: 4 } }) };
          },
        });
      }
      if (s.who) {
        const helped = Math.round(cost * 1.5);
        list.push({
          id: 'hire', label: `Ask ${s.who} to build it - ${formatMoney(helped, cur.id)}`,
          effect: (c2, sl) => {
            if (!canAfford(c2.character, cur.id, helped)) {
              return { text: `${sl.who} quotes you ${formatMoney(helped, cur.id)} and does not negotiate.`, changes: [] };
            }
            debit(c2.character, cur.id, helped);
            const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
            if (npc) relate(c2, npc, { closeness: 10, respect: 8 });
            c2.character.flags.has_chamber = true;
            c2.character.chamber = { built: true, rate: 3.1, aging: 1.7, by: sl.who };
            fact(c2, `${sl.who} built them a training chamber.`, { type: 'property', weight: 8, tags: ['training'] });
            return { text: `{It arrives in pieces and goes up in a week|${sl.who} is insulted you thought it would be hard|`
              + `They bill you twice and it is worth it}. {A day in there is more than a week out here|`
              + `You are going to get old in that room|It is the best thing you have ever bought}.`,
            changes: apply(c2, { happiness: 22 }) };
          },
        });
      }
      list.push({
        id: 'lookout', label: 'Go and ask to use the one that exists',
        hint: 'The Lookout. They do not lend it to just anybody.',
        effect: (c2) => {
          const worthy = (c2.character.karma || 0) > 10 || (c2.character.fame || 0) > 40;
          if (!worthy) {
            return { text: `{They hear you out|Somebody very polite explains that it is not available|`
              + `The answer is no and it is final}. {You are not the sort of person they lend it to|`
              + `Not yet|Come back when you have done something}.`, changes: apply(c2, { happiness: -8 }) };
          }
          c2.character.flags.chamber_access = true;
          fact(c2, 'Was given access to the Hyperbolic Time Chamber.',
            { type: 'property', weight: 7, tags: ['training'] });
          return { text: `{They agree, with conditions|You are given two days and told what happens if you take three|`
            + `Somebody walks you up and does not speak the whole way}. {A year inside for a day out here|`
            + `Nobody has ever come out of it the same|You are told exactly how many times you may use it}.`,
          changes: apply(c2, { happiness: 16 }) };
        },
      });
      list.push({
        id: 'no', label: 'Train outside like everybody else',
        effect: (c2) => {
          const t = trainYear(c2, { intensity: 1.4 });
          return { text: `{You have a mountain and that is enough|`
            + `Rooms that cheat time are for people who are behind|You get on with it}. ${powerLine(t.gained)}`,
          changes: [] };
        },
      });
      return list;
    },
  },
]);

// --------------------------------------------------------- crossing over

/**
 * Between universes.
 *
 * There are exactly three ways across in the series: Kai Kai, an angel who
 * agrees to carry you, or a ring that a god of destruction has personally
 * cleared. Everything else stops at the edge of Universe 7.
 */
const NEIGHBOURS = [
  { id: 'u6', number: 6, placeId: 'sadala', name: 'Universe 6',
    blurb: 'The twin universe. Sadala never burned here, and the Saiyans on it are police.' },
  { id: 'u11', number: 11, placeId: 'universe11', name: 'Universe 11',
    blurb: 'Pride Troopers, top to bottom. Everybody here is on duty and nobody here is joking.' },
  { id: 'u10', number: 10, placeId: 'universe10', name: 'Universe 10',
    blurb: 'A universe that treats fighting as a religious discipline and its god as a critic.' },
];

function crossings(ctx) {
  const c = ctx.character;
  const out = [];
  if (c.techniques.includes('kai_kai')) out.push({ id: 'kai_kai', label: 'Kai Kai across', cost: 0, years: 0 });
  if (c.mentors.includes('whis') || c.mentors.includes('beerus') || c.flags.angel_escort) {
    out.push({ id: 'angel', label: 'Ask Whis to carry you', cost: 0, years: 0 });
  }
  if (c.flags.zeno_pass || c.flags.won_tournament_of_power) {
    out.push({ id: 'pass', label: 'Use the ring you were given', cost: 0, years: 0 });
  }
  return out;
}

registerEvents([
  {
    id: 'cross_universes', tags: ['world', 'cosmic'], weight: 26, minBioAge: 18,
    when: (ctx) => !ctx.character.inAfterlife && crossings(ctx).length > 0,
    slots: (ctx) => {
      const dest = ctx.rng.pick(NEIGHBOURS.filter((n) => getPlace(n.placeId)));
      if (!dest) return null;
      const how = crossings(ctx)[0];
      return {
        universe: dest.name, number: String(dest.number), blurb: dest.blurb,
        placeId: dest.placeId, how: how.id, howLabel: how.label,
      };
    },
    title: 'The Wall Between',
    text: `{You have known for a while that this universe has an edge|`
      + `There are eleven other versions of everything and you can get to some of them|`
      + `The boundary is not a wall so much as a decision}. `
      + `[blurb] {You could go|Nobody would stop you|The way across is open to you and to almost nobody else}.`,
    choices: (ctx, s) => [
      {
        id: 'cross', label: `Cross to ${s.universe}`,
        hint: s.howLabel,
        effect: (c2, sl) => {
          const dest = getPlace(sl.placeId);
          c2.character.placeId = sl.placeId;
          c2.character.flags.crossed_universes = true;
          c2.character.universe = Number(sl.number);
          fact(c2, `Crossed into ${sl.universe}.`, { type: 'travel', weight: 8, tags: ['cosmic', 'travel'] });
          return {
            text: `{There is no distance to it. There is a step, and then a different set of physical constants|`
              + `The crossing takes no time and costs you something you cannot name|`
              + `One moment of complete wrongness, and then somewhere else}. `
              + `${dest.name}. ${dest.desc}`,
            changes: apply(c2, { happiness: 6 }),
          };
        },
      },
      {
        id: 'look', label: 'Look, and come back',
        effect: (c2, sl) => ({
          text: `{You go far enough to see it and no further|`
            + `A minute on the other side is enough to know it is real|`
            + `You put your head through and take it out again}. `
            + `{Everything there is the same and none of it is|`
            + `It smells wrong. That is the part nobody mentions|`
            + `You will be thinking about it for years}.`,
          changes: apply(c2, { happiness: 4, stats: { intellect: 3 } }),
          view: { universe: sl.universe },
        }),
      },
      {
        id: 'stay', label: 'Stay where you belong',
        effect: (c2) => ({
          text: `{You have enough universe here|There is nothing over there you need|`
            + `You leave the edge alone. It is not going anywhere}.`,
          changes: [],
        }),
      },
    ],
  },
]);
