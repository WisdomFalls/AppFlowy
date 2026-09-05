// Scripted origins. Some things are not optional: if you were on Planet Vegeta
// in Age 737 then Age 737 happens to you. What you do in the hours before it,
// and where the pod comes down, is yours.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, findNpc,
  odds, killNpc, moveTo, meetCanon } from './helpers.js';
import { getPlace, PLACES } from '../../data/places.js';
import { UPBRINGINGS, getRace } from '../../data/races.js';
import { makeNpc } from '../npc.js';
import { addNpc } from '../state.js';
import { generateFullName } from '../../data/names.js';

const LANDING_WORLDS = [
  { placeId: 'paozu', weight: 30, blurb: 'A forest so thick the pod is not found for two days.' },
  { placeId: 'east_city', weight: 12, blurb: 'You come down four streets from a hospital.' },
  { placeId: 'west_city', weight: 10, blurb: 'You crater a Capsule Corporation test field.' },
  { placeId: 'wastes', weight: 14, blurb: 'Cracked rock in every direction and nothing alive for a day\'s walk.' },
  { placeId: 'yardrat', weight: 6, blurb: 'Small quiet people are already standing around the pod when it opens.' },
  { placeId: 'namek', weight: 6, blurb: 'Blue grass, three suns, and no night at all.' },
  { placeId: 'cereal', weight: 5, blurb: 'A world of dust and ruins, and something in the ruins is watching.' },
  { placeId: 'planet_frieza_79', weight: 7, blurb: 'A garrison world with a number instead of a name. Bad luck.' },
  { placeId: 'penguin_village', weight: 4, blurb: 'The physics here are wrong and nobody seems bothered.' },
  { placeId: 'sadala', weight: 3, blurb: 'Saiyans, everywhere, and none of them conquerors.' },
];

/**
 * A pod is aimed. Which coordinates you set - or which your parents set for
 * you - changes what you land in, and how long you are in there.
 */
export const POD_HEADINGS = [
  {
    id: 'nearest', name: 'The nearest habitable world',
    hint: 'Days, not years. Whatever is close is close for a reason.',
    years: 0,
    worlds: ['planet_frieza_79', 'wastes', 'sadala'],
    danger: 0.35,
  },
  {
    id: 'far', name: 'As far from the Frieza Force as the fuel allows',
    hint: 'Years asleep. Nobody will come looking.',
    years: 3,
    worlds: ['paozu', 'east_city', 'west_city', 'penguin_village'],
    danger: 0.05,
  },
  {
    id: 'weak', name: 'A world too weak to fight back',
    hint: 'What a Saiyan pod is normally aimed at. You will not be welcome.',
    years: 1,
    worlds: ['paozu', 'wastes', 'cereal', 'east_city'],
    danger: 0.15,
  },
  {
    id: 'allies', name: 'Somewhere the Saiyans had friends',
    hint: 'There were not many. The coordinates may be years out of date.',
    years: 2,
    worlds: ['yardrat', 'namek', 'sadala'],
    danger: 0.2,
  },
  {
    id: 'blind', name: 'Do not set them at all',
    hint: 'Launch and let the pod decide. It has done this before.',
    years: 2,
    worlds: null,
    danger: 0.25,
  },
];

const FINDERS = [
  {
    id: 'kind_family', weight: 26, karma: 6,
    name: 'a family who should have known better',
    text: 'An old man opens the pod with a crowbar and decides, on no evidence at all, that you are his problem now.',
    upbringing: 'farm', closeness: 75, respect: 40, relation: 'parent',
  },
  {
    id: 'martial_school', weight: 16, karma: 3,
    name: 'a martial artist who recognised what you were',
    text: 'Somebody who has seen a pod before takes one look at your tail and starts making plans for you.',
    upbringing: 'temple', closeness: 55, respect: 60, relation: 'mentor',
  },
  {
    id: 'lab', weight: 14, karma: -4,
    name: 'people with clipboards',
    text: 'You wake up under a light with a number written on your wrist.',
    upbringing: 'lab', closeness: 15, respect: 25, relation: 'parent',
  },
  {
    id: 'nobody', weight: 18, karma: 0,
    name: 'nobody at all',
    text: 'The pod opens and there is nothing but weather. You raise yourself, which is a sentence that covers a great deal.',
    upbringing: 'orphan_pod', closeness: 0, respect: 0, relation: null,
  },
  {
    id: 'slaver', weight: 10, karma: -6,
    name: 'a trader who saw a price',
    text: 'You are inventory before you are a person. It takes years to stop being that.',
    upbringing: 'street', closeness: 10, respect: 20, relation: 'enemy',
  },
  {
    id: 'warlord', weight: 10, karma: -8,
    name: 'somebody who needed a weapon',
    text: 'They feed you, house you, train you, and never once pretend it is kindness.',
    upbringing: 'warrior_clan', closeness: 35, respect: 55, relation: 'mentor',
  },
  {
    id: 'imperial', weight: 6, karma: -10,
    name: 'a Frieza Force recruiter',
    text: 'The armour they give you fits, which is somehow the worst part.',
    upbringing: 'exile', closeness: 20, respect: 40, relation: 'colleague',
  },
];

