// Things you own.
//
// Items used to be a flat array of ids with no screen and no handling: you
// could buy one and that was the end of its life. This gives every character -
// you and everybody else - a real inventory, so a thing can be worn, used,
// sold, given away, or taken off somebody who did not want to give it up.

import { clamp } from './rng.js';
import { getItem, ITEMS } from '../data/items.js';
import { currencyFor, priceIn, credit, debit, canAfford, balance, formatMoney } from '../data/currency.js';
import { getPlace } from '../data/places.js';
import { priceMult, tradeSellBonus, tryStartTrade } from './market.js';
import { render } from './text.js';

/** Slots a wearable item can occupy. One thing per slot. */
export const SLOTS = {
  body: 'Worn', head: 'Head', face: 'Face', feet: 'Feet', held: 'Carried', trinket: 'Trinket', none: null,
};

function slotOf(item) {
  if (!item) return 'none';
  // Clothing (and anything else authored with a real slot) says where it
  // goes directly, rather than being sorted by id-matching.
  if (item.slot) return item.slot;
  if (item.cat === 'accessory') {
    if (['acc_hat', 'acc_bandana', 'acc_headband'].includes(item.id)) return 'head';
    if (['acc_sunglasses', 'acc_glasses'].includes(item.id)) return 'face';
    return 'trinket';
  }
  if (item.id === 'battle_armour' || item.id === 'weighted_clothing' || item.id === 'turtle_shell') return 'body';
  if (item.cat === 'weapon') return 'held';
  if (item.id === 'scouter') return 'head';
  if (item.id === 'potara' || item.id === 'time_ring' || item.id === 'championship_belt') return 'trinket';
  return 'none';
}

export function itemSlot(itemId) {
  return slotOf(getItem(itemId));
}

/** Everything a character is carrying, as rows the UI can render. Anything
 * given a custom name (a commission, or a rename after the fact) shows
 * that instead of the catalog name - the entry is what makes it yours,
 * the template just says what it is made of. */
export function inventoryOf(character) {
  const bag = character.bag || [];
  return bag.map((entry) => {
    const item = getItem(entry.id);
    return {
      ...entry,
      item,
      name: entry.customName || (item ? item.name : entry.id),
      emblem: entry.emblem || null,
      desc: item ? item.desc : '',
      cat: item ? item.cat : 'misc',
      slot: slotOf(item),
      worn: !!entry.worn,
      condition: entry.condition ?? 100,
    };
  });
}

/** Move a character's legacy flat item list into the bag, once. */
export function ensureBag(character) {
  if (character.bag) return character.bag;
  character.bag = (character.items || []).map((id) => ({ id, qty: 1, condition: 100, worn: slotOf(getItem(id)) !== 'none' }));
  return character.bag;
}

export function findEntry(character, itemId) {
  ensureBag(character);
  return character.bag.find((e) => e.id === itemId) || null;
}

export function hasItem(character, itemId) {
  return !!findEntry(character, itemId);
}

export function addItem(character, itemId, opts = {}) {
  ensureBag(character);
  const item = getItem(itemId);
  const existing = findEntry(character, itemId);
  if (existing && (item ? (item.cat === 'consumable' || item.cat === 'material') : true)) {
    existing.qty = (existing.qty || 1) + (opts.qty || 1);
  } else if (!existing) {
    character.bag.push({
      id: itemId, qty: opts.qty || 1, condition: opts.condition ?? 100,
      worn: opts.worn ?? false, from: opts.from || null,
    });
  }
  // The old flat list stays in step so nothing that reads it breaks.
  character.items = character.items || [];
  if (!character.items.includes(itemId)) character.items.push(itemId);
  return true;
}

export function removeItem(character, itemId, qty = 1) {
  ensureBag(character);
  const i = character.bag.findIndex((e) => e.id === itemId);
  if (i < 0) return false;
  const entry = character.bag[i];
  entry.qty = (entry.qty || 1) - qty;
  if (entry.qty <= 0) character.bag.splice(i, 1);
  if (!findEntry(character, itemId)) {
    character.items = (character.items || []).filter((x) => x !== itemId);
  }
  return true;
}

