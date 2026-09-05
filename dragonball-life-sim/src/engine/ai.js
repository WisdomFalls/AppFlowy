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
  if (sampleFn) return 'sample';
  if (getApiKey()) return 'api';
  return 'none';
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
    if (backend === 'sample') {
      raw = await callSampleJson(prompt, opts);
    } else {
      raw = parseJsonLoosely(await callApi(prompt, opts));
    }
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
    const text = backend === 'sample'
      ? await callSampleText(prompt, opts)
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
