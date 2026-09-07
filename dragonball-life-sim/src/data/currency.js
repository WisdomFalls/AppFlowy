// Money is local.
//
// Zeni is Earth's currency. It is not the galaxy's, and a Saiyan on Planet
// Vegeta in Age 730 had never seen a note of it. Every world in play has
// something it settles debts in, drawn from what that place actually values,
// and converting between them costs you.

export const CURRENCIES = {
  zeni: {
    id: 'zeni', name: 'Zeni', short: 'Z', rate: 1,
    desc: 'Earth\'s money. Paper, coins, and a bank that will not take anything else.',
    where: 'Earth and anywhere Capsule Corporation trades.',
  },
  merit: {
    id: 'merit', name: 'Battle Merit', short: 'BM', rate: 320,
    desc: 'What the Saiyan army paid in: recorded kills, worlds taken, ranks earned. It buys armour, pods, and the right to be spoken to.',
    where: 'Planet Vegeta, Sadala, and any Saiyan settlement since.',
  },
  scrip: {
    id: 'scrip', name: 'Force Scrip', short: 'FS', rate: 180,
    desc: 'Frieza Force pay. Redeemable at any garrison, worthless the moment the garrison falls.',
    where: 'Frieza Force worlds and the ships between them.',
  },
  water: {
    id: 'water', name: 'Sacred Water', short: 'SW', rate: 900,
    desc: 'Namekians do not trade in money. They trade in what keeps a village alive through a dry season.',
    where: 'Namek and New Namek.',
  },
  shard: {
    id: 'shard', name: 'Katchin Shard', short: 'KS', rate: 2400,
    desc: 'The hardest substance there is, cut into weights. Nobody can forge it, which is the entire point.',
    where: 'Yardrat, the deep worlds, and anywhere that does not trust paper.',
  },
  favour: {
    id: 'favour', name: 'Standing', short: 'ST', rate: 0,
    desc: 'What the Other World runs on. It cannot be carried, spent twice, or stolen.',
    where: 'The Other World, where money is meaningless and reputation is not.',
  },
};

/** What a given world settles in. */
export const PLANET_CURRENCY = {
  earth: 'zeni',
  planet_vegeta: 'merit',
  sadala: 'merit',
  namek: 'water',
  new_namek: 'water',
  yardrat: 'shard',
  cereal: 'shard',
  frieza_79: 'scrip',
  frost_belt: 'scrip',
  void: 'scrip',
  otherworld: 'favour',
  // The universes next door run on their own paperwork.
  u11_world: 'favour',
  u10_world: 'favour',
};

export function currencyFor(planetId) {
  return CURRENCIES[PLANET_CURRENCY[planetId] || 'zeni'];
}

export function getCurrency(id) {
  return CURRENCIES[id] || CURRENCIES.zeni;
}

/** A purse always holds every currency; most balances are just zero. */
export function emptyPurse() {
  const out = {};
  for (const id of Object.keys(CURRENCIES)) out[id] = 0;
  return out;
}

export function balance(character, currencyId) {
  if (!character.purse) return currencyId === 'zeni' ? (character.zeni || 0) : 0;
  return character.purse[currencyId] || 0;
}

export function credit(character, currencyId, amount) {
  character.purse = character.purse || emptyPurse();
  character.purse[currencyId] = Math.max(0, (character.purse[currencyId] || 0) + amount);
  if (currencyId === 'zeni') character.zeni = character.purse.zeni;
  return character.purse[currencyId];
}

export function debit(character, currencyId, amount) {
  return credit(character, currencyId, -amount);
}

export function canAfford(character, currencyId, amount) {
  return balance(character, currencyId) >= amount;
}

/**
 * What something costs here. Prices are authored in Zeni because that is the
 * scale everything else in the game already uses; a world's own currency is
 * worth more per unit, so the number on the tag is smaller.
 */
export function priceIn(zeniPrice, currencyId) {
  const cur = getCurrency(currencyId);
  if (!cur.rate) return 0;
  return Math.max(1, Math.round(zeniPrice / cur.rate));
}

export function formatMoney(amount, currencyId) {
  const cur = getCurrency(currencyId);
  const v = Math.round(amount);
  if (cur.id === 'zeni') {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2).replace(/\.?0+$/, '')}B Zeni`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2).replace(/\.?0+$/, '')}M Zeni`;
    return `${v.toLocaleString('en-US')} Zeni`;
  }
  return `${v.toLocaleString('en-US')} ${cur.name}${Math.abs(v) === 1 ? '' : 's'}`;
}

/**
 * Changing money. Nobody does this for free, and the further the two worlds
 * are from each other's economies the worse the spread.
 */
export function exchange(character, fromId, toId, amount) {
  const from = getCurrency(fromId);
  const to = getCurrency(toId);
  if (!from.rate || !to.rate) return { ok: false, reason: 'That cannot be exchanged for anything.' };
  if (!canAfford(character, fromId, amount)) return { ok: false, reason: `You do not have ${formatMoney(amount, fromId)}.` };
  const inZeni = amount * from.rate;
  const cut = 0.18;
  const got = Math.floor((inZeni * (1 - cut)) / to.rate);
  if (got < 1) return { ok: false, reason: 'Not enough to be worth changing.' };
  debit(character, fromId, amount);
  credit(character, toId, got);
  return { ok: true, got, cut, text: `${formatMoney(amount, fromId)} becomes ${formatMoney(got, toId)}. The changer keeps the rest.` };
}
