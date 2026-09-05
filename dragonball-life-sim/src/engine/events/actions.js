// Player-initiated activities. Events are what happens to you; these are what
// you do about it. Each resolves immediately and costs part of the year.

import { clamp } from '../rng.js';
import { render } from '../text.js';
import { adjust, findNpc, livingNpcs, currentYear, addNpc } from '../state.js';
import { addFact } from '../memory.js';
import { trainingRate, combatPower, powerTier, kiMaxFor } from '../stats.js';
import { fight, narrateFight, describeGap } from '../combat.js';
import { TECHNIQUES, TECH_BY_ID, availableTechniques, getTechnique } from '../../data/techniques.js';
import { getTransformation } from '../../data/transformations.js';
import { unlockableForms, tryUnlockForm, nearbyForms } from '../progression.js';
import { getPlace, PLACES } from '../../data/places.js';
import { shopStock, getItem, ITEMS } from '../../data/items.js';
import { CAREERS, getCareer, careersFor } from '../../data/jobs.js';
import { getRace, hasPerk } from '../../data/races.js';
import { makeNpc, bondScore, relationLabel } from '../npc.js';
import { generateFullName } from '../../data/names.js';
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
    intensity: opts.intensity ?? 1,
    placeMult: place.training,
    gearMult,
    mentorMult: opts.mentorMult ?? 1,
  }) * (opts.slice ?? 0.45);
  const gained = Math.max(1, Math.round(c.power * rate));
  c.power += gained;
  c.peakPower = Math.max(c.peakPower, c.power);
  return gained;
}

