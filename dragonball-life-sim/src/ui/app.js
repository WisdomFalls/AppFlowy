// UI controller. Vanilla DOM, one render pass per change - the simulation is
// the interesting part, so the interface stays boring on purpose.

import {
  createGame, defaultCreation, characterSummary, currentYear, livingNpcs,
  startYear, choose, currentEvent, enterAfterlife, epitaph, beginLegacy,
  insertEvent, renarrateLast, skipRemaining, ladderStatus, nearbyForms,
  availableActions, runAction, actionOptions, Rng,
  initSampling, improviseEvent, narrateOutcome, backendName, getApiKey, setApiKey, errorCopy,
  interpretWish,
  eventsRemaining,
  save, load, listSaves, clearSlot, exportString, importString,
} from '../game.js';
import { RACES, getRace, UPBRINGINGS, TEMPERAMENTS, BODY_TYPES } from '../data/races.js';
import { PLACES, getPlace } from '../data/places.js';
import { APPEARANCE } from '../engine/state.js';
import { portraitSvg, defaultAppearance, HAIR_STYLES, HAIR_COLOURS, EYE_SHAPES, EYE_COLOURS,
  SKIN_TONES, FACE_SHAPES, OUTFITS, STANCES as STANCE_LIST,
  MARK_PRESETS, ACCESSORY_PRESETS, wornAccessories, allMarks,
  npcPortrait, lifeStage } from './portrait.js';
import { eraName, worldPowerBaseline } from '../data/timeline.js';
import { generateFullName } from '../data/names.js';
import { BRANCHES, TECH_BY_ID } from '../data/techniques.js';
import { getTransformation } from '../data/transformations.js';
import { STAT_KEYS, STAT_LABELS, combatPower, powerTier } from '../engine/stats.js';
import { relationLabel, bondScore, bondLabel, romanceLabel, dossier, knowledgeLabel } from '../engine/npc.js';
import { npcActions, runNpcAction } from '../engine/social.js';
import { scoreReplyLocally, applyReply, impressionLabel } from '../engine/dialogue.js';
import { judgeReply, getAiConfig, setAiConfig, backendLabel, testAiEndpoint, PRESETS } from '../engine/ai.js';
import { numberish, zeni } from '../engine/text.js';
import { inventoryOf, ensureBag, toggleWorn, sellItem, buyItem, valueHere,
  repairItem, giveItem, knownItems, npcBag, requestItem, itemSlot } from '../engine/inventory.js';
import { currencyFor, balance, formatMoney, exchange, CURRENCIES } from '../data/currency.js';
import { getItem } from '../data/items.js';
import { TRAITS, getTrait, TRAIT_KINDS } from '../data/traits.js';
import { reputationOf, homeOf, homeBonus } from '../engine/settlement.js';
import { readPower, describePower, shortPower, canReadPower, hasScouter, hasKiSense } from '../engine/perception.js';
import { getRng, saveRng } from '../engine/state.js';
import { ceilingFor, ceilingBlock, ceilingPressure, masteryLabel } from '../engine/mastery.js';
import { injuryList } from '../engine/body.js';
import { worldManifest } from '../engine/worlds.js';
import { factionsPresent } from '../data/factions.js';
import { getPlanet } from '../data/planets.js';
import { startSurvival, survivalActions, survivalTurn, survivalStatus, RULES } from '../engine/survival.js';
import { createBattle, battleActions, takeTurn, battleStatus, describeMatchup, battleAftermath, STANCES } from '../engine/battle.js';
import { costLabel, limitFor, usedThisYear, yearCapacity } from '../engine/economy.js';
import { ballsHeld, ballManifest, pingSquare, GRID } from '../engine/dragonballs.js';
import { resolveTrial, getMastery } from '../engine/trials.js';
import {
  FORMATS, createTournament, roundName, playerMatch, playerOpponent,
  resolveOtherMatches, recordPlayerResult, matchBattleSpec, bracketSummary,
  standings, payout, placementLine, describeField, settle,
} from '../engine/tournament.js';
import { playTrial } from './trialui.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

let GAME = null;
let DRAFT = null;
let SHEET_MODE = null;
let AI_MODE = 'mixed';        // off | mixed | always
let AI_BUSY = false;
let PENDING_ACTION = null;
let BATTLE = null;
let BATTLE_TAB = 'strike';
let BATTLE_RETURN = null;
let TOURNEY = null;

const ERAS = [
  { year: 720, label: 'Age 720 - long before any of it' },
  { year: 733, label: 'Age 733 - the world is quiet' },
  { year: 737, label: 'Age 737 - the year Planet Vegeta falls' },
  { year: 749, label: 'Age 749 - the Red Ribbon Army rises' },
  { year: 756, label: 'Age 756 - the tournament years' },
  { year: 761, label: 'Age 761 - a Saiyan lands on Earth' },
  { year: 764, label: 'Age 764 - a boy arrives from the future' },
  { year: 767, label: 'Age 767 - the Android crisis' },
  { year: 774, label: 'Age 774 - Majin Buu is released' },
  { year: 778, label: 'Age 778 - the gods wake up' },
  { year: 780, label: 'Age 780 - the Tournament of Power' },
  { year: 790, label: 'Age 790 - the long peace' },
];

// ------------------------------------------------------------------ toast

let toastTimer = null;
function flash(message, ms = 2600) {
  const node = $('toast');
  if (!message) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), ms);
}

// --------------------------------------------------------------- creation

function optionRow(container, items, selectedId, onPick) {
  container.innerHTML = '';
  for (const item of items) {
    const b = el('button', 'opt' + (item.id === selectedId ? ' on' : ''), item.name);
    b.type = 'button';
    b.addEventListener('click', () => onPick(item.id));
    container.appendChild(b);
  }
}

function fillSelect(node, values, selected, labelFn) {
  node.innerHTML = '';
  for (const v of values) {
    const o = document.createElement('option');
    o.value = typeof v === 'object' ? v.value : v;
    o.textContent = labelFn ? labelFn(v) : (typeof v === 'object' ? v.label : v);
    if (o.value === String(selected)) o.selected = true;
    node.appendChild(o);
  }
}


function swatchRow(container, list, selectedId, onPick) {
  const wrap = el('div', 'swatches');
  for (const item of list) {
    const b = el('button', 'swatch' + (item.id === selectedId ? ' on' : ''));
    b.type = 'button';
    b.style.background = item.hex;
    b.title = item.name;
    b.setAttribute('aria-label', item.name);
    b.addEventListener('click', () => onPick(item.id));
    wrap.appendChild(b);
  }
  container.appendChild(wrap);
}

function labelled(container, text) {
  container.appendChild(el('span', 'field-label', text));
}

function renderCreation() {
  const race = getRace(DRAFT.raceId);

  optionRow($('opt-race'), RACES.map((r) => ({ id: r.id, name: r.short })), DRAFT.raceId, (id) => {
    DRAFT.raceId = id;
    if (!DRAFT.nameTouched) DRAFT.name = generateFullName(new Rng(Date.now()), id);
    renderCreation();
  });

  const card = $('race-card');
  card.innerHTML = '';
  card.appendChild(el('div', 'race-name', race.name));
  card.appendChild(el('div', 'race-blurb', race.blurb));
  card.appendChild(el('div', 'race-note', race.notes));

  $('in-name').value = DRAFT.name;

  const era = $('in-era');
  if (!era.options.length) {
    fillSelect(era, ERAS.map((e2) => ({ value: String(e2.year), label: e2.label })), String(DRAFT.birthYear));
    era.addEventListener('change', () => { DRAFT.birthYear = Number(era.value); renderCreation(); });
  }
  era.value = String(DRAFT.birthYear);
  $('era-note').textContent =
    `${eraName(DRAFT.birthYear)}. A serious fighter of this era is around ${numberish(worldPowerBaseline(DRAFT.birthYear))}.`
    + originHint(DRAFT.raceId, DRAFT.birthYear);

  const sexes = $('opt-sex');
  sexes.innerHTML = '';
  for (const sx of [['female', 'Female'], ['male', 'Male']]) {
    const b = el('button', 'opt' + (DRAFT.sex === sx[0] ? ' on' : ''), sx[1]);
    b.type = 'button';
    b.addEventListener('click', () => { DRAFT.sex = sx[0]; renderCreation(); });
    sexes.appendChild(b);
  }

  const seed = $('in-seed');
  if (seed) seed.value = DRAFT.seed || '';
}

/** A hint about what being this species in this century usually means. */
function originHint(raceId, year) {
  if (raceId === 'saiyan' && year < 737) return ' Planet Vegeta still stands, and it will not stand for long.';
  if (raceId === 'saiyan' && year === 737) return ' You are born in the year Planet Vegeta falls. You will be very small when it happens.';
  if (raceId === 'saiyan') return ' Your people are ash. You were not on the planet.';
  if (raceId === 'namekian' && year < 763) return ' Namek is still there.';
  if (raceId === 'cerealian') return ' The Saiyans came to Cereal. Most of you did not survive it.';
  if (raceId === 'android' || raceId === 'bioandroid') return ' Somebody built you, and they had reasons.';
  if (raceId === 'frostdemon') return ' You are born at a power most people die chasing.';
  return '';
}

function readCreationInputs() {
  DRAFT.name = $('in-name').value.trim() || DRAFT.name;
}

function newDraft() {
  const rng = new Rng(Date.now() ^ Math.floor(Math.random() * 1e9));
  const d = defaultCreation(rng);
  d.birthYear = 737;
  d.nameTouched = false;
  d.seed = '';
  // Nothing about the body is chosen any more; createGame rolls it from the
  // species and the century.
  delete d.look;
  delete d.upbringingId;
  delete d.bodyId;
  delete d.temperamentId;
  delete d.placeId;
  return d;
}

// -------------------------------------------------------------------- HUD

/** The strongest form they have, used to tint the portrait's aura. */
function bestOwnedForm(c) {
  if (!c.transformations || !c.transformations.length) return null;
  const forms = ladderStatus(GAME).filter((f) => f.owned);
  if (!forms.length) return null;
  return forms.sort((a, b) => b.mult - a.mult)[0];
}

function renderHud() {
  const s = characterSummary(GAME);
  const c = GAME.character;
  const portraitBox = $('hud-portrait');
  if (portraitBox) {
    const form = c.activeForm || (c.transformations.length ? { name: '' } : null);
    portraitBox.innerHTML = portraitSvg(c, { form: bestOwnedForm(c) });
  }
  $('hud-name').textContent = c.name;
  $('hud-sub').textContent = `${c.sex === 'female' ? 'Female' : 'Male'} ${s.race} - ${s.place} - Age ${s.year}`
    + `${c.inAfterlife ? ' - OTHER WORLD' : ''}`;
  $('hud-age').innerHTML = `${c.age}<small>${c.inAfterlife ? 'dead' : 'years'}</small>`;
  $('hud-power').textContent = numberish(s.combat);
  $('hud-tier').textContent = s.tier;

  const setBar = (key, value, max) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    $('f-' + key).style.width = pct + '%';
    $('v-' + key).textContent = Math.round(value);
  };
  // Health has a ceiling that moves, so the number says what it is out of.
  const hMax = Math.max(1, c.vitals.healthMax || 100);
  setBar('health', c.vitals.health, hMax);
  $('v-health').textContent = hMax > 100
    ? `${Math.round(c.vitals.health)}/${Math.round(hMax)}`
    : Math.round(c.vitals.health);
  setBar('happy', c.vitals.happiness, 100);
  setBar('ki', c.vitals.ki, Math.max(1, c.vitals.kiMax));

  const pills = $('hud-pills');
  pills.innerHTML = '';
  const add = (label, value, cls) => {
    const p = el('span', 'pill' + (cls ? ' ' + cls : ''));
    p.innerHTML = `${label} <b>${value}</b>`;
    pills.appendChild(p);
  };
  const cap = yearCapacity(GAME);
  if (cap < 0.75) add('Year', cap < 0.5 ? 'Small' : 'Short', 'gold');
  // The money in your hand is the money of the world you are standing on.
  const localCur = currencyFor(getPlace(c.placeId).planet);
  add(localCur.short, Math.round(balance(c, localCur.id)).toLocaleString('en-US'));
  const rep = reputationOf(GAME);
  add('Known to', rep.reach > 999 ? numberish(rep.reach) : Math.round(rep.reach));
  add('Karma', Math.round(c.karma), c.karma > 20 ? 'good' : c.karma < -20 ? 'bad' : '');
  if (c.career) add('Job', c.career.title);
  if (c.senzu) add('Senzu', c.senzu, 'good');
  const balls = ballsHeld(GAME);
  if (balls) add('Dragon Balls', balls + '/7', 'gold');
  if (c.transformations.length) add('Forms', c.transformations.length, 'gold');
  if (GAME.legacy) add('Generation', GAME.legacy.generation);

  // Coming back from the dead has to change the button under your thumb.
  const ageBtn = $('btn-age');
  if (ageBtn) {
    ageBtn.textContent = c.inAfterlife ? 'Another year dead' : 'Age up';
    ageBtn.classList.toggle('dead', !!c.inAfterlife);
  }
}

