// Reaching somebody who is not on this world. Two related things live here:
// a signature lock for Instant Transmission (canonically imprecise even for
// Goku - this is the mortal, "aim and hope" version; Kai Kai belongs to a
// god and is exempted below) and an on-demand call across space, for a
// player who does not want to wait for the random long_distance event to
// bring word from somebody.

import { clamp } from './rng.js';
import { livingNpcs } from './state.js';
import { getPlace } from '../data/places.js';

/** Living NPCs who are not standing on the same planet as the player right now. */
export function offWorldContacts(state) {
  const here = getPlace(state.character.placeId).planet;
  return livingNpcs(state).filter((n) => {
    const p = getPlace(n.placeId || 'east_city');
    return p && p.planet !== here && (n.closeness || 0) > 20;
  });
}

/** Familiarity 0-1 with a specific person's ki signature - closeness plus how recently you actually stood near them. */
export function npcFamiliarity(npc, year) {
  if (!npc) return 0.3;
  const close = clamp((npc.closeness || 0) / 100, 0, 1);
  const recent = npc.lastSeen != null ? clamp(1 - (year - npc.lastSeen) / 20, 0, 1) : 0.25;
  return clamp(close * 0.7 + recent * 0.3, 0, 1);
}

/** Familiarity 0-1 with a whole world - have you actually stood on it before. */
export function placeFamiliarity(visits) {
  return clamp((visits || 0) / 6, 0, 1);
}

/**
 * How good a lock Instant Transmission gets, 0-1. Ki control helps, but
 * actually knowing the target matters more - this is a technique about
 * recognising somebody or somewhere, not aiming a weapon at a fixed point.
 */
export function transmissionLockChance(character, familiarity) {
  const control = (character.stats && character.stats.kiControl) || 0;
  const skill = clamp((control - 50) / 150, 0, 0.3);
  return clamp(0.55 + skill + familiarity * 0.3, 0.4, 0.97);
}

/**
 * Roll the lock. `kaiKai` skips the roll entirely - a god's version of this
 * does not miss.
 */
export function attemptLock(character, rng, familiarity, kaiKai = false) {
  if (kaiKai) return { success: true, chance: 1 };
  const chance = transmissionLockChance(character, familiarity);
  return { success: rng.chance(chance), chance };
}

const MISS_LINES = [
  'You aim for the feeling of them and land somewhere near it instead - close, not right.',
  'The signature slips half a second before you arrive and you go with where it used to be.',
  'You are certain, right up until you are standing in completely the wrong place.',
  'Something about the lock is wrong and you only find out after you have already gone.',
];

const CALL_LINES = [
  '{The line takes a while to find a clear channel|Static resolves into a voice, eventually|Whoever built this thing knew what they were doing, mostly}.',
  '{The signal lags behind the words by half a second, the whole conversation|There is a delay that never quite goes away|You talk over each other twice before you find the rhythm}.',
  '{It is not the same as being in the room and it is not nothing either|The picture freezes twice and neither of you mentions it|You can hear something in the background you do not recognise, on their end of a different sky}.',
];

/**
 * An on-demand call across space to somebody who is not on this world -
 * the proactive version of the long_distance event, for a player who wants
 * to reach out rather than wait for word to arrive. Returns text and the
 * relationship deltas the caller applies via `relate`.
 */
export function callAcrossSpace(state, rng, npc) {
  const year = state.world.year;
  const gap = npc.lastCalled != null ? Math.max(0, year - npc.lastCalled) : null;
  npc.lastCalled = year;
  const opener = rng.pick(CALL_LINES);
  const body = gap === 0
    ? '{You only just spoke and you call again anyway|Nothing new has happened since last time, and you say so, and neither of you minds}.'
    : gap != null && gap <= 2
      ? '{It has not been long, and it still matters that you called|Not much has changed, which is its own kind of good news}.'
      : `{It has been a while|You have both been letting it go a while|There is a lot to say and not enough of it fits in one call}.`;
  return { text: `${opener} ${body}`, gap };
}

export function transmissionMissLine(rng) {
  return rng.pick(MISS_LINES);
}
