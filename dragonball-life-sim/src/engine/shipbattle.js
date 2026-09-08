// Ship-to-ship combat. A separate, much shorter model than personal combat
// (combat.js's fight()) because a ship fight is not about technique or
// transformation - it is speed (who gets the first and more shots), hull
// (how much punishment is left) and firepower (what a hit actually costs).
// A ship that runs out of hull mid-fight does not just lose - if it is
// standing this close to a world, it goes down onto one.

import { clamp } from './rng.js';
import { render } from './text.js';
import { SHIP_HULL_BY_ID, SHIP_HULLS } from './settlement.js';
import { maim } from './body.js';

/** A hostile ship with no owner, generated for one encounter - not
 * something that persists in state.npcs the way a stolen ship's former
 * owner might. */
export function randomHostileShip(rng, opts = {}) {
  const hullId = opts.hullId || rng.pick(SHIP_HULLS).id;
  const hull = SHIP_HULL_BY_ID[hullId] || SHIP_HULL_BY_ID.cruiser;
  const scale = opts.scale ?? rng.float(0.6, 1.6);
  const hullPoints = Math.max(20, Math.round(hull.baseHull * scale));
  return {
    name: opts.name || render('{Unmarked raider|Nameless pursuit ship|A ship broadcasting no registry|A hull with the serials filed off}', {}, rng),
    hullType: hullId,
    speed: Math.max(1, Math.round(hull.baseSpeed * scale)),
    hull: hullPoints,
    hullMax: hullPoints,
    firepower: Math.max(3, Math.round(hull.baseHull * 0.22 * scale)),
    crew: hull.crew,
  };
}

/**
 * One battle, auto-resolved in short rounds the same way fight() resolves a
 * personal one. `mine` and `theirs` are ship-shaped objects with
 * speed/hull/hullMax/firepower. Returns a structured result; callers turn it
 * into prose and consequences.
 */
export function resolveShipBattle(mine, theirs, rng, opts = {}) {
  const rounds = [];
  let myHull = mine.hull;
  let theirHull = theirs.hull;
  const maxRounds = opts.maxRounds || 6;
  // Speed decides who gets on the other one's tail, not who hits harder.
  const speedEdge = (mine.speed - theirs.speed) / Math.max(1, mine.speed + theirs.speed);

  for (let r = 0; r < maxRounds && myHull > 0 && theirHull > 0; r++) {
    const roll = rng.gauss(speedEdge * 1.4, 1);
    if (roll > 0.2) {
      const dmg = clamp((mine.firepower || 5) * rng.float(0.6, 1.3), 3, 9999);
      theirHull -= dmg;
      rounds.push({ side: 'me', damage: Math.round(dmg) });
    } else if (roll < -0.2) {
      const dmg = clamp((theirs.firepower || 5) * rng.float(0.6, 1.3), 3, 9999);
      myHull -= dmg;
      rounds.push({ side: 'them', damage: Math.round(dmg) });
    } else {
      rounds.push({ side: 'even', damage: 0 });
    }
  }

  const won = theirHull <= 0 && myHull > 0 ? true
    : myHull <= 0 && theirHull > 0 ? false
      : myHull >= theirHull;

  return {
    won, rounds,
    myHullLeft: Math.max(0, Math.round(myHull)),
    theirHullLeft: Math.max(0, Math.round(theirHull)),
    // Disabled: hit zero. Destroyed: hit well past zero, nothing to salvage.
    disabled: myHull <= 0,
    destroyed: myHull <= -mine.hullMax * 0.3,
  };
}

/** Prose for a resolved battle, same shape as combat.js's narrateFight. */
export function narrateShipBattle(result, rng, foeName) {
  const lines = [];
  const shown = result.rounds.slice(0, 3);
  for (const round of shown) {
    if (round.side === 'me') {
      lines.push(render(`{You get on their tail and fire|You close the gap first and put everything into one pass|You do not give them the first shot}. Hull damage, ${round.damage}.`, {}, rng));
    } else if (round.side === 'them') {
      lines.push(render(`{${foeName} is faster off the mark|You do not see them line up until it is too late|${foeName} gets the angle first} and hits you for ${round.damage}.`, {}, rng));
    } else {
      lines.push(render('{Neither of you can get a clean shot|You trade nothing but distance|The exchange goes nowhere}.', {}, rng));
    }
  }
  if (result.won) {
    lines.push(render(result.theirHullLeft <= 0
      ? `{${foeName} breaks apart|${foeName} goes dark and starts tumbling|Whatever was left of ${foeName} is not flying anywhere now}.`
      : `{${foeName} peels off and does not come back|You do not chase - you do not have to|${foeName} has had enough}.`, {}, rng));
  } else {
    lines.push(render(result.disabled
      ? `{Something vital just went|The hull cannot take another hit like that|Every alarm on the ship is going off at once}.`
      : `{You break off - there is no winning this one|You are not walking away from another exchange like that|You pull back before it gets worse}.`, {}, rng));
  }
  return lines.join(' ');
}

/**
 * A ship that ran out of hull this close to a planet does not simply stop -
 * it goes down. Destroyed outright is the harsh end; otherwise it is a hard
 * landing that costs the pilot, whoever is aboard, and the ship itself.
 */
export function resolveShipCrash(state, rng, ship, opts = {}) {
  const c = state.character;
  const severity = opts.destroyed ? 1 : clamp(rng.float(0.35, 1), 0, 1);
  const lines = [render('{The hull gives out and you are going down|Whatever was holding together stops, and the ground is coming up fast|You do not so much land as arrive, all at once}.', {}, rng)];

  const health = -Math.round(18 + severity * 26);
  c.vitals.health = clamp((c.vitals.health || 100) + health, 0, c.vitals.healthMax || 100);

  const crashPool = ['shattered_knee', 'broken_back', 'lost_leg'];
  if (severity > 0.55 && rng.chance(0.3 + severity * 0.25)) {
    const line = maim(c, rng, rng.pick(crashPool), 'the crash');
    if (line) lines.push(line);
  }

  const occupants = (ship.occupants || []).map((id) => state.npcs[id]).filter((n) => n && n.alive);
  for (const n of occupants) {
    if (rng.chance(0.25 * severity)) {
      const line = maim(n, rng, rng.pick(crashPool), 'the crash');
      if (line) lines.push(`${n.name}: ${line}`);
    }
  }

  const destroyed = opts.destroyed || (severity > 0.8 && rng.chance(0.4));
  if (destroyed) {
    c.home = null;
    lines.push('What is left of the ship is not worth calling a ship any more.');
  } else {
    ship.hull = Math.max(1, Math.round((ship.hullMax || 60) * 0.15));
    lines.push('It still flies. Barely, and not for long without real work.');
  }

  return { text: lines.join(' '), destroyed, healthLost: -health };
}
