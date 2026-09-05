// UI controller. Vanilla DOM, one render pass per change - the simulation is
// the interesting part, so the interface stays boring on purpose.

import {
  createGame, defaultCreation, characterSummary, currentYear, livingNpcs,
  startYear, choose, currentEvent, enterAfterlife, epitaph, beginLegacy,
  insertEvent, renarrateLast, ladderStatus, nearbyForms,
  availableActions, runAction, actionOptions, Rng,
  initSampling, improviseEvent, narrateOutcome, backendName, getApiKey, setApiKey, errorCopy,
  eventsRemaining,
  save, load, listSaves, clearSlot, exportString, importString,
} from '../game.js';
import { RACES, getRace, UPBRINGINGS, TEMPERAMENTS, BODY_TYPES } from '../data/races.js';
import { PLACES, getPlace } from '../data/places.js';
import { APPEARANCE } from '../engine/state.js';
import { eraName, worldPowerBaseline } from '../data/timeline.js';
import { generateFullName } from '../data/names.js';
import { BRANCHES, TECH_BY_ID } from '../data/techniques.js';
import { STAT_KEYS, STAT_LABELS, combatPower, powerTier } from '../engine/stats.js';
import { relationLabel, bondScore } from '../engine/npc.js';
import { numberish, zeni } from '../engine/text.js';
import { getRng, saveRng } from '../engine/state.js';

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

function renderCreation() {
  const race = getRace(DRAFT.raceId);

  optionRow($('opt-race'), RACES.map((r) => ({ id: r.id, name: r.short })), DRAFT.raceId, (id) => {
    DRAFT.raceId = id;
    const r = getRace(id);
    DRAFT.hair = r.hairColours[0] || APPEARANCE.hair[0];
    DRAFT.placeId = r.homeworlds[0];
    if (!DRAFT.nameTouched) DRAFT.name = generateFullName(new Rng(Date.now()), id);
    renderCreation();
  });

  const card = $('race-card');
  card.innerHTML = '';
  card.appendChild(el('div', 'race-name', race.name));
  card.appendChild(el('div', 'race-blurb', race.blurb));
  card.appendChild(el('div', 'race-note', race.notes));

  optionRow($('opt-upbringing'), UPBRINGINGS, DRAFT.upbringingId, (id) => { DRAFT.upbringingId = id; renderCreation(); });
  const up = UPBRINGINGS.find((u) => u.id === DRAFT.upbringingId);
  $('upbringing-note').textContent = up ? up.blurb : '';

  optionRow($('opt-temperament'), TEMPERAMENTS, DRAFT.temperamentId, (id) => { DRAFT.temperamentId = id; renderCreation(); });
  optionRow($('opt-body'), BODY_TYPES, DRAFT.bodyId, (id) => { DRAFT.bodyId = id; renderCreation(); });

  $('in-name').value = DRAFT.name;

  const hairOptions = race.hairColours.length ? race.hairColours : APPEARANCE.hair;
  fillSelect($('in-hair'), hairOptions.map((h) => ({ value: h, label: 'Hair: ' + h })), DRAFT.hair);
  fillSelect($('in-eyes'), APPEARANCE.eyes.map((e2) => ({ value: e2, label: 'Eyes: ' + e2 })), DRAFT.eyes);
  fillSelect($('in-marking'), APPEARANCE.marking.map((m) => ({ value: m, label: 'Marking: ' + m })), DRAFT.marking);
  fillSelect($('in-sex'), [
    { value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'nonbinary', label: 'Non-binary' },
  ], DRAFT.sex);

  fillSelect($('in-era'), ERAS.map((e2) => ({ value: String(e2.year), label: e2.label })), String(DRAFT.birthYear));
  $('era-note').textContent = `${eraName(DRAFT.birthYear)}. A serious fighter of this era is around ${numberish(worldPowerBaseline(DRAFT.birthYear))}.`;

  const homes = race.homeworlds.map((h) => getPlace(h)).filter(Boolean);
  const homeList = (homes.length ? homes : PLACES.slice(0, 6));
  fillSelect($('in-home'), homeList.map((p) => ({ value: p.id, label: p.name })), DRAFT.placeId);
}

function readCreationInputs() {
  DRAFT.name = $('in-name').value.trim() || DRAFT.name;
  DRAFT.hair = $('in-hair').value;
  DRAFT.eyes = $('in-eyes').value;
  DRAFT.marking = $('in-marking').value;
  DRAFT.sex = $('in-sex').value;
  DRAFT.birthYear = parseInt($('in-era').value, 10);
  DRAFT.placeId = $('in-home').value;
}

function newDraft() {
  const rng = new Rng(Date.now() ^ Math.floor(Math.random() * 1e9));
  const d = defaultCreation(rng);
  d.birthYear = 737;
  d.nameTouched = false;
  return d;
}

// -------------------------------------------------------------------- HUD

