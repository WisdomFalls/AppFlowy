// UI controller. Vanilla DOM, one render pass per change - the simulation is
// the interesting part, so the interface stays boring on purpose.

import {
  createGame, defaultCreation, characterSummary, currentYear, livingNpcs,
  startYear, choose, currentEvent, enterAfterlife, epitaph, beginLegacy,
  insertEvent, renarrateLast, skipRemaining, ladderStatus, nearbyForms,
  availableActions, runAction, actionOptions, Rng,
  initSampling, improviseEvent, narrateOutcome, backendName, getApiKey, setApiKey, errorCopy,
  interpretWish,
  eventsRemaining, openingLogEntry, acceptPermanentDeath,
  save, load, listSaves, clearSlot, exportString, importString,
} from '../game.js';
import { CREATABLE_RACES, getRace, sexesFor, UPBRINGINGS, TEMPERAMENTS, BODY_TYPES } from '../data/races.js';
import { PLACES, getPlace } from '../data/places.js';
import { APPEARANCE } from '../engine/state.js';
import { portraitSvg, defaultAppearance, HAIR_STYLES, HAIR_COLOURS, EYE_SHAPES, EYE_COLOURS,
  SKIN_TONES, FACE_SHAPES, OUTFITS, STANCES as STANCE_LIST,
  MARK_PRESETS, ACCESSORY_PRESETS, wornAccessories, allMarks,
  npcPortrait, lifeStage } from './portrait.js';
import { eraName, worldPowerBaseline, TIMELINE } from '../data/timeline.js';
import { generateFullName } from '../data/names.js';
import { BRANCHES, TECH_BY_ID, techniquePurity, techniqueDisplayName } from '../data/techniques.js';
import { getTransformation, ladderFor } from '../data/transformations.js';
import { getCanon } from '../data/canon.js';
import { STAT_KEYS, STAT_LABELS, combatPower, powerTier, looksScore } from '../engine/stats.js';
import { relationLabel, bondScore, bondLabel, romanceLabel, dossier, knowledgeLabel } from '../engine/npc.js';
import { npcActions, runNpcAction, canVisitLiving, checkRomanceSpark } from '../engine/social.js';
import { scoreReplyLocally, applyReply, impressionLabel } from '../engine/dialogue.js';
import { judgeReply, getAiConfig, setAiConfig, backendLabel, testAiEndpoint, PRESETS } from '../engine/ai.js';
import { numberish, zeni } from '../engine/text.js';
import { inventoryOf, ensureBag, toggleWorn, sellItem, buyItem, valueHere,
  repairItem, giveItem, knownItems, npcBag, requestItem, itemSlot, findEntry } from '../engine/inventory.js';
import { currencyFor, balance, formatMoney, exchange, CURRENCIES, priceIn } from '../data/currency.js';
import { mostWantedBoard, wantedLevel } from '../engine/bounty.js';
import { getItem } from '../data/items.js';
import { TRAITS, getTrait, TRAIT_KINDS } from '../data/traits.js';
import { reputationOf, homeOf, homeBonus, shipOf, SHIP_ROOM_BY_ID, SHIP_HULL_BY_ID, SHIP_COMPONENT_BY_ID, renameShip } from '../engine/settlement.js';
import { readPower, describePower, shortPower, canReadPower, hasScouter, hasKiSense } from '../engine/perception.js';
import { getRng, saveRng, findNpc } from '../engine/state.js';
import { ceilingFor, ceilingBlock, ceilingPressure, masteryLabel } from '../engine/mastery.js';
import { injuryList } from '../engine/body.js';
import { worldManifest } from '../engine/worlds.js';
import { factionsPresent } from '../data/factions.js';
import { getPlanet } from '../data/planets.js';
import { getCareer, dutiesFor } from '../data/jobs.js';
import { startSurvival, survivalActions, survivalTurn, survivalStatus, resolveTeamWish, RULES } from '../engine/survival.js';
import { createBattle, battleActions, takeTurn, battleStatus, describeMatchup, battleAftermath, finishLethalWin, lootDefeatedNpc, killKarmaDelta, moralAlignmentOf, STANCES } from '../engine/battle.js';
import { costLabel, limitFor, usedThisYear, yearCapacity } from '../engine/economy.js';
import { ballsHeld, ballManifest, pingSquare, GRID } from '../engine/dragonballs.js';
import { resolveTrial, getMastery } from '../engine/trials.js';
import { deadPowerNow } from '../engine/events/afterlife.js';
import {
  FORMATS, createTournament, roundName, playerMatch, playerOpponent,
  resolveOtherMatches, recordPlayerResult, matchBattleSpec, bracketSummary,
  standings, payout, placementLine, describeField, settle,
} from '../engine/tournament.js';
import { playTrial } from './trialui.js';
import { setAmbienceEnabled, isAmbienceEnabled, setMood } from './ambience.js';

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
let CURRENT_SLOT = 'auto';
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

/**
 * A form's threshold in plain words, independent of any particular life -
 * the same shape as missingRequirements() (progression.js) but without a
 * live character to compare against, since this is a reference table, not
 * a status readout. Kept in the UI layer rather than duplicated into the
 * engine: it only ever formats data that already lives on the form.
 */
function describeReq(req) {
  const parts = [];
  if (req.power) parts.push(`power level ${numberish(req.power)}`);
  if (req.parent) {
    const p = getTransformation(req.parent);
    parts.push(`already holding ${p ? p.name : req.parent}`);
  }
  for (const [k, v] of Object.entries(req.stat || {})) parts.push(`${STAT_LABELS[k] || k} ${v}+`);
  for (const f of req.flags || []) parts.push(f.replace(/_/g, ' '));
  if (req.anyFlag) parts.push(`a moment that would trigger it (${req.anyFlag.map((f) => f.replace(/_/g, ' ')).join(', ')})`);
  for (const t of req.traits || []) parts.push(t === 'tail' ? 'a tail' : t.replace(/_/g, ' '));
  for (const m of req.mentors || []) parts.push(`training under ${m.replace(/_/g, ' ')}`);
  for (const t of req.techniques || []) parts.push(t.replace(/_/g, ' '));
  if (req.age) parts.push(`age ${req.age}+`);
  if (req.custom) parts.push(req.custom.replace(/_/g, ' '));
  return parts.length ? parts.join(', ') : 'a starting form - nothing to reach for';
}

