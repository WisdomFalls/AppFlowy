// The first minutes.
//
// A life sim that opens with "Age 1: you are born" has thrown away the only
// scene it gets for free. This builds the opening out of what was actually
// rolled - the world, the year, the parents, the upbringing - and narrates it
// beat by beat as it happens, including the pod and the crash for the ones who
// were put in a pod.

import { getRace, UPBRINGINGS } from '../data/races.js';
import { getPlace } from '../data/places.js';
import { getPlanet } from '../data/planets.js';
import { eraName } from '../data/timeline.js';
import { render } from './text.js';
import { npcsByRelation } from './state.js';

const WORLD_OPENERS = {
  planet_vegeta: `{The air on Planet Vegeta is thin and tastes of iron|Planet Vegeta has one weather and it is red|`
    + `The sky here is the colour of a healing bruise}. `
    + `{Gravity here is ten times what most of the galaxy calls normal, and nobody who lives here has noticed|`
    + `Everything born here is born heavy|Nothing on this world is soft, including the ground}.`,
  earth: `{Earth. Blue, wet, and almost entirely unaware of the rest of the galaxy|`
    + `Earth is a quiet world with a very short memory|Earth: seven billion people, none of whom look up}. `
    + `{It is the kind of place where the strongest man alive might be a farmer and nobody would know|`
    + `Nothing here has needed to be strong for a long time|It has been peaceful for so long that peace looks permanent}.`,
  namek: `{Namek has three suns and no night|The sky is green and stays green|There is no darkness on Namek, only shade}. `
    + `{The water is drinkable everywhere and there is very little to eat, which suits the people who live here|`
    + `Everything here grows slowly and on purpose|Nobody here is in a hurry}.`,
  frieza_79: `{Frieza No. 79 is a company world|This world has a number instead of a name|`
    + `Somebody bought this planet, numbered it, and put a garrison on it}. `
    + `{Everything on it belongs to somebody a long way away|The paperwork arrived before the people did}.`,
  yardrat: `{Yardrat is small, cold, and much stranger than it looks|`
    + `The Yardratians are not warriors and are not worried about that|Yardrat teaches things that cannot be fought}.`,
  sadala: `{Sadala never burned. In this universe the Saiyans kept their home|`
    + `Sadala is green in places Planet Vegeta never was|`
    + `Nothing here has ever needed to be conquered to still be standing}. `
    + `{No one arrived here with a fleet and a number to paint on the ground|`
    + `Whatever this world's people are, they built it themselves, over a long time, with nobody's permission|`
    + `A whole history sits on this world that Universe 7's Saiyans never got to have}.`,
  cereal: `{Cereal is a farming world with two moons and no army|Cereal grows things and asks nothing of anyone}.`,
};

const UPBRINGING_SCENES = {
  saiyan_creche: [
    `{You are not held|Nobody picks you up|There is no ceremony}. `
      + `{You are weighed, scanned, and read out to a room|A machine reads your power level aloud and somebody writes it down|`
      + `The number is spoken and it decides everything that comes next}.`,
    `{The creche is a wall of pods and you are one of them|`
      + `You spend your first year in a tank with forty others|Nobody in the room is over three years old}. `
      + `{The lessons start before the walking does|You learn to fight before you learn to speak|`
      + `Somebody has decided what you are for}.`,
  ],
  orphan_pod: [
    `{Somebody is arguing above you and you cannot see them|There are two voices and both of them are afraid|`
      + `Someone says your name once, very fast}.`,
    `{You are put in something round and small|The hatch closes|Hands, then a hatch, then nothing}. `
      + `{You do not understand what is happening. That is a mercy|Somebody's palm is flat against the glass|`
      + `The last thing you see of the place you were born is somebody running}.`,
    `{The pod goes up|You are thrown at the sky|Acceleration presses you flat and holds you there}. `
      + `{Behind you, the world you were born on stops existing|`
      + `The sky goes black and then the black goes white and then the world is not there any more|`
      + `You are asleep before you can see what happens to it}.`,
    `{You sleep for years|The pod feeds you and talks to you in a language you will always half-remember|`
      + `Somewhere in the dark, the pod is teaching you things}.`,
    `{You come down hard|The landing is not a landing|The pod comes in too fast and makes a crater out of a hillside}. `
      + `{[place]. Somebody hears it come down|You are found by [finder], who has never seen anything like you|`
      + `[finder] gets to the crater before anybody official does}.`,
  ],
  animals: [
    `{Nobody comes|You cry for a long time and nothing answers|The night is very loud and none of it is people}.`,
    `{Something comes and does not eat you|Something warm lies down next to you and stays|`
      + `You are picked up by the back of the neck and carried}. `
      + `{You will not learn what people are for another nine years|`
      + `Language happens to you late and badly|Nobody teaches you to speak because nobody there can}.`,
  ],
  self_raised: [
    `{The people who made you are not here|You work out fairly early that nobody is coming|`
      + `You are alone in the specific way that only very small children manage}.`,
    `{You survive it|You learn what to eat by getting it wrong|`
      + `Everything you know, you found out the hard way and kept}.`,
  ],
  lab: [
    `{You wake up|There is no birth. There is a first time you were switched on|`
      + `The first thing you experience is a room with the lights already on}.`,
    `{Somebody is writing on a clipboard and does not look up|`
      + `There is glass between you and everybody who has ever spoken to you|`
      + `You have a designation before you have a name}.`,
  ],
  foster: [
    `{Somebody who did not have to takes you in|You are handed over on a doorstep and taken inside|`
      + `Two strangers decide, quickly and without much discussion, that you are theirs now}.`,
  ],
  exile: [
    `{Your family is leaving and nobody will say why|You are born on the way out|`
      + `The first place you remember is not the place you are from}.`,
  ],
  conquered: [
    `{There are soldiers on the road the year you are born|Somebody else's flag is already up|`
      + `You are born into an occupation and it is simply how the world is}.`,
  ],
  royal: [
    `{There is a room full of people waiting for you to be born|`
      + `The announcement is made before you are cleaned up|Somebody bows at you before you can hold your head up}.`,
  ],
  temple: [
    `{You are born somewhere very quiet|The building you are born in is older than the language spoken in it|`
      + `Somebody rings something once, a long way off}.`,
  ],
};