export const ACTIONS = [
  // ------------------------------------------------------------- training
  {
    id: 'train_hard', name: 'Train hard', cat: 'body', cost: 'A season',
    desc: 'Push until something gives. Fast gains, real risk.',
    available: (s) => s.character.age >= 3,
    run: (s, rng) => {
      const gained = trainOnce(s, rng, { intensity: 1.5 });
      s.character.flags.trainedHardThisYear = true;
      const injured = rng.chance(0.16);
      adjust(s, {
        health: injured ? -rng.int(8, 22) : -5,
        stats: { strength: 2, durability: 1, discipline: 1 },
        ki: -10,
      });
      return {
        text: render(`{You train until you cannot lift your arms|Nothing but work|You go past where sense stops}. #trainResult#`
          + (injured ? ` {You tear something|Something goes in your shoulder|You break a bone and keep going}.` : ''), {}, rng),
        gained,
      };
    },
  },
  {
    id: 'train_technique', name: 'Drill technique', cat: 'body', cost: 'A season',
    desc: 'Slower power growth, better control.',
    available: (s) => s.character.age >= 3,
    run: (s, rng) => {
      const gained = trainOnce(s, rng, { intensity: 0.8 });
      adjust(s, { stats: { technique: 2, kiControl: 2, speed: 1 }, health: -2 });
      return { text: render(`{Forms, over and over|The same movement until it stops being a movement|Slow work}. #trainResult#`, {}, rng), gained };
    },
  },
  {
    id: 'meditate', name: 'Meditate', cat: 'mind', cost: 'A season',
    desc: 'Ki control, discipline and a calmer head.',
    available: () => true,
    run: (s, rng) => {
      adjust(s, { stats: { kiControl: 2, discipline: 2, intellect: 1 }, happiness: 6, ki: 999, health: 4 });
      return { text: render(`{You sit for a long time|Nothing but breathing|You stop|Stillness}. {Your ki settles|The noise drops away|Something unknots}.`, {}, rng) };
    },
  },
  {
    id: 'rest', name: 'Rest and recover', cat: 'mind', cost: 'A season',
    desc: 'Heal up. You lose ground and you stop dying.',
    available: () => true,
    run: (s, rng) => {
      adjust(s, { health: 35, happiness: 8, ki: 999 });
      return { text: render(`{You do nothing at all|You sleep|You let it heal properly}. {It is the hardest thing you do all year|You hate it|You needed it}.`, {}, rng) };
    },
  },
  {
    id: 'use_senzu', name: 'Eat a senzu bean', cat: 'mind', cost: 'A moment',
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
    id: 'attempt_form', name: 'Attempt a transformation', cat: 'power', cost: 'A season',
    desc: 'Reach for a form you are ready for.',
    available: (s) => unlockableForms(s).length > 0,
    options: (s) => unlockableForms(s).map((f) => ({ id: f.id, label: f.name, hint: f.desc })),
    run: (s, rng, params) => {
      const formId = params && params.option ? params.option : (unlockableForms(s)[0] || {}).id;
      const res = tryUnlockForm(s, rng, formId);
      const form = getTransformation(formId);
      adjust(s, { health: -14, ki: -30, happiness: res.unlocked ? 18 : -6 });
      if (res.unlocked) {
        adjust(s, { fame: 5 });
        fact(s, `Achieved ${form.name}.`, { type: 'transformation', weight: 8, tags: ['transformation'] });
        return { text: `${res.text} ${form.desc} ${form.name} is yours.`, unlocked: form.name };
      }
      return { text: `${res.text} ${render('{Not this time|You get close|Something is still missing}.', {}, rng)}` };
    },
  },
  {
    id: 'learn_technique', name: 'Study a technique', cat: 'power', cost: 'A season',
    desc: 'Work on something from the skill tree.',
    available: (s) => availableTechniques(s.character).length > 0,
    options: (s) => availableTechniques(s.character)
      .sort((a, b) => a.tier - b.tier).slice(0, 12)
      .map((t) => ({ id: t.id, label: t.name, hint: t.desc })),
    run: (s, rng, params) => {
      const pool = availableTechniques(s.character);
      const tech = (params && params.option ? getTechnique(params.option) : null)
        || pool.sort((a, b) => a.tier - b.tier)[0];
      if (!tech) return { text: 'There is nothing left to learn here.' };
      const c = s.character;
      let score = 0;
      for (const [k, v] of Object.entries(tech.stat || {})) score += (c.stats[k] || 0) - v;
      const teacherBonus = c.mentors.length ? 0.12 : 0;
      const chance = clamp(0.3 + score / 130 + (c.stats.discipline - 50) / 220 + teacherBonus, 0.05, 0.92);
      adjust(s, { health: -4, ki: -15 });
      if (rng.chance(chance)) {
        c.techniques.push(tech.id);
        s.stats.techniquesLearned++;
        adjust(s, { stats: { technique: 2, kiControl: 1 }, happiness: 10 });
        fact(s, `Learned the ${tech.name}.`, { type: 'technique', weight: 3, tags: ['technique'] });
        return { text: `${render('{It takes the whole season|It comes suddenly|The hundredth attempt is the one}', {}, rng)}. ${tech.name}, learned. ${tech.desc}`, learned: tech.name };
      }
      adjust(s, { happiness: -3 });
      return { text: `${render('{It will not come|You cannot find the shape of it|Close, and not close enough}', {}, rng)}. ${tech.name} stays out of reach for now.` };
    },
  },
  {
    id: 'upgrade_self', name: 'Upgrade your hardware', cat: 'power', cost: 'A season',
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
    id: 'absorb', name: 'Absorb someone', cat: 'power', cost: 'A season', danger: true,
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
    id: 'spend_time', name: 'Spend time with someone', cat: 'social', cost: 'A season',
    desc: 'Closeness is the only thing that does not decay on its own.',
    available: (s) => livingNpcs(s).length > 0,
    options: (s) => livingNpcs(s).slice(0, 20).map((n) => ({ id: n.id, label: n.name, hint: `${relationLabel(n)} - bond ${bondScore(n)}` })),
    run: (s, rng, params) => {
      const npc = params && params.option ? findNpc(s, params.option) : null;
      if (!npc) return { text: 'There is nobody in particular.' };
      npc.closeness = clamp(npc.closeness + rng.int(8, 18), 0, 100);
      npc.tension = clamp(npc.tension - rng.int(2, 8), 0, 100);
      adjust(s, { happiness: 8 });
      return { text: render(`{You spend the season with|You go and see|You make time for} ${npc.name}. {It is uncomplicated|Neither of you talks about anything important|It helps}.`, {}, rng) };
    },
  },
  {
    id: 'spar_npc', name: 'Spar with someone', cat: 'social', cost: 'A season',
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
      const gained = trainOnce(s, rng, { intensity: 1.1, mentorMult: npc.power > combatPower(s.character) ? 1.3 : 1, slice: 0.3 });
      let text = `${describeGap(combatPower(s.character), npc.power)} ${narrateFight(res, rng, npc.name)}`;
      if (res.zenkai) text += ` ${render('{You come back from it heavier|Your body rebuilds stronger|Zenkai}', {}, rng)}.`;
      return { text, gained };
    },
  },
  {
    id: 'ask_training', name: 'Ask someone to train you', cat: 'social', cost: 'A season',
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
      const gained = trainOnce(s, rng, { intensity: 1.4, mentorMult: 1.8, slice: 0.6 });
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
    id: 'make_enemy', name: 'Pick a fight with someone', cat: 'social', cost: 'A moment', danger: true,
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
    id: 'hunt_dragonball', name: 'Hunt for a Dragon Ball', cat: 'world', cost: 'A season',
    desc: 'Seven of them grant a wish.',
    available: (s) => s.world.dragonBalls < 7 && !s.character.inAfterlife,
    run: (s, rng) => {
      const radar = s.character.items.includes('dragon_radar');
      const chance = 0.42 + (radar ? 0.35 : 0) + s.character.stats.intellect / 500;
      adjust(s, { zeni: -3000, health: -3 });
      if (rng.chance(chance)) {
        s.world.dragonBalls = Math.min(7, s.world.dragonBalls + 1);
        fact(s, `Found a Dragon Ball. ${s.world.dragonBalls} of seven.`, { type: 'dragonball', weight: 3, tags: ['dragonball'] });
        return { text: render(`{It is buried|It is in a riverbed|Somebody was using it as a paperweight}. ${s.world.dragonBalls === 7 ? 'That is all seven.' : `${s.world.dragonBalls} of seven.`}`, {}, rng) };
      }
      return { text: render(`{Nothing|A long season and nothing|You dig up half a hillside for a rock}. ${radar ? 'The radar is not wrong, it is just slow.' : 'You could really use a radar.'}`, {}, rng) };
    },
  },
  {
    id: 'travel', name: 'Travel somewhere', cat: 'world', cost: 'A season',
    desc: 'Where you train matters as much as how.',
    available: (s) => !s.character.inAfterlife,
    options: (s) => {
      const canSpace = s.character.items.includes('spaceship') || s.character.items.includes('attack_ball')
        || s.character.techniques.includes('instant_transmission');
      const here = getPlace(s.character.placeId);
      return PLACES.filter((p) => p.id !== s.character.placeId
        && (p.planet === here.planet || canSpace)
        && p.planet !== 'otherworld' && p.planet !== 'void')
        .map((p) => ({ id: p.id, label: p.name, hint: `Training x${p.training} - ${p.desc}` }));
    },
    run: (s, rng, params) => {
      const dest = params && params.option ? getPlace(params.option) : null;
      if (!dest) return { text: 'You stay where you are.' };
      s.character.placeId = dest.id;
      adjust(s, { zeni: -rng.int(2000, 30000), happiness: 4 });
      fact(s, `Travelled to ${dest.name}.`, { type: 'move', weight: 2, tags: ['travel'] });
      return { text: `${dest.name}. ${dest.desc}` };
    },
  },
  {
    id: 'find_work', name: 'Look for work', cat: 'world', cost: 'A season',
    desc: 'Zeni buys gravity chambers.',
    available: (s) => !s.character.career && !s.character.inAfterlife,
    options: (s) => careersFor(s.character, getPlace(s.character.placeId).tags)
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
    id: 'shop', name: 'Go shopping', cat: 'world', cost: 'A moment',
    desc: 'Gear, property and transport.',
    available: (s) => !s.character.inAfterlife,
    options: (s) => shopStock(getPlace(s.character.placeId).tags)
      .filter((i) => !s.character.items.includes(i.id))
      .map((i) => ({ id: i.id, label: `${i.name} - ${zeni(i.cost)}`, hint: i.desc, disabled: s.character.zeni < i.cost })),
    run: (s, rng, params) => {
      const item = params && params.option ? getItem(params.option) : null;
      if (!item) return { text: 'You buy nothing.' };
      if (s.character.zeni < item.cost) return { text: `${item.name} costs ${zeni(item.cost)}. You cannot afford it.` };
      adjust(s, { zeni: -item.cost, happiness: 4 });
      s.character.items.push(item.id);
      fact(s, `Bought ${item.name}.`, { type: 'item', weight: 2, tags: ['asset'] });
      return { text: `${item.name}. ${item.desc}` };
    },
  },
  {
    id: 'gamble', name: 'Gamble', cat: 'world', cost: 'A moment', danger: true,
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
    id: 'commit_crime', name: 'Commit a crime', cat: 'world', cost: 'A moment', danger: true,
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
    id: 'summon_dragon_action', name: 'Summon the dragon', cat: 'world', cost: 'A moment',
    desc: 'You have all seven.',
    available: (s) => s.world.dragonBalls >= 7,
    run: (s, rng) => ({ text: 'The balls are glowing. Age up to make the wish.', forceEvent: 'summon_dragon' }),
  },
  {
    id: 'seek_death', name: 'Seek out something that will kill you', cat: 'world', cost: 'A season', danger: true,
    desc: 'Some warriors only grow at the edge.',
    available: (s) => s.character.age >= 14 && !s.character.inAfterlife,
    run: (s, rng) => {
      const foe = { name: render('{something in the deep wastes|a thing that lives under the ice|a warrior nobody has beaten|an old machine that never stopped}', {}, rng), power: combatPower(s.character) * rng.float(1.5, 4) };
      const res = fight(s, rng, foe, { lethality: 0.4, maxRounds: 6 });
      s.stats.fights++;
      if (res.won) s.stats.wins++; else s.stats.losses++;
      const dmg = res.lethal ? 200 : Math.min(Math.round(res.damageTaken * 0.9), Math.max(0, s.character.vitals.health - 4));
      adjust(s, { health: -dmg, ki: -40, fame: res.won ? 8 : 0 });
      let text = `${describeGap(combatPower(s.character), foe.power)} ${narrateFight(res, rng, foe.name)}`;
      if (res.zenkai) text += ` ${render('{You come back from it stronger|Whatever nearly killed you left room|Zenkai}', {}, rng)}. Power up ${numberish(res.zenkai)}.`;
      return { text, lethal: res.lethal };
    },
  },
];

export const ACTION_BY_ID = Object.fromEntries(ACTIONS.map((a) => [a.id, a]));

export function availableActions(state) {
  return ACTIONS.filter((a) => {
    try { return a.available(state); } catch (e) { return false; }
  });
}

export function runAction(state, rng, actionId, params) {
  const action = ACTION_BY_ID[actionId];
  if (!action) return { text: 'Nothing happens.' };
  if (!action.available(state)) return { text: 'You cannot do that right now.' };
  const result = action.run(state, rng, params) || {};
  state.character.vitals.kiMax = kiMaxFor(state.character);
  return result;
}

export function actionOptions(state, actionId) {
  const action = ACTION_BY_ID[actionId];
  if (!action || !action.options) return null;
  try { return action.options(state); } catch (e) { return null; }
}
