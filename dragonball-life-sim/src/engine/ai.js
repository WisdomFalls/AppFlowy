// The AI layer.
//
// Two backends, both optional: the Artifact `sample` capability (the viewer's
// own Claude, no key needed) and the Anthropic API with a key the player
// supplies. With neither, the game is fully playable on its procedural
// generator - the AI adds new events on top, it is never load-bearing.
//
// The model writes fiction and proposes consequences. `aieffects.js` clamps
// everything it proposes, so a bad or hostile response can degrade the prose
// but cannot break the simulation.

import { buildAiEvent, sanitiseText } from './aieffects.js';
import { aiContext, livingNpcs, currentYear } from './state.js';
import { recallSummary, recentBeats, activeThreads } from './memory.js';
import { relationLabel, bondScore } from './npc.js';
import { ladderStatus } from './progression.js';
import { getRace } from '../data/races.js';
import { getPlace } from '../data/places.js';

export const MODEL = 'claude-opus-5';
const API_URL = 'https://api.anthropic.com/v1/messages';
const KEY_STORAGE = 'dbls.apiKey';
const CONFIG_STORAGE = 'dbls.aiConfig';

/**
 * Where the prose comes from. The default is the viewer's own Claude through
 * the artifact runtime; `anthropic` uses a key the player supplies; `custom`
 * points at any endpoint that speaks either the Anthropic Messages shape or
 * the OpenAI chat-completions shape, so a self-hosted or third-party model can
 * drive the game instead.
 */
export const DEFAULT_CONFIG = {
  provider: 'auto',        // auto | anthropic | custom | off
  baseUrl: '',
  model: '',
  key: '',
  format: 'openai',        // openai | anthropic
  headerName: 'Authorization',
  headerPrefix: 'Bearer ',
};

export function getAiConfig() {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_CONFIG };
    const raw = localStorage.getItem(CONFIG_STORAGE);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

export function setAiConfig(patch) {
  const next = { ...getAiConfig(), ...patch };
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(CONFIG_STORAGE, JSON.stringify(next));
  } catch (e) { /* ignore */ }
  return next;
}

let sampleFn = null;
let samplePromise = null;

/** Resolve the artifact sampling capability once, if this view has it. */
export async function initSampling() {
  if (samplePromise) return samplePromise;
  samplePromise = (async () => {
    try {
      if (typeof window === 'undefined' || !window.claude || typeof window.claude.use !== 'function') return null;
      sampleFn = await window.claude.use('sample');
      return sampleFn;
    } catch (e) {
      return null;
    }
  })();
  return samplePromise;
}

export function getApiKey() {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem(KEY_STORAGE)) || '';
  } catch (e) {
    return '';
  }
}

export function setApiKey(key) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch (e) { /* ignore */ }
}

export function backendName() {
  const cfg = getAiConfig();
  if (cfg.provider === 'off') return 'none';
  if (cfg.provider === 'custom' && cfg.baseUrl && cfg.model) return 'custom';
  if (cfg.provider === 'anthropic' && getApiKey()) return 'api';
  if (cfg.provider === 'auto') {
    if (sampleFn) return 'sample';
    if (getApiKey()) return 'api';
    if (cfg.baseUrl && cfg.model) return 'custom';
  }
  return 'none';
}

export function backendLabel() {
  const name = backendName();
  const cfg = getAiConfig();
  switch (name) {
    case 'sample': return 'Claude, through this page';
    case 'api': return 'Claude, on your own API key';
    case 'custom': return `${cfg.model || 'custom model'} at ${shortHost(cfg.baseUrl)}`;
    default: return 'Not connected';
  }
}

function shortHost(url) {
  try { return new URL(url).host; } catch (e) { return url || 'nowhere'; }
}

export function aiAvailable() {
  return backendName() !== 'none';
}

// ------------------------------------------------------------------ prompts

const STYLE = `VOICE: dry, concrete, present tense, second person ("you"). Short sentences.
Specific physical detail over adjectives. No purple prose, no exclamation marks,
no rhetorical questions, no em-dashes. Never explain the stakes; show them.
Dragon Ball is funny as often as it is serious - a world-ending threat and a
man worrying about his lunch belong in the same paragraph.`;