/** Wear or stow. One item per slot, so putting one on takes another off. */
export function toggleWorn(character, itemId) {
  const entry = findEntry(character, itemId);
  if (!entry) return { ok: false, text: 'You do not have that.' };
  const slot = itemSlot(itemId);
  if (slot === 'none') return { ok: false, text: 'That is not something you wear.' };
  if (entry.worn) {
    entry.worn = false;
    return { ok: true, text: `You put the ${getItem(itemId).name.toLowerCase()} away.` };
  }
  for (const other of character.bag) {
    if (other !== entry && other.worn && itemSlot(other.id) === slot) other.worn = false;
  }
  entry.worn = true;
  return { ok: true, text: `${getItem(itemId).name}, on.` };
}

/** What something is worth here, in the local currency. */
export function valueHere(state, itemId, opts = {}) {
  const item = getItem(itemId);
  if (!item) return { amount: 0, currency: 'zeni' };
  const planet = getPlace(state.character.placeId).planet;
  const cur = currencyFor(planet);
  const entry = findEntry(state.character, itemId);
  const wear = entry ? clamp((entry.condition ?? 100) / 100, 0.2, 1) : 1;
  // A thing with no price on Earth still has a price somewhere; unique things
  // are worth a great deal to the right buyer.
  const base = item.cost || (item.passive && item.passive.unique ? 5000000 : 40000);
  const sell = opts.sell ? 0.45 : 1;
  // What this world happens to want right now, and whether you are somebody
  // it already does business with.
  const demand = opts.sell ? priceMult(state, planet, itemId) * tradeSellBonus(state, planet, itemId)
    : priceMult(state, planet, itemId);
  return { amount: Math.max(1, priceIn(Math.round(base * wear * sell * demand), cur.id)), currency: cur.id, cur };
}

/** Sell to whoever is buying on this world. A shop that wants enough of
 * something often enough will start asking you to keep bringing it. */
export function sellItem(state, rng, itemId) {
  const item = getItem(itemId);
  if (!item) return { ok: false, text: 'Nothing to sell.' };
  const entry = findEntry(state.character, itemId);
  if (!entry) return { ok: false, text: 'You do not have that.' };
  if (entry.worn) toggleWorn(state.character, itemId);
  const { amount, currency } = valueHere(state, itemId, { sell: true });
  removeItem(state.character, itemId, 1);
  credit(state.character, currency, amount);
  const planet = getPlace(state.character.placeId).planet;
  let text = `Sold. ${formatMoney(amount, currency)}.`;
  if (rng) {
    const started = tryStartTrade(state, rng, planet, itemId);
    if (started) text += ` They ask if you can keep bringing ${item.name.toLowerCase()}. Standing order, from now on.`;
  }
  return { ok: true, amount, currency, text };
}

/** Buy from whoever is selling. */
export function buyItem(state, itemId) {
  const item = getItem(itemId);
  if (!item) return { ok: false, text: 'They do not have that.' };
  const { amount, currency, cur } = valueHere(state, itemId);
  if (!canAfford(state.character, currency, amount)) {
    return { ok: false, text: `${item.name} costs ${formatMoney(amount, currency)}. You do not have it.` };
  }
  debit(state.character, currency, amount);
  addItem(state.character, itemId);
  return { ok: true, amount, currency, text: `${item.name}. ${formatMoney(amount, currency)}. ${item.desc}` };
}

// --------------------------------------------------------- other people

/** What an NPC is carrying. Generated once and then it is theirs. */
export function npcBag(rng, npc) {
  if (npc.bag) return npc.bag;
  const bag = [];
  const wealth = Math.log10(Math.max(100, npc.zeni || 1000));
  const pool = ITEMS.filter((i) => i.cost > 0 && i.cost < Math.pow(10, wealth) * 4);
  const count = rng.int(0, Math.min(4, Math.floor(wealth - 2)));
  for (let i = 0; i < count; i++) {
    const item = rng.pick(pool);
    if (item && !bag.some((e) => e.id === item.id)) {
      bag.push({ id: item.id, qty: 1, condition: rng.int(55, 100), worn: rng.chance(0.6) });
    }
  }
  if (npc.hasDragonBall) bag.push({ id: 'dragon_ball', qty: 1, condition: 100, worn: false });
  npc.bag = bag;
  return bag;
}

