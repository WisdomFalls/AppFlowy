// What you can do to and for the people in your life.
//
// The verb list is deliberately wide in both directions: you can teach
// somebody, heal them, marry them and raise children with them, or you can
// threaten them, rob them, read their mind against their will and kill them.
// Every verb costs part of the year and most of them change what they think of
// you permanently.

import { clamp } from './rng.js';
import { limitFor } from './economy.js';
import { render } from './text.js';
import { adjust, findNpc, currentYear, addNpc } from './state.js';
import { addFact } from './memory.js';
import { combatPower, weaponAttackBonus } from './stats.js';
import { bondScore, bondLabel, romanceLabel, learnAbout, relationLabel, makeChild,
  weddingLine, courtLine, birthLine, describeLineage } from './npc.js';
import { npcBag } from './inventory.js';

/** An NPC's power as it actually shows up in a fight - their base, plus
 * whatever a weapon they have out actually does for them. Nobody rolls a
 * bag until it matters, so this is where that first happens for a foe. */
function npcFightPower(rng, npc) {
  npcBag(rng, npc);
  return Math.round(npc.power * (1 + weaponAttackBonus(npc) / 260));
}
import { TECH_BY_ID } from '../data/techniques.js';
import { getRace } from '../data/races.js';
import { getPlace } from '../data/places.js';
import { numberish } from './text.js';
import { localMoney } from './events/helpers.js';

function note(state, text, opts = {}) {
  return addFact(state.memory, {
    type: opts.type || 'social', text, year: state.character.age,
    weight: opts.weight ?? 2, subject: opts.subject || null, tags: opts.tags || ['social'],
  });
}

const ROMANCE_MIN_AGE = 15;      // before this it is a childhood crush and nothing else
const CRUSH_MIN_AGE = 10;
const COMMIT_MIN_AGE = 16;
// A body has to be old enough to actually threaten, rob or fight somebody
// with intent - not just physically capable of it (a Saiyan toddler can hit
// hard), but old enough to be doing it on purpose.
const HOSTILE_MIN_AGE = 8;
const COMBAT_MIN_AGE = 6;

/** Blood and marriage. What you can do to a stranger is not what you can do
 * to your own family, whatever else is true about you. */
function isCloseKin(npc) {
  return ['parent', 'child', 'sibling', 'spouse'].includes(npc.relation);
}

function chargeSocial(npc, changes) {
  if (changes.closeness) npc.closeness = clamp(npc.closeness + changes.closeness, 0, 100);
  if (changes.respect) npc.respect = clamp(npc.respect + changes.respect, 0, 100);
  if (changes.tension) npc.tension = clamp(npc.tension + changes.tension, 0, 100);
  if (changes.romance) npc.romance = clamp((npc.romance || 0) + changes.romance, 0, 100);
  if (changes.trust) npc.trust = clamp((npc.trust ?? 30) + changes.trust, 0, 100);
  if (changes.knowledge) learnAbout(npc, changes.knowledge);
}

