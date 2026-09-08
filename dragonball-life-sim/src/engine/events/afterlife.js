// Death is a location in this setting, not an ending. King Yemma's desk, Snake
// Way, King Kai's planet, Hell, the Other World tournament, and the ways back.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, meetCanon,
  odds, findNpc, scaledFoePower, moveTo } from './helpers.js';
import { canonHere, offerBattle } from './helpers.js';
import { spreadWord, DEED_SCALE } from '../settlement.js';
import { reviveCharacter } from '../lifecycle.js';
import { fight, narrateFight, describeGap, runTournament, buildField } from '../combat.js';
import { combatPower } from '../stats.js';
import { canonAlive, canonPlace } from '../../data/canon.js';
import { getPlace } from '../../data/places.js';
import { generateFullName, generateEpithet } from '../../data/names.js';
import { numberish } from '../text.js';
import { createTournament, autoRunTournament, settle } from '../tournament.js';
import { TIMELINE } from '../../data/timeline.js';
import { livingNpcs, currentYear } from '../state.js';

function canonAliveNow(ctx, c) {
  return canonAlive(c, ctx.year);
}

function deadHeroPool(ctx) {
  return canonHere(ctx, (c) => (c.tags.includes('hero') || c.tags.includes('ally') || c.tags.includes('mentor'))
    && !c.tags.includes('villain')
    && !ctx.state.npcs['canon_' + c.id]
    && getPlace(canonPlace(c, ctx.year)).planet === 'otherworld');
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

  // Not every dangerous fighter down here made it into anybody's story. Hell
  // is enormous, and full of people history never got around to - some of
  // them spent an eternity of training on nothing but themselves.
  {
    id: 'hell_legend', tags: ['afterlife', 'legend'], weight: 14,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.placeId === 'hell',
    slots: (ctx) => {
      const power = Math.max(1, Math.round(combatPower(ctx.character) * ctx.rng.float(2, 6)));
      const npc = stranger(ctx, { placeId: 'hell', powerTarget: power, minAge: 25, maxAge: 400, relation: 'acquaintance' });
      npc.alive = false;
      npc.epithet = generateEpithet(ctx.rng);
      return { name: npc.name, epithet: npc.epithet, npcId: npc.id, power: npc.power };
    },
    title: (ctx, s) => `${s.name} ${s.epithet}`,
    text: `{Nobody down here knows the name and everybody gives them room anyway|`
      + `No canon story explains this one - Hell is full of people history never got around to|`
      + `Whoever they were before, nothing about it made the record}. `
      + `[name] [epithet]. {The dead give them a wide berth without discussing why|`
      + `Whatever they did with an eternity of training, it shows|Power with no story attached to it is its own kind of unsettling}.`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Fight them', danger: true, effect: (c2, sl) => offerBattle(c2, {
        name: `${sl.name} ${sl.epithet}`, power: sl.power, npcId: sl.npcId, raceId: 'other',
      }, { reason: 'hell', stakes: 'spar', intro: 'Nothing here stays broken. Neither of you holds back.' }) },
      { id: 'train', label: 'Ask what they know', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const t = trainYear(c2, { intensity: 1.7, placeMult: 2.6 });
        if (npc) relate(c2, npc, { closeness: 10, respect: 12 });
        fact(c2, `Trained under ${sl.name} ${sl.epithet} in Hell - nobody knows who they actually were.`,
          { type: 'afterlife', weight: 6, tags: ['legend', 'death'] });
        return { text: `{They do not explain themselves and you stop asking|Whatever they know, they do not gatekeep it|`
          + `An eternity of practice has to go somewhere}. ${powerLine(t.gained)}`, changes: apply(c2, { stats: { discipline: 3 } }) };
      } },
      { id: 'avoid', label: 'Give them the room everyone else does', effect: () => ({
        text: `{You have enough problems down here|Some fights are not worth whatever is behind them|You let it go}.`, changes: [],
      }) },
    ],
  },

  // The dead are not only the people you put there. Some of them are the
  // heroes you never got to fight beside, dead the same way everybody is
  // dead here - and there is nothing stopping a friendship starting now that
  // could not have started while they were alive and busy.
  {
    id: 'dead_hero_encounter', tags: ['afterlife', 'social'], weight: 26,
    requiresAfterlife: true,
    // A hero is "here" for this event when they are currently dead - which
    // for the ones the story kills and revives (Goku at the Cell Games, and
    // so on) is not the same question as canonAlive(), which only tracks
    // permanent death. Their itinerary already threads them through the
    // Other World for exactly the years they are actually dead; read that
    // instead of asking whether they died for good.
    when: (ctx) => deadHeroPool(ctx).length > 0,
    slots: (ctx) => {
      const pool = deadHeroPool(ctx);
      const who = ctx.rng.pick(pool);
      return { name: who.name, canonId: who.id, quirk: who.quirk || who.personality || '' };
    },
    title: (ctx, s) => s.name,
    text: `{You recognise them before they say anything|Everybody here knows who this is|You have heard the name a hundred times and never once expected to be standing in front of it}.
      [name]. {Dead the same way you are, it turns out|Just as dead as everybody else here|Nobody here is special for it, including them}. [quirk]`,
    choices: (ctx, s) => [
      {
        id: 'introduce', label: 'Introduce yourself', effect: (c2, sl) => {
          const npc = meetCanon(c2, sl.canonId, 'acquaintance');
          if (npc) relate(c2, npc, { closeness: 14, respect: 8, trust: 10 });
          return {
            text: `{They already know who you are, which is its own kind of strange|`
              + `Word travels fast when everyone has nothing but time|They shake your hand like it is nothing}. `
              + `{You talk for what might be a whole afternoon, or a week|It is easier than you expected|`
              + `Neither of you mentions how you got here}.`,
            changes: apply(c2, { happiness: 12 }),
          };
        },
      },
      {
        id: 'train', label: 'Ask to train together', effect: (c2, sl) => {
          const npc = meetCanon(c2, sl.canonId, 'mentor');
          if (npc) relate(c2, npc, { closeness: 16, respect: 14, trust: 10 });
          const t = trainYear(c2, { intensity: 1.5, placeMult: 2.0, mentorMult: 1.3 });
          fact(c2, `Trained with ${sl.name} in the Other World.`, { type: 'afterlife', weight: 6, tags: ['friendship'] });
          return {
            text: `{Nobody here can be hurt permanently, which changes what a spar is for|`
              + `You go at it for what might be years and neither of you tires|`
              + `They do not go easy on you, and you would not want them to}. ${powerLine(t.gained)}`,
            changes: apply(c2, { happiness: 10, stats: { discipline: 2 } }),
          };
        },
      },
      {
        id: 'pass', label: 'Leave them be', effect: () => ({
          text: `{Not everyone wants company|You nod and keep walking|There will be another chance. There always is, here}.`,
          changes: [],
        }) },
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
      { id: 'enter', label: 'Enter', hint: 'Fight the draw. Nobody here can die of it.', effect: (c2) => {
        const t = createTournament(c2.state, c2.rng, {
          formatId: 'otherworld',
          purse: 0,
          placeId: 'otherworld_arena',
        });
        const opener = `{The Grand Kai reads the draw off a scrap of paper|A dead announcer with a live microphone|Four quadrants, one ring}. Your name is on it.`;
        if (!c2.state.autoBattle) return { text: opener, tournament: t };
        autoRunTournament(c2.state, c2.rng, t);
        const out = settle(c2.state, t, c2.rng);
        if (out.won) fact(c2, 'Won the Other World Tournament.', { type: 'tournament', weight: 7, tags: ['death', 'fame'] });
        return { text: `${opener} ${out.text}`, changes: apply(c2, { stats: { technique: 3 } }) };
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
        const yearsGone = c2.character.yearsInAfterlife || 0;
        reviveCharacter(c2.state);
        const changes = apply(c2, { health: 100, happiness: 28, ki: 999 });
        fact(c2, `Brought back to life by ${sl.who}.`, { type: 'revival', weight: 10, tags: ['revival'] });
        const text = `{One moment there is cloud and then there is grass|You come back exactly where you died|The halo goes out}. ${sl.who} {is standing right there|will not let go of you|says your name like a question}. {You have a great deal to catch up on|Years have gone past|Nothing down here waited for you}.`;
        // A short trip barely needs remarking on twice - the day-pass system
        // already covers that. A real absence gets its own reunion, once,
        // covering more than just whoever performed the wish.
        if (yearsGone >= 2) return { text, changes, followUp: 'long_reunion', followUpSlots: { yearsGone } };
        return { text, changes };
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

  // A real absence gets a real reunion - not the personality-aware but
  // single-line spouse reaction the day-pass system uses, and covering more
  // than whoever performed the wish. weight: 0 keeps it out of organic
  // selection entirely; it only ever arrives as wished_back's followUp.
  {
    id: 'long_reunion', tags: ['afterlife', 'family', 'reunion'], weight: 0,
    slots: (ctx) => {
      const yearsGone = Math.max(1, Math.round(ctx.forceSlots.yearsGone ?? 1));
      const npcs = livingNpcs(ctx.state);
      const spouse = npcs.find((n) => n.relation === 'spouse');
      const children = npcs.filter((n) => n.relation === 'child');
      const parents = npcs.filter((n) => n.relation === 'parent');
      const friend = npcs.find((n) => ['friend', 'bestfriend'].includes(n.relation) && (n.closeness || 0) > 40);
      if (!spouse && !children.length && !parents.length && !friend) return null;
      return {
        yearsGone,
        spouseId: spouse ? spouse.id : null,
        spouseName: spouse ? spouse.name : null,
        childIds: children.map((n) => n.id),
        parentIds: parents.map((n) => n.id),
        friendId: friend ? friend.id : null,
      };
    },
    title: 'Everyone You Left',
    text: (ctx, s) => `{You were gone|You had been gone} ${s.yearsGone} year${s.yearsGone === 1 ? '' : 's'}. `
      + `{Word travels fast when the dead come back|Nobody needed telling twice|By the time you are properly standing, people are already arriving}. `
      + `{This is not the borrowed day King Yemma sometimes grants - this is your life, actually returned to you|`
      + `There is no sundown to be back by, this time|Nobody down there is timing this}.`,
    choices: (ctx, s) => {
      const opts = [
        { id: 'linger', label: 'Spend it with everyone', effect: (c2, sl) => {
          const { lines } = longReunionBeats(c2, sl, null);
          return { text: lines.join(' ') || 'You spend the day just being back, which is enough.', changes: apply(c2, { happiness: 20 }) };
        } },
      ];
      if (s.spouseId) opts.push({ id: 'spouse', label: `Spend it with ${s.spouseName}`, effect: (c2, sl) => {
        const { lines } = longReunionBeats(c2, sl, 'spouse');
        return { text: lines.join(' ') || 'You spend the day with them, and it is enough.', changes: apply(c2, { happiness: 18 }) };
      } });
      if (s.childIds && s.childIds.length) opts.push({ id: 'children', label: 'Spend it with the kids', effect: (c2, sl) => {
        const { lines } = longReunionBeats(c2, sl, 'children');
        return { text: lines.join(' ') || 'You spend the day with them, and it is enough.', changes: apply(c2, { happiness: 18 }) };
      } });
      return opts;
    },
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

// --------------------------------------------------- the people you ended
//
// Hell is a place in this setting, not a metaphor, and the dead train in it.
// Anybody you killed is down here, they have had every year since to work,
// and some of them came out of it with something they did not have when you
// finished them.

/** What a life gets you after death: hard training and nothing else to do. */
/**
 * Not everyone who dies gets stronger down here. Hell does not manufacture
 * potential - it removes hunger, fear and any reason to stop, which only
 * matters for somebody who had further to go in the first place. A scripted
 * canon escalation always applies; everyone else is gated on the `potential`
 * roll made at the moment they died, and grows at their own `pace` if it
 * hit - fast and dramatic for some, slow and barely noticeable for others,
 * both compounding with how long they have actually been down here.
 */
export function hellPower(record, year) {
  const years = Math.max(0, year - record.year);
  const escalation = ESCALATIONS[record.canonId];
  if (escalation) {
    const growth = Math.pow(1.16, Math.min(years, 60));
    return Math.round(record.power * growth * escalation.mult);
  }
  if (!record.potential) {
    // They persist. Repetition sharpens the edges a little and nothing more.
    return Math.round(record.power * (1 + Math.min(years, 40) * 0.008));
  }
  const rate = 1.025 + 0.028 * (record.pace ?? 1);
  const growth = Math.pow(rate, Math.min(years, 60));
  return Math.round(record.power * growth);
}

/**
 * The ones who found something down here. Frieza is the named case: he spent
 * four months in Hell doing the one thing he had never done, which was train,
 * and came back gold.
 */
const ESCALATIONS = {
  frieza: { mult: 90, name: 'Golden Frieza',
    text: 'He has been training. Frieza, who never trained once in his life, has spent every year since you finished him doing nothing else. He is gold now, and he wants you to see it.' },
  cell: { mult: 30, name: 'a Cell that has kept eating',
    text: 'It has been absorbing things down here. There is nothing to absorb down here, which raises a question nobody wants answered.' },
  buu: { mult: 25, name: 'something Buu-shaped and wrong',
    text: 'Whatever it was has come apart and put itself back together several times, and each version is worse.' },
  king_piccolo: { mult: 20, name: 'the Demon King, restored',
    text: 'He is young again. Down here that is a thing you can simply decide to be.' },
  broly: { mult: 40, name: 'Broly, still going',
    text: 'He has not stopped. He does not appear to have noticed that he died.' },
};

function endedList(ctx) {
  return (ctx.state.world.ended || []).filter((e) => e.name);
}

/** The Hell record for somebody you killed, if there is one. */
export function findEndedRecord(state, npc) {
  if (!npc) return null;
  return (state.world.ended || []).find((e) =>
    (npc.id && e.npcId === npc.id) || (npc.canonId && e.canonId === npc.canonId));
}

/**
 * What a dead NPC's power actually is right now, not what it was the
 * instant they died. Their dossier used to just show npc.power forever -
 * frozen at whatever it read on the day you killed them - even though
 * they_are_here has them training in Hell and escalating that whole time.
 * Falls back to the frozen figure for anyone with no Hell record (died of
 * something other than you), since there is nothing tracking their afterlife.
 */
export function deadPowerNow(state, npc) {
  if (!npc || npc.alive) return npc ? npc.power : 0;
  const rec = findEndedRecord(state, npc);
  if (!rec) return npc.power;
  return hellPower(rec, currentYear(state));
}

registerEvents([
  {
    id: 'they_are_here', tags: ['afterlife', 'villain', 'consequence'], weight: 46,
    requiresAfterlife: true,
    when: (ctx) => ctx.character.placeId === 'hell' && endedList(ctx).length > 0,
    slots: (ctx) => {
      const list = endedList(ctx);
      // The strongest thing you killed is the one that finds you first.
      const rec = ctx.rng.weighted(list, (e) => 1 + Math.log10(Math.max(10, e.power)));
      const now = hellPower(rec, ctx.year);
      const esc = ESCALATIONS[rec.canonId];
      return {
        who: esc ? esc.name : rec.name,
        original: rec.name,
        years: String(Math.max(1, ctx.year - rec.year)),
        power: now,
        was: rec.power,
        grew: now > rec.power * 4 ? 'yes' : 'no',
        escText: esc ? esc.text : '',
        canonId: rec.canonId || '',
      };
    },
    title: (ctx, s) => `${s.original}, Again`,
    text: (ctx, s) => `{You have been expecting this|It was always going to happen|`
      + `Hell is smaller than it looks}. `
      + `{[original] finds you|[original] has been looking for you since you got here|`
      + `Somebody says your name and you know the voice before you turn round}. `
      + `{It has been [years] years down here for them|[years] years, and nothing to do but one thing|`
      + `They have had [years] years and no body to get tired}. `
      + (s.escText || (s.grew === 'yes'
        ? `{They are not what you left|Whatever you beat, this is not that|The number has moved a very long way}.`
        : `{They are much as you left them|Death has not improved them|Nothing has changed except the address}.`)),
    choices: (ctx, s) => [
      {
        id: 'fight', label: 'Finish it again', danger: true,
        hint: 'Nothing stays broken here, and neither of you can die twice.',
        effect: (c2, sl) => offerBattle(c2, {
          name: sl.who, power: sl.power, canonId: sl.canonId || null,
          raceId: 'other', techniques: ['ki_blast', 'death_beam', 'death_ball'],
        }, {
          reason: 'hell', canonId: sl.canonId || null, stakes: 'spar',
          intro: `${sl.who}. There is no ground to lose and no bottom to fall off.`,
        }),
      },
      {
        id: 'talk', label: 'Ask them what it was like', effect: (c2, sl) => {
          c2.character.flags.faced_the_dead = true;
          return {
            text: `{They tell you|It takes a long time and they tell you all of it|`
              + `Nobody down here has been asked a question in years}. `
              + `{What you did is a thing that happened to somebody|`
              + `They describe the last thing they saw and it was you|`
              + `You listen to the whole thing without once explaining yourself}. `
              + `{It does not make either of you feel better|Something changes and neither of you names it|`
              + `They stop wanting to kill you somewhere in the middle of it}.`,
            changes: apply(c2, { karma: 10, happiness: -8, stats: { intellect: 4, charisma: 3 } }),
            view: { who: sl.who },
          };
        },
      },
      {
        id: 'train', label: 'Train with them', hint: 'You have both got the time.',
        effect: (c2, sl) => {
          const t = trainYear(c2, { intensity: 1.8, placeMult: 2.4, mentorMult: 1.5 });
          fact(c2, `Trained in Hell with ${sl.original}, who they had killed.`,
            { type: 'afterlife', weight: 7, tags: ['villain', 'death'] });
          return {
            text: `{It is the strangest arrangement of your life|Neither of you says why|`
              + `You do not become friends. You become something with no word for it}. `
              + `{They are better than they were and they are better because of you|`
              + `Every session ends the moment one of you smiles|`
              + `You are both getting something out of this and neither will say what}. ${powerLine(t.gained)}`,
            changes: apply(c2, { karma: -4, stats: { technique: 5, discipline: 4 } }),
          };
        },
      },
      {
        id: 'avoid', label: 'Go the other way', effect: (c2, sl) => ({
          text: `{You do not turn round|There is a lot of Hell and you use all of it|`
            + `You spend the next stretch somewhere they are not}. `
            + `{They will find you eventually|It is not over|Hell is not that big}.`,
          changes: apply(c2, { happiness: -6 }),
        }),
      },
    ],
  },

  // The ones who got out, and what they did with it.
  {
    id: 'they_got_out', tags: ['world', 'villain', 'consequence'], weight: 20,
    minBioAge: 14,
    when: (ctx) => !ctx.character.inAfterlife
      && endedList(ctx).some((e) => ESCALATIONS[e.canonId])
      && ctx.year >= 779,
    slots: (ctx) => {
      const rec = ctx.rng.pick(endedList(ctx).filter((e) => ESCALATIONS[e.canonId]));
      const esc = ESCALATIONS[rec.canonId];
      return {
        who: esc.name, original: rec.name, canonId: rec.canonId,
        power: hellPower(rec, ctx.year), escText: esc.text,
        years: String(Math.max(1, ctx.year - rec.year)),
      };
    },
    title: (ctx, s) => `${s.original} Is Back`,
    text: (ctx, s) => `{Somebody wished them back|An army with more money than judgement gathered the balls|`
      + `You hear it before you see it}. `
      + `[original], [years] years dead, is standing on a planet again. ${s.escText}`,
    choices: (ctx, s) => [
      {
        id: 'meet', label: 'Go and meet them', danger: true,
        effect: (c2, sl) => offerBattle(c2, {
          name: sl.who, power: sl.power, canonId: sl.canonId, raceId: 'other',
          techniques: ['ki_blast', 'death_beam', 'death_ball', 'supernova'],
        }, {
          reason: 'revenge', canonId: sl.canonId, stakes: 'lethal', protecting: true,
          intro: `${sl.who}. They have been waiting for this considerably longer than you have.`,
        }),
      },
      {
        id: 'prepare', label: 'Get ready first', effect: (c2, sl) => {
          const t = trainYear(c2, { intensity: 2.0, placeMult: 1.6 });
          c2.character.flags.expecting_revenge = true;
          return {
            text: `{You do not go|Not yet. Not at this|You go up the mountain and you do not come down for a year}. `
              + `{They are not looking for you specifically. Not yet|`
              + `Whatever they do in the meantime is on you and you know it|`
              + `You buy yourself a year and it costs somebody else}. ${powerLine(t.gained)}`,
            changes: apply(c2, { happiness: -10, karma: -6, stats: { discipline: 5 } }),
          };
        },
      },
      {
        id: 'warn', label: 'Tell everyone who needs to know', effect: (c2, sl) => {
          const rep = spreadWord(c2.state, { scale: DEED_SCALE.world_saved * 0.3, karma: 8 });
          return {
            text: `{You spend the year on a ship telling people|`
              + `You go to everybody who fought them the first time|`
              + `Half of them do not believe you and the other half already knew}. `
              + `{When it happens, nobody is surprised|People are ready, which is not nothing|`
              + `About ${numberish(rep.gained)} more people know your name and why}.`,
            changes: apply(c2, { fame: 6, karma: 8 }),
          };
        },
      },
    ],
  },

  // ------------------------------------------------------- a day back
  //
  // Canonically this happened exactly once, on the record: Goku got one day
  // back for the 25th World Martial Arts Tournament, on King Yemma's leave,
  // and used it to watch Gohan grown and meet Goten for the first time. It
  // was never explained as more than "he earned it" - so here it is earned,
  // not automatic: real standing, and a real occasion to spend it on.
  {
    id: 'day_pass_offer', tags: ['afterlife', 'family', 'reward'], weight: 20,
    requiresAfterlife: true,
    when: (ctx) => dayPassOccasion(ctx) && !ctx.character.flags['day_pass_' + ctx.year]
      && (ctx.character.karma > 15 || ctx.character.fame > 25
        || livingNpcs(ctx.state).some((n) => ['spouse', 'child'].includes(n.relation) && (n.closeness || 0) > 55)),
    slots: (ctx) => {
      const occ = dayPassOccasion(ctx);
      return { kind: occ.kind, label: occ.label, placeId: occ.placeId };
    },
    title: "King Yemma's Leave",
    text: (ctx, s) => `{Somebody comes to find you, which never happens|You are summoned, which is not the usual traffic|`
      + `King Yemma sends for you personally}. `
      + `{"You have not caused any trouble down here"|"Your file is better than most"|"I do not do this often"}. `
      + `${s.kind === 'tournament'
        ? `[label] is on, down there, today. "One day. Your choice what you do with it. Back here by sundown, no arguments."`
        : `There is a reason to go back, down there, today - [label]. "One day. I will know if you are late."`}`,
    choices: (ctx, s) => [
      {
        id: 'go', label: 'Take the day', effect: (c2, sl) => {
          c2.character.flags['day_pass_' + c2.year] = true;
          const reactions = livingWorldReactions(c2);
          fact(c2, `Spent a day back among the living: ${sl.label}.`,
            { type: 'afterlife', weight: 8, tags: ['family', 'reward'] });
          const lines = [
            sl.kind === 'tournament'
              ? `{You watch from the stands, or near enough that it does not matter|`
                + `Nobody official knows you are there|You do not fight. That is not what the day is for}. `
                + `{The crowd has no idea how many dead people are in the seats today|`
                + `Somebody strong enough to sense it goes very still and does not say anything|`
                + `You watch somebody you taught do something you did not teach them}.`
              : `{You are there. Actually there|Nobody sent word. You just are|One day, and you spend it exactly where you want to be}.`,
            ...reactions,
          ];
          return {
            text: lines.filter(Boolean).join(' '),
            changes: apply(c2, { happiness: 22, karma: 4 }),
          };
        },
      },
      {
        id: 'decline', label: 'Stay', effect: (c2) => ({
          text: `{You say no|It is a kind offer and you do not take it|`
            + `"Not this time." Yemma does not ask again this year}. `
            + `{Some things you would rather remember than revisit|`
              + `Watching from here is enough|You are not sure you could leave a second time}.`,
          changes: apply(c2, { happiness: 4 }),
        }) },
    ],
  },
]);



/** What occasion, if any, is worth King Yemma bending the rules for. */
function dayPassOccasion(ctx) {
  const tourney = TIMELINE.find((t) => t.year === ctx.year && /^tournament_(?!of_power)/.test(t.id));
  if (tourney) return { kind: 'tournament', label: tourney.name, placeId: 'papaya' };
  const family = livingNpcs(ctx.state).filter((n) => ['spouse', 'child'].includes(n.relation) && (n.closeness || 0) > 55);
  if (family.length && ctx.rng.chance(0.4)) {
    const who = ctx.rng.pick(family);
    return {
      kind: 'family',
      label: who.relation === 'child' ? `seeing ${who.name} again` : `a day with ${who.name}`,
      placeId: who.placeId || 'east_city',
    };
  }
  return null;
}

/**
 * How the people who love you react to a halo showing up at the door. Not
 * one line - it depends on how close you actually are, what kind of person
 * they are, and whether they are somebody who has stood in a fight herself
 * or somebody for whom this is simply the strangest day of her life.
 */
function livingWorldReactions(ctx) {
  const spouse = livingNpcs(ctx.state).find((n) => n.relation === 'spouse');
  if (!spouse) return [];
  const close = (spouse.closeness || 0) > 60;
  const fighter = (spouse.power || 0) > 500 || (spouse.stats && spouse.stats.strength > 55);
  const volatile = (spouse.tags || []).some((t) => ['volatile', 'fierce', 'vengeful', 'jealous'].includes(t));
  const gentle = (spouse.tags || []).some((t) => ['gentle', 'kind', 'warm', 'sweet', 'patient'].includes(t));

  let line;
  if (!close) {
    line = `${spouse.name} {does not know what to do with her face|takes a step back before she takes a step forward|`
      + `has clearly rehearsed being angry about this and cannot remember any of it now}.`;
  } else if (volatile && fighter) {
    line = `${spouse.name} {hits you, and then does not let go|puts you on the ground first and asks questions after|`
      + `is furious and will not stop touching your arm to check you are real}.`;
  } else if (volatile) {
    line = `${spouse.name} {shouts at you for dying and cries doing it|`
      + `has clearly practised this speech and abandons it halfway through|`
      + `is angrier at the year than at you and it comes out sideways}.`;
  } else if (gentle && fighter) {
    line = `${spouse.name} {does not say anything for a long moment, and then does not stop saying things|`
      + `checks you over the way she would check an injury, out of habit|`
      + `holds on like she is confirming a reading rather than feeling something}.`;
  } else if (gentle) {
    line = `${spouse.name} {cries in the quiet way, the way that is worse|`
      + `holds your face like she is making sure|does not let go for a long time and you do not mind}.`;
  } else {
    line = `${spouse.name} {looks at you like the maths does not work|says your name twice, checking it|`
      + `takes a while to believe it and then does not want to stop looking at you}.`;
  }
  relate(ctx, spouse, { closeness: 10, trust: 8 });
  return [line];
}

/**
 * The wider version, for a return long enough that it isn't just the spouse
 * who has something to say about it - kids who visibly grew while you were
 * gone, parents who did not need the theatrics, a friend who kept a seat
 * warm. `focus` narrows it to one relationship (used by long_reunion's
 * "spend it with just them" choices); left null, it touches everyone the
 * event found. Mutates closeness/trust as a side effect, same as
 * livingWorldReactions - only called from inside a resolved choice.
 */
function longReunionBeats(ctx, s, focus) {
  const long = s.yearsGone >= 5;
  const lines = [];

  if (!focus || focus === 'spouse') {
    const spouse = s.spouseId && findNpc(ctx.state, s.spouseId);
    if (spouse && spouse.alive) {
      const close = (spouse.closeness || 0) > 60;
      lines.push(long
        ? `${spouse.name} {kept your side of things exactly as it was, which is its own kind of answer|`
          + `stopped explaining the halo to people a while ago and just waited|`
          + `says your name like she is testing whether it still works}.`
        : `${spouse.name} {has not let go since you got here|keeps checking you are actually solid|`
          + `is furious and relieved in an order that keeps changing}.`);
      relate(ctx, spouse, { closeness: close ? 8 : 14, trust: 8 });
    }
  }

  if (!focus || focus === 'children') {
    for (const id of s.childIds || []) {
      const child = findNpc(ctx.state, id);
      if (!child || !child.alive) continue;
      lines.push(long
        ? `${child.name} {is not the size you remember|has opinions now that were not there before|`
          + `introduces you to people you have never met, like this is normal}.`
        : `${child.name} {has not stopped talking since you arrived|keeps finding reasons to be in the same room|`
          + `acts like nothing happened, which is its own kind of relief}.`);
      relate(ctx, child, { closeness: 10, trust: 6 });
    }
  }

  if (!focus) {
    for (const id of s.parentIds || []) {
      const parent = findNpc(ctx.state, id);
      if (!parent || !parent.alive) continue;
      lines.push(`${parent.name} {does not say much, and does not need to|`
        + `holds on the way a parent does, like the years are beside the point}.`);
      relate(ctx, parent, { closeness: 8, trust: 5 });
    }
    const friend = s.friendId && findNpc(ctx.state, s.friendId);
    if (friend && friend.alive) {
      lines.push(`${friend.name} {saved you a spot without saying so|acts like you were only ever late|`
        + `does the thing where the relief comes out as an insult}.`);
      relate(ctx, friend, { closeness: 6 });
    }
  }

  return { lines };
}