/**
 * Launching. The heading decides where you come down and how long you are
 * under; whether anyone comes with you depends on whether they had any warning
 * and any standing, which is to say on the life you have had up to now.
 */
function podLaunch(c2, sl, heading) {
  const c = c2.character;
  c.flags.vegeta_resolved = true;
  c.flags.in_pod = true;
  c.flags.homeworld_destroyed = true;
  c.flags.grief = true;
  c.flags.pod_heading = heading.id;
  c2.state.world.resolved.push('saiyan_purge');

  // Anyone who did not get off the planet did not get off the planet.
  const kin = Object.values(c2.state.npcs).filter((n) => n.alive
    && ['parent', 'sibling', 'mentor'].includes(n.relation));

  // Did your family get out? They needed warning, a second pod, and a reason
  // to spend it on you rather than on themselves.
  const warned = c.flags.warned_of_frieza || c.flags.bardock_warning;
  const standing = (c.upbringingId === 'royal' ? 0.28 : 0)
    + (c.upbringingId === 'warrior_clan' ? 0.14 : 0)
    + Math.min(0.25, (c.fame || 0) / 240);
  const closeness = kin.length ? Math.max(...kin.map((n) => n.closeness || 0)) / 100 : 0;
  const chance = Math.min(0.75, (warned ? 0.42 : 0.08) + standing + closeness * 0.22);
  const escaped = kin.length ? c2.rng.chance(chance) : false;
  const survivors = escaped ? c2.rng.sample(kin, Math.min(kin.length, c2.rng.int(1, 2))) : [];

  for (const npc of Object.values(c2.state.npcs)) {
    if (survivors.includes(npc)) continue;
    if (npc.placeId === 'planet_vegeta' && npc.alive) {
      npc.alive = false;
      npc.deadSince = 737;
      npc.causeOfDeath = 'Planet Vegeta';
    }
  }
  if (survivors.length) {
    c.flags.kin_escaped = true;
    for (const npc of survivors) {
      npc.closeness = Math.min(100, (npc.closeness || 0) + 20);
      npc.history.push({ year: 737, note: 'Got off Planet Vegeta.' });
    }
    fact(c2, `${survivors.map((n) => n.name).join(' and ')} got a pod out too.`,
      { type: 'origin', weight: 10, tags: ['origin', 'family', 'saiyan'] });
  } else {
    fact(c2, 'Was put in a pod hours before Planet Vegeta was destroyed.',
      { type: 'origin', weight: 10, tags: ['origin', 'loss', 'saiyan'] });
  }

  // A long crossing costs you years, and a bad heading costs you more.
  const hurt = c2.rng.chance(heading.danger);
  const changes = apply(c2, {
    happiness: survivors.length ? -14 : -30,
    health: hurt ? -18 : 0,
    stats: { discipline: 4, durability: 3 },
  });
  const lines = [];
  lines.push(c2.rng.pick([
    'The hatch closes and you cannot hear anything after that.',
    'There is no time to say goodbye properly, so nobody does.',
    'You are asleep before the atmosphere.',
  ]));
  if (heading.years) lines.push(`You are under for ${heading.years} year${heading.years > 1 ? 's' : ''}.`);
  lines.push(c2.rng.pick([
    'Somewhere behind you a light goes on and stays on.',
    'You do not see it happen.',
    'The whole thing takes about four seconds.',
  ]));
  if (survivors.length) {
    lines.push(`${survivors.map((n) => n.name).join(' and ')} made it into a second pod. You do not know that yet.`);
  }
  if (hurt) lines.push('Something in the launch goes wrong and you come round wrong.');

  // A crossing costs what it costs. You come out of the pod older.
  if (heading.years) {
    c.age += heading.years;
    c.flags.pod_years = heading.years;
  }
  return { text: lines.join(' '), changes };
}

