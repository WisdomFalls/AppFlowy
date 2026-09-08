import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Rng } from '../src/engine/rng.js';
import {
  createEmotionalState, getDominantEmotions, moodToEmotionBridge, decayEmotions,
  setEmotion, shiftEmotion, emotionToExpression, syncEmotionalState, EMOTION,
} from '../src/engine/emotion.js';
import {
  initializeFeatures, canHaveFeature, targetFeature, restoreFeature, hasFeature, ANATOMICAL_FEATURES,
} from '../src/engine/body.js';
import {
  hasKiSense, hasDetectableKi, canSenseKi, readPower,
} from '../src/engine/perception.js';

// Helper: create a minimal combat-ready character for testing
function mockCharacter(raceId = 'saiyan', overrides = {}) {
  return {
    raceId,
    power: 1000,
    stats: {
      strength: 50, speed: 50, durability: 50, technique: 50, kiControl: 50,
      ...overrides.stats,
    },
    vitals: { health: 100, healthMax: 100, ki: 100, kiMax: 100 },
    transformations: [],
    traits: [],
    techniques: [],
    items: [],
    flags: { majinMark: false },
    tail: true,
    ...overrides,
  };
}

// Phase 1A: Emotion System Tests
test('emotion system: creates empty emotional state', () => {
  const state = createEmotionalState();
  assert.deepEqual(state.furious, 0);
  assert.deepEqual(state.affectionate, 0);
  assert.deepEqual(state.determined, 0);
});

test('emotion system: sets emotion intensity', () => {
  let state = createEmotionalState();
  state = setEmotion(state, 'furious', 75);
  assert.equal(state.furious, 75);
  assert.equal(state.amused, 0);
});

test('emotion system: clamps emotion intensity 0-100', () => {
  let state = createEmotionalState();
  state = setEmotion(state, 'excited', 150);
  assert.equal(state.excited, 100);
  state = setEmotion(state, 'relieved', -50);
  assert.equal(state.relieved, 0);
});

test('emotion system: shifts emotion incrementally', () => {
  let state = createEmotionalState();
  state = setEmotion(state, 'amused', 30);
  state = shiftEmotion(state, 'amused', 20);
  assert.equal(state.amused, 50);
});

test('emotion system: gets dominant emotions in order', () => {
  let state = createEmotionalState();
  state = setEmotion(state, 'furious', 80);
  state = setEmotion(state, 'determined', 60);
  state = setEmotion(state, 'amused', 10);
  const dominant = getDominantEmotions(state, 15);
  assert.equal(dominant.length, 2);
  assert.equal(dominant[0].emotion, 'furious');
  assert.equal(dominant[0].intensity, 80);
  assert.equal(dominant[1].emotion, 'determined');
});

test('emotion system: filters emotions below threshold', () => {
  let state = createEmotionalState();
  state = setEmotion(state, 'excited', 50);
  state = setEmotion(state, 'amused', 10);
  const dominant = getDominantEmotions(state, 20);
  assert.equal(dominant.length, 1);
  assert.equal(dominant[0].emotion, 'excited');
});

test('emotion system: bridges free-text moods to emotions', () => {
  const bridge1 = moodToEmotionBridge('furious');
  assert.ok(bridge1.furious >= 70);

  const bridge2 = moodToEmotionBridge('frightened');
  assert.ok(bridge2.afraid >= 70);
  assert.ok(bridge2.confident < 50);

  const bridge3 = moodToEmotionBridge('spoiling for a fight');
  assert.ok(bridge3.furious > 30);
  assert.ok(bridge3.excited > 30);
  assert.ok(bridge3.determined > 30);
});

test('emotion system: decays emotions over time', () => {
  let state = createEmotionalState();
  state = setEmotion(state, 'excited', 80);
  state = setEmotion(state, 'furious', 60);
  state = decayEmotions(state, 0.9);
  assert.equal(state.excited, 72);  // 80 * 0.9
  assert.equal(state.furious, 54);  // 60 * 0.9
});

test('emotion system: maps emotions to expressions', () => {
  let state = createEmotionalState();
  state = setEmotion(state, 'furious', 85);
  const expr = emotionToExpression(state);
  assert.equal(expr.primary, 'furious');
  assert.equal(expr.intensity, 85);
});

test('emotion system: handles dual-emotion expressions', () => {
  let state = createEmotionalState();
  state = setEmotion(state, 'affectionate', 70);
  state = setEmotion(state, 'flustered', 60);
  const expr = emotionToExpression(state);
  // Should recognize the affectionate+flustered combo
  assert.ok(expr.primary === 'affectionate_flustered' || expr.primary === 'affectionate');
});

test('emotion system: syncs character emotions from mood', () => {
  const char = { raceId: 'saiyan', mood: 'furious' };
  syncEmotionalState(char);
  assert.ok(char.emotionalState);
  assert.ok(char.emotionalState.furious > 50);
});

// Phase 1B: Anatomical Features Tests
test('anatomical features: saiyan tail exists in registry', () => {
  assert.ok(ANATOMICAL_FEATURES.saiyan_tail);
  assert.equal(ANATOMICAL_FEATURES.saiyan_tail.id, 'saiyan_tail');
});

test('anatomical features: initializes features for capable races', () => {
  const saiyan = { raceId: 'saiyan', stats: { strength: 50, speed: 50 } };
  initializeFeatures(saiyan);
  assert.ok(saiyan.features);
  assert.ok(saiyan.features.saiyan_tail);
  assert.equal(saiyan.features.saiyan_tail.has, true);
});

