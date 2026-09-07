// The Other World, as a place with things in it.
//
// Death in this setting is a change of address. The afterlife pack already had
// King Yemma, Snake Way, King Kai and Hell; this one gives the address a
// population and a economy. The people you loved are here and the meeting goes
// differently depending on how you left it. The people you killed are here too,
// they have had nothing to do but train, and some of them have got somewhere.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, relate, thread, trainYear, powerLine, stranger, findNpc,
  offerBattle, meetCanon, moveTo, killNpc } from './helpers.js';
import { combatPower, powerTier } from '../stats.js';
import { CANON, getCanon, canonPower, canonUniverse } from '../../data/canon.js';
import { ladderFor, getTransformation } from '../../data/transformations.js';
import { TECHNIQUES, getTechnique } from '../../data/techniques.js';
import { generateFullName } from '../../data/names.js';
import { numberish, zeni } from '../text.js';
import { clamp } from '../rng.js';

/** How this person felt about you at the end, which is what the meeting is. */
function reunionTone(npc) {
  const bond = (npc.closeness || 0) + (npc.trust ?? 30) * 0.5 - (npc.tension || 0);
  const killedByYou = /you killed|killed by you/i.test(npc.causeOfDeath || '');
  if (killedByYou) return 'killed';
  if ((npc.romance || 0) > 55) return 'love';
  if (npc.relation === 'child') return 'child';
  if (npc.relation === 'parent') return 'parent';
  if (npc.relation === 'rival' || (npc.tension || 0) > 55) return 'rival';
  if (bond > 90) return 'close';
  if (bond < 25) return 'distant';
  return 'friend';
}

const REUNION = {
  love: {
    title: (n) => `${n}, Again`,
    text: `{You are not looking for them and there they are|The queue moves and it is them|Somebody says your name the way only one person ever said it}.
      {Neither of you has anything sensible to say|They are exactly as you remember and that is the hard part|
       They have been waiting, which they will not admit}.`,
    stay: `{You do not let go for a long time|There is nothing to catch up on and you talk for a week anyway|
      Being dead together turns out to be easier than being alive apart}. {It is the best thing that has happened to you in years|
      Neither of you mentions that one of you might be wished back|You are not going to waste this}.`,
    gain: { happiness: 34 },
  },
  child: {
    title: (n) => `${n} Was Waiting`,
    text: `{They got here first|They are the same age they were|Somebody points and you follow the finger}.
      {You had years of things you were going to say and none of them work now|
       They are not angry, which you were not prepared for|They ask if you are staying}.`,
    stay: `{You stay|You are not leaving them again|You sit down next to them and that is the whole decision}.
      {It is quiet here|Nobody makes you explain|Whatever else you got wrong, you are here now}.`,
    gain: { happiness: 30, karma: 6 },
  },
  parent: {
    title: (n) => `${n} Is At The Front Of The Queue`,
    text: `{Older than you remember, or not older at all|They see you before you see them|You are, briefly, small again}.
      {They want to know what you did with it|They ask about the life like it was homework|
       They are proud and it takes them the whole conversation to get to it}.`,
    stay: `{You tell them all of it|It takes days|You leave out the parts you are ashamed of and they know anyway}.
      {They say the thing you spent your whole life waiting to hear|It is not a big speech|You did not know you still needed it}.`,
    gain: { happiness: 26, stats: { discipline: 3 } },
  },
  close: {
    title: (n) => `${n}`,
    text: `{You are not looking for them and there they are|The queue moves and it is them|
      Somebody claps you on the shoulder from behind and you know the weight of the hand}.
      {No halo suits them|They look well, for a corpse|They have clearly been here long enough to have opinions about the food}.`,
    stay: `{You pick it up exactly where it was left|Nothing has to be explained|You are both furious about the same things, still}.`,
    gain: { happiness: 24 },
  },
  friend: {
    title: (n) => `${n}, Of All People`,
    text: `{You had not thought about them in years|It takes a second to place them|They remember you better than you remember them}.
      {They are pleased to see you, which is a small shock|They ask what happened|Neither of you is quite sure what you were to each other}.`,
    stay: `{You end up talking for longer than you ever did alive|It turns out you liked them|
      You are the only person here who knows what they were like before}.`,
    gain: { happiness: 16 },
  },
  distant: {
    title: (n) => `${n} Does Not Get Up`,
    text: `{They see you coming and stay where they are|There is no warmth in it|You were not close and death has not fixed that}.
      {They ask what you want|You do not have an answer|It is exactly as awkward as it was alive}.`,
    stay: `{You sit down anyway|It does not get easier|You stay because there is nowhere else to be and eventually they talk}.
      {It is not friendship|It is something|Better than the queue}.`,
    gain: { happiness: 6 },
  },
  rival: {
    title: (n) => `${n} Has Been Waiting For This`,
    text: `{They are already on their feet|They have been here longer than you and they have been busy|
      They start grinning about forty metres out}.
      {"Nobody can die here"|They have been waiting to say this|There is no reason not to, now}.`,
    stay: `{You do not talk|You go at it for what might be a year|Neither of you can be finished off, which is the point}.
      {It is the best fight either of you ever had|Somebody complains about the noise|You are almost friends by the end of it}.`,
    gain: { happiness: 20, stats: { technique: 4, durability: 3 } },
  },
  killed: {
    title: (n) => `${n}, Who You Killed`,
    text: `{You knew this was coming|They have had a long time to think about it|They are not surprised to see you}.
      {They do not attack|That is somehow worse|They just look at you}.
      {There is a long stretch where neither of you says anything|Nobody here is going to intervene|
       Whatever you say now, you have to mean it}.`,
    stay: `{You say it|It is not enough and you say it anyway|They listen to the whole thing}.
      {They do not forgive you|They say they will think about it|Something between you moves, slightly}.`,
    gain: { happiness: -6, karma: 12 },
  },
};

