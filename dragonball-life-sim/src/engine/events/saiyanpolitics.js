// The survivors, and what they want from you.
//
// A few thousand Saiyans were off-world when Planet Vegeta went. What is left
// of them is not a people, it is a lobby: a handful of hardliners trying to
// rebuild the institutions of a dead planet on whatever rock they can hold.
// If you take a world, or somebody else takes one, they turn up.
//
// The pressure they apply is political and institutional, because that is what
// this faction is: they advise, then they offer, then they pay, then they
// sanction, then they send somebody. It escalates the way an occupying
// bureaucracy escalates, and every stage can be refused, argued with, or met
// with violence. Nothing here is a sexual scene and nothing is written as one;
// what is on the table is a contract, a rank and a threat.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, relate, thread, trainYear, powerLine, stranger, findNpc, offerBattle, moveTo } from './helpers.js';
import { combatPower, powerTier } from '../stats.js';
import { generateFullName } from '../../data/names.js';
import { getPlace, PLACES } from '../../data/places.js';
import { PLANETS } from '../../data/planets.js';
import { numberish, zeni } from '../text.js';
import { clamp } from '../rng.js';

/** Is there a Saiyan homeworld project, and are you inside it? */
function colony(state) {
  return state.world.saiyanColony || null;
}

function isSaiyan(ctx) {
  return ctx.race.id === 'saiyan' || ctx.race.id === 'halfsaiyan';
}

/** How badly the Council wants an heir out of you specifically. */
function heirPressure(ctx) {
  const c = ctx.character;
  const col = colony(ctx.state);
  if (!col || !isSaiyan(ctx)) return 0;
  const bio = ctx.age;
  if (bio < 18 || bio > 55) return 0;
  const kids = Object.values(ctx.state.npcs).filter((n) => n.relation === 'child').length;
  if (kids >= 2) return 0;
  // They want strength on the register, and they want it from people who have
  // not already contributed.
  const strength = Math.log10(Math.max(10, combatPower(c))) / 12;
  return clamp(0.25 + strength + (c.fame / 200) - kids * 0.4 + (col.stage || 0) * 0.12, 0, 1);
}

const COUNCIL_NAMES = ['the Restoration Council', 'the Blood Register', 'the Sadala Compact',
  'the Second Vegeta Assembly', 'the Elite Remnant'];

