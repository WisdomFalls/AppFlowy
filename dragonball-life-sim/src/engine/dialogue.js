// Saying your own words to somebody. With a model connected, it reads the line
// and answers in character. Without one, a local reader scores tone against
// what this particular person values - cruder, but it still notices the
// difference between flattering a proud fighter and flattering a grieving one.

import { clamp } from './rng.js';
import { bondScore } from './npc.js';

const WARM = ['thank', 'sorry', 'please', 'friend', 'proud of you', 'trust', 'help', 'stay', 'love',
  'miss you', 'together', 'safe', 'promise', 'forgive', 'welcome', 'glad'];
const HARD = ['weak', 'pathetic', 'useless', 'hate', 'kill', 'shut up', 'coward', 'worthless',
  'idiot', 'trash', 'nothing', 'die'];
const PROUD_HOOKS = ['strongest', 'strength', 'beat', 'challenge', 'fight me', 'prove', 'worthy', 'rival'];
const GRIEF_HOOKS = ['sorry for your loss', 'i miss', 'they would', 'remember', 'grieve', 'gone'];

function count(text, list) {
  const lower = text.toLowerCase();
  return list.reduce((n, word) => (lower.includes(word) ? n + 1 : n), 0);
}

/**
 * Local fallback scoring. Returns the same shape the model does so the caller
 * does not care which one answered.
 */
export function scoreReplyLocally(text, npc, character) {
  const trimmed = (text || '').trim();
  const words = trimmed.split(/\s+/).filter(Boolean).length;

  const warm = count(trimmed, WARM);
  const hard = count(trimmed, HARD);

  let impression = 0;
  if (words < 2) impression -= 12;
  else if (words <= 30 && !hard) impression += 6;
  else if (words > 70) impression -= 6;
  impression += warm * 6 - hard * 16;

  // What lands depends on who they are.
  const tags = npc.tags || [];
  if (tags.includes('proud') || npc.mood === 'spoiling for a fight') {
    impression += count(trimmed, PROUD_HOOKS) * 7;
    impression -= warm * 2;
  }
  if (npc.mood === 'grieving') {
    impression += count(trimmed, GRIEF_HOOKS) * 9;
    impression -= count(trimmed, PROUD_HOOKS) * 5;
  }
  if (tags.includes('honest') && /\b(lie|lying|pretend)\b/i.test(trimmed)) impression -= 8;
  if (npc.name && trimmed.toLowerCase().includes(npc.name.toLowerCase())) impression += 5;

  impression += Math.round((character.stats.charisma - 50) / 8);
  impression = clamp(Math.round(impression), -40, 40);

  const sign = Math.sign(impression);
  return {
    impression,
    reply: replyFor(npc, impression),
    closeness: clamp(Math.round(impression * 0.3), -12, 12),
    respect: clamp(Math.round(impression * 0.22), -12, 12),
    tension: clamp(Math.round(-impression * 0.2), -12, 12),
    romance: impression > 22 && (npc.romance || 0) > 0 ? Math.min(8, Math.round(impression / 6)) : 0,
    local: true,
    sign,
  };
}

function replyFor(npc, impression) {
  const name = npc.name || 'They';
  if (impression >= 28) return `${name} does not answer straight away. When they do, it is warmer than you expected.`;
  if (impression >= 12) return `${name} takes it well.`;
  if (impression >= -6) return `${name} makes a noise that could mean anything.`;
  if (impression >= -22) return `${name} looks at you for a second too long and lets it go.`;
  return `${name} does not let that one pass.`;
}

/** Apply a judged reply to the relationship. */
export function applyReply(npc, judged) {
  npc.closeness = clamp(npc.closeness + (judged.closeness || 0), 0, 100);
  npc.respect = clamp(npc.respect + (judged.respect || 0), 0, 100);
  npc.tension = clamp(npc.tension + (judged.tension || 0), 0, 100);
  npc.romance = clamp((npc.romance || 0) + (judged.romance || 0), 0, 100);
  npc.trust = clamp((npc.trust ?? 30) + Math.round((judged.impression || 0) * 0.15), 0, 100);
  npc.history = npc.history || [];
  return bondScore(npc);
}

export function impressionLabel(impression) {
  if (impression >= 28) return 'That landed well.';
  if (impression >= 12) return 'They took it well enough.';
  if (impression >= -6) return 'It did not move them either way.';
  if (impression >= -22) return 'That did not go down well.';
  return 'That was a mistake.';
}
