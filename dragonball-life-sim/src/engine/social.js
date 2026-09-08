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
import { combatPower, weaponAttackBonus, looksScore, STAT_KEYS, STAT_LABELS } from './stats.js';
import { bondScore, bondLabel, romanceLabel, learnAbout, relationLabel, makeChild,
  weddingLine, courtLine, birthLine, describeLineage, spouseFlavor } from './npc.js';
import { npcBag } from './inventory.js';
import { shipOf, inviteAboard } from './settlement.js';

/** An NPC's power as it actually shows up in a fight - their base, plus
 * whatever a weapon they have out actually does for them. Nobody rolls a
 * bag until it matters, so this is where that first happens for a foe. */
function npcFightPower(rng, npc) {
  npcBag(rng, npc);
  return Math.round(npc.power * (1 + weaponAttackBonus(npc) / 260));
}
import { TECH_BY_ID, techniquePurity, setTechniquePurity } from '../data/techniques.js';
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

/**
 * What somebody actually looks for in a partner. Rolled once per character
 * the first time it is needed and kept from then on, so the same person's
 * taste does not change fight to fight. Saiyans are the one race where
 * strength in a partner is close to a given; everyone else runs the full
 * range, and it can run either way regardless of sex - the preference is
 * the character's, not their species' rulebook applied evenly.
 */
function getPreferences(character, rng) {
  if (character.romPref) return character.romPref;
  const saiyanBlood = character.raceId === 'saiyan' || character.raceId === 'halfsaiyan';
  character.romPref = {
    strength: saiyanBlood ? rng.float(0.65, 1) : rng.float(0.05, 0.55),
    heightCm: rng.int(150, 205),
    heightTolerance: rng.int(15, 40),
    build: rng.pick(['small', 'wiry', 'lean', 'balanced', 'stocky', 'massive']),
  };
  return character.romPref;
}

/**
 * A fight is the one place two people show each other exactly what they are
 * made of, and for some people - Saiyans especially - that is the whole
 * appeal. Call this after a spar, or after a real fight that ends with both
 * people still standing. Mutual: what the other person just showed matters
 * against what you personally look for, and what you showed matters against
 * what they look for, same as any other attraction runs both directions.
 */