registerEvents([
  // ------------------------------------------------ somebody founds a homeworld
  {
    id: 'saiyan_colony_founded', noFatigue: true, tags: ['saiyan', 'world', 'politics'], weight: 60,
    minBioAge: 14,
    when: (ctx) => isSaiyan(ctx) && !colony(ctx.state) && ctx.year > 738
      && (ctx.flag('homeworld_destroyed') || ctx.character.fame > 20),
    slots: (ctx) => {
      const held = Object.entries(ctx.state.world.planets || {})
        .filter(([, r]) => r && (r.act === 'rule' || r.act === 'purge'))
        .map(([id]) => id);
      const mine = held.length > 0;
      const planet = mine ? PLANETS.find((p) => p.id === held[0]) : null;
      const other = generateFullName(ctx.rng, 'saiyan');
      return {
        mine,
        planetName: planet ? planet.name : ctx.rng.pick(['a scrub world with breathable air',
          'a mining colony nobody claimed', 'an old Frieza Force garrison', 'a world with one continent and no people']),
        planetId: planet ? planet.id : null,
        founder: mine ? ctx.character.name : other,
        council: ctx.rng.pick(COUNCIL_NAMES),
      };
    },
    title: (ctx, s) => (s.mine ? 'They Want To Call It Vegeta' : 'Somebody Has Taken A World'),
    text: (ctx, s) => (s.mine
      ? `{They come to you|A delegation lands without asking|Six of them, and one of them is old enough to remember the planet}.
         You hold [planetName]. {They want to put Saiyans on it|They want it registered|They have brought paperwork, which is somehow the worst part}.
         [council:cap], they call themselves. {They have a flag already|They have a register with your name in it|They have plans that assume you will agree}.`
      : `{Word travels|A broadcast in a language you have not heard in years|Somebody sends for you}.
         [founder] has taken [planetName] {and is calling it a homeworld|and is inviting every Saiyan alive|and means it}.
         [council:cap] {is being reconstituted|has issued a register|wants every survivor on it}.`),
    choices: (ctx, s) => {
      const list = [];
      list.push({
        id: 'join', label: s.mine ? 'Let them build it' : 'Go, and put your name on the register',
        hint: 'A people again, with everything that comes with that.',
        effect: (c2, sl) => {
          c2.state.world.saiyanColony = {
            planetId: sl.planetId, name: sl.planetName, council: sl.council,
            founder: sl.founder, yours: !!sl.mine, member: true, stage: 0, standing: sl.mine ? 60 : 25,
          };
          c2.character.flags.saiyan_register = true;
          fact(c2, `${sl.mine ? 'Let the Council build a homeworld on their own world' : 'Signed the Saiyan register on ' + sl.planetName}.`,
            { type: 'politics', weight: 8, tags: ['saiyan', 'origin'] });
          for (let i = 0; i < 2; i++) {
            const n = stranger(c2, { raceId: 'saiyan', relation: 'acquaintance', minAge: 20, maxAge: 60 });
            if (n) relate(c2, n, { respect: 20, closeness: 10 });
          }
          return { text: `{It is the first time in years anybody has spoken to you in your own language and meant it|`
            + `There are hundreds of them and it is not nearly enough|They read the register out loud, which takes eleven minutes}. `
            + `{You are on it|Your name is somewhere in the middle|It is a strange thing to be counted}.`,
          changes: apply(c2, { happiness: 16, fame: 8 }) };
        },
      });
      list.push({
        id: 'refuse', label: 'Want no part of it',
        hint: 'They will keep asking.',
        effect: (c2, sl) => {
          c2.state.world.saiyanColony = {
            planetId: sl.planetId, name: sl.planetName, council: sl.council,
            founder: sl.founder, yours: !!sl.mine, member: false, stage: 0, standing: -10,
          };
          fact(c2, `Refused ${sl.council}.`, { type: 'politics', weight: 6, tags: ['saiyan'] });
          return { text: `{You tell them no|"There is no Planet Vegeta"|You do not sign anything}. `
            + `{They take it better than you expected|The old one looks at you for a long time|They leave the paperwork anyway}. `
            + `{They will be back|This is not the end of it|Nobody says the word 'traitor' out loud}.`,
          changes: apply(c2, { happiness: -4 }) };
        },
      });
      if (s.mine) {
        list.push({
          id: 'own_terms', label: 'It is your world. Your rules.', hint: 'No register, no creche, no Council.',
          effect: (c2, sl) => {
            c2.state.world.saiyanColony = {
              planetId: sl.planetId, name: sl.planetName, council: sl.council,
              founder: c2.character.name, yours: true, member: true, stage: 0, standing: 80, reformed: true,
            };
            c2.character.flags.saiyan_reformer = true;
            fact(c2, 'Took in the survivors and refused to rebuild the old system with them.',
              { type: 'politics', weight: 9, tags: ['saiyan', 'legacy'] });
            return { text: `{You take the survivors and burn the register|"No creches. No grading. No breeding programme."|`
              + `You let them land and you tell them what is not happening}. `
              + `{Half of them stay|The old ones are furious|Somebody calls you worse than Frieza and you let them}.`,
            changes: apply(c2, { happiness: 12, fame: 14, karma: 12 }) };
          },
        });
      }
      return list;
    },
  },

  // ------------------------------------------------------ the escalating ask
  {
    id: 'saiyan_heir_pressure', noFatigue: true, tags: ['saiyan', 'politics', 'social'], weight: 40,
    minBioAge: 18,
    when: (ctx) => heirPressure(ctx) > 0.35 && colony(ctx.state)
      && !ctx.character.flags.saiyan_reformer && !ctx.character.flags.heir_refused_finally,
    slots: (ctx) => {
      const col = colony(ctx.state);
      const stage = col.stage || 0;
      return {
        council: col.council,
        stage,
        colonyName: col.name,
        officer: col.officerName || (col.officerName = generateFullName(ctx.rng, 'saiyan')),
        purse: 200000 * (stage + 1) * 4,
      };
    },
    title: (ctx, s) => ([
      'The Council Would Like A Word',
      'They Have Made You An Offer',
      'They Are Not Asking Any More',
      'A Summons',
    ][Math.min(3, s.stage)]),
    text: (ctx, s) => ([
      `{[officer] comes to find you|It is put politely|They bring tea, which nobody wants}.
       [council:cap] {has looked at the register|has been counting|has done the arithmetic}.
       {There are not enough of us|Nine hundred and forty, and falling|The next generation is forty-one children}.
       {You are strong and you have had no children|They mention this the way a doctor mentions a shadow on a scan|Nobody says the word 'duty' but it is in the room}.`,
      `{This time there is a number attached|[officer] brings a contract|They have stopped appealing to your better nature}.
       {A seat on the Council|Land on [colonyName]|[purse] Zeni and a rank} for a Saiyan of your line, registered.
       {They are not subtle|It is a good offer, which is the insulting part|They think you have a price}.`,
      `{The tone has changed|[officer] does not sit down|There are two of them outside}.
       [council:cap] has {frozen your standing|struck your name from the register|declared you outside the settlement}.
       {No landing rights|No trade|Nobody on [colonyName] will speak to you} until {you comply|the matter is resolved|you see sense}.
       {They have selected somebody|A name has been put beside yours on a list|It has already been decided, as far as they are concerned}.`,
      `{They have stopped writing letters|[officer] is at the door with six of them|The summons is not a request}.
       {Present yourself|You will be brought|Come, or be brought}. {The pairing has been entered in the register|It is done on paper already|Somebody has signed on your behalf}.`,
    ][Math.min(3, s.stage)]),
    choices: (ctx, s) => {
      const col = colony(ctx.state);
      const list = [];

      list.push({
        id: 'comply', label: s.stage >= 2 ? 'Go with them' : 'Agree to it',
        hint: 'On your own terms if you move first, on theirs if you wait.',
        effect: (c2, sl) => {
          const col2 = colony(c2.state);
          col2.stage = 0;
          col2.standing = clamp((col2.standing || 0) + 30, -100, 100);
          const partner = stranger(c2, {
            raceId: 'saiyan', relation: 'lover', minAge: Math.max(18, c2.character.age - 10),
            maxAge: c2.character.age + 10, closeness: 30, respect: 45, metHow: 'assigned to you',
          });
          if (partner) {
            partner.romance = 20;
            partner.trust = 25;
            partner.assigned = true;
            fact(c2, `${partner.name} was matched to them by ${sl.council}.`,
              { type: 'politics', weight: 8, subject: partner.id, tags: ['saiyan', 'family'] });
          }
          c2.character.flags.saiyan_matched = true;
          return { text: `{You go|You sign it|You stop arguing, which is not the same as agreeing}. `
            + `${partner ? `${partner.name}. {They did not choose this either|They are as unimpressed as you are|`
              + `The first thing they say to you is an apology}. {Whatever this becomes, it starts here and it starts badly|`
              + `You are two strangers with a file between you|You will either make something of it or you will not}.` : ''} `
            + `{The Council records it and loses interest in you|Your standing is restored the same afternoon|Nobody thanks you}.`,
          changes: apply(c2, { happiness: -8, fame: 4 }) };
        },
      });

      if (s.stage === 1) {
        list.push({
          id: 'take_money', label: 'Take the money, promise nothing',
          hint: 'They will notice eventually.',
          effect: (c2, sl) => {
            const col2 = colony(c2.state);
            col2.stage = 2;
            col2.standing = clamp((col2.standing || 0) - 15, -100, 100);
            return { text: `{You take it|The Zeni clears the same day|You sign the part about the land and not the part about the register}. `
              + `{They will work it out|It buys you about two years|You have made an enemy of a filing cabinet}.`,
            changes: apply(c2, { zeni: sl.purse, happiness: 6, karma: -6 }) };
          },
        });
      }

      list.push({
        id: 'refuse', label: 'Refuse',
        hint: s.stage >= 2 ? 'They have already stopped asking.' : 'They will escalate.',
        effect: (c2, sl) => {
          const col2 = colony(c2.state);
          col2.stage = (col2.stage || 0) + 1;
          col2.standing = clamp((col2.standing || 0) - 18, -100, 100);
          thread(c2, 'saiyan_pressure', null, { title: `${sl.council} and the register`, heat: 60 + col2.stage * 10, maxStage: 4 });
          fact(c2, `Refused ${sl.council} for the ${['first', 'second', 'third', 'fourth'][Math.min(3, col2.stage - 1)]} time.`,
            { type: 'politics', weight: 5, tags: ['saiyan'] });
          return { text: `{"No"|You do not give them a reason|You give them a reason and they write it down without reading it}. `
            + `{[officer] does not argue|They were expecting this|Somebody makes a note}. `
            + `{It will be worse next time|They have somewhere else to escalate to|This is a machine and you have just moved a lever}.`,
          changes: apply(c2, { happiness: -6, stats: { discipline: 2 } }) };
        },
      });

      if (s.stage >= 2) {
        list.push({
          id: 'fight', label: 'Throw them off your land', danger: true,
          hint: 'They came with six. You can be the reason they stop coming.',
          effect: (c2, sl) => {
            const col2 = colony(c2.state);
            col2.stage = 3;
            col2.standing = clamp((col2.standing || 0) - 30, -100, 100);
            return offerBattle(c2, {
              name: sl.officer, power: Math.max(50, combatPower(c2.character) * c2.rng.float(0.5, 1.3)),
              raceId: 'saiyan',
            }, {
              reason: 'politics', stakes: 'serious',
              intro: `${sl.officer} came here with a register and six people. Only one of those things is going to matter.`,
            });
          },
        });
        list.push({
          id: 'leave', label: 'Leave. Let them have their planet.',
          hint: 'Off the register, off the world, done with it.',
          effect: (c2, sl) => {
            const col2 = colony(c2.state);
            col2.member = false;
            col2.stage = 0;
            col2.standing = -60;
            c2.character.flags.heir_refused_finally = true;
            c2.character.flags.saiyan_exile = true;
            const away = PLACES.filter((p) => p.planet === 'earth' && p.tags.includes('civilised'));
            if (away.length) moveTo(c2, c2.rng.pick(away).id);
            fact(c2, `Left ${sl.colonyName} rather than be entered in the register.`,
              { type: 'politics', weight: 9, tags: ['saiyan', 'exile'] });
            return { text: `{You go|You do not tell anyone you are going|There is nothing on that world you cannot replace}. `
              + `{They strike you off|You are the last of your line as far as the register is concerned|`
              + `Somebody who was almost a friend does not say goodbye}. {It is quieter where you land|You are on your own again|`
              + `You have been on your own before}.`,
            changes: apply(c2, { happiness: -12, fame: -6, stats: { discipline: 4 } }) };
          },
        });
      }
      return list;
    },
  },

  // ---------------------------------------------------- creches, for your kids
  {
    id: 'saiyan_creche_demand', tags: ['saiyan', 'politics', 'family'], weight: 30,
    minBioAge: 20,
    when: (ctx) => colony(ctx.state) && isSaiyan(ctx) && !ctx.character.flags.saiyan_reformer
      && Object.values(ctx.state.npcs).some((n) => n.alive && n.relation === 'child' && n.age >= 2 && n.age <= 8),
    slots: (ctx) => {
      const kids = Object.values(ctx.state.npcs).filter((n) => n.alive && n.relation === 'child' && n.age >= 2 && n.age <= 8);
      const kid = ctx.rng.pick(kids);
      const col = colony(ctx.state);
      return { ...npcSlot(kid), kidAge: kid.age, council: col.council, colonyName: col.name };
    },
    title: (ctx, s) => `They Have Come For ${s.npcName}`,
    text: `{The letter arrives before they do|It is framed as an opportunity|They have a place already allocated}.
      [council:cap] {is reopening the creches|has restored the old grading|has a training establishment on [colonyName]}.
      [npcName] is [kidAge]. {That is the age|On the old planet it was three|They have a transport waiting}.
      {Graded at birth, shipped out at three, and it made the strongest army in the galaxy|
       It is what was done to you|It is what was done to everybody, and look what happened to them}.`,
    choices: (ctx, s) => [
      { id: 'send', label: 'Let them go', hint: 'It made warriors. It also made Frieza\'s army.', effect: (c2, sl) => {
        const kid = findNpc(c2.state, sl.npcId);
        if (kid) {
          kid.power = Math.round(kid.power * 4.5);
          kid.creche = true;
          relate(c2, kid, { closeness: -30, respect: 15, trust: -20 });
        }
        const col2 = colony(c2.state);
        col2.standing = clamp((col2.standing || 0) + 20, -100, 100);
        fact(c2, `Sent ${sl.npcName} to the creche on ${sl.colonyName}.`,
          { type: 'family', weight: 8, subject: sl.npcId, tags: ['saiyan', 'child'] });
        return { text: `{The transport takes about four minutes|They do not cry, which is worse|You are told visiting is discouraged}. `
          + `{You will see them at eight and they will be a stranger|They will be very strong|`
          + `Somebody hands you a receipt, and that is the part you think about later}.`,
        changes: apply(c2, { happiness: -20, fame: 6, karma: -8 }) };
      } },
      { id: 'refuse', label: 'They are not going', danger: true, effect: (c2, sl) => {
        const kid = findNpc(c2.state, sl.npcId);
        if (kid) relate(c2, kid, { closeness: 15, trust: 20 });
        const col2 = colony(c2.state);
        col2.standing = clamp((col2.standing || 0) - 25, -100, 100);
        col2.stage = Math.min(3, (col2.stage || 0) + 1);
        fact(c2, `Refused to give ${sl.npcName} to the creche.`,
          { type: 'family', weight: 8, subject: sl.npcId, tags: ['saiyan', 'child'] });
        return { text: `{You put yourself in the doorway|"No"|You do not raise your voice and you do not move}. `
          + `{They go|They do not go far|Somebody writes something down}. `
          + `{[npcName] does not understand what just happened|You will explain it in about fifteen years|`
          + `Your standing on [colonyName] is not what it was this morning}.`,
        changes: apply(c2, { happiness: 8, karma: 10 }) };
      } },
      { id: 'teach', label: 'Train them yourself', hint: 'The Council thinks that is sentiment.', effect: (c2, sl) => {
        const kid = findNpc(c2.state, sl.npcId);
        if (kid) {
          kid.power = Math.round(kid.power * 2.6);
          relate(c2, kid, { closeness: 25, respect: 25, trust: 25 });
        }
        const col2 = colony(c2.state);
        col2.standing = clamp((col2.standing || 0) - 10, -100, 100);
        fact(c2, `Trained ${sl.npcName} rather than hand them over.`,
          { type: 'family', weight: 7, subject: sl.npcId, tags: ['saiyan', 'child', 'legacy'] });
        return { text: `{You tell the Council you will do it|They point out that you are not a training establishment|You point out that you are}. `
          + `{It takes years|They are slower than the creche children and they are yours|`
          + `You are worse at teaching than the institution and better at everything else}.`,
        changes: apply(c2, { happiness: 14, stats: { charisma: 3, discipline: 3 } }) };
      } },
    ],
  },
]);
