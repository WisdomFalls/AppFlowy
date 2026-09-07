// Player-initiated activities. Events are what happens to you; these are what
// you do about it. Each resolves immediately and costs part of the year.

import { clamp } from '../rng.js';
import { render } from '../text.js';
import { adjust, findNpc, livingNpcs, currentYear, addNpc } from '../state.js';
import { addFact } from '../memory.js';
import { trainingRate, combatPower, powerTier, kiMaxFor, STAT_LABELS } from '../stats.js';
import { fight, narrateFight, describeGap } from '../combat.js';
import { TECHNIQUES, TECH_BY_ID, availableTechniques, getTechnique } from '../../data/techniques.js';
import { getTransformation } from '../../data/transformations.js';
import { unlockableForms, tryUnlockForm, nearbyForms } from '../progression.js';
import { getPlace, PLACES } from '../../data/places.js';
import { getItem, ITEMS } from '../../data/items.js';
import { liveShopStock, demandFor, isImportedHere, tradeRelationships } from '../market.js';
import { buyItem, valueHere, hasItem } from '../inventory.js';
import { topicsFor, converse } from '../conversation.js';
import { homeOptions, settleHome, homeOf } from '../settlement.js';
import { currencyFor, formatMoney, balance, priceIn, canAfford, debit } from '../../data/currency.js';
import { CAREERS, getCareer, careersFor } from '../../data/jobs.js';
import { getRace, hasPerk } from '../../data/races.js';
import { actionBlocked, ageGate, chargeAction, grantTrainingPower, costLabel,
  limitFor, usedThisYear, trainingRoomLeft } from '../economy.js';
import { makeNpc, bondScore, relationLabel } from '../npc.js';
import { canonAvailable, canonPower, canonPlace, canonUniverse } from '../../data/canon.js';
import { ensureBallSet, ballsHeld, startHunt, surveyPlanet, ballsAreInert, summonReady } from '../dragonballs.js';
import { startTrial, STAT_TRIALS, TRIAL_KINDS, getMastery, masteryEffect, inventForm } from '../trials.js';
import { createTournament, autoRunTournament, settle } from '../tournament.js';
import { travelOptions, travelTo, actOnWorld, standingOn } from '../worlds.js';
import { getPlanet, PLANETS, planetExists } from '../../data/planets.js';
import { generateFullName, generateSignatureName } from '../../data/names.js';
import { zeni, numberish } from '../text.js';

function fact(state, text, opts = {}) {
  return addFact(state.memory, {
    type: opts.type || 'action', text, year: state.character.age,
    weight: opts.weight ?? 1, subject: opts.subject || null, tags: opts.tags || [],
  });
}

function trainOnce(state, rng, opts = {}) {
  const c = state.character;
  const place = getPlace(c.placeId);
  const gearMult = c.items.includes('gravity_chamber') ? 2.1
    : c.items.includes('gravity_capsule') ? 1.6
      : c.items.includes('heavy_weights') ? 1.4
        : c.items.includes('weighted_clothing') ? 1.25 : 1;
  const rate = trainingRate(c, {
    state,
    intensity: opts.intensity ?? 1,
    placeMult: place.training,
    gearMult,
    mentorMult: opts.mentorMult ?? 1,
  }) * (opts.slice ?? 0.45);
  // Routed through the yearly ceiling: an hour of clicking cannot outrun a year.
  const requested = Math.max(1, Math.round(c.power * rate));
  const { granted, capped } = grantTrainingPower(state, requested);
  return { gained: granted, capped };
}

