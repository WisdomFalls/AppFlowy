// Somewhere to live, and what your name is worth.
//
// Two systems that both answer the same question: where do you actually
// belong. A home is a place on a world that is yours, however you got it. A
// reputation is what people on worlds you have never visited think of you,
// and it is not capped at a hundred.

import { clamp } from './rng.js';
import { getPlace, PLACES } from '../data/places.js';
import { getPlanet, PLANETS } from '../data/planets.js';
import { currencyFor, priceIn, canAfford, debit, credit, formatMoney, balance } from '../data/currency.js';
import { numberish } from './text.js';

// ------------------------------------------------------------------ homes

export const HOME_KINDS = [
  {
    id: 'shack', name: 'A shack you put up yourself', cost: 12000, comfort: 4, iq: 0,
    desc: 'Four walls, mostly. It keeps rain out and nothing else.',
  },
  {
    id: 'house', name: 'An ordinary house', cost: 220000, comfort: 12, iq: 0,
    desc: 'Neighbours, a roof that works, and somewhere to put things.',
  },
  {
    id: 'capsule', name: 'A capsule house', cost: 380000, comfort: 14, iq: 0,
    desc: 'A whole house in your pocket, assuming you remember which pocket.',
  },
  {
    id: 'compound', name: 'A compound', cost: 2400000, comfort: 20, train: 1.15, iq: 0,
    desc: 'Walls, land, and nobody within shouting distance.',
  },
  {
    id: 'estate', name: 'An estate', cost: 18000000, comfort: 28, train: 1.2, fame: 6, iq: 0,
    desc: 'More rooms than you will use and a name people recognise.',
  },
  {
    id: 'fortress', name: 'A fortress', cost: 90000000, comfort: 24, train: 1.35, fame: 12, iq: 30,
    desc: 'Built to survive somebody landing on it. Somebody probably will.',
  },
];

export function homeOf(state) {
  return state.character.home || null;
}

/** Everything you could do about somewhere to live, here, now. */
export function homeOptions(state) {
  const c = state.character;
  const place = getPlace(c.placeId);
  const cur = currencyFor(place.planet);
  const out = [];
  for (const kind of HOME_KINDS) {
    const price = priceIn(kind.cost, cur.id);
    out.push({
      id: 'buy:' + kind.id, kind, how: 'buy',
      label: `Buy ${kind.name.toLowerCase()}`,
      hint: `${formatMoney(price, cur.id)}. ${kind.desc}`,
      price, currency: cur.id,
      disabled: !canAfford(c, cur.id, price),
    });
    // Building costs a fraction of the price and a year of your attention,
    // and needs a head for it or somebody who has one.
    const buildPrice = Math.round(price * 0.35);
    const smart = (c.iq || 100) >= 105 || (kind.iq && (c.iq || 100) >= kind.iq + 90);
    out.push({
      id: 'build:' + kind.id, kind, how: 'build',
      label: `Build ${kind.name.toLowerCase()}`,
      hint: smart
        ? `${formatMoney(buildPrice, cur.id)} in materials. You can work it out.`
        : `${formatMoney(buildPrice, cur.id)} in materials, and you would need help.`,
      price: buildPrice, currency: cur.id, needsHelp: !smart,
      disabled: !canAfford(c, cur.id, buildPrice),
    });
  }
  out.push({
    id: 'take', how: 'take',
    label: 'Take one that is already standing',
    hint: 'Somebody lives there now. That is the whole problem with it.',
    price: 0, currency: cur.id,
  });
  return out;
}

