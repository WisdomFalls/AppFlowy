// Trials: the small playable tests that sit behind training, learning a
// technique, and reaching for a form. The engine defines what a trial is and
// what a score is worth; the UI decides how it is played.

import { clamp } from './rng.js';
import { masteryMult, masteryDrain, masteryLabel } from './mastery.js';
import { traitEffect } from '../data/traits.js';
import { getTechnique, TECH_BY_ID } from '../data/techniques.js';
import { getTransformation } from '../data/transformations.js';
import { grantTrainingPower } from './economy.js';
import { addFact } from './memory.js';
import { adjust, currentYear } from './state.js';
import { combatPower } from './stats.js';
import { numberish } from './text.js';
import { getFaction } from '../data/factions.js';
import { getPlace } from '../data/places.js';
import { currencyFor, credit, formatMoney } from '../data/currency.js';
import { makeNpc } from './npc.js';

export const TRIAL_KINDS = {
  timing: {
    name: 'Focus',
    blurb: 'Strike on the beat. The window is small and it does not wait.',
    stat: 'technique',
  },
  sequence: {
    name: 'Form',
    blurb: 'Watch the sequence, then reproduce it exactly.',
    stat: 'intellect',
  },
  endurance: {
    name: 'Endurance',
    blurb: 'Hold it. Keep holding it. The bar is trying to fall.',
    stat: 'durability',
  },
  push: {
    name: 'Limit',
    blurb: 'Push, and choose when to stop. Every push is worth more and costs more.',
    stat: 'discipline',
  },
  // Meditation is not a test of reflex or grit. It is a test of not doing the
  // thing you keep doing, which needs its own shape.
  stillness: {
    name: 'Stillness',
    blurb: 'Your mind will drift. Notice it and come back, without chasing it.',
    stat: 'kiControl',
  },
  // A Great Ape is a transformation you are inside rather than one you use.
  // The minigame is not about winning; it is about steering.
  rampage: {
    name: 'The Moon',
    blurb: 'You are ten times the size and none of the mind. Steer what you can.',
    stat: 'discipline',
  },
};

/** Which trial suits which kind of work. */
export const STAT_TRIALS = {
  strength: { kind: 'push', method: 'Weighted holds and throws until the arms give out.' },
  speed: { kind: 'timing', method: 'Catching thrown stones blindfolded.' },
  technique: { kind: 'sequence', method: 'Forms, drilled until the sequence is automatic.' },
  kiControl: { kind: 'stillness', method: 'Sitting with it until the noise stops being interesting.' },
  durability: { kind: 'endurance', method: 'Standing in it and refusing to fall over.' },
  intellect: { kind: 'sequence', method: 'Reading, calculating, and remembering what you read.' },
  charisma: { kind: 'sequence', method: 'Talking to people on purpose, which is its own discipline.' },
  discipline: { kind: 'endurance', method: 'Sitting still for longer than is reasonable.' },
};

/**
 * Difficulty runs 1-5 and is set by what the trial is for and how far past
 * their current ability the character is reaching.
 */
export function startTrial(state, rng, opts = {}) {
  const c = state.character;
  const kind = opts.kind || 'timing';
  const difficulty = clamp(opts.difficulty ?? 2, 1, 5);
  const relevant = TRIAL_KINDS[kind] ? (c.stats[TRIAL_KINDS[kind].stat] || 50) : 50;

  return {
    kind,
    difficulty,
    purpose: opts.purpose || 'training',
    label: opts.label || TRIAL_KINDS[kind].name,
    blurb: opts.blurb || TRIAL_KINDS[kind].blurb,
    payload: opts.payload || {},
    // A high relevant stat widens the window rather than skipping the trial.
    aptitude: clamp(relevant / 100, 0.1, 1),
    rounds: kind === 'sequence' ? 2 + difficulty : 3,
    seed: rng.int(1, 999999),
  };
}

/** Score is 0-1. Everything downstream keys off it. */
/**
 * How much easier a trial is for this character before they have touched it.
 * A genius starts ahead; a slow study starts behind.
 */
export function trialBonus(state) {
  const c = state.character;
  return clamp(traitEffect(c, 'trialEase') + ((c.iq || 100) - 100) / 500, -0.2, 0.3);
}

export function gradeTrial(score) {
  if (score >= 0.92) return { grade: 'perfect', mult: 1.9, text: 'Perfect. Not one wasted movement.' };
  if (score >= 0.75) return { grade: 'strong', mult: 1.45, text: 'Clean. Better than you have managed before.' };
  if (score >= 0.5) return { grade: 'fair', mult: 1.0, text: 'Adequate. It will do.' };
  if (score >= 0.25) return { grade: 'poor', mult: 0.55, text: 'Sloppy. You know it as you finish.' };
  return { grade: 'failed', mult: 0.15, text: 'That was a waste of a season.' };
}