export const SOCIAL_ACTIONS = [
  // ------------------------------------------------------------- warm
  {
    id: 'say', name: 'Say something to them', tone: 'warm', slots: 1, maxPerYear: 3,
    desc: 'Your own words. They will read them the way they read everything.',
    available: (state, npc) => npc.alive,
    freeText: true,
    run: () => ({ text: 'What do you want to say?' }),
  },
  {
    id: 'talk', name: 'Talk', tone: 'warm', slots: 1, maxPerYear: 4,
    desc: 'Time and attention. It is most of what a bond actually is.',
    available: () => true,
    run: (state, rng, npc) => {
      const learned = rng.chance(0.35);
      chargeSocial(npc, { closeness: rng.int(6, 14), trust: 3, tension: -3, knowledge: learned ? 1 : 0 });
      adjust(state, { happiness: 5 });
      return {
        text: render(`{You talk for an afternoon|Neither of you says anything important|You sit with them a while}. `
          + (learned ? `{They tell you something they have not told anyone|Something comes out that surprises you both|You learn something about them}.` : `{It is uncomplicated|It helps|Nothing much is said}.`), {}, rng),
      };
    },
  },
  {
    id: 'ask_about', name: 'Ask about them', tone: 'warm', slots: 1, maxPerYear: 2,
    desc: 'Directly. People are usually surprised anyone asked.',
    available: (state, npc) => (npc.knowledge || 0) < 4,
    run: (state, rng, npc) => {
      const chance = clamp(0.25 + bondScore(npc) / 200 + state.character.stats.charisma / 300, 0.05, 0.92);
      if (rng.chance(chance)) {
        chargeSocial(npc, { knowledge: 1, trust: 6, closeness: 4 });
        return { text: render(`{They answer|It takes a while but they answer|They talk for two hours and you let them}. You know them better now.`, {}, rng) };
      }
      chargeSocial(npc, { tension: 4 });
      return { text: render(`{They change the subject|"Why do you want to know"|You get nothing}.`, {}, rng) };
    },
  },
  {
    id: 'gift', name: 'Give them something', tone: 'warm', slots: 0, maxPerYear: 2,
    desc: 'Money, gear, or something they mentioned once.',
    available: (state) => state.character.zeni > 5000,
    run: (state, rng, npc) => {
      const amount = Math.round(clamp(state.character.zeni * 0.08, 2000, 900000));
      adjust(state, { zeni: -amount });
      npc.zeni = (npc.zeni || 0) + amount;
      chargeSocial(npc, { closeness: rng.int(8, 16), trust: 5, respect: 2 });
      return { text: `${localMoney(state, amount)}. ${render(`{They do not want to take it|They take it without a word|They pretend it is nothing and keep it forever}.`, {}, rng)}` };
    },
  },
  {
    id: 'train_them', name: 'Train them', tone: 'warm', slots: 2, maxPerYear: 2,
    desc: 'Everything you know, handed over.',
    available: (state, npc) => combatPower(state.character) > npc.power * 0.8,
    run: (state, rng, npc) => {
      const before = npc.power;
      npc.power = Math.round(npc.power * rng.float(1.3, 2.1));
      chargeSocial(npc, { respect: 15, closeness: 10, trust: 8, knowledge: 1 });
      if (npc.relation === 'acquaintance' || npc.relation === 'friend') npc.relation = 'student';
      adjust(state, { stats: { charisma: 2, technique: 1 } });
      note(state, `Trained ${npc.name}.`, { subject: npc.id, tags: ['mentor'], weight: 3 });
      return { text: `${render(`{They are worse than you expected and then they are not|It takes a season|You are a harsher teacher than you meant to be}.`, {}, rng)} ${npc.name} goes from ${numberish(before)} to ${numberish(npc.power)}.` };
    },
  },
  {
    id: 'teach_technique', name: 'Teach a technique', tone: 'warm', slots: 2, maxPerYear: 1,
    desc: 'Give away something that took you years.',
    available: (state, npc) => state.character.techniques.some((t) => !(npc.techniques || []).includes(t)),
    run: (state, rng, npc) => {
      const options = state.character.techniques.filter((t) => !(npc.techniques || []).includes(t));
      const id = rng.pick(options);
      npc.techniques = (npc.techniques || []).concat(id);
      npc.power = Math.round(npc.power * 1.15);
      chargeSocial(npc, { respect: 22, closeness: 12, trust: 10 });
      note(state, `Taught ${npc.name} the ${TECH_BY_ID[id].name}.`, { subject: npc.id, tags: ['mentor'], weight: 4 });
      const tech = TECH_BY_ID[id];
      // A forbidden technique (Kaio-ken, the Evil Containment Wave, and the
      // like) is genuinely rare enough that teaching it to somebody doubles
      // how many people alive can do it. Kamehameha and ki blasts are not -
      // half the cast already has them, and claiming otherwise is exactly
      // the kind of overreach that reads as wrong given how many people in
      // this setting are demonstrably fast, strong, or skilled already.
      const closing = tech.branch === 'forbidden'
        ? `{Not many people alive can still do that.|That is not a common thing to know how to do.|Whoever taught you that did not teach many people.}`
        : `{One more person who has it now.|Word of that will get around.|It will not stay just yours for long, taught that easily.}`;
      return { text: `The ${tech.name}. ${render(`{It takes them months|They pick it up faster than you did, which stings|You have to break the movement down four times}.`, {}, rng)} ${render(closing, {}, rng)}` };
    },
  },
  {
    id: 'heal', name: 'Heal them', tone: 'warm', slots: 1, maxPerYear: 2,
    desc: 'Put your own energy into somebody else.',
    available: (state) => state.character.techniques.includes('healing') || state.character.senzu > 0,
    run: (state, rng, npc) => {
      if (state.character.techniques.includes('healing')) {
        adjust(state, { ki: -30, health: -5 });
      } else {
        state.character.senzu -= 1;
      }
      chargeSocial(npc, { closeness: 18, trust: 15, respect: 8 });
      adjust(state, { karma: 6 });
      return { text: render(`{Whatever was wrong with them closes over|They stand up|It costs you and you do not mention it}.`, {}, rng) };
    },
  },
  {
    id: 'ask_training', name: 'Ask them to train you', tone: 'warm', slots: 2, maxPerYear: 2,
    desc: 'The fastest growth there is, if they agree.',
    available: (state, npc) => npc.power > combatPower(state.character) * 0.8,
    run: (state, rng, npc) => {
      const chance = clamp(0.2 + bondScore(npc) / 160 + state.character.stats.charisma / 300, 0.05, 0.9);
      if (!rng.chance(chance)) {
        chargeSocial(npc, { respect: -3 });
        return { text: `${npc.name} ${render(`{says no|laughs|tells you to come back when you are worth the time}`, {}, rng)}.` };
      }
      const before = state.character.power;
      state.character.power = Math.round(state.character.power * rng.float(1.15, 1.45));
      state.character.peakPower = Math.max(state.character.peakPower, state.character.power);
      chargeSocial(npc, { closeness: 10, respect: 8, knowledge: 1 });
      if (['acquaintance', 'friend'].includes(npc.relation)) npc.relation = 'mentor';
      let learned = null;
      const teachable = (npc.techniques || []).filter((t) => !state.character.techniques.includes(t));
      if (teachable.length && rng.chance(0.4)) {
        learned = rng.pick(teachable);
        state.character.techniques.push(learned);
        state.stats.techniquesLearned += 1;
      }
      adjust(state, { health: -10 });
      return { text: `${npc.name} agrees. ${learned ? `You come away with the ${TECH_BY_ID[learned].name}.` : render(`{It is brutal|You are worse than they expected|You improve}.`, {}, rng)} Power level ${numberish(before)} to ${numberish(state.character.power)}.` };
    },
  },

  // ---------------------------------------------------------- romance
  {
    id: 'crush', name: 'Tell them you like them', tone: 'romance', slots: 1, maxPerYear: 1,
    desc: 'You are ten. It is a big deal and it is not complicated.',
    available: (state, npc) => state.character.age >= CRUSH_MIN_AGE && state.character.age < ROMANCE_MIN_AGE
      && !['parent', 'sibling', 'child', 'spouse'].includes(npc.relation)
      && Math.abs(npc.age - state.character.age) <= 3,
    run: (state, rng, npc) => {
      if (rng.chance(0.55 + bondScore(npc) / 300)) {
        chargeSocial(npc, { closeness: 18, trust: 8, romance: 10 });
        adjust(state, { happiness: 14 });
        note(state, `Told ${npc.name} they liked them, aged ${state.character.age}.`, { subject: npc.id, tags: ['romance'], weight: 3 });
        return { text: render(`{They go bright red and say the same thing back|"Obviously"|They shove you and then hold your hand, which covers it}. {You are inseparable for about two years|Neither of you knows what happens next|It is the whole of that summer}.`, {}, rng) };
      }
      chargeSocial(npc, { closeness: -4, tension: 6 });
      adjust(state, { happiness: -10 });
      return { text: render(`{They laugh|They do not understand what you mean and you cannot explain it|It goes badly and everyone finds out}.`, {}, rng) };
    },
  },
  {
    id: 'confess', name: 'Say how you feel', tone: 'romance', slots: 1, maxPerYear: 2,
    desc: 'Out loud, in words, which is the hard part.',
    available: (state, npc) => state.character.age >= ROMANCE_MIN_AGE
      && npc.age >= ROMANCE_MIN_AGE
      && !['parent', 'sibling', 'child', 'spouse', 'lover'].includes(npc.relation)
      && npc.alive,
    run: (state, rng, npc) => {
      const chance = clamp(0.15 + bondScore(npc) / 140 + state.character.stats.charisma / 260, 0.05, 0.92);
      if (rng.chance(chance)) {
        npc.relation = 'lover';
        chargeSocial(npc, { romance: 45, closeness: 15, trust: 8 });
        adjust(state, { happiness: 20 });
        note(state, `Fell for ${npc.name}.`, { type: 'romance', subject: npc.id, tags: ['romance'], weight: 5 });
        return { text: render(`{You handle it badly and it works anyway|They say "finally"|Neither of you is any good at this}. {It is a good year|You do not stop grinning for a week|Somebody had a bet on it}.`, {}, rng) };
      }
      chargeSocial(npc, { tension: 10, closeness: -8 });
      adjust(state, { happiness: -14 });
      return { text: render(`{They are kind about it, which is worse|"I did not know you thought that"|It is not returned}. {Things are strange between you for a long time|You do not bring it up again|You give them space}.`, {}, rng) };
    },
  },
  {
    id: 'court', name: 'Spend the year on them', tone: 'romance', slots: 2, maxPerYear: 2,
    desc: 'Everything else can wait.',
    available: (state, npc) => ['lover', 'spouse'].includes(npc.relation),
    run: (state, rng, npc) => {
      chargeSocial(npc, { romance: rng.int(10, 20), closeness: 12, trust: 8, tension: -8 });
      adjust(state, { happiness: 16 });
      return { text: `${courtLine(npc, rng)} ${render('#joy#', {}, rng)}` };
    },
  },
  {
    id: 'propose', name: 'Propose', tone: 'romance', slots: 1, maxPerYear: 1,
    desc: 'Ask, and find out.',
    available: (state, npc) => npc.relation === 'lover' && state.character.age >= COMMIT_MIN_AGE
      && npc.age >= COMMIT_MIN_AGE && (npc.romance || 0) > 45,
    run: (state, rng, npc) => {
      const chance = clamp((npc.romance || 0) / 120 + bondScore(npc) / 250, 0.1, 0.95);
      if (rng.chance(chance)) {
        npc.relation = 'spouse';
        chargeSocial(npc, { romance: 20, closeness: 15, trust: 12 });
        adjust(state, { happiness: 24, zeni: -rng.int(20000, 250000) });
        note(state, `Married ${npc.name}.`, { type: 'marriage', subject: npc.id, tags: ['romance', 'family'], weight: 7 });
        return { text: weddingLine(npc, rng) };
      }
      chargeSocial(npc, { romance: -15, tension: 12 });
      adjust(state, { happiness: -18 });
      return { text: render(`{"Not yet"|They say no and mean it|They cry and it is still no}. {You do not ask twice|It changes things|You wish you had waited}.`, {}, rng) };
    },
  },
  {
    id: 'have_child', name: 'Start a family', tone: 'romance', slots: 2, maxPerYear: 1,
    desc: 'Children in this setting tend to outclass their parents.',
    available: (state, npc) => (npc.relation === 'spouse' || (npc.relation === 'lover' && (npc.romance || 0) > 65))
      && state.character.age >= COMMIT_MIN_AGE && npc.age >= COMMIT_MIN_AGE && npc.age < 60,
    run: (state, rng, npc) => {
      const child = makeChild(rng, state.character, npc, currentYear(state));
      addNpc(state, child);
      chargeSocial(npc, { closeness: 12, romance: 8 });
      adjust(state, { happiness: 22, zeni: -rng.int(5000, 60000) });
      note(state, `${child.name} was born.`, { type: 'child', subject: child.id, tags: ['family'], weight: 7 });
      const blood = describeLineage(child.lineage);
      return {
        text: `${child.name}. ${birthLine(npc, rng)}`
          + (child.inheritedPower > state.character.power ? ' Something in them is already bigger than you.' : '')
          + (blood ? ` By blood, ${child.name} is ${blood}.` : ''),
      };
    },
  },

  // ------------------------------------------------------------ hostile
  {
    id: 'threaten', name: 'Threaten them', tone: 'hostile', slots: 0, maxPerYear: 3,
    desc: 'Make it clear what you could do.',
    available: (state, npc) => state.character.age >= HOSTILE_MIN_AGE && npc.age >= HOSTILE_MIN_AGE
      && !isCloseKin(npc),
    run: (state, rng, npc) => {
      const scared = combatPower(state.character) > npc.power * 1.5;
      chargeSocial(npc, { tension: rng.int(18, 35), closeness: -12, trust: -20, respect: scared ? 6 : -10 });
      adjust(state, { karma: -6 });
      if (!scared && rng.chance(0.4)) {
        npc.relation = 'enemy';
        return { text: `${npc.name} ${render(`{is not frightened of you|laughs in your face|steps closer}`, {}, rng)}. You have made an enemy and gained nothing.` };
      }
      return { text: render(`{They go very still|They do not answer|Something goes out of them}. {They will do what you want|It works|You are somebody to be careful around now}.`, {}, rng) };
    },
  },
  {
    id: 'extort', name: 'Take what they have', tone: 'hostile', slots: 1, maxPerYear: 2,
    desc: 'Money, gear, whatever they were carrying.',
    available: (state, npc) => state.character.age >= HOSTILE_MIN_AGE && npc.age >= HOSTILE_MIN_AGE
      && !isCloseKin(npc) && ((npc.zeni || 0) > 1000 || combatPower(state.character) > npc.power),
    run: (state, rng, npc) => {
      if (npc.power > combatPower(state.character) * 1.2) {
        chargeSocial(npc, { tension: 40, closeness: -25 });
        adjust(state, { health: -18, karma: -8 });
        return { text: `${npc.name} is stronger than you and this goes exactly how you should have expected.` };
      }
      const take = Math.round((npc.zeni || 0) * rng.float(0.4, 0.9));
      npc.zeni = Math.max(0, (npc.zeni || 0) - take);
      chargeSocial(npc, { tension: 45, closeness: -35, trust: -50, respect: -15 });
      npc.relation = 'enemy';
      adjust(state, { zeni: take, karma: -14, fame: 2 });
      note(state, `Robbed ${npc.name}.`, { type: 'crime', subject: npc.id, tags: ['crime'], weight: 3 });
      return { text: `${localMoney(state, take)}. ${render(`{They do not fight you for it|They try and it does not go well for them|Nobody helps them}.`, {}, rng)} They will not forget it.` };
    },
  },
  {
    id: 'humiliate', name: 'Humiliate them publicly', tone: 'hostile', slots: 1, maxPerYear: 2,
    desc: 'Do it where people can see.',
    available: (state, npc) => state.character.age >= HOSTILE_MIN_AGE && npc.age >= HOSTILE_MIN_AGE
      && !isCloseKin(npc) && combatPower(state.character) > npc.power * 1.4,
    run: (state, rng, npc) => {
      chargeSocial(npc, { tension: 55, closeness: -40, respect: -25, trust: -40 });
      npc.relation = 'enemy';
      npc.mood = 'furious about something';
      adjust(state, { karma: -12, fame: 6 });
      note(state, `Humiliated ${npc.name} in front of everyone.`, { subject: npc.id, tags: ['cruel'], weight: 4 });
      return { text: render(`{One movement and it is over|You do not even turn to face them|They do not get up for a while}. {The crowd goes quiet|Somebody films it|It travels further than you expected}.`, {}, rng) };
    },
  },
  {
    id: 'kidnap', name: 'Take them', tone: 'hostile', slots: 2, maxPerYear: 1,
    desc: 'Against their will, to somewhere they cannot leave.',
    available: (state, npc) => state.character.age >= HOSTILE_MIN_AGE && npc.age >= HOSTILE_MIN_AGE
      && !isCloseKin(npc) && combatPower(state.character) > npc.power * 1.3,
    run: (state, rng, npc) => {
      npc.relation = 'enemy';
      npc.captive = true;
      chargeSocial(npc, { tension: 70, closeness: -50, trust: -60 });
      adjust(state, { karma: -25, fame: 5 });
      state.character.flags.hunted_by_defenders = true;
      note(state, `Took ${npc.name} prisoner.`, { subject: npc.id, tags: ['crime'], weight: 6 });
      return { text: render(`{Nobody sees it happen|They fight and it does not matter|It takes four seconds}. {Somebody will come looking|Their people notice within the day|You have started something}.`, {}, rng) };
    },
  },
  {
    id: 'mind_probe', name: 'Read their mind', tone: 'hostile', slots: 1, maxPerYear: 2,
    desc: 'Everything they know, taken without asking. They will feel it.',
    available: (state, npc) => !isCloseKin(npc)
      && (state.character.techniques.includes('telepathy') || state.character.techniques.includes('mind_control')),
    run: (state, rng, npc) => {
      const resisted = rng.chance(clamp((npc.stats?.discipline || 40) / 200, 0.05, 0.5));
      if (resisted) {
        chargeSocial(npc, { tension: 30, trust: -30 });
        return { text: `${npc.name} ${render(`{shuts you out|feels it and pushes back hard|has been taught to guard against exactly this}`, {}, rng)}. They know what you tried.` };
      }
      learnAbout(npc, 2);
      chargeSocial(npc, { tension: 35, trust: -45, closeness: -20 });
      adjust(state, { karma: -12 });
      const deep = bondScore(npc) > 55;
      if (deep && rng.chance(0.6)) {
        npc.relation = 'enemy';
        npc.mood = 'furious about something';
        note(state, `Read ${npc.name}'s mind. They will not forgive it.`, { subject: npc.id, tags: ['betrayal'], weight: 5 });
        return { text: `You get all of it: ${npc.goal}, the money, the family, the thing they have never said out loud. ${render(`{And they feel you doing it|They know instantly|They turn and look straight at you}. {Somebody who trusted you does not any more|It is a betrayal and it is treated as one|They come at you}.`, {}, rng)}` };
      }
      return { text: `You get all of it: ${npc.goal}, the money, the family, the whole file. ${render(`{They feel something and cannot name it|They shiver and change the subject|They look at you strangely for weeks}.`, {}, rng)}` };
    },
  },
  {
    id: 'duel_death', name: 'Challenge them to the death', tone: 'hostile', slots: 2, maxPerYear: 2,
    desc: 'One of you does not walk away.',
    available: (state, npc) => npc.alive && npc.power > 1
      && state.character.age >= COMBAT_MIN_AGE && npc.age >= COMBAT_MIN_AGE,
    run: (state, rng, npc) => ({
      text: `You say it out loud, in front of whoever is there. ${npc.name} does not refuse.`,
      battle: {
        foe: {
          name: npc.name, power: npcFightPower(rng, npc), npcId: npc.id, raceId: npc.raceId,
          techniques: npc.techniques || [], forms: npc.transformations || [],
        },
        stakes: 'lethal', reason: 'duel',
        context: { reason: 'duel', npcId: npc.id },
        intro: 'Neither of you has left an exit.',
      },
    }),
  },
  {
    id: 'spar', name: 'Spar', tone: 'warm', slots: 2, maxPerYear: 3,
    desc: 'The Dragon Ball way of getting to know somebody.',
    available: (state, npc) => npc.alive && npc.power > 1
      && state.character.age >= COMBAT_MIN_AGE && npc.age >= COMBAT_MIN_AGE,
    run: (state, rng, npc) => ({
      text: `${npc.name} is already stretching.`,
      battle: {
        foe: {
          name: npc.name, power: npcFightPower(rng, npc), npcId: npc.id, raceId: npc.raceId,
          techniques: npc.techniques || [], forms: npc.transformations || [],
        },
        stakes: 'spar', reason: 'spar',
        context: { reason: 'spar', npcId: npc.id },
        intro: 'Nothing on the line but pride.',
      },
    }),
  },
];

