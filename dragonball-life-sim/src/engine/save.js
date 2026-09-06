// Saves. State is plain data by construction - templates are looked up by id,
// never stored - so a save is just JSON.

import { SAVE_VERSION } from './state.js';

const KEY_PREFIX = 'dbls.save.';
const SLOTS = ['auto', 'a', 'b', 'c'];

function storage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__dbls_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch (e) {
    return null;
  }
}

export function serialise(state) {
  return JSON.stringify({ v: SAVE_VERSION, savedAt: Date.now(), state });
}

export function deserialise(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  const state = parsed.state || parsed;
  return migrate(state, parsed.v ?? state.version ?? 1);
}

function migrate(state, from) {
  // Older saves predate fields added later; fill them rather than reject.
  if (!state.stats) state.stats = { fights: 0, wins: 0, losses: 0, kills: 0, deaths: 0, yearsPlayed: 0, techniquesLearned: 0 };
  if (!state.world.wishesUsed) state.world.wishesUsed = [];
  if (!state.world.divergences) state.world.divergences = [];
  if (!state.memory.threads) state.memory.threads = [];
  if (!state.memory.beatUse) state.memory.beatUse = {};
  if (!state.character.extraPerks) state.character.extraPerks = [];
  if (state.character.yearsInAfterlife === undefined) state.character.yearsInAfterlife = 0;
  if (state.character.senzu === undefined) state.character.senzu = 0;
  // Old saves carry a slot budget that no longer exists.
  delete state.character.slotsMax;
  delete state.character.slotsLeft;
  if (!state.character.yearUse) state.character.yearUse = {};
  if (!state.character.yearUse) state.character.yearUse = {};
  for (const npc of Object.values(state.npcs || {})) {
    if (npc.trust === undefined) npc.trust = 30;
    if (npc.knowledge === undefined) npc.knowledge = 1;
  }
  state.version = SAVE_VERSION;
  return state;
}

export function save(state, slot = 'auto') {
  const store = storage();
  if (!store) return { ok: false, reason: 'unavailable' };
  try {
    store.setItem(KEY_PREFIX + slot, serialise(state));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e && e.message) };
  }
}

export function load(slot = 'auto') {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(KEY_PREFIX + slot);
    if (!raw) return null;
    return deserialise(raw);
  } catch (e) {
    return null;
  }
}

export function listSaves() {
  const store = storage();
  if (!store) return [];
  return SLOTS.map((slot) => {
    try {
      const raw = store.getItem(KEY_PREFIX + slot);
      if (!raw) return { slot, empty: true };
      const parsed = JSON.parse(raw);
      const c = parsed.state.character;
      return {
        slot, empty: false,
        name: c.name, age: c.age, raceId: c.raceId,
        power: c.power, savedAt: parsed.savedAt,
        alive: c.alive, afterlife: c.inAfterlife,
        generation: parsed.state.legacy ? parsed.state.legacy.generation : 1,
      };
    } catch (e) {
      return { slot, empty: true, corrupt: true };
    }
  });
}

export function clearSlot(slot) {
  const store = storage();
  if (!store) return;
  try { store.removeItem(KEY_PREFIX + slot); } catch (e) { /* ignore */ }
}

/** A copy-pasteable save string, for moving a life between devices. */
export function exportString(state) {
  const json = serialise(state);
  if (typeof btoa === 'function') {
    try {
      const bytes = new TextEncoder().encode(json);
      let bin = '';
      for (const b of bytes) bin += String.fromCharCode(b);
      return btoa(bin);
    } catch (e) { /* fall through */ }
  }
  return json;
}

export function importString(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{')) return deserialise(trimmed);
  try {
    const bin = atob(trimmed);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return deserialise(new TextDecoder().decode(bytes));
  } catch (e) {
    return null;
  }
}
