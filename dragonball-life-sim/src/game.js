// Public game API. Importing this registers every event pack.

import './engine/events/origins.js';
import './engine/events/childhood.js';
import './engine/events/life.js';
import './engine/events/adult.js';
import './engine/events/training.js';
import './engine/events/social.js';
import './engine/events/conflict.js';
import './engine/events/world.js';
import './engine/events/wishes.js';
import './engine/events/afterlife.js';
import './engine/events/actions.js';

import { createGame, defaultCreation, characterSummary, currentYear, livingNpcs, aiContext } from './engine/state.js';
import { startYear, choose, currentEvent, enterAfterlife, epitaph, beginLegacy, die,
  insertEvent, renarrateLast, skipRemaining, eventsRemaining, reviveCharacter,
  tickRevivalEffort } from './engine/lifecycle.js';
import { initSampling, improviseEvent, narrateOutcome, backendName, aiAvailable,
  getApiKey, setApiKey, errorCopy, interpretWish } from './engine/ai.js';
import { save, load, listSaves, clearSlot, exportString, importString } from './engine/save.js';
import { allTemplates } from './engine/generator.js';
import { ladderStatus, nearbyForms, unlockableForms } from './engine/progression.js';
import { Rng, Rng as RngClass } from './engine/rng.js';
import { ACTIONS, availableActions, runAction, actionOptions } from './engine/events/actions.js';

export {
  createGame, defaultCreation, characterSummary, currentYear, livingNpcs, aiContext,
  startYear, choose, currentEvent, enterAfterlife, epitaph, beginLegacy, die,
  insertEvent, renarrateLast, skipRemaining, eventsRemaining, reviveCharacter, tickRevivalEffort,
  initSampling, improviseEvent, narrateOutcome, backendName, aiAvailable,
  getApiKey, setApiKey, errorCopy, interpretWish,
  save, load, listSaves, clearSlot, exportString, importString,
  allTemplates, ladderStatus, nearbyForms, unlockableForms, Rng,
  ACTIONS, availableActions, runAction, actionOptions,
};
