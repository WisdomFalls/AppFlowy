// UI controller. Vanilla DOM, one render pass per change - the simulation is
// the interesting part, so the interface stays boring on purpose.

import {
  createGame, defaultCreation, characterSummary, currentYear, livingNpcs,
  startYear, choose, currentEvent, enterAfterlife, epitaph, beginLegacy,
  insertEvent, renarrateLast, skipRemaining, ladderStatus, nearbyForms,
  availableActions, runAction, actionOptions, Rng,
  initSampling, improviseEvent, narrateOutcome, backendName, getApiKey, setApiKey, errorCopy,
  eventsRemaining,
  save, load, listSaves, clearSlot, exportString, importString,
} from '../game.js';
import { RACES, getRace, UPBRINGINGS, TEMPERAMENTS, BODY_TYPES } from '../data/races.js';
import { PLACES, getPlace } from '../data/places.js';
import { APPEARANCE } from '../engine/state.js';
import { portraitSvg, defaultAppearance, HAIR_STYLES, HAIR_COLOURS, EYE_SHAPES, EYE_COLOURS,
  SKIN_TONES, FACE_SHAPES, OUTFITS, STANCES as STANCE_LIST } from './portrait.js';
import { eraName, worldPowerBaseline } from '../data/timeline.js';
import { generateFullName } from '../data/names.js';
import { BRANCHES, TECH_BY_ID } from '../data/techniques.js';
import { getTransformation } from '../data/transformations.js';
import { STAT_KEYS, STAT_LABELS, combatPower, powerTier } from '../engine/stats.js';
import { relationLabel, bondScore, bondLabel, romanceLabel, dossier, knowledgeLabel } from '../engine/npc.js';
import { npcActions, runNpcAction } from '../engine/social.js';
import { scoreReplyLocally, applyReply, impressionLabel } from '../engine/dialogue.js';
import { judgeReply, getAiConfig, setAiConfig, backendLabel, testAiEndpoint } from '../engine/ai.js';
import { numberish, zeni } from '../engine/text.js';
import { getRng, saveRng } from '../engine/state.js';
import { createBattle, battleActions, takeTurn, battleStatus, describeMatchup, battleAftermath, STANCES } from '../engine/battle.js';
import { slotsLeft, slotsMax, costLabel } from '../engine/economy.js';
import { ballsHeld, ballManifest, pingSquare, GRID } from '../engine/dragonballs.js';
import { resolveTrial, getMastery } from '../engine/trials.js';
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

let CREATE_TAB = 'face';