/** Every species' transformation ladder, thresholds and all - a canonical
 * table, not a status readout on any one life, so it lives off the title
 * screen and needs no character loaded to open. */
function openFormReference() {
  const { body } = sheetShell('Transformation Ladders', 'Every species, every threshold known');
  for (const race of CREATABLE_RACES) {
    const ladder = ladderFor(race.id);
    if (!ladder.length) continue;
    body.appendChild(el('div', 'group-label', race.name));
    for (const form of ladder) {
      const row = el('div', 'row');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', form.name));
      main.appendChild(el('div', 'row-note', describeReq(form.req || {})));
      row.appendChild(main);
      row.appendChild(el('div', 'row-value', 'x' + numberish(form.mult)));
      body.appendChild(row);
    }
  }
  const back = el('button', 'ghost-btn', 'Back');
  back.type = 'button';
  back.addEventListener('click', closeSheet);
  body.appendChild(back);
  openSheet('panel');
}

/**
 * The one place mortality actually gets said out loud. Natural aging and
 * old-age death (agingDecay/naturalDeathChance in stats.js) were always
 * race-differentiated under the hood - a human ages at full rate over
 * 72-96 years, an android at a twelfth of that over centuries - but
 * nothing in the UI ever told the player so, at creation or in play. The
 * mechanic existing invisibly reads the same as it not existing at all.
 */
function lifespanLine(race) {
  const [lo, hi] = race.lifespan;
  const span = `${numberish(lo)}-${numberish(hi)} years`;
  if (race.agingRate <= 0.15) {
    return `Ages so slowly it barely shows. A natural lifespan of ${span} - long enough that almost nothing dies of old age first.`;
  }
  if (race.agingRate <= 0.4) {
    return `Ages slowly. A natural lifespan of ${span}, most of it spent looking much as it started.`;
  }
  return `Ages at roughly the pace it looks like. A natural lifespan of ${span}.`;
}

function renderCreation() {
  const race = getRace(DRAFT.raceId);

  optionRow($('opt-race'), CREATABLE_RACES.map((r) => ({ id: r.id, name: r.short })), DRAFT.raceId, (id) => {
    DRAFT.raceId = id;
    if (!DRAFT.nameTouched) DRAFT.name = generateFullName(new Rng(Date.now()), id);
    renderCreation();
  });

  const card = $('race-card');
  card.innerHTML = '';
  card.appendChild(el('div', 'race-name', race.name));
  card.appendChild(el('div', 'race-blurb', race.blurb));
  card.appendChild(el('div', 'race-note', race.notes));
  card.appendChild(el('div', 'race-note', lifespanLine(race)));

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

  const allowedSexes = sexesFor(DRAFT.raceId);
  if (!allowedSexes.includes(DRAFT.sex)) DRAFT.sex = allowedSexes[0];
  const sexes = $('opt-sex');
  sexes.innerHTML = '';
  const SEX_LABEL = { female: 'Female', male: 'Male' };
  for (const sx of allowedSexes) {
    const b = el('button', 'opt' + (DRAFT.sex === sx ? ' on' : ''), SEX_LABEL[sx]);
    b.type = 'button';
    b.addEventListener('click', () => { DRAFT.sex = sx; renderCreation(); });
    sexes.appendChild(b);
  }

  const seed = $('in-seed');
  if (seed) seed.value = DRAFT.seed || '';
}

