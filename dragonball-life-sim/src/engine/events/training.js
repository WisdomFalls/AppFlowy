// Training, mentors, techniques and transformations - the spine of a Dragon
// Ball life. Outcomes are computed from stats and place, never fixed.

import { registerEvents, pickNpc, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, meetCanon, canonHere,
  odds, moveTo, findNpc, canonPower, getCanon } from './helpers.js';
import { TECHNIQUES, TECH_BY_ID, availableTechniques, getTechnique, BRANCHES } from '../../data/techniques.js';
import { TRANSFORMATIONS, ladderFor, getTransformation } from '../../data/transformations.js';
import { generateSignatureName } from '../../data/names.js';
import { numberish } from '../text.js';
import { getPlace } from '../../data/places.js';
import { unlockableForms, tryUnlockForm, describeRequirement } from '../progression.js';
import { zenkaiBoost } from '../stats.js';

const FOCUSES = [
  { id: 'strength', name: 'Raw strength', stats: { strength: 5, durability: 2 }, intensity: 1.3 },
  { id: 'speed', name: 'Speed drills', stats: { speed: 5, technique: 2 }, intensity: 1.2 },
  { id: 'ki', name: 'Ki control', stats: { kiControl: 5, technique: 2 }, intensity: 1.0 },
  { id: 'form', name: 'Forms and technique', stats: { technique: 5, discipline: 2 }, intensity: 1.0 },
  { id: 'endurance', name: 'Endurance', stats: { durability: 5, discipline: 3 }, intensity: 1.4 },
  { id: 'meditation', name: 'Meditation', stats: { discipline: 5, kiControl: 3, intellect: 2 }, intensity: 0.7 },
];