// ------------------------------------------------------------------- feed

function changeChips(entry) {
  return null;
}

function renderFeed() {
  const feed = $('feed');
  feed.innerHTML = '';
  if (!GAME.log.length) {
    feed.appendChild(el('div', 'feed-empty', 'Press Age Up to start living.'));
    return;
  }
  for (const year of GAME.log.slice(-24)) {
    if (!year.entries.length) continue;
    const block = el('div', 'year-block');
    const head = el('div', 'year-head');
    head.innerHTML = `<b>Age ${year.age}</b> <span>Year ${year.year}</span>`;
    block.appendChild(head);

    for (const entry of year.entries) {
      const node = el('div', 'entry ' + (entry.kind || 'event'));
      if (entry.title) {
        const t = el('div', 'entry-title', entry.title);
        if (entry.aiNarrated) {
          const tag = el('span', 'ai-tag', 'AI');
          t.appendChild(tag);
        }
        node.appendChild(t);
      }
      if (entry.text) node.appendChild(el('div', 'entry-text', entry.text));
      if (entry.outcome) node.appendChild(el('div', 'entry-outcome', entry.outcome));
      block.appendChild(node);
    }
    feed.appendChild(block);
  }
  feed.scrollTop = feed.scrollHeight;
}

// ------------------------------------------------------------------ sheet

function openSheet(mode) {
  SHEET_MODE = mode;
  $('sheet').classList.add('open');
  $('scrim').classList.add('open');
}

function closeSheet() {
  SHEET_MODE = null;
  PENDING_ACTION = null;
  $('sheet').classList.remove('open');
  $('scrim').classList.remove('open');
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
}

function sheetShell(title, kicker) {
  const body = $('sheet-body');
  const foot = $('sheet-foot');
  body.innerHTML = '';
  foot.innerHTML = '';
  const head = el('div', 'panel-head');
  const h = el('div', 'panel-title', title);
  h.id = 'sheet-heading';
  head.appendChild(h);
  if (kicker) head.appendChild(el('div', 'panel-sub', kicker));
  body.appendChild(head);
  return { body, foot };
}

// ------------------------------------------------------------------ event

function showEvent(event) {
  if (!event) return;
  const body = $('sheet-body');
  const foot = $('sheet-foot');
  body.innerHTML = '';
  foot.innerHTML = '';

  const left = eventsRemaining(GAME);
  const kicker = event.ai
    ? 'Improvised - written just now'
    : `Age ${GAME.character.age}${left > 0 ? ` - ${left} more this year` : ''}`;
  body.appendChild(el('div', 'event-kicker', kicker));
  const title = el('h2', 'event-title', event.title);
  title.id = 'sheet-heading';
  body.appendChild(title);
  body.appendChild(el('p', 'event-text', event.text));

  for (const choice of event.choices) {
    const b = el('button', 'choice' + (choice.danger ? ' danger' : '') + (choice.freeText ? ' speak' : ''));
    b.type = 'button';
    b.disabled = !!choice.locked;
    b.appendChild(el('span', 'choice-label', choice.label));
    if (choice.hint || choice.lockReason) {
      b.appendChild(el('span', 'choice-hint', choice.locked ? choice.lockReason : choice.hint));
    }
    // Some choices want words rather than a click. The box opens in the card
    // body so the player can see what they are answering while they type.
    if (choice.freeText) {
      b.addEventListener('click', () => openFreeTextChoice(event, choice));
    } else {
      b.addEventListener('click', () => answerEvent(event, choice.id));
    }
    foot.appendChild(b);
  }

  if (AI_MODE !== 'off' && backendName() !== 'none' && !event.ai) {
    const b = el('button', 'choice ai');
    b.type = 'button';
    b.appendChild(el('span', 'choice-label', 'Something else happens instead'));
    b.appendChild(el('span', 'choice-hint', 'Ask Claude to write a different event for this year'));
    b.addEventListener('click', () => requestAiEvent(true));
    foot.appendChild(b);
  }

  openSheet('event');
}

function openFreeTextChoice(event, choice) {
  const body = $('sheet-body');
  const foot = $('sheet-foot');
  foot.innerHTML = '';

  const wrap = el('div', 'speak-box');
  wrap.appendChild(el('div', 'field-label', choice.label));
  const box = document.createElement('textarea');
  box.className = 'text-input';
  box.rows = 3;
  box.maxLength = 240;
  box.placeholder = choice.placeholder || 'In your own words.';
  wrap.appendChild(box);
  body.appendChild(wrap);
  box.focus();

  const say = el('button', 'choice');
  say.type = 'button';
  say.appendChild(el('span', 'choice-label', 'Say it'));
  say.addEventListener('click', async () => {
    const text = box.value.trim();
    if (!text) { flash('Say something first.'); return; }
    say.disabled = true;
    const params = { text };
    // Where a model is connected it reads the wish as the dragon would,
    // rather than leaving it to keyword matching.
    if (choice.interpret && backendName() !== 'none') {
      say.querySelector('.choice-label').innerHTML = '<span class="spinner"></span>The dragon considers it';
      const read = await interpretWish(GAME, text, choice.interpret);
      if (read && read.wishId) { params.wishId = read.wishId; params.reading = read.reading; }
    }
    answerEvent(event, choice.id, params);
  });
  foot.appendChild(say);

  const back = el('button', 'choice');
  back.type = 'button';
  back.appendChild(el('span', 'choice-label', 'Choose from a list instead'));
  back.addEventListener('click', () => showEvent(event));
  foot.appendChild(back);
}

function answerEvent(event, choiceId, params) {
  const pending = choose(GAME, choiceId, params || null);
  renderHud();
  renderFeed();
  maybeNarrate(event);

  if (!GAME.character.alive) {
    closeSheet();
    showDeath();
    return;
  }

  // A choice that starts a fight hands the turn to the battle screen; the rest
  // of the year waits until it is finished.
  const spec = GAME.turn && GAME.turn.pendingBattle;
  if (spec) {
    GAME.turn.pendingBattle = null;
    closeSheet();
    openBattle(spec);
    return;
  }

  const bracket = GAME.turn && GAME.turn.pendingTournament;
  if (bracket) {
    GAME.turn.pendingTournament = null;
    closeSheet();
    openTournament(bracket);
    return;
  }

  const board = GAME.turn && GAME.turn.pendingSurvival;
  if (board) {
    GAME.turn.pendingSurvival = null;
    closeSheet();
    openSurvival(board);
    return;
  }

  const eventTrial = GAME.turn && GAME.turn.pendingTrial;
  if (eventTrial) {
    GAME.turn.pendingTrial = null;
    closeSheet();
    openTrial(eventTrial);
    return;
  }

  if (pending) {
    showEvent(pending);
  } else {
    closeSheet();
    autosave();
  }
}

async function maybeNarrate(event) {
  if (AI_MODE !== 'always' || backendName() === 'none' || event.ai) return;
  const last = GAME.turn && GAME.turn.entries.slice().reverse().find((e2) => e2.kind === 'event');
  if (!last || !last.outcome) return;
  const rewritten = await narrateOutcome(GAME, event, last.outcome);
  if (rewritten && rewritten !== last.outcome) {
    renarrateLast(GAME, rewritten);
    renderFeed();
  }
}

// --------------------------------------------------------------- age flow

async function ageUp() {
  if (!GAME) return;
  if (!GAME.character.alive) { showDeath(); return; }

  const event = startYear(GAME);
  renderHud();
  renderFeed();

  if (!GAME.character.alive) { showDeath(); return; }

  const wantsAi = AI_MODE !== 'off' && backendName() !== 'none'
    && (AI_MODE === 'always' || Math.random() < 0.45);

  if (event) showEvent(event);
  else { autosave(); }

  if (wantsAi) requestAiEvent(false);
}

async function requestAiEvent(replace) {
  if (AI_BUSY) return;
  if (!GAME.turn || GAME.turn.done) return;
  AI_BUSY = true;

  if (replace) {
    const foot = $('sheet-foot');
    foot.innerHTML = '';
    const note = el('div', 'choice ai');
    note.innerHTML = '<span class="choice-label"><span class="spinner"></span>Claude is writing this year</span>'
      + '<span class="choice-hint">Usually five to thirty seconds.</span>';
    foot.appendChild(note);
  }

  const result = await improviseEvent(GAME, {});
  AI_BUSY = false;

  if (!result || result.error) {
    const copy = result ? errorCopy(result.code) : '';
    if (copy) flash(copy);
    const fallback = currentEvent(GAME);
    if (replace && fallback) showEvent(fallback);
    return;
  }

  if (replace) {
    // Drop the procedural event this one is standing in for.
    GAME.turn.queue.splice(GAME.turn.index, 1, result);
    showEvent(result);
  } else {
    insertEvent(GAME, result);
    // Only take over the screen if nothing is currently being read.
    if (SHEET_MODE !== 'event') {
      const now = currentEvent(GAME);
      if (now) showEvent(now);
    }
  }
}

// ---------------------------------------------------------------- panels

function panelActivities() {
  const actionsAll = availableActions(GAME);
  const openCount = actionsAll.filter((a) => !a.blocked).length;
  const { body } = sheetShell('Activities', `${openCount} still open this year`);
  if (!openCount) {
    body.appendChild(el('p', 'row-note', 'Everything you can do this year, you have done. Age up.'));
  }
  const groups = { body: 'Body', mind: 'Mind', power: 'Power', social: 'People', world: 'World' };
  const actions = actionsAll;

  for (const [key, label] of Object.entries(groups)) {
    const inGroup = actions.filter((a) => a.cat === key);
    if (!inGroup.length) continue;
    body.appendChild(el('div', 'group-label', label));
    for (const action of inGroup) {
      const b = el('button', 'row' + (action.danger ? ' danger' : '') + (action.blocked ? ' locked' : ''));
      b.type = 'button';
      b.disabled = !!action.blocked;
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', action.name));
      main.appendChild(el('div', 'row-note', action.blocked || action.desc));
      b.appendChild(main);
      const cost = el('div', 'row-value');
      // The count is the budget now, so it leads.
      if (action.limit !== undefined && Number.isFinite(action.limit)) {
        cost.appendChild(el('div', 'row-count', `${action.used}/${action.limit}`));
      }
      cost.appendChild(el('div', 'row-when', action.cost));
      b.appendChild(cost);
      b.addEventListener('click', () => {
        const options = actionOptions(GAME, action.id);
        if (options && options.length) chooseActionTarget(action, options);
        else doAction(action.id, {});
      });
      body.appendChild(b);
    }
  }
  openSheet('panel');
}

function chooseActionTarget(action, options) {
  const { body } = sheetShell(action.name, 'Pick one');
  body.appendChild(el('p', 'row-note', action.desc));
  let group = null;
  for (const option of options) {
    // Options can arrive grouped - travel is by world first, place second.
    if (option.group && option.group !== group) {
      group = option.group;
      body.appendChild(el('div', 'group-head', group));
    }
    const b = el('button', 'row');
    b.type = 'button';
    b.disabled = !!option.disabled;
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', option.label));
    if (option.reason) main.appendChild(el('div', 'row-note warn', option.reason));
    else if (option.hint) main.appendChild(el('div', 'row-note', option.hint));
    b.appendChild(main);
    b.addEventListener('click', () => doAction(action.id, { option: option.id }));
    body.appendChild(b);
  }
  const back = el('button', 'ghost-btn', 'Back');
  back.type = 'button';
  back.addEventListener('click', panelActivities);
  body.appendChild(back);
  openSheet('panel');
}