/** A hint about what being this species in this century usually means. */
function originHint(raceId, year) {
  if (raceId === 'saiyan' && year < 737) return ' Planet Vegeta still stands, and it will not stand for long - or, in a universe next door, Sadala never fell at all. Which one is not yours to pick.';
  if (raceId === 'saiyan' && year === 737) return ' You are born in the year Planet Vegeta falls. You will be very small when it happens - unless it is Sadala under you instead, in the universe where nothing like that ever came.';
  if (raceId === 'saiyan') return ' Your people are ash, and you were not on the planet - or your people never burned at all. Two different universes call themselves Saiyan.';
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


/**
 * The next canon beat still ahead of this life, whatever world it lands
 * on. finishYear() (lifecycle.js) fires these the instant the year comes
 * up regardless of where the player happens to be standing - nothing ever
 * told them one was coming, so there was no way to travel for it on
 * purpose instead of just reading about it having happened somewhere else.
 */
function nextTimelineEvent(state) {
  const year = currentYear(state);
  const upcoming = TIMELINE.filter((t) => t.year >= year
    && !state.world.resolved.includes(t.id)
    && !(t.cancelIf && state.world.flags[t.cancelIf]));
  upcoming.sort((a, b) => a.year - b.year);
  return upcoming[0] || null;
}

function renderHud() {
  const s = characterSummary(GAME);
  const c = GAME.character;
  const portraitBox = $('hud-portrait');
  if (portraitBox) {
    const form = c.activeForm || (c.transformations.length ? { name: '' } : null);
    // The aura, form-tinted hair and eyes only belong to a form you are
    // actually holding right now - the everyday portrait is not a record of
    // your strongest transformation ever reached.
    portraitBox.innerHTML = portraitSvg(c, {});
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
  if (cap < 0.75) add('Actions this year', cap < 0.5 ? 'Few' : 'Limited', 'gold');
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
  if (!c.inAfterlife) {
    const next = nextTimelineEvent(GAME);
    if (next) {
      const yearsAway = next.year - s.year;
      const herePlanet = getPlace(c.placeId).planet;
      const planetName = getPlanet(next.planet) ? getPlanet(next.planet).name : next.planet;
      const label = herePlanet === next.planet ? next.name : `${next.name} → ${planetName}`;
      add(label, yearsAway <= 0 ? 'Now' : `${yearsAway}y`, 'gold');
    }
  }

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
  // #app only sets min-height, so when content overflows it is the whole
  // page that scrolls, not .feed internally (.feed's own overflow-y:auto
  // never actually engages). Clearing innerHTML collapses the page's height
  // for an instant; the browser clamps window scroll to fit the now-tiny
  // document, and that clamp never gets undone once the content grows back
  // - which is what reads as "Age Up throws me to the top of my life" if you
  // were scrolled down through old entries. Preserve both the feed's own
  // scroll (in case a layout does make it the real scroller) and the page's.
  const scroller = document.scrollingElement || document.documentElement;
  const feedNearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
  const pageNearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80;
  const priorFeedScrollTop = feed.scrollTop;
  const priorPageScrollTop = scroller.scrollTop;
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
  // Deferred a frame so the browser has actually laid out the new content
  // before scrollHeight is read - reading it synchronously right after the
  // innerHTML rebuild can under-report the real height mid-layout.
  requestAnimationFrame(() => {
    feed.scrollTop = feedNearBottom ? feed.scrollHeight : priorFeedScrollTop;
    scroller.scrollTop = pageNearBottom ? scroller.scrollHeight : priorPageScrollTop;
  });
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
        else if (options) {
          // An options-driven action found nothing to choose between - that
          // is a real, explainable outcome (nowhere to travel to, nothing
          // left to train toward), not the same thing as an action with no
          // options step at all. Say so, rather than silently running it
          // with nothing picked and letting it fall back on a generic line.
          flash(action.emptyHint || `Nothing available for ${action.name.toLowerCase()} right now.`);
        } else doAction(action.id, {});
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

  if (npc.personality) {
    body.appendChild(el('p', 'entry-text', npc.personality));
  }

  body.appendChild(el('div', 'group-label', 'What you know'));
  // Only what you can actually read. Knowing somebody for years tells you they
  // are dangerous; it does not tell you a figure. A dead NPC you personally
  // ended is not frozen where you left them either - they_are_here has them
  // training in Hell the whole time, so their dossier reads the same
  // escalating number that encounter would actually throw at you.
  const displayPower = npc.alive ? npc.power : deadPowerNow(GAME, npc);
  const read = readPower(GAME, displayPower);
  const powerRead = read.known
    ? `${read.text} (${read.how})`
    : read.broke ? 'Your scouter did not survive the reading.'
      : `${read.text}${(npc.knowledge || 0) >= 2 ? '' : ''}`;
  if (read.broke) flash('Your scouter climbs, screams and comes apart.', 5000);
  // Generated before the dossier is built, so "Wearing" can actually
  // reflect what is in the bag rather than a description disconnected
  // from it.
  const rngBag = getRng(GAME);
  npcBag(rngBag, npc);
  saveRng(GAME, rngBag);
  const table = el('div', 'dossier');
  // Being canon does not make somebody an open book - Vegeta does not hand
  // you his stats because he is famous. Canon NPCs read through the same
  // knowledge/personality gate as everyone else now; only a King Yemma-style
  // full lookup (nothing currently calls dossier() that way) should force it.
  for (const row of dossier(npc, { powerRead, playerPower: combatPower(GAME.character) })) {
    const line = el('div', 'dossier-row');
    line.appendChild(el('span', 'dossier-key', row.label));
    line.appendChild(el('span', 'dossier-val' + (row.value === '\u2014' ? ' unknown' : ''), row.value));
    table.appendChild(line);
  }
  body.appendChild(table);

  // Dead, and they are not: nothing past reading the dossier is yours to do
  // unless King Yemma has actually granted a day back among the living
  // (day_pass_offer, afterlife.js). No asking, buying, taking, gifting, or
  // any social action - that used to just work regardless, which meant the
  // afterlife had no actual wall around it.
  if (!canVisitLiving(GAME, npc)) {
    body.appendChild(el('p', 'row-note',
      `You are dead, and ${npc.name} is not. Whatever this was, it waits for a day King Yemma actually grants you.`));
    const back0 = el('button', 'ghost-btn', 'Back to everyone');
    back0.type = 'button';
    back0.addEventListener('click', panelPeople);
    body.appendChild(back0);
    openSheet('panel');
    return;
  }

  // What they are carrying, as far as you have seen. Ask, buy, or take it.
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

/**
 * Something you made up got named for you, by a generator, with a reroll
 * that only ever offered another generated name - never your own words.
 * This is the one place that gets fixed: a plain text box, whatever you
 * already invented (a signature technique, a form built past its parent)
 * kept exactly as it was otherwise, renamed to whatever you actually type.
 */
function openRenamePanel(title, currentName, onSave, onDone) {
  const back = onDone || panelPower;
  const { body } = sheetShell(title, 'Yours. Call it whatever you actually want.');
  const input = document.createElement('input');
  input.className = 'text-input';
  input.type = 'text';
  input.maxLength = 40;
  input.value = currentName;
  input.autocomplete = 'off';
  body.appendChild(input);

  const save = el('button', 'primary-btn', 'Save');
  save.type = 'button';
  save.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) { flash('Name it something.'); return; }
    onSave(name);
    autosave();
    back();
  });
  body.appendChild(save);

  const cancel = el('button', 'ghost-btn', 'Cancel');
  cancel.type = 'button';
  cancel.addEventListener('click', back);
  body.appendChild(cancel);
  openSheet('panel');
}

/** Naming and marking a piece of gear that is actually yours - a custom
 * name plus a short emblem/motto, both optional, both stored on the bag
 * entry rather than the shared item catalog. */
