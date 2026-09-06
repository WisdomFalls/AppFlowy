// Trials: the small playable tests that sit behind training, learning a
// technique, and reaching for a form. The engine defines what a trial is and
// what a score is worth; the UI decides how it is played.

import { clamp } from './rng.js';
import { traitEffect } from '../data/traits.js';
import { getTechnique, TECH_BY_ID } from '../data/techniques.js';
import { getTransformation } from '../data/transformations.js';
import { grantTrainingPower } from './economy.js';
import { addFact } from './memory.js';
import { adjust } from './state.js';
import { combatPower } from './stats.js';
import { numberish } from './text.js';

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
  const m = getMastery(state, formId) / 100;
  return {
    drainMult: 1 - m * 0.75,
    powerMult: 1 + m * 0.25,
    mastery: Math.round(m * 100),
  };
}

/** Push past a mastered form and you may end up with something of your own. */
export function inventForm(state, rng, baseFormId, name) {
  const base = getTransformation(baseFormId);
  if (!base) return null;
  const c = state.character;
  c.customForms = c.customForms || [];
  const invented = {
    id: 'custom_' + (c.customForms.length + 1),
    name: name || `${c.name}'s Form`,
    baseId: baseFormId,
    mult: Math.round(base.mult * rng.float(1.3, 2.2) * 10) / 10,
    drain: Math.max(1, Math.round(base.drain * 0.85)),
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