function doAction(actionId, params) {
  const rng = getRng(GAME);
  const result = runAction(GAME, rng, actionId, params);
  saveRng(GAME, rng);

  if (result.refused) {
    flash(result.text);
    panelActivities();
    return;
  }

  if (result.battle) {
    closeSheet();
    logLine({ kind: 'event', title: null, text: result.text });
    openBattle(result.battle);
    return;
  }

  if (result.hunt) {
    closeSheet();
    openHunt(result.hunt);
    return;
  }

  if (result.trial) {
    closeSheet();
    logLine({ kind: 'event', title: null, text: result.text });
    openTrial(result.trial);
    return;
  }

  const entry = { kind: 'event', title: null, text: result.text };
  if (result.gained) entry.text += ` Power level up ${numberish(result.gained)}.`;
  if (result.skipYears) {
    // A crossing that takes years takes them out of your life.
    for (let i = 0; i < result.skipYears && GAME.character.alive; i++) {
      startYear(GAME);
      skipRemaining(GAME);
    }
  }
  if (result.unlocked) entry.text += ` ${result.unlocked} unlocked.`;

  logLine(entry);

  if (GAME.character.vitals.health <= 0 && result.lethal) {
    GAME.character.alive = false;
    GAME.character.death = { cause: 'Killed doing something reckless', year: currentYear(GAME), age: GAME.character.age };
  }

  renderHud();
  renderFeed();
  autosave();

  if (!GAME.character.alive) { closeSheet(); showDeath(); return; }
  panelActivities();
  flash(result.text.slice(0, 140));
}

function panelPeople() {
  const { body } = sheetShell('People', `${livingNpcs(GAME).length} alive`);
  const people = livingNpcs(GAME).sort((a, b) => bondScore(b) - bondScore(a));
  const dead = Object.values(GAME.npcs).filter((n) => !n.alive);

  if (!people.length) body.appendChild(el('p', 'row-note', 'Nobody yet. Age up and meet somebody.'));

  const groups = [
    ['Family', (n) => ['parent', 'sibling', 'child', 'spouse'].includes(n.relation)],
    ['Close', (n) => ['friend', 'bestfriend', 'lover', 'mentor', 'student'].includes(n.relation)],
    ['Bad blood', (n) => ['rival', 'nemesis', 'enemy'].includes(n.relation)],
    ['Everyone else', (n) => !['parent', 'sibling', 'child', 'spouse', 'friend', 'bestfriend', 'lover',
      'mentor', 'student', 'rival', 'nemesis', 'enemy'].includes(n.relation)],
  ];

  for (const [label, filter] of groups) {
    const set = people.filter(filter);
    if (!set.length) continue;
    body.appendChild(el('div', 'group-label', label));
    for (const npc of set.slice(0, 40)) {
      const row = el('button', 'row');
      row.type = 'button';
      const face = el('div', 'row-face');
      face.innerHTML = npcPortrait(npc, { maturityRate: getRace(npc.raceId).maturityRate ?? 1 });
      row.appendChild(face);
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', npc.name + (npc.isCanon ? ' \u2605' : '')));
      const romance = romanceLabel(npc);
      main.appendChild(el('div', 'row-note',
        `${relationLabel(npc)} - ${bondLabel(npc)}${romance ? ' - ' + romance : ''} - ${getRace(npc.raceId).short}, ${npc.age}`));
      row.appendChild(main);

      const bond = el('div', 'bond');
      const track = el('div', 'bond-track');
      const fill = el('div', 'bond-fill');
      fill.style.width = Math.max(0, bondScore(npc)) + '%';
      track.appendChild(fill);
      bond.appendChild(track);
      row.appendChild(bond);
      row.addEventListener('click', () => panelPerson(npc.id));
      body.appendChild(row);
    }
  }

  if (dead.length) {
    body.appendChild(el('div', 'group-label', 'Gone'));
    for (const npc of dead.slice(0, 20)) {
      const row = el('div', 'row locked');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', npc.name));
      main.appendChild(el('div', 'row-note', `${relationLabel(npc)} - ${npc.causeOfDeath || 'died'}`));
      row.appendChild(main);
      body.appendChild(row);
    }
  }
  openSheet('panel');
}

/** One person: what you know about them, and what you can do about it. */
function panelPerson(npcId) {
  const npc = GAME.npcs[npcId];
  if (!npc) { panelPeople(); return; }
  const { body } = sheetShell(npc.name, knowledgeLabel(npc));

  const romance = romanceLabel(npc);
  body.appendChild(el('p', 'row-note',
    `${relationLabel(npc)} - ${bondLabel(npc)}${romance ? ' - ' + romance : ''}`));

  const shot = el('div', 'npc-portrait');
  shot.innerHTML = npcPortrait(npc, { maturityRate: getRace(npc.raceId).maturityRate ?? 1 });
  body.appendChild(shot);

  if (npc.isCanon && npc.personality) {
    body.appendChild(el('p', 'entry-text', npc.personality));
  }

  body.appendChild(el('div', 'group-label', 'What you know'));
  // Only what you can actually read. Knowing somebody for years tells you they
  // are dangerous; it does not tell you a figure.
  const read = readPower(GAME, npc.power);
  const powerRead = read.known
    ? `${read.text} (${read.how})`
    : read.broke ? 'Your scouter did not survive the reading.'
      : `${read.text}${(npc.knowledge || 0) >= 2 ? '' : ''}`;
  if (read.broke) flash('Your scouter climbs, screams and comes apart.', 5000);
  const table = el('div', 'dossier');
  for (const row of dossier(npc, { full: npc.isCanon, powerRead })) {
    const line = el('div', 'dossier-row');
    line.appendChild(el('span', 'dossier-key', row.label));
    line.appendChild(el('span', 'dossier-val' + (row.value === '\u2014' ? ' unknown' : ''), row.value));
    table.appendChild(line);
  }
  body.appendChild(table);

  // What they are carrying, as far as you have seen. Ask, buy, or take it.
  const rng0 = getRng(GAME);
  npcBag(rng0, npc);
  saveRng(GAME, rng0);
  const theirs = knownItems(npc);
  if (theirs.length) {
    body.appendChild(el('div', 'group-label', 'What they have'));
    for (const entry of theirs) {
      const item = getItem(entry.id);
      if (!item) continue;
      const price = valueHere(GAME, entry.id);
      const row = el('div', 'row');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', item.name + (entry.worn ? ' (on them)' : '')));
      main.appendChild(el('div', 'row-note', item.desc));
      row.appendChild(main);
      const acts = el('div', 'item-acts');
      for (const [how, label] of [['ask', 'Ask'], ['buy', formatMoney(price.amount, price.currency)], ['take', 'Take']]) {
        const b = el('button', 'mini' + (how === 'take' ? ' danger' : ''), label);
        b.type = 'button';
        b.addEventListener('click', () => {
          const rng = getRng(GAME);
          const res = requestItem(GAME, rng, npc, entry.id, how);
          saveRng(GAME, rng);
          flash(res.text, 5000);
          logLine({ kind: 'event', title: `${item.name}`, text: res.text });
          renderHud();
          renderFeed();
          autosave();
          panelPerson(npc.id);
        });
        acts.appendChild(b);
      }
      row.appendChild(acts);
      body.appendChild(row);
    }
  }

  // Something of yours, handed over.
  const mine = inventoryOf(GAME.character).filter((r) => !r.worn);
  if (mine.length) {
    const give = el('button', 'ghost-btn', `Give ${npc.name} something`);
    give.type = 'button';
    give.addEventListener('click', () => panelGive(npc.id));
    body.appendChild(give);
  }

  const tones = [['warm', 'Kindness'], ['romance', 'Romance'], ['hostile', 'Cruelty']];
  const actions = npcActions(GAME, npc);
  for (const [tone, label] of tones) {
    const set = actions.filter((a) => a.tone === tone);
    if (!set.length) continue;
    body.appendChild(el('div', 'group-label', label));
    for (const action of set) {
      const b = el('button', 'row' + (action.tone === 'hostile' ? ' danger' : '') + (action.blocked ? ' locked' : ''));
      b.type = 'button';
      b.disabled = !!action.blocked;
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', action.name));
      main.appendChild(el('div', 'row-note', action.blocked || action.desc));
      b.appendChild(main);
      b.appendChild(el('div', 'row-value', action.slots ? `${action.slots}` : '-'));
      b.addEventListener('click', () => doSocial(npcId, action.id));
      body.appendChild(b);
    }
  }

  const back = el('button', 'ghost-btn', 'Back to everyone');
  back.type = 'button';
  back.addEventListener('click', panelPeople);
  body.appendChild(back);
  openSheet('panel');
}

/** A text box, and whatever the other person makes of what you wrote. */
function openSayPanel(npcId) {
  const npc = GAME.npcs[npcId];
  if (!npc) return;
  const { body } = sheetShell(`Say something to ${npc.name}`, npc.mood || '');

  body.appendChild(el('p', 'row-note',
    backendName() === 'none'
      ? 'No model connected, so they read your tone rather than your meaning.'
      : `${backendLabel()} will read this as ${npc.name} and answer in their voice.`));

  const box = document.createElement('textarea');
  box.className = 'text-input';
  box.rows = 4;
  box.maxLength = 400;
  box.placeholder = `Whatever you actually want to say to ${npc.name}.`;
  body.appendChild(box);

  const output = el('div', 'entry-outcome');
  output.style.marginTop = '10px';
  body.appendChild(output);

  const send = el('button', 'primary-btn', 'Say it');
  send.type = 'button';
  send.addEventListener('click', async () => {
    const line = box.value.trim();
    if (!line) { flash('Say something first.'); return; }
    send.disabled = true;
    box.disabled = true;
    output.innerHTML = '<span class="spinner"></span>Waiting for an answer.';

    const rng = getRng(GAME);
    const charged = runNpcAction(GAME, rng, npcId, 'say');
    saveRng(GAME, rng);
    if (charged.refused) { flash(charged.text); send.disabled = false; box.disabled = false; return; }

    let judged = null;
    if (backendName() !== 'none') {
      const asked = await judgeReply(GAME, npc, line);
      if (asked && !asked.error) judged = asked;
    }
    if (!judged) judged = scoreReplyLocally(line, npc, GAME.character);

    applyReply(npc, judged);
    const summary = `${impressionLabel(judged.impression)} ${judged.reply || ''}`.trim();
    output.textContent = summary;
    logLine({ kind: 'event', title: `You said something to ${npc.name}`, text: `"${line}"`, outcome: summary });
    renderHud();
    renderFeed();
    autosave();

    const back = el('button', 'ghost-btn', 'Back to them');
    back.type = 'button';
    back.addEventListener('click', () => panelPerson(npcId));
    body.appendChild(back);
    send.remove();
  });
  body.appendChild(send);

  const cancel = el('button', 'ghost-btn', 'Never mind');
  cancel.type = 'button';
  cancel.addEventListener('click', () => panelPerson(npcId));
  body.appendChild(cancel);
  openSheet('panel');
}

function doSocial(npcId, actionId) {
  if (actionId === 'say') { openSayPanel(npcId); return; }
  const rng = getRng(GAME);
  const result = runNpcAction(GAME, rng, npcId, actionId);
  saveRng(GAME, rng);

  if (result.refused) {
    flash(result.text);
    return;
  }

  const npc = GAME.npcs[npcId];
  if (result.battle) {
    closeSheet();
    logLine({ kind: 'event', title: null, text: result.text });
    openBattle(result.battle);
    return;
  }

  logLine({ kind: 'event', title: npc ? npc.name : null, text: result.text });
  renderHud();
  renderFeed();
  autosave();
  panelPerson(npcId);
  flash(result.text.slice(0, 140));
}