const CREATE_TABS = [
  { id: 'face', label: 'Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'body', label: 'Body' },
  { id: 'clothes', label: 'Clothes' },
  { id: 'self', label: 'Self' },
  { id: 'origin', label: 'Origin' },
];

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
  if (!DRAFT.look) DRAFT.look = defaultAppearance(new Rng(Date.now()), DRAFT.raceId);

  optionRow($('opt-race'), RACES.map((r) => ({ id: r.id, name: r.short })), DRAFT.raceId, (id) => {
    DRAFT.raceId = id;
    const r = getRace(id);
    DRAFT.placeId = r.homeworlds[0];
    DRAFT.look = defaultAppearance(new Rng(Date.now() ^ 7), id);
    if (!DRAFT.nameTouched) DRAFT.name = generateFullName(new Rng(Date.now()), id);
    renderCreation();
  });

  const card = $('race-card');
  card.innerHTML = '';
  card.appendChild(el('div', 'race-name', race.name));
  card.appendChild(el('div', 'race-blurb', race.blurb));
  card.appendChild(el('div', 'race-note', race.notes));

  $('in-name').value = DRAFT.name;
  renderPortraitPreview();

  const tabs = $('create-tabs');
  tabs.innerHTML = '';
  for (const tab of CREATE_TABS) {
    const b = el('button', 'ctab' + (CREATE_TAB === tab.id ? ' active' : ''), tab.label);
    b.type = 'button';
    b.addEventListener('click', () => { CREATE_TAB = tab.id; renderCreation(); });
    tabs.appendChild(b);
  }

  const panel = $('create-panel');
  panel.innerHTML = '';
  const look = DRAFT.look;
  const set = (key, value) => { look[key] = value; renderCreation(); };

  if (CREATE_TAB === 'face') {
    labelled(panel, 'Skin');
    swatchRow(panel, SKIN_TONES, look.skin, (v) => set('skin', v));
    labelled(panel, 'Face shape');
    const faces = el('div', 'opts');
    for (const f of FACE_SHAPES) {
      const b = el('button', 'opt' + (look.face === f.id ? ' on' : ''), f.name);
      b.type = 'button';
      b.addEventListener('click', () => set('face', f.id));
      faces.appendChild(b);
    }
    panel.appendChild(faces);
    labelled(panel, 'Eye shape');
    const eyes = el('div', 'opts');
    for (const e2 of EYE_SHAPES) {
      const b = el('button', 'opt' + (look.eyeShape === e2.id ? ' on' : ''), e2.name);
      b.type = 'button';
      b.addEventListener('click', () => set('eyeShape', e2.id));
      eyes.appendChild(b);
    }
    panel.appendChild(eyes);
    labelled(panel, 'Eye colour');
    swatchRow(panel, EYE_COLOURS, look.eyeColour, (v) => set('eyeColour', v));
    labelled(panel, 'Marking');
    const marks = el('div', 'opts');
    for (const m of [['none', 'None'], ['scar', 'Facial scar'], ['dots', 'Forehead dots'], ['thirdeye', 'Third eye']]) {
      const b = el('button', 'opt' + (look.marking === m[0] ? ' on' : ''), m[1]);
      b.type = 'button';
      b.addEventListener('click', () => set('marking', m[0]));
      marks.appendChild(b);
    }
    panel.appendChild(marks);
  } else if (CREATE_TAB === 'hair') {
    labelled(panel, 'Style');
    const styles = el('div', 'opts');
    for (const st of HAIR_STYLES) {
      const b = el('button', 'opt' + (look.hairStyle === st.id ? ' on' : ''), st.name);
      b.type = 'button';
      b.addEventListener('click', () => set('hairStyle', st.id));
      styles.appendChild(b);
    }
    panel.appendChild(styles);
    labelled(panel, 'Colour');
    swatchRow(panel, HAIR_COLOURS, look.hairColour, (v) => set('hairColour', v));
    if (['namekian', 'frostdemon', 'majin', 'bioandroid'].includes(DRAFT.raceId)) {
      panel.appendChild(el('p', 'hint-text', `${race.short}s do not grow hair. The style is ignored.`));
    }
  } else if (CREATE_TAB === 'body') {
    labelled(panel, 'Build');
    optionRow(panel.appendChild(el('div', 'opts')), BODY_TYPES, DRAFT.bodyId, (id) => {
      DRAFT.bodyId = id;
      look.buildShape = id;
      renderCreation();
    });
    labelled(panel, 'Height');
    const hRow = el('div', 'slider-row');
    const hIn = el('input');
    hIn.type = 'range'; hIn.min = '110'; hIn.max = '260'; hIn.value = String(look.heightCm);
    hIn.addEventListener('input', () => {
      look.heightCm = Number(hIn.value);
      $('create-sub-echo').textContent = describeBody();
      hVal.textContent = look.heightCm + ' cm';
    });
    const hVal = el('div', 'slider-val', look.heightCm + ' cm');
    hRow.appendChild(hIn); hRow.appendChild(hVal);
    panel.appendChild(hRow);

    labelled(panel, 'Weight');
    const wRow = el('div', 'slider-row');
    const wIn = el('input');
    wIn.type = 'range'; wIn.min = '30'; wIn.max = '260'; wIn.value = String(look.weightKg);
    wIn.addEventListener('input', () => {
      look.weightKg = Number(wIn.value);
      $('create-sub-echo').textContent = describeBody();
      wVal.textContent = look.weightKg + ' kg';
    });
    const wVal = el('div', 'slider-val', look.weightKg + ' kg');
    wRow.appendChild(wIn); wRow.appendChild(wVal);
    panel.appendChild(wRow);
  } else if (CREATE_TAB === 'clothes') {
    labelled(panel, 'What you wear');
    const fits = el('div', 'opts');
    for (const o of OUTFITS) {
      const b = el('button', 'opt' + (look.outfit === o.id ? ' on' : ''), o.name);
      b.type = 'button';
      b.addEventListener('click', () => set('outfit', o.id));
      fits.appendChild(b);
    }
    panel.appendChild(fits);
  } else if (CREATE_TAB === 'self') {
    labelled(panel, 'Temperament');
    optionRow(panel.appendChild(el('div', 'opts')), TEMPERAMENTS, DRAFT.temperamentId, (id) => {
      DRAFT.temperamentId = id; renderCreation();
    });
    labelled(panel, 'Fighting stance');
    const stances = el('div', 'opts');
    for (const st of STANCE_LIST) {
      const b = el('button', 'opt' + (look.stance === st.id ? ' on' : ''), st.name);
      b.type = 'button';
      b.addEventListener('click', () => set('stance', st.id));
      stances.appendChild(b);
    }
    panel.appendChild(stances);
    if (look.stance === 'custom') {
      const input = el('input', 'text-input');
      input.placeholder = 'Name your style';
      input.maxLength = 32;
      input.value = look.stanceName || '';
      input.addEventListener('input', () => { look.stanceName = input.value; });
      panel.appendChild(input);
    }
    labelled(panel, 'Gender');
    const sexes = el('div', 'opts');
    for (const sx of [['female', 'Female'], ['male', 'Male'], ['nonbinary', 'Non-binary']]) {
      const b = el('button', 'opt' + (DRAFT.sex === sx[0] ? ' on' : ''), sx[1]);
      b.type = 'button';
      b.addEventListener('click', () => { DRAFT.sex = sx[0]; renderCreation(); });
      sexes.appendChild(b);
    }
    panel.appendChild(sexes);
  } else {
    labelled(panel, 'Born into');
    optionRow(panel.appendChild(el('div', 'opts')), UPBRINGINGS, DRAFT.upbringingId, (id) => {
      DRAFT.upbringingId = id; renderCreation();
    });
    const up = UPBRINGINGS.find((u) => u.id === DRAFT.upbringingId);
    panel.appendChild(el('p', 'row-note', up ? up.blurb : ''));

    labelled(panel, 'Born in');
    const era = el('select', 'text-input');
    fillSelect(era, ERAS.map((e2) => ({ value: String(e2.year), label: e2.label })), String(DRAFT.birthYear));
    era.addEventListener('change', () => { DRAFT.birthYear = Number(era.value); renderCreation(); });
    panel.appendChild(era);
    panel.appendChild(el('p', 'row-note',
      `${eraName(DRAFT.birthYear)}. A serious fighter of this era is around ${numberish(worldPowerBaseline(DRAFT.birthYear))}.`));

    labelled(panel, 'Homeworld');
    const homes = race.homeworlds.map((h) => getPlace(h)).filter(Boolean);
    const homeSel = el('select', 'text-input');
    fillSelect(homeSel, (homes.length ? homes : PLACES.slice(0, 6)).map((p) => ({ value: p.id, label: p.name })), DRAFT.placeId);
    homeSel.addEventListener('change', () => { DRAFT.placeId = homeSel.value; renderCreation(); });
    panel.appendChild(homeSel);

    labelled(panel, 'Seed (optional)');
    const seed = el('input', 'text-input');
    seed.id = 'in-seed';
    seed.placeholder = 'leave blank for a random life';
    seed.value = DRAFT.seed || '';
    seed.addEventListener('input', () => { DRAFT.seed = seed.value; });
    panel.appendChild(seed);
  }
}

