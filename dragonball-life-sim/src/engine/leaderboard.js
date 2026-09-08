// Where you actually stand. seek_challenge and hold_tournament both find
// somebody in a power band scaled to be a plausible fight - useful for
// picking an opponent, useless for answering "who is actually strongest
// right now, and where do I fall on that list." This is the honest version:
// no scaling, no matchmaking, just the canon roster (and you) sorted by raw
// power.
//
// NPCs are left out on purpose. A locally generated stranger is not a name
// anyone could look up or compare against - a leaderboard of "who's
// strongest" only means something for beings the setting itself keeps track
// of, which in this data is the canon cast.

import { canonAvailable, canonPower, canonUniverse } from '../data/canon.js';
import { combatPower, powerTier } from './stats.js';
import { currentYear } from './state.js';

/**
 * Ranked, most powerful first. `scope: 'universe'` (default) only counts
 * beings in the player's current universe; `'multiverse'` counts everyone
 * the game tracks anywhere. Always includes the player, wherever they fall.
 */
export function strongestBeings(state, opts = {}) {
  const c = state.character;
  const year = currentYear(state);
  const scope = opts.scope === 'multiverse' ? 'multiverse' : 'universe';
  const myUniverse = c.universe || 7;

  const rows = canonAvailable(year, (ch) => scope === 'multiverse' || canonUniverse(ch) === myUniverse)
    .map((ch) => ({
      id: ch.id, name: ch.name, power: Math.max(1, Math.round(canonPower(ch, year))),
      universe: canonUniverse(ch), isPlayer: false,
    }));

  rows.push({
    id: 'you', name: c.name, power: Math.max(1, Math.round(combatPower(c))),
    universe: myUniverse, isPlayer: true,
  });

  rows.sort((a, b) => b.power - a.power);
  rows.forEach((r, i) => {
    r.rank = i + 1;
    r.tier = powerTier(r.power);
  });

  return { rows, you: rows.find((r) => r.isPlayer), total: rows.length, scope };
}