function panelPower() {
  const c = GAME.character;
  const { body } = sheetShell('Power', powerTier(combatPower(c)));

  body.appendChild(el('div', 'group-label', 'Attributes'));
  const grid = el('div', 'stat-grid');
  for (const key of STAT_KEYS) {
    const box = el('div', 'stat');
    box.appendChild(el('div', 'stat-name', STAT_LABELS[key]));
    box.appendChild(el('div', 'stat-val', Math.round(c.stats[key])));
    const track = el('div', 'stat-track');
    const bar = el('div', 'stat-bar');
    bar.style.width = Math.min(100, c.stats[key]) + '%';
    track.appendChild(bar);
    box.appendChild(track);
    grid.appendChild(box);
  }
  body.appendChild(grid);

  // The roof. A ceiling nobody can see reads as broken progression, so it is
  // stated plainly along with what would lift it.
  const block = ceilingBlock(GAME);
  const roof = ceilingFor(GAME);
  body.appendChild(el('div', 'group-label', 'The ceiling'));
  const roofRow = el('div', 'row' + (block && block.at ? ' locked' : ''));
  const roofMain = el('div', 'row-main');
  roofMain.appendChild(el('div', 'row-title',
    `${numberish(Math.round(c.power))} of about ${numberish(Math.round(roof))}`));
  roofMain.appendChild(el('div', 'row-note', block
    ? block.text
    : 'Training is still paying. You are nowhere near what this shape holds.'));
  roofRow.appendChild(roofMain);
  roofRow.appendChild(el('div', 'row-value', Math.round(ceilingPressure(GAME) * 100) + '%'));
  body.appendChild(roofRow);

  body.appendChild(el('div', 'group-label', 'Transformations'));
  const ladder = ladderStatus(GAME);
  if (!ladder.length) body.appendChild(el('p', 'row-note', 'Your species does not transform.'));
  for (const form of ladder) {
    const row = el('div', 'row' + (form.owned ? ' owned' : form.missing.length ? ' locked' : ''));
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', form.name));
    const mastery = getMastery(GAME, form.id);
    main.appendChild(el('div', 'row-note', form.owned
      ? `${mastery}% worn in (${masteryLabel(mastery)}) - ${form.desc}`
      : form.missing.length ? 'Needs ' + form.missing.slice(0, 3).join(', ') : 'Ready to attempt'));
    row.appendChild(main);
    row.appendChild(el('div', 'row-value', 'x' + numberish(form.mult)));
    body.appendChild(row);
  }

  if (c.customForms && c.customForms.length) {
    body.appendChild(el('div', 'group-label', 'Forms nobody else has'));
    for (const form of c.customForms) {
      const row = el('div', 'row owned');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', form.name));
      main.appendChild(el('div', 'row-note', `Built from ${getTransformation(form.baseId) ? getTransformation(form.baseId).name : 'something'} in Age ${form.year}.`));
      row.appendChild(main);
      row.appendChild(el('div', 'row-value', 'x' + numberish(form.mult)));
      body.appendChild(row);
    }
  }

  body.appendChild(el('div', 'group-label', 'Techniques'));
  if (!c.techniques.length) body.appendChild(el('p', 'row-note', 'You know nothing worth naming yet.'));
  const byBranch = {};
  for (const id of c.techniques) {
    const tech = TECH_BY_ID[id];
    if (!tech) continue;
    (byBranch[tech.branch] = byBranch[tech.branch] || []).push(tech);
  }
  for (const [branch, list] of Object.entries(byBranch)) {
    const row = el('div', 'row');
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', BRANCHES[branch].name));
    main.appendChild(el('div', 'row-note', list.map((t) => t.name).join(', ')));
    row.appendChild(main);
    row.appendChild(el('div', 'row-value', String(list.length)));
    body.appendChild(row);
  }
  if (c.signature) {
    body.appendChild(el('div', 'group-label', 'Signature technique'));
    const row = el('div', 'row owned');
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', c.signature.name));
    main.appendChild(el('div', 'row-note', `Invented at age ${c.signature.year - c.birthYear >= 0 ? c.signature.year - c.birthYear : c.age}. Nobody else has this.`));
    row.appendChild(main);
    body.appendChild(row);
  }

  const near = nearbyForms(GAME, 3);
  if (near.length) {
    body.appendChild(el('div', 'group-label', 'Next'));
    for (const item of near) {
      const row = el('div', 'row locked');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', item.form.name));
      main.appendChild(el('div', 'row-note', item.form.hint));
      row.appendChild(main);
      body.appendChild(row);
    }
  }
  openSheet('panel');
}

function panelAppearance() {
  const c = GAME.character;
  const a = c.appearance;
  const { body } = sheetShell('Appearance', `${a.heightCm}cm - ${a.weightKg}kg - ${a.buildShape}`);
  const redraw = () => { renderHud(); autosave(); panelAppearance(); };

  const shot = el('div', 'portrait');
  shot.style.margin = '0 auto 12px';
  shot.style.maxWidth = '160px';
  shot.innerHTML = portraitSvg(c, { form: bestOwnedForm(c) });
  body.appendChild(shot);

  body.appendChild(el('p', 'row-note',
    'Height, build and face are what you were born with. Training and years change them on their own.'));

  const hasHair = !['namekian', 'frostdemon', 'majin', 'bioandroid'].includes(c.raceId);
  if (hasHair) {
    body.appendChild(el('div', 'group-label', 'Hair'));
    const styles = el('div', 'opts');
    for (const st of HAIR_STYLES) {
      const b = el('button', 'opt' + (a.hairStyle === st.id ? ' on' : ''), st.name);
      b.type = 'button';
      b.addEventListener('click', () => { a.hairStyle = st.id; redraw(); });
      styles.appendChild(b);
    }
    body.appendChild(styles);
    const sw = el('div', 'swatches');
    for (const col of HAIR_COLOURS) {
      const b = el('button', 'swatch' + (a.hairColour === col.id ? ' on' : ''));
      b.type = 'button';
      b.style.background = col.hex;
      b.title = col.name;
      b.setAttribute('aria-label', col.name);
      b.addEventListener('click', () => { a.hairColour = col.id; redraw(); });
      sw.appendChild(b);
    }
    body.appendChild(sw);
  }

  body.appendChild(el('div', 'group-label', 'What you wear'));
  const fits = el('div', 'opts');
  for (const o of OUTFITS) {
    const b = el('button', 'opt' + (a.outfit === o.id ? ' on' : ''), o.name);
    b.type = 'button';
    b.addEventListener('click', () => { a.outfit = o.id; redraw(); });
    fits.appendChild(b);
  }
  body.appendChild(fits);

  // Only accessories you own or were born wearing.
  const ownable = ACCESSORY_PRESETS.filter((x) => x.starter);
  body.appendChild(el('div', 'group-label', 'Worn'));
  a.accessories = a.accessories || [];
  const accs = el('div', 'opts');
  for (const acc of ownable) {
    const owned = !acc.item || c.items.includes(acc.item);
    const b = el('button', 'opt' + (a.accessories.includes(acc.id) ? ' on' : ''), acc.name);
    b.type = 'button';
    b.disabled = !owned;
    b.addEventListener('click', () => {
      const i = a.accessories.indexOf(acc.id);
      if (i > -1) a.accessories.splice(i, 1); else a.accessories.push(acc.id);
      redraw();
    });
    accs.appendChild(b);
  }
  body.appendChild(accs);
  const automatic = wornAccessories(c).filter((id) => !a.accessories.includes(id));
  if (automatic.length) {
    body.appendChild(el('p', 'row-note', `Also on you, whether you like it or not: ${automatic
      .map((id) => (ACCESSORY_PRESETS.find((x) => x.id === id) || { name: id }).name).join(', ').toLowerCase()}.`));
  }

  body.appendChild(el('div', 'group-label', 'How you stand'));
  const stances = el('div', 'opts');
  for (const st of STANCE_LIST) {
    const b = el('button', 'opt' + (a.stance === st.id ? ' on' : ''), st.name);
    b.type = 'button';
    b.addEventListener('click', () => { a.stance = st.id; redraw(); });
    stances.appendChild(b);
  }
  body.appendChild(stances);
  if (a.stance === 'custom') {
    const input = el('input', 'text-input');
    input.placeholder = 'Name your style';
    input.maxLength = 32;
    input.value = a.stanceName || '';
    input.addEventListener('input', () => { a.stanceName = input.value; });
    body.appendChild(input);
  }

  const back = el('button', 'ghost-btn', 'Back');
  back.type = 'button';
  back.addEventListener('click', panelRecords);
  body.appendChild(back);
  openSheet('panel');
}

function panelGive(npcId) {
  const npc = GAME.npcs[npcId];
  if (!npc) return;
  const { body } = sheetShell(`Give ${npc.name} something`, 'They will remember it.');
  for (const row of inventoryOf(GAME.character).filter((r) => !r.worn)) {
    const b = el('button', 'row');
    b.type = 'button';
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', row.name));
    main.appendChild(el('div', 'row-note', row.desc));
    b.appendChild(main);
    b.addEventListener('click', () => {
      const res = giveItem(GAME, npc, row.id);
      flash(res.text);
      logLine({ kind: 'event', title: `You gave ${npc.name} ${row.name}`, text: res.text });
      renderHud();
      renderFeed();
      autosave();
      panelPerson(npcId);
    });
    body.appendChild(b);
  }
  const back = el('button', 'ghost-btn', 'Back');
  back.type = 'button';
  back.addEventListener('click', () => panelPerson(npcId));
  body.appendChild(back);
  openSheet('panel');
}

function panelInventory() {
  const c = GAME.character;
  ensureBag(c);
  const planet = getPlace(c.placeId).planet;
  const cur = currencyFor(planet);
  const { body } = sheetShell('What you carry', `${formatMoney(balance(c, cur.id), cur.id)}`);

  // Every purse with something in it, because money does not travel.
  const purses = Object.values(CURRENCIES)
    .filter((x) => balance(c, x.id) > 0 || x.id === cur.id);
  const money = el('div', 'purse');
  for (const p of purses) {
    const row = el('div', 'purse-row' + (p.id === cur.id ? ' here' : ''));
    row.appendChild(el('span', 'purse-name', p.name));
    row.appendChild(el('span', 'purse-val', formatMoney(balance(c, p.id), p.id)));
    money.appendChild(row);
  }
  body.appendChild(money);
  body.appendChild(el('p', 'row-note', `${cur.where} ${cur.desc}`));

  if (purses.length > 1) {
    const swap = el('button', 'ghost-btn', 'Change money');
    swap.type = 'button';
    swap.addEventListener('click', () => panelExchange());
    body.appendChild(swap);
  }

  const rows = inventoryOf(c);
  if (!rows.length) {
    body.appendChild(el('p', 'row-note', 'You are carrying nothing at all.'));
  }
  const groups = [['Worn', (r) => r.worn], ['Carried', (r) => !r.worn]];
  for (const [label, filter] of groups) {
    const set = rows.filter(filter);
    if (!set.length) continue;
    body.appendChild(el('div', 'group-label', label));
    for (const row of set) {
      const b = el('div', 'row');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', row.name + (row.qty > 1 ? ` ×${row.qty}` : '')));
      const bits = [row.desc];
      if (row.from) bits.push(`From ${row.from}.`);
      main.appendChild(el('div', 'row-note', bits.join(' ')));
      if (row.condition < 100) {
        const wear = el('div', 'cond');
        const fill = el('div', 'cond-fill');
        fill.style.width = row.condition + '%';
        if (row.condition < 30) fill.classList.add('bad');
        wear.appendChild(fill);
        main.appendChild(wear);
        main.appendChild(el('div', 'row-note', row.condition < 30
          ? 'Barely holding together.' : `${row.condition}% of what it was.`));
      }
      b.appendChild(main);

      const acts = el('div', 'item-acts');
      if (row.slot !== 'none') {
        const w = el('button', 'mini', row.worn ? 'Stow' : 'Wear');
        w.type = 'button';
        w.addEventListener('click', () => { flash(toggleWorn(c, row.id).text); redrawLook(); panelInventory(); });
        acts.appendChild(w);
      }
      if (row.condition < 100) {
        const r = el('button', 'mini', 'Repair');
        r.type = 'button';
        r.addEventListener('click', () => { flash(repairItem(GAME, row.id).text); panelInventory(); });
        acts.appendChild(r);
      }
      const sellPrice = valueHere(GAME, row.id, { sell: true });
      const sl = el('button', 'mini', `Sell ${formatMoney(sellPrice.amount, sellPrice.currency)}`);
      sl.type = 'button';
      sl.addEventListener('click', () => {
        const rng = getRng(GAME);
        const res = sellItem(GAME, rng, row.id);
        saveRng(GAME, rng);
        flash(res.text);
        renderHud();
        panelInventory();
      });
      acts.appendChild(sl);
      b.appendChild(acts);
      body.appendChild(b);
    }
  }

  const back = el('button', 'ghost-btn', 'Back');
  back.type = 'button';
  back.addEventListener('click', panelRecords);
  body.appendChild(back);
  openSheet('panel');
}

