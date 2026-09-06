// The years when nothing is trying to end the world.
//
// A Dragon Ball life is mostly peace. Between the Saiyans and Frieza is one
// year; between Buu and the Tournament of Power is six; after Age 790 there is
// nothing at all for as long as you live. If the quiet years have no content
// the game turns into a slideshow of "you train" between sagas, so this is the
// peace given the same weight as the wars: work, money, family, boredom,
// getting old, being famous for something that stopped happening, and the very
// specific problem of being the strongest person alive with nothing to fight.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, relate, trainYear, powerLine, findNpc, stranger,
  canonHere, meetCanon, offerBattle } from './helpers.js';
import { combatPower, powerTier } from '../stats.js';
import { TIMELINE } from '../../data/timeline.js';
import { getPlace } from '../../data/places.js';
import { livingNpcs } from '../state.js';
import { currencyFor, credit, debit, canAfford, formatMoney, priceIn } from '../../data/currency.js';
import { reputationOf, homeOf } from '../settlement.js';
import { ceilingBlock } from '../mastery.js';
import { numberish } from '../text.js';

/** A year with nothing on the timeline and nothing chasing you. */
function peaceful(ctx) {
  if (ctx.character.inAfterlife) return false;
  if (ctx.character.flags.hunted_by_defenders) return false;
  return !TIMELINE.some((t) => t.year === ctx.year && !ctx.state.world.resolved.includes(t.id));
}

/** How long it has been quiet, which is what makes these events land. */
function quietRun(ctx) {
  let years = 0;
  for (let y = ctx.year; y > ctx.year - 40; y -= 1) {
    if (TIMELINE.some((t) => t.year === y)) break;
    years += 1;
  }
  return years;
}