export function settleHome(state, rng, optionId, helperNpc) {
  const c = state.character;
  const place = getPlace(c.placeId);
  const cur = currencyFor(place.planet);
  const opts = homeOptions(state);
  const opt = opts.find((o) => o.id === optionId);
  if (!opt) return { ok: false, text: 'Nothing comes of it.' };

  if (opt.how === 'take') {
    const held = clamp(0.3 + Math.log10(Math.max(1, c.power)) / 14, 0.2, 0.95);
    if (!rng.chance(held)) {
      return { ok: false, text: 'Whoever lives there has friends, and the friends arrive first. You leave it.' };
    }
    c.home = {
      kind: 'taken', name: 'A house that was somebody else\'s', placeId: c.placeId,
      planet: place.planet, comfort: 10, since: c.birthYear + c.age, stolen: true,
    };
    c.karma = clamp(c.karma - 22, -100, 100);
    return {
      ok: true, stolen: true,
      text: 'You take it. They do not argue for long, and the neighbours stop making eye contact with you within a week.',
    };
  }

  if (!canAfford(c, cur.id, opt.price)) {
    return { ok: false, text: `That costs ${formatMoney(opt.price, cur.id)}. You do not have it.` };
  }
  debit(c, cur.id, opt.price);

  if (opt.how === 'build') {
    const helped = !!helperNpc;
    const ok = !opt.needsHelp || helped;
    if (!ok) {
      return {
        ok: false,
        text: 'You get about a third of the way up and it comes down in the night. The materials are gone.',
      };
    }
    c.home = {
      kind: opt.kind.id, name: opt.kind.name, placeId: c.placeId, planet: place.planet,
      comfort: opt.kind.comfort, train: opt.kind.train, since: c.birthYear + c.age,
      built: true, helper: helperNpc ? helperNpc.name : null,
    };
    return {
      ok: true, built: true,
      text: helperNpc
        ? `${helperNpc.name} does the parts you would have got wrong, and lets you think you did them. It stands.`
        : 'It takes most of a year and it stands when you are finished, which is more than you expected.',
    };
  }

  c.home = {
    kind: opt.kind.id, name: opt.kind.name, placeId: c.placeId, planet: place.planet,
    comfort: opt.kind.comfort, train: opt.kind.train, since: c.birthYear + c.age,
  };
  if (opt.kind.fame) c.fame = clamp(c.fame + opt.kind.fame, 0, 100);
  return { ok: true, text: `${opt.kind.name}. ${opt.kind.desc}` };
}

/** What living somewhere does for you, per year. */
export function homeBonus(state) {
  const home = homeOf(state);
  if (!home) return { comfort: 0, train: 1 };
  // A starship is not "somewhere" in the sense every other home is - the
  // whole reason it costs what it does is that it does not sit on a planet
  // waiting for you to come home to it.
  const here = home.kind === 'starship' || getPlace(state.character.placeId).planet === home.planet;
  return {
    comfort: here ? home.comfort : Math.round(home.comfort * 0.25),
    train: here ? (home.train || 1) : 1,
    here,
  };
}

// ------------------------------------------------------------- space home

// Rooms are not the whole ship - they are what turns "a hull that can fly"
// into somewhere people actually want to be aboard. Bought and added one at
// a time, same as any other renovation.
export const SHIP_ROOMS = [
  { id: 'quarters', name: 'Guest quarters', cost: 4000000, comfort: 6,
    desc: 'Somewhere for the people you bring aboard to actually sleep.' },
  { id: 'kitchen_dining', name: 'Kitchen and dining hall', cost: 6000000, comfort: 8,
    desc: 'A place to eat that is not standing over a console.' },
  { id: 'gravity_room', name: 'Gravity room', cost: 15000000, comfort: 4, train: 1.3,
    desc: 'Training that does not care what planet you happen to be near.' },
  { id: 'medbay', name: 'Medical bay', cost: 12000000, comfort: 4, heal: 12,
    desc: 'Somewhere better than a senzu bean for the injuries that are not that simple.' },
  { id: 'observatory', name: 'Observatory', cost: 5000000, comfort: 6,
    desc: 'A window on the actual size of everything out here.' },
];
export const SHIP_ROOM_BY_ID = Object.fromEntries(SHIP_ROOMS.map((r) => [r.id, r]));

export function shipOf(state) {
  const home = state.character.home;
  return home && home.kind === 'starship' ? home : null;
}