function redrawLook() {
  renderHud();
  autosave();
}

function panelExchange() {
  const c = GAME.character;
  const here = currencyFor(getPlace(c.placeId).planet);
  const { body } = sheetShell('Change money', `They take a cut. They always take a cut.`);
  const from = Object.values(CURRENCIES).filter((x) => balance(c, x.id) > 0 && x.id !== here.id && x.rate);
  if (!from.length) {
    body.appendChild(el('p', 'row-note', `You have nothing but ${here.name} to change.`));
  }
  for (const f of from) {
    const b = el('button', 'row');
    b.type = 'button';
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', `All your ${f.name}`));
    main.appendChild(el('div', 'row-note', `${formatMoney(balance(c, f.id), f.id)} into ${here.name}, minus 18%.`));
    b.appendChild(main);
    b.addEventListener('click', () => {
      const res = exchange(c, f.id, here.id, balance(c, f.id));
      flash(res.ok ? res.text : res.reason);
      renderHud();
      panelExchange();
    });
    body.appendChild(b);
  }
  const back = el('button', 'ghost-btn', 'Back');
  back.type = 'button';
  back.addEventListener('click', panelInventory);
  body.appendChild(back);
  openSheet('panel');
}

function panelTraits() {
  const c = GAME.character;
  const { body } = sheetShell('What you are', `${(c.traits2 || []).length} traits`);
  const mine = (c.traits2 || []).map(getTrait).filter(Boolean);
  for (const [kind, label] of Object.entries(TRAIT_KINDS)) {
    const set = mine.filter((t) => t.kind === kind);
    if (!set.length) continue;
    body.appendChild(el('div', 'group-label', label));
    for (const t of set) {
      const row = el('div', 'row' + (t.bad ? ' danger' : ''));
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', t.name));
      main.appendChild(el('div', 'row-note', t.desc));
      row.appendChild(main);
      body.appendChild(row);
    }
  }
  if (!mine.length) body.appendChild(el('p', 'row-note', 'Nothing has marked you out yet.'));

  body.appendChild(el('div', 'group-label', 'What you were born with'));
  const grid = el('div', 'stat-grid');
  for (const [label, value] of [['Potential', c.potential], ['Battle instinct', c.battleInstinct],
    ['Intellect', c.iq], ['Luck', c.luck]]) {
    const box = el('div', 'stat');
    box.appendChild(el('div', 'stat-name', label));
    box.appendChild(el('div', 'stat-val', String(value ?? '—')));
    grid.appendChild(box);
  }
  body.appendChild(grid);

  const back = el('button', 'ghost-btn', 'Back');
  back.type = 'button';
  back.addEventListener('click', panelRecords);
  body.appendChild(back);
  openSheet('panel');
}

/**
 * The map: where you are, what each world thinks of you, and which standing
 * forces operate there. The systems existed; there was nowhere to look at them.
 */
function panelWorlds() {
  const c = GAME.character;
  const here = getPlace(c.placeId);
  const year = currentYear(GAME);
  const { body } = sheetShell('The worlds', getPlanet(here.planet).name);

  body.appendChild(el('div', 'group-label', 'Where you are'));
  const nowRow = el('div', 'row owned');
  const nowMain = el('div', 'row-main');
  nowMain.appendChild(el('div', 'row-title', `${here.name}, ${getPlanet(here.planet).name}`));
  nowMain.appendChild(el('div', 'row-note', here.desc));
  nowRow.appendChild(nowMain);
  body.appendChild(nowRow);

  const forces = factionsPresent(year, here.planet);
  if (forces.length) {
    body.appendChild(el('div', 'group-label', 'Who operates here'));
    for (const f of forces) {
      const row = el('div', 'row' + (c.faction === f.id ? ' owned' : ''));
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', f.name + (c.faction === f.id ? ' - yours' : '')));
      main.appendChild(el('div', 'row-note', `${f.emblem} ${f.goal}`));
      row.appendChild(main);
      const swatch = el('span', 'emblem');
      swatch.style.background = `linear-gradient(135deg, ${f.colours[0]} 50%, ${f.colours[1]} 50%)`;
      row.appendChild(swatch);
      body.appendChild(row);
    }
  }

  body.appendChild(el('div', 'group-label', 'Standing'));
  for (const w of worldManifest(GAME)) {
    if (!w.visits && !w.here && w.standing === 'Does not know you') continue;
    const row = el('div', 'row' + (w.here ? ' owned' : ''));
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', w.name + (w.here ? ' - here' : '')));
    main.appendChild(el('div', 'row-note',
      `${w.standing}. ${w.inhabitants}. `
      + `${w.visits ? `Visited ${w.visits} time${w.visits === 1 ? '' : 's'}.` : 'Never been.'}`
      + `${w.gone ? ' It is not there any more.' : ''}`));
    row.appendChild(main);
    row.appendChild(el('div', 'row-value', w.influence ? w.influence + '%' : '-'));
    body.appendChild(row);
  }

  body.appendChild(el('div', 'group-label', 'Everywhere else'));
  for (const w of worldManifest(GAME)) {
    if (w.visits || w.here || w.standing !== 'Does not know you') continue;
    const memo = el('div', 'memo');
    memo.innerHTML = `<b>${w.name.replace(/[<>]/g, '')}</b> ${String(w.inhabitants).replace(/[<>]/g, '')}. ${String(w.law).replace(/[<>]/g, '')}`;
    body.appendChild(memo);
  }
  openSheet('panel');
}

