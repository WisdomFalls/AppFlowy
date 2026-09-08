// The underworld's side of fame: a price on your own head once you have
// earned one, and a standing board of other people's prices you can go
// collect on. Refreshed once a year (refreshMostWantedBoard, called from
// lifecycle.js's passiveYear) rather than on demand, so listing the board
// never has to touch the shared rng mid-render.

import { clamp } from './rng.js';
import { makeNpc } from './npc.js';
import { addNpc } from './state.js';

const WANTED_TARGET = 5;

const WANTED_REASONS = [
  'Piracy along the trade lanes.',
  'Killed a licensed hunter who came for somebody else.',
  'Burned a settlement down for refusing to pay tribute.',
  'Stole a warship, crew and all.',
  'Sold weapons to whichever side was losing, repeatedly.',
  'Broke out of the Galactic Prison and has not been seen since.',
  'Ran a slaving operation out of a decommissioned station.',
  'Killed a Patrol officer and everyone who saw it happen.',
];

/** What your own name is worth to whoever is keeping the board. Zero until
 * your karma actually crosses into "criminal", not just "not a saint". */
export function wantedLevel(character) {
  const karma = character.karma || 0;
  const fame = character.fame || 0;
  if (karma >= -20) return 0;
  return Math.round((Math.abs(karma) + 20) * (10 + fame) * 60);
}

/** Top the board back up to WANTED_TARGET names and drop anyone already
 * dealt with (dead, captured, or otherwise removed from state.npcs). Called
 * once a year with that turn's rng - never from a pure read like options(). */
export function refreshMostWantedBoard(state, rng) {
  const c = state.character;
  state.world.mostWanted = (state.world.mostWanted || [])
    .filter((w) => {
      const npc = state.npcs[w.npcId];
      return npc && npc.alive && !npc.captive;
    });
  const mine = Math.max(1, c.power || 1);
  while (state.world.mostWanted.length < WANTED_TARGET) {
    const npc = makeNpc(rng, {
      year: c.birthYear + c.age, placeId: c.placeId,
      minAge: 20, maxAge: 65,
    });
    npc.relation = 'stranger';
    npc.power = Math.max(1, Math.round(mine * rng.float(0.4, 2.4)));
    addNpc(state, npc);
    state.world.mostWanted.push({
      npcId: npc.id,
      bounty: Math.round(clamp(npc.power * rng.float(30, 90), 8000, 6e8)),
      reason: rng.pick(WANTED_REASONS),
    });
  }
}

/** Pure read of the current board - no rng, safe to call from options() or
 * a display panel as often as it likes. */
export function mostWantedBoard(state) {
  return (state.world.mostWanted || [])
    .map((w) => ({ ...w, npc: state.npcs[w.npcId] }))
    .filter((w) => w.npc && w.npc.alive)
    .sort((a, b) => b.bounty - a.bounty);
}

/** Take a name off the board once it has been collected on. */
export function clearBounty(state, npcId) {
  state.world.mostWanted = (state.world.mostWanted || []).filter((w) => w.npcId !== npcId);
}