export const ACTIONS = [
  // ------------------------------------------------------------- training
  {
    id: 'train_stat', maxPerYear: 4, minMaturity: 3, tooYoung: 'You are too small to train. Play, for now.', slots: 2, name: 'Train', cat: 'body',
    desc: 'Pick what you are working on. Each attribute has its own trial.',
    available: (s) => s.character.age >= 3,
    options: () => Object.entries(STAT_TRIALS).map(([stat, cfg]) => ({
      id: stat,
      label: STAT_LABELS[stat],
      hint: `${TRIAL_KINDS[cfg.kind].name} trial - ${cfg.method}`,
    })),
    run: (s, rng, params) => {
      const stat = (params && params.option) || 'strength';
      const cfg = STAT_TRIALS[stat] || STAT_TRIALS.strength;
      const current = s.character.stats[stat] || 50;
      // The better you already are, the harder it gets to move the number.
      const difficulty = clamp(1 + Math.floor(current / 24), 1, 5);
      s.character.flags.trainedHardThisYear = true;
      const trial = startTrial(s, rng, {
        kind: cfg.kind,
        difficulty,
        purpose: 'training',
        label: STAT_LABELS[stat],
        blurb: cfg.method,
        payload: { stat },
      });
      return { text: cfg.method, trial };
    },
  },
  {
    id: 'meditate', maxPerYear: 4, minMaturity: 5, tooYoung: 'Sitting still on purpose is beyond you yet.', slots: 1, name: 'Meditate', cat: 'mind', cost: 'A season',
    desc: 'Ki control, discipline and a calmer head. Harder than it sounds.',
    available: () => true,
    run: (s, rng) => {
      const difficulty = clamp(1 + Math.floor((s.character.stats.kiControl || 50) / 24), 1, 5);
      const trial = startTrial(s, rng, {
        kind: 'stillness',
        difficulty,
        purpose: 'training',
        label: 'Stillness',
        blurb: 'Your mind will drift. Notice it and come back, without chasing it.',
        payload: { stat: 'kiControl' },
      });
      return { text: 'You sit down and stop doing anything, which is the difficult part.', trial };
    },
  },
  {
    id: 'rest', maxPerYear: 3, slots: 2, name: 'Rest and recover', cat: 'mind', cost: 'A season',
    desc: 'Heal up. You lose ground and you stop dying.',
    available: () => true,
    run: (s, rng) => {
      adjust(s, { health: 35, happiness: 8, ki: 999 });
      return { text: render(`{You do nothing at all|You sleep|You let it heal properly}. {It is the hardest thing you do all year|You hate it|You needed it}.`, {}, rng) };
    },
  },
  {
    id: 'use_senzu', slots: 0, name: 'Eat a senzu bean', cat: 'mind', cost: 'A moment',
    desc: 'Heals everything, instantly.',
    available: (s) => s.character.senzu > 0,
    run: (s, rng) => {
      s.character.senzu -= 1;
      adjust(s, { health: 100, ki: 999, happiness: 4 });
      return { text: render(`{One bean|You chew it|It tastes of almost nothing}. {Everything closes|You are whole|Ten days of food and no more wounds}.`, {}, rng) };
    },
  },

  // ------------------------------------------------------------ progression
  {
    id: 'attempt_form', maxPerYear: 2, minMaturity: 10, tooYoung: 'Whatever is in you is not ready to come out yet.', slots: 2, name: 'Reach for a transformation', cat: 'power',
    desc: 'A form you have the grounds for. Whether you get it is another matter.',
    available: (s) => unlockableForms(s).length > 0,
    options: (s) => unlockableForms(s).map((f) => ({ id: f.id, label: f.name, hint: f.desc })),
    run: (s, rng, params) => {
      const formId = (params && params.option) || (unlockableForms(s)[0] || {}).id;
      const form = getTransformation(formId);
      if (!form) return { text: 'There is nothing to reach for.' };
      const trial = startTrial(s, rng, {
        kind: form.id === 'oozaru' || form.id === 'golden_oozaru' ? 'rampage' : form.tier >= 8 ? 'endurance' : 'push',
        difficulty: clamp(Math.ceil(form.tier / 2.6), 1, 5),
        purpose: 'form',
        label: form.name,
        blurb: form.hint,
        payload: { formId },
      });
      return { text: form.desc, trial };
    },
  },
  {
    id: 'learn_technique', maxPerYear: 3, minMaturity: 6, tooYoung: 'You cannot hold the shapes yet.', slots: 2, name: 'Study a technique', cat: 'power',
    desc: 'Something from the tree. You have to be able to do the movement before it does anything.',
    available: (s) => availableTechniques(s.character).length > 0,
    options: (s) => availableTechniques(s.character)
      .sort((x, y) => x.tier - y.tier).slice(0, 14)
      .map((t) => ({ id: t.id, label: t.name, hint: `Tier ${t.tier} - ${t.desc}` })),
    run: (s, rng, params) => {
      const pool = availableTechniques(s.character);
      const tech = (params && params.option ? getTechnique(params.option) : null)
        || pool.sort((x, y) => x.tier - y.tier)[0];
      if (!tech) return { text: 'There is nothing left to learn here.' };
      const trial = startTrial(s, rng, {
        kind: (tech.branch === 'body' || tech.branch === 'motion') ? 'timing' : 'sequence',
        difficulty: clamp(Math.ceil(tech.tier / 2), 1, 5),
        purpose: 'technique',
        label: tech.name,
        blurb: tech.desc,
        payload: { techId: tech.id },
      });
      return { text: tech.desc, trial };
    },
  },
  {
    id: 'master_form', maxPerYear: 2, minMaturity: 12, slots: 2, name: 'Master a transformation', cat: 'power',
    desc: 'Live in it until it stops costing you anything.',
    available: (s) => s.character.transformations.length > 0,
    options: (s) => s.character.transformations.map((id) => {
      const f = getTransformation(id);
      const m = masteryEffect(s, id);
      return { id, label: f ? f.name : id, hint: `Mastery ${m.mastery}% - ki drain at ${Math.round(m.drainMult * 100)}%` };
    }),
    run: (s, rng, params) => {
      const formId = (params && params.option) || s.character.transformations[0];
      const form = getTransformation(formId);
      if (!form) return { text: 'Nothing to master.' };
      const trial = startTrial(s, rng, {
        kind: 'endurance',
        difficulty: clamp(2 + Math.floor(getMastery(s, formId) / 30), 1, 5),
        purpose: 'mastery',
        label: form.name,
        blurb: 'Hold the form. Keep holding it. That is the whole method.',
        payload: { formId },
      });
      return { text: `Living in ${form.name} until it stops being a transformation.`, trial };
    },
  },
  {
    id: 'invent_form', maxPerYear: 1, minMaturity: 18, tooYoung: 'You have not lived enough to have a style of your own.', slots: 3, name: 'Build a form of your own', cat: 'power',
    desc: 'Take something you have mastered and push it where it was not designed to go.',
    available: (s) => s.character.transformations.some((id) => getMastery(s, id) >= 85)
      && s.character.stats.discipline >= 65,
    options: (s) => s.character.transformations
      .filter((id) => getMastery(s, id) >= 85)
      .map((id) => ({ id, label: getTransformation(id).name, hint: 'Mastered. Ready to be pushed past.' })),
    run: (s, rng, params) => {
      const baseId = (params && params.option) || s.character.transformations[0];
      if (rng.chance(0.55 + s.character.stats.discipline / 400)) {
        const invented = inventForm(s, rng, baseId, generateSignatureName(rng));
        adjust(s, { happiness: 25, health: -25, fame: 10 });
        return {
          text: `${invented.name}. Roughly x${invented.mult} on your base, and nobody else in the universe has it. `
            + 'You can teach it, if you decide anyone has earned it.',
          unlocked: invented.name,
        };
      }
      adjust(s, { health: -30, happiness: -10 });
      return { text: rng.pick([
        'Whatever you were reaching for tears something instead.',
        'It does not become a form. It becomes a month in bed.',
        'You get halfway to something and your body refuses the rest.',
      ]) };
    },
  },
  {
    id: 'upgrade_self', maxPerYear: 2, slots: 2, name: 'Upgrade your hardware', cat: 'power', cost: 'A season',
    desc: 'Machines improve by being improved.',
    available: (s) => ['android', 'bioandroid', 'tuffle'].includes(s.character.raceId),
    run: (s, rng) => {
      const cost = 200000 * Math.pow(3, s.character.flags.upgrades || 0);
      if (s.character.zeni < cost) return { text: `You need ${zeni(cost)} in parts. You do not have it.` };
      adjust(s, { zeni: -cost });
      if (rng.chance(0.55 + s.character.stats.intellect / 250)) {
        s.character.flags.upgrades = (s.character.flags.upgrades || 0) + 1;
        const gain = Math.round(s.character.power * rng.float(0.4, 1.1));
        adjust(s, { power: gain, stats: { strength: 3, durability: 3, intellect: 1 } });
        fact(s, `Upgraded their own hardware (mark ${s.character.flags.upgrades}).`, { type: 'upgrade', weight: 4, tags: ['android'] });
        return { text: render(`{You open your own chest cavity|You do it yourself, which is the only way|The lab is somebody else's and you did not ask}. {It works|The new core holds|Output is up}.`, {}, rng), gained: gain };
      }
      adjust(s, { health: -20 });
      return { text: render(`{Something shorts|You get it wrong|The new part does not take}. {You are down for weeks|It hurts, which surprises you|Rebuild and try again}.`, {}, rng) };
    },
  },
  {
    id: 'absorb', maxPerYear: 1, minMaturity: 10, slots: 2, name: 'Absorb someone', cat: 'power', cost: 'A season', danger: true,
    desc: 'Take them in. Keep the useful parts.',
    available: (s) => hasPerk(s.character, 'absorption') && livingNpcs(s).some((n) => n.power > 1),
    options: (s) => livingNpcs(s).filter((n) => n.power > 1)
      .sort((a, b) => b.power - a.power).slice(0, 8)
      .map((n) => ({ id: n.id, label: `${n.name} (${numberish(n.power)})`, hint: relationLabel(n) })),
    run: (s, rng, params) => {
      const target = params && params.option ? findNpc(s, params.option) : null;
      if (!target || !target.alive) return { text: 'There is nobody to take.' };
      const mine = combatPower(s.character);
      if (target.power > mine * 1.6 && !rng.chance(0.3)) {
        adjust(s, { health: -35 });
        return { text: `${target.name} ${render('{is far too strong|does not go quietly|nearly kills you for trying}', {}, rng)}. You get away with your life.` };
      }
      const gain = Math.round(target.power * rng.float(0.35, 0.75));
      target.alive = false;
      target.deadSince = currentYear(s);
      target.causeOfDeath = 'Absorbed';
      s.character.flags.absorbed = (s.character.flags.absorbed || 0) + 1;
      for (const t of target.techniques || []) {
        if (!s.character.techniques.includes(t)) s.character.techniques.push(t);
      }
      adjust(s, { power: gain, karma: -22, happiness: 8, stats: { technique: 3 } });
      fact(s, `Absorbed ${target.name}.`, { type: 'absorb', weight: 7, subject: target.id, tags: ['absorb', 'kill'] });
      s.stats.kills++;
      return { text: render(`{It takes seconds|They do not have time to say anything|You are bigger afterwards, in every sense}. ${target.name} is {gone|part of you|in there somewhere}. {You can feel what they knew|Their techniques arrive with them|You remember things that are not yours}.`, {}, rng), gained: gain };
    },
  },

  // ------------------------------------------------------------- relations
  {
    id: 'spend_time', maxPerYear: 6, slots: 1, name: 'Spend time with someone', cat: 'social', cost: 'A season',
    desc: 'Closeness is the only thing that does not decay on its own.',
    available: (s) => livingNpcs(s).length > 0,
    options: (s) => livingNpcs(s).slice(0, 20).map((n) => {
      const open = topicsFor(s, n);
      return {
        id: n.id,
        label: n.name,
        hint: open.length
          ? `${relationLabel(n)} - ${open[0].name.toLowerCase()}`
          : `${relationLabel(n)} - nothing to say yet`,
      };
    }),
    run: (s, rng, params) => {
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc) return { text: 'There is nobody in particular.' };
      // What you can talk about depends on how old you are and who they are.
      const out = converse(s, rng, npc);
      if (!out) {
        npc.closeness = clamp(npc.closeness + rng.int(4, 9), 0, 100);
        adjust(s, { happiness: 5 });
        return { text: render(`{You are near them for a while|Nothing is said|You keep them company}.`, {}, rng) };
      }
      const e = out.effect;
      if (e.closeness) npc.closeness = clamp(npc.closeness + e.closeness, 0, 100);
      if (e.trust) npc.trust = clamp((npc.trust ?? 30) + e.trust, 0, 100);
      if (e.respect) npc.respect = clamp((npc.respect || 0) + e.respect, 0, 100);
      if (e.tension) npc.tension = clamp((npc.tension || 0) + e.tension, 0, 100);
      if (e.knowledge) npc.knowledge = Math.min(4, (npc.knowledge || 0) + e.knowledge);
      adjust(s, { happiness: e.happiness ?? 6, stats: e.stats || {} });
      return { text: out.text };
    },
  },
  {
    id: 'spar_npc', maxPerYear: 4, minMaturity: 5, tooYoung: 'Nobody will spar a toddler.', slots: 2, name: 'Spar with someone', cat: 'social', cost: 'A season',
    desc: 'The Dragon Ball way of saying hello.',
    available: (s) => livingNpcs(s).some((n) => n.power > 1),
    options: (s) => livingNpcs(s).filter((n) => n.power > 1).slice(0, 20)
      .map((n) => ({ id: n.id, label: n.name, hint: describeGap(1, 1) === '' ? '' : `${numberish(n.power)}` })),
    run: (s, rng, params) => {
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc) return { text: 'Nobody takes you up on it.' };
      const res = fight(s, rng, npc, { lethality: 0, maxRounds: 4, noZenkai: false });
      s.stats.fights++;
      if (res.won) s.stats.wins++; else s.stats.losses++;
      const dmg = Math.min(Math.round(res.damageTaken * 0.4), Math.max(0, s.character.vitals.health - 10));
      adjust(s, { health: -dmg, stats: { technique: 1, speed: 1 }, happiness: 5 });
      npc.respect = clamp(npc.respect + (res.won ? 6 : 12), 0, 100);
      npc.closeness = clamp(npc.closeness + 6, 0, 100);
      npc.power = Math.round(npc.power * 1.03);
      const { gained } = trainOnce(s, rng, { intensity: 1.1, mentorMult: npc.power > combatPower(s.character) ? 1.3 : 1, slice: 0.3 });
      let text = `${describeGap(combatPower(s.character), npc.power)} ${narrateFight(res, rng, npc.name)}`;
      if (res.zenkai) text += ` ${render('{You come back from it heavier|Your body rebuilds stronger|Zenkai}', {}, rng)}.`;
      return { text, gained };
    },
  },
  {
    id: 'ask_training', maxPerYear: 3, minMaturity: 5, tooYoung: 'Nobody takes students this young.', slots: 2, name: 'Ask someone to train you', cat: 'social', cost: 'A season',
    desc: 'The fastest growth in the game, if they say yes.',
    available: (s) => livingNpcs(s).some((n) => n.power > combatPower(s.character) * 0.8),
    options: (s) => livingNpcs(s).filter((n) => n.power > combatPower(s.character) * 0.8)
      .sort((a, b) => b.power - a.power).slice(0, 10)
      .map((n) => ({ id: n.id, label: n.name, hint: `${numberish(n.power)} - ${relationLabel(n)}` })),
    run: (s, rng, params) => {
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc) return { text: 'Nobody suitable.' };
      const chance = clamp(0.2 + bondScore(npc) / 160 + s.character.stats.charisma / 300, 0.05, 0.9);
      if (!rng.chance(chance)) {
        npc.respect = clamp(npc.respect - 3, 0, 100);
        return { text: `${npc.name} ${render('{says no|laughs|tells you to come back when you are worth the time|does not answer}', {}, rng)}.` };
      }
      const { gained } = trainOnce(s, rng, { intensity: 1.4, mentorMult: 1.8, slice: 0.6 });
      npc.closeness = clamp(npc.closeness + 10, 0, 100);
      npc.respect = clamp(npc.respect + 8, 0, 100);
      if (npc.relation === 'acquaintance' || npc.relation === 'friend') npc.relation = 'mentor';
      let learned = null;
      const teachable = (npc.techniques || []).filter((t) => !s.character.techniques.includes(t));
      if (teachable.length && rng.chance(0.45)) {
        learned = rng.pick(teachable);
        s.character.techniques.push(learned);
        s.stats.techniquesLearned++;
      }
      adjust(s, { health: -12, stats: { technique: 2, discipline: 2 } });
      fact(s, `Trained under ${npc.name}.`, { type: 'mentor', weight: 4, subject: npc.id, tags: ['mentor'] });
      return {
        text: `${npc.name} ${render('{agrees|says yes|sets a condition and you meet it}', {}, rng)}. ${learned ? `You come away with the ${TECH_BY_ID[learned].name}.` : render('{It is brutal|You are worse than they expected|You improve}.', {}, rng)}`,
        gained, learned: learned ? TECH_BY_ID[learned].name : null,
      };
    },
  },
  {
    id: 'make_enemy', maxPerYear: 3, minMaturity: 3, slots: 1, name: 'Pick a fight with someone', cat: 'social', cost: 'A moment', danger: true,
    desc: 'Burn a relationship down on purpose.',
    available: (s) => livingNpcs(s).length > 0,
    options: (s) => livingNpcs(s).slice(0, 20).map((n) => ({ id: n.id, label: n.name, hint: relationLabel(n) })),
    run: (s, rng, params) => {
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc) return { text: 'Nobody is available to insult.' };
      npc.tension = clamp(npc.tension + rng.int(25, 50), 0, 100);
      npc.closeness = clamp(npc.closeness - rng.int(20, 45), 0, 100);
      if (npc.tension > 70) npc.relation = 'enemy';
      adjust(s, { happiness: -4, karma: -5 });
      fact(s, `Turned ${npc.name} against them.`, { type: 'conflict', weight: 2, subject: npc.id, tags: ['social'] });
      return { text: render(`{You say the thing you have been thinking|It gets ugly fast|You do not apologise}. ${npc.name} {will not forget it|leaves|says something back that is worse}.`, {}, rng) };
    },
  },

  // ------------------------------------------------------------------ world
  {
    id: 'survey_world', maxPerYear: 3, minMaturity: 7, tooYoung: 'You would not know what you were looking at.', slots: 0, name: 'Sweep for Dragon Balls', cat: 'world',
    desc: 'Check whether this world has anything worth searching for.',
    available: (s) => !s.character.inAfterlife && !ballsAreInert(s),
    run: (s, rng) => {
      ensureBallSet(s, rng);
      const planet = getPlace(s.character.placeId).planet;
      const survey = surveyPlanet(s, rng, planet);
      // Sweeping also confirms which of your marked balls are on this world.
      for (const ball of s.world.ballSet.balls) {
        if (!ball.found && ball.planet === planet && s.character.items.includes('dragon_radar')) ball.surveyed = true;
      }
      return { text: survey.hint };
    },
  },
  {
    id: 'hunt_dragonball', maxPerYear: 3, minMaturity: 9, tooYoung: 'You cannot cross a continent on your own yet.', slots: 2, name: 'Search for a Dragon Ball', cat: 'world',
    desc: 'Narrow down a signal square by square. A radar makes this survivable.',
    available: (s) => ballsHeld(s) < 7 && !s.character.inAfterlife && !ballsAreInert(s),
    run: (s, rng) => {
      const planet = getPlace(s.character.placeId).planet;
      const hunt = startHunt(s, rng, planet);
      if (hunt.empty) {
        return { text: `You spend the season quartering ${getPlace(s.character.placeId).name}. There is nothing on this world.` };
      }
      return { text: hunt.message, hunt };
    },
  },
  {
    id: 'travel', minMaturity: 8, tooYoung: 'You are not going anywhere by yourself.', slots: 1, name: 'Travel', cat: 'world',
    desc: 'Somewhere else. Crossing space costs years unless you can skip them.',
    // Several homeworlds (Sadala among them) are a single place with nowhere
    // else on them to go - if you also have no ship, technique or affordable
    // passage off-world, there is genuinely nowhere to travel to right now.
    emptyHint: 'There is nowhere reachable from here right now - no other ground to cover on this world, and no way off it yet.',
    available: (s) => !s.character.inAfterlife,
    options: (s) => {
      // Grouped by world, because the question is which planet, and only then
      // where on it. A crossing shows what it costs before you commit to it.
      const here = getPlace(s.character.placeId);
      const out = [];
      for (const place of PLACES) {
        if (place.id === s.character.placeId) continue;
        if (place.planet !== here.planet) continue;
        if (['otherworld', 'void'].includes(place.planet)) continue;
        out.push({ id: place.id, group: getPlanet(here.planet).name + ' (here)',
          label: place.name, hint: `Training x${place.training} - ${place.desc}` });
      }
      for (const planet of PLANETS) {
        if (planet.id === here.planet) continue;
        if (['otherworld', 'void'].includes(planet.id)) continue;
        if (!planetExists(planet.id, s.character.birthYear + s.character.age)) continue;
        const methods = travelOptions(s, planet.id);
        if (!methods.length) continue;
        const best = methods.sort((x, y) => (x.years - y.years) || (x.cost - y.cost))[0];
        const canPay = !best.cost || balance(s.character, currencyFor(here.planet).id) >= priceIn(best.cost, currencyFor(here.planet).id);
        const spots = PLACES.filter((p) => p.planet === planet.id);
        for (const place of spots) {
          out.push({
            id: place.id,
            group: `${planet.name} - ${best.name}, ${best.years === 0 ? 'no time at all' : best.years + ' year' + (best.years === 1 ? '' : 's')}`
              + (best.cost ? `, ${formatMoney(priceIn(best.cost, currencyFor(here.planet).id), currencyFor(here.planet).id)}` : ''),
            label: place.name,
            hint: place.desc,
            disabled: !canPay,
            reason: canPay ? null : 'You cannot afford the passage.',
          });
        }
      }
      return out;
    },
    run: (s, rng, params) => {
      const dest = params && params.option ? getPlace(params.option) : null;
      if (!dest) return { text: 'You stay where you are.' };
      const here = getPlace(s.character.placeId);
      if (dest.planet === here.planet) {
        s.character.placeId = dest.id;
        adjust(s, { zeni: -rng.int(2000, 30000), happiness: 3 });
        return { text: `${dest.name}. ${dest.desc}` };
      }
      const methods = travelOptions(s, dest.planet);
      if (!methods.length) return { text: 'You have no way to cross that distance.' };
      const best = methods.sort((x, y) => (x.years - y.years) || (x.cost - y.cost))[0];
      const cur = currencyFor(here.planet);
      if (best.cost) {
        const price = priceIn(best.cost, cur.id);
        if (!canAfford(s.character, cur.id, price)) {
          return { text: 'You cannot cover the passage, and nobody is running a tab for you.' };
        }
        debit(s.character, cur.id, price);
      }
      const trip = travelTo(s, rng, dest.id, best.id);
      const how = {
        instant: 'You lock onto something you can feel from here and step through.',
        ship: 'You take the ship. There is a kitchen and a gravity setting and nothing else to do.',
        pod: 'The pod puts you under and wakes you when it is time.',
        flight: 'You fly it. All of it. There is no air out there and after a while you stop noticing.',
        passage: 'You buy a berth on a freighter and spend the crossing in a room the size of a cupboard.',
        stowaway: 'You get into a container and stay in it. Twice somebody almost opens it.',
      }[best.id] || '';
      // Years in transit are years of your life.
      return {
        text: `${how} ${dest.name}. ${dest.desc}`
          + (trip.years > 0 ? ` The crossing takes ${trip.years} year${trip.years === 1 ? '' : 's'}.` : ' You are simply there.'),
        skipYears: trip.years,
      };
    },
  },
  {
    id: 'world_act', maxPerYear: 1, minMaturity: 15, tooYoung: 'Nobody on this world is listening to a child.', slots: 2, name: 'Do something about this world', cat: 'world',
    desc: 'Defend it, take it, empty it, or recruit from it.',
    available: (s) => !s.character.inAfterlife,
    options: (s) => {
      const planet = getPlanet(getPlace(s.character.placeId).planet);
      const strong = combatPower(s.character) > 1e6;
      return [
        { id: 'protect', label: `Protect ${planet.name}`, hint: 'Stand between it and whatever is coming.' },
        { id: 'recruit', label: 'Recruit from here', hint: 'Leave with people who chose to follow you.' },
        { id: 'rule', label: `Take ${planet.name}`, hint: strong ? 'Make yourself the law here.' : 'You are not strong enough to hold it.', disabled: !strong },
        { id: 'purge', label: `Purge ${planet.name}`, hint: strong ? 'Empty it. There is no version of this you come back from.' : 'You are not strong enough.', disabled: !strong },
      ];
    },
    run: (s, rng, params) => {
      const act = (params && params.option) || 'protect';
      const planetId = getPlace(s.character.placeId).planet;
      const result = actOnWorld(s, rng, planetId, act);
      if (result.response && result.response.foe) {
        return {
          text: result.text,
          battle: {
            foe: result.response.foe,
            stakes: 'lethal', reason: 'defender',
            context: { reason: 'defender', canonId: result.response.foe.canonId },
            intro: `${result.response.foe.name} did not come here to talk.`,
          },
        };
      }
      return { text: result.text };
    },
  },
  {
    id: 'find_work', maxPerYear: 2, minMaturity: 13, tooYoung: 'Nobody will hire you yet.', slots: 1, name: 'Look for work', cat: 'world', cost: 'A season',
    desc: 'Zeni buys gravity chambers.',
    available: (s) => !s.character.career && !s.character.inAfterlife,
    options: (s) => careersFor(s.character, getPlace(s.character.placeId).tags, getPlace(s.character.placeId).planet)
      .map((c) => ({ id: c.id, label: c.name, hint: `${zeni(c.rungs[0].pay)}/yr - ${c.blurb}` })),
    run: (s, rng, params) => {
      const career = params && params.option ? getCareer(params.option) : null;
      if (!career) return { text: 'Nothing suitable here.' };
      const chance = clamp(0.45 + s.character.stats.charisma / 250 + s.character.stats.intellect / 400, 0.1, 0.95);
      if (!rng.chance(chance)) return { text: render(`{They do not call back|The interview goes badly|Somebody else gets it}.`, {}, rng) };
      s.character.career = { id: career.id, rung: 0, title: career.rungs[0].title, years: 0, performance: 50 };
      adjust(s, { zeni: career.rungs[0].pay, karma: career.karma });
      fact(s, `Started work as a ${career.rungs[0].title}.`, { type: 'career', weight: 3, tags: ['career'] });
      return { text: `${career.name}: you start as a ${career.rungs[0].title}. ${career.blurb}` };
    },
  },
  {
    id: 'cook_meal', maxPerYear: 4, minMaturity: 4, tooYoung: 'You would burn the kitchen down.', slots: 1, name: 'Cook something', cat: 'world', cost: 'A moment',
    desc: 'Practice in the kitchen. Do it enough and you stop being someone who burns water.',
    available: (s) => !s.character.inAfterlife,
    run: (s, rng) => {
      const skill = s.character.flags.cookingSkill || 0;
      const difficulty = clamp(1 + Math.floor(skill / 24), 1, 5);
      const trial = startTrial(s, rng, {
        kind: 'sequence',
        difficulty,
        purpose: 'cooking',
        label: 'Cooking',
        blurb: 'Read the recipe once, then work it from memory, in order, before anything burns.',
        payload: {},
      });
      return { text: 'You get out what you have and try to make something worth eating.', trial };
    },
  },
  {
    id: 'shop', maxPerYear: 5, minMaturity: 5, tooYoung: 'Somebody else buys your things.', slots: 0, name: 'Go shopping', cat: 'world', cost: 'A moment',
    desc: 'Gear, property and transport.',
    available: (s) => !s.character.inAfterlife,
    options: (s) => {
      const place = getPlace(s.character.placeId);
      const cur = currencyFor(place.planet);
      return liveShopStock(s, place.tags, place.planet)
        .filter((i) => !hasItem(s.character, i.id))
        .map((i) => {
          const price = valueHere(s, i.id);
          const imported = isImportedHere(s, place.planet, i.id);
          const demand = demandFor(s, place.planet, i.id);
          const tag = imported ? 'Imported, here only for now - ' : demand > 1.4 ? 'In demand - ' : demand < 0.75 ? 'A glut, cheaper for it - ' : '';
          return {
            id: i.id,
            label: `${i.name} - ${formatMoney(price.amount, price.currency)}`,
            hint: `${tag}${i.desc}`,
            disabled: balance(s.character, cur.id) < price.amount,
          };
        });
    },
    run: (s, rng, params) => {
      const id = params && params.option;
      if (!id) return { text: 'You buy nothing.' };
      const res = buyItem(s, id);
      if (!res.ok) return { text: res.text };
      adjust(s, { happiness: 4 });
      fact(s, `Bought ${getItem(id).name}.`, { type: 'item', weight: 2, tags: ['asset'] });
      return { text: res.text };
    },
  },
  {
    id: 'settle_down', maxPerYear: 1, minMaturity: 16, tooYoung: 'Somebody else decides where you sleep.',
    slots: 2, name: 'Settle somewhere', cat: 'world', cost: 'Most of the year',
    desc: 'Somewhere on this world that is yours. Buy it, build it, or take it.',
    available: (s) => !s.character.inAfterlife,
    options: (s) => homeOptions(s).map((o) => ({
      id: o.id, label: o.label, hint: o.hint, disabled: !!o.disabled,
    })),
    run: (s, rng, params) => {
      const id = params && params.option;
      if (!id) return { text: 'You look at nothing in particular.' };
      // Building something you cannot design needs somebody who can.
      const helper = Object.values(s.npcs).find((n) => n.alive
        && (n.closeness || 0) > 40 && n.stats && n.stats.intellect >= 70);
      const res = settleHome(s, rng, id, id.startsWith('build:') ? helper : null);
      if (res.ok) {
        fact(s, res.stolen ? `Took a house on ${getPlace(s.character.placeId).name}.`
          : `Settled on ${getPlace(s.character.placeId).name}.`,
        { type: 'property', weight: 7, tags: ['home'] });
        adjust(s, { happiness: res.stolen ? 6 : 18 });
      }
      return { text: res.text };
    },
  },
  {
    id: 'gamble', maxPerYear: 2, minMaturity: 15, tooYoung: 'They will not let you in.', slots: 1, name: 'Gamble', cat: 'world', cost: 'A moment', danger: true,
    desc: 'The house on this planet is unusually honest, which does not help.',
    available: (s) => s.character.zeni > 5000 && !s.character.inAfterlife,
    run: (s, rng) => {
      const stake = Math.round(s.character.zeni * 0.3);
      const lucky = hasPerk(s.character, 'luck');
      if (rng.chance(lucky ? 0.55 : 0.42)) {
        const won = Math.round(stake * rng.float(1.2, 3.5));
        adjust(s, { zeni: won, happiness: 8 });
        return { text: render(`{It goes your way|You should stop and you do not|Three good hands in a row}. You are up ${zeni(won)}.`, {}, rng) };
      }
      adjust(s, { zeni: -stake, happiness: -8 });
      return { text: render(`{It does not go your way|You lose it all in under an hour|The dealer is apologetic}. ${zeni(stake)} gone.`, {}, rng) };
    },
  },
  {
    id: 'commit_crime', maxPerYear: 3, minMaturity: 8, slots: 1, name: 'Commit a crime', cat: 'world', cost: 'A moment', danger: true,
    desc: 'Fast money, lasting consequences.',
    available: (s) => s.character.age >= 12 && !s.character.inAfterlife,
    run: (s, rng) => {
      const take = Math.round(rng.int(20000, 400000) * (1 + combatPower(s.character) / 100000));
      if (rng.chance(0.68 + s.character.stats.speed / 400)) {
        adjust(s, { zeni: take, karma: -10, happiness: 3 });
        fact(s, 'Took something that was not theirs and got away with it.', { type: 'crime', weight: 2, tags: ['crime'] });
        return { text: render(`{Nobody sees you|You are gone before the alarm|It is embarrassingly easy}. ${zeni(take)}.`, {}, rng) };
      }
      s.character.flags.wanted = true;
      adjust(s, { karma: -12, fame: 3, health: -8, zeni: -Math.min(s.character.zeni, 20000) });
      fact(s, 'A job went wrong. There is a warrant now.', { type: 'crime', weight: 3, tags: ['crime', 'wanted'] });
      return { text: render(`{It goes wrong|Somebody had a camera|There were more guards than you counted}. {You get out|You do not get the money|There is a warrant now}.`, {}, rng) };
    },
  },
  {
    id: 'summon_dragon_action', minMaturity: 7, slots: 0, name: 'Summon the dragon', cat: 'world', cost: 'A moment',
    desc: 'You have all seven.',
    available: (s) => summonReady(s),
    run: (s, rng) => ({ text: 'Seven in a circle. The sky is already going dark.', forceEvent: 'summon_dragon' }),
  },
  {
    id: 'seek_challenge', maxPerYear: 3, minMaturity: 11, tooYoung: 'You would not survive looking.', slots: 2, name: 'Go looking for a fight', cat: 'world',
    desc: 'Pick how far you are willing to reach for somebody worth fighting.',
    available: (s) => s.character.age >= 12,
    afterlife: true,
    options: (s) => {
      const here = getPlace(s.character.placeId);
      const canSpace = s.character.items.includes('spaceship') || s.character.items.includes('attack_ball')
        || s.character.techniques.includes('instant_transmission');
      const list = [
        { id: 'local', label: `The strongest thing on ${here.name}`, hint: 'Whatever this place has. Usually survivable.' },
        { id: 'planet', label: 'The strongest fighter on this world', hint: 'A real name, a real reputation.' },
      ];
      if (canSpace) {
        list.push({ id: 'sector', label: 'The strongest in this sector', hint: 'Word travels. So do they.' });
        list.push({ id: 'universe', label: 'The strongest in the universe', hint: 'You will almost certainly lose.' });
      } else {
        list.push({ id: 'sector', label: 'The strongest in this sector', hint: 'You have no way off this rock yet.', disabled: true });
      }
      return list;
    },
    run: (s, rng, params) => {
      const scope = (params && params.option) || 'local';
      const foe = findChallenger(s, rng, scope);
      return {
        text: `${foe.name}. ${foe.intro} ${describeGap(combatPower(s.character), foe.power)}`,
        battle: { foe, reason: 'challenge', stakes: scope === 'universe' ? 'lethal' : 'serious' },
      };
    },
  },
  {
    id: 'hold_tournament', maxPerYear: 1, minMaturity: 14, tooYoung: 'Nobody would come.', slots: 3, name: 'Hold a tournament', cat: 'world',
    desc: 'Put up a purse, send out word, and see who turns up. Your rules.',
    available: (s) => s.character.age >= 14 && !s.character.inAfterlife && s.character.zeni >= 50000,
    options: (s) => {
      const c = s.character;
      const tiers = [
        { id: 'local', label: 'A local card', hint: '50,000 Zeni. Whoever hears about it.', cost: 50000, spread: 4, canon: false },
        { id: 'open', label: 'An open invitational', hint: '400,000 Zeni. Word gets around.', cost: 400000, spread: 12, canon: true },
        { id: 'callout', label: 'Call out the strongest alive', hint: '2,000,000 Zeni. You are asking for it.', cost: 2000000, spread: 45, canon: true },
      ];
      return tiers.map((t) => ({
        ...t,
        disabled: c.zeni < t.cost || (t.canon && c.fame < (t.id === 'callout' ? 45 : 12)),
        hint: c.zeni < t.cost ? `You cannot cover the ${zeni(t.cost)} purse.`
          : (t.canon && c.fame < (t.id === 'callout' ? 45 : 12))
            ? 'Nobody worth fighting has heard of you yet.'
            : t.hint,
      }));
    },
    run: (s, rng, params) => {
      const tier = (params && params.option) || 'local';
      const spec = {
        local: { cost: 50000, spread: 4, canon: false, size: 8 },
        open: { cost: 400000, spread: 12, canon: true, size: 8 },
        callout: { cost: 2000000, spread: 45, canon: true, size: 8 },
      }[tier];
      s.character.zeni -= spec.cost;
      const t = createTournament(s, rng, {
        formatId: 'invitational',
        purse: spec.cost,
        spread: spec.spread,
        canon: spec.canon,
        size: spec.size,
        name: `${s.character.name}'s Invitational`,
        placeId: s.character.placeId,
      });
      const opener = render(`{You put the money up and the word out|You pay for the ring, the officials and the posters|`
        + `You book a stretch of ground and tell people what the prize is}. `
        + `{They come|More of them turn up than you expected|The draw fills in a week}.`, {}, rng);
      if (!s.autoBattle) return { text: opener, tournament: t };
      autoRunTournament(s, rng, t);
      const out = settle(s, t, rng);
      return { text: `${opener} ${out.text}` };
    },
  },
];