const LORE = `LORE RULES: power levels are exponential and everyone knows roughly who
outclasses whom. Ki is a physical resource. Death is a place, not an ending:
the Other World, King Yemma's desk, Snake Way. Dragon Balls grant one wish and
then scatter for a year. Saiyans grow stronger from nearly dying. Nobody has
guns that matter. Never contradict the memory section below, and never invent a
new transformation, a Dragon Ball wish being granted, or the death of a named
person the player knows - those are the engine's to decide.`;

function relationshipLines(state) {
  return livingNpcs(state)
    .filter((n) => n.closeness > 25 || ['rival', 'nemesis', 'enemy', 'spouse', 'child', 'mentor'].includes(n.relation))
    .sort((a, b) => bondScore(b) - bondScore(a))
    .slice(0, 7)
    .map((n) => `- ${n.name}, ${relationLabel(n).toLowerCase()}${n.isCanon ? ' (from the series)' : ''}, bond ${bondScore(n)}${n.tension > 50 ? ', a lot of bad blood' : ''}`)
    .join('\n');
}

export function buildEventPrompt(state, opts = {}) {
  const ctx = aiContext(state);
  const c = state.character;
  const race = getRace(c.raceId);
  const place = getPlace(c.placeId);
  const memory = recallSummary(state.memory, 9);
  const avoid = recentBeats(state.memory, 8);
  const threads = activeThreads(state.memory)
    .slice(0, 4)
    .map((t) => `- ${t.title} (running since age ${t.openedYear}, stage ${t.stage})`);
  const forms = ladderStatus(state).filter((f) => f.owned).map((f) => f.name);

  return `You write single events for a Dragon Ball life simulator. Produce ONE event that
could plausibly happen to this character in this year of their life.

${STYLE}

${LORE}

CHARACTER
Name: ${ctx.name}, ${ctx.race}, age ${ctx.age}, Age ${ctx.year} (${ctx.era}).
Where: ${place.name}. ${place.desc}
Power: ${ctx.tier} (${ctx.power.toLocaleString('en-US')}). Health ${ctx.health}/100, happiness ${ctx.happiness}/100.
Karma ${ctx.karma} (negative is cruel), fame ${ctx.fame}/100, ${ctx.zeni.toLocaleString('en-US')} Zeni.
Work: ${ctx.career}.
Species notes: ${race.notes}
Transformations mastered: ${forms.length ? forms.join(', ') : 'none'}
Techniques: ${ctx.techniques.length ? ctx.techniques.join(', ') : 'none worth naming'}
Temperament: ${ctx.traits.join(', ') || 'unformed'}

PEOPLE IN THEIR LIFE
${relationshipLines(state) || '- nobody close to them right now'}

WHAT HAS ALREADY HAPPENED (do not contradict, feel free to call back to)
${memory.length ? memory.map((m) => '- ' + m).join('\n') : '- nothing much yet'}

${threads.length ? `RUNNING STORYLINES (advancing one of these is good)\n${threads.join('\n')}\n` : ''}
DO NOT REPEAT THESE RECENT EVENTS
${avoid.length ? avoid.map((a) => '- ' + a).join('\n') : '- (none yet)'}
${opts.nudge ? `\nTHIS EVENT SHOULD: ${opts.nudge}\n` : ''}
Write something specific to THIS character - their species, their power level relative
to the era, the people listed, the place they are standing in. A famine of ideas looks
like "a stranger challenges you to a fight". Do better than that.

Reply with ONLY a JSON object:
{
  "title": "3-6 words, no punctuation at the end",
  "text": "40-90 words setting up a situation that needs a decision",
  "choices": [
    {
      "label": "an action, 2-7 words",
      "hint": "optional short warning or promise",
      "danger": false,
      "outcome": "30-70 words of what happens. Commit to a result.",
      "effects": {"health": 0, "happiness": 0, "ki": 0, "karma": 0, "fame": 0, "zeni": 0, "power_pct": 0, "stats": {"strength": 0}, "fact": "one clause worth remembering later", "meet": "Name of a new person, only if one genuinely appears"}
    }
  ]
}
Rules for effects: 2 to 4 choices, each with meaningfully different consequences.
health/happiness -45..45, karma -25..25, fame -12..18, power_pct -8..30 (percent change
to power level; only large for genuinely transformative moments), stats keys are
strength, speed, technique, kiControl, durability, intellect, charisma, discipline,
each -7..7. Omit any effect that does not apply. At least one choice should cost
something real.`;
}