registerEvents([
  // ------------------------------------------------------------ ordinary work
  {
    id: 'peace_work', tags: ['life', 'peace'], weight: 30, minBioAge: 18,
    when: (ctx) => peaceful(ctx) && quietRun(ctx) >= 2,
    slots: (ctx) => ({
      job: ctx.rng.pick([
        'clearing a rockslide off a mountain road', 'hauling a fishing boat off a reef',
        'moving a warehouse in an afternoon', 'demolishing a condemned tower properly',
        'putting out a fire that the fire service cannot reach',
        'lifting a bridge section into place', 'digging a well through granite',
        'finding somebody\'s missing child in a forest',
      ]),
      pay: ctx.rng.int(9000, 90000),
    }),
    title: 'Work',
    text: `{Somebody comes to find you|A local official knocks and is very apologetic|`
      + `Word gets round that you are the person to ask}. `
      + `{It is [job]|The job is [job]|They need [job] and there is nobody else}. `
      + `{It would take a crew a fortnight|They have costed it and cannot afford it|It is not heroism. It is a job}.`,
    choices: (ctx, s) => [
      { id: 'do', label: 'Do it', effect: (c2, sl) => {
        const cur = currencyFor(getPlace(c2.character.placeId).planet);
        credit(c2.character, cur.id, priceIn(sl.pay, cur.id));
        return { text: `{It takes you a morning|You are finished before lunch|`
          + `They keep saying it is impossible while you are doing it}. `
          + `{They pay you what they said they would|You are paid, fed, and thanked twice|`
          + `Somebody's grandmother makes you eat something}. `
          + `${formatMoney(priceIn(sl.pay, cur.id), cur.id)}.`,
        changes: apply(c2, { happiness: 8, karma: 5, fame: 2 }) };
      } },
      { id: 'free', label: 'Do it and refuse the money', effect: (c2, sl) => ({
        text: `{You will not take it|You tell them to keep it|`
          + `They try three times and you say no three times}. `
          + `{It becomes a story people tell about you|That travels further than the work did|`
          + `Somebody names something after you, badly}.`,
        changes: apply(c2, { happiness: 12, karma: 14, fame: 5 }),
      }) },
      { id: 'no', label: 'Not your problem', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.4 });
        return { text: `{You have your own work|Somebody else can lift it|You do not answer the door}. ${powerLine(t.gained)}`,
          changes: apply(c2, { karma: -4, fame: -2 }) };
      } },
    ],
  },

  // ---------------------------------------------------------- the strongest
  {
    id: 'peace_nothing_left', tags: ['life', 'peace'], weight: 26, minBioAge: 22,
    when: (ctx) => peaceful(ctx) && quietRun(ctx) >= 4
      && combatPower(ctx.character) > 100000,
    slots: (ctx) => {
      const block = ceilingBlock(ctx.state);
      return {
        tier: powerTier(combatPower(ctx.character)),
        years: String(quietRun(ctx)),
        stuck: block ? 'yes' : 'no',
      };
    },
    title: 'Nothing To Push Against',
    text: `{[years] years of this|It has been quiet for [years] years|Nothing has needed you in [years] years}. `
      + `{You are [tier] and there is nothing on this world in that class|`
      + `Everybody you could learn something from is either dead or on your side|`
      + `You have run out of people to be worse than}. `
      + `{Training alone stops teaching you things after a while|`
      + `You can feel yourself levelling off|The gains have gone flat and you know exactly why}.`,
    choices: (ctx, s) => [
      { id: 'invent', label: 'Make the problem yourself', effect: (c2) => {
        const t = trainYear(c2, { intensity: 2.0, placeMult: 1.4 });
        c2.character.flags.self_imposed_limit = true;
        return { text: `{You start fighting handicapped|You put weight on and never take it off|`
          + `You train with one arm tied and it is not a metaphor}. `
          + `{It works, up to a point|The point comes back eventually|It is a way of buying time}. ${powerLine(t.gained)}`,
        changes: apply(c2, { stats: { discipline: 6, technique: 4 }, happiness: -3 }) };
      } },
      { id: 'seek', label: 'Go looking for somebody stronger', effect: (c2) => {
        c2.character.flags.searching_for_a_match = true;
        return { text: `{You start asking|Somewhere out there is somebody who has not heard of you|`
          + `You put the word out and wait for it to come back}. `
          + `{Nothing this year|A rumour, third-hand, from four systems out|`
          + `Somebody says a name you have never heard and then will not repeat it}.`,
        changes: apply(c2, { happiness: 5, fame: 3 }) };
      } },
      { id: 'stop', label: 'Stop, and let it be enough', effect: (c2) => ({
        text: `{You put it down|For the first time in your life you are not preparing for anything|`
          + `It takes about a month to stop reaching for it}. `
          + `{You sleep properly|Something in your shoulders lets go|`
          + `You get fat, slightly, and find you do not mind}.`,
        changes: apply(c2, { happiness: 20, health: 10, stats: { discipline: -4, speed: -2 } }),
      }) },
    ],
  },

  // ------------------------------------------------------------- being known
  {
    id: 'peace_recognised', tags: ['life', 'peace', 'social'], weight: 24, minBioAge: 14,
    when: (ctx) => peaceful(ctx) && reputationOf(ctx.state).known > 100000,
    slots: (ctx) => ({
      known: numberish(reputationOf(ctx.state).known),
      where: ctx.rng.pick(['in a queue', 'at a market stall', 'on a train', 'outside a school',
        'in the middle of a street', 'at a petrol station', 'in a waiting room']),
      what: ctx.rng.pick([
        'a thing you did twenty years ago', 'a fight you barely remember',
        'the day you turned up and something did not end', 'something you did not actually do',
        'a version of events with the details wrong',
      ]),
    }),
    title: 'Somebody Recognises You',
    text: `{[where], somebody stops|Somebody looks at you twice [where] and then comes over|`
      + `A stranger [where] says your name like it is a question}. `
      + `{They want to talk about [what]|It is [what] they remember|They have [what] slightly wrong and love it anyway}. `
      + `{About [known] people know that story|[known] people have heard some version of it|`
      + `You are, apparently, a thing that happened}.`,
    choices: (ctx, s) => [
      { id: 'kind', label: 'Give them the time', effect: (c2, sl) => ({
        text: `{You let them talk|You do not correct the details|You sign the thing they are holding}. `
          + `{They will tell people about this for years|It costs you eleven minutes|`
          + `Their whole face changes and stays changed}.`,
        changes: apply(c2, { happiness: 9, karma: 6, fame: 3 }),
      }) },
      { id: 'correct', label: 'Tell them what actually happened', effect: (c2, sl) => ({
        text: `{You tell them the real version|You explain who actually did it|`
          + `You give the credit to the person who earned it}. `
          + `{They are disappointed and you cannot help that|They believe you, which is worse|`
          + `The true story is smaller and they can tell}.`,
        changes: apply(c2, { happiness: 3, karma: 8, fame: -2, stats: { charisma: 2 } }),
      }) },
      { id: 'go', label: 'Keep walking', effect: (c2) => ({
        text: `{You do not stop|You are not doing this today|You give them nothing and keep going}. `
          + `{They tell that story too|It gets round|It is a smaller story and it lasts longer}.`,
        changes: apply(c2, { fame: -3, karma: -3 }),
      }) },
    ],
  },

  // --------------------------------------------------------- domestic peace
  {
    id: 'peace_home', tags: ['life', 'peace', 'family'], weight: 26, minBioAge: 20,
    when: (ctx) => peaceful(ctx) && !!homeOf(ctx.state),
    slots: (ctx) => {
      const kin = livingNpcs(ctx.state).filter((n) => ['child', 'partner', 'spouse', 'parent', 'sibling'].includes(n.relation));
      const who = kin.length ? ctx.rng.pick(kin) : null;
      return {
        who: who ? who.name : 'nobody in particular',
        npcId: who ? who.id : null,
        chore: ctx.rng.pick([
          'a roof that has been leaking since spring', 'a garden that has got away from everybody',
          'a wall that needs rebuilding for the third time', 'a boiler nobody understands',
          'a room that has been full of boxes for nine years', 'a fence, and the animal that keeps going through it',
        ]),
      };
    },
    title: 'The House',
    text: `{There is [chore]|Nobody has dealt with [chore]|The house has [chore] and it has been mentioned}. `
      + `{[who] has stopped asking about it|[who] mentions it in passing, which is not passing|`
      + `It has become a thing that is not being said}.`,
    choices: (ctx, s) => [
      { id: 'fix', label: 'Fix it properly', effect: (c2, sl) => {
        const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (npc) relate(c2, npc, { closeness: 10, trust: 8 });
        return { text: `{You do it properly, which takes four days instead of one|`
          + `You take the whole thing apart and put it back better|You over-engineer it enormously}. `
          + `{Nobody mentions it again, which is the point|[who] says nothing and makes you something to eat|`
          + `It will outlast the house}.`,
        changes: apply(c2, { happiness: 12, stats: { intellect: 2 } }), view: { who: sl.who } };
      } },
      { id: 'ki', label: 'Solve it the fast way', effect: (c2, sl) => ({
        text: `{You do it in an afternoon with your hands and no tools|`
          + `It takes about nine seconds and looks slightly wrong afterwards|`
          + `Somebody points out you have fused the beams}. `
          + `{It holds|It is not up to code and never will be|Nobody is going to argue with it}.`,
        changes: apply(c2, { happiness: 6 }),
      }) },
      { id: 'later', label: 'It can wait', effect: (c2, sl) => {
        const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (npc) relate(c2, npc, { closeness: -6, tension: 6 });
        const t = trainYear(c2, { intensity: 1.5 });
        return { text: `{It waits|It has waited this long|You go up the mountain instead}. ${powerLine(t.gained)}`,
          changes: apply(c2, { happiness: -4 }) };
      } },
    ],
  },

  // ----------------------------------------------------------- the next lot
  {
    id: 'peace_next_generation', tags: ['life', 'peace', 'legacy'], weight: 22, minBioAge: 30,
    when: (ctx) => peaceful(ctx) && quietRun(ctx) >= 3,
    slots: (ctx) => ({
      kid: ctx.rng.pick(['a child who cannot be more than nine', 'somebody\'s teenager',
        'a boy with a stick and no idea what to do with it', 'a girl who has clearly been practising in secret',
        'three of them, and one is doing all the talking']),
      ask: ctx.rng.pick(['can they see it', 'will you show them one', 'is it true',
        'how do you do the light', 'were you really there']),
    }),
    title: 'They Ask',
    text: `{[kid] finds you|[kid] has been waiting for you and is pretending not to have been|`
      + `[kid] gets up the nerve}. `
      + `{They want to know [ask]|The question is [ask]|It comes out as [ask], all in one breath}.`,
    choices: (ctx, s) => [
      { id: 'show', label: 'Show them', effect: (c2, sl) => {
        const student = stranger(c2, { relation: 'student', minAge: 7, maxAge: 17 });
        if (student) relate(c2, student, { respect: 25, trust: 20, closeness: 12 });
        return { text: `{You light your hand and hold it out|You do the smallest one you know|`
          + `You put a rock up in the air and leave it there}. `
          + `{They do not breathe for about four seconds|They will remember this for sixty years|`
          + `Something in them decides what it is going to do with its life}.`,
        changes: apply(c2, { happiness: 14, fame: 2, karma: 4 }) };
      } },
      { id: 'teach', label: 'Start them off properly', effect: (c2, sl) => {
        const student = stranger(c2, { relation: 'student', minAge: 7, maxAge: 17 });
        if (student) relate(c2, student, { respect: 30, trust: 25, closeness: 18 });
        fact(c2, 'Started teaching in the quiet years.', { type: 'teaching', weight: 5, tags: ['legacy'] });
        return { text: `{You start them on the stance and nothing else|`
          + `The first lesson is standing still and they hate it|You give them a year of the boring part}. `
          + `{Most of them quit. This one does not|They come back the next day, and the next|`
          + `You have accidentally acquired a student}.`,
        changes: apply(c2, { happiness: 10, karma: 8, stats: { charisma: 3, discipline: 2 } }) };
      } },
      { id: 'warn', label: 'Tell them what it costs', effect: (c2, sl) => ({
        text: `{You tell them the truth|You show them the scars instead|`
          + `You describe what happens to people who do this}. `
          + `{They do not hear a word of it|They hear it and want it anyway|`
          + `Nobody has ever been talked out of this, including you}.`,
        changes: apply(c2, { happiness: -2, karma: 5, stats: { charisma: 2 } }),
      }) },
    ],
  },

  // ------------------------------------------------------------ getting old
  {
    id: 'peace_ageing', tags: ['life', 'peace', 'body'], weight: 20, minBioAge: 48,
    when: (ctx) => peaceful(ctx),
    slots: (ctx) => ({
      sign: ctx.rng.pick([
        'a knee that reports the weather', 'a shoulder that does not come all the way up any more',
        'the fact that you warmed up first, and had to', 'grey where there was not grey',
        'needing to think about a movement you have done ten thousand times',
        'somebody young keeping up with you for a whole round',
      ]),
    }),
    title: 'The First Sign',
    text: `{You notice it in the middle of something else|It arrives without an announcement|`
      + `You have been ignoring it and today you do not}. `
      + `{[sign]|It is [sign]|The specific thing is [sign]}. `
      + `{Nobody else notices|Somebody notices and says nothing|You catch somebody noticing}.`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Train through it', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.8 });
        return { text: `{You train harder, which works and costs|You do not accept it|`
          + `You put another two hours a day into it}. ${powerLine(t.gained)} `
          + `{The body sends the bill later|It holds. For now|You buy yourself years}.`,
        changes: apply(c2, { health: -8, stats: { discipline: 5, durability: 2 } }) };
      } },
      { id: 'adapt', label: 'Change how you fight', effect: (c2) => ({
        text: `{You stop trying to be fast and start being early|`
          + `You rebuild your whole style around not needing the knee|`
          + `Technique is what is left when speed goes, and you have plenty}. `
          + `{You are harder to beat than you were at thirty|Younger fighters find this baffling|`
          + `The new version is worse on paper and better in practice}.`,
        changes: apply(c2, { stats: { technique: 8, intellect: 4, speed: -3 }, happiness: 4 }),
      }) },
      { id: 'accept', label: 'Let it be what it is', effect: (c2) => ({
        text: `{You stop fighting it|It is a body. Bodies do this|You laugh about it, mostly}. `
          + `{You will be doing this a lot now|There is a version of this that is fine|`
          + `You have had a very good run and you know it}.`,
        changes: apply(c2, { happiness: 10, health: 4 }),
      }) },
    ],
  },

  // ---------------------------------------------------- an old friend calls
  {
    id: 'peace_old_friend', tags: ['life', 'peace', 'social'], weight: 22, minBioAge: 25,
    when: (ctx) => peaceful(ctx)
      && livingNpcs(ctx.state).some((n) => (n.closeness || 0) > 45 && (n.knowledge || 0) >= 2),
    slots: (ctx) => {
      const pool = livingNpcs(ctx.state).filter((n) => (n.closeness || 0) > 45 && (n.knowledge || 0) >= 2);
      const npc = ctx.rng.pick(pool);
      return {
        who: npc.name, npcId: npc.id,
        why: ctx.rng.pick([
          'no reason at all', 'because somebody died and they did not want to say so on the call',
          'to ask a favour they will not name for two hours',
          'because they have been thinking about the old days',
          'to tell you they are stopping',
          'because their child is old enough to ask about you',
        ]),
      };
    },
    title: 'Somebody Calls',
    text: `{[who] gets in touch|It is [who], out of nowhere|You have not heard from [who] in years and then you have}. `
      + `{They are calling [why]|It is [why]|The reason turns out to be [why]}.`,
    choices: (ctx, s) => [
      { id: 'go', label: 'Go and see them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) relate(c2, npc, { closeness: 16, trust: 12 });
        return { text: `{You go|It takes a day and you have the day|You drop everything, which surprises both of you}. `
          + `{You talk until it is light|Neither of you says the important thing and both of you hear it|`
          + `It is exactly like it was, which nobody expected}.`,
        changes: apply(c2, { happiness: 16 }) };
      } },
      { id: 'call', label: 'Talk, but stay where you are', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) relate(c2, npc, { closeness: 6, trust: 3 });
        return { text: `{You talk for two hours|It is good, and it is not the same|`
          + `You say you will visit and mean it at the time}.`,
        changes: apply(c2, { happiness: 7 }) };
      } },
      { id: 'busy', label: 'Not now', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) relate(c2, npc, { closeness: -10, trust: -6 });
        return { text: `{You do not pick up|You mean to call back|`
          + `There is always next month, and there is, until there is not}.`,
        changes: apply(c2, { happiness: -6 }) };
      } },
    ],
  },

  // ---------------------------------------------- something small goes wrong
  {
    id: 'peace_small_trouble', tags: ['life', 'peace', 'conflict'], weight: 24, minBioAge: 12,
    when: (ctx) => peaceful(ctx),
    slots: (ctx) => ({
      trouble: ctx.rng.pick([
        'four men are robbing a bank very badly', 'a dam upstream is about to go',
        'somebody has driven a truck into a river', 'a fire in a block where the stairs have gone',
        'an animal the size of a house has come out of the hills',
        'two families on this street have been feuding for a decade and it is about to stop being words',
      ]),
      scale: ctx.rng.pick(['nobody important', 'about forty people', 'one child', 'a whole street']),
    }),
    title: 'Small Trouble',
    text: `{It is not the end of the world|Nothing cosmic|This one is small}. `
      + `{[trouble]|Down the road, [trouble]|You look up and [trouble]}. `
      + `{[scale] is in the way of it|It is going to cost [scale]|[scale], if nobody moves}.`,
    choices: (ctx, s) => [
      { id: 'handle', label: 'Handle it', effect: (c2, sl) => ({
        text: `{You are there before anybody has finished shouting|`
          + `It takes you less time than it takes to describe|You do not even go fast}. `
          + `{Nobody is hurt|They will talk about it for a week and then forget|`
          + `Somebody films it badly and it gets round}.`,
        changes: apply(c2, { happiness: 10, karma: 10, fame: 3 }),
      }) },
      { id: 'careful', label: 'Handle it without being seen', effect: (c2, sl) => ({
        text: `{You do it from where nobody is looking|`
          + `The wall simply does not fall, and nobody works out why|`
          + `You are gone before the dust settles}. `
          + `{Nobody knows it was you|There is no story. There is just a thing that did not happen|`
          + `That is the version you prefer}.`,
        changes: apply(c2, { happiness: 12, karma: 12 }),
      }) },
      { id: 'locals', label: 'Let them handle their own street', effect: (c2, sl) => ({
        text: `{You do not move|It is not yours to fix|Somebody local sorts it, badly, and they sort it}. `
          + `{Two people are hurt who did not need to be|It works out, mostly|`
          + `They manage. They have been managing for a long time}.`,
        changes: apply(c2, { karma: -6, happiness: -3 }),
      }) },
    ],
  },
]);