/**
 * Somebody you killed, or somebody who died as an enemy, and what they have
 * done with eternity. The dead have nothing but time, and some of them use it.
 */
function grownEnemy(state, rng, year) {
  const dead = Object.values(state.npcs).filter((n) => !n.alive
    && ((n.tension || 0) > 45 || /you killed/i.test(n.causeOfDeath || '')));
  if (!dead.length) return null;
  const npc = rng.pick(dead);
  const years = Math.max(1, year - (npc.deadSince || year));
  // They have trained for as long as they have been dead.
  const grown = Math.round((npc.power || 100) * Math.pow(1.14, Math.min(60, years)));
  return { npc, years, grown };
}

registerEvents([
  // ------------------------------------------------------ people you loved
  {
    id: 'other_world_reunion', noFatigue: true, tags: ['afterlife', 'social', 'loss'], weight: 46,
    requiresAfterlife: true,
    when: (ctx) => Object.values(ctx.state.npcs).some((n) => !n.alive),
    slots: (ctx) => {
      const dead = Object.values(ctx.state.npcs).filter((n) => !n.alive);
      if (!dead.length) return null;
      // The ones you were closest to, or angriest at, find you first.
      const npc = ctx.rng.weighted(dead, (n) => 1 + (n.closeness || 0) / 12 + (n.tension || 0) / 25
        + (/you killed/i.test(n.causeOfDeath || '') ? 6 : 0));
      const tone = reunionTone(npc);
      return {
        ...npcSlot(npc),
        tone,
        gone: Math.max(1, ctx.year - (npc.deadSince || ctx.year)),
        how: npc.causeOfDeath || 'nobody says how',
      };
    },
    title: (ctx, s) => REUNION[s.tone].title(s.npcName),
    text: (ctx, s) => REUNION[s.tone].text,
    choices: (ctx, s) => {
      const spec = REUNION[s.tone];
      const list = [];
      list.push({
        id: 'stay', label: s.tone === 'killed' ? 'Say what you should have said' : s.tone === 'rival' ? 'Give them the fight' : 'Stay with them',
        effect: (c2, sl) => {
          const npc = findNpc(c2.state, sl.npcId);
          if (npc) {
            relate(c2, npc, { closeness: sl.tone === 'killed' ? 18 : 24, trust: 15, tension: sl.tone === 'rival' ? -25 : -10 });
            npc.reunited = true;
          }
          fact(c2, `Found ${sl.npcName} again in the Other World.`,
            { type: 'afterlife', weight: 7, subject: sl.npcId, tags: ['death', 'reunion'] });
          return { text: spec.stay, changes: apply(c2, spec.gain) };
        },
      });
      list.push({
        id: 'train', label: 'Train with them', hint: 'Nobody here can be permanently hurt.',
        effect: (c2, sl) => {
          const npc = findNpc(c2.state, sl.npcId);
          if (npc) relate(c2, npc, { closeness: 12, respect: 10 });
          const t = trainYear(c2, { intensity: 1.4, placeMult: 2.0, mentorMult: 1.2 });
          return { text: `{Nobody here can be hurt permanently, which changes how you both fight|`
            + `They are better than they were alive|You go at it for what might be years}. ${powerLine(t.gained)}`,
          changes: apply(c2, { happiness: 12, stats: { technique: 3 } }) };
        },
      });
      if (s.tone !== 'killed') {
        list.push({
          id: 'ask', label: 'Ask them what it was like at the end',
          effect: (c2, sl) => {
            const npc = findNpc(c2.state, sl.npcId);
            if (npc) { relate(c2, npc, { trust: 20, closeness: 10 }); npc.knowledge = 4; }
            return { text: `{They tell you|It takes a while and they do not spare you|`
              + `You wanted to know and now you know}. {[how]|It was quick, or it was not|`
              + `You will carry this and it will not help}.`,
            changes: apply(c2, { happiness: -8, stats: { intellect: 2 } }), view: { how: sl.how } };
          },
        });
      } else {
        list.push({
          id: 'nothing', label: 'Say nothing and walk on', danger: true,
          effect: (c2, sl) => {
            const npc = findNpc(c2.state, sl.npcId);
            if (npc) relate(c2, npc, { tension: 25 });
            return { text: `{You walk past|There is nothing to say that would help|You do not look back}. `
              + `{They watch you the whole way|You will see them again|This is a small place and eternity is long}.`,
            changes: apply(c2, { happiness: -12, karma: -6 }) };
          },
        });
      }
      return list;
    },
  },

  // ------------------------------------- the ones you killed have been busy
  {
    id: 'hell_grown_strong', noFatigue: true, tags: ['afterlife', 'threat', 'combat'], weight: 34,
    requiresAfterlife: true,
    when: (ctx) => !!grownEnemy(ctx.state, ctx.rng, ctx.year),
    slots: (ctx) => {
      const found = grownEnemy(ctx.state, ctx.rng, ctx.year);
      if (!found) return null;
      const { npc, years, grown } = found;
      // What eternity bought them.
      const ladder = ladderFor(npc.raceId || 'other');
      const form = ladder.filter((f) => f.req && f.req.power && f.req.power <= grown).pop();
      return {
        ...npcSlot(npc),
        years,
        grown,
        tier: powerTier(grown),
        formName: form ? form.name : null,
        gap: grown > combatPower(ctx.character) * 1.4 ? 'They are stronger than you now.'
          : grown > combatPower(ctx.character) * 0.7 ? 'It would be close.'
            : 'You are still the stronger one.',
      };
    },
    title: (ctx, s) => `${s.npcName} Has Had ${s.years} Years With Nothing To Do`,
    text: `{You feel it before you see it|The ki is wrong for this place|Somebody in the crowd is putting out more than a dead person should}.
      [npcName]. {[years] years down here|Dead the whole time|Nothing to eat, nothing to sleep, nothing to do but train}.
      [tier], {and grinning|and unhurried|and very pleased you came}.
      {They have found something|There is a colour to them that was not there before|Whatever they worked out, they worked it out alone}.
      [gap]`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Settle it', danger: true, effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) npc.power = sl.grown;
        return offerBattle(c2, {
          name: sl.npcName, power: sl.grown, npcId: sl.npcId,
          raceId: npc ? npc.raceId : 'other',
          forms: sl.formName && npc ? (npc.transformations || []) : [],
        }, {
          reason: 'rival', stakes: 'serious',
          intro: `${sl.npcName}${sl.formName ? `, and whatever ${sl.formName} is doing to them,` : ''} has been waiting for this for ${sl.years} years.`,
        });
      } },
      { id: 'learn', label: 'Ask how they did it', hint: 'They have no reason to tell you, and every reason to boast.', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) { npc.power = sl.grown; relate(c2, npc, { respect: 15, tension: -10 }); npc.knowledge = 3; }
        const t = trainYear(c2, { intensity: 1.6, placeMult: 2.4 });
        fact(c2, `Learned something from ${sl.npcName}, who spent ${sl.years} years dead and training.`,
          { type: 'training', weight: 6, subject: sl.npcId, tags: ['afterlife'] });
        return { text: `{They tell you|Vanity is the last thing to die and it does not die here|`
          + `They demonstrate, at length, because nobody else has asked}. `
          + `{Most of it is nonsense|A quarter of it is the most useful thing you have ever been told|`
          + `You take notes you cannot write down}. ${powerLine(t.gained)}`,
        changes: apply(c2, { stats: { technique: 4, kiControl: 3 } }) };
      } },
      { id: 'avoid', label: 'Go the other way', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) { npc.power = sl.grown; relate(c2, npc, { tension: 12 }); }
        return { text: `{You do not engage|There is a lot of Hell and you use most of it|You are not ready and you know it}. `
          + `{They let you go|They shout something after you|It will keep}.`,
        changes: apply(c2, { happiness: -6 }) };
      } },
    ],
  },

  // ---------------------------------------------------- the economy of Hell
  {
    id: 'hell_society', tags: ['afterlife', 'world'], weight: 28,
    requiresAfterlife: true,
    when: (ctx) => ['hell', 'check_in', 'snake_way'].includes(ctx.character.placeId) || ctx.character.karma < 0,
    slots: (ctx) => ({
      scene: ctx.rng.pick([
        'a queue for a machine that dispenses nothing',
        'a fighting pit run by three ogres and a spreadsheet',
        'a bar where nobody gets drunk and everybody stays',
        'a market trading favours, because there is no money down here',
        'a choir of the damned, which is exactly as bad as it sounds',
        'a library somebody has been assembling out of memory for four hundred years',
        'a field of spikes that somebody has made into a garden',
      ]),
      who: generateFullName(ctx.rng, ctx.rng.pick(['other', 'earthling', 'frostdemon', 'saiyan'])),
    }),
    title: 'Hell Is Not Empty',
    text: `{Nobody warns you about the boredom|The screaming stops being the worst part quite quickly|
      It is the permanence that gets people}.
      There is [scene]. {[who] runs it|[who] has been here longest and everybody defers to them|
      [who] explains the rules, and there are rules}.`,
    choices: (ctx, s) => [
      { id: 'join', label: 'Make yourself useful', effect: (c2, sl) => {
        const npc = stranger(c2, { relation: 'acquaintance', minAge: 30, maxAge: 90, metHow: 'in Hell' });
        if (npc) { npc.alive = false; relate(c2, npc, { closeness: 20, respect: 15 }); }
        fact(c2, `Found a place in Hell, of a sort.`, { type: 'afterlife', weight: 4, tags: ['death'] });
        return { text: `{You take a job|Nobody calls it a job|It gives the days edges, which is what everybody down here is actually short of}. `
          + `{You are good at it|It is the first thing you have been asked to do in years|People start knowing your name again}.`,
        changes: apply(c2, { happiness: 14, stats: { charisma: 3 } }) };
      } },
      { id: 'fight_pit', label: 'Fight in the pit', effect: (c2, sl) => {
        const t = trainYear(c2, { intensity: 1.8, placeMult: 2.2 });
        return { text: `{You go in|You cannot die and neither can they, so it goes on until somebody gets bored|`
          + `The ogres keep a ranking and you climb it}. {Nobody down here holds back|`
          + `You learn things you could never have learned alive|It is the only honest thing in Hell}. ${powerLine(t.gained)}`,
        changes: apply(c2, { stats: { durability: 4, strength: 3 }, happiness: 8 }) };
      } },
      { id: 'walk', label: 'Keep walking', effect: (c2) => ({
        text: `{You do not stop|There is nowhere to get to and you go there anyway|`
          + `Whatever they are doing, they can do it without you}. #dread#`,
        changes: apply(c2, { happiness: -6, stats: { discipline: 3 } }),
      }) },
    ],
  },

  // ------------------------------------------------------ a canon dead face
  {
    id: 'other_world_canon', noFatigue: true, tags: ['afterlife', 'canon', 'social'], weight: 30,
    requiresAfterlife: true,
    // The dead you actually run into down here are from your own universe -
    // Bardock and Gine dying with the rest of Universe 7's Saiyans has
    // nothing to do with a Universe 6 character's afterlife.
    when: (ctx) => CANON.some((ch) => ch.years[1] !== null && ctx.year > ch.years[1]
      && canonUniverse(ch) === (ctx.character.universe || 7)),
    slots: (ctx) => {
      const myUniverse = ctx.character.universe || 7;
      const gone = CANON.filter((ch) => ch.years[1] !== null && ctx.year > ch.years[1]
        && canonUniverse(ch) === myUniverse
        && !ch.tags.some((t) => ['omniking', 'destroyer', 'angel', 'dragon', 'wish'].includes(t)));
      if (!gone.length) return null;
      const ch = ctx.rng.pick(gone);
      const years = ctx.year - ch.years[1];
      const dead = Math.round(canonPower(ch, ch.years[1]) * Math.pow(1.09, Math.min(50, years)));
      // Frieza spent his death training and came back gold. Anyone with long
      // enough down here and a ladder to climb can do the same.
      const ladder = ladderFor(ch.race || 'other');
      const earned = ladder.filter((f) => f.req && f.req.power && f.req.power <= dead
        && !(f.req.mentors || []).length && !f.req.custom).pop();
      const form = years > 8 && earned ? earned : null;
      return {
        canonId: ch.id,
        npcName: ch.name,
        years,
        theirPower: form ? Math.round(dead * Math.min(4, form.mult)) : dead,
        formName: form ? form.name : null,
        formId: form ? form.id : null,
        tier: powerTier(form ? dead * Math.min(4, form.mult) : dead),
        villain: ch.tags.some((t) => ['villain', 'threat', 'emperor'].includes(t)),
        quirk: ch.quirk || '',
      };
    },
    title: (ctx, s) => `${s.npcName}, ${s.years} Years Dead`,
    text: (ctx, s) => (s.villain
      ? `{You know the face before you know the ki|Everybody down here knows who that is|The crowd is giving them room}.
         [npcName]. {[years] years in Hell with nothing but time|Still furious|Still, somehow, immaculate}.
         [tier] now, which is more than they managed alive.
         ${s.formName ? `{They have found something down here and it has a colour to it|There is a form on them that did not exist when they were alive|They call it [formName], and they want you to ask}.` : ''}
         {[quirk]|They have not improved as a person|Death did nothing for the personality}.`
      : `{They are easy to find|Everybody knows where they train|You are pointed at a hill}.
         [npcName], [years] years dead and still at it. [tier].
         {[quirk]|They ask who you are and then they ask if you can fight|They are pleased to have company}.`),
    choices: (ctx, s) => {
      const list = [];
      list.push({
        id: 'spar', label: 'Ask them for a fight', effect: (c2, sl) => {
          const npc = meetCanon(c2, sl.canonId, sl.villain ? 'rival' : 'acquaintance');
          if (npc) { npc.alive = false; npc.power = sl.theirPower; }
          if (npc && sl.formId) npc.transformations = [sl.formId];
          return offerBattle(c2, {
            name: sl.npcName, power: sl.theirPower, canonId: sl.canonId,
            npcId: npc ? npc.id : null,
            forms: sl.formId ? [sl.formId] : [],
          }, {
            reason: sl.villain ? 'rival' : 'spar', stakes: 'spar',
            intro: `Nobody here can die twice. ${sl.npcName} has been counting on that for ${sl.years} years.`
              + (sl.formName ? ` And they did not have ${sl.formName} when you last saw them.` : ''),
          });
        },
      });
      list.push({
        id: 'train', label: 'Train under them', effect: (c2, sl) => {
          const npc = meetCanon(c2, sl.canonId, 'mentor');
          if (npc) { npc.alive = false; npc.power = sl.theirPower; relate(c2, npc, { respect: 20, closeness: 12 }); }
          const t = trainYear(c2, { intensity: 1.7, placeMult: 2.4, mentorMult: 1.5 });
          fact(c2, `Trained under ${sl.npcName} in the Other World.`,
            { type: 'training', weight: 7, tags: ['afterlife', 'canon'] });
          return { text: `{They agree immediately|It takes some persuading and then they will not stop|`
            + `Being dead has made them generous with their time, of which there is a great deal}. `
            + `{You are worked harder than you have ever been worked|Nothing here can injure you, so nothing is off limits|`
            + `It goes on for what you eventually realise is years}. ${powerLine(t.gained)}`,
          changes: apply(c2, { stats: { technique: 5, kiControl: 4, discipline: 3 }, happiness: 12 }) };
        },
      });
      list.push({
        id: 'talk', label: 'Just talk to them', effect: (c2, sl) => {
          const npc = meetCanon(c2, sl.canonId, 'acquaintance');
          if (npc) { npc.alive = false; relate(c2, npc, { closeness: 16, trust: 10 }); npc.knowledge = 3; }
          return { text: `{They talk for a very long time|Nobody has asked them anything in decades|`
            + `Most of it is about people who are still alive}. `
            + `{You learn things about the living that nobody living knows|`
            + `They ask you to pass something on and you will not be able to|You like them, which is inconvenient}.`,
          changes: apply(c2, { happiness: 14, stats: { intellect: 3, charisma: 2 } }) };
        },
      });
      return list;
    },
  },

  // -------------------------------------------------- what the dead can do
  {
    id: 'other_world_errand', tags: ['afterlife', 'quest'], weight: 26,
    requiresAfterlife: true,
    slots: (ctx) => ({
      task: ctx.rng.pick([
        'a message for somebody still alive, which is against every rule here',
        'a body that needs recovering from a part of Hell nobody goes into',
        'an ogre who has lost the ledger for four thousand souls',
        'a soul in the wrong queue who has been in it for a century',
        'a section of Snake Way that has come away from its moorings',
        'a fighter who will not stop challenging the check-in desk',
      ]),
      who: ctx.rng.pick(['King Yemma, personally', 'one of the ogres', 'a Kai with a clipboard',
        'somebody who says they know you', 'the desk, via a note']),
    }),
    title: 'There Is Work, Even Here',
    text: `{Being dead is mostly queueing|The afterlife has an administration and the administration has problems|
      Somebody finds you because you are the only one not doing anything}.
      [who:cap] {needs something dealt with|has a problem|asks for a favour}: [task].`,
    choices: (ctx, s) => [
      { id: 'do', label: 'Do it', effect: (c2, sl) => {
        const good = c2.rng.chance(0.62);
        fact(c2, `Did the Other World a favour: ${sl.task}.`, { type: 'afterlife', weight: 5, tags: ['death'] });
        if (good) {
          c2.character.flags.otherworld_favour = true;
          return { text: `{It takes longer than anybody said|You are the only one who could have|It is done}. `
            + `{Somebody owes you now, and up here that is worth something|`
            + `Your name goes in a different ledger|Yemma nods at you, once, which is apparently enormous}.`,
          changes: apply(c2, { karma: 12, happiness: 14, fame: 4 }) };
        }
        return { text: `{It goes wrong|You make it worse|Nobody blames you, which is worse than being blamed}. `
          + `{The paperwork will take a century|Somebody is still in the wrong queue|You tried}.`,
        changes: apply(c2, { happiness: -8, karma: 4 }) };
      } },
      { id: 'refuse', label: 'You are dead. Let somebody else.', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.5, placeMult: 2.0 });
        return { text: `{You are not an employee|There is training to do and forever to do it in|You decline}. ${powerLine(t.gained)}`,
        changes: apply(c2, { karma: -4 }) };
      } },
    ],
  },
]);