/**
 * What somebody you just killed was carrying, taken rather than asked for.
 * A body does not stop a fight from ending with fewer of its problems than
 * it started with - whatever they had on them is just sitting there now.
 */
export function lootFromDefeated(rng, npc, character) {
  npcBag(rng, npc);
  if (!npc.bag || !npc.bag.length) return null;
  if (!rng.chance(0.6)) return null;
  const entry = rng.pick(npc.bag);
  const item = getItem(entry.id);
  if (!item) return null;
  npc.bag.splice(npc.bag.indexOf(entry), 1);
  addItem(character, entry.id, { condition: entry.condition, from: `looted from ${npc.name}` });
  return `${item.name} - taken off ${npc.name}. It is yours now.`;
}

/** Everything of theirs you have learned about. */
export function knownItems(npc) {
  const k = npc.knowledge || 0;
  const bag = npc.bag || [];
  if (k >= 3) return bag;
  if (k >= 2) return bag.filter((e) => e.worn);
  if (k >= 1) return bag.filter((e) => e.worn && itemSlot(e.id) !== 'trinket');
  return [];
}

/**
 * Ask, buy, or take. Asking works on goodwill, buying on money, and taking on
 * being frightening enough that they decide not to argue.
 */
export function requestItem(state, rng, npc, itemId, how) {
  const item = getItem(itemId);
  const entry = (npc.bag || []).find((e) => e.id === itemId);
  if (!item || !entry) return { ok: false, text: 'They are not carrying that.' };
  const c = state.character;

  if (how === 'ask') {
    const bond = (npc.closeness || 0) + (npc.trust ?? 30) * 0.5 - (npc.tension || 0);
    const chance = clamp(0.05 + bond / 200 - (item.cost || 0) / 4000000, 0.02, 0.9);
    if (rng.chance(chance)) {
      npc.bag.splice(npc.bag.indexOf(entry), 1);
      addItem(c, itemId, { condition: entry.condition, from: npc.name });
      npc.closeness = clamp((npc.closeness || 0) - 3, 0, 100);
      return { ok: true, text: `${npc.name} hands it over without much fuss. "Keep it."` };
    }
    npc.tension = clamp((npc.tension || 0) + 4, 0, 100);
    return { ok: false, text: `${npc.name} says no, and does not soften it.` };
  }

  if (how === 'buy') {
    const { amount, currency } = valueHere(state, itemId);
    const asking = Math.round(amount * (1.1 - (npc.closeness || 0) / 400));
    if (!canAfford(c, currency, asking)) {
      return { ok: false, text: `They want ${formatMoney(asking, currency)}. You do not have it.` };
    }
    debit(c, currency, asking);
    npc.zeni = (npc.zeni || 0) + asking;
    npc.bag.splice(npc.bag.indexOf(entry), 1);
    addItem(c, itemId, { condition: entry.condition, from: npc.name });
    npc.closeness = clamp((npc.closeness || 0) + 2, 0, 100);
    return { ok: true, text: `Done. ${formatMoney(asking, currency)}, and they throw in a warning about the condition.` };
  }

  // Taking it.
  const theirs = Math.max(1, npc.power || 1);
  const mine = Math.max(1, c.power || 1);
  const overmatch = mine / theirs;
  if (rng.chance(clamp(0.2 + Math.log10(overmatch) * 0.6, 0.05, 0.95))) {
    npc.bag.splice(npc.bag.indexOf(entry), 1);
    addItem(c, itemId, { condition: entry.condition, from: `taken from ${npc.name}` });
    npc.tension = 100;
    npc.trust = 0;
    npc.closeness = clamp((npc.closeness || 0) - 40, 0, 100);
    if (npc.relation !== 'nemesis') npc.relation = 'enemy';
    c.karma = clamp((c.karma || 0) - 12, -100, 100);
    return { ok: true, took: true, text: `You take it. ${npc.name} does not try to stop you, which is not the same as letting you.` };
  }
  npc.tension = clamp((npc.tension || 0) + 30, 0, 100);
  c.karma = clamp((c.karma || 0) - 6, -100, 100);
  return { ok: false, text: `${npc.name} will not let go of it, and you find out you are not as far above them as you thought.` };
}