export function buildNarrationPrompt(state, event, outcomeText) {
  const ctx = aiContext(state);
  return `Rewrite a beat from a Dragon Ball life simulator in fresh prose. Keep every fact
and every consequence exactly as given; change only the words.

${STYLE}

WHO: ${ctx.name}, ${ctx.race}, age ${ctx.age}, ${ctx.tier}, at ${ctx.location} in Age ${ctx.year}.
WHAT HAPPENED: ${event.title}. ${event.text}
THE RESULT: ${outcomeText}

Reply with ONLY the rewritten result, 30 to 70 words. No preamble, no quotes, no title.`;
}

// ----------------------------------------------------------------- backends

async function callSampleJson(prompt, opts = {}) {
  const fn = sampleFn || (await initSampling());
  if (!fn) throw Object.assign(new Error('sampling unavailable'), { code: 'not_granted' });
  return fn.json(prompt, {
    modelTier: opts.tier || 'default',
    cache: false,
    signal: opts.signal,
  });
}

async function callSampleText(prompt, opts = {}) {
  const fn = sampleFn || (await initSampling());
  if (!fn) throw Object.assign(new Error('sampling unavailable'), { code: 'not_granted' });
  const { text } = await fn(prompt, {
    modelTier: opts.tier || 'quick',
    cache: false,
    signal: opts.signal,
  });
  return text;
}

async function callApi(prompt, opts = {}) {
  const key = getApiKey();
  if (!key) throw Object.assign(new Error('no API key'), { code: 'not_granted' });
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      // Required for calling the API directly from a browser.
      'anthropic-dangerous-direct-browser-access': 'true',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    signal: opts.signal,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low' },
      fallbacks: 'default',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw Object.assign(new Error(`API ${res.status}: ${detail.slice(0, 200)}`), {
      code: res.status === 429 ? 'rate_limited' : res.status === 401 ? 'not_granted' : 'upstream_error',
    });
  }
  const body = await res.json();
  if (body.stop_reason === 'refusal') {
    throw Object.assign(new Error('declined'), { code: 'refused' });
  }
  const block = (body.content || []).find((b) => b.type === 'text');
  return block ? block.text : '';
}

/**
 * Any endpoint the player points us at. Two request shapes are supported
 * because between them they cover almost everything that serves a model.
 */
