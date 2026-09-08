// Player-initiated activities. Events are what happens to you; these are what
// you do about it. Each resolves immediately and costs part of the year.

import { clamp } from '../rng.js';
import { render } from '../text.js';
import { adjust, findNpc, livingNpcs, currentYear, addNpc } from '../state.js';
import { addFact, openThread } from '../memory.js';
import { trainingRate, combatPower, powerTier, kiMaxFor, STAT_LABELS } from '../stats.js';
import { fight, narrateFight, describeGap } from '../combat.js';
import { TECHNIQUES, TECH_BY_ID, availableTechniques, getTechnique, techniquePurity, techniqueDisplayName,
  BRANCHES, INVENTABLE_BRANCHES, inventTechnique } from '../../data/techniques.js';
import { getTransformation } from '../../data/transformations.js';
import { unlockableForms, tryUnlockForm, nearbyForms } from '../progression.js';
import { getPlace, PLACES } from '../../data/places.js';
import { getItem, ITEMS } from '../../data/items.js';
import { liveShopStock, demandFor, isImportedHere, tradeRelationships } from '../market.js';
import { buyItem, valueHere, hasItem, addItem, inventoryOf, removeItem, findEntry } from '../inventory.js';
import { topicsFor, converse } from '../conversation.js';
import { homeOptions, settleHome, homeOf, starshipOptions, buildStarship, shipOf,
  shipRoomOptions, addShipRoom, shipComponentOptions, addShipComponent, inviteAboard, sellStarship, spreadWord, DEED_SCALE, homeBonus } from '../settlement.js';
import { currencyFor, formatMoney, balance, priceIn, canAfford, debit, credit } from '../../data/currency.js';
import { CAREERS, getCareer, careersFor } from '../../data/jobs.js';
import { getRace, hasPerk, maturity } from '../../data/races.js';
import { prostheticOptions, fittersFor, fitProsthetic, injuries, injuryList, mechanize } from '../body.js';
import { actionBlocked, ageGate, chargeAction, grantTrainingPower, costLabel,
  limitFor, usedThisYear, trainingRoomLeft } from '../economy.js';
import { makeNpc, bondScore, relationLabel, RELATIONS } from '../npc.js';
import { checkRomanceSpark } from '../social.js';
import { canonAvailable, canonPower, canonPlace, canonUniverse } from '../../data/canon.js';
import { ballsHeld, startHunt, ballsAreInert, summonReady } from '../dragonballs.js';
import { startTrial, STAT_TRIALS, TRIAL_KINDS, getMastery, masteryEffect, inventForm } from '../trials.js';
import { createTournament, autoRunTournament, settle } from '../tournament.js';
import { travelOptions, travelTo, actOnWorld, standingOn, planetAreas, wildTrainingRisk, trainAllOutOnWild, planetDestroyed } from '../worlds.js';
import { getPlanet, PLANETS, planetExists } from '../../data/planets.js';
import { randomHostileShip, resolveShipBattle, narrateShipBattle, resolveShipCrash } from '../shipbattle.js';
import { mostWantedBoard, clearBounty } from '../bounty.js';
import { generateFullName, generateSignatureName } from '../../data/names.js';
import { numberish } from '../text.js';
import { localMoney } from './helpers.js';
import { watchBroadcast } from '../broadcast.js';
import { offWorldContacts, callAcrossSpace, transmissionMissLine } from '../comms.js';
import { pushNews } from '../news.js';

/** Living blood-or-marriage family who are not standing where you are. */
function familyElsewhere(state) {
  return livingNpcs(state).filter((n) => RELATIONS[n.relation]?.family && n.placeId !== state.character.placeId);
}

/** Building an android or bio-android from scratch: money, seasons of your
 * own attention, and real risk of failure along the way. */
const ANDROID_PROJECTS = {
  android: {
    id: 'android', name: 'an android', race: 'android', baseCost: 900000,
    blurb: 'A frame built from scratch - metal, a reactor, a mind grown into it rather than born.',
  },
  bioandroid: {
    id: 'bioandroid', name: 'a bio-android', race: 'bioandroid', baseCost: 1600000,
    blurb: 'Grown, not built - cell cultures and an absorption capacity, harder to get right and much worse to get wrong.',
  },
  // Not built from nothing - built from somebody. The raw material is
  // already in the tank; this is the darker, cheaper, faster version of
  // the same project, and it does not end with a stranger opening their
  // eyes for the first time. It ends with somebody you already know.
  cyborg: {
    id: 'cyborg', name: 'a cyborg', race: null, baseCost: 400000,
    blurb: 'Not built from nothing. Whoever you have does not get a say in what they become.',
  },
};

/** Somebody worth bringing onto a project: real intellect, and actually
 * standing where you are. */
function engineerCandidates(state) {
  const c = state.character;
  const hired = (c.androidProject && c.androidProject.hired) || [];
  return livingNpcs(state).filter((n) => n.placeId === c.placeId && !n.captive
    && n.stats.intellect >= 55 && !hired.includes(n.id));
}

function hireCost(npc) {
  return Math.round(20000 * Math.pow(1.045, npc.stats.intellect));
}

/** Anyone standing where you are who has something missing worth paying to
 * replace - a captive you took apart, or an ally who lost something in a
 * fight you were both in. */
function mechanizableAllies(state) {
  const c = state.character;
  return livingNpcs(state).filter((n) => n.placeId === c.placeId && injuries(n).length > 0);
}

/** Where a genetic sample can actually come from: your own captive (which
 * costs them their life), or anyone already dead who has not been sampled
 * yet - the corpse does not mind either way. */
function dnaSampleCandidates(state) {
  const c = state.character;
  const sampled = new Set((c.dnaSamples || []).map((d) => d.npcId));
  const captive = c.captiveId && findNpc(state, c.captiveId);
  const out = [];
  if (captive && captive.alive && !sampled.has(captive.id)) out.push(captive);
  for (const n of Object.values(state.npcs)) {
    if (!n.alive && !sampled.has(n.id)) out.push(n);
  }
  return out;
}

/** What using this item actually buys, for the option list. */
function describeItemUse(use) {
  const bits = [];
  if (use.healFull) bits.push('full health');
  else if (use.heal) bits.push(`+${use.heal} health`);
  if (use.kiFull) bits.push('full ki');
  if (use.happiness) bits.push(`+${use.happiness} happiness`);
  if (use.unlockPotential) bits.push('a real risk, for a real chance at more than you have');
  return bits.join(', ') || 'something';
}

// What a hunt's materials turn into, and how many of each it takes. Checked
// against the bag directly rather than through inventoryOf() so options()
// stays a cheap, pure read - no rng, no per-render recomputation of names.
const CRAFT_RECIPES = [
  { result: 'hide_cloak', need: [{ id: 'megafauna_hide', qty: 3 }] },
  { result: 'fang_necklace', need: [{ id: 'broken_fang', qty: 2 }] },
  { result: 'talon_bracers', need: [{ id: 'canopy_talon', qty: 2 }] },
  { result: 'rockplate_cloak', need: [{ id: 'rockplate_hide', qty: 3 }] },
  { result: 'ember_pendant', need: [{ id: 'ember_core', qty: 1 }] },
];

function craftable(character, recipe) {
  if (hasItem(character, recipe.result)) return false;
  return recipe.need.every((n) => {
    const entry = findEntry(character, n.id);
    return entry && (entry.qty || 0) >= n.qty;
  });
}

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
  // A place of your own is worth something too, when you are actually
  // standing in it - homeBonus() already resolves to 1 everywhere else.
  const rate = trainingRate(c, {
    state,
    intensity: opts.intensity ?? 1,
    placeMult: place.training,
    gearMult: gearMult * homeBonus(state).train,
    mentorMult: opts.mentorMult ?? 1,
  }) * (opts.slice ?? 0.45);
  // Routed through the yearly ceiling: an hour of clicking cannot outrun a year.
  const requested = Math.max(1, Math.round(c.power * rate));
  const { granted, capped } = grantTrainingPower(state, requested);
  return { gained: granted, capped };
}

