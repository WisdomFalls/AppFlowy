// The dragon, and what you ask it for.
//
// A wish used to be one of a dozen buttons. It is the largest single decision
// in this setting - people spend whole sagas gathering the balls - so it now
// runs as a conversation: the dragon comes up, you pick a category, you pick a
// wish, and for some of them you pick who or what it lands on. Porunga grants
// three and stays in the sky between them. You can also just say what you want
// out loud, and a dragon is a literal creature about that.

import { registerEvents } from '../generator.js';
import { apply, fact, setWorldFlag, relate } from './helpers.js';
import { WISHES, WISH_GROUPS, DRAGONS, interpretWishLocally, WISH_BY_ID } from '../../data/items.js';
import { dragonFor, beginSummon, wishGranted, dismissDragon, summonActive, ballsHeld } from '../dragonballs.js';
import { TECHNIQUES, getTechnique } from '../../data/techniques.js';
import { RACES, getRace, raceHasTail } from '../../data/races.js';
import { PLANETS } from '../../data/planets.js';
import { CANON, canonAlive, canonPower } from '../../data/canon.js';
import { nearbyForms } from '../progression.js';
import { getTransformation } from '../../data/transformations.js';
import { combatPower } from '../stats.js';
import { makeNpc } from '../npc.js';
import { numberish, zeni } from '../text.js';
import { clamp } from '../rng.js';

/** Wishes this dragon can actually manage, for this character, right now. */
function usableWishes(state, dragon) {
  const c = state.character;
  const used = (state.world.summon && state.world.summon.used) || [];
  return WISHES.filter((w) => {
    if (w.race && !w.race.includes(c.raceId)) return false;
    if (used.includes(w.id)) return false;
    if (w.power > dragon.power) return false;
    if (w.needs === 'kills' && !state.stats.kills) return false;
    if (w.needs === 'scars' && !(c.scars || []).length && !(c.appearance.marks || []).length) return false;
    if (w.needs === 'planet_restored' && !state.world.flags.planet_restored) return false;
    if ((w.id === 'revive_named' || w.id === 'revive_many') && !Object.values(state.npcs).some((n) => !n.alive)) return false;
    if ((w.id === 'for_someone' || w.id === 'strengthen_ally') && !Object.values(state.npcs).some((n) => n.alive)) return false;
    if (w.id === 'next_form' && !nearbyForms(state, 1).length) return false;
    if (w.id === 'partner' && Object.values(state.npcs).some((n) => n.alive && n.relation === 'spouse')) return false;
    return true;
  });
}

/** People, worlds and threats a wish can be pointed at. */
function targetsFor(state, wish) {
  const npcs = Object.values(state.npcs);
  if (wish.pick === 'dead') {
    return npcs.filter((n) => !n.alive)
      .sort((a, b) => (b.closeness || 0) - (a.closeness || 0))
      .slice(0, 8)
      .map((n) => ({ id: n.id, label: n.name, hint: `${n.relation}${n.causeOfDeath ? ' - ' + n.causeOfDeath : ''}` }));
  }
  if (wish.pick === 'living') {
    return npcs.filter((n) => n.alive)
      .sort((a, b) => (b.closeness || 0) - (a.closeness || 0))
      .slice(0, 8)
      .map((n) => ({ id: n.id, label: n.name, hint: `${n.relation} - ${n.goal || 'wants something'}` }));
  }
  if (wish.pick === 'race') {
    return RACES.filter((r) => r.id !== state.character.raceId)
      .map((r) => ({ id: r.id, label: r.name, hint: r.notes || r.blurb }));
  }
  if (wish.pick === 'threat') {
    const year = state.character.birthYear + state.character.age;
    return CANON.filter((ch) => canonAlive(ch, year)
      && ch.tags.some((t) => ['threat', 'emperor', 'villain'].includes(t))
      && !ch.tags.some((t) => ['omniking', 'destroyer', 'angel'].includes(t)))
      .slice(0, 8)
      .map((ch) => ({ id: ch.id, label: ch.name, hint: `${numberish(canonPower(ch, year))} - ${ch.quirk || ''}`.slice(0, 90) }));
  }
  return [];
}