/**
 * Somebody real to fight, scaled to the scope you asked for. Never an unnamed
 * "thing": if it can kill you it gets a name and a reason to be there.
 */
function findChallenger(state, rng, scope) {
  const c = state.character;
  const year = currentYear(state);
  const mine = combatPower(c);
  const here = getPlace(c.placeId);

  const bands = {
    local: [0.35, 0.9],
    planet: [0.8, 1.8],
    sector: [1.6, 6],
    universe: [8, 60],
  };
  const [lo, hi] = bands[scope] || bands.local;

  // A living canon fighter in the right band is always a better opponent than
  // a generated one, so look there first.
  // Somebody in the right power band who is also actually on this world.
  // "The strongest in this sector" can reach further, and "in the universe"
  // further still - but neither one reaches into a different universe. That
  // used to be a bug (a stray "not otherworld" clause matched almost anyone,
  // anywhere, including other universes' casts) rather than a design choice.
  const herePlanet = getPlace(c.placeId).planet;
  const myUniverse = c.universe || 7;
  const canonPool = canonAvailable(year, (x) => {
    const p = canonPower(x, year);
    if (p < mine * lo || p > mine * hi) return false;
    if (canonUniverse(x) !== myUniverse) return false;
    if (scope === 'universe') return true;
    const at = getPlace(canonPlace(x, year));
    if (!at) return false;
    if (scope === 'sector') return at.planet === herePlanet || x.tags.includes('divine');
    return at.planet === herePlanet;
  });
  if (canonPool.length && rng.chance(scope === 'local' ? 0.25 : 0.6)) {
    const pick = rng.pick(canonPool);
    return {
      name: pick.name,
      power: Math.round(canonPower(pick, year)),
      canonId: pick.id,
      intro: pick.quirk || pick.personality,
      techniques: pick.teaches || [],
      raceId: pick.race,
    };
  }

  const npc = makeNpc(rng, {
    year,
    placeId: c.placeId,
    minAge: 18,
    maxAge: 70,
  });
  npc.power = Math.max(1, Math.round(mine * rng.float(lo, hi)));
  npc.relation = 'acquaintance';
  addNpc(state, npc);
  const intros = {
    local: ['They have been the biggest thing here for years and are bored of it.',
      'Everybody on this rock knows the name and nobody says it loudly.'],
    planet: ['They hold the title on this world and have not defended it in a decade.',
      'The strongest fighter here, and entirely aware of it.'],
    sector: ['Their reputation crossed four systems before they did.',
      'A name that gets used to frighten recruits.'],
    universe: ['Nobody has beaten them. Not once, not ever.',
      'The kind of power that makes gods take an interest.'],
  };
  npc.intro = rng.pick(intros[scope] || intros.local);
  return {
    name: npc.name, power: npc.power, npcId: npc.id, intro: npc.intro,
    techniques: npc.techniques || [], raceId: npc.raceId,
  };
}