// What kind of person a given category of gift actually lands with. Nobody
// is impressed by a sword just because it was expensive if fighting is not
// who they are, and nobody who is vain turns down jewellery.
const GIFT_AFFINITY = {
  weapon: ['brave', 'reckless', 'ambitious', 'protective', 'vengeful'],
  gear: ['ambitious', 'patient', 'protective', 'curious'],
  accessory: ['vain', 'curious', 'funny'],
  treasure: ['vain', 'greedy', 'ambitious', 'curious'],
  trophy: ['vain', 'ambitious', 'greedy'],
  consumable: ['kind', 'gentle', 'generous', 'loyal'],
  property: ['patient', 'protective', 'loyal'],
  transport: ['curious', 'ambitious', 'reckless'],
};

/**
 * Does this gift actually suit them, independent of whether they will say
 * so? Personality tags and what they are chasing in life count for more
 * than the price tag, though a genuinely extravagant gift still buys some
 * credit even with someone it was never going to be right for.
 */
export function giftFit(npc, item) {
  if (!item) return 'neutral';
  const tags = npc.tags || [];
  let score = (GIFT_AFFINITY[item.cat] || []).filter((t) => tags.includes(t)).length * 2;
  const fights = (npc.power || 0) > 500 || npc.growthFocus === 'power';
  if (item.cat === 'weapon') score += fights ? 2 : (tags.some((t) => t === 'gentle' || t === 'patient') ? -2 : 0);
  if (item.cat === 'gear' && item.passive && item.passive.trainMult && fights) score += 2;
  if ((item.cat === 'accessory' || item.cat === 'trophy') && npc.appearance && npc.appearance.vain) score += 2;
  if (item.cat === 'consumable' && npc.growthFocus === 'family') score += 1;
  if (item.cat === 'property' && npc.growthFocus === 'family') score += 2;
  if (item.cat === 'transport' && npc.growthFocus === 'money') score += 1;
  const worth = Math.log10(Math.max(10, item.cost || (item.passive && item.passive.unique ? 5000000 : 1000)));
  score += clamp(worth - 3, -1, 2.5);
  if (score >= 3.5) return 'loved';
  if (score >= 1) return 'liked';
  if (score > -1.5) return 'neutral';
  return 'disliked';
}

/**
 * Give something of yours away. What happens next depends on whether it
 * actually suits them and, if it does not, on how they feel about you: a
 * spouse or partner who loves you will often wear or use a gift they do not
 * privately care for rather than let you down, where anyone else just says
 * a polite nothing and puts it in a drawer.
 */
