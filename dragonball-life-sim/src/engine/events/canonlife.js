// The cast keeps living.
//
// The canon timeline runs out. After that - and in the long gaps between the
// sagas - the famous people of this setting were, in the old build, furniture:
// they stood where the data file put them and nothing happened to them for
// sixty years. This pack gives them their own decade. They take students, hit
// walls, break through, marry, retire, bury each other, and turn up at your
// door because they heard about you.
//
// Nothing here is a written scene. A template picks a living canon character
// whose tags fit the beat, and the beat renders against them.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, relate, thread, trainYear, powerLine, meetCanon, canonHere,
  odds, findNpc, offerBattle, stranger } from './helpers.js';
import { combatPower, powerTier } from '../stats.js';
import { TIMELINE, eraName } from '../../data/timeline.js';
import { CANON, canonAlive, canonPower, getCanon } from '../../data/canon.js';
import { getPlace } from '../../data/places.js';
import { TECHNIQUES, getTechnique } from '../../data/techniques.js';
import { ladderFor, getTransformation } from '../../data/transformations.js';
import { generateFullName } from '../../data/names.js';
import { numberish, zeni } from '../text.js';
import { clamp } from '../rng.js';

/** Is the world between sagas right now? */
function quietYear(ctx) {
  return !TIMELINE.some((t) => t.year === ctx.year && !ctx.state.world.resolved.includes(t.id));
}

/** A canon character the player has actually met, preferring the close ones. */
function knownCanon(ctx, filter = () => true) {
  const list = Object.values(ctx.state.npcs).filter((n) => n.isCanon && n.alive && filter(n));
  if (!list.length) return null;
  return ctx.rng.weighted(list, (n) => 1 + (n.closeness || 0) / 20 + (n.respect || 0) / 40);
}

/** Anyone canon who could plausibly be around, met or not. */
function reachableCanon(ctx, filter = () => true) {
  const known = Object.values(ctx.state.npcs).filter((n) => n.isCanon && n.alive && filter(n));
  const here = canonHere(ctx, (ch) => {
    const npc = ctx.state.npcs['canon_' + ch.id];
    if (npc && !npc.alive) return false;
    return filter(npc || { isCanon: true, canonId: ch.id, tags: ch.tags, name: ch.name, power: canonPower(ch, ctx.year) });
  });
  if (known.length && ctx.rng.chance(0.65)) return ctx.rng.pick(known);
  if (!here.length) return known.length ? ctx.rng.pick(known) : null;
  return meetCanon(ctx, ctx.rng.pick(here).id);
}

function hasTag(npc, ...tags) {
  const ch = npc.canonId ? getCanon(npc.canonId) : null;
  const list = (ch && ch.tags) || npc.tags || [];
  return tags.some((t) => list.includes(t));
}

/**
 * Canon power keeps drifting after the last saga. The data file stops giving
 * figures at 790; past that, fighters who fight keep growing and everyone
 * else does not.
 */
export function canonDrift(npc, year) {
  const ch = npc.canonId ? getCanon(npc.canonId) : null;
  if (!ch) return npc.power;
  const keys = Object.keys(ch.power).map(Number);
  const last = Math.max(...keys);
  if (year <= last) return canonPower(ch, year);
  const fighter = ch.tags.some((t) => ['hero', 'rival', 'saiyan', 'threat', 'warrior', 'antihero'].includes(t));
  const rate = fighter ? 1.035 : 1.002;
  return canonPower(ch, last) * Math.pow(rate, year - last);
}