export const SOCIAL_BY_ID = Object.fromEntries(SOCIAL_ACTIONS.map((a) => [a.id, a]));

/**
 * Whether the player can interact with this NPC at all right now. Dead
 * talking to dead is always fine (Hell, Other World reunions) - it is the
 * player being dead and the other person still being alive that the setting
 * only grants for a King Yemma's Leave day (day_pass_offer, afterlife.js),
 * not as standing access back into the world of the living.
 */
export function canVisitLiving(state, npc) {
  if (!state.character.inAfterlife || !npc.alive) return true;
  return !!state.character.flags[`day_pass_${currentYear(state)}`];
}

export function npcActions(state, npc) {
  const out = [];
  if (!canVisitLiving(state, npc)) return out;
  for (const action of SOCIAL_ACTIONS) {
    let ok = false;
    try { ok = action.available(state, npc); } catch (e) { ok = false; }
    if (!ok) continue;
    const key = `social:${action.id}:${npc.id}`;
    const used = (state.character.yearUse && state.character.yearUse[key]) || 0;
    const limit = limitFor(state, action);
    let blocked = null;
    if (used >= limit) {
      blocked = limit === 1
        ? `Once a year with ${npc.name}, and you have had it.`
        : `${limit} a year with ${npc.name}. You have used ${used}.`;
    }
    out.push({ ...action, blocked, used, limit, key });
  }
  return out;
}

export function runNpcAction(state, rng, npcId, actionId) {
  const npc = findNpc(state, npcId);
  const action = SOCIAL_BY_ID[actionId];
  if (!npc || !action) return { text: 'Nothing happens.', refused: true };
  if (!canVisitLiving(state, npc)) {
    return { text: 'You are dead, and they are not. That takes King Yemma\'s leave, not a walk over.', refused: true };
  }
  if (!action.available(state, npc)) return { text: 'Not with them, not now.', refused: true };

  const key = `social:${action.id}:${npc.id}`;
  const used = (state.character.yearUse && state.character.yearUse[key]) || 0;
  if (used >= limitFor(state, action)) {
    return { text: `Not again this year, not with ${npc.name}.`, refused: true };
  }
  state.character.yearUse = state.character.yearUse || {};
  state.character.yearUse[key] = used + 1;

  return action.run(state, rng, npc) || { text: 'Nothing much comes of it.' };
}

export { bondLabel, romanceLabel, relationLabel };