const DEFAULT_SCENE = [
  `{You are born|It happens the way it happens to everybody|`
    + `The first thing that happens to you is the only thing that happens to everybody}. `
    + `{Somebody counts your fingers|Somebody says you look like somebody|You are loud about it}.`,
];

/**
 * The opening beats, as log entries. Called once, at the start of the first
 * year, so the player watches their own origin happen instead of reading a
 * summary of it.
 */
export function prologueEntries(state, rng) {
  const c = state.character;
  const race = getRace(c.raceId);
  const place = getPlace(c.placeId);
  const planet = getPlanet(place.planet);
  const parents = npcsByRelation(state, 'parent');
  const upbringing = UPBRINGINGS.find((u) => u.id === c.upbringingId);

  const slots = {
    name: c.name,
    place: place.name,
    planet: planet ? planet.name : place.name,
    year: String(c.birthYear),
    era: eraName(c.birthYear),
    race: race.name,
    mother: parents.find((p) => p.sex === 'female')?.name || 'your mother',
    father: parents.find((p) => p.sex === 'male')?.name || 'your father',
    finder: parents[0]?.name || 'a farmer',
  };

  const out = [];
  const say = (tpl, kind = 'prologue') => {
    const text = render(tpl, slots, rng).replace(/\s+/g, ' ').trim();
    if (text) out.push({ kind, text });
  };

  // 1. Where. A pod baby is not from where they landed, so the world they
  // ended up on is introduced after the crash rather than before the launch.
  const arrived = c.upbringingId === 'orphan_pod';
  const opener = WORLD_OPENERS[place.planet];
  if (arrived) say(`{Somewhere, a [race] is born|A [race] is born, and the record of where does not survive|`
    + `You are born [race] on a world nobody will bother to write down}. `
    + `{Age [year]|It is Age [year]}. {[era]|What history will call [era]}.`, 'scene');
  else if (opener) say(opener, 'scene');
  else {
    say(`{[place]|[place], in [era]|[place]. Age [year]}. `
      + `{It is not a famous world|Nothing important has ever happened here|`
      + `Nobody outside this system could find it on a chart}.`, 'scene');
  }

  // 2. When.
  if (!arrived) {
    say(`{Age [year]|It is Age [year]|The year is [year]}. {[era]|This is [era]|History will call this [era]}.`, 'scene');
  }

  // 3. What happens.
  const scene = UPBRINGING_SCENES[c.upbringingId] || DEFAULT_SCENE;
  for (const beat of scene) say(beat);

  // The world you woke up on, introduced now that you are on it.
  if (arrived && opener) say(opener, 'scene');
  else if (arrived) say(`{[place]. It will do|[place], which is where you are from now|You are from [place] now}.`, 'scene');

  // 4. Who is there.
  if (parents.length && !['orphan_pod', 'animals', 'self_raised', 'lab'].includes(c.upbringingId)) {
    say(parents.length > 1
      ? `{[mother] and [father] are there|Both of them are there|[father] is not much use and [mother] does not comment on it}. `
        + `{They name you [name]|The name is [name]. Somebody in the family had it first|You are [name], apparently}.`
      : `{[mother] is there. Nobody else is|There is one person in the room and she is holding you|`
        + `It is just the two of you and it stays that way}. {You are [name]|She names you [name]}.`);
  } else {
    say(`{Whoever names you, names you [name]|The name comes later. It is [name]|`
      + `You end up called [name], and nobody remembers deciding it}.`);
  }

  // 5. What you are, in the only terms this world understands.
  say(`{You are [race]|Whatever else happens, you are [race]|`
    + `[race], which will decide more about your life than anything you choose}. `
    + (c.power > 400
      ? `{Somebody points a scouter at you and stops talking|The number is high enough that it gets repeated|`
        + `Whatever reads you reads you twice}.`
      : c.power < 5
        ? `{Nothing about you registers as remarkable|If anybody measures you, they do not mention the result|`
          + `You are, by every measure available, nothing much}.`
        : `{Nobody measures you. There is no reason to|It does not occur to anyone to check|`
          + `You are a baby, and nobody scans babies here}.`));

  if (upbringing && upbringing.blurb) {
    out.push({ kind: 'origin', text: `${upbringing.name}. ${upbringing.blurb}` });
  }
  return out;
}