async function callCustom(prompt, opts = {}) {
  const cfg = getAiConfig();
  if (!cfg.baseUrl || !cfg.model) throw Object.assign(new Error('no endpoint configured'), { code: 'not_granted' });

  const headers = { 'content-type': 'application/json' };
  if (cfg.key) headers[cfg.headerName || 'Authorization'] = (cfg.headerPrefix || '') + cfg.key;

  let body;
  if (cfg.format === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
    body = { model: cfg.model, max_tokens: 2000, messages: [{ role: 'user', content: prompt }] };
  } else {
    body = {
      model: cfg.model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    };
  }

  const res = await fetch(cfg.baseUrl, {
    method: 'POST', headers, signal: opts.signal, body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw Object.assign(new Error(`${res.status}: ${detail.slice(0, 200)}`), {
      code: res.status === 429 ? 'rate_limited' : res.status === 401 ? 'not_granted' : 'upstream_error',
    });
  }
  const data = await res.json();
  // Read both reply shapes without assuming which one came back.
  if (Array.isArray(data.content)) {
    const block = data.content.find((b) => b.type === 'text');
    return block ? block.text : '';
  }
  if (Array.isArray(data.choices) && data.choices.length) {
    const choice = data.choices[0];
    return (choice.message && choice.message.content) || choice.text || '';
  }
  if (typeof data.response === 'string') return data.response;
  if (typeof data.output === 'string') return data.output;
  return '';
}

export async function testAiEndpoint() {
  try {
    const text = await callCustom('Reply with exactly the word: ready');
    return { ok: true, text: (text || '').trim().slice(0, 80) };
  } catch (err) {
    return { ok: false, code: err.code || 'upstream_error', message: String(err && err.message).slice(0, 160) };
  }
}

function parseJsonLoosely(text) {
  if (!text) return null;
  const trimmed = String(text).trim();
  try { return JSON.parse(trimmed); } catch (e) { /* keep trying */ }
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  if (fence) {
    try { return JSON.parse(fence[1]); } catch (e) { /* keep trying */ }
  }
  const start = trimmed.search(/[[{]/);
  const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
  if (start >= 0 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch (e) { /* give up */ }
  }
  return null;
}

// -------------------------------------------------------------- public API

let aiEventCounter = 0;

/**
 * Ask the model for a completely new event. Resolves to an event object, or
 * null when sampling is unavailable or the response is unusable - the caller
 * then falls back to the procedural generator.
 */
export async function improviseEvent(state, opts = {}) {
  const backend = backendName();
  if (backend === 'none') return null;
  const prompt = buildEventPrompt(state, opts);
  try {
    let raw;
    if (backend === 'sample') raw = await callSampleJson(prompt, opts);
    else if (backend === 'custom') raw = parseJsonLoosely(await callCustom(prompt, opts));
    else raw = parseJsonLoosely(await callApi(prompt, opts));
    const event = buildAiEvent(raw, `ai_${currentYear(state)}_${++aiEventCounter}`);
    if (event) state.aiCalls = (state.aiCalls || 0) + 1;
    return event;
  } catch (err) {
    return { error: true, code: err && err.code ? err.code : 'upstream_error', message: String(err && err.message) };
  }
}

/** Rewrite one resolved beat in fresh prose. Falls back to the original. */
export async function narrateOutcome(state, event, outcomeText, opts = {}) {
  const backend = backendName();
  if (backend === 'none') return outcomeText;
  const prompt = buildNarrationPrompt(state, event, outcomeText);
  try {
    const text = backend === 'sample' ? await callSampleText(prompt, opts)
      : backend === 'custom' ? await callCustom(prompt, opts)
        : await callApi(prompt, opts);
    const clean = sanitiseText(text, 700);
    return clean.length > 20 ? clean : outcomeText;
  } catch (err) {
    return outcomeText;
  }
}

/** Human-readable copy for each failure code the UI may see. */
export function errorCopy(code) {
  switch (code) {
    case 'not_granted':
    case 'sampling_disabled':
    case 'not_declared':
      return 'AI events are not available here. The game generates its own instead.';
    case 'rate_limited':
      return 'Too many AI requests just now. Try again in a minute.';
    case 'refused':
      return 'The model declined that one. Carrying on without it.';
    case 'invalid_json':
      return 'The AI reply came back malformed. Using a generated event instead.';
    case 'cancelled':
      return '';
    default:
      return 'The AI could not be reached. Using a generated event instead.';
  }
}


// ------------------------------------------------------------ dialogue

/**
 * The player writes their own line. The model scores the impression it makes
 * on this specific person and writes their reply in character.
 */
export async function judgeReply(state, npc, playerLine, opts = {}) {
  const backend = backendName();
  const ctx = aiContext(state);
  const prompt = `A Dragon Ball life simulator. Judge one line of dialogue and answer in character.

${STYLE}

WHO IS SPEAKING: ${ctx.name}, ${ctx.race}, age ${ctx.age}, ${ctx.tier}, karma ${ctx.karma}.
WHO THEY ARE SPEAKING TO: ${npc.name}, a ${npc.raceId}, ${npc.age}, currently ${npc.mood || 'hard to read'}.
Their standing with each other: closeness ${npc.closeness}, respect ${npc.respect}, tension ${npc.tension}${npc.romance ? `, romance ${npc.romance}` : ''}.
What ${npc.name} wants out of life: ${npc.goal || 'unclear'}.
${npc.personality ? `Character notes: ${npc.personality}` : ''}

WHAT WAS SAID: "${playerLine.slice(0, 400)}"

Judge it as ${npc.name} would. Flattery on somebody proud lands differently from
flattery on somebody grieving. Reply with ONLY a JSON object:
{"impression": -40 to 40, "reply": "what they say back, 10-45 words, in their voice",
 "closeness": -12 to 12, "respect": -12 to 12, "tension": -12 to 12, "romance": -8 to 12}`;

  if (backend === 'none') return null;
  try {
    let raw;
    if (backend === 'sample') raw = await callSampleJson(prompt, opts);
    else if (backend === 'custom') raw = parseJsonLoosely(await callCustom(prompt, opts));
    else raw = parseJsonLoosely(await callApi(prompt, opts));
    if (!raw || typeof raw !== 'object') return null;
    return {
      impression: clampNum(raw.impression, -40, 40),
      reply: sanitiseText(raw.reply, 320),
      closeness: clampNum(raw.closeness, -12, 12),
      respect: clampNum(raw.respect, -12, 12),
      tension: clampNum(raw.tension, -12, 12),
      romance: clampNum(raw.romance, -8, 12),
    };
  } catch (err) {
    return { error: true, code: err && err.code ? err.code : 'upstream_error' };
  }
}

function clampNum(v, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