export const ACTION_BY_ID = Object.fromEntries(ACTIONS.map((a) => [a.id, a]));

/**
 * Every action, annotated with whether it can be run and why not. The UI shows
 * the blocked ones greyed rather than hiding them, so the budget is legible.
 */
export function availableActions(state) {
  const out = [];
  for (const action of ACTIONS) {
    let usable = false;
    try { usable = action.available(state); } catch (e) { usable = false; }
    if (!usable) continue;
    // Things you are simply too young for are not listed as locked rows; they
    // are not part of your life yet.
    if (ageGate(state, action) && !action.showWhenYoung) continue;
    const blocked = actionBlocked(state, action);
    out.push({
      ...action,
      blocked,
      cost: costLabel(action),
      limit: limitFor(state, action),
      used: usedThisYear(state, action.id),
    });
  }
  return out;
}

export function runAction(state, rng, actionId, params) {
  const action = ACTION_BY_ID[actionId];
  if (!action) return { text: 'Nothing happens.' };
  if (!action.available(state)) return { text: 'You cannot do that right now.', refused: true };
  const blocked = actionBlocked(state, action);
  if (blocked) return { text: blocked, refused: true };

  chargeAction(state, action);
  const result = action.run(state, rng, params) || {};
  state.character.vitals.kiMax = kiMaxFor(state.character);
  return result;
}

export function actionOptions(state, actionId) {
  const action = ACTION_BY_ID[actionId];
  if (!action || !action.options) return null;
  try { return action.options(state); } catch (e) { return null; }
}