function openGearPersonalizePanel(entry, itemName) {
  const { body } = sheetShell(`Personalize ${itemName}`, 'A name and a mark, yours to set or leave blank.');
  const nameInput = document.createElement('input');
  nameInput.className = 'text-input';
  nameInput.type = 'text';
  nameInput.maxLength = 40;
  nameInput.placeholder = itemName;
  nameInput.value = entry.customName || '';
  nameInput.autocomplete = 'off';
  body.appendChild(el('div', 'group-label', 'Name'));
  body.appendChild(nameInput);

  const emblemInput = document.createElement('input');
  emblemInput.className = 'text-input';
  emblemInput.type = 'text';
  emblemInput.maxLength = 24;
  emblemInput.placeholder = 'A mark, a motto, a house sigil';
  emblemInput.value = entry.emblem || '';
  emblemInput.autocomplete = 'off';
  body.appendChild(el('div', 'group-label', 'Emblem'));
  body.appendChild(emblemInput);

  const save = el('button', 'primary-btn', 'Save');
  save.type = 'button';
  save.addEventListener('click', () => {
    entry.customName = nameInput.value.trim() || null;
    entry.emblem = emblemInput.value.trim() || null;
    autosave();
    panelInventory();
  });
  body.appendChild(save);

  const cancel = el('button', 'ghost-btn', 'Cancel');
  cancel.type = 'button';
  cancel.addEventListener('click', panelInventory);
  body.appendChild(cancel);
  openSheet('panel');
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
    const credit = form.creator ? `Created by ${form.creator}.` : (form.creatorNote || null);
    main.appendChild(el('div', 'row-note', form.owned
      ? `${mastery}% worn in (${masteryLabel(mastery)}) - ${form.desc}${credit ? ' ' + credit : ''}`
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
      const rename = el('button', 'mini', 'Rename');
      rename.type = 'button';
      rename.addEventListener('click', (e) => {
        e.stopPropagation();
        openRenamePanel(`Rename ${form.name}`, form.name, (name) => { form.name = name; });
      });
      row.appendChild(rename);
      body.appendChild(row);
    }
  }

  if (c.customTechniques && c.customTechniques.length) {
    body.appendChild(el('div', 'group-label', 'Techniques nobody else has'));
    for (const tech of c.customTechniques) {
      const row = el('div', 'row owned');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', tech.name));
      const num = tech.effect.atk || tech.effect.def || tech.effect.speed || 0;
      main.appendChild(el('div', 'row-note', `${BRANCHES[tech.branch].name}. Built in Age ${tech.year}. ${tech.desc}`));
      row.appendChild(main);
      row.appendChild(el('div', 'row-value', '+' + numberish(num)));
      const rename = el('button', 'mini', 'Rename');
      rename.type = 'button';
      rename.addEventListener('click', (e) => {
        e.stopPropagation();
        openRenamePanel(`Rename ${tech.name}`, tech.name, (name) => { tech.name = name; });
      });
      row.appendChild(rename);
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
    main.appendChild(el('div', 'row-note', list.map((t) => {
      const name = techniqueDisplayName(c, t.id);
      // A once-removed, renamed technique already credits the player by
      // virtue of the rename; a technique still carrying its original name
      // gets its actual inventor named instead.
      if (c.techniqueNames && c.techniqueNames[t.id]) return `${name} (yours)`;
      if (t.creator) {
        const person = getCanon(t.creator);
        return `${name} (${person ? person.name : t.creator})`;
      }
      return `${name} (no known inventor)`;
    }).join(', ')));
    row.appendChild(main);
    row.appendChild(el('div', 'row-value', String(list.length)));
    body.appendChild(row);
  }

  const diluted = c.techniques.filter((id) => techniquePurity(c, id) < 1);
  if (diluted.length) {
    body.appendChild(el('div', 'group-label', 'Not quite as taught'));
    for (const id of diluted) {
      const tech = TECH_BY_ID[id];
      if (!tech) continue;
      const named = c.techniqueNames && c.techniqueNames[id];
      const row = el('div', 'row' + (named ? ' owned' : ''));
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', techniqueDisplayName(c, id)));
      const origCreator = tech.creator ? (getCanon(tech.creator) ? getCanon(tech.creator).name : tech.creator) : null;
      main.appendChild(el('div', 'row-note', named
        ? `Refined from ${origCreator ? `${origCreator}'s ${tech.name}` : `the ${tech.name}`}. ${Math.round(techniquePurity(c, id) * 100)}% of the original.`
        : `Learned secondhand${origCreator ? ` from someone who did not invent it - that was ${origCreator}` : ''}. ${Math.round(techniquePurity(c, id) * 100)}% of what a direct teacher would have given you.`));
      row.appendChild(main);
      row.appendChild(el('div', 'row-value', Math.round(techniquePurity(c, id) * 100) + '%'));
      if (named) {
        const rename = el('button', 'mini', 'Rename');
        rename.type = 'button';
        rename.addEventListener('click', (e) => {
          e.stopPropagation();
          openRenamePanel(`Rename ${techniqueDisplayName(c, id)}`, techniqueDisplayName(c, id), (name) => {
            c.techniqueNames[id] = name;
          });
        });
        row.appendChild(rename);
      }
      body.appendChild(row);
    }
  }
  if (c.signature) {
    body.appendChild(el('div', 'group-label', 'Signature technique'));
    const row = el('div', 'row owned');
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', c.signature.name));
    main.appendChild(el('div', 'row-note', `Invented at age ${c.signature.year - c.birthYear >= 0 ? c.signature.year - c.birthYear : c.age}. Nobody else has this.`));
    row.appendChild(main);
    const rename = el('button', 'mini', 'Rename');
    rename.type = 'button';
    rename.addEventListener('click', (e) => {
      e.stopPropagation();
      openRenamePanel(`Rename ${c.signature.name}`, c.signature.name, (name) => { c.signature.name = name; });
    });
    row.appendChild(rename);
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
  shot.innerHTML = portraitSvg(c, {});
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
      const rng = getRng(GAME);
      const res = giveItem(GAME, rng, npc, row.id);
      saveRng(GAME, rng);
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

  body.appendChild(el('div', 'group-label', 'Fighting style'));
  const STYLE_LABELS = { martial_arts: 'Martial Arts', weapons: 'Weapons', both: 'Both' };
  const style = c.fightingStyle || 'martial_arts';
  body.appendChild(el('p', 'row-title', STYLE_LABELS[style]));
  const weaponYears = (c.flags && c.flags.weaponTrainingYears) || 0;
  const styleDesc = style === 'both'
    ? 'Fists or a blade, it makes no difference to you now. Years of training with one earned this.'
    : style === 'weapons'
      ? 'You fight best with something in your hand, and worse without one.'
      : (weaponYears > 0
        ? `Your body is still the weapon. Anything you pick up helps less than it would someone trained to use it (${weaponYears}/2 years trained armed).`
        : 'Your body is the weapon. Nobody handed you a fighting style - train with a weapon you actually carry, or specialise your own way, and it will show.');
  body.appendChild(el('p', 'row-note', styleDesc));

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
      if (row.cat === 'clothing' || row.cat === 'weapon') {
        const p = el('button', 'mini', 'Personalize');
        p.type = 'button';
        p.addEventListener('click', () => openGearPersonalizePanel(findEntry(c, row.id), row.item ? row.item.name : row.name));
        acts.appendChild(p);
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
    ['Intellect', c.iq], ['Luck', c.luck], ['Looks', looksScore(c)]]) {
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
  const cur = currencyFor(here.planet);
  const { body } = sheetShell('The worlds', getPlanet(here.planet).name);

  body.appendChild(el('div', 'group-label', 'Where you are'));
  const nowRow = el('div', 'row owned');
  const nowMain = el('div', 'row-main');
  nowMain.appendChild(el('div', 'row-title', `${here.name}, ${getPlanet(here.planet).name}`));
  nowMain.appendChild(el('div', 'row-note', here.desc));
  nowRow.appendChild(nowMain);
  body.appendChild(nowRow);

  const forces = factionsPresent(year, here.planet, c.universe || 7);
  if (forces.length) {
    body.appendChild(el('div', 'group-label', 'Who operates here'));
    for (const f of forces) {
      const row = el('div', 'row' + (c.faction === f.id ? ' owned' : ''));
      const main = el('div', 'row-main');
      const mine = c.faction === f.id;
      const rankName = mine && f.ranks ? f.ranks[Math.min(c.factionRank || 0, f.ranks.length - 1)] : null;
      main.appendChild(el('div', 'row-title', f.name + (mine ? ` - ${rankName || 'yours'}` : '')));
      main.appendChild(el('div', 'row-note',
        mine && rankName
          ? `Standing ${Math.round(c.factionStanding || 0)}/100. ${f.emblem} ${f.goal}`
          : `${f.emblem} ${f.goal}`));
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

  const wanted = mostWantedBoard(GAME);
  const myBounty = wantedLevel(c);
  if (wanted.length || myBounty) {
    body.appendChild(el('div', 'group-label', 'Most Wanted'));
    if (myBounty) {
      const mine = el('div', 'row owned');
      const mineMain = el('div', 'row-main');
      mineMain.appendChild(el('div', 'row-title', `${c.name} (you)`));
      mineMain.appendChild(el('div', 'row-note', 'Word is out. Somebody, somewhere, is pricing you.'));
      mine.appendChild(mineMain);
      mine.appendChild(el('div', 'row-value', formatMoney(priceIn(myBounty, cur.id), cur.id)));
      body.appendChild(mine);
    }
    for (const w of wanted) {
      const row = el('div', 'row');
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', `${w.npc.name} (${w.npc.power ? numberish(w.npc.power) : '?'})`));
      main.appendChild(el('div', 'row-note', w.reason));
      row.appendChild(main);
      row.appendChild(el('div', 'row-value', formatMoney(priceIn(w.bounty, cur.id), cur.id)));
      body.appendChild(row);
    }
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

  const race = getRace(c.raceId);
  body.appendChild(el('p', 'row-note', lifespanLine(race)));

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

  if (c.institution) {
    body.appendChild(el('div', 'group-label', 'What you built'));
    const inst = c.institution;
    const row = el('div', 'row');
    const main = el('div', 'row-main');
    main.appendChild(el('div', 'row-title', inst.name));
    const memberWord = inst.type === 'school' ? 'students' : inst.type === 'business' ? 'staff' : 'members';
    const bits = [`Founded age ${inst.founded - c.birthYear}.`, `${inst.members.length} ${memberWord}.`];
    if (inst.type === 'business') {
      const branches = (inst.branches || [inst.homePlanet]).length;
      bits.push(`${branches} location${branches === 1 ? '' : 's'}.`);
      bits.push(`${formatMoney(inst.capital || 0, currencyFor(inst.homePlanet).id)} invested.`);
    }
    bits.push(c.flags.worldIcon ? 'A name known even where you have never been.'
      : inst.renown >= 60 ? 'A real reputation of its own now.'
        : inst.renown >= 30 ? 'People are starting to send their own here.'
          : 'Still mostly just you.');
    main.appendChild(el('div', 'row-note', bits.join(' ')));
    row.appendChild(main);
    row.appendChild(el('div', 'row-value', Math.round(inst.renown) + '%'));
    body.appendChild(row);
  }

  if (c.career) {
    body.appendChild(el('div', 'group-label', 'Your job'));
    const career = getCareer(c.career.id);
    const row = el('div', 'row');
    const main = el('div', 'row-main');
    const squadName = c.flags.elite_squad ? ' - Elite Squad' : '';
    main.appendChild(el('div', 'row-title', `${c.career.title}${squadName}`));
    main.appendChild(el('div', 'row-note', `${career.name}. Performance: ${Math.round(c.career.performance)}%.`));
    for (const duty of dutiesFor(career, c.career.rung)) {
      main.appendChild(el('div', 'row-note', `- ${duty}`));
    }
    const colleagues = Object.values(GAME.npcs).filter((n) => n.alive
      && ((n.careerId === c.career.id && n.workplaceId === c.placeId)
        || (c.flags.elite_squad && n.workplaceId === 'elite_saiyan_squad')));
    if (colleagues.length) {
      main.appendChild(el('div', 'row-note', `Colleagues: ${colleagues.map((n) => n.name).join(', ')}.`));
    } else {
      main.appendChild(el('div', 'row-note', 'You do not really know anyone else there yet.'));
    }
    row.appendChild(main);
    body.appendChild(row);
  }

  if (c.photos && c.photos.length) {
    body.appendChild(el('div', 'group-label', 'What you kept'));
    for (const p of c.photos.slice().reverse().slice(0, 10)) {
      const npc = GAME.npcs[p.npcId];
      const memo = el('div', 'memo');
      const status = npc && !npc.alive ? ' (gone now)' : !npc ? '' : '';
      memo.innerHTML = `<b>AGE ${p.year - c.birthYear}</b> ${p.npcName}${status} - ${p.caption.replace(/[<>]/g, '')}`;
      body.appendChild(memo);
    }
  }

  if (c.captures && c.captures.length) {
    body.appendChild(el('div', 'group-label', 'Who you brought in'));
    for (const cap of c.captures.slice().reverse().slice(0, 10)) {
      const memo = el('div', 'memo');
      const race = getRace(cap.raceId);
      memo.innerHTML = `<b>AGE ${cap.year}</b> ${cap.name}${cap.epithet ? `, ${cap.epithet}` : ''} `
        + `(${race ? race.short : cap.raceId}) - jailed for ${cap.factionName}, ${formatMoney(cap.reward, currencyFor(getPlace(c.placeId).planet).id)}.`;
      body.appendChild(memo);
    }
  }

  if (shipOf(GAME)) {
    const ship = shipOf(GAME);
    body.appendChild(el('div', 'group-label', 'The ship'));
    const row = el('div', 'row owned');
    const main = el('div', 'row-main');
    const rooms = ship.rooms.map((id) => SHIP_ROOM_BY_ID[id]?.name).filter(Boolean);
    const components = (ship.components || []).map((id) => SHIP_COMPONENT_BY_ID[id]?.name).filter(Boolean);
    const occupants = (ship.occupants || []).map((id) => (id === 'you' ? null : GAME.npcs[id]?.name)).filter(Boolean);
    const hull = SHIP_HULL_BY_ID[ship.hullType];
    main.appendChild(el('div', 'row-title', ship.name));
    if (hull) {
      main.appendChild(el('div', 'row-note',
        `${hull.name}. Speed ${ship.speed ?? hull.baseSpeed}, hull ${ship.hull ?? hull.baseHull}/${ship.hullMax ?? hull.baseHull}`
        + `${ship.firepower ? `, firepower ${ship.firepower}` : ''}, cargo ${ship.cargo ?? hull.cargo}.`));
    }
    main.appendChild(el('div', 'row-note',
      `${rooms.length ? rooms.join(', ') : 'Empty hull, nothing added yet'}.`
      + (components.length ? ` Fitted: ${components.join(', ')}.` : '')
      + (occupants.length ? ` Aboard: ${occupants.join(', ')}.` : '')));
    row.appendChild(main);
    body.appendChild(row);
    const rename = el('button', 'ghost-btn', 'Rename the ship');
    rename.type = 'button';
    rename.addEventListener('click', () => openRenamePanel('Rename the ship', ship.name, (name) => { renameShip(GAME, name); }, panelRecords));
    body.appendChild(rename);
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
    const res = save(GAME, CURRENT_SLOT);
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
    clearSlot(CURRENT_SLOT);
    GAME = null;
    closeSheet();
    renderTitle();
    showScreen('title');
  });
  body.appendChild(quitBtn);

  const titleBtn = el('button', 'ghost-btn', 'Title screen');
  titleBtn.type = 'button';
  titleBtn.addEventListener('click', () => {
    autosave();
    closeSheet();
    renderTitle();
    showScreen('title');
  });
  body.appendChild(titleBtn);

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
    if (SURVIVAL.outcome === 'won' && SURVIVAL.teamSurvivorIds && SURVIVAL.teamSurvivorIds.length
      && !SURVIVAL.wishDecided) {
      const names = SURVIVAL.teamSurvivorIds.map((id) => GAME.npcs[id]?.name).filter(Boolean).join(' and ');
      wrap.appendChild(el('p', 'row-note',
        `${names || 'The others'} made it too. One wish, and everyone still standing has an opinion about it.`));
      const share = el('button', 'primary-btn', 'Decide it together');
      share.type = 'button';
      share.addEventListener('click', () => {
        const text = resolveTeamWish(GAME, SURVIVAL, true);
        SURVIVAL.wishDecided = true;
        pushSurvivalLines([text]);
        renderSurvival();
      });
      wrap.appendChild(share);
      const steal = el('button', 'ghost-btn danger', 'Take it for yourself');
      steal.type = 'button';
      steal.addEventListener('click', () => {
        const text = resolveTeamWish(GAME, SURVIVAL, false);
        SURVIVAL.wishDecided = true;
        pushSurvivalLines([text]);
        renderSurvival();
      });
      wrap.appendChild(steal);
      return;
    }
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
    // The aura and form-tinted hair/eyes reflect whatever they are actually
    // holding in THIS fight (battle.them.form), not their strongest form
    // ever unlocked - a foe who hasn't transformed yet should not render
    // pre-transformed.
    const foeForm = BATTLE.them.form ? getTransformation(BATTLE.them.form) : null;
    foeFace.innerHTML = foeNpc
      ? npcPortrait(foeNpc, { maturityRate: getRace(foeNpc.raceId).maturityRate ?? 1, form: foeForm })
      : '';
    foeFace.hidden = !foeNpc;
  }
  const meFace = $('me-face');
  if (meFace) {
    const myForm = BATTLE.me.form ? getTransformation(BATTLE.me.form) : null;
    meFace.innerHTML = portraitSvg(GAME.character, { form: myForm });
  }
  $('foe-name').textContent = st.them.name;
  const foeLimbState = st.them.armsBroken >= 2 ? 'both arms broken'
    : st.them.armsBroken === 1 ? 'an arm broken' : null;
  $('foe-sub').textContent = [st.them.tier, st.them.form,
    st.them.layerForm ? `${st.them.layerForm} through it` : null,
    st.them.stance, foeLimbState,
    st.them.legBroken ? 'a leg broken' : null].filter(Boolean).join(' - ');
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
  const myLimbState = st.me.armsBroken >= 2 ? 'both arms broken'
    : st.me.armsBroken === 1 ? 'an arm broken' : null;
  $('my-state').textContent = [
    st.me.form, st.me.layerForm ? `${st.me.layerForm} through it` : null, st.me.stance,
    held < 1 ? `holding back (${Math.round(held * 100)}%)` : null,
    myLimbState, st.me.legBroken ? 'a leg broken' : null,
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
  // A lethal win is a decision (spare or finish them) before it is a fact -
  // defer the actual killing to whichever choice the player makes below,
  // rather than aftermath quietly deciding it before they get to choose.
  const deferKillDecision = BATTLE.outcome === 'won' && BATTLE.stakes !== 'spar' && !BATTLE.noKilling && !BATTLE.foeFled;
  const after = battleAftermath(GAME, rng, BATTLE, { deferKillDecision });
  saveRng(GAME, rng);
  if (after.lines.length) pushBattleLines(after.lines, 'big');

  const wrap = $('battle-actions');
  wrap.innerHTML = '';
  $('battle-tabs').innerHTML = '';

  const outcomeLine = BATTLE.byRingOut
    ? (BATTLE.outcome === 'won' ? 'Ring-out. You win.' : 'Ring-out. You lose.')
    : BATTLE.foeFled ? `${BATTLE.them.name} got away.`
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

  // Beating somebody is a decision point, not just a result - but only when
  // there is somebody left in front of you to decide about. A foe who got
  // clean away leaves nothing to spare or finish.
  if (BATTLE.outcome === 'won' && BATTLE.stakes !== 'spar' && !BATTLE.noKilling && !BATTLE.foeFled) {
    // Sparing something genuinely evil is a bigger act of mercy than
    // sparing a nobody; killing something with a real claim to being good
    // costs a lot more than killing a nobody does. Same alignment reading
    // both buttons pull from, opposite in sign.
    const alignment = moralAlignmentOf(GAME, BATTLE);

    const spare = el('button', 'bact');
    spare.type = 'button';
    spare.appendChild(el('span', 'bact-label', 'Let them live'));
    spare.addEventListener('click', () => {
      const spareGain = Math.max(3, Math.min(20, Math.round(8 + alignment * -0.15)));
      GAME.character.karma = Math.min(100, GAME.character.karma + spareGain);
      const lines = ['You leave them breathing. They will remember that, one way or the other.'];
      // Allowing a real fight to end without a death is exactly the moment
      // a spark either does or does not happen - the same check a spar
      // rolls, on somebody who was trying to kill you a minute ago instead
      // of somebody who agreed to trade blows for the afternoon.
      const foeNpcId = (BATTLE.them.ref && BATTLE.them.ref.npcId) || (BATTLE.foeRef && BATTLE.foeRef.npcId) || null;
      const foeNpc = foeNpcId && findNpc(GAME, foeNpcId);
      if (foeNpc) {
        const rng = getRng(GAME);
        const spark = checkRomanceSpark(GAME, rng, foeNpc);
        saveRng(GAME, rng);
        if (spark) lines.push(spark.text);
      }
      pushBattleLines(lines, 'big');
      spare.remove();
      const kill = document.querySelector('.bact.kill');
      if (kill) kill.remove();
    });
    wrap.appendChild(spare);

    const kill = el('button', 'bact kill danger');
    kill.type = 'button';
    kill.appendChild(el('span', 'bact-label', 'Finish them'));
    kill.addEventListener('click', () => {
      const rng = getRng(GAME);
      const karmaDelta = killKarmaDelta(GAME, BATTLE);
      const lines = [
        karmaDelta > 0
          ? 'You finish it. Whatever else that was, it was not a crime.'
          : 'You finish it. Nobody argues with the result.',
        ...finishLethalWin(GAME, rng, BATTLE),
      ];
      saveRng(GAME, rng);
      BATTLE.killed = true;
      GAME.character.karma = Math.max(-100, Math.min(100, GAME.character.karma + karmaDelta));
      pushBattleLines(lines, 'big');
      kill.remove();
      const s2 = document.querySelector('.bact:not(.wide):not(.kill)');
      if (s2) s2.remove();
      renderLootChoice();
    });
    wrap.appendChild(kill);
  }

  // Going through the body is its own decision, offered only once there is
  // actually something to go through and only after the kill is settled -
  // never bundled into "Finish them" itself.
  function renderLootChoice() {
    if (!BATTLE.lootable || !BATTLE.lootable.length) return;
    const loot = el('button', 'bact');
    loot.type = 'button';
    loot.appendChild(el('span', 'bact-label', 'Loot the body'));
    loot.appendChild(el('span', 'bact-hint', 'Take what they were carrying. Not everyone lets that go unnoticed.'));
    const leave = el('button', 'bact');
    leave.type = 'button';
    leave.appendChild(el('span', 'bact-label', 'Leave everything'));
    loot.addEventListener('click', () => {
      const rng = getRng(GAME);
      const lines = BATTLE.lootable.map((npcId) => lootDefeatedNpc(GAME, rng, npcId).text);
      saveRng(GAME, rng);
      BATTLE.lootable = [];
      pushBattleLines(lines, 'big');
      loot.remove();
      leave.remove();
    });
    leave.addEventListener('click', () => {
      pushBattleLines(['You leave it where it fell.'], 'big');
      loot.remove();
      leave.remove();
    });
    wrap.appendChild(loot);
    wrap.appendChild(leave);
  }
}

function closeBattle(after) {
  const summary = BATTLE.foeFled ? `${BATTLE.them.name} broke off and got away from you.` : {
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

  if (!GAME.character.flags.permadeath) {
    const end = el('button', 'ghost-btn', 'Accept it. This is the end.');
    end.type = 'button';
    end.addEventListener('click', () => {
      acceptPermanentDeath(GAME);
      autosave();
      showDeath();
      flash('No wish is ever spent on this life again. It is finished, on your terms.');
    });
    node.appendChild(end);
    node.appendChild(el('p', 'hint-text',
      'This closes the door on this specific life for good - no revival, no Other World hero run. '
      + 'A living child can still be played as afterward; that is a separate choice from this one.'));
  } else {
    node.appendChild(el('p', 'hint-text',
      `${info.name}'s death was accepted as final. ${info.title}. It shaped everyone still close to them.`));
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
    clearSlot(CURRENT_SLOT);
    GAME = null;
    renderTitle();
    showScreen('title');
  });
  node.appendChild(again);

  showScreen('death');
}

// ----------------------------------------------------------------- screens

const SCREEN_MOOD = {
  title: 'calm', create: 'calm', play: 'calm',
  battle: 'battle', survival: 'battle', tourney: 'battle',
  trial: 'tense', hunt: 'tense',
  death: 'tense',
};

function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $('screen-' + name).classList.add('active');
  setMood(SCREEN_MOOD[name] || 'calm');
}

function showPlay() {
  renderHud();
  renderFeed();
  showScreen('play');
}

function autosave() {
  save(GAME, CURRENT_SLOT);
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
  const rng = getRng(GAME);
  GAME.log.push(openingLogEntry(GAME, rng));
  saveRng(GAME, rng);
  autosave();
  showPlay();
  flash(`${GAME.character.name} is born on ${getPlace(GAME.character.placeId).name}.`);
}

function wire() {
  $('btn-begin').addEventListener('click', startGame);
  $('btn-back-title').addEventListener('click', () => {
    renderTitle();
    showScreen('title');
  });
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

const TITLE_FEATURES = [
  'A full simulated life across the Dragon Ball timeline, year by year, or an era you pick yourself',
  'Twelve playable species plus three half-breeds, each with its own stats, ladder and look',
  'Procedural portraits: hairstyles, gear, scars and grooming that actually show up on your character',
  'Turn-based battles, brackets, and an 80-fighter, 8-universe Tournament of Power',
  'Marriage, gifts that land or miss depending on who you give them to, rivalries, and children',
  'Weapons and martial arts, chosen at creation and switchable later, side by side with ki techniques',
  'Death is not the end: train in the Other World, visit Hell, or come back for one more year',
  'A living economy - shop stock rotates by planet, and selling enough starts a trade relationship',
];

const SLOT_LABEL = { auto: 'Slot 1', a: 'Slot 2', b: 'Slot 3', c: 'Slot 4' };

function renderTitle() {
  const list = $('title-features');
  if (list) {
    list.innerHTML = '';
    for (const f of TITLE_FEATURES) list.appendChild(el('li', null, f));
  }

  const savesBox = $('title-saves');
  if (savesBox) {
    savesBox.innerHTML = '';
    for (const s of listSaves()) {
      const row = el('div', 'row');
      const main = el('div', 'row-main');
      if (s.empty) {
        main.appendChild(el('div', 'row-title', SLOT_LABEL[s.slot] || s.slot));
        main.appendChild(el('div', 'row-note', s.corrupt ? 'Unreadable save. Starting fresh here replaces it.' : 'Empty.'));
      } else {
        const race = getRace(s.raceId);
        const when = s.savedAt ? new Date(s.savedAt).toLocaleDateString() : '';
        main.appendChild(el('div', 'row-title', `${SLOT_LABEL[s.slot] || s.slot}: ${s.name}, age ${s.age}`));
        main.appendChild(el('div', 'row-note',
          `${race ? race.short : s.raceId} - ${numberish(s.power)} power - `
          + `${s.afterlife ? 'in the Other World' : s.alive ? 'alive' : 'deceased'}${when ? ` - saved ${when}` : ''}`
          + `${s.generation > 1 ? ` - generation ${s.generation}` : ''}`));
      }
      row.appendChild(main);

      const acts = el('div', 'item-acts');
      if (!s.empty) {
        const cont = el('button', 'mini', 'Continue');
        cont.type = 'button';
        cont.addEventListener('click', () => {
          const loaded = load(s.slot);
          if (!loaded || !loaded.character) { flash('Could not load that save.'); return; }
          CURRENT_SLOT = s.slot;
          GAME = loaded;
          showPlay();
        });
        acts.appendChild(cont);

        const del = el('button', 'mini', 'Delete');
        del.type = 'button';
        del.addEventListener('click', () => {
          if (!confirm(`Delete ${s.corrupt ? 'this save' : s.name + "'s save"}?`)) return;
          clearSlot(s.slot);
          renderTitle();
        });
        acts.appendChild(del);
      } else {
        const start = el('button', 'mini', 'New life');
        start.type = 'button';
        start.addEventListener('click', () => {
          CURRENT_SLOT = s.slot;
          DRAFT = newDraft();
          renderCreation();
          showScreen('create');
        });
        acts.appendChild(start);
      }
      row.appendChild(acts);
      savesBox.appendChild(row);
    }
  }

  const formRefBtn = $('btn-form-reference');
  if (formRefBtn && !formRefBtn.dataset.wired) {
    formRefBtn.dataset.wired = '1';
    formRefBtn.addEventListener('click', openFormReference);
  }

  const ambienceRow = $('opt-ambience');
  if (ambienceRow) {
    ambienceRow.innerHTML = '';
    for (const [on, label] of [[false, 'Off'], [true, 'On']]) {
      const b = el('button', 'opt' + (isAmbienceEnabled() === on ? ' on' : ''), label);
      b.type = 'button';
      b.addEventListener('click', () => {
        setAmbienceEnabled(on);
        try { localStorage.setItem('dbls.ambience', on ? '1' : '0'); } catch (e) { /* best effort */ }
        renderTitle();
      });
      ambienceRow.appendChild(b);
    }
  }
  const ambienceNote = $('ambience-note');
  if (ambienceNote) {
    ambienceNote.textContent = 'Three generated tones that shift with the moment - calm, tense, or mid-fight. '
      + 'Not a soundtrack, just a mood, and silent until you turn it on.';
  }
}

async function boot() {
  DRAFT = newDraft();
  renderCreation();
  wire();

  try {
    if (localStorage.getItem('dbls.ambience') === '1') setAmbienceEnabled(true);
  } catch (e) { /* best effort */ }

  renderTitle();
  showScreen('title');

  await initSampling();
  const note = $('create-ai-note');
  note.textContent = backendName() === 'sample'
    ? 'Claude is connected here. Events written live by the model appear alongside the generated ones.'
    : 'Runs entirely on its own generator. Add an Anthropic API key under Life to have Claude write events too.';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