// A legacy is one of these three shapes - what you built outlives whatever
// you personally go on to do, and grows a reputation of its own separate
// from yours (see the institution renown tick in lifecycle.js's passiveYear).
export const INSTITUTION_TYPES = [
  { id: 'school', label: 'School', verb: 'Founded', name: 'a martial arts school',
    desc: 'Teach what you know, formally, to whoever is willing to show up and work for it.' },
  { id: 'squad', label: 'Squad', verb: 'Assembled', name: 'a fighting squad',
    desc: 'A real unit, not just people who happen to fight near you.' },
  { id: 'organisation', label: 'Order', verb: 'Built', name: 'an organisation',
    desc: 'Something bigger than fighting - relief, order, protection, whatever the galaxy is short of where you are.' },
  { id: 'business', label: 'Business', verb: 'Started', name: 'a business',
    desc: 'Something that makes money whether or not you are the one standing behind the counter.' },
];

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
    id: 'sadala_academy', maxPerYear: 4, minMaturity: 5, tooYoung: 'Too young for the academy yet.', slots: 2, name: 'The Sadala Academy', cat: 'body',
    desc: 'A real curriculum, real instructors, and classmates who are also trying to get better than you - the one place in known space that turned fighting into a syllabus. Nowhere else offers anything but a mentor, if you can find one.',
    available: (s) => getPlace(s.character.placeId).tags.includes('academy'),
    options: () => ['strength', 'technique', 'kiControl', 'discipline'].map((stat) => ({
      id: stat, label: STAT_LABELS[stat], hint: `${TRIAL_KINDS[STAT_TRIALS[stat].kind].name} drill, taught properly.`,
    })),
    run: (s, rng, params) => {
      const c = s.character;
      const stat = (params && params.option) || 'technique';
      if (!c.flags.sadala_academy) {
        c.flags.sadala_academy = true;
        c.flags.sadala_academy_sessions = 0;
        fact(s, 'Enrolled at the Sadala Academy.', { type: 'career', weight: 3, tags: ['academy'] });
      }
      c.flags.sadala_academy_sessions = (c.flags.sadala_academy_sessions || 0) + 1;
      const sessions = c.flags.sadala_academy_sessions;

      const cfg = STAT_TRIALS[stat] || STAT_TRIALS.technique;
      const difficulty = clamp(1 + Math.floor((c.stats[stat] || 50) / 24), 1, 5);
      const trial = startTrial(s, rng, {
        kind: cfg.kind, difficulty, purpose: 'training',
        label: `Academy: ${STAT_LABELS[stat]}`,
        blurb: 'A real classroom, drilling this the way it is actually meant to be taught.',
        payload: { stat },
      });

      const lines = ['Real instructors, a real syllabus - nobody here is guessing at the fundamentals.'];
      const known = livingNpcs(s).filter((n) => n.workplaceId === 'sadala_academy');
      if (known.length < 4 && rng.chance(0.3)) {
        const classmate = makeNpc(rng, {
          year: currentYear(s), placeId: c.placeId, relation: 'colleague',
          minAge: Math.max(6, c.age - 4), maxAge: c.age + 4,
        });
        classmate.workplaceId = 'sadala_academy';
        classmate.closeness = rng.int(15, 35);
        addNpc(s, classmate);
        lines.push(`${classmate.name} is in the same year as you.`);
      }
      if (sessions === 12 && !c.flags.sadala_academy_graduate) {
        c.flags.sadala_academy_graduate = true;
        adjust(s, { happiness: 10, fame: 4 });
        fact(s, 'Graduated from the Sadala Academy.', { type: 'career', weight: 6, tags: ['academy'] });
        lines.push('That is the syllabus finished. Whatever you do with it now is yours.');
      }
      return { text: lines.join(' '), trial };
    },
  },
  {
    id: 'use_time_chamber', maxPerYear: 1, minMaturity: 5, slots: 3, name: 'Train in the chamber', cat: 'power', cost: 'A season',
    desc: 'Time moves differently in there. However long you spend, it costs you more than it costs the calendar.',
    available: (s) => !!(s.character.chamber && s.character.chamber.built) && !s.character.inAfterlife
      && !!homeOf(s) && homeBonus(s).here,
    run: (s, rng) => {
      const chamber = s.character.chamber;
      const rate = chamber.rate || 2;
      const aging = chamber.aging || 1.5;
      // The chamber's own clock runs faster - simulated as several training
      // passes rather than one big multiplier - but grantTrainingPower's
      // yearly ceiling still applies underneath it, same as any other
      // training this year. The room does not let you outrun the cap either.
      const passes = Math.max(2, Math.round(rate));
      let gained = 0;
      let capped = false;
      for (let i = 0; i < passes; i++) {
        const t = trainOnce(s, rng, { intensity: 1.3, slice: 0.6 });
        gained += t.gained;
        if (t.capped) capped = true;
      }
      // Aging is the trade the flavour text always promised and nothing
      // ever charged for - a harder toll than ordinary training, scaled by
      // how steep this particular chamber's conversion actually is.
      const toll = Math.round(8 * aging);
      const injured = rng.chance(0.1 * aging);
      const changes = { health: -toll - (injured ? rng.int(6, 16) : 0), happiness: -Math.round(toll * 0.6), stats: { discipline: 3, kiControl: 2 } };
      adjust(s, changes);
      fact(s, `Spent a session in the chamber${chamber.by ? `, ${chamber.divine ? 'the one' : 'built by'} ${chamber.by}` : ''}.`,
        { type: 'training', weight: 3, tags: ['training', 'chamber'] });
      const lines = [
        `{The door closes and the world outside stops mattering|You lose track of real time almost immediately|`
          + `However long you meant to stay, you stay longer}.`,
      ];
      if (injured) lines.push('{It does not go cleanly|You push past where you should have stopped|Something in you protests, loudly}.');
      lines.push(`${numberish(gained)} power${capped ? ', capped - even in there, a year outside is still a year' : ''}.`);
      return { text: render(lines.join(' '), {}, rng) };
    },
  },
  // A real bracket, but a school one - classmates, not champions, and no
  // draw official anywhere checks an age on the door. This is deliberately
  // the one tournament in the game that is NOT gated behind being old enough
  // (see timeline_event in world.js for where the lore tournaments are).
  {
    id: 'academy_tournament', maxPerYear: 1, slots: 2, name: 'The academy tournament', cat: 'body',
    desc: 'A bracket among your own year. Nobody here is famous yet, which is rather the point.',
    available: (s) => getPlace(s.character.placeId).tags.includes('academy') && maturity(s.character) < 14,
    run: (s, rng) => {
      const t = createTournament(s, rng, {
        formatId: 'invitational',
        purse: 0,
        spread: 3.5,
        canon: false,
        size: 6,
        name: 'The Academy Bracket',
        placeId: s.character.placeId,
      });
      const opener = render('{The instructors run it every term|Somebody posts a draw on the noticeboard and it fills within a day|It is not official, but everybody treats it like it is}.', {}, rng);
      if (!s.autoBattle) return { text: opener, tournament: t };
      autoRunTournament(s, rng, t);
      const out = settle(s, t, rng);
      return { text: `${opener} ${out.text}` };
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
  {
    id: 'use_item', slots: 0, name: 'Use an item', cat: 'mind', cost: 'A moment',
    desc: 'Consume or activate something you are actually carrying, instead of just owning it.',
    available: (s) => inventoryOf(s.character).some((e) => e.item && e.item.use),
    options: (s) => inventoryOf(s.character).filter((e) => e.item && e.item.use)
      .map((e) => ({ id: e.id, label: e.name, hint: describeItemUse(e.item.use) })),
    run: (s, rng, params) => {
      const itemId = params && params.option;
      const item = itemId && getItem(itemId);
      if (!item || !item.use || !hasItem(s.character, itemId)) return { text: 'Nothing to use.' };
      removeItem(s.character, itemId, 1);
      const use = item.use;
      const changes = {};
      if (use.healFull) changes.health = 999;
      else if (use.heal) changes.health = use.heal;
      if (use.kiFull) changes.ki = 999;
      if (use.happiness) changes.happiness = use.happiness;
      adjust(s, changes);
      const lines = [`${item.name}, used.`];
      if (use.unlockPotential) {
        if (rng.chance(use.unlockPotential)) {
          s.character.flags.potential_unlocked = true;
          s.character.potential = clamp((s.character.potential || 50) + 20, 1, 120);
          lines.push('Something in you opens up that was not open before.');
        } else if (use.deathRisk && rng.chance(use.deathRisk)) {
          adjust(s, { health: -9999 });
          lines.push('It does not agree with you. Nothing you have been through prepared you for this.');
          return { text: lines.join(' '), lethal: true };
        } else {
          lines.push('Nothing happens. Not everyone who drinks it is ready, and today was not the day.');
        }
      }
      return { text: lines.join(' ') };
    },
  },
  {
    id: 'seek_treatment', minMaturity: 8, slots: 1, name: 'Get fitted for what you are missing', cat: 'body', cost: 'A season',
    desc: 'Stop waiting for a chance meeting. Go find somebody who does this work.',
    available: (s) => !s.character.inAfterlife && prostheticOptions(s.character).length > 0
      && fittersFor(currentYear(s), getPlace(s.character.placeId).planet).length > 0,
    options: (s) => {
      const opt = prostheticOptions(s.character)[0];
      const fitters = fittersFor(currentYear(s), getPlace(s.character.placeId).planet).sort((a, b) => b.quality - a.quality);
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      return fitters.map((f) => ({
        id: f.id,
        label: `${f.name} - ${opt.spec.name}`,
        hint: `${f.blurb} ${f.cost ? formatMoney(priceIn(f.cost, cur.id), cur.id) : 'No charge.'}`,
      }));
    },
    run: (s, rng, params) => {
      const opt = prostheticOptions(s.character)[0];
      if (!opt) return { text: 'There is nothing left to fit.' };
      const fitters = fittersFor(currentYear(s), getPlace(s.character.placeId).planet).sort((a, b) => b.quality - a.quality);
      const fitter = (params && params.option && fitters.find((f) => f.id === params.option)) || fitters[0];
      if (!fitter) return { text: 'Nobody here does this kind of work.' };
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      const price = priceIn(fitter.cost, cur.id);
      if (price && !canAfford(s.character, cur.id, price)) {
        return { text: 'You cannot cover it, and they are not doing it on credit.' };
      }
      if (price) debit(s.character, cur.id, price);
      const res = fitProsthetic(s.character, opt.entry.id, fitter.quality);
      adjust(s, { happiness: 12, karma: fitter.karma || 0 });
      return { text: `${res.text} ${render('{The first week is the worst part|Learning it takes a season and you have the season|You spend a month reaching for things and missing}.', {}, rng)}` };
    },
  },
  // Clothing made to order rather than pulled off a shop shelf - same
  // qualityMult mechanic weaponAttackBonus already reads, now also read by
  // gearDefenseBonus (stats.js) for anything worn with a passive.defence.
  {
    id: 'commission_clothing', maxPerYear: 4, slots: 1, name: 'Commission an outfit', cat: 'body', cost: 'A season',
    desc: 'Something made to fit rather than pulled off a rack. Whoever makes it decides more than the design does.',
    available: (s) => !s.character.inAfterlife
      && ITEMS.some((i) => i.cat === 'clothing' && !hasItem(s.character, i.id)),
    options: (s) => {
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      const mine = (s.character.iq || 100) >= 110 || s.character.stats.technique >= 60;
      const tailors = livingNpcs(s).filter((n) => (n.closeness || 0) > 30
        && n.stats && (n.stats.technique >= 70 || n.stats.intellect >= 70)).slice(0, 2);
      const list = [];
      for (const item of ITEMS.filter((i) => i.cat === 'clothing' && !hasItem(s.character, i.id))) {
        const baseCost = priceIn(item.cost, cur.id);
        if (mine) {
          list.push({ id: `self:${item.id}`, label: `${item.name} - make it yourself (${formatMoney(Math.round(baseCost * 0.5), cur.id)})`, hint: item.desc });
        }
        for (const t of tailors) {
          list.push({ id: `hire:${item.id}:${t.id}`, label: `${item.name} - ask ${t.name} (${formatMoney(Math.round(baseCost * 1.15), cur.id)})`, hint: item.desc });
        }
        list.push({ id: `order:${item.id}`, label: `${item.name} - order it made (${formatMoney(baseCost, cur.id)})`, hint: item.desc });
      }
      return list;
    },
    run: (s, rng, params) => {
      const raw = params && params.option;
      if (!raw) return { text: 'You commission nothing.' };
      const [tier, itemId, npcId] = raw.split(':');
      const item = getItem(itemId);
      if (!item || hasItem(s.character, itemId)) return { text: 'There is nothing left to commission.' };
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      const baseCost = priceIn(item.cost, cur.id);
      const c = s.character;
      const give = (qualityMult, from) => {
        addItem(c, itemId, { condition: 100, from });
        const entry = findEntry(c, itemId);
        entry.qualityMult = qualityMult;
        entry.worn = true;
      };
      if (tier === 'self') {
        const cost = Math.round(baseCost * 0.5);
        if (!canAfford(c, cur.id, cost)) return { text: `${formatMoney(cost, cur.id)} in materials, and you are short.` };
        debit(c, cur.id, cost);
        give(0.9);
        adjust(s, { happiness: 10, stats: { technique: 2 } });
        fact(s, `Made their own ${item.name}.`, { type: 'item', weight: 3, tags: ['asset', 'clothing'] });
        return { text: `You cut and fit it yourself. ${item.name}, entirely yours.` };
      }
      if (tier === 'hire') {
        const npc = npcId ? findNpc(s, npcId) : null;
        const cost = Math.round(baseCost * 1.15);
        if (!canAfford(c, cur.id, cost)) return { text: `${npc ? npc.name : 'They'} quote ${formatMoney(cost, cur.id)} and do not haggle.` };
        debit(c, cur.id, cost);
        give(1.1, npc ? npc.name : undefined);
        if (npc) {
          npc.closeness = clamp(npc.closeness + 4, 0, 100);
          npc.respect = clamp((npc.respect || 0) + 4, 0, 100);
        }
        adjust(s, { happiness: 10 });
        fact(s, `${npc ? npc.name : 'Someone'} made them ${item.name}.`, { type: 'item', weight: 3, tags: ['asset', 'clothing'] });
        return { text: `${npc ? npc.name : 'They'} take your measurements. ${item.name}, properly made.` };
      }
      if (!canAfford(c, cur.id, baseCost)) return { text: `${formatMoney(baseCost, cur.id)}, and you do not have it.` };
      debit(c, cur.id, baseCost);
      give(1);
      adjust(s, { happiness: 6 });
      fact(s, `Commissioned ${item.name}.`, { type: 'item', weight: 2, tags: ['asset', 'clothing'] });
      return { text: `${item.name}, made to order.` };
    },
  },
  {
    id: 'kidnap_for_conversion', maxPerYear: 2, slots: 1, name: 'Take someone', cat: 'power', cost: 'A season', danger: true,
    desc: 'Overpower them and take them, with a conversion project in mind. There is no version of this that is not what it sounds like.',
    available: (s) => !s.character.inAfterlife && !s.character.captiveId
      && livingNpcs(s).some((n) => n.placeId === s.character.placeId && !n.captive && n.power < combatPower(s.character) * 1.3),
    options: (s) => livingNpcs(s).filter((n) => n.placeId === s.character.placeId && !n.captive && n.power < combatPower(s.character) * 1.3)
      .sort((a, b) => b.power - a.power).slice(0, 8)
      .map((n) => ({ id: n.id, label: `${n.name} (${numberish(n.power)})`, hint: relationLabel(n) })),
    run: (s, rng, params) => {
      const c = s.character;
      const target = params && params.option ? findNpc(s, params.option) : null;
      if (!target || !target.alive) return { text: 'There is nobody to take.' };
      const mine = combatPower(c);
      const chance = clamp(0.4 + Math.log10(Math.max(1, mine / Math.max(1, target.power))) * 0.35, 0.1, 0.95);
      if (!rng.chance(chance)) {
        adjust(s, { health: -25 });
        return { text: `${target.name} ${render('{gets free and gets gone|is faster than you counted on|puts up more of a fight than you expected}', {}, rng)}. Whatever this was, it is not a secret any more.` };
      }
      target.captive = true;
      target.captiveOf = c.id;
      c.captiveId = target.id;
      c.flags = c.flags || {};
      c.flags.hunted_by_defenders = true;
      adjust(s, { karma: -25 });
      spreadWord(s, { scale: DEED_SCALE.city, karma: 0 });
      addFact(s.memory, {
        type: 'crime', weight: 10, year: c.age, subject: target.id, tags: ['crime', 'kidnap'],
        text: `Took ${target.name}. Whatever happens to them now, it is because of that.`,
      });
      return { text: render(`{They do not go quietly, and it does not matter|One good hit is all it takes|There is a moment where they understand what is happening, and then it is over}. ${target.name} is yours now, for whatever you have planned.`, {}, rng) };
    },
  },
  // A name, a price, and whoever posted it not caring how you settle it -
  // the Most Wanted board itself lives in bounty.js, refreshed once a year
  // (lifecycle.js's passiveYear) rather than generated here, so listing it
  // never touches the shared rng mid-render.
  {
    id: 'hunt_bounty', maxPerYear: 2, minMaturity: 14, tooYoung: 'Nobody takes a bounty from someone this young seriously.', slots: 2, name: 'Hunt a bounty', cat: 'world', cost: 'A season', danger: true,
    desc: 'A name, a price, and a reason not to be gentle about it.',
    available: (s) => !s.character.inAfterlife && mostWantedBoard(s).length > 0,
    options: (s) => {
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      return mostWantedBoard(s).map((w) => ({
        id: w.npcId,
        label: `${w.npc.name} (${numberish(w.npc.power)}) - ${formatMoney(priceIn(w.bounty, cur.id), cur.id)}`,
        hint: w.reason,
      }));
    },
    run: (s, rng, params) => {
      const board = mostWantedBoard(s);
      const entry = board.find((w) => w.npcId === (params && params.option)) || board[0];
      if (!entry) return { text: 'There is nobody left on the board.' };
      const target = entry.npc;
      const mine = combatPower(s.character);
      const chance = clamp(0.35 + Math.log10(Math.max(1, mine / Math.max(1, target.power))) * 0.3, 0.08, 0.92);
      if (!rng.chance(chance)) {
        adjust(s, { health: -30, happiness: -6 });
        return { text: `${target.name} ${render('{gets away|is more than the file said|does not go down easy and does not go down at all}', {}, rng)}.` };
      }
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      const payout = priceIn(entry.bounty, cur.id);
      credit(s.character, cur.id, payout);
      clearBounty(s, target.id);
      target.alive = false;
      target.deadSince = currentYear(s);
      target.causeOfDeath = `Brought in on a bounty by ${s.character.name}`;
      s.stats.kills++;
      adjust(s, { karma: 6, fame: 3 });
      fact(s, `Collected the bounty on ${target.name}.`, { type: 'bounty', weight: 6, subject: target.id, tags: ['bounty', 'kill'] });
      return { text: `${render('{It does not take long|They fight, and then they do not|One name off the board}', {}, rng)}. ${formatMoney(payout, cur.id)}.` };
    },
  },
  {
    id: 'hire_hitman', maxPerYear: 3, minMaturity: 14, slots: 1, name: 'Hire someone to deal with it', cat: 'power', cost: 'A season', danger: true,
    desc: 'Pay somebody else to do the part you do not want your name on. There is no version of this that is not what it sounds like.',
    available: (s) => !s.character.inAfterlife && livingNpcs(s).some((n) => n.id !== s.character.captiveId),
    options: (s) => {
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      return livingNpcs(s).filter((n) => n.id !== s.character.captiveId).slice(0, 12).map((n) => {
        const cost = priceIn(Math.max(20000, n.power * 400), cur.id);
        return {
          id: n.id, label: `${n.name} - ${formatMoney(cost, cur.id)}`, hint: relationLabel(n),
          disabled: !canAfford(s.character, cur.id, cost),
        };
      });
    },
    run: (s, rng, params) => {
      const target = params && params.option ? findNpc(s, params.option) : null;
      if (!target || !target.alive) return { text: 'There is nobody to send anyone after.' };
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      const cost = priceIn(Math.max(20000, target.power * 400), cur.id);
      if (!canAfford(s.character, cur.id, cost)) return { text: `${formatMoney(cost, cur.id)}, and you do not have it.` };
      debit(s.character, cur.id, cost);
      // A hired hand is never quite the fight you would buy in the open -
      // a discount contractor, not somebody you trained with. Who you can
      // actually find for that money depends on who you can talk to and
      // how well - the same charisma that gets you a better wage out of a
      // hire also gets you a better contractor out of an underworld one.
      const charismaBonus = clamp((s.character.stats.charisma - 50) / 300, -0.1, 0.25);
      const hitmanPower = Math.max(1, target.power * rng.float(0.5, 1.3) * (1 + charismaBonus));
      const chance = clamp(0.3 + Math.log10(Math.max(1, hitmanPower / Math.max(1, target.power))) * 0.4, 0.1, 0.85);
      const traced = rng.chance(clamp(0.3 - charismaBonus * 0.3, 0.1, 0.4));
      adjust(s, { karma: -18 });
      if (rng.chance(chance)) {
        target.alive = false;
        target.deadSince = currentYear(s);
        target.causeOfDeath = traced ? `Killed by someone ${s.character.name} hired` : 'Killed. Nobody ever finds out by whom.';
        s.stats.kills++;
        fact(s, `Had ${target.name} killed.`, { type: 'crime', weight: traced ? 9 : 6, subject: target.id, tags: ['crime', 'kill', 'hitman'] });
        return { text: `${render('{It is over before you hear about it|A name you gave somebody, and then a name in the obituaries|You do not ask how}', {}, rng)}. ${traced ? 'It gets back to people, eventually, that it was you.' : 'Nobody connects it to you.'}` };
      }
      return { text: `${render('{The contractor does not come back|Word comes back that it did not go well|Whoever you hired is not answering any more}', {}, rng)}. ${target.name} is still very much alive, and now has a reason to be careful.` };
    },
  },
  {
    id: 'release_captive', slots: 0, name: 'Let them go', cat: 'power', cost: 'A moment',
    desc: 'Whatever you were going to do with them, you do not do it.',
    available: (s) => !!s.character.captiveId && !(s.character.androidProject && s.character.androidProject.subjectId),
    run: (s) => {
      const c = s.character;
      const npc = c.captiveId && findNpc(s, c.captiveId);
      if (npc) {
        npc.captive = false;
        npc.captiveOf = null;
        npc.tension = clamp((npc.tension || 0) + 30, 0, 100);
      }
      c.captiveId = null;
      adjust(s, { karma: 6 });
      return { text: npc ? `You let ${npc.name} go. They do not thank you for it, and do not stay.` : 'Whoever it was, they are already gone.' };
    },
  },
  {
    id: 'harvest_dna', maxPerYear: 3, slots: 0, name: 'Take a genetic sample', cat: 'power', cost: 'A moment',
    desc: 'A defeated fighter, or somebody already dead, is a source of material as much as anything else.',
    available: (s) => (s.character.dnaSamples || []).length < 5
      && (dnaSampleCandidates(s).length > 0),
    options: (s) => dnaSampleCandidates(s).map((n) => ({
      id: n.id, label: n.name,
      hint: n.alive ? `Your captive - taking this is the end of them.` : `Already dead. ${numberish(n.power)} at their peak.`,
    })),
    run: (s, rng, params) => {
      const c = s.character;
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc) return { text: 'Nothing to take a sample from.' };
      c.dnaSamples = c.dnaSamples || [];
      c.dnaSamples.push({ npcId: npc.id, name: npc.name, raceId: npc.raceId, stats: { ...npc.stats }, power: npc.power });
      let line;
      if (npc.alive && npc.captive) {
        npc.alive = false;
        npc.deadSince = currentYear(s);
        npc.causeOfDeath = 'Used for genetic material';
        npc.captive = false;
        c.captiveId = null;
        adjust(s, { karma: -18 });
        line = `${npc.name} does not survive it. Whatever you build with this carries a piece of them.`;
      } else {
        adjust(s, { karma: -4 });
        line = `A sample, nothing more. ${npc.name} will not know either way.`;
      }
      return { text: line };
    },
  },
  {
    id: 'mechanize_self', minMaturity: 8, slots: 2, name: 'Mechanize what was lost', cat: 'body', cost: 'A season', danger: true,
    desc: 'Not one prosthetic at a time - replace everything currently missing in one long procedure, and take the rest of the body further if it has come to that.',
    available: (s) => !s.character.inAfterlife && injuries(s.character).length > 0,
    options: (s) => {
      const c = s.character;
      const missing = injuryList(c).filter((i) => i.fixable).length;
      const severe = injuries(c).length >= 2 || !!c.flags.brink_of_death;
      return [
        {
          id: 'partial', label: 'Partial mechanization',
          hint: missing ? `Fits everything currently missing (${missing}) in one session.` : 'Nothing left unfitted, but the session still overhauls what is already there.',
        },
        {
          id: 'full', label: 'Full mechanization',
          hint: severe ? 'Everything missing, plus the rest of the body brought up to match it. There is no version of you that is not visibly different after this.'
            : 'Not warranted yet - this is for a body that has lost real ground, not one prosthetic.',
          disabled: !severe,
        },
      ];
    },
    run: (s, rng, params) => {
      const c = s.character;
      const degree = (params && params.option === 'full') ? 'full' : 'partial';
      if (degree === 'full' && !(injuries(c).length >= 2 || c.flags.brink_of_death)) {
        return { text: 'Not warranted yet. Fit what is actually missing first.' };
      }
      const cur = currencyFor(getPlace(c.placeId).planet);
      const cost = priceIn((degree === 'full' ? 700000 : 250000) + injuries(c).length * 150000, cur.id);
      if (!canAfford(c, cur.id, cost)) return { text: `This is not back-street work. ${formatMoney(cost, cur.id)}, and you do not have it.` };
      debit(c, cur.id, cost);
      const res = mechanize(c, degree);
      fact(s, `Underwent ${degree} mechanization.`, { type: 'body', weight: 10, tags: ['mecha', 'body'] });
      adjust(s, { happiness: degree === 'full' ? -6 : 2 });
      return { text: `${res.text} ${formatMoney(cost, cur.id)}, and there is no putting it back the way it was without a wish or a Namekian healer.` };
    },
  },
  {
    id: 'mechanize_ally', slots: 2, name: 'Mechanize an ally', cat: 'body', cost: 'A season', danger: true,
    desc: 'Somebody you know lost something real. You can pay to give it back to them as hardware, whether or not they would have chosen this.',
    available: (s) => mechanizableAllies(s).length > 0,
    options: (s) => mechanizableAllies(s).map((n) => ({
      id: n.id, label: n.name,
      hint: `${relationLabel(n)} - ${injuryList(n).map((i) => i.name).join(', ')}`,
    })),
    run: (s, rng, params) => {
      const c = s.character;
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc || !npc.alive) return { text: 'Nobody to treat.' };
      const degree = (injuries(npc).length >= 2) ? 'full' : 'partial';
      const cur = currencyFor(getPlace(c.placeId).planet);
      const cost = priceIn((degree === 'full' ? 700000 : 250000) + injuries(npc).length * 150000, cur.id);
      if (!canAfford(c, cur.id, cost)) return { text: `This is not back-street work. ${formatMoney(cost, cur.id)}, and you do not have it.` };
      debit(c, cur.id, cost);
      const res = mechanize(npc, degree);
      npc.trust = clamp((npc.trust ?? 30) + (npc.captive ? -10 : 15), 0, 100);
      addFact(s.memory, {
        type: 'body', weight: 9, year: c.age, subject: npc.id, tags: ['mecha', 'body'],
        text: `Paid for ${npc.name}'s ${degree} mechanization.`,
      });
      return { text: `${res.text} ${formatMoney(cost, cur.id)}, and ${npc.name} ${npc.captive ? 'was not exactly asked' : 'will carry this for the rest of their life'}.` };
    },
  },
  {
    id: 'start_android_project', slots: 1, name: 'Start building an android', cat: 'mind', cost: 'A season',
    desc: 'A body from scratch, or a bio-android grown from cell cultures. Money, years of your own attention, and real risk of failure.',
    available: (s) => !s.character.inAfterlife && !s.character.androidProject,
    options: (s) => {
      const samples = s.character.dnaSamples || [];
      const opts = [
        { id: 'android', label: 'An android', hint: `${formatMoney(priceIn(ANDROID_PROJECTS.android.baseCost, 'zeni'), 'zeni')} in parts and lab time. Metal, a reactor, a mind grown into it rather than born.` },
        {
          id: 'bioandroid', label: 'A bio-android',
          hint: `${formatMoney(priceIn(ANDROID_PROJECTS.bioandroid.baseCost, 'zeni'), 'zeni')} in cultures and containment.`
            + (samples.length
              ? ` Seeded with ${samples.map((d) => d.name).join(', ')}'s genetic material - carries traces of them.`
              : ' Grown, not built - harder, and much worse when it goes wrong.'),
        },
      ];
      if (s.character.captiveId) {
        opts.push({
          id: 'cyborg', label: 'Convert your captive',
          hint: `${formatMoney(priceIn(ANDROID_PROJECTS.cyborg.baseCost, 'zeni'), 'zeni')} in parts. They do not get a say in it.`,
        });
      }
      return opts;
    },
    run: (s, rng, params) => {
      const c = s.character;
      const kindId = (params && params.option) || 'android';
      const kind = ANDROID_PROJECTS[kindId];
      if (!kind) return { text: 'Nothing to build.' };
      if (kindId === 'cyborg' && !c.captiveId) return { text: 'Nobody to convert.' };
      const cur = currencyFor(getPlace(c.placeId).planet);
      const cost = priceIn(kind.baseCost, cur.id);
      if (!canAfford(c, cur.id, cost)) {
        return { text: `${kind.blurb} It starts at ${formatMoney(cost, cur.id)} before anything else. You do not have it.` };
      }
      debit(c, cur.id, cost);
      c.androidProject = { kind: kindId, progress: 0, sessions: 0, setbacks: 0, hired: [], startAge: c.age };
      if (kindId === 'cyborg') {
        c.androidProject.subjectId = c.captiveId;
      } else if (kindId === 'bioandroid' && (c.dnaSamples || []).length) {
        c.androidProject.dnaSource = c.dnaSamples;
        c.dnaSamples = [];
      }
      return { text: `${kind.blurb} ${formatMoney(cost, cur.id)}, gone before you have built anything at all. The work starts now.` };
    },
  },
  {
    id: 'hire_engineer', slots: 0, name: 'Hire help for the project', cat: 'mind', cost: 'A moment',
    desc: 'Somebody who actually knows this field, if you can afford them and they will work for you.',
    available: (s) => !!s.character.androidProject && s.character.androidProject.hired.length < 3
      && engineerCandidates(s).length > 0,
    options: (s) => {
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      return engineerCandidates(s).map((n) => ({
        id: n.id, label: n.name,
        hint: `Intellect ${Math.round(n.stats.intellect)} - ${formatMoney(priceIn(hireCost(n), cur.id), cur.id)} to sign on.`,
      }));
    },
    run: (s, rng, params) => {
      const proj = s.character.androidProject;
      if (!proj) return { text: 'No project running to help with.' };
      const npc = params && params.option && findNpc(s, params.option);
      if (!npc || !npc.alive) return { text: 'They are not available.' };
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      const cost = priceIn(hireCost(npc), cur.id);
      if (!canAfford(s.character, cur.id, cost)) return { text: `${npc.name} wants ${formatMoney(cost, cur.id)} to sign on. You do not have it.` };
      debit(s.character, cur.id, cost);
      proj.hired.push(npc.id);
      return { text: `${npc.name} signs on. ${npc.stats.intellect >= 75 ? 'This is exactly the kind of problem they wanted.' : 'Competent, if nothing more, and another pair of hands.'}` };
    },
  },
  {
    id: 'work_on_android_project', slots: 1, name: 'Work on the project', cat: 'mind', cost: 'A season',
    desc: 'Put the season into it. Real progress, or a real setback - which one depends on how ready you actually are.',
    available: (s) => !!s.character.androidProject,
    run: (s, rng) => {
      const c = s.character;
      const proj = c.androidProject;
      if (!proj) return { text: 'Nothing to work on.' };
      const kind = ANDROID_PROJECTS[proj.kind];
      proj.sessions += 1;
      const hiredNpcs = proj.hired.map((id) => findNpc(s, id)).filter((n) => n && n.alive);
      const helpBonus = hiredNpcs.reduce((n, npc) => n + (npc.stats.intellect / 100) * 0.5, 0);
      const skill = (c.stats.intellect * 0.7 + c.stats.discipline * 0.3) / 100;
      const setbackChance = clamp(0.42 - skill * 0.32 - helpBonus * 0.18, 0.05, 0.55);

      if (rng.chance(setbackChance)) {
        proj.setbacks += 1;
        const cur = currencyFor(getPlace(c.placeId).planet);
        const loss = Math.round(priceIn(kind.baseCost, cur.id) * rng.float(0.04, 0.12));
        debit(c, cur.id, loss);
        const bioLoss = proj.kind === 'bioandroid' && rng.chance(0.3);
        let line;
        if (bioLoss) {
          proj.progress = Math.max(0, proj.progress - 20);
          line = rng.pick([
            'The culture destabilises overnight. Weeks of growth, gone.',
            'Something in the tank goes wrong while you sleep. You lose the sample.',
          ]);
        } else {
          proj.progress = Math.max(0, proj.progress - 6);
          line = rng.pick([
            'A whole subsystem fails testing and has to be rebuilt.',
            'The maths does not hold up under load. Back to the frame.',
            'It very nearly works. That is somehow worse than it not working at all.',
          ]);
        }
        return { text: `${line} Lost ${formatMoney(loss, cur.id)} in the failure. (${Math.round(proj.progress)}% - a setback, not the end of it.)` };
      }

      const gain = rng.float(6, 14) * (0.6 + skill * 0.8 + helpBonus * 0.4);
      proj.progress = clamp(proj.progress + gain, 0, 100);
      const line = rng.pick([
        'Real progress today. It is starting to look like something.',
        'A clean session. Everything that should fit, fits.',
        'Slow, careful work, and it holds.',
      ]);

      if (proj.progress >= 100) {
        c.flags = c.flags || {};
        // Convert somebody who was already taken, rather than build a
        // stranger from nothing - this is the version of the project that
        // ends with somebody the player already knows, changed against
        // their will rather than opening their eyes for the first time.
        if (proj.subjectId) {
          const subject = findNpc(s, proj.subjectId);
          c.androidProject = null;
          if (!subject || !subject.alive) {
            return { text: `${line} There is nothing left to convert.` };
          }
          subject.captive = false;
          subject.captiveOf = null;
          subject.raceId = subject.raceId === 'bioandroid' ? 'bioandroid' : 'android';
          subject.tags = Array.from(new Set([...(subject.tags || []), 'your_creation', 'converted']));
          subject.createdBy = c.id;
          subject.relation = 'thrall';
          subject.trust = 15;
          subject.respect = 10;
          subject.tension = 0;
          subject.power = Math.round(subject.power * rng.float(1.4, 2.2));
          c.captiveId = null;
          c.flags.built_cyborg = true;
          addFact(s.memory, {
            type: 'creation', weight: 12, year: c.age, subject: subject.id, tags: ['creation', 'cyborg', 'crime'],
            text: `Finished converting ${subject.name} into a cyborg. Whoever they were, they are not entirely that any more.`,
          });
          return { text: `${line} ${subject.name} comes back online different - stronger, and looking at you like they are waiting for an order.` };
        }

        const npc = makeNpc(rng, {
          raceId: kind.race, age: 0, minAge: 0, maxAge: 0, year: c.birthYear + c.age,
          placeId: c.placeId, relation: 'creation', metHow: 'created',
          closeness: 60, trust: 70, respect: 50, tension: 0,
        });
        npc.tags = Array.from(new Set([...(npc.tags || []), 'your_creation']));
        npc.createdBy = c.id;
        npc.techniques = [];
        // Seeded with somebody's genetic material: the new bio-android
        // carries a real trace of the donor(s), not just a flavour line.
        let dnaNote = '';
        if (proj.dnaSource && proj.dnaSource.length) {
          for (const key of Object.keys(npc.stats)) {
            const donorAvg = proj.dnaSource.reduce((n, d) => n + (d.stats[key] || 50), 0) / proj.dnaSource.length;
            npc.stats[key] = clamp(Math.round((npc.stats[key] + donorAvg) / 2), 1, 99);
          }
          const names = proj.dnaSource.map((d) => d.name).join(', ');
          npc.tags.push('inherited_dna');
          dnaNote = ` Something of ${names} is in there too - it shows, if you know to look.`;
        }
        addNpc(s, npc);
        c.flags['built_' + proj.kind] = true;
        addFact(s.memory, {
          type: 'creation', weight: 12, year: c.age, tags: ['creation', proj.kind],
          text: `Finished building ${npc.name}, ${kind.name}, from scratch.${dnaNote}`,
        });
        c.androidProject = null;
        return { text: `${line} ${npc.name} opens their eyes for the first time. ${kind.name.charAt(0).toUpperCase()}${kind.name.slice(1)}, and yours.${dnaNote}` };
      }
      return { text: `${line} (${Math.round(proj.progress)}% there.)` };
    },
  },
  {
    id: 'abandon_android_project', slots: 0, name: 'Shut the project down', cat: 'mind', cost: 'A moment',
    desc: 'Walk away from it. Whatever it would have been stays unfinished, and whatever you spent stays spent.',
    available: (s) => !!s.character.androidProject,
    run: (s) => {
      const c = s.character;
      const proj = c.androidProject;
      const kind = proj && ANDROID_PROJECTS[proj.kind];
      // A conversion left unfinished still has somebody in the tank - shutting
      // it down does not erase what already happened to them, but it does not
      // finish it either.
      if (proj && proj.subjectId) {
        const subject = findNpc(s, proj.subjectId);
        if (subject) {
          subject.captive = false;
          subject.captiveOf = null;
          subject.tension = clamp((subject.tension || 0) + 30, 0, 100);
        }
        c.captiveId = null;
      }
      c.androidProject = null;
      return { text: `You shut it down and walk away. Whatever ${kind ? kind.name : 'it'} would have been, it stays unfinished at ${proj ? Math.round(proj.progress) : 0}%.` };
    },
  },
  {
    id: 'self_care', maxPerYear: 6, slots: 0, name: 'Clean yourself up', cat: 'mind', cost: 'A moment',
    desc: 'Wash, mend what you can, look like a person again. Does not undo the year - just how it shows.',
    available: () => true,
    run: (s, rng) => {
      s.character.flags.groomedAtAge = s.character.age;
      adjust(s, { happiness: 6 });
      return { text: render(`{You actually wash, for once|You get the worst of it off you and mend what tore|`
        + `You take the time to look presentable, which is its own kind of effort}. `
        + `{It does not fix anything, but it helps|Small thing. It still helps|`
        + `Nobody has to know how the year has gone, looking at you}.`, {}, rng) };
    },
  },
  {
    id: 'reminisce', maxPerYear: 4, slots: 0, name: 'Look through old photos', cat: 'mind', cost: 'A moment',
    desc: 'Whatever you kept. Not everyone in them is still around, or still what they were.',
    available: (s) => (s.character.photos || []).length > 0,
    options: (s) => (s.character.photos || []).slice().reverse().map((p, i) => ({
      id: p.id, label: `${p.npcName}, age ${p.year - s.character.birthYear}`, hint: p.caption,
    })),
    run: (s, rng, params) => {
      const c = s.character;
      const photos = c.photos || [];
      const photo = (params && params.option && photos.find((p) => p.id === params.option)) || photos[photos.length - 1];
      if (!photo) return { text: 'There is nothing to look at.' };
      const npc = findNpc(s, photo.npcId);
      let line;
      if (!npc) {
        line = `${photo.npcName}. ${photo.caption} It has been long enough that even the memory is going soft at the edges.`;
        adjust(s, { happiness: 1 });
      } else if (!npc.alive) {
        line = `${npc.name}. ${photo.caption} You still have this, even now.`;
        adjust(s, { happiness: 2 });
      } else if (npc.relation !== photo.relation) {
        line = `${npc.name}. ${photo.caption} You were not what you are to each other now, when this was taken.`;
        adjust(s, { happiness: 1 });
      } else {
        line = `${npc.name}. ${photo.caption}`;
        adjust(s, { happiness: 5 });
      }
      return { text: line };
    },
  },

  {
    id: 'resist_mark', maxPerYear: 2, slots: 2, name: 'Fight the mark for control', cat: 'mind', cost: 'A season',
    desc: 'Whatever is riding along with your power, put it back where it belongs - or break it off entirely.',
    available: (s) => !!s.character.flags.majinMark,
    run: (s, rng) => {
      // Discipline is what it always was: the thing standing between you and
      // whatever the mark wants. This does not clear it in one sitting -
      // lifecycle.js's yearly drift and this action pull the same meter in
      // opposite directions, and only once it is driven down near nothing
      // does a disciplined mind get the chance to break it off outright.
      const corruption = s.character.flags.majinCorruption ?? 30;
      const chance = clamp(0.15 + (s.character.stats.discipline - 40) / 140, 0.05, 0.85);
      if (!rng.chance(chance)) {
        adjust(s, { health: -10, happiness: -6 });
        const worse = clamp(corruption + rng.int(3, 8), 0, 100);
        s.character.flags.majinCorruption = worse;
        return { text: render(`{It pushes back harder than you expected|You lose more ground than you meant to|Not this year}.`, {}, rng) };
      }
      const reduced = clamp(corruption - rng.int(15, 28), 0, 100);
      s.character.flags.majinCorruption = reduced;
      if (reduced <= 5 && s.character.stats.discipline >= 75) {
        delete s.character.flags.majinMark;
        delete s.character.flags.majinCorruption;
        adjust(s, { happiness: 10, karma: 8, stats: { discipline: 3 } });
        return { text: render(`{It goes all at once, like a held breath finally let out|You put it down and it does not come back up|Whatever was riding along with you is simply not there any more}. The mark is gone.`, {}, rng) };
      }
      adjust(s, { happiness: 4, stats: { discipline: 2 } });
      return { text: render(`{You hold it. That is all this year buys you - held, not broken|It does not go, but it does not get anything either|A quieter year than the mark wanted}.`, {}, rng)
        + ` Its grip is down to ${reduced}%.` };
    },
  },

  {
    id: 'found_institution', maxPerYear: 1, slots: 3, name: 'Found something lasting', cat: 'legacy', cost: 'A season',
    desc: 'A school, a squad, an organisation - something that keeps existing whether or not you are the one holding it up.',
    available: (s) => !s.character.institution && s.character.fame >= 35,
    options: () => INSTITUTION_TYPES.map((t) => ({ id: t.id, label: `Found ${t.name}`, hint: t.desc })),
    run: (s, rng, params) => {
      const typeId = (params && params.option) || 'school';
      const type = INSTITUTION_TYPES.find((t) => t.id === typeId) || INSTITUTION_TYPES[0];
      const c = s.character;
      c.institution = {
        type: type.id,
        name: `${c.name}'s ${type.label}`,
        founded: currentYear(s),
        members: [],
        renown: 4,
      };
      // A business is the one kind of legacy that pays you back - it needs
      // a home currency to turn a profit in (lifecycle.js's passiveYear tick)
      // and somewhere to expand to (expand_business).
      if (type.id === 'business') {
        c.institution.homePlanet = getPlace(c.placeId).planet;
        c.institution.capital = 0;
        c.institution.branches = [c.institution.homePlanet];
      }
      adjust(s, { happiness: 12, fame: 3 });
      addFact(s.memory, {
        type: 'legacy', weight: 9, year: c.age, tags: ['legacy', 'identity'],
        text: `${type.verb} ${c.institution.name}.`,
      });
      return { text: `${c.institution.name}. ${type.desc} It exists now, whatever it becomes.` };
    },
  },
  {
    id: 'invest_business', maxPerYear: 3, slots: 1, name: 'Invest in it', cat: 'legacy', cost: 'A season',
    desc: 'Put money into growing what you built. Capital in, reputation and reach out.',
    available: (s) => s.character.institution && s.character.institution.type === 'business',
    options: (s) => {
      const cur = currencyFor(s.character.institution.homePlanet);
      const tiers = [
        { mult: 20000, label: 'Modest' },
        { mult: 80000, label: 'Serious' },
        { mult: 300000, label: 'Everything you can spare' },
      ];
      return tiers.map((t, i) => {
        const amount = priceIn(t.mult, cur.id);
        return { id: String(i), label: `${t.label} - ${formatMoney(amount, cur.id)}`, disabled: !canAfford(s.character, cur.id, amount) };
      });
    },
    run: (s, rng, params) => {
      const inst = s.character.institution;
      if (!inst || inst.type !== 'business') return { text: 'There is nothing here to invest in.' };
      const cur = currencyFor(inst.homePlanet);
      const amounts = [priceIn(20000, cur.id), priceIn(80000, cur.id), priceIn(300000, cur.id)];
      const idx = clamp(Number((params && params.option) || 0), 0, 2);
      const amount = amounts[idx];
      if (!canAfford(s.character, cur.id, amount)) return { text: `${formatMoney(amount, cur.id)}, and you do not have it.` };
      debit(s.character, cur.id, amount);
      inst.capital = (inst.capital || 0) + amount;
      // The pitch matters as much as the money - a charismatic owner gets
      // more buzz out of the same investment than a quiet one does.
      const charismaBonus = clamp((s.character.stats.charisma - 50) / 200, -0.15, 0.35);
      inst.renown = clamp(inst.renown + (1 + idx * 1.5) * (1 + charismaBonus), 0, 100);
      adjust(s, { happiness: 6 });
      return { text: `${formatMoney(amount, cur.id)}, put back into ${inst.name}. It is worth more than it was.` };
    },
  },
  {
    id: 'expand_business', maxPerYear: 1, slots: 2, name: 'Open a branch here', cat: 'legacy', cost: 'A season',
    desc: 'Take what you built somewhere it does not exist yet.',
    available: (s) => {
      const inst = s.character.institution;
      if (!inst || inst.type !== 'business') return false;
      const planet = getPlace(s.character.placeId).planet;
      return !(inst.branches || [inst.homePlanet]).includes(planet);
    },
    run: (s) => {
      const inst = s.character.institution;
      const planet = getPlace(s.character.placeId).planet;
      const cur = currencyFor(planet);
      const cost = priceIn(150000, cur.id);
      if (!canAfford(s.character, cur.id, cost)) return { text: `Opening a branch here costs ${formatMoney(cost, cur.id)}, and you do not have it.` };
      debit(s.character, cur.id, cost);
      inst.branches = inst.branches || [inst.homePlanet];
      inst.branches.push(planet);
      inst.renown = clamp(inst.renown + 6, 0, 100);
      adjust(s, { happiness: 10, fame: 2 });
      const planetName = (getPlanet(planet) && getPlanet(planet).name) || planet;
      addFact(s.memory, {
        type: 'legacy', weight: 5, year: s.character.age, tags: ['legacy', 'business'],
        text: `Opened a branch of ${inst.name} on ${planetName}.`,
      });
      return { text: `${inst.name} now stands here too. ${inst.branches.length} place${inst.branches.length === 1 ? '' : 's'} carry the name.` };
    },
  },
  {
    id: 'hire_staff', maxPerYear: 3, slots: 1, name: 'Hire someone', cat: 'legacy', cost: 'A season',
    desc: 'Bring somebody on properly - a wage, a role, a stake in whether this works.',
    available: (s) => {
      const inst = s.character.institution;
      return !!inst && inst.type === 'business'
        && livingNpcs(s).some((n) => n.placeId === s.character.placeId && !inst.members.includes(n.id));
    },
    options: (s) => livingNpcs(s)
      .filter((n) => n.placeId === s.character.placeId && !s.character.institution.members.includes(n.id))
      .slice(0, 10)
      .map((n) => ({ id: n.id, label: n.name, hint: relationLabel(n) })),
    run: (s, rng, params) => {
      const inst = s.character.institution;
      if (!inst || inst.type !== 'business') return { text: 'There is no business here to hire for.' };
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc) return { text: 'Nobody takes the offer.' };
      const cur = currencyFor(inst.homePlanet);
      // A better negotiator gets the same person for less, and keeps them
      // happier about it once they are on board.
      const charismaDiscount = clamp((s.character.stats.charisma - 50) / 300, -0.1, 0.3);
      const wage = priceIn(Math.round(8000 * (1 - charismaDiscount)), cur.id);
      if (!canAfford(s.character, cur.id, wage)) return { text: 'You cannot cover even the first wage.' };
      debit(s.character, cur.id, wage);
      inst.members.push(npc.id);
      inst.renown = clamp(inst.renown + 2, 0, 100);
      npc.closeness = clamp((npc.closeness || 0) + 4 + Math.round(charismaDiscount * 10), 0, 100);
      adjust(s, { happiness: 4 });
      return { text: `${npc.name} comes on board. ${inst.members.length} people carry ${inst.name} now.` };
    },
  },
  {
    id: 'hand_over_institution', maxPerYear: 1, slots: 2, name: 'Hand it off to somebody', cat: 'legacy', cost: 'A season',
    desc: 'Step back from what you built. It keeps existing - just not because of you any more.',
    available: (s) => !!s.character.institution && s.character.institution.members.length > 0,
    options: (s) => (s.character.institution.members || [])
      .map((id) => findNpc(s, id)).filter(Boolean)
      .map((n) => ({ id: n.id, label: n.name, hint: relationLabel(n) })),
    run: (s, rng, params) => {
      const inst = s.character.institution;
      if (!inst) return { text: 'There is nothing here to hand off.' };
      const successor = params && params.option ? findNpc(s, params.option) : null;
      if (!successor) return { text: 'There is nobody here you trust with it yet.' };
      const c = s.character;
      // The reward for a life's work is proportional to what it actually
      // became - a school nobody heard of and a world-icon institution do
      // not send their founder off the same way.
      const cur = currencyFor(inst.homePlanet || getPlace(c.placeId).planet);
      const payout = priceIn(Math.round(20000 + inst.renown * 4000), cur.id);
      credit(c, cur.id, payout);
      c.legaciesFounded = c.legaciesFounded || [];
      c.legaciesFounded.push({
        name: inst.name, type: inst.type, founded: inst.founded, handedOff: currentYear(s),
        renown: Math.round(inst.renown), successor: successor.name, worldIcon: !!c.flags.worldIcon,
      });
      successor.closeness = clamp((successor.closeness || 0) + 12, 0, 100);
      successor.respect = clamp((successor.respect || 0) + 20, 0, 100);
      fact(s, `Handed ${inst.name} to ${successor.name}.`, { type: 'legacy', weight: 9, subject: successor.id, tags: ['legacy', 'identity'] });
      pushNews(s, { headline: `${inst.name} passes to ${successor.name}, after ${currentYear(s) - inst.founded} years under ${c.name}.`, tag: 'legacy', scope: 'sector' });
      adjust(s, { happiness: 18, karma: 3 });
      c.institution = null;
      return {
        text: render(`{You say it out loud before you can talk yourself out of it|`
          + `There is no ceremony, and then there is, because people insist on making one|`
          + `You hand over the keys, the ledger, and whatever else actually matters}. `
          + `${successor.name} takes it, and does not waste time being surprised. ${formatMoney(payout, cur.id)}, and it is not yours to run any more.`, {}, rng),
      };
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
    id: 'refine_technique', maxPerYear: 2, minMaturity: 10, slots: 2, name: 'Refine a technique', cat: 'power',
    desc: 'Not as pure as when you first learned it, once removed from whoever actually taught it first. Make it yours instead.',
    available: (s) => (s.character.techniques || []).some((id) => techniquePurity(s.character, id) < 0.95
      && !(s.character.techniqueNames && s.character.techniqueNames[id])),
    options: (s) => (s.character.techniques || [])
      .filter((id) => techniquePurity(s.character, id) < 0.95 && !(s.character.techniqueNames && s.character.techniqueNames[id]))
      .map((id) => {
        const t = getTechnique(id);
        return { id, label: t.name, hint: `${Math.round(techniquePurity(s.character, id) * 100)}% of the original` };
      }),
    run: (s, rng, params) => {
      const pool = (s.character.techniques || []).filter((id) => techniquePurity(s.character, id) < 0.95
        && !(s.character.techniqueNames && s.character.techniqueNames[id]));
      const techId = (params && params.option && pool.includes(params.option)) ? params.option : pool[0];
      if (!techId) return { text: 'Nothing here needs refining.' };
      const tech = getTechnique(techId);
      const trial = startTrial(s, rng, {
        kind: 'sequence',
        difficulty: clamp(Math.ceil(tech.tier / 2), 1, 5),
        purpose: 'refine_technique',
        label: `Refining the ${tech.name}`,
        blurb: tech.desc,
        payload: { techId },
      });
      return { text: `${tech.name}, but not quite - whoever taught you was already once removed from wherever it started. There is a twist in there that is only yours.`, trial };
    },
  },
  {
    id: 'master_form', maxPerYear: 2, minMaturity: 12, slots: 2, name: 'Master a transformation', cat: 'power',
    desc: 'Live in it until it stops costing you anything.',
    available: (s) => s.character.transformations.length > 0,
    options: (s) => s.character.transformations.map((id) => {
      const f = getTransformation(id);
      const m = masteryEffect(s, id);
      return { id, label: f ? f.name : id, hint: `Mastery ${m.mastery}% - ki and stamina drain at ${Math.round(m.drainMult * 100)}%` };
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
  // Not learned from a teacher's example - built out of a theme instead.
  // See inventTechnique() in data/techniques.js for why this lives on
  // character.customTechniques rather than the shared TECH_BY_ID table.
  {
    id: 'invent_custom_technique', maxPerYear: 1, minMaturity: 16, tooYoung: 'You have not lived enough to build a technique of your own yet.', slots: 3, name: 'Build a technique of your own', cat: 'power',
    desc: 'Pick the shape it takes - what you know how to do already decides the rest.',
    available: (s) => s.character.techniques.length >= 3 && s.character.stats.technique >= 55,
    options: () => INVENTABLE_BRANCHES.map((id) => ({
      id, label: BRANCHES[id].name, hint: BRANCHES[id].blurb,
    })),
    run: (s, rng, params) => {
      const branch = INVENTABLE_BRANCHES.includes(params && params.option) ? params.option : 'ki';
      if (rng.chance(0.5 + s.character.stats.discipline / 400)) {
        const invented = inventTechnique(s.character, rng, { branch, name: generateSignatureName(rng) });
        adjust(s, { happiness: 20, health: -15, stats: { technique: 4 } });
        fact(s, `Invented a technique of their own: ${invented.name}.`, { type: 'technique', weight: 8, tags: ['technique', 'identity'] });
        return { text: `${invented.name}. ${BRANCHES[branch].blurb} Nobody else in the universe has this one.`, unlocked: invented.name };
      }
      adjust(s, { health: -18, happiness: -8 });
      return { text: rng.pick([
        'Whatever you were reaching for does not come together this year.',
        'It almost works. Almost is not a technique.',
        'You burn a season on it and end up with nothing you can use.',
      ]) };
    },
  },
  {
    id: 'upgrade_self', maxPerYear: 2, slots: 2, name: 'Upgrade your hardware', cat: 'power', cost: 'A season',
    desc: 'Machines improve by being improved.',
    available: (s) => ['android', 'bioandroid', 'tuffle'].includes(s.character.raceId),
    run: (s, rng) => {
      const cost = 200000 * Math.pow(3, s.character.flags.upgrades || 0);
      if (s.character.zeni < cost) return { text: `You need ${localMoney(s, cost)} in parts. You do not have it.` };
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
      // A spar is the one place two people show each other exactly what
      // they are made of, and for some people - Saiyans especially - that
      // is the whole appeal.
      const spark = checkRomanceSpark(s, rng, npc);
      if (spark) text += ` ${spark.text}`;
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

  {
    id: 'train_wild', maxPerYear: 3, minMaturity: 10, tooYoung: 'You are not ready for this yet.', slots: 2, name: 'Cut loose on a wild world', cat: 'body', danger: true,
    desc: 'No people here to hold back for. Just you, the local wildlife, and however hard you want to hit.',
    available: (s) => getPlace(s.character.placeId).tags.includes('feral'),
    options: (s) => {
      const planetId = getPlace(s.character.placeId).planet;
      const risk = Math.round(wildTrainingRisk(s, planetId) * 100);
      return [
        { id: 'controlled', label: 'Train hard, stay in control', hint: 'The safe version. Good gains, and the ground survives you.' },
        {
          id: 'all_out', label: 'Go all the way',
          hint: risk > 0 ? `Everything you have, no restraint. Roughly ${risk}% chance this world does not survive it.`
            : 'Everything you have. Nothing here can push back hard enough to notice.',
        },
      ];
    },
    run: (s, rng, params) => {
      const allOut = (params && params.option) === 'all_out';
      const { gained } = trainOnce(s, rng, { intensity: allOut ? 2.2 : 1.5, slice: allOut ? 0.7 : 0.5 });
      if (!allOut) {
        adjust(s, { happiness: 4 });
        return { text: 'You put everything reasonable into it and the local wildlife regrets ever noticing you. The ground survives.', gained };
      }
      const result = trainAllOutOnWild(s, rng);
      if (!result.destroyed) {
        return { text: 'You cut loose completely. The shockwave alone should have levelled something, and somehow did not.', gained };
      }
      return {
        text: `You cut loose completely, and this time the planet does not survive it. ${result.planetName} comes apart around you - you make it out, and there was nothing else on it that could.${result.killed ? ' Except, this time, there was.' : ''} You are back on ${result.fallbackName}.`,
        gained,
      };
    },
  },

  // What a wild world's apex predators are actually made of, keyed by the
  // place's own tags rather than its id - any future feral world only needs
  // one of these tags to already drop something.
  {
    id: 'hunt_creature', maxPerYear: 3, minMaturity: 8, tooYoung: 'Whatever lives out here would not even notice you.', slots: 1, name: 'Hunt the local wildlife', cat: 'body', cost: 'A season', danger: true,
    desc: 'Track down something big enough to be worth the trouble, and take from it what a craftsman could use.',
    available: (s) => getPlace(s.character.placeId).tags.includes('feral'),
    run: (s, rng) => {
      const place = getPlace(s.character.placeId);
      const drops = place.tags.includes('volcanic')
        ? ['rockplate_hide', 'ember_core']
        : ['megafauna_hide', 'broken_fang', 'canopy_talon'];
      const mine = combatPower(s.character);
      const creaturePower = 3000 * (place.danger || 5);
      const chance = clamp(0.35 + Math.log10(Math.max(0.01, mine / creaturePower)) * 0.3, 0.08, 0.92);
      if (!rng.chance(chance)) {
        const hurt = Math.round(18 + (place.danger || 5) * 2.5);
        adjust(s, { health: -hurt, happiness: -4 });
        return { text: `${render('{It sees you coming|It was faster than it looked|You misjudge the reach on it}', {}, rng)}. `
          + `You get clear, but not clean - this one is still out there.` };
      }
      const margin = clamp((mine / creaturePower - 1) * 0.15, 0, 1);
      const count = 1 + (rng.chance(margin) ? 1 : 0);
      const taken = [];
      for (let i = 0; i < count; i++) {
        const id = rng.pick(drops);
        addItem(s.character, id, { from: 'a hunt' });
        taken.push(getItem(id).name);
      }
      adjust(s, { happiness: 3 });
      return {
        text: `${render('{It goes down hard|It does not get back up|One clean opening was all it took}', {}, rng)}. `
          + `You take ${taken.join(' and ')} off it before the rest of the place notices you were here.`,
      };
    },
  },
  {
    id: 'craft_trophy', maxPerYear: 6, slots: 1, name: 'Craft something from what you took', cat: 'body',
    desc: 'Turn what a hunt left you into something worth wearing.',
    available: (s) => CRAFT_RECIPES.some((r) => craftable(s.character, r)),
    options: (s) => CRAFT_RECIPES.filter((r) => craftable(s.character, r)).map((r) => ({
      id: r.result,
      label: getItem(r.result).name,
      hint: `Needs ${r.need.map((n) => `${n.qty}× ${getItem(n.id).name}`).join(', ')}.`,
    })),
    run: (s, rng, params) => {
      const recipe = CRAFT_RECIPES.find((r) => r.result === (params && params.option)) || CRAFT_RECIPES.find((r) => craftable(s.character, r));
      if (!recipe) return { text: 'You do not have the parts for anything yet.' };
      for (const n of recipe.need) removeItem(s.character, n.id, n.qty);
      addItem(s.character, recipe.result, { from: 'your own hands' });
      return { text: `${render('{It takes a while to get right|You ruin the first attempt and start over|It is not pretty, but it holds}', {}, rng)}. `
        + `${getItem(recipe.result).name} is yours now.` };
    },
  },

  // ------------------------------------------------------------------ world
  {
    id: 'explore_region', maxPerYear: 4, minMaturity: 6, tooYoung: 'Too young to go off alone.', slots: 1, name: 'Explore the region', cat: 'world', cost: 'A moment',
    desc: 'Whatever is actually out past the edge of town - fauna, wrecks, and people who do not belong here either.',
    available: (s) => !s.character.inAfterlife,
    run: (s, rng) => {
      const c = s.character;
      const roll = rng.next();

      if (roll < 0.28) {
        adjust(s, { happiness: 2 });
        return { text: render('{Quiet out there today|Nothing worth the trip|You walk it and come back with nothing to show for it}.', {}, rng) };
      }

      if (roll < 0.52) {
        const critter = rng.pick(['something with too many legs', 'a pack of scavengers', 'a territorial local predator',
          'something that should not be that fast', 'whatever that was - it is gone now']);
        const { gained } = trainOnce(s, rng, { intensity: 0.8, slice: 0.25 });
        const dmg = rng.chance(0.3) ? rng.int(3, 14) : 0;
        adjust(s, { health: -dmg, happiness: 3 });
        return {
          text: `You run into ${critter} out there and it goes about how you would expect.${dmg ? ' Not entirely unscathed.' : ' Barely a scratch.'}`,
          gained,
        };
      }

      if (roll < 0.76) {
        const power = Math.max(1, Math.round(combatPower(c) * rng.float(0.5, 1.6)));
        const npc = makeNpc(rng, { year: currentYear(s), placeId: c.placeId, minAge: 18, maxAge: 65 });
        npc.power = power;
        npc.relation = 'enemy';
        addNpc(s, npc);
        return {
          text: `Somebody out here does not belong to this place any more than you do. ${npc.name} does not introduce themself first.`,
          battle: {
            foe: { name: npc.name, power: npc.power, npcId: npc.id, raceId: npc.raceId, techniques: npc.techniques || [] },
            reason: 'rogue', stakes: 'serious',
          },
        };
      }

      // A wreck, a pod, a crate - something that fell here from somewhere
      // else. Not everything abandoned is actually unclaimed.
      if (rng.chance(0.35)) {
        return { text: render('{You find the wreck, or what is left of one|A crater, and not much in it|Somebody already stripped this one}. Whatever was worth taking is long gone.', {}, rng) };
      }
      const find = rng.pick(['an attack pod, half-buried and long cold', 'a stripped-down courier ship',
        'a supply crate that fell further than it was meant to', 'a scout pod, its pilot nowhere in sight']);
      const pool = ITEMS.filter((i) => i.cost > 0 && i.cost < 400000);
      const item = rng.pick(pool);
      const lines = [`You find ${find}.`];
      if (item) {
        addItem(c, item.id, { condition: rng.int(40, 95), from: 'found in the wreck' });
        lines.push(`${item.name}, still worth having. It is yours now.`);
        if (rng.chance(0.3)) {
          c.karma = clamp(c.karma - 3, -100, 100);
          spreadWord(s, { scale: DEED_SCALE.street, karma: -4 });
          const owner = makeNpc(rng, { year: currentYear(s), placeId: c.placeId, relation: 'enemy', tension: 60, minAge: 18, maxAge: 60 });
          addNpc(s, owner);
          openThread(s.memory, {
            kind: 'vendetta', subject: owner.id, year: c.age,
            title: `${owner.name} wants what you took back`, maxStage: 3, heat: 55,
          });
          lines.push(`It was not actually abandoned. ${owner.name} catalogued this one, and finds out who took it.`);
        }
      } else {
        lines.push('Nothing worth carrying out.');
      }
      return { text: lines.join(' ') };
    },
  },
  {
    id: 'hunt_dragonball', maxPerYear: 3, minMaturity: 9, tooYoung: 'You cannot cross a continent on your own yet.', slots: 2, name: 'Search for a Dragon Ball', cat: 'world',
    desc: 'One search, one minigame - a radar reads the whole world and reports what it finds before narrowing down a signal square by square.',
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
        if (planetDestroyed(s, planet.id)) continue;
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
      const how = trip.missed
        ? transmissionMissLine(rng)
        : {
          instant: 'You lock onto something you can feel from here and step through.',
          ship: 'You take the ship. There is a kitchen and a gravity setting and nothing else to do.',
          pod: 'The pod puts you under and wakes you when it is time.',
          flight: 'You fly it. All of it. There is no air out there and after a while you stop noticing.',
          passage: 'You buy a berth on a freighter and spend the crossing in a room the size of a cupboard.',
          stowaway: 'You get into a container and stay in it. Twice somebody almost opens it.',
          kai_kai: 'You step across the boundary between universes like it is a doorway.',
          angel: 'You are carried across, and the crossing itself barely registers.',
          pass: 'Whoever cleared this in advance made sure nothing stops you at the boundary.',
          smuggler: 'Somebody who has done this before takes your money and does not explain how it works.',
        }[best.id] || '';
      // Years in transit are years of your life.
      return {
        text: `${how} ${dest.name}. ${dest.desc}`
          + (trip.missed ? ` You still get there, just later and more embarrassed than you meant to be.`
            : trip.years > 0 ? ` The crossing takes ${trip.years} year${trip.years === 1 ? '' : 's'}.` : ' You are simply there.'),
        skipYears: trip.years,
      };
    },
  },
  {
    id: 'relocate_family', minMaturity: 12, slots: 2, name: 'Ask them to move with you', cat: 'family', cost: 'A season',
    desc: 'Somebody who matters to you is somewhere else. Ask them to come to where you are - a planet, or a universe, if it comes to that.',
    available: (s) => familyElsewhere(s).length > 0,
    options: (s) => familyElsewhere(s).map((npc) => ({
      id: npc.id, label: `${npc.name} (${relationLabel(npc)})`, hint: `Currently at ${getPlace(npc.placeId).name}, ${getPlanet(getPlace(npc.placeId).planet).name}.`,
    })),
    run: (s, rng, params) => {
      const npc = (params && params.option && findNpc(s, params.option)) || familyElsewhere(s)[0];
      if (!npc) return { text: 'There is nobody left to ask.' };
      const c = s.character;
      const here = getPlace(c.placeId);
      const there = getPlace(npc.placeId);
      const crossUniverse = (getPlanet(here.planet).universe || 7) !== (getPlanet(there.planet).universe || 7);
      const crossPlanet = !crossUniverse && here.planet !== there.planet;
      // Charisma is the actual ask; closeness is how much they already
      // trust your judgement about it. How far you are asking them to leave
      // behind pulls the other way - a universe is not a planet, and a
      // planet is not a street over.
      const resistance = crossUniverse ? 0.42 : crossPlanet ? 0.2 : 0.05;
      const tags = npc.tags || [];
      const chance = clamp(0.22 + c.stats.charisma / 180 + npc.closeness / 150
        + (tags.includes('loyal') ? 0.1 : 0) + (tags.includes('protective') ? 0.06 : 0)
        - (tags.includes('ambitious') ? 0.12 : 0) - (tags.includes('vain') ? 0.05 : 0)
        - resistance, 0.04, 0.94);
      if (rng.chance(chance)) {
        npc.placeId = c.placeId;
        npc.homePlaceId = c.placeId;
        npc.closeness = clamp(npc.closeness + 10, 0, 100);
        npc.trust = clamp((npc.trust ?? 30) + 8, 0, 100);
        adjust(s, { happiness: 10 });
        addFact(s.memory, {
          type: 'family', weight: 6, year: c.age, subject: npc.id, tags: ['family'],
          text: `Convinced ${npc.name} to relocate to ${here.name}.`,
        });
        return { text: render(`{They pack up without much argument, in the end|"It took you long enough to ask"|It is a harder goodbye for them than they let on}. ${npc.name} is on ${here.name} now.`, {}, rng) };
      }
      npc.tension = clamp((npc.tension || 0) + 6, 0, 100);
      const why = crossUniverse ? 'a whole universe away from everything they know'
        : crossPlanet ? 'not a small thing to ask of somebody' : 'still their own decision to make';
      return { text: render(`{"Not yet." They mean it|They are not ready, and say so|It is}. That is ${why}.`, {}, rng) };
    },
  },
  {
    id: 'world_act', maxPerYear: 1, minMaturity: 15, tooYoung: 'Nobody on this world is listening to a child.', slots: 2, name: 'Do something about this world', cat: 'world',
    desc: 'Defend it, take it, empty it, or recruit from it.',
    available: (s) => !s.character.inAfterlife && !getPlace(s.character.placeId).tags.includes('feral'),
    options: (s) => {
      const here = getPlace(s.character.placeId);
      const planet = getPlanet(here.planet);
      const strong = combatPower(s.character) > 1e6;
      const areas = planetAreas(s, here.planet);
      const purgedHere = areas.find((a) => a.id === here.id)?.purged;
      const purgedCount = areas.filter((a) => a.purged).length;
      return [
        { id: 'protect', label: `Protect ${planet.name}`, hint: 'Stand between it and whatever is coming.' },
        { id: 'recruit', label: 'Recruit from here', hint: 'Leave with people who chose to follow you.' },
        { id: 'rule', label: `Take ${planet.name}`, hint: strong ? 'Make yourself the law here.' : 'You are not strong enough to hold it.', disabled: !strong },
        {
          id: 'purge', label: `Purge ${here.name}`,
          hint: purgedHere ? 'Already empty. There is nothing left here.'
            : !strong ? 'You are not strong enough.'
              : areas.length > 1
                ? `Empty this one area. ${purgedCount}/${areas.length} of ${planet.name} gone so far. No version of this you come back from.`
                : 'Empty it. There is no version of this you come back from.',
          disabled: !strong || purgedHere,
        },
      ];
    },
    run: (s, rng, params) => {
      const act = (params && params.option) || 'protect';
      const planetId = getPlace(s.character.placeId).planet;
      const result = actOnWorld(s, rng, planetId, act, s.character.placeId);
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
      .map((c) => ({ id: c.id, label: c.name, hint: `${localMoney(s, c.rungs[0].pay)}/yr - ${c.blurb}` })),
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
    id: 'join_elite_squad', maxPerYear: 1, minMaturity: 16, tooYoung: 'Too young to be considered.', slots: 2, name: 'Try for the Elite Squad', cat: 'world', danger: true,
    desc: 'Being ranked Elite gets you noticed. Getting into the Squad itself is a separate, harder thing.',
    available: (s) => {
      const c = s.character;
      return c.raceId === 'saiyan' && !c.flags.elite_squad
        && c.career && c.career.id === 'saiyan_rank' && c.career.rung >= 3;
    },
    run: (s, rng) => {
      const difficulty = clamp(3 + (s.character.career.rung - 3), 3, 5);
      const trial = startTrial(s, rng, {
        kind: 'push',
        difficulty,
        purpose: 'elite_squad',
        label: 'Elite Squad Vetting',
        blurb: 'Everyone ranked Elite gets asked eventually. Not everyone gets asked twice.',
        payload: {},
      });
      return { text: 'They put you in front of the Squad and let them decide.', trial };
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
    })).concat(shipOf(s) ? [] : starshipOptions(s).map((o) => ({
      id: o.id, label: o.label, hint: o.hint, disabled: !!o.disabled,
    }))),
    run: (s, rng, params) => {
      const id = params && params.option;
      if (!id) return { text: 'You look at nothing in particular.' };
      // Building something you cannot design needs somebody who can.
      const helper = Object.values(s.npcs).find((n) => n.alive
        && (n.closeness || 0) > 40 && n.stats && n.stats.intellect >= 70);
      if (id.startsWith('starship:')) {
        const hullId = id.slice('starship:'.length);
        const engineer = helper || (Object.values(s.npcs).find((n) => n.alive && n.factionId === 'capsule_corp_co'));
        const res = buildStarship(s, rng, engineer ? engineer.name : 'Capsule Corporation', hullId);
        if (res.ok) {
          fact(s, 'Commissioned a space-traveling home.', { type: 'property', weight: 9, tags: ['home', 'ship'] });
          adjust(s, { happiness: 26 });
          const moved = (res.movedIn || []).map((n) => n.name);
          return { text: moved.length ? `${res.text} ${moved.join(', ')} move in without being asked.` : res.text };
        }
        return { text: res.text };
      }
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
    id: 'ship_room', maxPerYear: 3, minMaturity: 16, slots: 2, name: 'Work on the ship', cat: 'world',
    desc: 'Add a room, or make an existing one better.',
    available: (s) => !!shipOf(s),
    options: (s) => shipRoomOptions(s).map((o) => ({ id: o.id, label: o.label, hint: o.hint, disabled: o.disabled })),
    run: (s, rng, params) => {
      const id = params && params.option;
      if (!id) return { text: 'Nothing gets built today.' };
      const res = addShipRoom(s, id);
      if (res.ok) {
        adjust(s, { happiness: res.upgraded ? 4 : 10 });
        fact(s, res.text, { type: 'property', weight: 4, tags: ['home', 'ship'] });
      }
      return { text: res.text };
    },
  },
  {
    id: 'ship_component', maxPerYear: 3, minMaturity: 16, slots: 2, name: 'Refit the ship', cat: 'world',
    desc: 'Not comfort - speed, armour, cargo, a way to fight back. What the hull itself can do.',
    available: (s) => !!shipOf(s),
    options: (s) => shipComponentOptions(s).map((o) => ({ id: o.id, label: o.label, hint: o.hint, disabled: o.disabled })),
    run: (s, rng, params) => {
      const id = params && params.option;
      if (!id) return { text: 'Nothing gets fitted today.' };
      const res = addShipComponent(s, id);
      if (res.ok) {
        adjust(s, { happiness: res.upgraded ? 3 : 8 });
        fact(s, res.text, { type: 'property', weight: 4, tags: ['home', 'ship'] });
      }
      return { text: res.text };
    },
  },
  {
    id: 'ship_patrol', maxPerYear: 3, minMaturity: 16, slots: 2, name: 'Take the ship out looking for trouble', cat: 'world', cost: 'A season', danger: true,
    desc: 'Space is not empty. Something out here is worth fighting, or worth taking from - and something out here can do the same to you.',
    available: (s) => !!shipOf(s) && shipOf(s).hull > 0,
    run: (s, rng) => {
      const ship = shipOf(s);
      const foe = randomHostileShip(rng, { scale: rng.float(0.55, 1.1 + Math.min(1, s.character.fame / 120)) });
      const mine = { speed: ship.speed || 1, hull: ship.hull ?? ship.hullMax ?? 60, hullMax: ship.hullMax || 60, firepower: ship.firepower || 5 };
      const result = resolveShipBattle(mine, foe, rng);
      ship.hull = clamp(result.myHullLeft, 0, ship.hullMax || 60);
      const lines = [narrateShipBattle(result, rng, foe.name)];
      const cur = currencyFor(getPlace(s.character.placeId).planet);
      if (result.won) {
        const loot = Math.round(priceIn(60000, cur.id) * rng.float(0.6, 2.4));
        credit(s.character, cur.id, loot);
        adjust(s, { happiness: 10, fame: 3 });
        lines.push(`Whatever they were carrying is yours now - ${formatMoney(loot, cur.id)} worth.`);
        fact(s, `Beat ${foe.name} in open space.`, { type: 'combat', weight: 3, tags: ['ship', 'combat'] });
      } else {
        adjust(s, { happiness: -12 });
      }
      if (result.disabled) {
        const crash = resolveShipCrash(s, rng, ship, { destroyed: result.destroyed });
        lines.push(crash.text);
        fact(s, crash.destroyed ? 'Lost the ship, going down over open ground.' : 'Crash-landed the ship after a fight in orbit.',
          { type: 'body', weight: crash.destroyed ? 9 : 6, tags: ['ship', 'crash'] });
      }
      return { text: lines.join(' ') };
    },
  },
  {
    id: 'sell_ship', maxPerYear: 1, minMaturity: 16, slots: 1, name: 'Sell the ship', cat: 'world', danger: true,
    desc: 'It stops being yours. There is no undoing this.',
    available: (s) => !!shipOf(s),
    run: (s) => {
      const res = sellStarship(s);
      if (res.ok) {
        adjust(s, { happiness: -14 });
        fact(s, 'Sold the ship.', { type: 'property', weight: 7, tags: ['home', 'ship'] });
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
        return { text: render(`{It goes your way|You should stop and you do not|Three good hands in a row}. You are up ${localMoney(s, won)}.`, {}, rng) };
      }
      adjust(s, { zeni: -stake, happiness: -8 });
      return { text: render(`{It does not go your way|You lose it all in under an hour|The dealer is apologetic}. ${localMoney(s, stake)} gone.`, {}, rng) };
    },
  },
  {
    id: 'watch_broadcast', maxPerYear: 8, slots: 1, name: 'Stay in and watch something', cat: 'mind', cost: 'A moment',
    desc: 'Whatever is on. Sometimes that is the news, and sometimes it is exactly the point that it is not.',
    available: (s) => !s.character.inAfterlife && !!homeOf(s) && homeBonus(s).here,
    run: (s, rng) => watchBroadcast(s, rng),
  },
  {
    id: 'contact_offworld', maxPerYear: 6, slots: 1, name: 'Call someone off-world', cat: 'social', cost: 'A moment',
    desc: 'Reach out across space instead of waiting for word to find its own way to you.',
    available: (s) => !s.character.inAfterlife && offWorldContacts(s).length > 0,
    options: (s) => offWorldContacts(s).map((n) => ({ id: n.id, label: n.name, hint: `${relationLabel(n)}, on ${getPlace(n.placeId || 'east_city').name}` })),
    run: (s, rng, params) => {
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc) return { text: 'There is nobody off-world to reach right now.' };
      const call = callAcrossSpace(s, rng, npc);
      const gain = call.gap === 0 ? 4 : call.gap != null && call.gap <= 2 ? 8 : 14;
      npc.closeness = clamp((npc.closeness || 0) + gain, 0, 100);
      npc.trust = clamp((npc.trust ?? 30) + Math.round(gain * 0.6), 0, 100);
      fact(s, `Called ${npc.name}, off on ${getPlace(npc.placeId || 'east_city').name}.`, { type: 'social', weight: 2, subject: npc.id, tags: ['social'] });
      adjust(s, { happiness: 6 });
      return { text: render(`${call.text} ${npc.name} {is glad you called|says it should not have taken this long|does not let you go easily}.`, {}, rng) };
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
        return { text: render(`{Nobody sees you|You are gone before the alarm|It is embarrassingly easy}. ${localMoney(s, take)}.`, {}, rng) };
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
      const planet = getPlanet(here.planet);
      const planetName = planet ? planet.name : here.name;
      // Some worlds only have the one place on them (Sadala among them).
      // "The strongest thing on Planet Sadala" and "the strongest fighter on
      // this world" used to both be offered there as if they meant different
      // things - same planet-wide claim twice, under two labels, one of them
      // dressed up as local when there is no smaller area to be local to.
      const singlePlaceWorld = PLACES.filter((p) => p.planet === here.planet).length <= 1;
      const canSpace = s.character.items.includes('spaceship') || s.character.items.includes('attack_ball')
        || s.character.techniques.includes('instant_transmission');
      const list = singlePlaceWorld
        ? [{ id: 'planet', label: `The strongest fighter on ${planetName}`, hint: 'A real name, a real reputation.' }]
        : [
          { id: 'local', label: `The strongest thing on ${here.name}`, hint: 'Whatever this place has. Usually survivable.' },
          { id: 'planet', label: `The strongest fighter on ${planetName}`, hint: 'A real name, a real reputation.' },
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
      // A local card and an open invitational never leave the ground you are
      // standing on. Reaching further needs the means to actually reach -
      // the same off-world and cross-universe checks seek_challenge already
      // uses - and a name big enough that anyone that far away has heard it.
      const canSpace = c.items.includes('spaceship') || c.items.includes('attack_ball')
        || c.techniques.includes('instant_transmission') || !!shipOf(s);
      const canCrossUniverse = c.techniques.includes('kai_kai') || c.flags.zeno_pass
        || c.flags.won_tournament_of_power || c.flags.angel_escort;
      const tiers = [
        { id: 'local', label: 'A local card', hint: `${localMoney(s, 50000)}. Whoever hears about it.`, cost: 50000, spread: 4, canon: false, gated: false },
        { id: 'open', label: 'An open invitational', hint: `${localMoney(s, 400000)}. Word gets around.`, cost: 400000, spread: 12, canon: true, fame: 12, gated: false },
        { id: 'callout', label: 'Call out the strongest alive', hint: `${localMoney(s, 2000000)}. You are asking for it.`, cost: 2000000, spread: 45, canon: true, fame: 45, gated: false },
        { id: 'interplanetary', label: 'An interplanetary card', hint: `${localMoney(s, 8000000)}. Fighters from other worlds actually make the trip.`, cost: 8000000, spread: 90, canon: true, fame: 60, gated: !canSpace, gateNote: 'You have no way to bring anyone from off this world.' },
        { id: 'multiversal', label: 'A multiversal draw', hint: `${localMoney(s, 40000000)}. Somebody in another universe hears about this and comes anyway.`, cost: 40000000, spread: 200, canon: true, fame: 80, gated: !canCrossUniverse, gateNote: 'You have no way to reach another universe, let alone invite one here.' },
      ];
      return tiers.map((t) => ({
        ...t,
        disabled: c.zeni < t.cost || t.gated || (t.fame && c.fame < t.fame),
        hint: c.zeni < t.cost ? `You cannot cover the ${localMoney(s, t.cost)} purse.`
          : t.gated ? t.gateNote
            : (t.fame && c.fame < t.fame) ? 'Nobody worth fighting has heard of you yet.'
              : t.hint,
      }));
    },
    run: (s, rng, params) => {
      const tier = (params && params.option) || 'local';
      const spec = {
        local: { cost: 50000, spread: 4, canon: false, size: 8 },
        open: { cost: 400000, spread: 12, canon: true, size: 8 },
        callout: { cost: 2000000, spread: 45, canon: true, size: 8 },
        interplanetary: { cost: 8000000, spread: 90, canon: true, size: 10, universeScope: s.character.universe || 7 },
        multiversal: { cost: 40000000, spread: 200, canon: true, size: 16, multiversal: true },
      }[tier];
      s.character.zeni -= spec.cost;
      const t = createTournament(s, rng, {
        formatId: 'invitational',
        purse: spec.cost,
        spread: spec.spread,
        canon: spec.canon,
        size: spec.size,
        universeScope: spec.universeScope,
        multiversal: spec.multiversal,
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