registerEvents([
  {
    id: 'vegeta_last_day', noFatigue: true, tags: ['world', 'origin', 'threat'], weight: 900,
    when: (ctx) => ctx.year === 737
      && ctx.place.planet === 'planet_vegeta'
      && !ctx.flag('vegeta_resolved')
      && !ctx.worldFlag('frieza_dead'),
    slots: (ctx) => ({
      parent: (ctx.rel('parent')[0] || {}).name || 'somebody',
      hero: generateFullName(ctx.rng, 'saiyan'),
    }),
    title: 'The Last Day of Planet Vegeta',
    text: (ctx) => `{Everyone is being recalled|The sky is wrong|Nobody is being told anything and everybody knows}.
      Frieza's flagship is holding position above the planet and {the comms are dead|the elites are arguing|the low-class barracks are already empty}.
      ${ctx.age <= 6
    ? '[parent] is putting you in an attack pod and setting coordinates a very long way from here. They are not coming.'
    : 'There is a pod. There is one pod, and there is not much time to decide anything about it.'}`,
    choices: (ctx, s) => {
      const list = [];
      // A pod is aimed. Which way changes everything that comes after it.
      for (const heading of POD_HEADINGS) {
        list.push({
          id: 'pod_' + heading.id,
          label: `Pod: ${heading.name.toLowerCase()}`,
          hint: heading.hint,
          effect: (c2, sl) => podLaunch(c2, sl, heading),
        });
      }
      list.push({
        id: 'pod', hidden: true, label: 'Get in the pod',
        hint: 'You will land somewhere else entirely, and be raised by whoever finds you.',
        effect: (c2, sl) => {
          c2.character.flags.vegeta_resolved = true;
          c2.character.flags.in_pod = true;
          c2.character.flags.homeworld_destroyed = true;
          c2.character.flags.grief = true;
          c2.state.world.resolved.push('saiyan_purge');
          for (const npc of Object.values(c2.state.npcs)) {
            if (npc.placeId === 'planet_vegeta' && npc.alive) {
              npc.alive = false;
              npc.deadSince = 737;
              npc.causeOfDeath = 'Planet Vegeta';
            }
          }
          const changes = apply(c2, { happiness: -30, stats: { discipline: 4, durability: 3 } });
          fact(c2, 'Was put in a pod hours before Planet Vegeta was destroyed.',
            { type: 'origin', weight: 10, tags: ['origin', 'loss', 'saiyan'] });
          return { text: `{The hatch closes and you cannot hear anything after that|[parent] does not say goodbye properly, because there is no time|You are asleep before the atmosphere}. {Somewhere behind you a light goes on and stays on|You do not see it happen|The whole thing takes about four seconds}.`, changes };
        },
      });
      if (ctx.age >= 10) {
        list.push({
          id: 'fight', label: 'Go up there', danger: true,
          hint: 'Bardock tried. Nobody has ever managed it.',
          effect: (c2, sl) => {
            c2.character.flags.vegeta_resolved = true;
            c2.state.world.resolved.push('saiyan_purge');
            fact(c2, 'Flew at Frieza\'s ship on the last day of Planet Vegeta.',
              { type: 'origin', weight: 10, tags: ['origin', 'saiyan'] });
            return {
              text: 'You go up. There are others going up, and none of them are coming back either.',
              battle: {
                foe: { name: 'Frieza', power: 12e7, canonId: 'frieza', raceId: 'frostdemon', techniques: ['death_beam', 'death_ball'] },
                stakes: 'lethal', reason: 'saga', placeId: 'frieza_ship',
                context: { reason: 'saga', canonId: 'frieza', timelineId: 'saiyan_purge' },
                intro: 'He is holding a small ball of light on one finger and he is bored.',
              },
            };
          },
        });
      }
      list.push({
        id: 'hide', label: 'Hide, and hope',
        effect: (c2, sl) => {
          c2.character.flags.vegeta_resolved = true;
          c2.state.world.resolved.push('saiyan_purge');
          if (odds(c2, 0.12)) {
            c2.character.flags.in_pod = true;
            c2.character.flags.homeworld_destroyed = true;
            c2.character.flags.grief = true;
            const changes = apply(c2, { happiness: -35, health: -30 });
            fact(c2, 'Survived the destruction of Planet Vegeta by pure luck.',
              { type: 'origin', weight: 10, tags: ['origin', 'loss', 'saiyan'] });
            return { text: `{Somebody shoves you into a maintenance pod at the last second|You are in the wrong place, which turns out to be the right one|You never find out who launched it}. You are one of four. You will spend years finding out who the other three are.`, changes };
          }
          return {
            text: `{There is nowhere on this planet to hide from that|You do not see it coming and that is a mercy|It takes about four seconds}.`,
            outcome: { death: 'Died with Planet Vegeta' },
          };
        },
      });
      return list;
    },
  },

  {
    id: 'vegeta_rumour', tags: ['origin', 'saiyan'], weight: 40, once: true,
    minYear: 738,
    when: (ctx) => ctx.flag('homeworld_destroyed') && ctx.race.id === 'saiyan' && ctx.age > 8,
    slots: (ctx) => ({ hero: generateFullName(ctx.rng, 'saiyan') }),
    title: 'What Actually Happened',
    text: `{A drunk in a spaceport tells it wrong|Somebody who was off-world that week finds you|A Frieza Force deserter says it out loud for the first time}:
      it was not a meteor. {A low-class soldier called [hero] went up alone|Somebody tried to stop it|Forty of them went up and none came down}.
      {He knew|They all knew|Nobody believed him until it was happening}.`,
    choices: () => [
      { id: 'believe', label: 'Believe it', effect: (ctx) => {
        ctx.character.flags.knows_the_truth = true;
        ctx.character.flags.rage_awakened = true;
        const changes = apply(ctx, { happiness: -12, stats: { discipline: 5 }, karma: -4 });
        fact(ctx, 'Found out who actually destroyed Planet Vegeta.',
          { type: 'origin', weight: 8, tags: ['origin', 'saiyan', 'vendetta'] });
        thread(ctx, 'vendetta', 'canon_frieza', { title: 'Frieza', heat: 90, maxStage: 4 });
        return { text: `{You sit with it for a long time|Something in your chest reorganises|You do not sleep that night or the next}. {Now you know what you are training for|It has a name now|Everything after this has a shape}.`, changes };
      } },
      { id: 'doubt', label: 'It is a story drunks tell', effect: (ctx) => {
        const changes = apply(ctx, { happiness: 4, stats: { intellect: 2 } });
        return { text: `{You do not believe it|It is easier not to|You buy them another drink and change the subject}. {It sits somewhere at the back anyway|You will believe it eventually|Not yet}.`, changes };
      } },
    ],
  },

  {
    id: 'pod_landing', noFatigue: true, tags: ['origin', 'travel'], weight: 900,
    when: (ctx) => ctx.flag('in_pod'),
    slots: (ctx) => {
      const heading = POD_HEADINGS.find((h) => h.id === ctx.character.flags.pod_heading);
      const pool = heading && heading.worlds
        ? LANDING_WORLDS.filter((w) => heading.worlds.includes(w.placeId))
        : LANDING_WORLDS;
      const world = ctx.rng.weighted(pool.length ? pool : LANDING_WORLDS, (w) => w.weight);
      // Parents who got a pod of their own are waiting when yours opens.
      const withKin = !!ctx.character.flags.kin_escaped;
      const finder = withKin
        ? { id: 'own_kin', name: 'your own family', text: '', upbringing: 'warrior_clan', closeness: 85, respect: 55, relation: 'parent', karma: 4 }
        : ctx.rng.weighted(FINDERS, (f) => f.weight);
      return {
        placeId: world.placeId,
        placeName: getPlace(world.placeId).name,
        landing: world.blurb,
        finderId: finder.id,
        finderName: finder.name,
        finderText: withKin
          ? 'A second pod is already open beside yours, and somebody is sitting on it waiting for you to wake up.'
          : finder.text,
      };
    },
    title: 'The Pod Comes Down',
    text: `{You wake when the retros fire|The pod screams the whole way in|You are asleep for the journey and awake for the impact}.
      [placeName]. [landing] [finderText]`,
    choices: (ctx, s) => [
      { id: 'accept', label: `Be raised by ${s.finderName}`, effect: (c2, sl) => {
        const finder = FINDERS.find((f) => f.id === sl.finderId)
          || { id: 'own_kin', upbringing: 'warrior_clan', closeness: 85, respect: 55, relation: 'parent', karma: 4 };
        c2.character.flags.in_pod = false;
        moveTo(c2, sl.placeId);
        c2.character.upbringingId = finder.upbringing;
        if (finder.relation) {
          const npc = makeNpc(c2.rng, {
            year: c2.year, placeId: sl.placeId,
            relation: finder.relation, closeness: finder.closeness,
            respect: finder.respect, minAge: 25, maxAge: 60, metHow: 'found you',
          });
          addNpc(c2.state, npc);
          fact(c2, `${npc.name} found the pod and kept them.`,
            { type: 'origin', weight: 8, subject: npc.id, tags: ['origin', 'family'] });
        }
        const changes = apply(c2, { karma: finder.karma, happiness: finder.closeness > 50 ? 14 : -6 });
        return { text: finder.id === 'nobody'
          ? `{You raise yourself|The first winter is the worst|You learn what is safe to eat by getting it wrong}. {By the time anybody finds you, you are not somebody who can be taken in|You are feral for a long time|Nobody teaches you anything and you learn everything}.`
          : `{They take you in|It is not a decision anyone thinks about very hard|You are theirs by the end of the week}. {You will be strange to them forever|They never quite work out what you are|It works, mostly}.`, changes };
      } },
      { id: 'run', label: 'Do not let them take you', effect: (c2, sl) => {
        c2.character.flags.in_pod = false;
        c2.character.flags.feral_childhood = true;
        moveTo(c2, sl.placeId);
        c2.character.upbringingId = 'orphan_pod';
        const changes = apply(c2, {
          stats: { speed: 5, durability: 5, charisma: -6, discipline: 3 },
          happiness: -8, health: -6,
        });
        fact(c2, 'Would not be taken in by anyone after the landing.',
          { type: 'origin', weight: 7, tags: ['origin'] });
        return { text: `{You are gone before they get the hatch fully open|You bite somebody and run|They look for you for a month}. {You live rough|You are very small and very fast|It is years before you speak to anyone}.`, changes };
      } },
    ],
  },

  {
    id: 'saiyan_survivor_found', tags: ['origin', 'saiyan', 'social'], weight: 26,
    minYear: 740,
    when: (ctx) => ctx.race.id === 'saiyan' && ctx.flag('homeworld_destroyed') && ctx.age > 10,
    slots: (ctx) => ({ who: generateFullName(ctx.rng, 'saiyan') }),
    title: 'Another One',
    text: `{There is a tail under the coat|You feel the ki before you see them|Somebody says a word in a language nobody on this world speaks}.
      [who]. {Off-world when it happened|In a pod, like you|Nobody has counted how many of you there are}.`,
    choices: (ctx, s) => [
      { id: 'ally', label: 'There are not many of us left', effect: (c2, sl) => {
        const npc = stranger(c2, {
          raceId: 'saiyan', relation: 'friend', closeness: 55, respect: 50,
          name: sl.who, powerScale: 2.2, metHow: 'survivor',
        });
        const changes = apply(c2, { happiness: 14, stats: { charisma: 2 } });
        fact(c2, `Found another survivor of Planet Vegeta: ${sl.who}.`,
          { type: 'origin', weight: 6, subject: npc.id, tags: ['saiyan', 'family'] });
        thread(c2, 'saiyan_remnant', npc.id, { title: `${sl.who} and what is left of the Saiyans`, heat: 55, maxStage: 4 });
        return { text: `{Neither of you says anything sentimental|You eat an enormous amount together and say almost nothing|They are not what you would have chosen and it does not matter}.`, changes };
      } },
      { id: 'fight', label: 'Find out which of us is stronger', effect: (c2, sl) => {
        const npc = stranger(c2, {
          raceId: 'saiyan', relation: 'rival', closeness: 25, respect: 30, tension: 40,
          name: sl.who, powerScale: 2.6, metHow: 'survivor',
        });
        thread(c2, 'rivalry', npc.id, { title: `${sl.who}`, heat: 60, maxStage: 4 });
        return {
          text: 'Neither of you suggests talking first.',
          battle: {
            foe: { name: sl.who, power: npc.power, npcId: npc.id, raceId: 'saiyan', techniques: npc.techniques || ['ki_blast'] },
            stakes: 'serious', reason: 'rival',
            context: { reason: 'rival', npcId: npc.id },
            intro: 'This is how Saiyans say hello and both of you know it.',
          },
        };
      } },
      { id: 'avoid', label: 'Walk away', effect: (c2) => {
        const changes = apply(c2, { happiness: -6, stats: { discipline: 2 } });
        return { text: `{You do not introduce yourself|Whatever they want, you do not want it|You are already gone when they turn around}.`, changes };
      } },
    ],
  },
]);