registerEvents([
  {
    id: 'training_year', tags: ['training'], weight: 30,
    minBioAge: 5,
    slots: (ctx) => {
      const focus = ctx.rng.pick(FOCUSES);
      return { focusId: focus.id, focusName: focus.name, scene: ctx.rng.pick(['#trainScene#']) };
    },
    title: 'Training',
    text: `You spend the year on #trainScene#, #trainVerb#. {Nobody is watching|Nobody comes to watch|Somebody watches from a distance and says nothing}. #trainResult#`,
    choices: (ctx) => FOCUSES.map((f) => ({
      id: f.id,
      label: f.name,
      hint: Object.entries(f.stats).map(([k, v]) => `+${v} ${k}`).join(', '),
      effect: (c2) => {
        const t = trainYear(c2, { intensity: f.intensity });
        const changes = apply(c2, {
          stats: f.stats,
          health: -Math.round(f.intensity * 4) - (t.injury ? t.injury : 0),
          happiness: f.id === 'meditation' ? 4 : -1,
          ki: 10,
        });
        let text = `#trainResult# ${powerLine(t.gained)}`;
        if (t.injury) text += ` You {tear something|break something|do damage} doing it.`;
        return { text, changes };
      },
    })),
  },

  {
    id: 'plateau', tags: ['training', 'setback'], weight: 14,
    minBioAge: 12,
    when: (ctx) => ctx.character.age > 14,
    slots: () => ({}),
    title: 'The Wall',
    text: `{Nothing is working|You have not improved in months|The numbers have stopped moving}.
      {You train harder and get slower|Every session ends the same|Whatever you used to have, it is not arriving}.`,
    choices: () => [
      { id: 'grind', label: 'Grind straight through it', effect: (ctx) => {
        if (odds(ctx, 0.5)) {
          const t = trainYear(ctx, { intensity: 1.6 });
          const changes = apply(ctx, { health: -12, stats: { discipline: 5 } });
          return { text: `{One morning it simply gives|It breaks on a Tuesday, for no reason|Something releases}. ${powerLine(t.gained)}`, changes };
        }
        const changes = apply(ctx, { health: -16, happiness: -10, stats: { discipline: 2 } });
        return { text: `The wall does not move. You {hurt yourself badly|break your own hand on it|lose the year} and it is still there.`, changes };
      } },
      { id: 'rest', label: 'Stop entirely for a while', effect: (ctx) => {
        const changes = apply(ctx, { health: 18, happiness: 10, stats: { intellect: 2 } });
        const t = trainYear(ctx, { intensity: 0.4 });
        return { text: `You {put it down|walk away from it|do something else entirely} for months. When you come back {it has moved|your body has caught up|the wall is somewhere behind you}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'change', label: 'Change everything about how you train', effect: (ctx) => {
        const changes = apply(ctx, { stats: { technique: 5, kiControl: 4, strength: -2 }, happiness: 3 });
        const t = trainYear(ctx, { intensity: 1.1 });
        return { text: `You {throw out the whole routine|start again from stance work|copy somebody whose style you hate}. It feels like going backwards for {months|a long time}. It is not. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'seek_mentor', noFatigue: true, tags: ['training', 'mentor', 'opportunity'], weight: 22,
    minBioAge: 8,
    when: (ctx) => ctx.character.mentors.length < 4,
    slots: (ctx) => {
      // A teacher has to be old enough to have learned it and strong enough to
      // be worth learning from.
      const pool = canonHere(ctx, (c) => c.teaches && c.teaches.length
        && !ctx.character.mentors.includes(c.id)
        && (ctx.year - c.years[0]) >= 16
        && canonPower(c, ctx.year) > ctx.power * 0.6
        && c.teaches.some((t) => !ctx.character.techniques.includes(t)));
      if (!pool.length) return null;
      const m = ctx.rng.pick(pool);
      return { mentorId: m.id, mentorName: m.name, mentorPersona: m.personality, mentorQuirk: m.quirk, mentorHome: getPlace(m.home).name };
    },
    title: (ctx, s) => `Finding ${s.mentorName}`,
    text: `{You hear about|Somebody points you toward|A rumour puts} [mentorName] {at|near|somewhere around} [mentorHome].
      [mentorPersona] [mentorQuirk]`,
    choices: (ctx, s) => [
      { id: 'ask', label: `Ask ${s.mentorName} to train you`, effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.mentorId, 'mentor');
        const c = c2.character;
        const charm = (c.stats.charisma + c.stats.discipline) / 2;
        const accepted = odds(c2, 0.35 + charm / 220 + (c.karma > 20 ? 0.12 : 0) + (c.fame > 30 ? 0.1 : 0));
        if (!accepted) {
          relate(c2, npc, { respect: -4, note: 'Turned you away.' });
          const changes = apply(c2, { happiness: -6, stats: { discipline: 2 } });
          return { text: `${sl.mentorName} {looks you over and says no|tells you to come back when you are worth the time|does not even stop walking}. {You go away and train anyway|It stings|You will ask again}.`, changes };
        }
        c.mentors.push(sl.mentorId);
        npc.relation = 'mentor';
        const canonRecord = getCanon(sl.mentorId);
        for (const f of (canonRecord && canonRecord.grantsFlags) || []) c.flags[f] = true;
        relate(c2, npc, { closeness: 20, respect: 25, note: 'Took you on.' });
        const canonChar = npc;
        const teachable = (canonChar.techniques || []).filter((t) => !c.techniques.includes(t));
        let learned = null;
        if (teachable.length) {
          learned = c2.rng.pick(teachable);
          c.techniques.push(learned);
          c2.state.stats.techniquesLearned++;
        }
        const t = trainYear(c2, { intensity: 1.3, mentorMult: 1.6 });
        const changes = apply(c2, { stats: { discipline: 5, technique: 4 }, health: -10, happiness: 8 });
        fact(c2, `Trained under ${sl.mentorName}.`, { type: 'mentor', weight: 5, subject: npc.id, tags: ['mentor', 'canon'] });
        thread(c2, 'mentor', npc.id, { title: `Student of ${sl.mentorName}`, heat: 40, maxStage: 4 });
        return {
          text: `${sl.mentorName} {agrees|says yes, eventually|sets a condition and you meet it}. The first year is {mostly humiliation|chores|being knocked down}. ${learned ? `By the end of it you can do the ${TECH_BY_ID[learned].name}.` : `By the end of it you move differently.`} ${powerLine(t.gained)}`,
          changes,
        };
      } },
      { id: 'watch', label: 'Watch from a distance and steal the technique', hint: 'Faster. They will find out.',
        effect: (c2, sl) => {
          const npc = meetCanon(c2, sl.mentorId, 'acquaintance');
          const c = c2.character;
          const success = odds(c2, 0.25 + c.stats.technique / 300 + c.stats.intellect / 400);
          if (success) {
            const teachable = (npc.techniques || []).filter((t) => !c.techniques.includes(t));
            if (teachable.length) {
              const learned = c2.rng.pick(teachable);
              c.techniques.push(learned);
              c2.state.stats.techniquesLearned++;
              relate(c2, npc, { tension: 20, respect: 8 });
              fact(c2, `Copied the ${TECH_BY_ID[learned].name} by watching ${sl.mentorName}.`, { type: 'technique', weight: 4, tags: ['technique', 'theft'] });
              const changes = apply(c2, { stats: { technique: 4, intellect: 2 }, karma: -4 });
              return { text: `You watch for {weeks|a season|long enough}, from {a ridge|the treeline|a rooftop}. Then you go somewhere empty and do it yourself. It works on the {fourth|ninth|hundredth} attempt: the ${TECH_BY_ID[learned].name}, in your hands, unearned.`, changes };
            }
          }
          relate(c2, npc, { tension: 25, respect: -5 });
          const changes = apply(c2, { happiness: -5, karma: -3 });
          return { text: `${sl.mentorName} {knows you are there|knew immediately|lets you watch and shows you nothing that matters}. {You learn only that you were noticed|You come away with nothing|It is a wasted season}.`, changes };
        } },
      { id: 'skip', label: 'Train alone. You do not need anyone.', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.3 });
        const changes = apply(c2, { stats: { discipline: 4 }, happiness: -2 });
        return { text: `{You have your own methods|Teachers slow you down|You would rather find it yourself}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'technique_study', noFatigue: true, tags: ['training', 'technique'], weight: 24,
    minBioAge: 8,
    slots: (ctx) => {
      const pool = availableTechniques(ctx.character).filter((t) => {
        for (const [k, v] of Object.entries(t.stat || {})) {
          if ((ctx.character.stats[k] || 0) < v * 0.75) return false;
        }
        return true;
      });
      if (!pool.length) return null;
      const t = ctx.rng.weighted(pool, (x) => 1 / (1 + x.tier));
      return { techId: t.id, techName: t.name, techDesc: t.desc, branch: BRANCHES[t.branch].name };
    },
    title: (ctx, s) => `Learning: ${s.techName}`,
    text: `{You have been working on|You keep coming back to|Somebody left you a diagram of} [techName]. [techDesc]
      {It is not going well|The first hundred attempts do nothing|You can feel the shape of it and not the thing}.`,
    choices: (ctx, s) => [
      { id: 'grind', label: `Drill it until it works`, effect: (c2, sl) => {
        const tech = getTechnique(sl.techId);
        const c = c2.character;
        let score = 0;
        for (const [k, v] of Object.entries(tech.stat || {})) score += (c.stats[k] || 0) - v;
        const chance = 0.35 + score / 120 + (c.stats.discipline - 50) / 200;
        if (odds(c2, chance)) {
          c.techniques.push(tech.id);
          c2.state.stats.techniquesLearned++;
          fact(c2, `Learned the ${tech.name}.`, { type: 'technique', weight: 3, tags: ['technique'] });
          const changes = apply(c2, { stats: { technique: 3, kiControl: 2 }, happiness: 10, health: -5 });
          return { text: `{It takes months|It takes the whole year|It takes longer than it should}. Then, once, cleanly, it works. Then it works again. ${tech.name}, learned.`, changes };
        }
        const changes = apply(c2, { health: -8, happiness: -5, stats: { discipline: 3 } });
        return { text: `{You cannot make it happen|The energy goes everywhere except where you put it|You burn your own hands twice}. You will come back to it.`, changes };
      } },
      { id: 'skip', label: 'Leave it. Train something you can already do.', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.1 });
        const changes = apply(c2, { stats: { strength: 2, speed: 2 } });
        return { text: `{You put the diagram away|You go back to what works|There is no shame in fundamentals}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'invent_technique', once: true, tags: ['training', 'technique', 'discovery'], weight: 10,
    minBioAge: 15,
    when: (ctx) => !ctx.character.signature && ctx.character.techniques.length >= 4 && ctx.character.stats.technique > 55,
    slots: (ctx) => ({ proposed: generateSignatureName(ctx.rng) }),
    title: 'Something Of Your Own',
    text: `{You have been building it for years without noticing|It starts as a mistake in a drill|Nobody taught you this one}.
      A movement that is yours: {a way of folding the ki|a stance nobody else uses|a strike that comes from the wrong angle}.
      {It needs a name|You should name it|Everything needs a name eventually}.`,
    choices: (ctx, s) => [
      { id: 'name', label: `Call it the ${s.proposed}`, effect: (c2, sl) => {
        c2.character.signature = { name: sl.proposed, year: c2.year };
        const changes = apply(c2, { stats: { technique: 6, kiControl: 4, charisma: 2 }, happiness: 12, fame: 4 });
        fact(c2, `Invented a signature technique: the ${sl.proposed}.`, { type: 'signature', weight: 5, tags: ['technique', 'identity'] });
        return { text: `The ${sl.proposed}. {You say it out loud once, alone, and feel ridiculous|It sounds better than it should|Nobody else will ever say it without you correcting their pronunciation}.`, changes };
      } },
      { id: 'reroll', label: 'It needs a better name', effect: (c2) => {
        const name = generateSignatureName(c2.rng);
        c2.character.signature = { name, year: c2.year };
        const changes = apply(c2, { stats: { technique: 6, kiControl: 4 }, happiness: 10, fame: 4 });
        fact(c2, `Invented a signature technique: the ${name}.`, { type: 'signature', weight: 5, tags: ['technique', 'identity'] });
        return { text: `You settle on the ${name} {at three in the morning|after weeks of trying|on the spot, and never change it}.`, changes };
      } },
      { id: 'nameless', label: 'Leave it unnamed', effect: (c2) => {
        const changes = apply(c2, { stats: { technique: 5, kiControl: 4, discipline: 3 } });
        c2.character.flags.nameless_technique = true;
        return { text: `You never name it. {Opponents describe it afterwards, badly|It has no name and it still lands|Let them call it whatever they like}.`, changes };
      } },
    ],
  },

  {
    id: 'transformation_edge', noFatigue: true, tags: ['training', 'transformation'],
    weight: (ctx) => 26 + unlockableForms(ctx.state).length * 40,
    minBioAge: 10,
    when: (ctx) => unlockableForms(ctx.state).length > 0,
    slots: (ctx) => {
      const forms = unlockableForms(ctx.state);
      if (!forms.length) return null;
      const f = ctx.rng.pick(forms);
      return { formId: f.id, formName: f.name, formDesc: f.desc, formHint: f.hint };
    },
    title: (ctx, s) => `The Edge of ${s.formName}`,
    text: `{Something is close|You can feel it|It is right there and it will not come}.
      [formDesc] [formHint]`,
    choices: (ctx, s) => [
      { id: 'reach', label: `Reach for it`, hint: 'It may take everything you have.', effect: (c2, sl) => {
        const res = tryUnlockForm(c2.state, c2.rng, sl.formId);
        if (res.unlocked) {
          const changes = apply(c2, { happiness: 20, health: -18, ki: -30, fame: 6, stats: { discipline: 3 } });
          fact(c2, `Achieved ${sl.formName}.`, { type: 'transformation', weight: 8, tags: ['transformation', 'milestone'] });
          return { text: `${res.text} {You hold it for eleven seconds and then the world goes sideways|It lasts a moment and it is enough|When it fades you are on your knees, laughing}. ${sl.formName}. It is yours.`, changes };
        }
        const changes = apply(c2, { health: -20, happiness: -8, ki: -20 });
        return { text: `${res.text} {You get to the edge of it and no further|Something in you refuses|It is not the technique that is missing}.`, changes };
      } },
      { id: 'wait', label: 'Not yet. Get stronger first.', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.35 });
        const changes = apply(c2, { health: -8, stats: { discipline: 4 } });
        return { text: `{You leave it alone|You go back to the basics|Not this year}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'time_chamber', maxUses: 2, tags: ['training', 'extreme', 'opportunity'], weight: 20,
    minBioAge: 12,
    when: (ctx) => ctx.character.placeId === 'lookout' || ctx.flag('lookout_access'),
    slots: () => ({}),
    title: 'The Hyperbolic Time Chamber',
    text: `A year inside for a day outside. {White in every direction|No horizon, no walls, no sound|The gravity is ten times Earth and the air fights you}.
      {Two people at a time, once in a lifetime, they say|The rule is one year|You are told the rule and you are told nobody keeps it}.`,
    choices: (ctx) => [
      { id: 'year', label: 'One year inside', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.5, placeMult: 12 });
        const changes = apply(c2, { health: -25, happiness: -18, stats: { discipline: 8, durability: 5, kiControl: 4 } });
        c2.character.flags.used_chamber = true;
        fact(c2, 'Spent a year inside the Hyperbolic Time Chamber.', { type: 'training', weight: 6, tags: ['extreme'] });
        return { text: `{The first month is the worst|You lose track of time immediately|There is nothing to look at and nothing to hear}. You come out {a day later|the next morning}, {a year older and unrecognisable|changed|with a beard and a completely different body}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'two', label: 'Two years. Stay past the safe limit.', danger: true, effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.7, placeMult: 22 });
        c2.character.flags.used_chamber = true;
        if (odds(c2, 0.3)) {
          const changes = apply(c2, { health: -45, happiness: -35, stats: { discipline: 10, intellect: -4 } });
          fact(c2, 'Stayed too long in the Time Chamber and came out wrong.', { type: 'training', weight: 7, tags: ['extreme', 'damage'] });
          return { text: `You stop counting {somewhere in the second year|after a while|early}. When the door opens you {do not want to leave|have forgotten what colour is|say nothing for three days}. ${powerLine(t.gained)}`, changes };
        }
        const changes = apply(c2, { health: -32, happiness: -22, stats: { discipline: 12, durability: 7, kiControl: 6 } });
        fact(c2, 'Spent two years in the Time Chamber and came out standing.', { type: 'training', weight: 7, tags: ['extreme'] });
        return { text: `Two years of white. {You talk to yourself for the last six months|You invent a game and lose it|You do not remember most of it}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'decline', label: 'Not this time', effect: () => ({ text: `{The door stays shut|You are not ready and you know it|Some other year}.` }) },
    ],
  },

  // A second chamber, and deliberately not a reskin of the first. The
  // Lookout's is one year in for one day out; Merus built this one for the
  // Patrol on his own terms, and the conversion does not match - three years
  // pass inside it for every day lost outside, which trainYear() reflects
  // honestly by being called three times over rather than just tripling one
  // number and calling it done.
  {
    id: 'isp_time_chamber', maxUses: 2, tags: ['training', 'extreme', 'opportunity', 'faction'], weight: 16,
    minBioAge: 12,
    when: (ctx) => ctx.character.faction === 'galactic_patrol' && (ctx.character.factionRank || 0) >= 2,
    slots: () => ({}),
    title: "Merus's Chamber",
    text: `The Patrol has one too, built - or grown, nobody quite agrees on the word - by Merus himself, and it does not run on the same clock the Lookout's does.
      {Three years pass in there for every one lost out here|The conversion is steeper than the original and nobody has fully explained why|Merus says the ratio "settled" on its own, which is not an answer}.
      They do not offer this to every cadet who asks.`,
    choices: (ctx) => [
      { id: 'session', label: 'Go inside', effect: (c2) => {
        let gained = 0;
        for (let i = 0; i < 3; i++) gained += trainYear(c2, { intensity: 1.55, placeMult: 13 }).gained;
        const changes = apply(c2, { health: -30, happiness: -20, stats: { discipline: 9, kiControl: 6, durability: 4 } });
        c2.character.flags.used_isp_chamber = true;
        fact(c2, "Spent a stretch inside Merus's chamber with the Patrol.", { type: 'training', weight: 6, tags: ['extreme', 'faction'] });
        return { text: `{Three years pass by the chamber's own reckoning, one outside|`
          + `You lose count of the days almost immediately, and it does not matter, because the days are not the ones that count|`
          + `Whatever Merus did to that room, it is not shy about the difference}. `
          + `You come out {a day later|the next morning}, {three years changed|barely recognisable to yourself}. `
          + `Power level up ${numberish(gained)}.`, changes };
      } },
      { id: 'decline', label: 'Not this time', effect: () => ({ text: `{The offer stands|Merus does not push|Some other rotation}.` }) },
    ],
  },

  {
    id: 'sparring_partner', tags: ['training', 'social'], weight: 18,
    minBioAge: 10,
    slots: (ctx) => {
      const pool = ctx.npcs.filter((n) => n.power > 1 && ['friend', 'bestfriend', 'rival', 'sibling', 'student', 'spouse'].includes(n.relation));
      const npc = pool.length ? ctx.rng.pick(pool) : null;
      if (!npc) return null;
      return npcSlot(npc);
    },
    title: (ctx, s) => `Sparring with ${s.npcName}`,
    text: `[npcName] {turns up|is already there|has been waiting}. {No stakes|Nothing on the line|Just work}.
      #trainScene# #daypart#.`,
    choices: (ctx, s) => [
      { id: 'hold', label: 'Hold back. Keep it friendly.', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const t = trainYear(c2, { intensity: 0.9, mentorMult: 1.15 });
        relate(c2, npc, { closeness: 8, respect: 4, note: 'Sparred all year.' });
        const changes = apply(c2, { happiness: 8, health: -4, stats: { technique: 3 } });
        return { text: `You go {light|at half|carefully} and it is {the best part of the year|good|the only fun either of you has}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'full', label: 'Go all out', danger: true, effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const t = trainYear(c2, { intensity: 1.5, mentorMult: 1.3 });
        const hurtThem = odds(c2, 0.35);
        relate(c2, npc, { closeness: hurtThem ? -8 : 4, respect: 12, tension: hurtThem ? 18 : 2, power: 1.06,
          note: hurtThem ? 'You hurt them badly in training.' : 'Trained hard together.' });
        const changes = apply(c2, { health: -14, stats: { strength: 3, durability: 3 }, happiness: hurtThem ? -4 : 5 });
        return { text: hurtThem
          ? `You {go too far|do not stop when you should|break something of theirs}. ${npc.name} {does not say much afterwards|forgives you out loud and not otherwise|is out for two months}. ${powerLine(t.gained)}`
          : `Neither of you {holds anything back|calls it|stops until dark}. You both come out of it better. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'teach', label: 'Teach them instead', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 14, respect: 20, power: 1.35, relation: npc.relation === 'rival' ? 'rival' : 'student', note: 'You taught them.' });
        const changes = apply(c2, { stats: { technique: 4, charisma: 3, discipline: 2 }, happiness: 10 });
        fact(c2, `Taught ${npc.name} what they know.`, { type: 'teaching', weight: 3, subject: npc.id, tags: ['mentor'] });
        return { text: `{Teaching is harder than doing|You find out what you actually understand|They learn faster than you did}. ${npc.name} {improves visibly|gets frighteningly good|surpasses where you were at their age}.`, changes };
      } },
    ],
  },

  {
    id: 'gravity_accident', tags: ['training', 'setback'], weight: 16,
    minBioAge: 12,
    when: (ctx) => ctx.character.items.includes('gravity_chamber')
      || ctx.character.items.includes('gravity_capsule')
      || ctx.place.tags.includes('gravity') || ctx.place.tags.includes('highgrav'),
    slots: (ctx) => ({ g: ctx.rng.pick([150, 200, 300, 400, 450, 500]) }),
    title: 'Gravity Chamber Failure',
    text: `You have it at [g] times Earth normal. {Something in the regulator goes|The safety cuts out|You hear the wrong sound}
      and then {the floor comes up to meet you|you weigh six tonnes|everything folds}.`,
    choices: () => [
      { id: 'crawl', label: 'Crawl to the controls', effect: (ctx) => {
        if (odds(ctx, 0.6)) {
          const changes = apply(ctx, { health: -22, stats: { durability: 6, discipline: 4 } });
          const t = trainYear(ctx, { intensity: 1.2 });
          return { text: `Three metres. {It takes eleven minutes|You do not remember doing it|Your ribs go on the way}. You hit the cutoff and lie there {laughing|not moving|for an hour}. ${powerLine(t.gained)}`, changes };
        }
        const changes = apply(ctx, { health: -45, happiness: -10 });
        let text = `You do not make it. {Somebody finds you|The chamber vents automatically|You wake up in a bed}, {days later|much later|with a lot of things broken}.`;
        // Zenkai (or its weaker half-blood form) is a body answering a near-death,
        // not a species tag - anyone who has it gets the boost, scaled by how much.
        const gain = zenkaiBoost(ctx.character, ctx.rng, 1.1);
        if (gain > 0) {
          text += ` {Your body does this|When you can stand again you are stronger than you were|Nearly dying agreed with you}. ${powerLine(gain)}`;
        }
        return { text, changes };
      } },
      { id: 'blast', label: 'Blast the wall out', effect: (ctx) => {
        const changes = apply(ctx, { health: -14, zeni: -Math.min(ctx.character.zeni, 400000), stats: { kiControl: 3 } });
        return { text: `You put a hole in {a machine worth more than your house|somebody else's very expensive equipment|the wall} and walk out through it. {The repair bill arrives within the week|Bulma is not pleased|Nobody offers to fix it}.`, changes };
      } },
    ],
  },

  {
    id: 'meditation_insight', tags: ['training', 'quiet'], weight: 12,
    minBioAge: 12,
    when: (ctx) => ctx.character.stats.discipline > 45,
    slots: () => ({}),
    title: 'Stillness',
    text: `{You sit|You stop|You do nothing at all} for {days|a season|longer than is reasonable}.
      {No training|No movement|Nothing but breathing}. #ambience#`,
    choices: () => [
      { id: 'deep', label: 'Go deeper', effect: (ctx) => {
        const changes = apply(ctx, { stats: { kiControl: 6, discipline: 5, intellect: 3 }, happiness: 8, ki: 40 });
        if (odds(ctx, 0.25)) {
          fact(ctx, 'Saw something in meditation that has not happened yet.', { type: 'vision', weight: 4, tags: ['mystic'] });
          ctx.character.flags.had_vision = true;
          return { text: `Somewhere in the third week you {see something|stop being in the room|find something waiting}. {A place you have never been|A face|A shape in the dark that turns to look at you}. You do not know what it means yet.`, changes };
        }
        return { text: `#trainResult# {Your ki settles into something you can actually hold|The noise stops|You find the bottom of it}.`, changes };
      } },
      { id: 'up', label: 'Get up. This is not training.', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 1.3 });
        const changes = apply(ctx, { stats: { strength: 3, speed: 2 }, happiness: -1 });
        return { text: `{Sitting still has never made anyone stronger|You are not built for it|You last four days}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },
]);