/** Turn a played trial into consequences. */
export function resolveTrial(state, rng, trial, score) {
  // Traits move the score before anything is judged against it.
  score = clamp(score + trialBonus(state), 0, 1);
  const c = state.character;
  const result = gradeTrial(clamp(score, 0, 1));
  const lines = [result.text];

  if (trial.purpose === 'training') {
    const stat = trial.payload.stat || 'strength';
    const gain = Math.round(clamp(2 + trial.difficulty * result.mult, 1, 9));
    adjust(state, { stats: { [stat]: gain }, health: -Math.round(3 + trial.difficulty) });
    const requested = Math.round(c.power * (0.03 + trial.difficulty * 0.02) * result.mult);
    const { granted, capped } = grantTrainingPower(state, requested);
    lines.push(`+${gain} ${stat}. Power level up ${numberish(granted)}.`);
    if (capped) lines.push('Your body has taken everything it can absorb this year.');
  } else if (trial.purpose === 'technique') {
    const tech = getTechnique(trial.payload.techId);
    const threshold = 0.42 + trial.difficulty * 0.06 - (c.stats.discipline - 50) / 400;
    if (score >= threshold) {
      if (!c.techniques.includes(tech.id)) {
        c.techniques.push(tech.id);
        state.stats.techniquesLearned += 1;
      }
      adjust(state, { stats: { technique: 2, kiControl: 1 }, happiness: 10 });
      addFact(state.memory, { type: 'technique', text: `Learned the ${tech.name}.`, year: c.age, weight: 3, tags: ['technique'] });
      lines.push(`${tech.name}, learned. ${tech.desc}`);
    } else {
      adjust(state, { health: -5, happiness: -3, stats: { discipline: 1 } });
      lines.push(`${tech.name} stays out of reach. You know what went wrong, which is something.`);
    }
  } else if (trial.purpose === 'form') {
    const form = getTransformation(trial.payload.formId);
    const threshold = 0.45 + trial.difficulty * 0.05;
    if (score >= threshold) {
      if (!c.transformations.includes(form.id)) c.transformations.push(form.id);
      setMastery(state, form.id, 10);
      adjust(state, { happiness: 20, health: -15, fame: 5 });
      addFact(state.memory, { type: 'transformation', text: `Achieved ${form.name}.`, year: c.age, weight: 8, tags: ['transformation'] });
      lines.push(`${form.name}. ${form.desc}`);
    } else {
      adjust(state, { health: -18, happiness: -6 });
      lines.push(`You get right up against ${form.name} and no further.`);
    }
  } else if (trial.purpose === 'mastery') {
    const form = getTransformation(trial.payload.formId);
    const gain = Math.round(6 + trial.difficulty * 4 * result.mult);
    const total = setMastery(state, form.id, gain);
    adjust(state, { health: -8, stats: { discipline: 2 } });
    lines.push(`${form.name}: mastery ${total}%.`);
    if (total >= 100) lines.push('It costs you nothing to hold now. It is simply how you stand.');
  } else if (trial.purpose === 'recruitment') {
    const threshold = 0.4 + trial.difficulty * 0.05;
    const faction = getFaction(trial.payload.factionId);
    if (score >= threshold) {
      c.faction = trial.payload.factionId;
      const cur = currencyFor(getPlace(c.placeId).planet);
      credit(c, cur.id, 2000);
      addFact(state.memory, { type: 'faction', text: `Signed on with ${trial.payload.factionName}.`, year: c.age, weight: 8, tags: ['faction'] });
      adjust(state, { karma: faction ? Math.round(faction.alignment / 8) : 0, fame: 6 });
      lines.push(`They take your name and give you a number. You are in.`);
    } else {
      adjust(state, { happiness: -6 });
      lines.push(`Not this time. {"Come back when you are actually ready."|They do not even finish watching.|"No."}`);
    }
  } else if (trial.purpose === 'mission') {
    const threshold = 0.38 + trial.difficulty * 0.05;
    const faction = getFaction(trial.payload.factionId);
    const rankIdx = clamp(c.factionRank || 0, 0, (faction && faction.ranks ? faction.ranks.length - 1 : 0));
    if (score >= threshold) {
      const cur = currencyFor(getPlace(c.placeId).planet);
      let pay = Math.round((trial.payload.basePay || 1800) * result.mult);
      // An arrest warrant closes differently to every other assignment: there
      // is somebody at the end of it, and bringing them in alive is the whole
      // job. They get built like any other stranger you might meet - a real
      // race, stats, a title, an epithet - and then go on the record as
      // somebody you actually caught, not a line of flavour text.
      if (trial.payload.arrest) {
        const fugitive = makeNpc(rng, {
          placeId: c.placeId, year: currentYear(state), minAge: 18, maxAge: 60,
          powerScale: rng.float(0.6, 1.8),
        });
        pay = Math.round(pay * 1.6);
        credit(c, cur.id, pay);
        c.captures = c.captures || [];
        c.captures.push({
          id: 'capture_' + (c.captures.length + 1), year: c.age,
          name: fugitive.name, raceId: fugitive.raceId, power: fugitive.power,
          title: fugitive.title, epithet: fugitive.epithet,
          factionId: trial.payload.factionId, factionName: trial.payload.factionName, reward: pay,
        });
        c.factionStanding = clamp((c.factionStanding || 0) + Math.round(10 * result.mult), 0, 100);
        adjust(state, { happiness: 6, fame: 3, karma: 3 });
        addFact(state.memory, {
          type: 'faction', text: `Brought in ${fugitive.name}${fugitive.epithet ? `, ${fugitive.epithet}` : ''}, for ${trial.payload.factionName}.`,
          year: c.age, weight: 5, tags: ['faction', 'arrest'],
        });
        lines.push(`${fugitive.name}${fugitive.epithet ? ` - ${fugitive.epithet} -` : ''} does not come quietly, but comes. `
          + `Processed, jailed, and off the count. ${formatMoney(pay, cur.id)} for it.`);
      } else {
        credit(c, cur.id, pay);
        c.factionStanding = clamp((c.factionStanding || 0) + Math.round(7 * result.mult), 0, 100);
        adjust(state, { happiness: 4, fame: 1 });
        lines.push(`Assignment closed. Paid.`);
      }
      if (faction && faction.ranks && c.factionStanding >= 80 && rankIdx < faction.ranks.length - 1) {
        c.factionRank = rankIdx + 1;
        c.factionStanding = 15;
        lines.push(`Promoted: ${faction.ranks[c.factionRank]}.`);
      }
    } else {
      c.factionStanding = clamp((c.factionStanding || 0) - 8, 0, 100);
      adjust(state, { health: -Math.round(4 + trial.difficulty * 2), happiness: -4 });
      lines.push(trial.payload.arrest
        ? 'They get away, and word of that gets around before you do.'
        : 'The assignment goes sideways. You come back with less than you left with.');
    }
  } else if (trial.purpose === 'cooking') {
    // A regular-life skill, not a combat one: it climbs slowly no matter the
    // grade, but a clean run climbs it faster than a sloppy one.
    const before = c.flags.cookingSkill || 0;
    const gain = Math.round(1 + trial.difficulty * result.mult);
    c.flags.cookingSkill = clamp(before + gain, 0, 100);
    adjust(state, { happiness: Math.round(2 + 3 * result.mult) });
    lines.push(`Cooking: ${Math.round(c.flags.cookingSkill)}/100.`);
    if (before < 100 && c.flags.cookingSkill >= 100) lines.push('You could cook this in your sleep now.');
  }

  return { ...result, lines, text: lines.join(' ') };
}