// ---------------------------------------------------------------- the grants

function grant(ctx, wish, targetId) {
  const c2 = ctx;
  const c = ctx.character;
  const rng = ctx.rng;
  const npc = targetId ? c2.state.npcs[targetId] : null;

  switch (wish.id) {
    case 'revive_named': {
      const back = npc || Object.values(c2.state.npcs).filter((n) => !n.alive)[0];
      if (!back) return { text: `Nobody you love is dead. The dragon waits, and you waste it on something small.`, changes: apply(c2, { happiness: -4 }) };
      back.alive = true;
      back.deadSince = null;
      back.causeOfDeath = null;
      back.closeness = clamp((back.closeness || 0) + 20, 0, 100);
      fact(c2, `Brought ${back.name} back from the dead.`, { type: 'revival', weight: 9, subject: back.id, tags: ['wish'] });
      return { text: `You say the name and nothing else. {The dragon's eyes flare|It is done before you finish speaking|"It is done"}. `
        + `${back.name} {is standing there, filthy and confused|opens their eyes somewhere and starts walking home|does not understand yet, and will not for a while}.`,
      changes: apply(c2, { happiness: 25, karma: 8 }) };
    }
    case 'revive_many': {
      const dead = Object.values(c2.state.npcs).filter((n) => !n.alive);
      dead.forEach((n) => { n.alive = true; n.deadSince = null; });
      fact(c2, `Brought back everyone who had died. All ${dead.length} of them.`, { type: 'revival', weight: 10, tags: ['wish', 'hero'] });
      return { text: `{You ask for all of them|"All of them"|You do not ask for anything for yourself}. `
        + (dead.length ? `${dead.length} people wake up somewhere and do not know why.` : `Nobody is dead. The dragon waits, then goes.`),
      changes: apply(c2, { happiness: 30, karma: 20, fame: 10 }) };
    }
    case 'revive_all': {
      const killed = c2.state.stats.kills;
      Object.values(c2.state.npcs).forEach((n) => {
        if (!n.alive && /you killed/i.test(n.causeOfDeath || '')) { n.alive = true; n.deadSince = null; n.tension = 100; }
      });
      c2.state.stats.kills = 0;
      fact(c2, `Undid every death they had caused. ${killed} of them.`, { type: 'revival', weight: 10, tags: ['wish', 'atonement'] });
      return { text: `{You list them|You do not remember all the names and the dragon does|"Everyone I killed"}. `
        + `${killed} people come back. {Most of them are looking for you|None of them are grateful|Some of them are already coming}.`,
      changes: apply(c2, { karma: 30, happiness: -6, fame: 8 }) };
    }
    case 'immortality': {
      c.flags.immortal = true;
      c.lifeExpectancy = 99999;
      fact(c2, 'Became immortal. Cannot die of age.', { type: 'wish', weight: 10, tags: ['wish', 'immortal'] });
      return { text: `{"It is done"|The dragon looks at you for a long moment first|Nothing feels different, which is the frightening part}. `
        + `You will not age out of this. {Everything else can still kill you|Somewhere, a god makes a note|You have all the time there is}.`,
      changes: apply(c2, { karma: -8, happiness: 10 }) };
    }
    case 'youth': {
      c.age = Math.max(16, c.age - 20);
      fact(c2, 'Wished twenty years back onto the clock.', { type: 'wish', weight: 8, tags: ['wish'] });
      return { text: `{Twenty years come off|You feel it in your knees first|Your hands look wrong for a week}. `
        + `You are ${c.age} again, with everything you learned still in there.`, changes: apply(c2, { health: 40, happiness: 18 }) };
    }
    case 'cure': {
      const had = (c.scars || []).length + (c.appearance.marks || []).length;
      c.scars = [];
      c.appearance.marks = [];
      fact(c2, 'Asked the dragon to undo everything that had been done to their body.', { type: 'wish', weight: 6, tags: ['wish'] });
      return { text: `{Every mark goes at once|You watch the old ones fade|It takes about a second}. `
        + `${had} things that happened to you no longer show. {You are not sure you wanted that|It feels like losing an argument|Your hands are somebody else's}.`,
      changes: apply(c2, { health: 45, happiness: 8 }) };
    }
    case 'power_up': {
      const mult = rng.float(6, 22);
      const yearsLost = rng.int(8, 25);
      c.lifeExpectancy = Math.max(c.age + 3, c.lifeExpectancy - yearsLost);
      c.flags.wished_power = true;
      fact(c2, `Wished for power and paid ${yearsLost} years for it.`, { type: 'wish', weight: 9, tags: ['wish', 'power'] });
      return { text: `{It arrives all at once and it hurts|Your whole body reorganises|You can feel it come in}. `
        + `Power multiplied ${mult.toFixed(1)} times. {The dragon takes the payment from the far end of your life|"The years were the price"|You are ${yearsLost} years shorter and you did not feel it go}.`,
      changes: apply(c2, { powerMult: mult, happiness: 12, karma: -6 }) };
    }
    case 'unlock_potential': {
      c.flags.potential_unlocked = true;
      c.flags.wish_potential = true;
      fact(c2, 'Had every drop of latent potential unlocked by the dragon.', { type: 'wish', weight: 9, tags: ['wish', 'power'] });
      return { text: `{Nothing visible happens|There is no glow, no shout|You feel the ceiling come off}. `
        + `Everything you could ever have been is available now, and you have to go and take it.`,
      changes: apply(c2, { powerMult: rng.float(3, 7), happiness: 15, stats: { kiControl: 8, technique: 6, discipline: 4 } }) };
    }
    case 'next_form': {
      const near = nearbyForms(c2.state, 1)[0];
      if (!near) return { text: 'There is nothing above you to give. The dragon says so.', changes: [] };
      const form = near.form;
      c.transformations.push(form.id);
      c.flags.wished_form = true;
      fact(c2, `The dragon handed them ${form.name}.`, { type: 'transformation', weight: 8, tags: ['wish', 'power'] });
      return { text: `{The change goes through you standing still|It is not like earning it|There is no shout and no crater}. `
        + `${form.name}. ${form.desc} {It fits badly|Your body knows the shape and not the reason|You will spend years catching up to it}.`,
      changes: apply(c2, { happiness: 14, karma: -2 }) };
    }
    case 'knowledge': {
      const pool = TECHNIQUES.filter((t) => !c.techniques.includes(t.id) && (!t.races || t.races.includes(c.raceId)));
      if (!pool.length) return { text: 'You already know everything the dragon can teach.', changes: [] };
      const t = rng.weighted(pool, (x) => x.tier);
      c.techniques.push(t.id);
      c2.state.stats.techniquesLearned++;
      fact(c2, `The dragon put the ${t.name} into their head.`, { type: 'technique', weight: 6, tags: ['wish', 'technique'] });
      return { text: `{It arrives as memory, not learning|You simply know it, the way you know your own name|There is no practice and no wonder}. `
        + `The ${t.name}. {It feels like cheating|You did not earn it|It works perfectly}.`,
      changes: apply(c2, { stats: { technique: 5, kiControl: 4 }, happiness: 10 }) };
    }
    case 'change_race': {
      const race = getRace(targetId) || RACES.find((r) => r.id !== c.raceId);
      const old = getRace(c.raceId);
      c.raceId = race.id;
      c.tail = raceHasTail(c.raceId);
      c.transformations = c.transformations.filter((id) => {
        const f = getTransformation(id);
        return f && (!f.races || f.races.includes(race.id));
      });
      c.appearance.skin = { namekian: 'green', majin: 'pink', frostdemon: 'white', shinjin: 'purple' }[race.id] || c.appearance.skin;
      fact(c2, `Stopped being a ${old.short} and became a ${race.short}.`, { type: 'wish', weight: 10, tags: ['wish', 'identity'] });
      return { text: `{The dragon does not ask why|"It is done"|It takes eleven seconds and it is the longest eleven seconds of your life}. `
        + `You are a ${race.short} now. ${race.notes || race.blurb} {Everything you learned as a ${old.short} is still in there and most of it no longer applies|Your own hands are unfamiliar|Nobody who knew you will take this well}.`,
      changes: apply(c2, { happiness: 6, karma: -3, stats: { discipline: -4 } }) };
    }
    case 'know_everyone': {
      const all = Object.values(c2.state.npcs);
      all.forEach((n) => { n.knowledge = 4; });
      fact(c2, `Had the dragon show them the truth about all ${all.length} people they knew.`, { type: 'wish', weight: 8, tags: ['wish'] });
      return { text: `{It comes in all at once|You did not think about what this would feel like|Every person you know, opened up}. `
        + `${all.length} people, fully understood. {Some of them you wish you had not seen|You know what your friends actually think|It is a violation and it worked}.`,
      changes: apply(c2, { happiness: -8, stats: { intellect: 6, charisma: -3 } }) };
    }
    case 'tail_back': {
      c.tail = true;
      return { text: `{It grows back overnight|You wake up and it is there|It is stronger than the old one}. `
        + `{You had forgotten what balance felt like|The moon is interesting again|Do not let anyone grab it}.`,
      changes: apply(c2, { happiness: 10, powerMult: 1.3 }) };
    }
    case 'erase_memory': {
      c.fame = 0;
      Object.values(c2.state.npcs).forEach((n) => { n.closeness = Math.round(n.closeness * 0.2); n.respect = 0; });
      fact(c2, 'Wished to be forgotten by everyone.', { type: 'wish', weight: 9, tags: ['wish'] });
      return { text: `{It works immediately|Nobody looks up when you walk past|Somebody you love calls you "excuse me"}. `
        + `{You are nobody|It is exactly what you asked for|You did not think about what it would feel like}.`,
      changes: apply(c2, { happiness: -10, karma: -4 }) };
    }
    case 'restore_planet': {
      setWorldFlag(c2.state, 'planet_restored');
      fact(c2, 'Asked the dragon to put a dead world back.', { type: 'wish', weight: 10, tags: ['wish', 'hero'] });
      return { text: `{Rock, water, air, in that order|It takes eleven seconds|The dragon says it is done and it is done}. `
        + `{The people are a separate wish|Somewhere a world is spinning again|It is empty and it is there}.`,
      changes: apply(c2, { karma: 25, happiness: 25, fame: 12 }) };
    }
    case 'restore_people': {
      setWorldFlag(c2.state, 'people_restored');
      for (let i = 0; i < 3; i++) {
        const n = makeNpc(rng, { year: c2.year, placeId: c.placeId, relation: 'acquaintance' });
        n.closeness = 60;
        n.respect = 80;
        c2.state.npcs[n.id] = n;
      }
      fact(c2, 'Put a dead world\'s people back on it.', { type: 'wish', weight: 10, tags: ['wish', 'hero', 'legend'] });
      return { text: `{Everyone who was standing on it when it went|The dragon does not count them and neither can you|"They are returned"}. `
        + `{A world that was quiet is not quiet|Three of them find you within the year|They will build a statue and you will hate it}.`,
      changes: apply(c2, { karma: 35, happiness: 28, fame: 25 }) };
    }
    case 'remove_threat': {
      const ch = CANON.find((x) => x.id === targetId);
      const year = c2.year;
      const theirs = ch ? canonPower(ch, year) : 1;
      const dragon = dragonFor(c2.state);
      // A dragon cannot exceed the one who made it. Shenron will not touch Frieza.
      const ceiling = dragon.id === 'super' ? Infinity : dragon.id === 'porunga' ? 1e9 : 1e6;
      if (theirs > ceiling) {
        return { text: `{The dragon is quiet for a long time|"That one is beyond me"|The sky flickers}. `
          + `${ch ? ch.name : 'They'} {are stronger than the one who made this dragon|is outside what can be asked|does not fall to a wish}. You get nothing, and you have spent it.`,
        changes: apply(c2, { happiness: -12 }) };
      }
      const npcRef = c2.state.npcs['canon_' + targetId];
      if (npcRef) { npcRef.alive = false; npcRef.causeOfDeath = 'Wished away'; }
      setWorldFlag(c2.state, ch && ch.id === 'frieza' ? 'frieza_erased' : 'threat_wished_away');
      fact(c2, `Wished ${ch ? ch.name : 'a tyrant'} out of the universe.`, { type: 'wish', weight: 10, tags: ['wish', 'history'] });
      return { text: `{You name them and the sky answers|"It is done"|There is no flash and no body}. `
        + `${ch ? ch.name : 'They'} {is simply not anywhere any more|stops having been a problem|is gone, and a hundred worlds will never know why}.`,
      changes: apply(c2, { karma: 12, fame: 18, happiness: 15 }) };
    }
    case 'peace': {
      setWorldFlag(c2.state, 'wished_peace');
      Object.values(c2.state.npcs).forEach((n) => { n.tension = Math.round((n.tension || 0) * 0.2); });
      fact(c2, 'Wished for peace, and got a generation of it.', { type: 'wish', weight: 9, tags: ['wish', 'hero'] });
      return { text: `{The wars stop|The tyrants find they no longer want to|It is quiet in a way that takes a week to notice}. `
        + `{It will hold for a generation|People are people, and it will not last|Nobody knows it was you}.`,
      changes: apply(c2, { karma: 25, happiness: 20 }) };
    }
    case 'own_world': {
      const world = rng.pick(PLANETS.filter((p) => p.id !== 'earth'));
      c.flags.owns_world = true;
      c2.state.world.ownWorld = world.id;
      fact(c2, `The dragon gave them a world. Empty, habitable, theirs.`, { type: 'wish', weight: 8, tags: ['wish', 'property'] });
      return { text: `{It is out past everything|You see it from orbit before you land on it|Blue water, no cities, nobody}. `
        + `Yours. {There is nobody to rule unless you bring them|It is very quiet|You could put anything here}.`,
      changes: apply(c2, { happiness: 20, fame: 6 }) };
    }
    case 'wealth': {
      return { text: `{It is vulgar and it works|Money appears in accounts you do not have|Somebody delivers a case and does not explain}. `
        + `{You are rich|Obscenely rich|Rich enough that it stops being a number}.`,
      changes: apply(c2, { zeni: rng.int(50000000, 900000000), happiness: 12, karma: -3 }) };
    }
    case 'for_someone': {
      const who = npc || Object.values(c2.state.npcs).find((n) => n.alive);
      if (!who) return { text: 'There is nobody to give it to.', changes: [] };
      who.goalAchieved = true;
      relate(c2, who, { closeness: 30, respect: 25, trust: 30 });
      fact(c2, `Spent a wish on ${who.name} instead of themselves.`, { type: 'wish', weight: 9, subject: who.id, tags: ['wish', 'selfless'] });
      return { text: `{You give them the thing they have been chasing|"Not for me"|You do not even tell them it was you}. `
        + `${who.name} {gets what they wanted|will spend the rest of their life not understanding how|finds out eventually, and it changes everything between you}.`,
      changes: apply(c2, { karma: 20, happiness: 16 }) };
    }
    case 'partner': {
      const made = makeNpc(rng, { year: c2.year, placeId: c.placeId, relation: 'lover', minAge: Math.max(18, c.age - 8), maxAge: c.age + 8 });
      made.closeness = 92;
      made.trust = 90;
      made.romance = 95;
      made.respect = 70;
      made.madeByWish = true;
      c2.state.npcs[made.id] = made;
      c.flags.wished_love = true;
      fact(c2, `Wished for somebody to love them. The dragon made ${made.name}.`, { type: 'wish', weight: 9, subject: made.id, tags: ['wish'] });
      return { text: `{The dragon does not comment|"It is done"|There is a person standing there who was not there}. `
        + `${made.name}. {They love you and they know exactly why|It is real and it is manufactured and both of those are true|You will never be able to ask them if it is real}.`,
      changes: apply(c2, { happiness: 22, karma: -10 }) };
    }
    case 'strengthen_ally': {
      const who = npc || Object.values(c2.state.npcs).find((n) => n.alive);
      if (!who) return { text: 'There is nobody standing beside you to strengthen.', changes: [] };
      who.power = Math.max(who.power * 40, combatPower(c) * 0.7);
      who.knowledge = Math.max(who.knowledge || 0, 2);
      relate(c2, who, { closeness: 18, respect: 30 });
      fact(c2, `Made ${who.name} strong enough to stand beside them.`, { type: 'wish', weight: 8, subject: who.id, tags: ['wish'] });
      return { text: `{They drop to one knee when it lands|It goes into them and they shout|You watch somebody you love become dangerous}. `
        + `${who.name} is ${numberish(Math.round(who.power))} now. {They have to learn to live in it|Nobody asked them first|They will be useful and they will be frightened}.`,
      changes: apply(c2, { karma: 4, happiness: 12 }) };
    }
    case 'feast': {
      return { text: `{Forty courses|It arrives on tables that were not there|The dragon watches you eat, which is unsettling}. `
        + `{Somebody will be furious you spent it on this|It is the best meal of your life|You regret nothing until later}.`,
      changes: apply(c2, { happiness: 20, health: 10 }) };
    }
    case 'better_underwear': {
      fact(c2, 'Wished for a really nice pair of underwear.', { type: 'wish', weight: 4, tags: ['wish', 'comic'] });
      return { text: `{The dragon grants it without comment|"It is done"|It takes about four seconds}. `
        + `{They are extremely comfortable|Somebody will find out and never let it go|It was, on balance, worth it}.`,
      changes: apply(c2, { happiness: 14, fame: -2 }) };
    }
    default:
      return { text: `{The dragon grants it without comment|"It is done"|It takes about four seconds}.`, changes: apply(c2, { happiness: 8 }) };
  }
}

