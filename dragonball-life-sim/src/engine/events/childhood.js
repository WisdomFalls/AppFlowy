// The first dozen years. A life sim is judged on its opening, and a Dragon
// Ball childhood is where the species differences are most visible: a Saiyan
// infant, a Namekian hatchling and an android's first boot are not the same
// story.

import { registerEvents, pickNpc, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, findNpc,
  odds, meetCanon, canonHere, moveTo } from './helpers.js';
import { getRace, hasPerk } from '../../data/races.js';
import { numberish } from '../text.js';

registerEvents([
  {
    id: 'infancy', maxUses: 2, tags: ['childhood', 'quiet'], weight: 40,
    minAge: 0, maxBioAge: 4,
    slots: (ctx) => ({}),
    title: 'Very Small',
    text: (ctx) => {
      const race = getRace(ctx.character.raceId);
      if (race.perks.includes('asexualBirth')) {
        return `{You come out of an egg|The egg takes a season|You hatch} and {you are expected to walk immediately|nobody makes a fuss|the elder puts a hand on your head and says a name}.
          {Namekians do not have a childhood so much as a short delay|You can already speak|Water is all you need and that is fortunate}.`;
      }
      if (['android', 'bioandroid'].includes(ctx.character.raceId)) {
        return `{Your first memory is a ceiling|You come online in stages|The first thing is a light, then a voice reading numbers}.
          {Somebody is checking your responses against a chart|There is a serial number on the inside of your wrist|A machine says your name before anyone else does}.`;
      }
      return `{You are very small and very loud|Nobody sleeps for a year|You are extremely heavy for your size}.
        {You break a cot|You put a dent in something structural|Your first word is not a word}. #ambience#`;
    },
    choices: (ctx) => [
      { id: 'loud', label: 'Be an absolute menace', effect: (c2) => {
        const changes = apply(c2, { stats: { strength: 2, charisma: -1 }, happiness: 6 });
        const parent = pickNpc(c2, (n) => n.relation === 'parent');
        if (parent) relate(c2, parent, { closeness: 4, tension: 6 });
        return { text: `{The neighbours have opinions|Your family is exhausted|Something in the house is permanently broken}. {You are pleased with yourself|You sleep through the aftermath|Nobody can prove it was you}.`, changes };
      } },
      { id: 'quiet', label: 'Be unnervingly quiet', effect: (c2) => {
        const changes = apply(c2, { stats: { intellect: 2, discipline: 2 }, happiness: 2 });
        return { text: `{You watch everything|You do not cry much|People keep checking you are still there}. {It is noted|Somebody says you have old eyes|It is remarked on for years afterwards}.`, changes };
      } },
    ],
  },

  {
    id: 'first_word', once: true, tags: ['childhood', 'family'], weight: 26,
    minBioAge: 2, maxBioAge: 6,
    when: (ctx) => ctx.rel('parent').length > 0,
    slots: (ctx) => {
      const p = ctx.rng.pick(ctx.rel('parent'));
      return { ...npcSlot(p), word: ctx.rng.pick(['"more"', '"no"', '"again"', 'a swear word', 'the name of a technique', '"mine"', 'the word for food']) };
    },
    title: 'The First Word',
    text: `[npcName] {is there for it|misses it and never gets over that|writes it down}.
      Your first word is [word]. {It sets a tone|Everyone agrees this is fitting|Nobody is surprised later}.`,
    choices: (ctx, s) => [
      { id: 'sweet', label: 'Say it again for them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) relate(c2, npc, { closeness: 12 });
        const changes = apply(c2, { happiness: 8, stats: { charisma: 2 } });
        return { text: `{They cry|They pick you up|It becomes a family story you will hear four hundred times}.`, changes };
      } },
      { id: 'refuse', label: 'Refuse to do it again', effect: (c2) => {
        const changes = apply(c2, { stats: { discipline: 2, charisma: -1 }, happiness: 2 });
        return { text: `{You do not perform|Once was enough|You will not be a party trick}. {Even now|Already|At this age} you are difficult about it.`, changes };
      } },
    ],
  },

  {
    id: 'child_hunger', tags: ['childhood', 'race'], weight: 22,
    minBioAge: 3, maxBioAge: 13,
    when: (ctx) => getRace(ctx.character.raceId).appetite > 2,
    slots: () => ({}),
    title: 'The Appetite',
    text: `{Feeding you is a logistical problem|You eat #meal# and ask what is next|The family food budget is a crisis}.
      {Nobody prepared them for this|It is not a phase|Your species is like this and everyone has stopped commenting}.`,
    choices: () => [
      { id: 'hunt', label: 'Go and get your own food', effect: (ctx) => {
        const changes = apply(ctx, { stats: { strength: 3, speed: 3, durability: 2 }, happiness: 6 });
        const t = trainYear(ctx, { intensity: 0.9 });
        return { text: `{You come home dragging something|You learn to fish with your hands|You bring back a dinosaur and no explanation}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'steal', label: 'Take what you need from the market', effect: (ctx) => {
        const changes = apply(ctx, { stats: { speed: 4, charisma: 2 }, karma: -5, happiness: 4 });
        return { text: `{You are fast and small|Nobody catches you|You get caught twice and it teaches you something}. {It is not stealing if you are this hungry|Your family does not ask where it came from|You are never hungry again}.`, changes };
      } },
      { id: 'endure', label: 'Learn to be hungry', effect: (ctx) => {
        const changes = apply(ctx, { stats: { discipline: 5, durability: 3 }, happiness: -4 });
        return { text: `{You get very good at it|Hunger becomes a thing that happens to somebody else|It is the first real discipline you learn}.`, changes };
      } },
    ],
  },

  {
    id: 'child_sparring', tags: ['childhood', 'training'], weight: 24,
    minBioAge: 5, maxBioAge: 14,
    slots: (ctx) => {
      const sib = ctx.npcs.filter((n) => n.relation === 'sibling');
      const npc = sib.length ? ctx.rng.pick(sib) : null;
      return npc ? npcSlot(npc) : { npcId: null, npcName: 'the other children' };
    },
    title: 'Fighting the Neighbours',
    text: `{It starts as a game|Nobody remembers who started it|It is what children do here}: you and [npcName], {every day after school|all summer|until somebody's parent shouts}.
      {You lose more than you win|You win more than is polite|It is even, and that is why it keeps happening}.`,
    choices: (ctx, s) => [
      { id: 'win', label: 'Win at any cost', effect: (c2, sl) => {
        const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (npc) relate(c2, npc, { tension: 18, respect: 12, closeness: -4 });
        const t = trainYear(c2, { intensity: 1.1 });
        const changes = apply(c2, { stats: { strength: 3, speed: 2, charisma: -2 }, health: -4 });
        return { text: `{You do not lose|You fight dirty and it works|Winning is the only part you enjoy}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'fair', label: 'Keep it fair', effect: (c2, sl) => {
        const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (npc) relate(c2, npc, { closeness: 14, respect: 10 });
        const t = trainYear(c2, { intensity: 0.9 });
        const changes = apply(c2, { stats: { technique: 3, charisma: 3 }, happiness: 8, karma: 3 });
        return { text: `{You pull your punches and still win|Neither of you cheats|It is the best part of every day}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'lose', label: 'Let them win', effect: (c2, sl) => {
        const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (npc) relate(c2, npc, { closeness: 8, respect: -6 });
        const changes = apply(c2, { stats: { intellect: 3, discipline: 2 }, happiness: 4, karma: 4 });
        return { text: `{You could win|You choose not to|They need it more than you do}. {You learn more watching than winning|Nobody notices what you are doing|You are already thinking two moves further out than they are}.`, changes };
      } },
    ],
  },

  {
    id: 'child_lost', once: true, tags: ['childhood'], weight: 18,
    minBioAge: 4, maxBioAge: 12,
    slots: (ctx) => ({
      where: ctx.rng.pick(['three valleys from home', 'in a city you have never seen',
        'at the bottom of a ravine', 'in the woods after dark', 'on the wrong train',
        'a very long way up a mountain']),
    }),
    title: 'Lost',
    text: `{You wander off|You follow something interesting|Somebody loses you}: [where], {with no idea how to get back|after dark|and nobody knows}.
      #ambience#`,
    choices: () => [
      { id: 'survive', label: 'Get yourself home', effect: (ctx) => {
        const changes = apply(ctx, { stats: { durability: 4, intellect: 3, discipline: 3 }, health: -6, happiness: -2 });
        fact(ctx, 'Got lost as a child and walked home alone.', { weight: 3, tags: ['origin'] });
        return { text: `{It takes four days|You eat things you should not|You walk the whole way}. {When you get back nobody believes you|Your family had given up|You do not tell them all of it}.`, changes };
      } },
      { id: 'found', label: 'Wait to be found', effect: (ctx) => {
        const finder = stranger(ctx, { relation: 'acquaintance', closeness: 45, respect: 30, metHow: 'rescue', minAge: 20, maxAge: 60 });
        relate(ctx, finder, { note: 'Found you when you were small.' });
        const changes = apply(ctx, { happiness: 4, stats: { charisma: 2 } });
        fact(ctx, `${finder.name} found them lost as a child.`, { weight: 3, subject: finder.id, tags: ['origin'] });
        return { text: `${finder.name} {finds you|takes you in for the night|carries you most of the way back}. {You will know them for the rest of your life|They never make anything of it|You remember the face}.`, changes };
      } },
    ],
  },

  {
    id: 'child_animal', once: true, tags: ['childhood', 'quiet'], weight: 16,
    minBioAge: 4, maxBioAge: 13,
    slots: (ctx) => ({
      beast: ctx.rng.pick(['a dinosaur with a bad leg', 'a wolf that will not leave',
        'a bird nobody can identify', 'a tiny dragon, probably', 'something that follows you home',
        'a very large cat with opinions']),
    }),
    title: 'It Followed You Home',
    text: `[beast:cap]. {It will not go away|It has decided about you|It sits outside until you come out}.
      {Your family says absolutely not|Nobody notices for weeks|You do not ask permission}.`,
    choices: (ctx, s) => [
      { id: 'keep', label: 'Keep it', effect: (c2, sl) => {
        const pet = stranger(c2, { relation: 'pet', raceId: 'beast', closeness: 80, respect: 20, minAge: 0, maxAge: 4, name: sl.beast.split(' ').slice(-1)[0] });
        pet.name = c2.rng.pick(['Bee', 'Rusk', 'Pip', 'Grum', 'Nimbus', 'Radish', 'Tuffet', 'Onion', 'Blip']);
        pet.title = 'Companion';
        pet.power = c2.rng.int(1, 40);
        const changes = apply(c2, { happiness: 14, karma: 3 });
        fact(c2, `Kept ${pet.name}, ${sl.beast}.`, { weight: 2, subject: pet.id, tags: ['family'] });
        return { text: `You call it ${pet.name}. {It is enormous within a year|It sleeps on you|It bites everyone else and not you}.`, changes };
      } },
      { id: 'release', label: 'Send it away', effect: (c2) => {
        const changes = apply(c2, { happiness: -6, stats: { discipline: 3 } });
        return { text: `{You take it back where you found it|It follows you for a while and then does not|It is the right thing and you hate it}.`, changes };
      } },
    ],
  },

  {
    id: 'child_first_lesson', maxUses: 2, tags: ['childhood', 'training', 'mentor'], weight: 24,
    minBioAge: 5, maxBioAge: 14,
    when: (ctx) => ctx.character.techniques.length < 3,
    slots: (ctx) => {
      const family = ctx.npcs.filter((n) => ['parent', 'sibling'].includes(n.relation) && n.power > 3);
      const teacher = family.length ? ctx.rng.pick(family) : null;
      return teacher ? npcSlot(teacher) : { npcId: null, npcName: 'a neighbour who used to fight' };
    },
    title: 'The First Lesson',
    text: `[npcName] {shows you how to stand|puts your feet in the right place and moves on|starts you on the basics}.
      {It is boring|It is the same movement a thousand times|You want to skip to the interesting part}.`,
    choices: (ctx, s) => [
      { id: 'listen', label: 'Do it properly', effect: (c2, sl) => {
        const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (npc) relate(c2, npc, { closeness: 10, respect: 14 });
        if (!c2.character.techniques.includes('basic_martial_arts')) {
          c2.character.techniques.push('basic_martial_arts');
          c2.state.stats.techniquesLearned++;
        }
        const t = trainYear(c2, { intensity: 1.0, mentorMult: 1.3 });
        const changes = apply(c2, { stats: { technique: 4, discipline: 4 }, happiness: 3 });
        fact(c2, `Learned the fundamentals from ${sl.npcName}.`, { weight: 3, tags: ['origin', 'training'] });
        return { text: `{You do it a thousand times|You do not complain|By the end of the year your stance is right without thinking}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'rush', label: 'Skip ahead to the flashy part', effect: (c2, sl) => {
        const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (npc) relate(c2, npc, { tension: 10, respect: -4 });
        const t = trainYear(c2, { intensity: 1.2 });
        const changes = apply(c2, { stats: { strength: 3, technique: -1, discipline: -2 }, health: -5, happiness: 5 });
        return { text: `{You try to do the impressive thing and hurt yourself|It half works, which is worse|You will have to unlearn all of this later}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'child_cruelty', maxUses: 2, tags: ['childhood', 'social'], weight: 16,
    minBioAge: 6, maxBioAge: 15,
    slots: (ctx) => ({
      what: ctx.rng.pick(['a group of older children corner somebody smaller',
        'somebody is throwing rocks at a stray', 'a shopkeeper is beating a boy for stealing',
        'the other children have decided somebody is fair game',
        'a soldier is taking things from a family who cannot stop him']),
    }),
    title: 'The Choice Everyone Makes',
    text: `[what:cap]. {You are close enough to see it|Nobody else is going to do anything|You are small and there are several of them}.`,
    choices: () => [
      { id: 'intervene', label: 'Step in', effect: (ctx) => {
        const hurt = odds(ctx, 0.5);
        const saved = stranger(ctx, { relation: 'friend', closeness: 60, respect: 50, minAge: 4, maxAge: 16, metHow: 'rescue' });
        const changes = apply(ctx, { karma: 12, health: hurt ? -12 : -3, happiness: 6, stats: { strength: 2, charisma: 2 } });
        fact(ctx, `Stepped in for ${saved.name} when nobody else would.`, { weight: 4, subject: saved.id, tags: ['origin', 'hero'] });
        return { text: hurt
          ? `{You get badly beaten|There are more of them than you counted|You lose and they stop anyway}. ${saved.name} {helps you up|will not forget it|walks you home}.`
          : `{You are smaller and it does not matter|They leave|One shove is enough}. ${saved.name} {does not know what to say|follows you around for a year afterwards|is your friend from that day}.`, changes };
      } },
      { id: 'walk', label: 'Walk past', effect: (ctx) => {
        const changes = apply(ctx, { karma: -8, happiness: -8, stats: { discipline: 2 } });
        fact(ctx, 'Walked past something they could have stopped.', { weight: 4, tags: ['origin', 'shame'] });
        return { text: `{You keep walking|It is not your business|You tell yourself you would have lost}. {You think about it for years|It comes back at odd hours|You are not proud of it}.`, changes };
      } },
      { id: 'join', label: 'Join in', effect: (ctx) => {
        const changes = apply(ctx, { karma: -18, charisma: 0, happiness: 2, stats: { charisma: 3, strength: 1 } });
        ctx.character.traits.push('cruel');
        fact(ctx, 'Learned early that it was easier to be on the other side of it.', { weight: 5, tags: ['origin', 'villain'] });
        return { text: `{It is easier|They make room for you|You are good at it, which is the frightening part}. {Nobody stops you either|You sleep fine|Something in you settles into a shape}.`, changes };
      } },
    ],
  },

  {
    id: 'child_sky', once: true, tags: ['childhood', 'discovery'], weight: 14,
    minBioAge: 5, maxBioAge: 14,
    slots: (ctx) => ({
      sight: ctx.rng.pick(['a streak of light going the wrong way', 'a ship, low and silent',
        'somebody flying, without a machine', 'a light on the horizon that lasts nine seconds',
        'a shape between the stars that moves against them', 'a crater, still warm, with nothing in it']),
    }),
    title: 'Something in the Sky',
    text: `[sight:cap]. {Nobody else looks up|The adults say it was a plane|You are the only one who sees it}.
      {You think about it constantly|It changes what you want|You do not have words for it yet}.`,
    choices: () => [
      { id: 'chase', label: 'Go and find where it landed', effect: (ctx) => {
        const changes = apply(ctx, { stats: { intellect: 3, durability: 2 }, happiness: 6, health: -3 });
        ctx.character.flags.saw_the_sky = true;
        fact(ctx, 'Saw something in the sky as a child and went looking for it.', { weight: 4, tags: ['origin'] });
        return { text: `{You walk for two days|You find the crater|There is nothing there and it does not matter}. {You know now that there is a bigger version of everything|Something up there is enormous|You are going to leave this place eventually}.`, changes };
      } },
      { id: 'forget', label: 'Put it out of your mind', effect: (ctx) => {
        const changes = apply(ctx, { stats: { discipline: 3 }, happiness: 2 });
        return { text: `{You let it go|It was probably a plane|You have work in the morning, even at this age}. {It comes back in dreams|You remember it much later|You never quite manage it}.`, changes };
      } },
    ],
  },

  {
    id: 'child_meets_canon', tags: ['childhood', 'canon'], weight: 14,
    minBioAge: 4, maxBioAge: 15,
    slots: (ctx) => {
      const pool = canonHere(ctx, (c) => !c.tags.includes('threat') && !c.tags.includes('omniking'));
      if (!pool.length) return null;
      const c = ctx.rng.pick(pool);
      return { canonId: c.id, canonName: c.name, quirk: c.quirk };
    },
    title: (ctx, s) => `You Meet ${s.canonName}`,
    text: `{They are passing through|You get in their way|Somebody points them out and you go over}: [canonName]. [quirk]
      {You are far too small to be interesting|They stop anyway|Adults do not usually talk to you like this}.`,
    choices: (ctx, s) => [
      { id: 'impress', label: 'Try to impress them', effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.canonId, 'acquaintance');
        if (odds(c2, 0.4)) {
          relate(c2, npc, { closeness: 20, respect: 20 });
          const changes = apply(c2, { happiness: 14, stats: { charisma: 3, technique: 2 } });
          fact(c2, `${npc.name} remembered them from childhood.`, { weight: 5, subject: npc.id, tags: ['canon', 'origin'] });
          return { text: `{They laugh|They are genuinely impressed, which nobody expected|They ruffle your hair and say something you will repeat for thirty years}. {You have a friend in a very high place|They remember your name|It matters later}.`, changes };
        }
        relate(c2, npc, { closeness: 6 });
        const changes = apply(c2, { happiness: 6 });
        return { text: `{They are polite about it|They are already thinking about something else|They say "good" in a way that means nothing}. {You will do better next time|You are eight|It stings for a week}.`, changes };
      } },
      { id: 'watch', label: 'Just watch them', effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.canonId, 'acquaintance');
        const changes = apply(c2, { stats: { technique: 3, intellect: 2 }, happiness: 8 });
        fact(c2, `Watched ${npc.name} up close as a child.`, { weight: 3, subject: npc.id, tags: ['canon'] });
        return { text: `{You do not say anything|You memorise how they move|You watch until they are out of sight}. {It becomes the standard you measure everything against|You copy the stance for years|Nobody knows why you stand like that}.`, changes };
      } },
    ],
  },

  {
    // The genuine fallback. Deliberately low weight: it exists so a year is
    // never empty, not as a way to fill a life.
    id: 'quiet_year', tags: ['quiet'], weight: 2,
    slots: () => ({}),
    title: '{A Year Where Nothing Happens|A Quiet Year|Nothing Much To Report|An Ordinary Year|Twelve Uneventful Months|The Year In Between|A Year Off}',
    text: `{Nothing much|Not a great deal|Very little}. {The seasons go past|You train, you eat, you sleep|Work, food, sleep}.
      #ambience# {It is not a bad year|You will not remember it|These are the ones that add up}.`,
    choices: () => [
      { id: 'train', label: 'Put the time into training', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 1.1 });
        const changes = apply(ctx, { health: 4, stats: { discipline: 2 } });
        return { text: `{Steady work|Nothing dramatic|The unglamorous kind that actually adds up}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'live', label: 'Just live', effect: (ctx) => {
        const changes = apply(ctx, { happiness: 12, health: 10 });
        return { text: `{You do very little|You eat well and sleep properly|It is genuinely nice}. #joy#`, changes };
      } },
    ],
  },
]);