function panelRecords() {
  const { body } = sheetShell('Life', `Age ${GAME.character.age}`);
  const c = GAME.character;

  body.appendChild(el('div', 'group-label', 'What is remembered'));
  const facts = GAME.memory.facts.slice().sort((a, b) => b.weight - a.weight || b.year - a.year).slice(0, 18);
  if (!facts.length) body.appendChild(el('p', 'row-note', 'Nothing yet.'));
  for (const f of facts) {
    const memo = el('div', 'memo');
    memo.innerHTML = `<b>AGE ${f.year}</b> ${f.text.replace(/[<>]/g, '')}`;
    body.appendChild(memo);
  }

  const threads = GAME.memory.threads.filter((t) => !t.closed);
  if (threads.length) {
    body.appendChild(el('div', 'group-label', 'Running storylines'));
    for (const t of threads) {
      const row = el('div', 'row');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', t.title));
      main.appendChild(el('div', 'row-note', `Open since age ${t.openedYear} - stage ${t.stage + 1} of ${t.maxStage}`));
      row.appendChild(main);
      body.appendChild(row);
    }
  }

  if (GAME.world.divergences.length) {
    body.appendChild(el('div', 'group-label', 'History you changed'));
    for (const d of GAME.world.divergences) {
      body.appendChild(el('div', 'memo', `Age ${d.year}: ${d.event.replace(/_/g, ' ')} - ${d.how}`));
    }
  }

  body.appendChild(el('div', 'group-label', 'You'));
  const here = getPlace(c.placeId);
  for (const [title, note, fn] of [
    ['What you carry', `${(c.bag || c.items || []).length} things, and the money for where you are`, panelInventory],
    ['What you are', `${(c.traits2 || []).length} traits, and what you were born with`, panelTraits],
    ['The worlds', `${getPlanet(here.planet).name} and everywhere you have been`, panelWorlds],
  ]) {
    const r = el('button', 'row');
    r.type = 'button';
    const m = el('div', 'row-main');
    m.appendChild(el('div', 'row-title', title));
    m.appendChild(el('div', 'row-note', note));
    r.appendChild(m);
    r.addEventListener('click', fn);
    body.appendChild(r);
  }

  body.appendChild(el('div', 'group-label', 'Appearance'));
  const lookRow = el('button', 'row');
  lookRow.type = 'button';
  const lookMain = el('div', 'row-main');
  lookMain.appendChild(el('div', 'row-title', 'How you look'));
  lookMain.appendChild(el('div', 'row-note',
    `${c.sex === 'female' ? 'Female' : 'Male'}, ${c.appearance.heightCm}cm, ${c.appearance.weightKg}kg, `
    + `${c.appearance.buildShape}. Change your hair, clothes and stance.`));
  lookRow.appendChild(lookMain);
  lookRow.addEventListener('click', panelAppearance);
  body.appendChild(lookRow);

  // What is actually missing, separately from what is merely marked.
  const gone = injuryList(c);
  if (gone.length) {
    body.appendChild(el('div', 'group-label', 'What is not there'));
    for (const inj of gone) {
      const row = el('div', 'row' + (inj.prosthetic ? '' : ' locked'));
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title',
        `${inj.side ? inj.side.charAt(0).toUpperCase() + inj.side.slice(1) + ': ' : ''}${inj.name}`));
      main.appendChild(el('div', 'row-note', inj.prosthetic
        ? `Replaced with ${inj.prosthetic}. ${inj.desc}`
        : `${inj.desc} Taken by ${inj.from}, Age ${inj.year}.`));
      row.appendChild(main);
      row.appendChild(el('div', 'row-value', inj.prosthetic ? 'fitted' : inj.fixable ? 'fixable' : '-'));
      body.appendChild(row);
    }
  }

  const marks = allMarks(c);
  const worn = wornAccessories(c);
  if (marks.length || worn.length) {
    body.appendChild(el('div', 'group-label', 'The body'));
    for (const sc of c.scars || []) {
      const memo = el('div', 'memo');
      memo.innerHTML = `<b>AGE ${sc.year - c.birthYear}</b> ${String(sc.text || '').replace(/[<>]/g, '')}`;
      body.appendChild(memo);
    }
    const chosen = (c.appearance.marks || []).map((id) => {
      const m = MARK_PRESETS.find((x) => x.id === id);
      return id === 'custom' && c.appearance.customMark ? c.appearance.customMark : (m ? m.name : id);
    });
    if (chosen.length) body.appendChild(el('div', 'memo', `Marked from the start: ${chosen.join(', ').toLowerCase()}.`));
    const wornNames = worn.map((id) => {
      const a2 = ACCESSORY_PRESETS.find((x) => x.id === id);
      return id === 'custom' && c.appearance.customAccessory ? c.appearance.customAccessory : (a2 ? a2.name : id);
    });
    if (wornNames.length) body.appendChild(el('div', 'memo', `Wearing: ${wornNames.join(', ').toLowerCase()}.`));
  }

  body.appendChild(el('div', 'group-label', 'Record'));
  const stats = [
    ['Fights', GAME.stats.fights], ['Won', GAME.stats.wins], ['Lost', GAME.stats.losses],
    ['Killed', GAME.stats.kills], ['Techniques', c.techniques.length],
    ['Forms', c.transformations.length], ['Tournaments won', GAME.world.tournamentWins],
    ['Zenkai boosts', c.zenkaiCount || 0], ['AI events', GAME.aiCalls || 0],
  ];
  const grid = el('div', 'stat-grid');
  for (const [label, value] of stats) {
    const box = el('div', 'stat');
    box.appendChild(el('div', 'stat-name', label));
    box.appendChild(el('div', 'stat-val', String(value)));
    grid.appendChild(box);
  }
  body.appendChild(grid);

  body.appendChild(el('div', 'group-label', 'Storytelling'));
  const aiRow = el('div', 'row');
  const aiMain = el('div', 'row-main');
  aiMain.appendChild(el('div', 'row-title', 'AI events'));
  aiMain.appendChild(el('div', 'row-note',
    backendName() === 'sample' ? 'Claude is available here and writes events during your life.'
      : backendName() === 'api' ? 'Using your own Anthropic API key.'
        : backendName() === 'custom' ? `Writing through ${backendLabel()}.`
          : 'Not connected. The game generates its own events, which is the default way to play.'));
  aiRow.appendChild(aiMain);
  body.appendChild(aiRow);

  const modes = [['off', 'Off'], ['mixed', 'Mixed'], ['always', 'Every year']];
  const modeRow = el('div', 'opts');
  for (const [id, label] of modes) {
    const b = el('button', 'opt' + (AI_MODE === id ? ' on' : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => { AI_MODE = id; panelRecords(); });
    modeRow.appendChild(b);
  }
  body.appendChild(modeRow);

  const cfg = getAiConfig();
  body.appendChild(el('p', 'row-note', `Currently: ${backendLabel()}.`));

  const providers = [['auto', 'Automatic'], ['anthropic', 'Anthropic key'], ['custom', 'Custom endpoint'], ['off', 'Off']];
  const provRow = el('div', 'opts');
  for (const [id, label] of providers) {
    const b = el('button', 'opt' + (cfg.provider === id ? ' on' : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => { setAiConfig({ provider: id }); panelRecords(); });
    provRow.appendChild(b);
  }
  body.appendChild(provRow);

  if (cfg.provider === 'anthropic' || (cfg.provider === 'auto' && backendName() !== 'sample')) {
    const keyInput = el('input', 'text-input');
    keyInput.type = 'password';
    keyInput.placeholder = 'Anthropic API key';
    keyInput.value = getApiKey();
    keyInput.style.marginTop = '8px';
    keyInput.addEventListener('change', () => {
      setApiKey(keyInput.value.trim());
      flash(keyInput.value.trim() ? 'Key saved in this browser only.' : 'Key removed.');
      panelRecords();
    });
    body.appendChild(keyInput);
  }

  if (cfg.provider === 'custom') {
    // One-click setups for the local servers people actually run, so nobody
    // has to remember KoboldCpp's port.
    body.appendChild(el('span', 'field-label', 'Preset'));
    const presets = el('div', 'opts');
    for (const [id, preset] of Object.entries(PRESETS)) {
      const active = cfg.baseUrl === preset.baseUrl && cfg.format === preset.format && !!preset.baseUrl;
      const b = el('button', 'opt' + (active ? ' on' : ''), preset.label);
      b.type = 'button';
      b.addEventListener('click', () => {
        setAiConfig({
          baseUrl: preset.baseUrl, model: preset.model, key: preset.key, format: preset.format,
        });
        flash(preset.hint, 6000);
        panelRecords();
      });
      presets.appendChild(b);
    }
    body.appendChild(presets);

    const fields = [
      ['baseUrl', 'Endpoint URL', 'http://localhost:5001/api/v1/generate', 'text'],
      ['model', cfg.format === 'kobold' ? 'Model name (Kobold ignores this)' : 'Model name', 'the model id your endpoint expects', 'text'],
      ['key', 'API key (optional)', 'sent in the auth header', 'password'],
    ];
    for (const [key, label, placeholder, type] of fields) {
      body.appendChild(el('span', 'field-label', label));
      const input = el('input', 'text-input');
      input.type = type;
      input.placeholder = placeholder;
      input.value = cfg[key] || '';
      input.addEventListener('change', () => setAiConfig({ [key]: input.value.trim() }));
      body.appendChild(input);
    }
    body.appendChild(el('span', 'field-label', 'Request shape'));
    const shapes = el('div', 'opts');
    for (const [id, label] of [['kobold', 'KoboldAI native'], ['openai', 'OpenAI-compatible'], ['anthropic', 'Anthropic Messages']]) {
      const b = el('button', 'opt' + (cfg.format === id ? ' on' : ''), label);
      b.type = 'button';
      b.addEventListener('click', () => { setAiConfig({ format: id }); panelRecords(); });
      shapes.appendChild(b);
    }
    body.appendChild(shapes);

    // A local model needs its samplers where you can reach them.
    body.appendChild(el('span', 'field-label', 'Sampling'));
    const samplers = [
      ['temperature', 'Temperature', 0, 2, 0.05],
      ['topP', 'Top-p', 0.05, 1, 0.01],
      ['maxTokens', 'Reply length', 200, 2000, 50],
    ];
    for (const [key, label, min, max, step] of samplers) {
      const row = el('div', 'slider-row');
      const input = el('input');
      input.type = 'range';
      input.min = String(min); input.max = String(max); input.step = String(step);
      input.value = String(cfg[key]);
      const val = el('div', 'slider-val', `${label} ${cfg[key]}`);
      input.addEventListener('input', () => {
        val.textContent = `${label} ${input.value}`;
        setAiConfig({ [key]: Number(input.value) });
      });
      row.appendChild(input);
      row.appendChild(val);
      body.appendChild(row);
    }

    const test = el('button', 'ghost-btn', 'Test the connection');
    test.type = 'button';
    test.addEventListener('click', async () => {
      test.disabled = true;
      test.textContent = 'Testing...';
      const res = await testAiEndpoint();
      test.disabled = false;
      test.textContent = 'Test the connection';
      flash(res.ok ? `Answered: ${res.text || '(empty)'}` : `Failed: ${res.message}`, 5000);
    });
    body.appendChild(test);
    body.appendChild(el('p', 'hint-text',
      cfg.format === 'kobold'
        ? 'KoboldAI and KoboldCpp both answer on the native route. The page is served from a file or from claude.ai, '
          + 'so start Kobold with --host so it accepts the request, or run it behind a reverse proxy that sets CORS headers. '
          + 'Settings stay in this browser and are sent only to the address you give.'
        : 'Anything that answers on either shape works. Settings stay in this browser and are sent only to the endpoint you name.'));
  }

  body.appendChild(el('div', 'group-label', 'Save'));
  const saveBtn = el('button', 'ghost-btn', 'Save to this browser');
  saveBtn.type = 'button';
  saveBtn.addEventListener('click', () => {
    const res = save(GAME, 'auto');
    flash(res.ok ? 'Saved.' : 'Could not save in this browser.');
  });
  body.appendChild(saveBtn);

  const copyBtn = el('button', 'ghost-btn', 'Copy save code');
  copyBtn.type = 'button';
  copyBtn.addEventListener('click', async () => {
    const code = exportString(GAME);
    try {
      await navigator.clipboard.writeText(code);
      flash('Save code copied to the clipboard.');
    } catch (e) {
      flash('Could not reach the clipboard.');
    }
  });
  body.appendChild(copyBtn);

  const loadBtn = el('button', 'ghost-btn', 'Paste a save code');
  loadBtn.type = 'button';
  loadBtn.addEventListener('click', () => {
    const code = prompt('Paste a save code');
    if (!code) return;
    const loaded = importString(code);
    if (!loaded) { flash('That save code did not parse.'); return; }
    GAME = loaded;
    closeSheet();
    showPlay();
    flash('Life restored.');
  });
  body.appendChild(loadBtn);

  const quitBtn = el('button', 'ghost-btn danger', 'Abandon this life');
  quitBtn.type = 'button';
  quitBtn.addEventListener('click', () => {
    if (!confirm('Abandon this life and start a new one?')) return;
    clearSlot('auto');
    GAME = null;
    closeSheet();
    DRAFT = newDraft();
    renderCreation();
    showScreen('create');
  });
  body.appendChild(quitBtn);

  openSheet('panel');
}

// ------------------------------------------------------------------ trial

let TRIAL = null;

function openTrial(trial) {
  TRIAL = trial;
  showScreen('trial');
  playTrial(trial, (score) => {
    const rng = getRng(GAME);
    const result = resolveTrial(GAME, rng, TRIAL, score);
    saveRng(GAME, rng);
    logLine({ kind: 'event', title: TRIAL.label, text: result.text });
    TRIAL = null;
    renderHud();
    renderFeed();
    autosave();
    if (!GAME.character.alive) { showDeath(); return; }
    showPlay();
    flash(result.text.slice(0, 140));
  });
}

// ------------------------------------------------------------- tournament

function openTournament(t) {
  TOURNEY = t;
  GAME.tournament = t;
  const format = FORMATS[t.formatId] || FORMATS.wmat;
  $('tourney-kicker').textContent = t.finished ? 'Result' : roundName(t);
  $('tourney-title').textContent = t.name;
  $('tourney-sub').textContent = format.flavour;
  $('tourney-rules').textContent = [
    t.rules.note,
    t.purse ? `Purse ${zeni(t.purse)}.` : '',
  ].filter(Boolean).join(' ');
  renderTournament();
  showScreen('tourney');
}

function renderTournament() {
  const t = TOURNEY;
  if (!t) return;
  const body = $('tourney-body');
  const foot = $('tourney-foot');
  body.innerHTML = '';
  foot.innerHTML = '';

  $('tourney-kicker').textContent = t.finished ? 'Result' : roundName(t);

  if (t.finished) {
    body.appendChild(el('div', 'tourney-result', placementLine(t)));
    const champ = t.champion ? t.champion.name : (t.placement === 1 ? GAME.character.name : null);
    if (champ) body.appendChild(el('div', 'tourney-verdict', `${champ} takes the tournament.`));
  } else {
    const field = describeField(GAME, t);
    body.appendChild(el('div', 'tourney-verdict', field.line));

    const foe = playerOpponent(t);
    if (foe) {
      const card = el('div', 'draw-card');
      card.appendChild(el('div', 'draw-label', `${roundName(t)} - your draw`));
      card.appendChild(el('div', 'draw-name', foe.name));
      const read = readPower(GAME, foe.power, { peek: true });
      card.appendChild(el('div', 'draw-power', read.known
        ? `Power level ${numberish(foe.power)} - ${powerTier(foe.power)}`
        : `${powerTier(foe.power)} - ${read.text}`));
      if (foe.flavour) card.appendChild(el('div', 'draw-flavour', foe.universe ? `Universe ${foe.universe}. ${foe.flavour}` : `They ${foe.flavour}.`));
      body.appendChild(card);
    } else {
      body.appendChild(el('div', 'draw-card', 'You have a bye this round.'));
    }
  }

  // Everything that has happened so far, round by round.
  for (const round of bracketSummary(t)) {
    const block = el('div', 'round-block' + (!t.finished && round.title === roundName(t) ? ' now' : ''));
    block.appendChild(el('div', 'round-name', round.title));
    for (const line of round.lines) {
      const isMine = /^You /.test(line) || line.includes(GAME.character.name);
      block.appendChild(el('div', 'round-line' + (isMine ? ' mine' : ''), line));
    }
    body.appendChild(block);
  }

  if (!t.finished) {
    const live = standings(t).map((e) => e.id);
    const block = el('div', 'round-block');
    block.appendChild(el('div', 'round-name', `Still in - ${live.length}`));
    for (const e of t.entrants) {
      const row = el('div', 'field-row'
        + (live.includes(e.id) ? '' : ' out')
        + (e.isPlayer ? ' you' : ''));
      row.appendChild(el('span', 'fname', e.name));
      if (e.universe) row.appendChild(el('span', 'ftag', `U${e.universe}`));
      else if (e.isCanon) row.appendChild(el('span', 'ftag', 'known'));
      row.appendChild(el('span', 'fpow', shortPower(GAME, e.power)));
      block.appendChild(row);
    }
    body.appendChild(block);
  }

  if (t.finished) {
    const done = el('button', 'primary-btn', 'Leave the arena');
    done.type = 'button';
    done.addEventListener('click', closeTournament);
    foot.appendChild(done);
    return;
  }

  const foe = playerOpponent(t);
  const go = el('button', 'primary-btn', foe ? `Fight ${foe.name}` : 'Take the bye');
  go.type = 'button';
  go.addEventListener('click', fightTournamentMatch);
  foot.appendChild(go);

  const quit = el('button', 'ghost-btn danger', 'Withdraw');
  quit.type = 'button';
  quit.addEventListener('click', () => {
    const rng = getRng(GAME);
    recordPlayerResult(GAME, rng, t, false, { disqualified: true });
    saveRng(GAME, rng);
    t.finished = true;
    t.withdrew = true;
    renderTournament();
  });
  foot.appendChild(quit);
}

function fightTournamentMatch() {
  const t = TOURNEY;
  const rng = getRng(GAME);
  // Everyone else's round happens first, so by the time you walk out the
  // half of the draw you are not in has already thinned.
  resolveOtherMatches(GAME, rng, t);
  saveRng(GAME, rng);

  const spec = matchBattleSpec(GAME, t);
  if (!spec) {
    const r2 = getRng(GAME);
    recordPlayerResult(GAME, r2, t, true);
    saveRng(GAME, r2);
    renderTournament();
    return;
  }
  openBattle(spec, (battle, after) => finishTournamentMatch(battle, after));
}

function finishTournamentMatch(battle, after) {
  const t = TOURNEY;
  const rng = getRng(GAME);
  const won = battle.outcome === 'won';
  // Killing somebody under tournament rules ends your tournament, whatever
  // the scoreboard says.
  const dq = t.rules.noKilling && battle.killed;
  recordPlayerResult(GAME, rng, t, won, { disqualified: dq });
  saveRng(GAME, rng);

  if (dq) {
    GAME.character.karma = Math.max(-100, GAME.character.karma - 18);
    GAME.character.fame = Math.min(100, GAME.character.fame + 10);
    t.finished = true;
  }

  renderHud();
  if (!GAME.character.alive) { showDeath(); return; }
  openTournament(t);
}

function closeTournament() {
  const t = TOURNEY;
  const rng = getRng(GAME);
  const result = settle(GAME, t, rng);
  saveRng(GAME, rng);

  logLine({ kind: 'event', title: t.name, text: result.text });
  addTournamentFact(t, result);

  TOURNEY = null;
  GAME.tournament = null;
  renderHud();
  renderFeed();
  autosave();

  if (result.erased) {
    GAME.character.alive = false;
    GAME.character.death = { cause: 'Erased with Universe 7', year: currentYear(GAME), age: GAME.character.age };
    showDeath();
    return;
  }
  showPlay();
  const next = currentEvent(GAME);
  if (next) showEvent(next);
}

function addTournamentFact(t, result) {
  const year = currentYear(GAME);
  GAME.memory.facts.push({
    id: GAME.memory.nextFactId++,
    type: 'tournament',
    text: result.won
      ? `Won ${t.name}${result.beat.length ? ', through ' + result.beat.join(' and ') : ''}.`
      : `${placementLine(t)} at ${t.name}.`,
    year,
    subject: null,
    object: null,
    weight: result.won ? 8 : 3,
    tags: ['fame', result.won ? 'milestone' : 'tournament'],
  });
}

// ------------------------------------------------------------------- hunt

let HUNT = null;

// ------------------------------------------------- the Tournament of Power

let SURVIVAL = null;

function openSurvival(board) {
  SURVIVAL = board;
  $('surv-log').innerHTML = '';
  pushSurvivalLines([RULES[0], RULES[1], RULES[3]], 'big');
  pushSurvivalLines(board.log, 'big');
  renderSurvival();
  showScreen('survival');
}

function pushSurvivalLines(lines, cls) {
  const log = $('surv-log');
  for (const line of lines) {
    if (!line) continue;
    log.appendChild(el('div', 'line ' + (cls || 'new'), line));
  }
  log.scrollTop = log.scrollHeight;
}

function renderSurvival() {
  const st = survivalStatus(SURVIVAL);
  const mins = Math.max(0, st.left);
  $('surv-clock').textContent = `${String(mins).padStart(2, '0')}:00`;
  $('surv-sub').textContent = st.over
    ? {
      solo: 'You are the last one standing. Out of all of it. A wish is waiting.',
      won: 'Every other universe is gone. Yours is still here.',
      survived: 'The clock ran out and your universe is still here.',
      out: 'You are off the stage. Your universe is not, yet.',
      erased: 'There is no Universe 7 any more.',
    }[st.outcome] || 'Over.'
    : `${st.teams.reduce((n, t) => n + t.up, 0)} still standing - `
      + `${st.knockedOut} put out by you${st.saved ? `, ${st.saved} caught` : ''}`;
  $('surv-grip').style.width = st.me.grip + '%';
  $('surv-sta').style.width = st.me.stamina + '%';

  const teams = $('surv-teams');
  teams.innerHTML = '';
  for (const t of st.teams) {
    const box = el('div', 'uteam' + (t.mine ? ' mine' : '') + (t.erased ? ' gone' : ''));
    box.appendChild(el('span', 'uteam-n', 'U' + t.universe));
    box.appendChild(el('span', 'uteam-c', `${t.up}/${t.total}`));
    box.title = t.fighters.map((f) => (f.out ? '- ' : '') + f.name).join('\n');
    teams.appendChild(box);
  }

  const wrap = $('surv-actions');
  wrap.innerHTML = '';
  if (st.over) {
    const done = el('button', 'primary-btn', 'Leave the stage');
    done.type = 'button';
    done.addEventListener('click', () => {
      logLine({ kind: 'event', title: 'The Tournament of Power', text: SURVIVAL.log.slice(-3).join(' ') });
      if (SURVIVAL.outcome === 'erased') {
        GAME.character.alive = false;
        GAME.character.death = { cause: 'Erased with Universe 7', year: currentYear(GAME), age: GAME.character.age };
        SURVIVAL = null;
        showDeath();
        return;
      }
      SURVIVAL = null;
      renderHud();
      renderFeed();
      autosave();
      showPlay();
    });
    wrap.appendChild(done);
    return;
  }
  for (const action of survivalActions(SURVIVAL)) {
    const b = el('button', 'bact');
    b.type = 'button';
    b.appendChild(el('span', 'bact-label', action.label));
    if (action.hint) b.appendChild(el('span', 'bact-hint', action.hint));
    b.addEventListener('click', () => survivalStep(action.id));
    wrap.appendChild(b);
  }
}

function survivalStep(actionId) {
  const rng = getRng(GAME);
  const res = survivalTurn(GAME, SURVIVAL, rng, actionId);
  saveRng(GAME, rng);
  pushSurvivalLines([`Minute ${SURVIVAL.minute}`], 'turn');
  pushSurvivalLines(res.lines);
  renderSurvival();
}

function openHunt(hunt) {
  HUNT = hunt;
  $('hunt-title').textContent = hunt.ballName || 'Search';
  $('hunt-sub').textContent = hunt.message;
  $('hunt-readout').innerHTML = '';
  renderHunt();
  showScreen('hunt');
}

function renderHunt() {
  $('hunt-pings').textContent = HUNT.over
    ? 'Search over'
    : `${HUNT.pingsLeft} of ${HUNT.pings} sweeps left`;

  const grid = $('hunt-grid');
  grid.innerHTML = '';
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const seen = HUNT.revealed.find((r) => r.x === x && r.y === y);
      const cls = seen
        ? (seen.d === 0 ? 'cell d0' : seen.d === 1 ? 'cell d1' : seen.d === 2 ? 'cell d2'
          : seen.d === 3 ? 'cell d3' : 'cell far')
        : 'cell';
      const b = el('button', cls, seen ? (seen.d === 0 ? '*' : String(seen.d)) : '');
      b.type = 'button';
      b.disabled = !!seen || HUNT.over;
      b.setAttribute('aria-label', `Search square ${x + 1}, ${y + 1}`);
      b.addEventListener('click', () => huntPing(x, y));
      grid.appendChild(b);
    }
  }

  const foot = $('hunt-foot');
  foot.innerHTML = '';
  if (HUNT.over) {
    const done = el('button', 'primary-btn', HUNT.found ? 'Take it' : 'Give up the season');
    done.type = 'button';
    done.addEventListener('click', closeHunt);
    foot.appendChild(done);
  } else {
    const leave = el('button', 'ghost-btn', 'Abandon the search');
    leave.type = 'button';
    leave.addEventListener('click', closeHunt);
    foot.appendChild(leave);
  }
}