export function checkRomanceSpark(state, rng, npc, opts = {}) {
  const c = state.character;
  if (!npc || !npc.alive) return null;
  if (['parent', 'sibling', 'child', 'spouse', 'lover'].includes(npc.relation)) return null;
  if (Math.abs((npc.age ?? c.age) - c.age) > 25) return null;

  const myPref = getPreferences(c, rng);
  const theirPref = getPreferences(npc, rng);
  const theirPower = clamp(Math.log10(Math.max(1, npc.power)) / 8, 0, 1);
  const myPower = clamp(Math.log10(Math.max(1, combatPower(c))) / 8, 0, 1);

  let score = 0.06;
  // What you just watched them do, weighed against how much that kind of
  // strength actually matters to you - and the mirror of it, what they saw
  // in you weighed against how much it matters to them.
  score += myPref.strength * theirPower * 0.45;
  score += theirPref.strength * myPower * 0.3;

  const theirHeight = (npc.appearance && npc.appearance.heightCm) || 170;
  const heightMatch = clamp(1 - Math.abs(theirHeight - myPref.heightCm) / (myPref.heightTolerance * 2), 0, 1);
  score += heightMatch * 0.08;
  if (npc.appearance && npc.appearance.buildShape === myPref.build) score += 0.06;

  score += looksScore(c) / 1400;
  score += (npc.closeness || 0) / 500;
  score = clamp(score, 0, opts.cap ?? 0.7);

  if (!rng.chance(score)) return null;

  if (!npc.relation || npc.relation === 'stranger') npc.relation = 'acquaintance';
  npc.closeness = clamp((npc.closeness || 0) + rng.int(6, 14), 0, 100);
  npc.romance = clamp((npc.romance || 0) + rng.int(8, 18), 0, 100);
  npc.tension = clamp((npc.tension || 0) - 6, 0, 100);
  npc.tags = npc.tags || [];

  const bold = npc.tags.includes('bold');
  const boldLines = [
    'You fight like that and expect me to just walk away?',
    'I do not know what that was, but I want to see it again.',
    'Careful. I am going to remember that.',
  ];
  const text = render(
    `{Something about the way [n] fights catches you off guard|A moment in it and neither of you is entirely thinking about the fight any more|You catch [n] looking at you differently once it is over}. `
    + (bold ? `"${rng.pick(boldLines)}" [n] does not pretend otherwise.` : `Neither of you says anything about it. Not yet.`),
    { n: npc.name }, rng,
  );
  return { text, bold };
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

// Close enough, or invested enough in you, to actually spend a season
// pushing you past somewhere you are stuck - a stranger just beats you.
const TRAIN_WITH_RELATIONS = new Set(['rival', 'spouse', 'lover', 'friend', 'bestfriend',
  'parent', 'sibling', 'child', 'mentor']);

/** The stat where they have the biggest edge on you, if any - what they
 * would actually have something to teach you about. */
function bestTrainableStat(character, npc) {
  let best = null, bestGap = 0;
  for (const key of STAT_KEYS) {
    const theirs = (npc.stats && npc.stats[key]) || 0;
    const mine = character.stats[key] || 0;
    const gap = theirs - mine;
    if (gap > bestGap) { bestGap = gap; best = key; }
  }
  return bestGap >= 8 ? best : null;
}

/** Whoever else you are actually committed to, if anyone. */
function currentPartner(state, excludeId) {
  return Object.values(state.npcs).find((n) => n.alive && n.id !== excludeId && ['lover', 'spouse'].includes(n.relation));
}

function chargeSocial(npc, changes) {
  if (changes.closeness) npc.closeness = clamp(npc.closeness + changes.closeness, 0, 100);
  if (changes.respect) npc.respect = clamp(npc.respect + changes.respect, 0, 100);
  if (changes.tension) npc.tension = clamp(npc.tension + changes.tension, 0, 100);
  if (changes.romance) npc.romance = clamp((npc.romance || 0) + changes.romance, 0, 100);
  if (changes.trust) npc.trust = clamp((npc.trust ?? 30) + changes.trust, 0, 100);
  if (changes.knowledge) learnAbout(npc, changes.knowledge);
}

/** Whether somebody is, on the surface, in a state to want closeness right
 * now - agitated, frustrated, stressed, angry or grieving people mostly are
 * not, whatever the bond between you says underneath it. Their mood is
 * already visible on their own dossier, so choosing to try anyway despite
 * what it says is a real, informed decision on the player's part. */
function surfaceReceptive(npc) {
  const badMood = /furious|frightened|grieving|exhausted|spoiling for a fight|restless/.test(npc.mood || '');
  return !badMood && (npc.tension || 0) < 40;
}

/**
 * Somebody who is not showing it can still actually want to be held - the
 * read a partner who genuinely knows them can make. A real read, not a
 * guarantee: a strong bond and real trust make it likely, nothing makes it
 * certain. Grief and real fury shut most people down even to somebody who
 * loves them; stress, frustration and plain sadness are the ones affection
 * can actually still reach.
 */
function secretlyWantsCloseness(npc, rng) {
  const bondedEnough = ['spouse', 'lover'].includes(npc.relation) && (npc.trust || 0) > 55 && (npc.romance || 0) > 40;
  if (!bondedEnough) return false;
  if (/furious|frightened|grieving/.test(npc.mood || '')) return false;
  return rng.chance(clamp(0.3 + ((npc.trust || 0) - 55) / 150 + ((npc.romance || 0) - 40) / 150, 0.1, 0.8));
}

/** A physical romance beat that checks consent before it checks anything
 * else: surface-receptive resolves as a normal success, a closed-off mood
 * either refuses outright or - if the bond is real and the read is
 * correct - resolves as somebody who was not going to say so but does not
 * push you away either, and pulls you in instead. `reward` and
 * `secretReward` are chargeSocial() deltas; `lines` supplies the three
 * narrative registers (open, secretly-wanted, refused). */
function physicalRomanceBeat(state, rng, npc, { reward, secretReward, refusedTension, lines }) {
  if (surfaceReceptive(npc)) {
    chargeSocial(npc, reward);
    return { text: render(lines.open, {}, rng) };
  }
  if (secretlyWantsCloseness(npc, rng)) {
    chargeSocial(npc, secretReward);
    return { text: render(lines.secret, {}, rng) };
  }
  chargeSocial(npc, { tension: refusedTension ?? 6, closeness: -2 });
  return { text: render(lines.refused, {}, rng) };
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
    id: 'take_photo', name: 'Keep a photo of this', tone: 'warm', slots: 0, maxPerYear: 2,
    desc: 'A moment worth having something to hold on to later.',
    available: (state, npc) => bondScore(npc) >= 40,
    run: (state, rng, npc) => {
      const c = state.character;
      c.photos = c.photos || [];
      const caption = rng.pick([
        'Nothing special was happening. That is sort of the point.',
        'You almost did not stop for it.',
        'Somebody insisted, for once.',
        'You do not remember what you were laughing about, only that you were.',
        'An ordinary day, kept anyway.',
      ]);
      c.photos.push({
        id: 'photo_' + (c.photos.length + 1), year: c.age, npcId: npc.id, npcName: npc.name,
        relation: npc.relation, caption,
      });
      chargeSocial(npc, { closeness: 4 });
      adjust(state, { happiness: 4 });
      return { text: `${caption} You keep it.` };
    },
  },
  {
    id: 'invite_aboard', name: 'Invite them onto the ship', tone: 'warm', slots: 0, maxPerYear: 3,
    desc: 'There is room. Not everyone gets asked.',
    available: (state, npc) => !!shipOf(state) && bondScore(npc) >= 35
      && !(shipOf(state).occupants || []).includes(npc.id),
    run: (state, rng, npc) => {
      const res = inviteAboard(state, npc);
      if (!res.ok) return { text: res.text };
      chargeSocial(npc, { closeness: 10, trust: 6 });
      adjust(state, { happiness: 6 });
      return { text: `${res.text} ${rng.pick([
        'One more person the ship actually means something to.',
        'They do not take long to find a room and make it theirs.',
        'Nobody makes a thing of it, which is somehow the nicest part.',
      ])}` };
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
      const lines = [`${render(`{They are worse than you expected and then they are not|It takes a season|You are a harsher teacher than you meant to be}.`, {}, rng)} ${npc.name} goes from ${numberish(before)} to ${numberish(npc.power)}.`];
      // Whoever you train while you have something standing is one of its
      // people now, not just somebody you happened to teach.
      const inst = state.character.institution;
      if (inst && !inst.members.includes(npc.id)) {
        inst.members.push(npc.id);
        inst.renown = clamp(inst.renown + 3, 0, 100);
        lines.push(`${npc.name} is one of yours now - part of ${inst.name}.`);
      }
      return { text: lines.join(' ') };
    },
  },
  {
    id: 'train_with_them', name: 'Ask them to train you', tone: 'warm', slots: 2, maxPerYear: 3,
    desc: 'Wherever they have the edge on you, let them push you past it.',
    // Beating you in something is not enough on its own - a stranger who
    // outclasses you owes you nothing. This only opens up to people who are
    // actually invested in you (rival, family, spouse, a real friendship, a
    // mentor) and who think enough of you to bother (respect).
    available: (state, npc) => TRAIN_WITH_RELATIONS.has(npc.relation)
      && (npc.respect || 0) >= 35
      && !!bestTrainableStat(state.character, npc),
    run: (state, rng, npc) => {
      const stat = bestTrainableStat(state.character, npc);
      if (!stat) return { text: `There is nothing left ${npc.name} can show you there.` };
      const theirs = npc.stats[stat];
      const c = state.character;
      const mine = c.stats[stat] || 0;
      const gap = clamp((theirs - mine) / 100, 0.02, 0.5);
      const gain = Math.max(2, Math.round(3 + gap * 24));
      c.stats[stat] = clamp(mine + gain, 1, 99);
      chargeSocial(npc, { closeness: 8, respect: 3, trust: 4 });
      note(state, `${npc.name} trained your ${STAT_LABELS[stat].toLowerCase()}.`,
        { subject: npc.id, tags: ['training'], weight: 3 });
      return {
        text: `${render(`{They do not go easy on you|It is a hard season and you are sore the whole way through|`
          + `They correct you, over and over, until it starts to take}.`, {}, rng)} `
          + `${STAT_LABELS[stat]} up ${gain}.`,
      };
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
        const learnedTech = TECH_BY_ID[learned];
        // Learning it straight from someone who was actually first taught it
        // (a canon character in the technique's own teachers list) is the
        // genuine article. Anyone else - even a mentor - is passing on their
        // own, already once-removed version, and it shows.
        if (learnedTech.teachers && learnedTech.teachers.length && !learnedTech.teachers.includes('any_master')
          && !(npc.canonId && learnedTech.teachers.includes(npc.canonId))) {
          setTechniquePurity(state.character, learned, techniquePurity(npc, learned) - rng.float(0.05, 0.2));
        }
      }
      adjust(state, { health: -10 });
      return { text: `${npc.name} agrees. ${learned ? `You come away with the ${TECH_BY_ID[learned].name}.` : render(`{It is brutal|You are worse than they expected|You improve}.`, {}, rng)} Power level ${numberish(before)} to ${numberish(state.character.power)}.` };
    },
  },

  // ---------------------------------------------------------- romance
  {
    id: 'compliment', name: 'Compliment them', tone: 'warm', slots: 0, maxPerYear: 4,
    desc: 'Say something nice, on purpose.',
    available: (state, npc) => npc.alive && !['parent', 'sibling', 'child'].includes(npc.relation),
    run: (state, rng, npc) => {
      const tags = npc.tags || [];
      const vain = tags.includes('vain');
      const cold = tags.includes('cold') || tags.includes('grim');
      const chance = clamp(0.55 + (vain ? 0.25 : 0) - (cold ? 0.2 : 0) + state.character.stats.charisma / 400, 0.15, 0.95);
      if (rng.chance(chance)) {
        const gain = vain ? rng.int(8, 16) : rng.int(3, 9);
        chargeSocial(npc, { closeness: gain, romance: ['lover', 'spouse'].includes(npc.relation) ? Math.round(gain * 0.6) : 0 });
        adjust(state, { happiness: 3 });
        return {
          text: vain
            ? render(`{They light up completely|"Go on."|They were clearly waiting for somebody to say it}.`, {}, rng)
            : render(`{They say thanks and mean it|A small smile, and that is the whole reaction|It lands better than you expected}.`, {}, rng),
        };
      }
      chargeSocial(npc, { tension: cold ? 4 : 1 });
      return {
        text: cold
          ? render(`{They do not know what to do with that and say nothing|"...Right." They change the subject|It slides off them entirely}.`, {}, rng)
          : render(`{It comes out wrong|They think you want something|Bad timing}.`, {}, rng),
      };
    },
  },
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
      const chance = clamp(0.15 + bondScore(npc) / 140 + state.character.stats.charisma / 520
        + looksScore(state.character) / 520, 0.05, 0.92);
      if (rng.chance(chance)) {
        npc.relation = 'lover';
        chargeSocial(npc, { romance: 45, closeness: 15, trust: 8 });
        adjust(state, { happiness: 20 });
        note(state, `Fell for ${npc.name}.`, { type: 'romance', subject: npc.id, tags: ['romance'], weight: 5 });
        let text = render(`{You handle it badly and it works anyway|They say "finally"|Neither of you is any good at this}. {It is a good year|You do not stop grinning for a week|Somebody had a bet on it}.`, {}, rng);
        // Falling for somebody new while you already belong to somebody is
        // not information that stays contained just because you want it to.
        const partner = currentPartner(state, npc.id);
        if (partner && rng.chance(0.35 + (partner.tags.includes('jealous') ? 0.35 : 0))) {
          const bad = partner.tags.includes('jealous') || partner.tags.includes('vengeful');
          chargeSocial(partner, {
            tension: rng.int(bad ? 30 : 18, bad ? 50 : 35),
            trust: -rng.int(15, 30),
            closeness: -rng.int(10, 25),
          });
          text += ` ${partner.name} finds out.${bad ? ' They do not take it well.' : ' It changes something between you, quietly.'}`;
        }
        return { text };
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
    id: 'hug', name: 'Hug them', tone: 'romance', slots: 0, maxPerYear: 10,
    desc: 'Close the distance. Whether they let you depends on more than whether they like you.',
    available: (state, npc) => npc.alive && ['lover', 'spouse', 'friend', 'child', 'parent', 'sibling'].includes(npc.relation),
    run: (state, rng, npc) => physicalRomanceBeat(state, rng, npc, {
      reward: { closeness: rng.int(4, 9), tension: -6 },
      secretReward: { closeness: rng.int(8, 16), trust: rng.int(4, 10), romance: ['lover', 'spouse'].includes(npc.relation) ? rng.int(4, 10) : 0, tension: -14 },
      refusedTension: 4,
      lines: {
        open: `{They lean into it|Neither of you says anything, which is the point|A real hug, not a formality}.`,
        secret: `{They stiffen for half a second and then do not pull away|Whatever they were holding onto, it slips a little|They do not push you off - they pull you in instead}. {That surprises both of you|It is not nothing|Something in them lets go, just for a moment}.`,
        refused: `{They step back, not unkindly|"Not right now."|They let you, but it is not really there}.`,
      },
    }),
  },
  {
    id: 'kiss', name: 'Kiss them', tone: 'romance', slots: 0, maxPerYear: 12,
    desc: 'Simple, and never actually simple.',
    available: (state, npc) => npc.alive && ['lover', 'spouse'].includes(npc.relation) && state.character.age >= ROMANCE_MIN_AGE,
    run: (state, rng, npc) => physicalRomanceBeat(state, rng, npc, {
      reward: { closeness: rng.int(5, 10), romance: rng.int(4, 9), tension: -6 },
      secretReward: { closeness: rng.int(9, 16), romance: rng.int(8, 16), trust: rng.int(4, 10), tension: -16 },
      refusedTension: 5,
      lines: {
        open: `{It is unhurried|Neither of you is the one who pulls back first|It says the thing neither of you has said out loud today}.`,
        secret: `{They turn away first and then do not|"...Fine." It is not a complaint|Whatever was wrong a second ago is still wrong, and this happens anyway}.`,
        refused: `{They turn their head|"Not now."|It lands somewhere that is not quite refusal and not quite yes, and you stop}.`,
      },
    }),
  },
  {
    id: 'cuddle', name: 'Hold them close', tone: 'romance', slots: 1, maxPerYear: 8,
    desc: 'No agenda. Just this, for a while - the one that actually needs them to want it, not just allow it.',
    available: (state, npc) => npc.alive && ['lover', 'spouse'].includes(npc.relation),
    run: (state, rng, npc) => physicalRomanceBeat(state, rng, npc, {
      reward: { closeness: rng.int(8, 15), trust: rng.int(4, 9), romance: rng.int(4, 9), tension: -12 },
      secretReward: { closeness: rng.int(14, 22), trust: rng.int(10, 18), romance: rng.int(8, 15), tension: -22 },
      refusedTension: 3,
      lines: {
        open: `{You do not talk. You do not need to|An hour disappears and neither of you notices|They fall asleep first, which is its own kind of trust}.`,
        secret: `{They do not have the energy to keep you out and stop trying to|"I did not think I wanted this until you were already here"|Whatever the day was, it is not in the room for a while}.`,
        refused: `{"I need to be alone right now."|They are polite about it, which is somehow worse|Not tonight, and they say so}.`,
      },
    }),
  },
  {
    id: 'carry', name: 'Carry them', tone: 'romance', slots: 0, maxPerYear: 6,
    desc: 'Sweep them up. It says something, done right, and something else entirely done wrong.',
    available: (state, npc) => npc.alive && ['lover', 'spouse'].includes(npc.relation),
    run: (state, rng, npc) => physicalRomanceBeat(state, rng, npc, {
      reward: { closeness: rng.int(6, 12), romance: rng.int(5, 10), respect: rng.int(2, 6) },
      secretReward: { closeness: rng.int(11, 18), romance: rng.int(9, 16), trust: rng.int(5, 10), tension: -14 },
      refusedTension: 8,
      lines: {
        open: `{They laugh, and let you|An arm around your neck and they do not ask why|It is showing off and it works anyway}.`,
        secret: `{They protest for exactly one second|"Put me— " and then they stop arguing|They hold on tighter than the moment strictly needs}.`,
        refused: `{"Put me down."|They mean it, and you do|Not the moment for it, and both of you know it}.`,
      },
    }),
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
  {
    id: 'end_it', name: 'End it', tone: 'romance', slots: 1, maxPerYear: 1, danger: true,
    desc: 'Leave, or ask them to. Some things do not survive being said out loud.',
    available: (state, npc) => ['lover', 'spouse'].includes(npc.relation),
    run: (state, rng, npc) => {
      const wasMarried = npc.relation === 'spouse';
      const f = spouseFlavor(npc);
      const mutual = (npc.romance || 0) < 30 || (npc.tension || 0) > 50;
      npc.relation = mutual ? 'acquaintance' : 'enemy';
      chargeSocial(npc, { romance: -100, closeness: -30, tension: mutual ? 10 : 40 });
      if (wasMarried) adjust(state, { happiness: -20, zeni: -rng.int(10000, 200000) });
      else adjust(state, { happiness: -12 });
      note(state, `${wasMarried ? 'Divorced' : 'Broke things off with'} ${npc.name}.`, {
        type: 'romance', subject: npc.id, tags: ['romance'], weight: 6,
      });
      const line = f.fierce
        ? render(`{It ends loudly|Something gets broken, and it is not just the relationship|Neither of you is quiet about it}.`, {}, rng)
        : f.gentle
          ? render(`{It is sad and it is calm, both|You are kind to each other right up until the end|Nobody raises their voice}.`, {}, rng)
          : f.vain
            ? render(`{They make sure everyone hears their version first|It becomes a whole production|They walk away like they meant to leave first}.`, {}, rng)
            : render(`{It is over, and it takes both of you a while to actually believe that|There is a long silence and then it is done|You say the true thing and it ends the conversation}.`, {}, rng);
      return { text: `${wasMarried ? 'The marriage ends.' : 'Whatever this was, it is over now.'} ${line}` };
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
          techniques: npc.techniques || [], forms: npc.transformations || [], mastery: npc.formMastery || {},
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
          restraint: npc.sparRestraint ?? 1, mastery: npc.formMastery || {},
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