test('anatomical features: checks if race can have feature', () => {
  const saiyan = { raceId: 'saiyan' };
  const human = { raceId: 'human' };
  assert.equal(canHaveFeature(saiyan, 'saiyan_tail'), true);
  assert.equal(canHaveFeature(human, 'saiyan_tail'), false);
});

test('anatomical features: targets and severs features', () => {
  const saiyan = {
    raceId: 'saiyan', power: 1000, stats: {},
    perk: 'none',  // no regeneration, so tail stays off
  };
  const rng = new Rng('test');
  initializeFeatures(saiyan);
  const result = targetFeature(saiyan, rng, 'saiyan_tail', 'Vegeta', { force: true });
  assert.ok(result);
  assert.ok(result.includes('tail'));
  assert.equal(saiyan.features.saiyan_tail.has, false);
  assert.equal(saiyan.features.saiyan_tail.lost, 1);
});

test('anatomical features: cannot target already-severed features', () => {
  const saiyan = { raceId: 'saiyan', power: 1000, stats: {} };
  const rng = new Rng('test');
  initializeFeatures(saiyan);
  targetFeature(saiyan, rng, 'saiyan_tail', 'Test', { force: true });
  const result2 = targetFeature(saiyan, rng, 'saiyan_tail', 'Test');
  assert.equal(result2, null);
});

test('anatomical features: restores severed features', () => {
  const saiyan = { raceId: 'saiyan', power: 1000, stats: { strength: 50, speed: 50 } };
  const rng = new Rng('test');
  initializeFeatures(saiyan);
  targetFeature(saiyan, rng, 'saiyan_tail', 'Test', { force: true });
  const restore = restoreFeature(saiyan, 'saiyan_tail');
  assert.equal(restore.ok, true);
  assert.equal(saiyan.features.saiyan_tail.has, true);
  assert.equal(saiyan.features.saiyan_tail.restored, 1);
});

test('anatomical features: tracks feature targeting history', () => {
  const saiyan = { raceId: 'saiyan', power: 1000, stats: { strength: 50, speed: 50 } };
  const rng = new Rng('test');
  initializeFeatures(saiyan);
  targetFeature(saiyan, rng, 'saiyan_tail', 'A', { force: true });
  restoreFeature(saiyan, 'saiyan_tail');
  targetFeature(saiyan, rng, 'saiyan_tail', 'B', { force: true });
  assert.equal(saiyan.features.saiyan_tail.lost, 2);
  assert.equal(saiyan.features.saiyan_tail.restored, 1);
});

test('anatomical features: hasFeature checks current state', () => {
  const saiyan = { raceId: 'saiyan', power: 1000, stats: { strength: 50, speed: 50 } };
  const rng = new Rng('test');
  assert.equal(hasFeature(saiyan, 'saiyan_tail'), true);
  targetFeature(saiyan, rng, 'saiyan_tail', 'Test', { force: true });
  assert.equal(hasFeature(saiyan, 'saiyan_tail'), false);
});

// Phase 1C: Android Ki Invisibility Tests
test('android perception: normal races have detectable ki', () => {
  const saiyan = { raceId: 'saiyan' };
  const human = { raceId: 'human' };
  assert.equal(hasDetectableKi(saiyan), true);
  assert.equal(hasDetectableKi(human), true);
});

test('android perception: androids have hidden ki by default', () => {
  const android = { raceId: 'android' };
  const halfAndroid = { raceId: 'half_android' };
  const frostAndroid = { raceId: 'frost_android' };
  assert.equal(hasDetectableKi(android), false);
  assert.equal(hasDetectableKi(halfAndroid), false);
  assert.equal(hasDetectableKi(frostAndroid), false);
});

test('android perception: ki_suppress technique hides ki', () => {
  const saiyan = { raceId: 'saiyan', techniques: ['ki_suppress'] };
  assert.equal(hasDetectableKi(saiyan), false);
});

test('android perception: ki_detectable flag reveals android ki', () => {
  const android = { raceId: 'android', flags: { ki_detectable: true } };
  assert.equal(hasDetectableKi(android), true);
});

test('android perception: ki sense fails on undetectable ki', () => {
  const observer = { techniques: ['ki_sense'] };
  const android = { raceId: 'android' };
  assert.equal(hasKiSense(observer), true);
  assert.equal(canSenseKi(observer, android), false);
});

test('android perception: ki sense succeeds on detectable targets', () => {
  const observer = { techniques: ['ki_sense'] };
  const saiyan = { raceId: 'saiyan' };
  assert.equal(canSenseKi(observer, saiyan), true);
});

test('android perception: readPower respects android ki invisibility', () => {
  const state = {
    character: mockCharacter('saiyan', { techniques: ['ki_sense'] }),
    stats: { fights: 0 },
  };
  const android = mockCharacter('android');
  const read = readPower(state, 50000, { target: android });
  assert.equal(read.known, false);
  assert.ok(read.text.includes('cannot sense'));
});

test('android perception: scouters measure android ki despite invisibility', () => {
  const state = {
    character: mockCharacter('human', { items: ['scouter'] }),
    stats: { fights: 0 },
  };
  const android = mockCharacter('android');
  const read = readPower(state, 50000, { target: android });
  assert.equal(read.known, true);
  assert.equal(read.how, 'scouter');
});