function huntPing(x, y) {
  const rng = getRng(GAME);
  const res = pingSquare(GAME, HUNT, rng, x, y);
  saveRng(GAME, rng);
  const line = el('div', res.found ? 'found' : '', res.message);
  $('hunt-readout').appendChild(line);
  $('hunt-readout').scrollTop = $('hunt-readout').scrollHeight;
  renderHunt();
}

function closeHunt() {
  const found = HUNT.found;
  const name = HUNT.ballName;
  HUNT = null;
  if (found) {
    logLine({ kind: 'event', title: 'Dragon Ball found', text: `${name}. ${ballsHeld(GAME)} of seven.` });
    flash(`${name} recovered. ${ballsHeld(GAME)} of seven.`);
  } else {
    logLine({ kind: 'event', title: null, text: 'A season of searching and nothing to show for it.' });
  }
  renderHud();
  renderFeed();
  autosave();
  showPlay();
}

// ----------------------------------------------------------------- battle

const BATTLE_TABS = [
  { id: 'strike', label: 'Strike', kinds: ['physical'] },
  { id: 'ki', label: 'Ki', kinds: ['ki'] },
  { id: 'form', label: 'Form', kinds: ['form'] },
  { id: 'stance', label: 'Stance', kinds: ['stance'] },
  { id: 'talk', label: 'Say', kinds: ['talk'] },
  { id: 'other', label: 'Other', kinds: ['defend', 'item', 'move'] },
];

function openBattle(spec, onDone) {
  const rng = getRng(GAME);
  BATTLE = createBattle(GAME, rng, spec);
  saveRng(GAME, rng);
  BATTLE_RETURN = onDone || null;
  BATTLE_TAB = 'strike';
  $('battle-log').innerHTML = '';
  pushBattleLines([
    spec.intro || BATTLE.intro || '',
    describeMatchup(BATTLE),
    BATTLE.civilians ? 'There are people below. Whatever you break here, somebody lived in it.' : '',
  ].filter(Boolean), 'big');
  renderBattle();
  showScreen('battle');
}

function pushBattleLines(lines, cls) {
  const log = $('battle-log');
  for (const line of lines) {
    if (!line) continue;
    log.appendChild(el('div', 'line ' + (cls || 'new'), line));
  }
  log.scrollTop = log.scrollHeight;
}

function renderBattle() {
  const st = battleStatus(BATTLE);
  const foeNpc = BATTLE.context && (GAME.npcs[BATTLE.context.npcId] || GAME.npcs['canon_' + BATTLE.context.canonId]);
  const foeFace = $('foe-face');
  if (foeFace) {
    foeFace.innerHTML = foeNpc
      ? npcPortrait(foeNpc, { maturityRate: getRace(foeNpc.raceId).maturityRate ?? 1 })
      : '';
    foeFace.hidden = !foeNpc;
  }
  $('foe-name').textContent = st.them.name;
  $('foe-sub').textContent = [st.them.tier, st.them.form, st.them.stance].filter(Boolean).join(' - ');
  // A number on the foe panel is a scouter reading, not a birthright.
  const foeRead = readPower(GAME, st.them.power, { peek: true });
  $('foe-power').textContent = foeRead.known ? numberish(st.them.power) : (foeRead.broke ? '—' : '?');
  const foePct = (st.them.hp / Math.max(1, st.them.hpMax)) * 100;
  $('foe-hp').style.width = Math.max(0, foePct) + '%';
  $('foe-state').textContent = [
    foePct > 60 ? 'Barely marked' : foePct > 30 ? 'Hurt' : foePct > 10 ? 'Badly hurt' : 'Barely standing',
    st.lockedOut === 'gone' ? 'you cannot touch them' : st.lockedOut === 'hard' ? 'far too fast for you' : null,
    st.lockingThem === 'gone' ? 'they cannot touch you' : null,
  ].filter(Boolean).join(' - ');

  // A crowd needs a roll call: who is left, who is down, who you are on.
  const strip = $('foe-squad');
  if (strip) {
    const many = st.squad.length > 1;
    strip.hidden = !many;
    strip.innerHTML = '';
    if (many) {
      for (const f of st.squad) {
        const chip = el('button', 'foechip'
          + (f.down ? ' down' : '') + (f.focus ? ' focus' : ''));
        chip.type = 'button';
        chip.appendChild(el('span', 'foechip-name', f.name));
        const bar = el('span', 'foechip-bar');
        const fill = el('span', 'foechip-fill');
        fill.style.width = Math.max(0, (f.hp / Math.max(1, f.hpMax)) * 100) + '%';
        bar.appendChild(fill);
        chip.appendChild(bar);
        chip.disabled = f.down || f.focus;
        chip.addEventListener('click', () => battleTurn('target:' + f.slot));
        strip.appendChild(chip);
      }
      for (const a of st.allies) {
        const chip = el('button', 'foechip ally' + (a.down ? ' down' : ''), a.name + (a.down ? ' (down)' : ''));
        chip.type = 'button';
        chip.disabled = true;
        strip.appendChild(chip);
      }
    }
  }
  $('battle-round').textContent = 'Round ' + st.round;

  const destruction = $('destruction');
  destruction.hidden = !BATTLE.civilians;
  $('destruction-fill').style.width = st.destruction + '%';

  $('my-hp').style.width = Math.max(0, (st.me.hp / Math.max(1, st.me.hpMax)) * 100) + '%';
  $('my-ki').style.width = Math.max(0, (st.me.ki / Math.max(1, st.me.kiMax)) * 100) + '%';
  $('my-sta').style.width = Math.max(0, (st.me.stamina / Math.max(1, st.me.staminaMax)) * 100) + '%';
  const held = BATTLE.restraint ?? 1;
  $('my-state').textContent = [
    st.me.form, st.me.stance,
    held < 1 ? `holding back (${Math.round(held * 100)}%)` : null,
  ].filter(Boolean).join(' - ');

  const tabs = $('battle-tabs');
  tabs.innerHTML = '';
  const actions = battleActions(GAME, BATTLE);
  for (const tab of BATTLE_TABS) {
    const count = actions.filter((a) => tab.kinds.includes(a.kind)).length;
    if (!count) continue;
    const b = el('button', 'btab' + (BATTLE_TAB === tab.id ? ' active' : ''), tab.label);
    b.type = 'button';
    b.addEventListener('click', () => { BATTLE_TAB = tab.id; renderBattle(); });
    tabs.appendChild(b);
  }

  const wrap = $('battle-actions');
  wrap.innerHTML = '';
  const tab = BATTLE_TABS.find((t) => t.id === BATTLE_TAB) || BATTLE_TABS[0];
  const shown = actions.filter((a) => tab.kinds.includes(a.kind));
  for (const action of shown) {
    const b = el('button', 'bact'
      + (action.kind === 'form' ? ' form-btn' : '')
      + (action.kind === 'move' ? ' escape wide' : ''));
    b.type = 'button';
    b.disabled = !!action.disabled;
    b.appendChild(el('span', 'bact-label', action.label));
    if (action.hint || action.reason) b.appendChild(el('span', 'bact-hint', action.reason || action.hint));
    b.addEventListener('click', () => battleTurn(action.id));
    wrap.appendChild(b);
  }
}