// ------------------------------------------------------------------- events

registerEvents([
  {
    id: 'summon_dragon', noFatigue: true, tags: ['world', 'dragonball', 'wish'], weight: 500,
    when: (ctx) => ballsHeld(ctx.state) >= 7 || !!(ctx.state.world.summon && ctx.state.world.summon.remaining > 0),
    slots: (ctx) => {
      const dragon = dragonFor(ctx.state);
      const summon = ctx.state.world.summon;
      return {
        dragon: dragon.name,
        voice: dragon.voice,
        already: summon ? summon.used.length : 0,
        left: summon ? summon.remaining : dragon.wishes,
      };
    },
    title: (ctx, s) => (s.already ? `[dragon] Is Still Here` : 'Summoning'),
    text: (ctx, s) => (s.already
      ? `[dragon] {has not gone|is still uncoiled across the sky|waits}. {[left] wishes left|You have [left] more|Two more, and then stone}.
         ${s.voice ? `You speak into [voice].` : ''}`
      : `Seven balls in a circle, and {the sky goes black|the sun goes out|the clouds come apart}.
         [dragon] {rises|uncoils|fills the sky}, and there is [voice].
         {"State your wish"|"Speak. I will grant [left]"|"You have summoned me. Make it quick"}.`),
    choices: (ctx, s) => {
      const dragon = dragonFor(ctx.state);
      const pool = usableWishes(ctx.state, dragon);
      const groups = WISH_GROUPS.filter((g) => pool.some((w) => w.group === g));
      const list = groups.map((g) => ({
        id: 'group:' + g,
        label: g,
        hint: pool.filter((w) => w.group === g).slice(0, 3).map((w) => w.name).join('. '),
        effect: (c2) => ({
          text: `{You think about it|The dragon does not hurry you|Nobody in the circle says anything}.`,
          followUp: 'wish_menu',
          followUpSlots: { group: g },
        }),
      }));
      list.push({
        id: 'speak',
        label: 'Say it in your own words',
        hint: 'Speak the wish aloud. The dragon will interpret, and dragons are literal.',
        freeText: true,
        placeholder: 'Bring my brother back. Make me stronger than Frieza. Anything.',
        interpret: pool.map((w) => ({ id: w.id, name: w.name, desc: w.desc })),
        effect: (c2) => {
          const said = String((c2.params && c2.params.text) || '').trim();
          if (!said) return { text: `You open your mouth and nothing comes out. The dragon waits.` };
          // A connected model reads the wish before this runs and hands the
          // id back in params; without one, the dragon reads it literally.
          const chosen = c2.params && c2.params.wishId;
          const id = chosen || interpretWishLocally(said);
          const wish = id ? WISH_BY_ID[id] : null;
          const reading = c2.params && c2.params.reading;
          const dragonNow = dragonFor(c2.state);
          if (!wish || wish.power > dragonNow.power) {
            wishGranted(c2.state, c2.rng, 'misheard');
            return { text: `You say: "${said.slice(0, 160)}". `
              + `{The dragon considers it|There is a long silence|The sky does not change}. `
              + `${wish ? `"That is beyond me," it says, and goes.` : `"I do not understand what you are asking," it says, and goes anyway.`}`,
            changes: apply(c2, { happiness: -10 }) };
          }
          // A spoken wish that needs a target picks the most obvious one.
          let target = null;
          const options = targetsFor(c2.state, wish);
          if (options.length) {
            const named = options.find((o) => said.toLowerCase().includes(String(o.label).toLowerCase().split(' ')[0]));
            target = (named || options[0]).id;
          }
          const out = grant(c2, wish, target);
          const left = wishGranted(c2.state, c2.rng, wish.id);
          fact(c2, `Wished aloud: "${said.slice(0, 70)}".`, { type: 'wish', weight: 7, tags: ['dragonball', 'wish'] });
          return {
            text: `You say: "${said.slice(0, 160)}". `
              + (reading ? `${reading} ` : `{The dragon takes that to mean|It hears it as|Interpreted as}: ${wish.name.toLowerCase()}. `)
              + out.text
              + (left.gone ? ` {The sky comes back|The balls scatter|They will be stone for a year}.` : ` ${dragonNow.name} does not leave.`),
            changes: out.changes,
            followUp: left.gone ? null : 'summon_dragon',
          };
        },
      });
      list.push({
        id: 'nothing',
        label: 'Send it away',
        hint: 'Ask for nothing. The balls scatter anyway.',
        effect: (c2) => {
          dismissDragon(c2.state, c2.rng);
          fact(c2, 'Called the dragon and asked it for nothing.', { type: 'wish', weight: 6, tags: ['wish'] });
          return { text: `{"Nothing," you say|You look at it and you cannot think of one thing|"I do not need anything"}. `
            + `{The dragon considers you|It is the first time anyone has done that|"Very well"}. {The sky comes back|It goes|The balls scatter across the world and turn to stone}.`,
          changes: apply(c2, { karma: 8, happiness: -4, stats: { discipline: 4 } }) };
        },
      });
      return list;
    },
  },

  {
    id: 'wish_menu', noFatigue: true, tags: ['world', 'dragonball', 'wish'], weight: 0,
    when: () => false,
    slots: (ctx) => ({
      group: ctx.forceSlots && ctx.forceSlots.group ? ctx.forceSlots.group : 'Yourself',
      dragon: dragonFor(ctx.state).name,
    }),
    title: (ctx, s) => s.group,
    text: `[dragon] {waits|has not moved|holds the sky open}. {Be specific|Dragons are literal|Say exactly what you mean}.`,
    choices: (ctx, s) => {
      const dragon = dragonFor(ctx.state);
      const pool = usableWishes(ctx.state, dragon).filter((w) => w.group === s.group && !w.freeText);
      const list = pool.map((w) => ({
        id: w.id,
        label: w.name,
        hint: w.desc,
        danger: w.karma < -5,
        effect: (c2) => {
          const options = targetsFor(c2.state, w);
          if (options.length && !(c2.params && c2.params.option)) {
            return {
              text: `{"Name it"|The dragon waits|"Be specific"}.`,
              followUp: 'wish_target',
              followUpSlots: { wishId: w.id },
            };
          }
          const out = grant(c2, w, c2.params ? c2.params.option : null);
          const left = wishGranted(c2.state, c2.rng, w.id);
          fact(c2, `Wished: ${w.name}.`, { type: 'wish', weight: 7, tags: ['dragonball', 'wish'] });
          return {
            text: out.text + (left.gone
              ? ` {The sky comes back|The balls scatter across the world|They will be stone for a year}.`
              : ` ${dragon.name} does not leave. ${left.remaining} ${left.remaining === 1 ? 'wish' : 'wishes'} left.`),
            changes: out.changes,
            followUp: left.gone ? null : 'summon_dragon',
          };
        },
      }));
      list.push({
        id: 'back',
        label: 'Ask for something else',
        effect: () => ({ text: `{You change your mind|"Wait"|The dragon does not sigh, but it is close}.`, followUp: 'summon_dragon' }),
      });
      return list;
    },
  },

  {
    id: 'wish_target', noFatigue: true, tags: ['world', 'dragonball', 'wish'], weight: 0,
    when: () => false,
    slots: (ctx) => ({
      wishId: (ctx.forceSlots && ctx.forceSlots.wishId) || 'revive_named',
      dragon: dragonFor(ctx.state).name,
    }),
    title: (ctx, s) => (WISH_BY_ID[s.wishId] || {}).name || 'Name it',
    text: `{"Name it"|[dragon] waits|"Be specific. I will take you at your word"}.`,
    choices: (ctx, s) => {
      const wish = WISH_BY_ID[s.wishId];
      if (!wish) return [{ id: 'back', label: 'Never mind', effect: () => ({ text: 'You change your mind.', followUp: 'summon_dragon' }) }];
      const dragon = dragonFor(ctx.state);
      const list = targetsFor(ctx.state, wish).map((o) => ({
        id: o.id,
        label: o.label,
        hint: o.hint,
        effect: (c2) => {
          const out = grant(c2, wish, o.id);
          const left = wishGranted(c2.state, c2.rng, wish.id);
          fact(c2, `Wished: ${wish.name} - ${o.label}.`, { type: 'wish', weight: 7, tags: ['dragonball', 'wish'] });
          return {
            text: out.text + (left.gone
              ? ` {The sky comes back|The balls scatter|They will be stone for a year}.`
              : ` ${dragon.name} does not leave. ${left.remaining} left.`),
            changes: out.changes,
            followUp: left.gone ? null : 'summon_dragon',
          };
        },
      }));
      list.push({
        id: 'back',
        label: 'Ask for something else instead',
        effect: () => ({ text: `{You change your mind|"Wait"|The dragon waits}.`, followUp: 'summon_dragon' }),
      });
      return list;
    },
  },
]);