/** The one-time build: money, materials, and somebody who can actually do
 * the engineering - a personal genius, or a company that does this for a
 * living. Distinct from homeOptions()'s build/buy/take because a starship
 * is never "self-built", however sharp you are. */
export function starshipOption(state) {
  const c = state.character;
  const place = getPlace(c.placeId);
  const cur = currencyFor(place.planet);
  const price = priceIn(320000000, cur.id);
  return {
    id: 'starship', how: 'starship',
    label: 'Commission a space-traveling home',
    hint: `${formatMoney(price, cur.id)} in materials and engineering. It goes where you go.`,
    price, currency: cur.id,
    disabled: !!shipOf(state) || !canAfford(c, cur.id, price),
  };
}

export function buildStarship(state, rng, engineerName) {
  const c = state.character;
  const place = getPlace(c.placeId);
  const cur = currencyFor(place.planet);
  const opt = starshipOption(state);
  if (opt.disabled) {
    return { ok: false, text: shipOf(state) ? 'You already have one.' : `That costs ${formatMoney(opt.price, cur.id)}. You are not there yet.` };
  }
  debit(c, cur.id, opt.price);
  const family = Object.values(state.npcs || {}).filter((n) => n.alive
    && ['spouse', 'child', 'parent'].includes(n.relation));
  c.home = {
    kind: 'starship', name: 'The ship', placeId: c.placeId, planet: place.planet,
    comfort: 10, train: 1, since: c.birthYear + c.age, builtBy: engineerName || null,
    rooms: [], occupants: family.map((n) => n.id),
  };
  return {
    ok: true, built: true, movedIn: family,
    text: engineerName
      ? `${engineerName} signs off on it. It is not finished so much as it is finally ready to keep being finished - the hull holds, the drive answers, and everything else is a room you have not built yet.`
      : 'The drive answers on the first attempt, which nobody involved expected. Everything else is a room you have not built yet.',
  };
}

/** Adding, and re-adding (an upgrade pass) a room aboard the ship. */
export function shipRoomOptions(state) {
  const ship = shipOf(state);
  if (!ship) return [];
  const c = state.character;
  const cur = currencyFor(getPlace(c.placeId).planet);
  return SHIP_ROOMS.map((r) => {
    const price = priceIn(r.cost, cur.id);
    const have = ship.rooms.includes(r.id);
    return {
      id: r.id, room: r, price, currency: cur.id, have,
      label: have ? `Renovate the ${r.name.toLowerCase()}` : `Add a ${r.name.toLowerCase()}`,
      hint: `${formatMoney(price, cur.id)}. ${r.desc}`,
      disabled: !canAfford(c, cur.id, price),
    };
  });
}

export function addShipRoom(state, roomId) {
  const ship = shipOf(state);
  const room = SHIP_ROOM_BY_ID[roomId];
  if (!ship || !room) return { ok: false, text: 'Nothing to build that onto.' };
  const c = state.character;
  const cur = currencyFor(getPlace(c.placeId).planet);
  const price = priceIn(room.cost, cur.id);
  if (!canAfford(c, cur.id, price)) return { ok: false, text: `That costs ${formatMoney(price, cur.id)}. You do not have it.` };
  debit(c, cur.id, price);
  const already = ship.rooms.includes(roomId);
  if (!already) ship.rooms.push(roomId);
  ship.comfort += already ? Math.round(room.comfort * 0.4) : room.comfort;
  if (room.train) ship.train = Math.max(ship.train || 1, room.train);
  return {
    ok: true, upgraded: already,
    text: already
      ? `The ${room.name.toLowerCase()} gets better, not new - worth having either way.`
      : `The ${room.name.toLowerCase()}, added. ${room.desc}`,
  };
}

/** Invite somebody aboard - family already lives here once it exists;
 * everyone else has to actually be asked. */