function battleTurn(actionId) {
  const rng = getRng(GAME);
  pushBattleLines(['Round ' + BATTLE.round], 'turn');
  const res = takeTurn(GAME, BATTLE, rng, actionId);
  saveRng(GAME, rng);
  pushBattleLines(res.lines);
  renderBattle();
  if (res.over) endBattle();
}

function endBattle() {
  const rng = getRng(GAME);
  const after = battleAftermath(GAME, rng, BATTLE, {});
  saveRng(GAME, rng);
  if (after.lines.length) pushBattleLines(after.lines, 'big');

  const wrap = $('battle-actions');
  wrap.innerHTML = '';
  $('battle-tabs').innerHTML = '';

  const outcomeLine = BATTLE.byRingOut
    ? (BATTLE.outcome === 'won' ? 'Ring-out. You win.' : 'Ring-out. You lose.')
    : {
    won: 'You win.', lost: 'You lose.', fled: 'You got out.',
    yielded: 'You yielded and they let it stand.', draw: 'Neither of you could finish it.',
  }[BATTLE.outcome] || 'It is over.';

  const done = el('button', 'bact wide');
  done.type = 'button';
  done.appendChild(el('span', 'bact-label', outcomeLine));
  done.appendChild(el('span', 'bact-hint', 'Back to your life'));
  done.addEventListener('click', () => closeBattle(after));
  wrap.appendChild(done);

  // Under tournament rules there is nothing to decide: an official is already
  // standing between you, and killing somebody ends your tournament.
  if (BATTLE.outcome === 'won' && BATTLE.noKilling) {
    pushBattleLines(['The officials are between you before you have finished the thought.'], 'big');
  }

  // Beating somebody is a decision point, not just a result.
  if (BATTLE.outcome === 'won' && BATTLE.stakes !== 'spar' && !BATTLE.noKilling) {
    const spare = el('button', 'bact');
    spare.type = 'button';
    spare.appendChild(el('span', 'bact-label', 'Let them live'));
    spare.addEventListener('click', () => {
      GAME.character.karma = Math.min(100, GAME.character.karma + 8);
      pushBattleLines(['You leave them breathing. They will remember that, one way or the other.'], 'big');
      spare.remove();
      const kill = document.querySelector('.bact.kill');
      if (kill) kill.remove();
    });
    wrap.appendChild(spare);

    const kill = el('button', 'bact kill danger');
    kill.type = 'button';
    kill.appendChild(el('span', 'bact-label', 'Finish them'));
    kill.addEventListener('click', () => {
      const ref = BATTLE.context || {};
      const npc = ref.npcId ? GAME.npcs[ref.npcId] : (ref.canonId ? GAME.npcs['canon_' + ref.canonId] : null);
      if (npc) { npc.alive = false; npc.causeOfDeath = 'You killed them'; }
      BATTLE.killed = true;
      GAME.character.karma = Math.max(-100, GAME.character.karma - 22);
      GAME.stats.kills += 1;
      pushBattleLines(['You finish it. Nobody argues with the result.'], 'big');
      kill.remove();
      const s2 = document.querySelector('.bact:not(.wide):not(.kill)');
      if (s2) s2.remove();
    });
    wrap.appendChild(kill);
  }
}

function closeBattle(after) {
  const summary = {
    won: `You beat ${BATTLE.them.name}.`,
    lost: `${BATTLE.them.name} beat you.`,
    fled: `You broke off from ${BATTLE.them.name}.`,
    yielded: `You yielded to ${BATTLE.them.name}.`,
    draw: `You and ${BATTLE.them.name} could not finish it.`,
  }[BATTLE.outcome] || '';

  logLine({ kind: 'event', title: `Fight: ${BATTLE.them.name}`, text: summary, outcome: after.text || '' });

  const death = after.death;
  const battle = BATTLE;
  const handOff = BATTLE_RETURN;
  BATTLE = null;
  BATTLE_RETURN = null;
  renderHud();
  renderFeed();
  autosave();

  if (death) {
    GAME.character.alive = false;
    GAME.character.death = { cause: death, year: currentYear(GAME), age: GAME.character.age };
    showDeath();
    return;
  }
  if (GAME.character.vitals.health <= 0 && GAME.character.alive) {
    // A fight can leave you at zero; the year change decides whether that kills you.
    flash('You are barely alive. Age up and find out if you make it.');
  }
  // A fight can belong to something larger - a tournament round, say - which
  // wants control back rather than dropping you into the year.
  if (handOff) { handOff(battle, after); return; }
  showPlay();
  const next = currentEvent(GAME);
  if (next) showEvent(next);
}

/** Append an entry to the current year in the feed. */
function logLine(entry) {
  if (!GAME.log.length || GAME.log[GAME.log.length - 1].age !== GAME.character.age) {
    GAME.log.push({ year: currentYear(GAME), age: GAME.character.age, entries: [] });
  }
  GAME.log[GAME.log.length - 1].entries.push(entry);
}

// ------------------------------------------------------------------ death

function showDeath() {
  const info = epitaph(GAME);
  const node = $('epitaph');
  node.innerHTML = '';

  node.appendChild(el('div', 'epitaph-kicker', GAME.character.inAfterlife ? 'Gone for good' : 'Died'));
  node.appendChild(el('h2', 'epitaph-name', info.name));
  node.appendChild(el('div', 'epitaph-dates',
    `${info.race} - age ${info.age} - Age ${info.year} - ${info.cause}`));
  node.appendChild(el('div', 'epitaph-title', info.title));
  node.appendChild(el('div', 'score', info.score.toLocaleString('en-US')));

  const grid = el('div', 'epitaph-grid');
  const cells = [
    ['Power', numberish(info.power)], ['Fame', info.fame], ['Karma', info.karma],
    ['Techniques', info.techniques], ['Forms', info.forms], ['Children', info.children],
  ];
  for (const [label, value] of cells) {
    const box = el('div', 'stat');
    box.appendChild(el('div', 'stat-name', label));
    box.appendChild(el('div', 'stat-val', String(value)));
    grid.appendChild(box);
  }
  node.appendChild(grid);

  node.appendChild(el('div', 'group-label', 'What they are remembered for'));
  for (const line of info.highlights) node.appendChild(el('div', 'memo', line));

  if (!GAME.character.inAfterlife) {
    const b = el('button', 'primary-btn', 'Go to the Other World');
    b.type = 'button';
    b.addEventListener('click', () => {
      enterAfterlife(GAME);
      autosave();
      showPlay();
      flash('Death is a place here. Keep training.');
    });
    node.appendChild(b);
    node.appendChild(el('p', 'hint-text',
      'Dying is not the end in this setting. You can train under King Kai, fight in the Other World tournament, and be wished back if anyone down there cares enough.'));
  }

  const kids = Object.values(GAME.npcs).filter((n) => n.relation === 'child' && n.alive);
  if (kids.length) {
    const b = el('button', 'ghost-btn', `Continue as ${kids[0].name}`);
    b.type = 'button';
    b.addEventListener('click', () => {
      beginLegacy(GAME);
      autosave();
      showPlay();
      flash('A new generation. The world remembers the last one.');
    });
    node.appendChild(b);
  }

  const again = el('button', 'ghost-btn', 'Start a new life');
  again.type = 'button';
  again.addEventListener('click', () => {
    clearSlot('auto');
    GAME = null;
    DRAFT = newDraft();
    renderCreation();
    showScreen('create');
  });
  node.appendChild(again);

  showScreen('death');
}

// ----------------------------------------------------------------- screens

function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $('screen-' + name).classList.add('active');
}

function showPlay() {
  renderHud();
  renderFeed();
  showScreen('play');
}

function autosave() {
  save(GAME, 'auto');
}

// -------------------------------------------------------------------- boot

function startGame() {
  readCreationInputs();
  const seed = (DRAFT.seed || '').trim();
  GAME = createGame({
    name: DRAFT.name,
    raceId: DRAFT.raceId,
    sex: DRAFT.sex,
    upbringingId: DRAFT.upbringingId,
    temperamentId: DRAFT.temperamentId,
    bodyId: DRAFT.bodyId,
    birthYear: DRAFT.birthYear,
    placeId: DRAFT.placeId,
    look: DRAFT.look,
  }, seed || undefined);
  autosave();
  showPlay();
  flash(`${GAME.character.name} is born on ${getPlace(GAME.character.placeId).name}.`);
}

function wire() {
  $('btn-begin').addEventListener('click', startGame);
  $('btn-reroll-name').addEventListener('click', () => {
    DRAFT.name = generateFullName(new Rng(Date.now() ^ Math.floor(Math.random() * 1e9)), DRAFT.raceId);
    DRAFT.nameTouched = false;
    $('in-name').value = DRAFT.name;
  });
  $('in-name').addEventListener('input', () => {
    DRAFT.nameTouched = true;
    DRAFT.name = $('in-name').value;
  });
  $('in-seed').addEventListener('input', () => { DRAFT.seed = $('in-seed').value; });

  $('btn-age').addEventListener('click', ageUp);
  $('scrim').addEventListener('click', () => { if (SHEET_MODE !== 'event') closeSheet(); });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!GAME) return;
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const panel = btn.dataset.panel;
      if (panel === 'activities') panelActivities();
      else if (panel === 'people') panelPeople();
      else if (panel === 'power') panelPower();
      else panelRecords();
    });
  });

  document.addEventListener('keydown', (e2) => {
    if (e2.key === 'Escape' && SHEET_MODE && SHEET_MODE !== 'event') closeSheet();
  });
}

async function boot() {
  DRAFT = newDraft();
  renderCreation();
  wire();

  const saved = load('auto');
  if (saved && saved.character) {
    const btn = $('btn-continue');
    btn.hidden = false;
    btn.textContent = `Continue: ${saved.character.name}, age ${saved.character.age}`;
    btn.addEventListener('click', () => {
      GAME = saved;
      showPlay();
    });
  }

  await initSampling();
  const note = $('create-ai-note');
  note.textContent = backendName() === 'sample'
    ? 'Claude is connected here. Events written live by the model appear alongside the generated ones.'
    : 'Runs entirely on its own generator. Add an Anthropic API key under Life to have Claude write events too.';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