function describeBody() {
  const look = DRAFT.look;
  const build = BODY_TYPES.find((b) => b.id === DRAFT.bodyId);
  const stance = STANCE_LIST.find((s2) => s2.id === look.stance);
  const stanceName = look.stance === 'custom' && look.stanceName ? look.stanceName : (stance ? stance.name : '');
  return `${getRace(DRAFT.raceId).short} - ${look.heightCm}cm, ${look.weightKg}kg - ${build ? build.name : ''}`
    + (stanceName ? ` - ${stanceName}` : '');
}

function renderPortraitPreview() {
  $('create-portrait').innerHTML = portraitSvg(
    { raceId: DRAFT.raceId, tail: getRace(DRAFT.raceId).perks.includes('oozaru'), appearance: DRAFT.look },
    {},
  );
  $('create-name-echo').textContent = DRAFT.name;
  $('create-sub-echo').textContent = describeBody();
}

function readCreationInputs() {
  DRAFT.name = $('in-name').value.trim() || DRAFT.name;
}

function newDraft() {
  const rng = new Rng(Date.now() ^ Math.floor(Math.random() * 1e9));
  const d = defaultCreation(rng);
  d.birthYear = 737;
  d.nameTouched = false;
  d.look = defaultAppearance(rng, d.raceId);
  d.look.buildShape = d.bodyId;
  d.seed = '';
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
  $('hud-sub').textContent = `${s.race} - ${s.place} - Age ${s.year}${c.inAfterlife ? ' - OTHER WORLD' : ''}`;
  $('hud-age').innerHTML = `${c.age}<small>${c.inAfterlife ? 'dead' : 'years'}</small>`;
  $('hud-power').textContent = numberish(s.combat);
  $('hud-tier').textContent = s.tier;

  const setBar = (key, value, max) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    $('f-' + key).style.width = pct + '%';
    $('v-' + key).textContent = Math.round(value);
  };
  setBar('health', c.vitals.health, 100);
  setBar('happy', c.vitals.happiness, 100);
  setBar('ki', c.vitals.ki, Math.max(1, c.vitals.kiMax));

  const pills = $('hud-pills');
  pills.innerHTML = '';
  const add = (label, value, cls) => {
    const p = el('span', 'pill' + (cls ? ' ' + cls : ''));
    p.innerHTML = `${label} <b>${value}</b>`;
    pills.appendChild(p);
  };
  const left = slotsLeft(GAME);
  add('Year', `${left}/${slotsMax(GAME)}`, left === 0 ? 'bad' : left <= 1 ? 'gold' : 'good');
  add('Zeni', zeni(c.zeni).replace(' Zeni', ''));
  add('Fame', Math.round(c.fame));
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
    const b = el('button', 'choice' + (choice.danger ? ' danger' : ''));
    b.type = 'button';
    b.disabled = !!choice.locked;
    b.appendChild(el('span', 'choice-label', choice.label));
    if (choice.hint || choice.lockReason) {
      b.appendChild(el('span', 'choice-hint', choice.locked ? choice.lockReason : choice.hint));
    }
    b.addEventListener('click', () => answerEvent(event, choice.id));
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