export function inviteAboard(state, npc) {
  const ship = shipOf(state);
  if (!ship) return { ok: false, text: 'There is nowhere to invite them to yet.' };
  ship.occupants = ship.occupants || [];
  if (ship.occupants.includes(npc.id)) return { ok: false, text: `${npc.name} already lives here.` };
  ship.occupants.push(npc.id);
  return { ok: true, text: `${npc.name} moves aboard.` };
}

/** Selling it is the end of owning one, not a downgrade - the price back is
 * a fraction of everything ever put into it, rooms included. */
export function sellStarship(state) {
  const ship = shipOf(state);
  if (!ship) return { ok: false, text: 'There is nothing to sell.' };
  const c = state.character;
  const cur = currencyFor(getPlace(c.placeId).planet);
  const spent = priceIn(320000000, cur.id) + ship.rooms.reduce((n, id) => n + priceIn(SHIP_ROOM_BY_ID[id]?.cost || 0, cur.id), 0);
  const refund = Math.round(spent * 0.35);
  credit(c, cur.id, refund);
  c.home = null;
  return { ok: true, refund, text: `Scrapped, sold in pieces, or handed to somebody who wanted a project - either way, ${formatMoney(refund, cur.id)} for something that was, for a while, the whole point.` };
}

// ------------------------------------------------------------ reputation

/**
 * Reputation is not a percentage. It is how many people have heard, which
 * on a galactic scale runs to the billions and beyond, and it spreads from
 * whatever you did and how strong you were when you did it.
 */
export function reputationOf(state) {
  const c = state.character;
  return {
    reach: c.reputation || 0,
    karma: c.karma || 0,
    label: reputationLabel(c.reputation || 0, c.karma || 0),
  };
}

const REACH_STEPS = [
  [0, 'Nobody', 'Nobody has heard of you.'],
  [200, 'Locally known', 'People in this district know the name.'],
  [20000, 'Known on this world', 'You get recognised in cities you have never visited.'],
  [4000000, 'Known on several worlds', 'Traders carry the name between systems.'],
  [900000000, 'Known across the sector', 'Whole populations have an opinion about you.'],
  [80000000000, 'Known across the galaxy', 'There are worlds that have never seen you and are frightened anyway.'],
  [2000000000000, 'Known to the universe', 'Your name has reached places light has not.'],
  [Infinity, 'Known past this universe', 'Other universes have your file.'],
];

export function reputationLabel(reach, karma) {
  let step = REACH_STEPS[0];
  for (const s of REACH_STEPS) { if (reach >= s[0]) step = s; }
  const tone = karma <= -55 ? 'feared' : karma <= -20 ? 'distrusted' : karma >= 55 ? 'loved' : karma >= 20 ? 'liked' : 'known';
  return { reach: step[1], line: step[2], tone, text: `${step[1]}, and ${tone}.` };
}

/**
 * Something happened and people heard about it. `scale` is roughly how many
 * people could have witnessed or been told, and power decides how far the
 * story travels beyond that.
 */
export function spreadWord(state, opts = {}) {
  const c = state.character;
  const power = Math.max(1, c.power || 1);
  const reachFromPower = Math.pow(Math.log10(power) + 1, 4.2) * 40;
  const gained = Math.round((opts.scale || 1) * reachFromPower * (opts.multiplier || 1));
  c.reputation = Math.max(0, (c.reputation || 0) + gained);
  if (opts.karma) c.karma = clamp(c.karma + opts.karma, -100, 100);
  // Fame stays as the 0-100 local figure everything else already reads.
  c.fame = clamp(c.fame + Math.min(12, Math.round(Math.log10(Math.max(10, gained)) * 1.6)), 0, 100);
  return { gained, total: c.reputation, label: reputationLabel(c.reputation, c.karma) };
}

/** Scales for the things that generate a reputation, so callers stay honest. */
export const DEED_SCALE = {
  street: 0.4,
  tournament: 6,
  city: 30,
  world_saved: 900,
  world_ruled: 1200,
  world_destroyed: 4000,
  god_beaten: 9000,
  universe: 40000,
};