export function giveItem(state, rng, npc, itemId) {
  const entry = findEntry(state.character, itemId);
  if (!entry) return { ok: false, text: 'You do not have that.' };
  const item = getItem(itemId);
  removeItem(state.character, itemId, 1);
  npc.bag = npc.bag || [];

  const fit = giftFit(npc, item);
  const romantic = ['spouse', 'lover'].includes(npc.relation);
  const devoted = romantic && (npc.romance || 0) > 55 && (npc.closeness || 0) > 45;
  const blunt = (npc.tags || []).some((t) => t === 'honest' || t === 'blunt');

  let wears, closenessGain, trustGain, romanceGain = 0, text;
  if (fit === 'loved') {
    wears = true; closenessGain = rng.int(14, 22); trustGain = rng.int(6, 10);
    romanceGain = romantic ? rng.int(8, 14) : 0;
    text = `${npc.name} ${render(`{lights up|does not put it down for the rest of the day|says this is exactly right, and means it}.`, {}, rng)}`;
  } else if (fit === 'liked') {
    wears = true; closenessGain = rng.int(8, 14); trustGain = rng.int(3, 6);
    romanceGain = romantic ? rng.int(3, 7) : 0;
    text = `${npc.name} ${render(`{is genuinely pleased|thanks you properly|keeps it close}.`, {}, rng)}`;
  } else if (fit === 'neutral') {
    wears = devoted || rng.chance(0.35); closenessGain = rng.int(2, 6); trustGain = rng.int(0, 3);
    text = `${npc.name} ${render(`{takes it politely|is not sure what to make of it, but says thank you|puts it aside for now}.`, {}, rng)}`;
  } else if (devoted) {
    wears = true; closenessGain = rng.int(3, 8); trustGain = rng.int(2, 5); romanceGain = rng.int(1, 4);
    text = blunt
      ? `${npc.name} tells you, honestly, that it is not their taste - and wears it anyway, because you gave it to them.`
      : `${npc.name} ${render(`{smiles and says it is perfect, which is not quite true|wears it the very next day, for you|does not love it and will never once say so}.`, {}, rng)}`;
  } else {
    wears = false; closenessGain = blunt ? -2 : rng.int(-2, 1); trustGain = 0;
    text = blunt
      ? `${npc.name} looks at it and tells you, plainly, that it is not for them.`
      : `${npc.name} ${render(`{thanks you without much behind it|is polite about it and nothing more|puts it away and does not bring it up again}.`, {}, rng)}`;
  }

  npc.bag.push({ id: itemId, qty: 1, condition: entry.condition ?? 100, worn: wears, from: 'you', trueFeeling: fit });
  npc.closeness = clamp((npc.closeness || 0) + closenessGain, 0, 100);
  npc.trust = clamp((npc.trust ?? 30) + trustGain, 0, 100);
  if (romantic) npc.romance = clamp((npc.romance || 0) + romanceGain, 0, 100);
  return { ok: true, text, fit };
}

/** A fight wears things out. */
export function damageGear(character, rng, severity = 1) {
  ensureBag(character);
  const hits = [];
  for (const entry of character.bag) {
    if (!entry.worn) continue;
    const item = getItem(entry.id);
    if (!item || item.cat === 'consumable') continue;
    const loss = Math.round(rng.int(4, 18) * severity);
    entry.condition = clamp((entry.condition ?? 100) - loss, 0, 100);
    if (entry.condition <= 0) {
      hits.push(`Your ${item.name.toLowerCase()} is finished.`);
      entry.worn = false;
    } else if (entry.condition < 30 && rng.chance(0.4)) {
      hits.push(`Your ${item.name.toLowerCase()} will not survive another one of those.`);
    }
  }
  return hits;
}

/** Get something repaired, at a price that depends on where you are. */
export function repairItem(state, itemId) {
  const entry = findEntry(state.character, itemId);
  if (!entry) return { ok: false, text: 'You do not have that.' };
  const missing = 100 - (entry.condition ?? 100);
  if (missing <= 0) return { ok: false, text: 'It is fine as it is.' };
  const item = getItem(itemId);
  const planet = getPlace(state.character.placeId).planet;
  const cur = currencyFor(planet);
  // Good standing gets you a discount; being feared does not.
  const goodwill = clamp(1 - (state.character.karma || 0) / 300, 0.7, 1.2);
  const cost = Math.max(1, priceIn(Math.round((item.cost || 20000) * (missing / 100) * 0.5 * goodwill), cur.id));
  if (!canAfford(state.character, cur.id, cost)) {
    return { ok: false, text: `Putting it right costs ${formatMoney(cost, cur.id)}. You do not have it.` };
  }
  debit(state.character, cur.id, cost);
  entry.condition = 100;
  return { ok: true, text: `Repaired. ${formatMoney(cost, cur.id)}, and they were not pleased about the state of it.` };
}