function answerEvent(event, choiceId) {
  const pending = choose(GAME, choiceId);
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
  const left = slotsLeft(GAME);
  const { body } = sheetShell('Activities', `${left} of ${slotsMax(GAME)} left this year`);
  if (left === 0) {
    body.appendChild(el('p', 'row-note', 'The year is spent. Age up to get another one.'));
  }
  const groups = { body: 'Body', mind: 'Mind', power: 'Power', social: 'People', world: 'World' };
  const actions = availableActions(GAME);

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
      cost.textContent = action.cost;
      if (action.maxPerYear) {
        cost.appendChild(el('div', '', `${action.used}/${action.maxPerYear}`));
      }
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
  for (const option of options) {
    const b = el('button', 'row');
    b.type = 'button';
    b.disabled = !!option.disabled;
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', option.label));
    if (option.hint) main.appendChild(el('div', 'row-note', option.hint));
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

  if (npc.isCanon && npc.personality) {
    body.appendChild(el('p', 'entry-text', npc.personality));
  }

  body.appendChild(el('div', 'group-label', 'What you know'));
  const table = el('div', 'dossier');
  for (const row of dossier(npc, { full: npc.isCanon })) {
    const line = el('div', 'dossier-row');
    line.appendChild(el('span', 'dossier-key', row.label));
    line.appendChild(el('span', 'dossier-val' + (row.value === '\u2014' ? ' unknown' : ''), row.value));
    table.appendChild(line);
  }
  body.appendChild(table);

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

  body.appendChild(el('div', 'group-label', 'Transformations'));
  const ladder = ladderStatus(GAME);
  if (!ladder.length) body.appendChild(el('p', 'row-note', 'Your species does not transform.'));
  for (const form of ladder) {
    const row = el('div', 'row' + (form.owned ? ' owned' : form.missing.length ? ' locked' : ''));
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', form.name));
    const mastery = getMastery(GAME, form.id);
    main.appendChild(el('div', 'row-note', form.owned
      ? `${mastery}% mastered - ${form.desc}`
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
    const fields = [
      ['baseUrl', 'Endpoint URL', 'https://your-model/v1/chat/completions', 'text'],
      ['model', 'Model name', 'the model id your endpoint expects', 'text'],
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
    for (const [id, label] of [['openai', 'OpenAI-compatible'], ['anthropic', 'Anthropic Messages']]) {
      const b = el('button', 'opt' + (cfg.format === id ? ' on' : ''), label);
      b.type = 'button';
      b.addEventListener('click', () => { setAiConfig({ format: id }); panelRecords(); });
      shapes.appendChild(b);
    }
    body.appendChild(shapes);

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
      'Anything that answers on either shape works. Settings stay in this browser and are sent only to the endpoint you name.'));
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

// ------------------------------------------------------------------- hunt

let HUNT = null;

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
  $('foe-name').textContent = st.them.name;
  $('foe-sub').textContent = [st.them.tier, st.them.form, st.them.stance].filter(Boolean).join(' - ');
  $('foe-power').textContent = numberish(st.them.power);
  $('foe-hp').style.width = Math.max(0, st.them.hp) + '%';
  $('foe-state').textContent = st.them.hp > 60 ? 'Barely marked'
    : st.them.hp > 30 ? 'Hurt' : st.them.hp > 10 ? 'Badly hurt' : 'Barely standing';
  $('battle-round').textContent = 'Round ' + st.round;

  const destruction = $('destruction');
  destruction.hidden = !BATTLE.civilians;
  $('destruction-fill').style.width = st.destruction + '%';

  $('my-hp').style.width = Math.max(0, st.me.hp) + '%';
  $('my-ki').style.width = Math.max(0, (st.me.ki / Math.max(1, st.me.kiMax)) * 100) + '%';
  $('my-sta').style.width = Math.max(0, st.me.stamina) + '%';
  $('my-state').textContent = [st.me.form, st.me.stance].filter(Boolean).join(' - ');

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

  const outcomeLine = {
    won: 'You win.', lost: 'You lose.', fled: 'You got out.',
    yielded: 'You yielded and they let it stand.', draw: 'Neither of you could finish it.',
  }[BATTLE.outcome] || 'It is over.';

  const done = el('button', 'bact wide');
  done.type = 'button';
  done.appendChild(el('span', 'bact-label', outcomeLine));
  done.appendChild(el('span', 'bact-hint', 'Back to your life'));
  done.addEventListener('click', () => closeBattle(after));
  wrap.appendChild(done);

  // Beating somebody is a decision point, not just a result.
  if (BATTLE.outcome === 'won' && BATTLE.stakes !== 'spar') {
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
  $('btn-random-all').addEventListener('click', () => { DRAFT = newDraft(); renderCreation(); });
  $('btn-random-look').addEventListener('click', () => {
    DRAFT.look = defaultAppearance(new Rng(Date.now() ^ Math.floor(Math.random() * 1e9)), DRAFT.raceId);
    DRAFT.look.buildShape = DRAFT.bodyId;
    renderCreation();
  });
  $('btn-reroll-name').addEventListener('click', () => {
    DRAFT.name = generateFullName(new Rng(Date.now() ^ Math.floor(Math.random() * 1e9)), DRAFT.raceId);
    DRAFT.nameTouched = false;
    $('in-name').value = DRAFT.name;
  });
  $('in-name').addEventListener('input', () => {
    DRAFT.nameTouched = true;
    DRAFT.name = $('in-name').value;
    $('create-name-echo').textContent = DRAFT.name;
  });

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
