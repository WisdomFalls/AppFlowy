// What a shop actually has today.
//
// shopStock() in the data layer answers "what could this world ever sell" -
// a fixed menu keyed off tags and local goods. This answers "what is on the
// shelf this season": some of that fixed menu is temporarily out, something
// imported and unusual has turned up, demand on particular goods drifts up
// and down, and selling into real demand often enough starts a standing
// arrangement that pays better for good.

import { ITEMS, ITEM_BY_ID, LOCAL_GOODS, shopStock } from '../data/items.js';
import { clamp } from './rng.js';
import { currentYear } from './state.js';

const ROTATION_YEARS = 3;

function marketsOf(state) {
  state.world.markets = state.world.markets || {};
  return state.world.markets;
}

function marketFor(state, planetId) {
  const markets = marketsOf(state);
  if (!markets[planetId]) {
    markets[planetId] = { rotatedYear: null, outOfStock: [], arrival: null, demand: {}, contracts: {} };
  }
  return markets[planetId];
}

/**
 * Reroll a world's shelf, if the season has actually turned over. Called from
 * the year tick for wherever the player currently is, because rolling it
 * requires the game's rng stream and the shop screen itself only gets a
 * read-only state - this keeps the shelf stable within a visit instead of
 * reshuffling on every render.
 */
export function rollMarketYear(state, rng, planetId) {
  const m = marketFor(state, planetId);
  const year = currentYear(state);
  if (m.rotatedYear !== null && year - m.rotatedYear < ROTATION_YEARS) return m;
  m.rotatedYear = year;

  const general = ITEMS.filter((i) => i.cost > 0 && !(LOCAL_GOODS[planetId] || []).includes(i.id));
  const outCount = rng.int(0, Math.min(3, Math.floor(general.length * 0.25)));
  m.outOfStock = rng.sample(general, outCount).map((i) => i.id);

  // Something imported and temporary - a taste of what another world makes
  // for itself, at a price that reflects how far it travelled.
  const foreign = [...new Set(Object.entries(LOCAL_GOODS)
    .filter(([pid]) => pid !== planetId)
    .flatMap(([, ids]) => ids)
    .filter((id) => ITEM_BY_ID[id]))];
  m.arrival = foreign.length && rng.chance(0.5) ? rng.pick(foreign) : null;

  // Demand drifts on a chunk of the catalogue each rotation. A thing
  // everybody suddenly wants pays better to sell; a glut pays worse.
  m.demand = m.demand || {};
  for (const i of general) {
    if (rng.chance(0.3)) {
      m.demand[i.id] = Math.round(clamp((m.demand[i.id] ?? 1) + rng.float(-0.5, 0.6), 0.5, 2.2) * 100) / 100;
    }
  }
  return m;
}

/**
 * What is actually buyable here right now, rotation and imports applied. Pure
 * read - if nobody has rolled this world's season yet, it is just the full
 * static menu, which is a perfectly fine thing to see on a first visit.
 */
export function liveShopStock(state, placeTags, planetId) {
  const m = marketFor(state, planetId);
  const base = shopStock(placeTags, planetId).filter((i) => !m.outOfStock.includes(i.id));
  if (m.arrival && ITEM_BY_ID[m.arrival] && !base.some((i) => i.id === m.arrival)) {
    base.unshift(ITEM_BY_ID[m.arrival]);
  }
  return base;
}

export function demandFor(state, planetId, itemId) {
  return marketFor(state, planetId).demand[itemId] ?? 1;
}

export function isImportedHere(state, planetId, itemId) {
  return marketFor(state, planetId).arrival === itemId;
}

export function priceMult(state, planetId, itemId) {
  let mult = demandFor(state, planetId, itemId);
  if (isImportedHere(state, planetId, itemId)) mult *= 1.6;
  return mult;
}

// ------------------------------------------------------ trade relationships

/**
 * Sell into real demand often enough and the shop stops treating you as a
 * stranger. A standing order is a permanent, better price for that one good
 * on this one world - not a quota to keep meeting, just a relationship that,
 * once it exists, does not go away.
 */
export function tryStartTrade(state, rng, planetId, itemId) {
  const m = marketFor(state, planetId);
  if (m.contracts[itemId]) return null;
  const demand = m.demand[itemId] ?? 1;
  if (demand < 1.4) return null;
  if (!rng.chance(0.28 + (demand - 1.4) * 0.45)) return null;
  m.contracts[itemId] = { since: currentYear(state), item: itemId };
  return m.contracts[itemId];
}

export function hasTrade(state, planetId, itemId) {
  return !!marketFor(state, planetId).contracts[itemId];
}

export function tradeSellBonus(state, planetId, itemId) {
  return hasTrade(state, planetId, itemId) ? 1.3 : 1;
}

/** Every standing arrangement you have on this world, for the shop screen. */
export function tradeRelationships(state, planetId) {
  const m = marketFor(state, planetId);
  return Object.values(m.contracts).map((c) => ({
    ...c, name: (ITEM_BY_ID[c.item] || {}).name || c.item,
  }));
}
