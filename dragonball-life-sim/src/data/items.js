// Assets, gear and consumables. `effect` is applied by the engine when owned
// (passive) or used (consumable).

export const ITEMS = [
  // Training gear
  { id: 'weighted_clothing', name: 'Weighted Training Gi', cat: 'gear', cost: 25000, passive: { trainMult: 1.25, speedPenalty: 4 },
    desc: 'Turtle School standard issue. The undershirt alone weighs more than you do.' },
  { id: 'heavy_weights', name: 'King Kai Weight Set', cat: 'gear', cost: 90000, passive: { trainMult: 1.4, speedPenalty: 8 },
    desc: 'Designed for ten times gravity. On Earth it is simply cruel.' },
  { id: 'gravity_chamber', name: 'Gravity Chamber', cat: 'property', cost: 4000000, passive: { trainMult: 2.1, injuryRisk: 0.08 },
    desc: 'Up to 500g in a room the size of a garage. Capsule Corp will not insure it.' },
  { id: 'gravity_capsule', name: 'Portable Gravity Capsule', cat: 'gear', cost: 900000, passive: { trainMult: 1.6, injuryRisk: 0.04 },
    desc: 'A one-person pod. Cramped, loud, extremely effective.' },
  { id: 'scouter', name: 'Scouter', cat: 'gear', cost: 60000, passive: { senseBonus: 0.5, scoutPower: true },
    desc: 'Reads power levels, transmits everything you see to whoever issued it.' },
  { id: 'battle_armour', name: 'Saiyan Battle Armour', cat: 'gear', cost: 120000, passive: { defence: 12, stretch: true },
    desc: 'Stretches to any size, survives most things, and never quite fits over the shoulders.' },
  { id: 'z_sword', name: 'The Z-Sword', cat: 'gear', cost: 0, passive: { attack: 25, unique: true },
    desc: 'Stuck in a rock on the Sacred World for generations. Heavier than it has any right to be.' },
  { id: 'power_pole', name: 'Power Pole', cat: 'gear', cost: 0, passive: { attack: 10, reach: 0.3 },
    desc: 'Extends from here to the Lookout, if you ask it nicely.' },

  // Transport
  { id: 'hovercar', name: 'Hovercar', cat: 'transport', cost: 180000, passive: { travel: 1 }, desc: 'Standard, dull, reliable.' },
  { id: 'capsule_jet', name: 'Capsule Jet', cat: 'transport', cost: 700000, passive: { travel: 2 }, desc: 'Folds into a pill. Unfolds at eight hundred kilometres an hour.' },
  { id: 'flying_nimbus', name: 'Flying Nimbus', cat: 'transport', cost: 0, passive: { travel: 2, goodOnly: true },
    desc: 'A small yellow cloud that will drop you through it if your heart is impure.' },
  { id: 'spaceship', name: 'Capsule Spaceship', cat: 'transport', cost: 9000000, passive: { travel: 4, space: true },
    desc: 'Interstellar, with a gravity setting and a very small kitchen.' },
  { id: 'attack_ball', name: 'Saiyan Attack Ball', cat: 'transport', cost: 2000000, passive: { travel: 3, space: true },
    desc: 'A one-seat pod that lands by cratering. Bring a helmet.' },

  // Property
  { id: 'capsule_house', name: 'Capsule House', cat: 'property', cost: 350000, passive: { comfort: 8 }, desc: 'A whole house in your pocket, assuming you remember which pocket.' },
  { id: 'mountain_home', name: 'Mountain Home', cat: 'property', cost: 900000, passive: { comfort: 12, trainMult: 1.15 }, desc: 'Deep in the woods, no neighbours, excellent for shouting.' },
  { id: 'city_apartment', name: 'City Apartment', cat: 'property', cost: 600000, passive: { comfort: 10, social: 5 }, desc: 'Forty floors up, and the neighbours complain about the training.' },
  { id: 'dojo_property', name: 'Private Dojo', cat: 'property', cost: 2500000, passive: { comfort: 10, trainMult: 1.3, income: 40000 }, desc: 'Your own school, your own rules, your own leaking roof.' },
  { id: 'island', name: 'Private Island', cat: 'property', cost: 30000000, passive: { comfort: 25, trainMult: 1.2, fame: 8 }, desc: 'Nobody within a hundred kilometres to complain about the craters.' },

  // Consumables
  { id: 'senzu', name: 'Senzu Bean', cat: 'consumable', cost: 0, use: { healFull: true, kiFull: true },
    desc: 'Heals everything, feeds you for ten days, tastes of nothing at all.' },
  { id: 'medicine', name: 'Emergency Medicine', cat: 'consumable', cost: 8000, use: { heal: 35 },
    desc: 'A field kit. Better than nothing, worse than a bean.' },
  { id: 'dragon_radar', name: 'Dragon Radar', cat: 'gear', cost: 0, passive: { dragonSearch: 0.45 },
    desc: 'A palm-sized dish that blips at anything with seven stars in it.' },
  { id: 'potara', name: 'Potara Earrings', cat: 'gear', cost: 0, passive: { potara: true },
    desc: 'A matched pair. Wear one, hand over the other, and hope you get on.' },
  { id: 'time_ring', name: 'Time Ring', cat: 'gear', cost: 0, passive: { timeTravel: true, unique: true },
    desc: 'Forbidden to everyone below Supreme Kai. Rings on the finger of anyone who breaks time.' },
  { id: 'sacred_water', name: 'Ultra Divine Water', cat: 'consumable', cost: 0, use: { unlockPotential: 0.5, deathRisk: 0.35 },
    desc: 'Drink it and either your latent power comes out or you do not.' },
  { id: 'fruit_of_might', name: 'Fruit of the Tree of Might', cat: 'consumable', cost: 0, use: { powerMult: 1.6, karma: -10 },
    desc: 'A whole world\'s life energy in one piece of fruit. It tastes of everything that died.' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export function getItem(id) {
  return ITEM_BY_ID[id];
}

export function shopStock(placeTags) {
  return ITEMS.filter((i) => {
    if (i.cost === 0) return false;
    if (i.cat === 'property' && !placeTags.includes('civilised') && !placeTags.includes('urban')) return false;
    if ((i.id === 'scouter' || i.id === 'battle_armour') && !placeTags.includes('imperial') && !placeTags.includes('tech')) return false;
    if ((i.id === 'gravity_chamber' || i.id === 'spaceship' || i.id === 'gravity_capsule') && !placeTags.includes('tech')) return false;
    return true;
  });
}

// Wishes the Dragon Balls can grant. `power` is what the summoned dragon can
// actually manage; Shenron cannot exceed his creator.
export const WISHES = [
  { id: 'revive_one', name: 'Revive one person', power: 2, karma: 6, desc: 'Name them. They come back exactly as they were.' },
  { id: 'revive_many', name: 'Revive everyone killed by one thing', power: 4, karma: 15, desc: 'A whole planet, if the dragon is strong enough.' },
  { id: 'wealth', name: 'Unimaginable wealth', power: 1, karma: -2, desc: 'Vulgar, but it works.' },
  { id: 'immortality', name: 'Eternal life', power: 5, karma: -8, desc: 'You will not age and you cannot die of it. Everything else still applies.' },
  { id: 'power_up', name: 'Make me the strongest in the universe', power: 5, karma: -6, cost: 'years', desc: 'The dragon will take the years off the end to pay for it.' },
  { id: 'unlock_potential', name: 'Unlock all my latent potential', power: 4, karma: 0, desc: 'Everything you could ever have been, available now.' },
  { id: 'restore_planet', name: 'Restore a destroyed world', power: 5, karma: 20, desc: 'Rock, water, air. The people are a separate wish.' },
  { id: 'youth', name: 'Restore my youth', power: 3, karma: 0, desc: 'Twenty years back on the clock.' },
  { id: 'knowledge', name: 'Teach me a technique', power: 2, karma: 0, desc: 'The dragon can put anything anyone has ever known into your head.' },
  { id: 'erase_memory', name: 'Erase all memory of me', power: 3, karma: -4, desc: 'Nobody will remember what you did. Nobody at all.' },
  { id: 'tail_back', name: 'Give me back my tail', power: 1, karma: 0, race: ['saiyan', 'halfsaiyan'], desc: 'It grows back stronger, apparently.' },
  { id: 'better_underwear', name: 'A really nice pair of underwear', power: 1, karma: 0, desc: 'Someone genuinely did this once. Shenron granted it without comment.' },
];