function renderHud() {
  const s = characterSummary(GAME);
  const c = GAME.character;
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
  add('Zeni', zeni(c.zeni).replace(' Zeni', ''));
  add('Fame', Math.round(c.fame));
  add('Karma', Math.round(c.karma), c.karma > 20 ? 'good' : c.karma < -20 ? 'bad' : '');
  if (c.career) add('Job', c.career.title);
  if (c.senzu) add('Senzu', c.senzu, 'good');
  if (GAME.world.dragonBalls) add('Dragon Balls', GAME.world.dragonBalls + '/7', 'gold');
  if (c.transformations.length) add('Forms', c.transformations.length, 'gold');
  if (GAME.legacy) add('Generation', GAME.legacy.generation);
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
  const next = choose(GAME, choiceId);
  renderHud();
  renderFeed();
  maybeNarrate(event);

  if (!GAME.character.alive) {
    closeSheet();
    showDeath();
    return;
  }
  if (next) {
    showEvent(next);
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
  const { body } = sheetShell('Activities', `Age ${GAME.character.age}`);
  const groups = { body: 'Body', mind: 'Mind', power: 'Power', social: 'People', world: 'World' };
  const actions = availableActions(GAME);

  for (const [key, label] of Object.entries(groups)) {
    const inGroup = actions.filter((a) => a.cat === key);
    if (!inGroup.length) continue;
    body.appendChild(el('div', 'group-label', label));
    for (const action of inGroup) {
      const b = el('button', 'row' + (action.danger ? ' danger' : ''));
      b.type = 'button';
      const main = el('div', 'row-main');
      main.appendChild(el('div', 'row-title', action.name));
      main.appendChild(el('div', 'row-note', action.desc));
      b.appendChild(main);
      b.appendChild(el('div', 'row-value', action.cost || ''));
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

  const entry = { kind: 'event', title: null, text: result.text };
  if (result.gained) entry.text += ` Power level up ${numberish(result.gained)}.`;
  if (result.unlocked) entry.text += ` ${result.unlocked} unlocked.`;

  if (!GAME.log.length || GAME.log[GAME.log.length - 1].age !== GAME.character.age) {
    GAME.log.push({ year: currentYear(GAME), age: GAME.character.age, entries: [] });
  }
  GAME.log[GAME.log.length - 1].entries.push(entry);

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
    ['Everyone else', (n) => !['parent', 'sibling', 'child', 'spouse', 'friend', 'bestfriend', 'lover', 'mentor', 'student', 'rival', 'nemesis', 'enemy'].includes(n.relation)],
  ];

  for (const [label, filter] of groups) {
    const set = people.filter(filter);
    if (!set.length) continue;
    body.appendChild(el('div', 'group-label', label));
    for (const npc of set.slice(0, 40)) {
      const row = el('div', 'row');
      const main = el('div', 'row-main');
      const title = el('div', 'row-title', npc.name + (npc.isCanon ? ' ★' : ''));
      main.appendChild(title);
      main.appendChild(el('div', 'row-note',
        `${relationLabel(npc)} - ${getRace(npc.raceId).short}, ${npc.age} - ${numberish(npc.power)}`));
      row.appendChild(main);

      const bond = el('div', 'bond');
      const track = el('div', 'bond-track');
      const fill = el('div', 'bond-fill');
      fill.style.width = Math.max(0, bondScore(npc)) + '%';
      track.appendChild(fill);
      bond.appendChild(track);
      row.appendChild(bond);
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
    main.appendChild(el('div', 'row-note', form.owned ? form.desc
      : form.missing.length ? 'Needs ' + form.missing.slice(0, 3).join(', ') : 'Ready to attempt'));
    row.appendChild(main);
    row.appendChild(el('div', 'row-value', 'x' + numberish(form.mult)));
    body.appendChild(row);
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

  if (backendName() !== 'sample') {
    const keyField = el('div', 'field');
    keyField.style.marginTop = '10px';
    const input = el('input', 'text-input');
    input.type = 'password';
    input.placeholder = 'Anthropic API key (optional)';
    input.value = getApiKey();
    input.addEventListener('change', () => {
      setApiKey(input.value.trim());
      flash(input.value.trim() ? 'Key saved in this browser only.' : 'Key removed.');
      panelRecords();
    });
    keyField.appendChild(input);
    keyField.appendChild(el('p', 'hint-text',
      'Stored in this browser and sent only to Anthropic. Leave blank to play on the built-in generator.'));
    body.appendChild(keyField);
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
  $('btn-age').textContent = GAME.character.inAfterlife ? 'Another year dead' : 'Age up';
  $('btn-age').classList.toggle('dead', !!GAME.character.inAfterlife);
}

function autosave() {
  save(GAME, 'auto');
}

// -------------------------------------------------------------------- boot

function startGame() {
  readCreationInputs();
  const seed = $('in-seed').value.trim();
  GAME = createGame({
    name: DRAFT.name,
    raceId: DRAFT.raceId,
    sex: DRAFT.sex,
    upbringingId: DRAFT.upbringingId,
    temperamentId: DRAFT.temperamentId,
    bodyId: DRAFT.bodyId,
    hair: DRAFT.hair,
    eyes: DRAFT.eyes,
    marking: DRAFT.marking,
    birthYear: DRAFT.birthYear,
    placeId: DRAFT.placeId,
  }, seed || undefined);
  autosave();
  showPlay();
  flash(`${GAME.character.name} is born on ${getPlace(GAME.character.placeId).name}.`);
}

function wire() {
  $('btn-begin').addEventListener('click', startGame);
  $('btn-random-all').addEventListener('click', () => { DRAFT = newDraft(); renderCreation(); });
  $('btn-reroll-name').addEventListener('click', () => {
    DRAFT.name = generateFullName(new Rng(Date.now() ^ Math.floor(Math.random() * 1e9)), DRAFT.raceId);
    DRAFT.nameTouched = false;
    $('in-name').value = DRAFT.name;
  });
  $('in-name').addEventListener('input', () => { DRAFT.nameTouched = true; });
  $('in-era').addEventListener('change', () => { readCreationInputs(); renderCreation(); });

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
