// Death is a location in this setting, not an ending. King Yemma's desk, Snake
// Way, King Kai's planet, Hell, the Other World tournament, and the ways back.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, meetCanon,
  odds, findNpc, scaledFoePower, moveTo } from './helpers.js';
import { canonHere, offerBattle } from './helpers.js';
import { reviveCharacter } from '../lifecycle.js';
import { fight, narrateFight, describeGap, runTournament, buildField } from '../combat.js';
import { combatPower } from '../stats.js';
import { canonAlive } from '../../data/canon.js';
import { generateFullName } from '../../data/names.js';
import { numberish } from '../text.js';

function canonAliveNow(ctx, c) {
  return canonAlive(c, ctx.year);
}

registerEvents([
  {
    id: 'dead_reunion', tags: ['afterlife', 'social'], weight: 40,
    requiresAfterlife: true,
    when: (ctx) => Object.values(ctx.state.npcs).some((n) => !n.alive),
    slots: (ctx) => {
      const dead = Object.values(ctx.state.npcs).filter((n) => !n.alive);
      if (!dead.length) return null;
      const npc = ctx.rng.pick(dead);
      return { npcId: npc.id, npcName: npc.name, gone: Math.max(1, ctx.year - (npc.deadSince || ctx.year)) };
    },
    title: (ctx, s) => `${s.npcName}`,
    text: `{You are not looking for them and there they are|Somebody says your name from behind|The queue moves and it is them}:
      [npcName], [gone] years dead, {with a halo and the same face|looking exactly as you remember|younger than when they died}.`,
    choices: (ctx, s) => [
      { id: 'together', label: 'Stay with them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) { npc.closeness = Math.min(100, npc.closeness + 25); npc.trust = Math.min(100, (npc.trust ?? 30) + 20); }
        const changes = apply(c2, { happiness: 25 });
        fact(c2, `Found ${sl.npcName} again in the Other World.`, { type: 'afterlife', weight: 6, subject: sl.npcId, tags: ['death', 'family'] });
        return { text: `{Neither of you says anything for a long time|There is nothing to catch up on and you talk for a week anyway|Being dead together is easier than being alive apart}.`, changes };
      } },
      { id: 'train_dead', label: 'Train with them', effect: (c2, sl) => {
        const t = trainYear(c2, { intensity: 1.3, placeMult: 2.0, mentorMult: 1.2 });
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) npc.closeness = Math.min(100, npc.closeness + 15);
        const changes = apply(c2, { happiness: 12, stats: { technique: 3 } });
        return { text: `{Nobody here can be hurt permanently, which changes how you both fight|They are better than they were alive|You go at it for what might be years}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'watch_the_living', tags: ['afterlife', 'quiet'], weight: 30,
    requiresAfterlife: true,
    when: (ctx) => ctx.npcs.some((n) => n.alive),
    slots: (ctx) => {
      const alive = ctx.npcs.filter((n) => n.alive);
      if (!alive.length) return null;
      const npc = ctx.rng.pick(alive);
      return { npcId: npc.id, npcName: npc.name };
    },
    title: 'Looking Down',
    text: `{King Kai lets you use his antennae|You can watch, if you want to|Somebody shows you how}.
      [npcName] is down there, {carrying on|not carrying on very well|doing something you would not have predicted}.`,
    choices: (ctx, s) => [
      { id: 'watch', label: 'Watch', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const changes = apply(c2, { happiness: npc && npc.closeness > 60 ? -8 : 4 });
        if (npc) npc.knowledge = Math.min(4, (npc.knowledge || 0) + 1);
        return { text: `{They are managing|They are not managing|They talk to somebody about you and you cannot hear the words}. {You watch for a long time|It does not help|You learn something you did not know about them}.`, changes };
      } },
      { id: 'lookaway', label: 'Do not look', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.4, placeMult: 2.0 });
        const changes = apply(c2, { stats: { discipline: 5 }, happiness: -3 });
        return { text: `{Watching does nothing|You have work here|You put it down and go back to training}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'grand_kai', tags: ['afterlife', 'mentor'], weight: 26,
    requiresAfterlife: true,
    when: (ctx) => ['kai_planet', 'otherworld_arena'].includes(ctx.character.placeId),
    slots: (ctx) => ({
      who: ctx.rng.pick(['a fighter who has been dead nine thousand years',
        'somebody who held a title in a galaxy that no longer exists',
        'a monk who has spent four centuries on one movement',
        'a Metamoran who will not stop talking about fusion',
        'a warrior whose whole species is extinct']),
    }),
    title: "The Grand Kai's Planet",
    text: `{Everybody dead and worth anything ends up here eventually|The training grounds go on for miles|Nobody here has anything to lose}.
      You end up sparring with [who].`,
    choices: () => [
      { id: 'learn', label: 'Learn from them', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 1.5, placeMult: 3.0, mentorMult: 1.6 });
        const changes = apply(ctx, { stats: { technique: 5, kiControl: 4, discipline: 3 }, happiness: 10 });
        fact(ctx, 'Trained on the Grand Kai\'s planet with the honoured dead.', { type: 'mentor', weight: 6, tags: ['death', 'training'] });
        return { text: `{They fight nothing like anyone living|Their style predates most of the techniques you know|You are outclassed for a year and then you are not}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'teach', label: 'Show them something they have not seen', effect: (ctx) => {
        const changes = apply(ctx, { stats: { charisma: 4, technique: 3 }, happiness: 12, fame: 3 });
        return { text: `{Nine thousand years and they have not seen this|They make you do it four times|Somebody takes notes}. {It is the proudest you have been since dying|They call others over|You are somebody here}.`, changes };
      } },
    ],
  },

  {
    id: 'hell_recruit', tags: ['afterlife', 'villain'], weight: 24,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.placeId === 'hell',
    slots: (ctx) => {
      const pool = canonHere(ctx, (c) => c.tags.includes('villain') && !canonAliveNow(ctx, c));
      const who = pool.length ? ctx.rng.pick(pool) : null;
      return { name: who ? who.name : 'a tyrant with no empire left', canonId: who ? who.id : null };
    },
    title: (ctx, s) => `${s.name}, Down Here`,
    text: `{Everyone you ever heard of is in here somewhere|The spike fields are crowded|Nobody in Hell has anything to do}.
      [name] {wants something|is bored|has been watching you}.`,
    choices: (ctx, s) => [
      { id: 'train', label: 'Train with the damned', effect: (c2, sl) => {
        const t = trainYear(c2, { intensity: 1.6, placeMult: 2.6, mentorMult: 1.4 });
        const changes = apply(c2, { karma: -8, stats: { strength: 5, technique: 4 } });
        fact(c2, `Trained with ${sl.name} in Hell.`, { type: 'afterlife', weight: 5, tags: ['villain', 'death'] });
        return { text: `{Nobody holds back down here|You cannot die twice|It is the best and worst training of your life}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'fight', label: 'Fight them', effect: (c2, sl) => offerBattle(c2, {
        name: sl.name, power: Math.max(1, combatPower(c2.character) * c2.rng.float(0.8, 2.4)),
        canonId: sl.canonId, raceId: 'other', techniques: ['ki_blast', 'death_beam'],
      }, { reason: 'hell', canonId: sl.canonId, stakes: 'spar', intro: 'Nothing here stays broken. Neither of you holds back.' }) },
      { id: 'refuse', label: 'Want nothing to do with them', effect: (c2) => {
        const changes = apply(c2, { karma: 6, stats: { discipline: 4 } });
        return { text: `{You walk away|Whatever they are offering, no|They shout after you and you keep going}.`, changes };
      } },
    ],
  },

  {
    id: 'kai_apprentice', tags: ['afterlife', 'mentor', 'divine'], weight: 22,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.karma > 20 && ctx.character.yearsInAfterlife >= 2,
    slots: () => ({}),
    title: 'The Sacred World of the Kais',
    text: `{Somebody with skin the colour of a bruise arrives without walking|A Kai has been reading your file|You are summoned, which nobody explains}.
      {There is a sword stuck in a rock|The trees here are the wrong shape|Time works differently and nobody mentions it}.`,
    choices: () => [
      { id: 'train', label: 'Accept the training', effect: (ctx) => {
        ctx.character.placeId = 'sacred_world';
        if (!ctx.character.mentors.includes('supreme_kai')) ctx.character.mentors.push('supreme_kai');
        meetCanon(ctx, 'supreme_kai', 'mentor');
        const t = trainYear(ctx, { intensity: 1.4, placeMult: 3.0, mentorMult: 1.8 });
        const changes = apply(ctx, { stats: { kiControl: 7, discipline: 5, intellect: 3 }, happiness: 10 });
        fact(ctx, 'Trained on the Sacred World of the Kais.', { type: 'mentor', weight: 7, tags: ['divine', 'death'] });
        return { text: `{It is not fighting|Most of it is sitting still|You are shown what divine ki actually is}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'sword', label: 'Try to pull the sword out', effect: (ctx) => {
        if (odds(ctx, 0.3 + ctx.character.stats.strength / 300)) {
          ctx.character.items.push('z_sword');
          ctx.character.flags.pulled_z_sword = true;
          const changes = apply(ctx, { happiness: 16, stats: { strength: 5 }, fame: 5 });
          fact(ctx, 'Pulled the Z-Sword out of the rock.', { type: 'item', weight: 7, tags: ['divine'] });
          return { text: `{It comes out|Nobody has managed it in generations|It is heavier than a building and you can barely lift it}. {The Kai stares|Somebody says a word in an old language|You have it now, for whatever that is worth}.`, changes };
        }
        const changes = apply(ctx, { health: -10, happiness: -6 });
        return { text: `{It does not move|You tear something in your back|The Kai says nothing, which is worse}.`, changes };
      } },
      { id: 'decline', label: 'Decline', effect: (ctx) => ({
        text: `{You have your own methods|Gods have not helped so far|You say no to a Kai, which nobody does}.`,
        changes: apply(ctx, { stats: { discipline: 3 } }),
      }) },
    ],
  },

  {
    id: 'afterlife_threat', tags: ['afterlife', 'combat'], weight: 22,
    requiresAfterlife: true,
    minBioAge: 8,
    slots: (ctx) => ({
      what: ctx.rng.pick(['something has got out of Hell and is loose in the check-in queue',
        'a soul nobody can process is tearing up the road',
        'an old god is eating the dead',
        'the ogres have lost control of the spike fields',
        'somebody has worked out how to kill people who are already dead']),
    }),
    title: 'Even Here',
    text: `[what:cap]. {King Yemma is shouting|The Kais are not answering|Nobody dead has ever had to deal with this before}.`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Deal with it', effect: (c2, sl) => offerBattle(c2, {
        name: sl.what.split(' ').slice(0, 3).join(' '), raceId: 'other',
        power: Math.max(1, combatPower(c2.character) * c2.rng.float(0.7, 2.0)),
      }, { reason: 'afterlife', stakes: 'spar', protecting: true, intro: 'You cannot die here. That is the only advantage you have.' }) },
      { id: 'ignore', label: 'Not your problem', effect: (c2) => ({
        text: `{Somebody else handles it|You stay out of it|It gets worse before it gets better}.`,
        changes: apply(c2, { karma: -6 }),
      }) },
    ],
  },

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
    id: 'wished_back', tags: ['afterlife', 'opportunity'], weight: 400,
    requiresAfterlife: true,
    when: (ctx) => ctx.state.world.revival && ctx.state.world.revival.progress >= 100,
    slots: (ctx) => {
      const ids = ctx.state.world.revival.backers || [];
      const who = ids.map((id) => ctx.state.npcs[id]).filter(Boolean).map((n) => n.name);
      return { who: who.join(' and ') || 'somebody' };
    },
    title: 'They Found All Seven',
    text: `{The sky goes dark down there and you feel it up here|King Kai says it out loud before you notice|Something enormous is being asked for}:
      [who] {has all seven|found the last one|is standing in front of the dragon}. {The wish is you|They are asking for you|Nobody had to ask them to do this}.`,
    choices: (ctx, s) => [
      { id: 'go', label: 'Go back', effect: (c2, sl) => {
        reviveCharacter(c2.state);
        const changes = apply(c2, { health: 100, happiness: 28, ki: 999 });
        fact(c2, `Brought back to life by ${sl.who}.`, { type: 'revival', weight: 10, tags: ['revival'] });
        return { text: `{One moment there is cloud and then there is grass|You come back exactly where you died|The halo goes out}. ${sl.who} {is standing right there|will not let go of you|says your name like a question}. {You have a great deal to catch up on|Years have gone past|Nothing down here waited for you}.`, changes };
      } },
      { id: 'refuse', label: 'Refuse it', effect: (c2, sl) => {
        c2.character.flags.refused_revival = true;
        c2.state.world.revival = null;
        const changes = apply(c2, { karma: 10, happiness: -8, stats: { discipline: 5 } });
        fact(c2, 'Refused to be brought back.', { type: 'afterlife', weight: 8, tags: ['death'] });
        return { text: `{You send word down|"Leave me here"|You do not explain}. {${sl.who} does not understand|Somebody down there is furious with you|The wish goes to somebody else}.`, changes };
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