// ------------------------------------------------------------- mastery

export function getMastery(state, formId) {
  return (state.character.formMastery && state.character.formMastery[formId]) || 0;
}

export function setMastery(state, formId, delta) {
  const c = state.character;
  c.formMastery = c.formMastery || {};
  c.formMastery[formId] = clamp((c.formMastery[formId] || 0) + delta, 0, 100);
  return Math.round(c.formMastery[formId]);
}

/**
 * Mastery makes a form cheaper to hold and slightly stronger. A mastered Super
 * Saiyan is not a bigger number, it is a form you can live in.
 */
export function masteryEffect(state, formId) {
  // One mastery curve, defined in mastery.js, so the number the screen quotes
  // is the number the fight uses.
  return {
    drainMult: masteryDrain(state.character, formId),
    powerMult: masteryMult(state.character, formId),
    mastery: Math.round(getMastery(state, formId)),
    label: masteryLabel(getMastery(state, formId)),
  };
}

/** Push past a mastered form and you may end up with something of your own. */
export function inventForm(state, rng, baseFormId, name) {
  const base = getTransformation(baseFormId);
  if (!base) return null;
  const c = state.character;
  c.customForms = c.customForms || [];
  // Building something nobody taught you is exactly what intellect is for -
  // a sharper mind gets a genuinely stronger, more efficient technique out
  // of the same starting form, not just a luckier roll.
  const intellectBonus = clamp(((c.stats.intellect || 50) - 50) / 300, -0.08, 0.25);
  const invented = {
    id: 'custom_' + (c.customForms.length + 1),
    name: name || `${c.name}'s Form`,
    baseId: baseFormId,
    mult: Math.round(base.mult * rng.float(1.3, 2.2) * (1 + intellectBonus) * 10) / 10,
    drain: Math.max(1, Math.round(base.drain * 0.85 * (1 - intellectBonus * 0.4))),
    desc: 'Nobody else has this. You built it out of something that already existed and something that did not.',
    year: state.character.birthYear + c.age,
    taught: [],
  };
  c.customForms.push(invented);
  addFact(state.memory, {
    type: 'transformation', weight: 10, year: c.age, tags: ['transformation', 'identity'],
    text: `Invented a transformation of their own: ${invented.name}.`,
  });
  return invented;
}
