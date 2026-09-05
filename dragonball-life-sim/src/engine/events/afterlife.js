// Death is a location in this setting, not an ending. King Yemma's desk, Snake
// Way, King Kai's planet, Hell, the Other World tournament, and the ways back.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, meetCanon,
  odds, findNpc, scaledFoePower, moveTo } from './helpers.js';
import { fight, narrateFight, describeGap, runTournament, buildField } from '../combat.js';
import { combatPower } from '../stats.js';
import { generateFullName } from '../../data/names.js';
import { numberish } from '../text.js';

registerEvents([
  {
    id: 'check_in', tags: ['afterlife'], weight: 100,
    requiresAfterlife: true,
    when: (ctx) => !ctx.flag('judged'),
    slots: (ctx) => ({ karma: ctx.character.karma }),
    title: "King Yemma's Desk",
    text: (ctx) => `The queue takes {a long time|days|you cannot tell how long}. The desk is {the size of a stadium|larger than most buildings|absurd}.
      ${ctx.character.karma > 25
        ? `He reads your file, {grunts|raises an eyebrow|nods once}. "You did some good. You keep your body."`
        : ctx.character.karma < -25
          ? `He reads your file for a long time. {"Well"|"Hm"|"I see"}. {The floor opens|He does not look up|"Down you go"}.`
          : `He reads your file, {shrugs|frowns|makes a noise}. "Average. Halo and no body, like everyone else."`}`,
    choices: (ctx) => {
      const good = ctx.character.karma > 25;
      const bad = ctx.character.karma < -25;
      const list = [];
      if (bad) {
        list.push({
          id: 'hell', label: 'Go where you are sent', effect: (c2) => {
            c2.character.flags.judged = true;
            c2.character.placeId = 'hell';
            const changes = apply(c2, { happiness: -20 });
            fact(c2, 'Sent to Hell.', { type: 'afterlife', weight: 8, tags: ['death'] });
            return { text: `{Spike fields and a red sky|It is loud, and it never stops being loud|There are queues here too}. {Everybody you ever heard of is here|Some of them recognise you|A few of them want to talk}.`, changes };
          },
        });
        list.push({
          id: 'argue', label: 'Argue your case', effect: (c2) => {
            c2.character.flags.judged = true;
            if (odds(c2, 0.3 + c2.character.stats.charisma / 300)) {
              c2.character.keptBody = true;
              c2.character.placeId = 'check_in';
              const changes = apply(c2, { karma: 6, happiness: 6 });
              fact(c2, 'Talked King Yemma into a better verdict.', { type: 'afterlife', weight: 7, tags: ['death'] });
              return { text: `{You talk for a long time|You name the two things you did right|He listens, which nobody expects}. {"Fine"|He stamps something|"Snake Way. Do not come back here"}.`, changes };
            }
            c2.character.placeId = 'hell';
            const changes = apply(c2, { happiness: -25 });
            return { text: `{He does not even finish listening|"No"|The floor opens mid-sentence}.`, changes };
          },
        });
      } else {
        list.push({
          id: 'snake', label: 'Take Snake Way', hint: 'A million kilometres. King Kai is at the end.',
          effect: (c2) => {
            c2.character.flags.judged = true;
            if (good) c2.character.keptBody = true;
            c2.character.placeId = 'snake_way';
            const changes = apply(c2, { happiness: 4, stats: { discipline: 3 } });
            fact(c2, `Died and took Snake Way.${good ? ' Kept their body.' : ''}`, { type: 'afterlife', weight: 8, tags: ['death'] });
            return { text: `{It is a serpent-shaped road over a cloud of nothing|A million kilometres|There is no end in sight and there never is}. {You start walking|You start flying and get tired of it|Nobody tells you how long it takes}.`, changes };
          },
        });
        list.push({
          id: 'rest', label: 'Accept the ordinary afterlife', effect: (c2) => {
            c2.character.flags.judged = true;
            c2.character.placeId = 'check_in';
            const changes = apply(c2, { happiness: 12 });
            fact(c2, 'Took the quiet afterlife.', { type: 'afterlife', weight: 6, tags: ['death'] });
            return { text: `{There is a lot of cloud|Nobody asks anything of you|It is genuinely peaceful and that is the problem}.`, changes };
          },
        });
      }
      return list;
    },
  },

  {
    id: 'snake_way_walk', tags: ['afterlife', 'training'], weight: 60,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.placeId === 'snake_way',
    slots: () => ({}),
    title: 'Snake Way',
    text: `{Still walking|Still no end|Day, or whatever this is, however many}.
      {There is nothing below and nothing above|You fell off once and it took a week to get back|You have started talking to yourself}.`,
    choices: () => [
      { id: 'run', label: 'Run the whole way', effect: (ctx) => {
        if (odds(ctx, 0.55 + ctx.character.stats.discipline / 250)) {
          ctx.character.placeId = 'kai_planet';
          const t = trainYear(ctx, { intensity: 1.4, placeMult: 2.2 });
          const changes = apply(ctx, { stats: { discipline: 8, durability: 5 }, happiness: 10 });
          fact(ctx, 'Ran the whole length of Snake Way.', { type: 'afterlife', weight: 6, tags: ['death', 'training'] });
          return { text: `{The end arrives without warning|There is a small planet at the end of it|You arrive and fall over}. King Kai's planet: {ten times gravity on a rock you could walk around in a minute|smaller than expected|with a monkey and a cricket on it}. ${powerLine(t.gained)}`, changes };
        }
        const t = trainYear(ctx, { intensity: 1.1, placeMult: 1.8 });
        const changes = apply(ctx, { stats: { discipline: 4 }, happiness: -4 });
        return { text: `{You fall off|You lose the road|You stop for what turns out to be a year}. {Still walking|You are not there yet|The road is still going}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'turn', label: 'Turn back', effect: (ctx) => {
        ctx.character.placeId = 'check_in';
        const changes = apply(ctx, { happiness: -6 });
        return { text: `{You go back|Nobody is impressed|The queue is exactly where you left it}.`, changes };
      } },
    ],
  },

  {
    id: 'king_kai_training', tags: ['afterlife', 'training', 'mentor'], weight: 70,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.placeId === 'kai_planet',
    slots: () => ({}),
    title: "King Kai's Planet",
    text: `{Ten times gravity on a rock the size of a garden|You cannot stand up properly for the first week|The gravity here is the whole lesson}.
      {He will not teach you until you laugh at his joke|There is a monkey you have to catch|The joke is not funny}.`,
    choices: (ctx) => [
      { id: 'laugh', label: 'Laugh at the joke', effect: (c2) => {
        const npc = meetCanon(c2, 'king_kai', 'mentor');
        if (!c2.character.mentors.includes('king_kai')) c2.character.mentors.push('king_kai');
        const teachable = ['kaioken', 'spirit_bomb', 'telepathy', 'ki_sense'].filter((t) => !c2.character.techniques.includes(t));
        let learned = null;
        if (teachable.length && odds(c2, 0.7)) {
          learned = teachable[0];
          c2.character.techniques.push(learned);
          c2.state.stats.techniquesLearned++;
        }
        const t = trainYear(c2, { intensity: 1.5, placeMult: 3.5, mentorMult: 1.5 });
        const changes = apply(c2, { stats: { discipline: 6, kiControl: 5, durability: 4 }, happiness: 8 });
        fact(c2, 'Trained under King Kai in the Other World.', { type: 'mentor', weight: 7, tags: ['mentor', 'death'] });
        return { text: `{You laugh|You force it|It is a terrible joke and you laugh anyway}. {He is delighted|"Finally!"|That was the entire entrance exam}. ${learned ? `By the end you can do the ${learned === 'kaioken' ? 'Kaio-ken' : learned.replace(/_/g, ' ')}.` : `Catching the monkey takes six months.`} ${powerLine(t.gained)}`, changes };
      } },
      { id: 'refuse_joke', label: 'Refuse to laugh', effect: (c2) => {
        const changes = apply(c2, { happiness: -4, stats: { discipline: 2 } });
        return { text: `{He waits|You wait|Neither of you gives}. {It is a very long standoff|He tells it again|Nothing is taught this year}.`, changes };
      } },
      { id: 'train_alone', label: 'Train alone in the gravity', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.6, placeMult: 3.0 });
        const changes = apply(c2, { health: -10, stats: { strength: 5, durability: 5 } });
        return { text: `{Ten times gravity is its own teacher|You do not need the jokes|You work until you cannot lift your arms}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'hell_life', tags: ['afterlife'], weight: 60,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.placeId === 'hell',
    slots: (ctx) => ({
      who: ctx.rng.pick(['a tyrant who used to run four galaxies', 'somebody who blew up a planet on a whim',
        'a very polite killer', 'an old man who will not say what he did', 'a demon king in a very good suit',
        'somebody you personally put here']),
    }),
    title: 'Hell',
    text: `{The sky is red and the ground has spikes in it|It is loud and it never stops|There is a queue for everything}.
      You get talking to [who]. {They are better company than most of the living|They want something|They know who you are}.`,
    choices: (ctx, s) => [
      { id: 'train', label: 'Train with them', effect: (c2, sl) => {
        const npc = stranger(c2, { relation: 'acquaintance', powerTarget: scaledFoePower(c2, 1.6, 0.5), metHow: 'hell' });
        npc.name = generateFullName(c2.rng, npc.raceId);
        const t = trainYear(c2, { intensity: 1.5, placeMult: 2.4, mentorMult: 1.3 });
        const changes = apply(c2, { karma: -6, stats: { strength: 4, technique: 4 }, happiness: 4 });
        fact(c2, `Trained with the damned in Hell.`, { type: 'afterlife', weight: 5, tags: ['death', 'villain'] });
        return { text: `{Nobody here holds back|There is no reason to|You cannot die twice}. {It is the best training you have ever had|You learn things nobody living would teach you|It changes how you fight}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'escape', label: 'Find a way out', effect: (c2) => {
        if (odds(c2, 0.2 + c2.character.stats.intellect / 300)) {
          c2.character.placeId = 'check_in';
          const changes = apply(c2, { happiness: 12, karma: 2 });
          fact(c2, 'Got out of Hell without being let out.', { type: 'afterlife', weight: 7, tags: ['death'] });
          return { text: `{There is a way|Somebody shows you a gap|The ogres are not as attentive as they look}. {You are out|Nobody notices for a while|King Yemma is going to be furious}.`, changes };
        }
        const changes = apply(c2, { happiness: -8 });
        return { text: `{There is no way out|You find three and none of them work|Somebody laughs at you for trying}.`, changes };
      } },
      { id: 'penance', label: 'Try to become better than this', effect: (c2) => {
        const changes = apply(c2, { karma: 12, happiness: -4, stats: { discipline: 5 } });
        fact(c2, 'Started trying to earn their way out of Hell.', { type: 'afterlife', weight: 5, tags: ['death', 'redemption'] });
        return { text: `{It is not a place that rewards this|Nobody here understands what you are doing|You keep doing it}. {Somewhere, a mark on a file changes|It is very slow|Karma is not a fast system}.`, changes };
      } },
    ],
  },

  {
    id: 'otherworld_tournament', tags: ['afterlife', 'tournament'], weight: 35,
    requiresAfterlife: true,
    minBioAge: 10,
    when: (ctx) => ['kai_planet', 'check_in', 'otherworld_arena', 'snake_way'].includes(ctx.character.placeId),
    slots: () => ({}),
    title: 'The Other World Tournament',
    text: `{Every so often the Kais hold one|The dead fight each other for something to do|Four quadrants, one ring}.
      {Nobody can die here, which changes everything|There are no rules worth the name|Some of these fighters have been dead for ten thousand years}.`,
    choices: (ctx) => [
      { id: 'enter', label: 'Enter', effect: (c2) => {
        const baseline = combatPower(c2.character) * 0.4;
        const field = buildField(c2.rng, (power) => ({
          name: generateFullName(c2.rng, c2.rng.pick(['other', 'saiyan', 'namekian', 'frostdemon'])),
          power: Math.round(power),
        }), 4, baseline);
        const result = runTournament(c2.state, c2.rng, field, { lethality: 0 });
        const lines = result.record.map((r) => `${r.foe}: ${r.won ? 'beaten' : 'not beaten'}.`);
        if (result.won) {
          const changes = apply(c2, { happiness: 20, fame: 10, stats: { technique: 4 } });
          fact(c2, 'Won the Other World Tournament.', { type: 'tournament', weight: 7, tags: ['death', 'fame'] });
          return { text: `${lines.join(' ')} {You win it|The Grand Kai says something complimentary|The dead applaud, which sounds strange}.`, changes };
        }
        const changes = apply(c2, { happiness: 4, stats: { technique: 3, discipline: 2 } });
        return { text: `${lines.join(' ')} {You lose to somebody who has been practising for a millennium|It is the best fight you have ever had|Nobody bleeds and it still hurts}.`, changes };
      } },
      { id: 'skip', label: 'Train instead', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.4, placeMult: 2.0 });
        return { text: `{You have work to do|Tournaments are a distraction, even here|You watch and take notes}. ${powerLine(t.gained)}`, changes: [] };
      } },
    ],
  },

  {
    id: 'revival_chance', tags: ['afterlife', 'opportunity'], weight: 40,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.yearsInAfterlife >= 1,
    slots: (ctx) => {
      const mourners = ctx.npcs.filter((n) => n.alive && n.closeness > 55);
      return {
        who: mourners.length ? ctx.rng.pick(mourners).name : 'somebody you never expected',
        hasMourners: mourners.length > 0,
      };
    },
    title: 'Somebody Is Looking For The Balls',
    text: `{Word gets up here eventually|King Kai tells you|You feel it}: [who] is {gathering the Dragon Balls|asking about a wish|halfway to seven}.
      {It might be for you|It is for you|They have not said who it is for}.`,
    choices: (ctx, s) => [
      { id: 'hope', label: 'Let them', effect: (c2, sl) => {
        if (odds(c2, sl.hasMourners ? 0.55 : 0.2)) {
          c2.character.inAfterlife = false;
          c2.character.alive = true;
          c2.character.death = null;
          c2.character.flags.judged = false;
          c2.character.flags.died_once = true;
          c2.character.placeId = 'east_city';
          c2.character.yearsInAfterlife = 0;
          const changes = apply(c2, { health: 100, happiness: 25, ki: 999 });
          c2.state.stats.deaths = c2.state.stats.deaths || 0;
          fact(c2, `Brought back to life by ${sl.who}.`, { type: 'revival', weight: 10, tags: ['revival'] });
          return { text: `{It happens without warning|One moment there is cloud and then there is grass|You come back the way you left, halo and all until it fades}. {${sl.who} is standing right there|Somebody is crying|You have a great deal to catch up on}.`, changes };
        }
        const changes = apply(c2, { happiness: -10 });
        return { text: `{The wish goes to somebody else|They fail|It was not for you}. {You go back to training|Nobody explains|It stings more than dying did}.`, changes };
      } },
      { id: 'refuse', label: 'Tell them not to', effect: (c2) => {
        c2.character.flags.refused_revival = true;
        const changes = apply(c2, { karma: 10, happiness: -6, stats: { discipline: 5 } });
        fact(c2, 'Refused to be brought back.', { type: 'afterlife', weight: 8, tags: ['death'] });
        return { text: `{You send word down|"Leave me here"|It is better this way and you believe that most days}. {There is training here nobody living can get|You are needed less than you thought|Somebody down there is furious with you}.`, changes };
      } },
    ],
  },

  {
    id: 'reincarnation', tags: ['afterlife'], weight: 20,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.yearsInAfterlife > 6,
    slots: () => ({}),
    title: 'The Other Door',
    text: `{They offer it eventually|There is another queue|An ogre with a clipboard explains the option}:
      {go back as somebody else|start again with nothing|be born, and remember none of this}.`,
    choices: () => [
      { id: 'take', label: 'Be reborn', danger: true, effect: (ctx) => {
        ctx.character.flags.chose_reincarnation = true;
        fact(ctx, 'Chose to be reborn.', { type: 'afterlife', weight: 10, tags: ['death', 'ending'] });
        return { text: `{You say yes|It takes a moment to decide and no time at all to happen|There is no ceremony}. {Everything you were goes somewhere it cannot be reached|Somewhere, a child is born with a temperament nobody in the family recognises|The good in you goes on and the rest does not}.`,
          changes: [], outcome: { reincarnate: true } };
      } },
      { id: 'stay', label: 'Stay dead and keep training', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 1.3, placeMult: 2.0 });
        const changes = apply(ctx, { stats: { discipline: 4 } });
        return { text: `{You are not finished|There are still fights here|Not yet}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },
]);