registerEvents([
  // ------------------------------------------------------- they keep training
  {
    id: 'canon_breakthrough', tags: ['canon', 'world', 'power'], weight: 26,
    minBioAge: 8,
    when: (ctx) => quietYear(ctx) && !ctx.character.inAfterlife,
    slots: (ctx) => {
      const npc = reachableCanon(ctx, (n) => hasTag(n, 'hero', 'rival', 'saiyan', 'antihero', 'prodigy', 'namekian'));
      if (!npc) return null;
      const ch = getCanon(npc.canonId);
      const theirs = canonDrift(npc, ctx.year);
      // A form they could actually be reaching for, not the top of the ladder.
      // A form a fighter at their level could actually be reaching for: one
      // that power alone explains, not a ritual or a god's tuition.
      const forms = ladderFor(ch && ch.race ? ch.race : 'earthling').filter((f) => {
        const r = f.req || {};
        if (!r.power) return false;
        if (r.custom || (r.mentors || []).length || (r.traits || []).length) return false;
        return r.power <= theirs * 2.5;
      }).sort((a, b) => (a.req.power || 0) - (b.req.power || 0));
      const form = forms.length ? forms[forms.length - 1] : null;
      return {
        ...npcSlot(npc),
        formName: form ? form.name : 'something they have not named yet',
        gap: numberish(Math.round(canonDrift(npc, ctx.year))),
      };
    },
    title: (ctx, s) => `${s.npcName} Has Been Working`,
    text: `{Word gets to you late|Somebody tells you at a market stall|You feel it from a long way off, and then you hear about it}.
      [npcName] {has gone past whatever they were stuck on|has something new|is not the fighter they were last year}.
      {They are calling it|The word going round is|Somebody who saw it says} [formName].
      {[gap], if the number means anything|Around [gap] now|The figure people repeat is [gap]}.`,
    choices: (ctx, s) => [
      { id: 'go', label: 'Go and see it for yourself', hint: 'Ask them to show you.', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { respect: 6, closeness: 8 });
        if (npc) npc.knowledge = Math.min(4, (npc.knowledge || 0) + 1);
        const t = trainYear(c2, { intensity: 1.5, mentorMult: 1.4 });
        fact(c2, `Watched ${sl.npcName} demonstrate something new, and took notes.`, { type: 'training', weight: 4, subject: sl.npcId, tags: ['canon'] });
        return { text: `{They show you without being asked twice|It takes an afternoon|They are pleased somebody cares}. `
          + `{You do not understand most of it|You understand about a third of it|You copy the shape and not the substance}. `
          + `{It goes into your own training for years|You will be chasing this|Something to work on}. ${powerLine(t.gained)}`, changes: [] };
      } },
      { id: 'race', label: 'Take it personally', hint: 'They moved. You had better move further.', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { tension: 10, respect: 4, relation: npc && npc.relation === 'acquaintance' ? 'rival' : undefined });
        thread(c2, 'rivalry', sl.npcId, { title: `Keeping up with ${sl.npcName}`, heat: 65 });
        const t = trainYear(c2, { intensity: 2.0 });
        return { text: `{You do not go and look|You hear it and you go straight back to the mountain|You say nothing to anyone}. `
          + `{The year disappears|You train like somebody is chasing you, and somebody is|You stop counting}. ${powerLine(t.gained)}`, changes: apply(c2, { health: -12, happiness: -4, stats: { discipline: 4 } }) };
      } },
      { id: 'shrug', label: 'Good for them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 3 });
        return { text: `{You are pleased for them, which surprises you|It is nice that somebody is having a good year|You mean it}. `
          + `{You get on with your own|There is enough of the universe for two|#ambience#}.`, changes: apply(c2, { happiness: 6 }) };
      } },
    ],
  },

  // --------------------------------------------------------- they come to you
  {
    id: 'canon_seeks_you', tags: ['canon', 'social', 'fight'], weight: 30,
    minBioAge: 12,
    when: (ctx) => quietYear(ctx) && !ctx.character.inAfterlife && ctx.character.fame > 12,
    slots: (ctx) => {
      const npc = reachableCanon(ctx, (n) => hasTag(n, 'hero', 'rival', 'saiyan', 'warrior', 'prodigy'));
      if (!npc) return null;
      const mine = combatPower(ctx.character);
      const theirs = canonDrift(npc, ctx.year);
      return {
        ...npcSlot(npc),
        theirPower: Math.round(theirs),
        verdict: theirs > mine * 3 ? 'They are being generous calling it a spar.'
          : theirs > mine * 0.6 ? 'This is close to even.' : 'You are stronger, and they know it.',
      };
    },
    title: (ctx, s) => `${s.npcName} Is At The Door`,
    text: `{They just turn up|Nobody announced them|You feel the ki before the knock}. [npcName].
      {They have heard about you|Somebody has been talking|Your name got to them somehow}.
      {"I want to see it"|"Show me what you can do"|They do not really explain}. [verdict]`,
    choices: (ctx, s) => [
      { id: 'spar', label: 'Give them a fight', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        return offerBattle(c2, {
          name: sl.npcName, power: sl.theirPower, canonId: npc && npc.canonId,
          npcId: sl.npcId, raceId: npc ? npc.raceId : 'other',
        }, { reason: 'spar', stakes: 'spar', intro: `${sl.npcName} does not wait for you to be ready.` });
      } },
      { id: 'talk', label: 'Talk instead', hint: 'Find out what they actually came for.', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 12, trust: 8 });
        if (npc) npc.knowledge = Math.min(4, (npc.knowledge || 0) + 1);
        const ch = npc && npc.canonId ? getCanon(npc.canonId) : null;
        return { text: `{You put food in front of them and they eat all of it|You sit outside until it gets dark|Neither of you is good at this}. `
          + (ch && ch.personality ? `${ch.personality} ` : '')
          + `{They leave without saying what they came for|They say more than they meant to|You understand them slightly better and it does not help}.`,
        changes: apply(c2, { happiness: 10, stats: { charisma: 2 } }) };
      } },
      { id: 'refuse', label: 'Send them away', danger: true, effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { tension: 16, respect: -8, closeness: -6 });
        return { text: `{You say no|"Not today"|You close the door}. `
          + `{They stand there for a while|They go without a word|Something in their face changes and stays changed}. `
          + `{That will come back|You have made a small enemy and small enemies grow|They will not ask twice}.`,
        changes: apply(c2, { happiness: -4 }) };
      } },
    ],
  },

  // ------------------------------------------------------ the masters get old
  {
    id: 'canon_retires', noFatigue: true, tags: ['canon', 'world', 'loss'], weight: 20,
    minBioAge: 14,
    when: (ctx) => quietYear(ctx) && ctx.year > 770,
    slots: (ctx) => {
      // Gods do not retire; they outlast everyone and find it tedious.
      const npc = knownCanon(ctx, (n) => hasTag(n, 'mentor', 'legend', 'elder', 'guardian')
        && !hasTag(n, 'divine', 'omniking', 'destroyer', 'angel', 'judge', 'dragon')
        && (n.closeness || 0) > 15);
      if (!npc) return null;
      if (ctx.state.memory.facts.some((f) => f.type === 'retirement' && f.subject === npc.id)) return null;
      return npcSlot(npc);
    },
    title: (ctx, s) => `${s.npcName} Is Done`,
    text: `{They tell you before they tell anyone else|You work it out before they say it|It is not dramatic}.
      [npcName] {is not going to fight again|has taught their last class|is finished, and says so without apology}.
      {There is a school with nobody to run it|There is a place that needs somebody in it|Somebody has to do the thing they did}.`,
    choices: (ctx, s) => [
      { id: 'take_over', label: 'Take it on', hint: 'The school, the students, the leaking roof.', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 20, respect: 18, trust: 15 });
        c2.character.flags.runs_school = true;
        if (!c2.character.items.includes('dojo_property')) c2.character.items.push('dojo_property');
        fact(c2, `Took over ${sl.npcName}'s school when they stopped.`, { type: 'retirement', weight: 8, subject: sl.npcId, tags: ['legacy', 'canon'] });
        for (let i = 0; i < 2; i++) {
          const student = stranger(c2, { relation: 'student', minAge: 9, maxAge: 20 });
          if (student) relate(c2, student, { respect: 25, trust: 20 });
        }
        return { text: `{They hand you the keys and do not look back|"It is yours"|There is no ceremony}. `
          + `{Two students stay|The ones who stay are the ones who were always going to|You have people now, which is different from having friends}. `
          + `{You will be worse at teaching than they were|You are going to have to learn this too|It is a job and it is an honour and it is mostly a job}.`,
        changes: apply(c2, { fame: 8, happiness: 12, stats: { charisma: 4, discipline: 3 } }) };
      } },
      { id: 'sit', label: 'Sit with them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 18, trust: 14 });
        fact(c2, `Sat with ${sl.npcName} the year they stopped.`, { type: 'retirement', weight: 6, subject: sl.npcId, tags: ['canon'] });
        return { text: `{You do not offer to take anything over|You just come round|They talk and you listen}. `
          + `{They tell you things they have never told anybody|Most of it is about people who are dead|It is the best year you spend with them}.`,
        changes: apply(c2, { happiness: 14, stats: { intellect: 3, discipline: 2 } }) };
      } },
      { id: 'nothing', label: 'Let them go quietly', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: -4 });
        fact(c2, `${sl.npcName} retired. You did not go.`, { type: 'retirement', weight: 4, subject: sl.npcId, tags: ['canon'] });
        return { text: `{You mean to go and you do not|There is always next year|You send word and it is not the same}. `
          + `{The school closes|Somebody else takes it|It is nobody's fault}.`, changes: apply(c2, { happiness: -6 }) };
      } },
    ],
  },

  // ------------------------------------------------------------ they have kids
  {
    id: 'canon_family', tags: ['canon', 'social', 'life'], weight: 18,
    minBioAge: 12,
    when: (ctx) => quietYear(ctx),
    slots: (ctx) => {
      // People young enough for this to be news, and not the retired legends.
      const npc = knownCanon(ctx, (n) => {
        if (!hasTag(n, 'ally', 'friendly', 'romance', 'hero', 'human')) return false;
        if (hasTag(n, 'legend', 'elder', 'child', 'divine', 'guardian')) return false;
        const ch = getCanon(n.canonId);
        const age = ch ? ctx.year - ch.years[0] : 30;
        return age >= 18 && age <= 55 && (n.closeness || 0) > 25;
      });
      if (!npc) return null;
      return { ...npcSlot(npc), kid: generateFullName(ctx.rng, npc.raceId || 'earthling') };
    },
    title: (ctx, s) => `${s.npcName} Has News`,
    text: `{It is the ordinary kind of news, for once|Nobody is dying|It takes you a moment to change gear}.
      [npcName] {has a child|is a parent, which nobody saw coming|brings a very small person to meet you}. [kid].
      {They look terrified|They look happier than you have ever seen them|They have not slept in a month}.`,
    choices: (ctx, s) => [
      { id: 'godparent', label: 'Offer to be there for the child', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 20, trust: 20, respect: 8 });
        thread(c2, 'ward', sl.npcId, { title: `Watching over ${sl.kid}`, heat: 40, maxStage: 4 });
        fact(c2, `Promised ${sl.npcName} to look after ${sl.kid}.`, { type: 'bond', weight: 6, subject: sl.npcId, tags: ['family', 'canon'] });
        return { text: `{You say it before you think about it|"If anything happens, I have them"|They do not make a thing of it and neither do you}. `
          + `{It is a promise and you both know it|Twenty years from now this will matter|Nobody writes it down}.`,
        changes: apply(c2, { happiness: 16, karma: 8 }) };
      } },
      { id: 'gift', label: 'Bring something', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 10 });
        return { text: `{You bring #macguffin#, which is the wrong gift|You spend too much|You are not good at this and they know it}. `
          + `{They are delighted anyway|The child is asleep and misses all of it|It goes on a shelf}.`,
        changes: apply(c2, { zeni: -Math.min(c2.character.zeni, 20000), happiness: 10 }) };
      } },
      { id: 'distance', label: 'Congratulate them and keep training', effect: (c2, sl) => {
        const t = trainYear(c2, { intensity: 1.3 });
        return { text: `{You say the right things|You mean them|You are gone by the evening}. `
          + `{Other people's lives keep going in a direction yours does not|You are not sure you envy it|You go back to the mountain}. ${powerLine(t.gained)}`,
        changes: apply(c2, { happiness: -2 }) };
      } },
    ],
  },

  // ------------------------------------------------- the young ones grow into it
  {
    id: 'canon_child_grown', tags: ['canon', 'social', 'fight'], weight: 20,
    minBioAge: 16,
    when: (ctx) => quietYear(ctx) && ctx.year > 774,
    slots: (ctx) => {
      const npc = reachableCanon(ctx, (n) => hasTag(n, 'child', 'prodigy'));
      if (!npc) return null;
      const power = Math.round(canonDrift(npc, ctx.year));
      return { ...npcSlot(npc), theirPower: power, tier: powerTier(power) };
    },
    title: (ctx, s) => `${s.npcName} Is Not A Child Any More`,
    text: `{You have not seen them in years|The last time, they came up to your ribs|You do not recognise them at first}.
      [npcName]. {[tier], and climbing|They hit like their father|Whatever they were going to be, they are it now}.
      {They want to fight you|They have been waiting to ask|They are too polite to say so and it is written all over them}.`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Let them try you', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        return offerBattle(c2, {
          name: sl.npcName, power: sl.theirPower, canonId: npc && npc.canonId, npcId: sl.npcId,
          raceId: npc ? npc.raceId : 'other',
        }, { reason: 'spar', stakes: 'spar', intro: `They have been thinking about this for a long time.` });
      } },
      { id: 'teach', label: 'Teach them something', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 16, respect: 12, trust: 12 });
        const mine = c2.character.techniques;
        const give = mine.length ? c2.rng.pick(mine) : null;
        if (give && npc) npc.techniques = (npc.techniques || []).concat(give);
        const tech = give ? getTechnique(give) : null;
        fact(c2, `Taught ${sl.npcName} ${tech ? 'the ' + tech.name : 'something worth knowing'}.`,
          { type: 'teaching', weight: 6, subject: sl.npcId, tags: ['canon', 'legacy'] });
        return { text: `{They learn it in an afternoon, which is insulting|It takes them a week and you a decade|They are better at this than you were}. `
          + (tech ? `${tech.name}. ` : '')
          + `{Somebody will fight them one day and wonder where they got that|It is yours and now it is theirs|That is how this works}.`,
        changes: apply(c2, { happiness: 12, karma: 5, stats: { charisma: 3, technique: 2 } }) };
      } },
      { id: 'brush_off', label: 'Not today', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { tension: 8, respect: -4 });
        return { text: `{You tell them to come back when they are ready|They are ready|You are the one who is not}. `
          + `{They will remember this|"Fine," they say, and it is not fine|They go}.`, changes: [] };
      } },
    ],
  },

  // --------------------------------------------------------- old villains stir
  {
    id: 'canon_villain_stirs', tags: ['canon', 'world', 'threat'], weight: 16,
    minBioAge: 14,
    when: (ctx) => quietYear(ctx) && !ctx.character.inAfterlife,
    slots: (ctx) => {
      const year = ctx.year;
      const options = CANON.filter((ch) => canonAlive(ch, year)
        && ch.tags.some((t) => ['villain', 'threat', 'emperor', 'imperial'].includes(t))
        && !ch.tags.some((t) => ['omniking', 'destroyer', 'angel'].includes(t))
        && !(ctx.state.npcs['canon_' + ch.id] && ctx.state.npcs['canon_' + ch.id].alive === false));
      if (!options.length) return null;
      const ch = ctx.rng.pick(options);
      return {
        canonId: ch.id,
        npcName: ch.name,
        theirPower: Math.round(canonPower(ch, year)),
        where: ctx.rng.pick(['three systems over', 'on a moon nobody claims', 'in the old imperial sector',
          'somewhere in the outer worlds', 'closer than anyone is comfortable with']),
      };
    },
    title: (ctx, s) => `${s.npcName} Has Been Seen`,
    text: `{A trader will not stop talking about it|The broadcast cuts out mid-sentence|Somebody arrives with the wrong colour of fear in their face}.
      [npcName], [where]. {Doing what they do|Rebuilding something|Not hiding, which is the part that worries people}.
      {Nobody is going to deal with it|Everyone is waiting for somebody else|The people who used to handle this are old or dead}.`,
    choices: (ctx, s) => [
      { id: 'go', label: 'Go and deal with it', danger: true, effect: (c2, sl) => {
        const ch = getCanon(sl.canonId);
        return offerBattle(c2, {
          name: sl.npcName, power: sl.theirPower, canonId: sl.canonId, raceId: ch ? ch.race : 'other',
          techniques: ch && ch.teaches ? ch.teaches.slice(0, 3) : [],
        }, { reason: 'threat', stakes: 'lethal', protecting: true, intro: `${sl.npcName} is genuinely surprised somebody came.` });
      } },
      { id: 'warn', label: 'Warn the people who need warning', effect: (c2, sl) => {
        c2.character.flags.raised_alarm = true;
        fact(c2, `Was the one who noticed ${sl.npcName} was moving again.`, { type: 'history', weight: 5, tags: ['canon'] });
        return { text: `{You get word to everyone who matters|It takes months and most of your money|Some of them listen}. `
          + `{When it comes, people are ready|Nobody thanks you and that is fine|You are not the one who fights it, and that is a decision too}.`,
        changes: apply(c2, { karma: 10, fame: 6, zeni: -Math.min(c2.character.zeni, 40000) }) };
      } },
      { id: 'join', label: 'Go and offer to work for them', danger: true, effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.canonId, 'employer');
        if (npc) relate(c2, npc, { respect: 10, trust: 5 });
        c2.character.flags.served_a_tyrant = true;
        fact(c2, `Went to ${sl.npcName} and offered to be useful.`, { type: 'history', weight: 8, tags: ['canon', 'evil'] });
        const t = trainYear(c2, { intensity: 1.8, placeMult: 1.5 });
        return { text: `{They find it funny that you asked|You are put through something before they answer|They say yes, which is worse than no}. `
          + `{The work is exactly what you thought it would be|You are good at it|Nobody who knew you before is going to understand}. ${powerLine(t.gained)}`,
        changes: apply(c2, { karma: -25, fame: 12, zeni: 200000 }) };
      } },
      { id: 'ignore', label: 'It is not your problem', effect: (c2, sl) => {
        const t = trainYear(c2, { intensity: 1.2 });
        return { text: `{Somebody else will|You have your own year|You put it out of your head and it does not stay out}. ${powerLine(t.gained)}`,
        changes: apply(c2, { happiness: -4 }) };
      } },
    ],
  },

  // ---------------------------------------------------------- somebody dies old
  {
    id: 'canon_dies_old', noFatigue: true, tags: ['canon', 'world', 'loss', 'death'], weight: 14,
    minBioAge: 14,
    when: (ctx) => ctx.year > 780,
    slots: (ctx) => {
      const npc = knownCanon(ctx, (n) => {
        const ch = getCanon(n.canonId);
        if (!ch) return false;
        if (ch.years[1] !== null) return false;                 // canon says when they go
        if (ch.tags.some((t) => ['divine', 'omniking', 'destroyer', 'angel', 'dragon'].includes(t))) return false;
        const age = ctx.year - ch.years[0];
        return age > 70 && (n.closeness || 0) > 20;
      });
      if (!npc) return null;
      const ch = getCanon(npc.canonId);
      return { ...npcSlot(npc), theirAge: ctx.year - ch.years[0] };
    },
    title: (ctx, s) => `${s.npcName}`,
    text: `{Nothing killed them|It was not a fight|There was no warning and there did not need to be}.
      [npcName] {died in their sleep|stopped, at [theirAge]|is gone, at [theirAge], of nothing at all}.
      {After everything|After all of it|They outlived most of the things that tried}.`,
    choices: (ctx, s) => [
      { id: 'attend', label: 'Go to it', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) { npc.alive = false; npc.causeOfDeath = 'Old age'; npc.deadSince = c2.year; }
        fact(c2, `${sl.npcName} died at ${sl.theirAge}. You were there.`, { type: 'death', weight: 9, subject: sl.npcId, tags: ['canon', 'loss'] });
        return { text: `{Everyone is there|It is smaller than you expected|People who have not spoken in twenty years stand next to each other}. `
          + `{Nobody knows what to say and they say it anyway|Somebody tells a story you have never heard|You leave before the end}. #grief#`,
        changes: apply(c2, { happiness: -18, stats: { discipline: 3 } }) };
      } },
      { id: 'balls', label: 'Go and get the Dragon Balls', hint: 'They died of age. The dragon may have opinions.', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) { npc.alive = false; npc.causeOfDeath = 'Old age'; npc.deadSince = c2.year; }
        thread(c2, 'revival', sl.npcId, { title: `Bringing ${sl.npcName} back`, heat: 80, maxStage: 3 });
        fact(c2, `Started gathering the Dragon Balls for ${sl.npcName}, who died of nothing but time.`,
          { type: 'quest', weight: 7, subject: sl.npcId, tags: ['dragonball', 'canon'] });
        return { text: `{You are on the road before the service|Somebody says it is not what they would have wanted|You go anyway}. `
          + `{The dragon does not always say yes to this one|Old age is different and everybody knows it|It is worth finding out}.`,
        changes: apply(c2, { happiness: -8, stats: { discipline: 4 } }) };
      } },
      { id: 'alone', label: 'Not go', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (npc) { npc.alive = false; npc.causeOfDeath = 'Old age'; npc.deadSince = c2.year; }
        fact(c2, `${sl.npcName} died at ${sl.theirAge}. You did not go.`, { type: 'death', weight: 8, subject: sl.npcId, tags: ['canon', 'loss'] });
        return { text: `{You cannot|You train that day instead and it does not help|You find out where they are buried a year later}. #grief#`,
        changes: apply(c2, { happiness: -22 }) };
      } },
    ],
  },

  // --------------------------------------------------- the long peace, properly
  {
    id: 'long_peace', tags: ['canon', 'world', 'life'], weight: 22,
    minBioAge: 16,
    when: (ctx) => ctx.year >= 790 && quietYear(ctx) && !ctx.character.inAfterlife,
    slots: (ctx) => {
      const npc = knownCanon(ctx, () => true);
      return {
        who: npc ? npc.name : 'somebody you used to fight beside',
        npcId: npc ? npc.id : null,
        years: ctx.year - 790,
        scene: ctx.rng.pick([
          'a fishing trip that nobody calls a fishing trip',
          'a tournament for children, with an announcer who takes it far too seriously',
          'a house with too many people in it and not enough chairs',
          'a stretch of coastline that has never had a crater in it',
          'an anniversary of something that nearly ended the world',
          'a very long, very boring afternoon',
        ]),
      };
    },
    title: 'Nothing Is Happening',
    text: `{It has been [years] years since anything tried to end the world|[years] quiet years|Nobody has had to save anything in [years] years}.
      {There is [scene]|Somebody organises [scene]|It comes down to [scene]}.
      {[who] is there|[who] came|Everyone is older and nobody says so}.`,
    choices: (ctx, s) => [
      { id: 'enjoy', label: 'Let it be a good day', effect: (c2, sl) => {
        const npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (npc) relate(c2, npc, { closeness: 12, trust: 8 });
        return { text: `{You do not train|Nobody mentions power levels once|It is the best day of the decade and it is completely unremarkable}. `
          + `{This is what all of it was for|You forget to be ready for something|#joy#}.`,
        changes: apply(c2, { happiness: 22, health: 8 }) };
      } },
      { id: 'restless', label: 'You cannot sit still', effect: (c2, sl) => {
        const t = trainYear(c2, { intensity: 1.7 });
        c2.character.flags.restless_in_peace = true;
        return { text: `{You last about an hour|Somebody watches you leave and does not say anything|You are not built for this and you know it}. `
          + `{The mountain does not mind|You are the only thing left to fight|Peace is harder work than the other thing}. ${powerLine(t.gained)}`,
        changes: apply(c2, { happiness: -8, health: -6, stats: { discipline: 3 } }) };
      } },
      { id: 'teach', label: 'Put it into the next lot', effect: (c2, sl) => {
        const student = stranger(c2, { relation: 'student', minAge: 8, maxAge: 18 });
        if (student) relate(c2, student, { respect: 30, trust: 25, closeness: 15 });
        fact(c2, `Took a student in the long peace.`, { type: 'teaching', weight: 5, tags: ['legacy'] });
        return { text: `{One of the children will not leave you alone|Somebody's grandchild asks you a question and means it|You say yes before you decide to}. `
          + `{They are hopeless|They are not hopeless, which is worse|You have twenty years of this ahead of you}.`,
        changes: apply(c2, { happiness: 14, karma: 6, stats: { charisma: 4 } }) };
      } },
    ],
  },
]);
