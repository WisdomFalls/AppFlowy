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
  // -------------------------------------------------- goods with an address
  { id: 'namek_jar', name: 'Sealed Water Jar', cat: 'consumable', cost: 400, use: { heal: 20 },
    desc: 'Namekians drink and nothing else. The water keeps for a century in these and tastes of the clay.' },
  { id: 'ajisa_seed', name: 'Ajisa Seedling', cat: 'treasure', cost: 1800, passive: { comfort: 3 },
    desc: 'The tree that grows everywhere on Namek and nowhere else. Elders give them to people they expect to see again.' },
  { id: 'yardrat_text', name: 'Yardrat Instruction Scroll', cat: 'gear', cost: 220000, passive: { learnMult: 1.3 },
    desc: 'Written in a script with no verbs. Reading it is most of the training.' },
  { id: 'spirit_silk', name: 'Spirit-Woven Cloth', cat: 'accessory', cost: 60000, wear: 'scarf', passive: { kiRegen: 3 },
    desc: 'Yardratian weave. It does not burn, and it is warm in the direction you are facing.' },
  { id: 'merit_sigil', name: 'Class Sigil', cat: 'accessory', cost: 40000, wear: 'necklace', passive: { standing: 6 },
    desc: 'Worn at the collar. It says what you were born as, which on this world is the whole conversation.' },
  { id: 'sadala_ration', name: 'Sadalan Field Ration', cat: 'consumable', cost: 900, use: { heal: 15 },
    desc: 'Dense, salty, and enough for a Saiyan, which means enough for nine of anybody else.' },
  { id: 'cereal_grain', name: 'Cereal Longgrain', cat: 'consumable', cost: 600, use: { heal: 12, happiness: 6 },
    desc: 'The crop the planet is named for. It survived the occupation. Most things did not.' },
  { id: 'force_rations', name: 'Force Field Rations', cat: 'consumable', cost: 1200, use: { heal: 18 },
    desc: 'Issued by the case. Nutritionally complete and actively unpleasant.' },
  { id: 'field_medkit', name: 'Regeneration Field Kit', cat: 'consumable', cost: 45000, use: { heal: 60 },
    desc: 'A tank in a box. Frieza Force issue, and the only genuinely good thing they make.' },
  { id: 'dragon_radar_kit', name: 'Radar Kit', cat: 'gear', cost: 500000, passive: { dragonSearch: 0.3 },
    desc: 'Capsule Corp sells the parts and a schematic. Assembling it is your problem.' },
  { id: 'pride_uniform', name: 'Pride Trooper Uniform', cat: 'accessory', cost: 80000, wear: 'cape', passive: { standing: 8 },
    desc: 'Universe 11 issue. Wearing one without the rank is a specific and named offence.' },
  { id: 'devotion_beads', name: 'Devotion Beads', cat: 'accessory', cost: 30000, wear: 'necklace', passive: { kiRegen: 2 },
    desc: 'Universe 10. One bead per year of discipline, and a god who counts them.' },
  { id: 'halo_polish', name: 'Halo Polish', cat: 'consumable', cost: 100, use: { happiness: 8 },
    desc: 'Sold in the Other World by somebody who has been dead a very long time and is bored.' },
  { id: 'z_sword', name: 'The Z-Sword', cat: 'weapon', weaponType: 'blade', cost: 0, passive: { attack: 25, unique: true },
    desc: 'Stuck in a rock on the Sacred World for generations. Heavier than it has any right to be.' },
  { id: 'power_pole', name: 'Power Pole', cat: 'weapon', weaponType: 'blunt', cost: 0, passive: { attack: 10, reach: 0.3 },
    desc: 'Extends from here to the Lookout, if you ask it nicely.' },
  // Weapons. Not what wins the fight by itself - a blade is a multiplier on
  // whoever is holding it, same as everything else in this game.
  { id: 'training_knife', name: 'Training Knife', cat: 'weapon', weaponType: 'blade', cost: 800, passive: { attack: 4 },
    desc: 'Dull enough to practise with, sharp enough to remind you not to.' },
  { id: 'scavenged_blaster', name: 'Scavenged Blaster', cat: 'weapon', weaponType: 'ranged', cost: 500, passive: { attack: 3 },
    desc: 'Off a body that did not need it any more. Fires maybe one time in three.' },
  { id: 'bo_staff', name: 'Bo Staff', cat: 'weapon', weaponType: 'blunt', cost: 1500, passive: { attack: 6 },
    desc: 'The oldest weapon there is: a stick, and someone who knows what to do with it.' },
  { id: 'chain_whip', name: 'Chain Whip', cat: 'weapon', weaponType: 'whip', cost: 2200, passive: { attack: 7, reach: 0.2 },
    desc: 'Wraps around a wrist, a neck, or an ankle to pull somebody off their feet, given the room to swing it.' },
  { id: 'hunting_blade', name: 'Hunting Blade', cat: 'weapon', weaponType: 'blade', cost: 3200, passive: { attack: 9 },
    desc: 'Balanced for throwing or holding. Whoever sold it to you asked no questions.' },
  { id: 'battle_gauntlets', name: 'Battle Gauntlets', cat: 'weapon', weaponType: 'gauntlet', cost: 6500, passive: { attack: 11 },
    desc: 'Plated knuckles and a reinforced forearm - still your own fists, just meaner ones.' },
  { id: 'dual_shortswords', name: 'Dual Shortswords', cat: 'weapon', weaponType: 'blade', cost: 12000, passive: { attack: 15 },
    desc: 'One in each hand, for someone who never learned to fight with just one.' },
  { id: 'plasma_pistol', name: 'Plasma Pistol', cat: 'weapon', weaponType: 'ranged', cost: 15000, passive: { attack: 13 },
    desc: 'Off-world tech, sold by someone who could not read the safety warnings either.' },
  { id: 'war_hammer', name: 'War Hammer', cat: 'weapon', weaponType: 'blunt', cost: 18000, passive: { attack: 20, speedPenalty: 3 },
    desc: 'Slow to swing and unarguable when it lands.' },
  { id: 'destructo_discs_kit', name: 'Throwing Disc Set', cat: 'weapon', weaponType: 'thrown', cost: 26000, passive: { attack: 14 },
    desc: 'Ki-edged and razor-thin. Cuts through nearly anything, including the wielder\'s confidence the first few tries.' },
  { id: 'energy_blaster', name: 'Energy Blaster', cat: 'weapon', weaponType: 'ranged', cost: 35000, passive: { attack: 17 },
    desc: 'A sidearm that does what a scouted-in ki blast does, for someone who has not got one yet.' },
  { id: 'battle_rifle', name: 'Frieza Force Battle Rifle', cat: 'weapon', weaponType: 'ranged', cost: 90000, passive: { attack: 30 },
    desc: 'Standard issue for the soldiers not expected to throw a punch. Loud, and it does not need to sleep.' },
  { id: 'ion_cannon', name: 'Ion Cannon', cat: 'weapon', weaponType: 'ranged', cost: 150000, passive: { attack: 42, speedPenalty: 4 },
    desc: 'Two hands, a shoulder brace, and a whine that builds for a full second before it fires. Nobody stands still for it twice.' },
  { id: 'namekian_spear', name: 'Namekian War Spear', cat: 'weapon', weaponType: 'blade', cost: 0, passive: { attack: 22 },
    desc: 'Grown, not forged, from the same stuff as a Namekian house. Reach nobody else\'s weapon has.' },

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
  { id: 'dragon_ball', name: 'A Dragon Ball', cat: 'treasure', cost: 0, passive: { unique: true },
    desc: 'One of seven. Warm to the touch, and worth more than anything else you will ever hold.' },
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
  // Worn things. Cheap, cosmetic, and drawn on you.
  { id: 'acc_headband', name: 'Headband', cat: 'accessory', cost: 1200, wear: 'headband', desc: 'Keeps the hair out of your eyes and the sweat out of the fight.' },
  { id: 'acc_bandana', name: 'Bandana', cat: 'accessory', cost: 900, wear: 'bandana', desc: 'Blue, knotted at the back, faintly piratical.' },
  { id: 'acc_glasses', name: 'Glasses', cat: 'accessory', cost: 6000, wear: 'glasses', desc: 'You did not need them until you started reading technique diagrams by candlelight.' },
  { id: 'acc_sunglasses', name: 'Sunglasses', cat: 'accessory', cost: 4000, wear: 'sunglasses', desc: 'For the Solar Flare, allegedly.' },
  { id: 'acc_earrings', name: 'Earrings', cat: 'accessory', cost: 15000, wear: 'earrings', desc: 'Not Potara. People will still ask.' },
  { id: 'acc_necklace', name: 'Necklace', cat: 'accessory', cost: 22000, wear: 'necklace', desc: 'A pendant on a chain. Somebody gave it to you, or you tell people somebody did.' },
  { id: 'acc_cape', name: 'Cape', cat: 'accessory', cost: 30000, wear: 'cape', desc: 'Weighted, if you want it weighted. Dramatic either way.' },
  { id: 'acc_scarf', name: 'Red scarf', cat: 'accessory', cost: 3500, wear: 'scarf', desc: 'Long enough to catch the wind when you land.' },
  { id: 'acc_wristbands', name: 'Wristbands', cat: 'accessory', cost: 2500, wear: 'wristbands', desc: 'Blue, thick, and heavier than they look.' },
  { id: 'acc_hat', name: 'Wide hat', cat: 'accessory', cost: 5000, wear: 'hat', desc: 'Shade in the wastelands and a target everywhere else.' },

  // Creature parts. Not sold anywhere - cost 0 keeps them off every shop
  // shelf (shopStock() drops anything free) - the only way to get one is to
  // go to Bestia Prime or Cinder Reach and take it off something that was
  // using it. Stack like a consumable so a hunt is worth doing more than
  // once, and turn into something worn by crafting rather than a purchase.
  { id: 'megafauna_hide', name: 'Megafauna Hide', cat: 'material', cost: 0,
    desc: 'Thick enough to turn a glancing hit. Whatever wore it did not need the extra help.' },
  { id: 'broken_fang', name: 'Broken Fang', cat: 'material', cost: 0,
    desc: 'Snapped off mid-bite, longer than a forearm, still sharp at the tip.' },
  { id: 'canopy_talon', name: 'Canopy Talon', cat: 'material', cost: 0,
    desc: 'Curved, black, and heavier than it looks. It went through bark like paper.' },
  { id: 'rockplate_hide', name: 'Rock-Plated Hide', cat: 'material', cost: 0,
    desc: 'Stone-grade scale, still warm from where it lived. Shrugged off actual lava.' },
  { id: 'ember_core', name: 'Ember Core', cat: 'material', cost: 0,
    desc: 'A knot of something that used to glow from the inside. It has not gone fully cold yet.' },

  // Crafted from the above at craft_trophy - not bought, made. passive.defence
  // is the same field clothing uses, and feeds combat power the same way.
  { id: 'hide_cloak', name: 'Megafauna Hide Cloak', cat: 'accessory', cost: 0, wear: 'cape',
    passive: { defence: 10 }, desc: 'Cured yourself, badly, and worn anyway. It has already stopped one hit that would not have missed otherwise.' },
  { id: 'fang_necklace', name: 'Fang Necklace', cat: 'accessory', cost: 0, wear: 'necklace',
    passive: { defence: 4 }, desc: 'Strung on cord you made yourself. People ask what it took to get it, and you tell them.' },
  { id: 'talon_bracers', name: 'Talon Bracers', cat: 'accessory', cost: 0, wear: 'wristbands',
    passive: { defence: 6 }, desc: 'Bound flat along the forearm. Turns a block into something the other guy feels.' },
  { id: 'rockplate_cloak', name: 'Rock-Plate Cloak', cat: 'accessory', cost: 0, wear: 'cape',
    passive: { defence: 18 }, desc: 'Overlapping plates off something that lived in the magma and did not mind it. Heavy. Worth it.' },
  { id: 'ember_pendant', name: 'Ember Pendant', cat: 'accessory', cost: 0, wear: 'necklace',
    passive: { defence: 8 }, desc: 'Set in a plain band so it cannot burn you. It is still faintly warm, years later.' },

  // Clothing with real weight to it - a style (what it is, for the shop
  // list and for anyone commissioning one), a slot (body/face/feet, so a
  // gi and a mask and a pair of boots do not fight each other for the same
  // spot), and passive.defence, which actually feeds combat power the same
  // way a weapon's attack already does.
  { id: 'plain_gi', name: 'Plain Gi', cat: 'clothing', style: 'gi', slot: 'body', cost: 8000,
    passive: { defence: 3 }, desc: 'Undyed cotton, no school marks. Anyone can wear one.' },
  { id: 'school_gi', name: 'School Gi', cat: 'clothing', style: 'gi', slot: 'body', cost: 28000,
    passive: { defence: 6 }, desc: 'Reinforced at the joints, cut for movement, and it says where you trained.' },
  { id: 'light_armour', name: 'Light Combat Armour', cat: 'clothing', style: 'armour', slot: 'body', cost: 65000,
    passive: { defence: 16 }, desc: 'Plates over mesh. Slows nothing down and stops most of what a fist can do.' },
  { id: 'heavy_armour', name: 'Heavy Plate Armour', cat: 'clothing', style: 'armour', slot: 'body', cost: 180000,
    passive: { defence: 30 }, desc: 'Built to stop a blade or a blast outright. You feel every kilo of it.' },
  { id: 'casual_wear', name: 'Casual Wear', cat: 'clothing', style: 'casual', slot: 'body', cost: 4000,
    passive: { defence: 1 }, desc: 'What you wear when nobody is trying to kill you. Most days, that is most days.' },
  { id: 'combat_mask', name: 'Combat Mask', cat: 'clothing', style: 'face', slot: 'face', cost: 22000,
    passive: { defence: 5 }, desc: 'Covers everything but the eyes. Nobody relaxes around a fighter wearing one.' },
  { id: 'breather_visor', name: 'Breather Visor', cat: 'clothing', style: 'face', slot: 'face', cost: 45000,
    passive: { defence: 4 }, desc: 'Filters vacuum and worse. Standard for anyone who fights off-world often.' },
  { id: 'combat_boots', name: 'Combat Boots', cat: 'clothing', style: 'shoes', slot: 'feet', cost: 12000,
    passive: { defence: 3 }, desc: 'Grip on anything, and they do not come off in a fight.' },
  { id: 'reinforced_greaves', name: 'Reinforced Greaves', cat: 'clothing', style: 'shoes', slot: 'feet', cost: 38000,
    passive: { defence: 9 }, desc: 'Plated to the shin. Kicking something no longer costs you anything.' },

  // Things you cannot buy. They arrive when you earn them.
  { id: 'championship_belt', name: 'World Championship Belt', cat: 'trophy', cost: 0, wear: 'belt', passive: { fame: 6 },
    desc: 'Heavy, gold, and yours until somebody takes it.' },
  { id: 'turtle_shell', name: 'Turtle Shell', cat: 'gear', cost: 0, wear: 'shell', passive: { trainMult: 1.3, speedPenalty: 6 },
    desc: 'Twenty kilos of shell strapped to your back. Master Roshi says you will thank him.' },
  { id: 'cyber_eye', name: 'Mechanical Eye', cat: 'gear', cost: 400000, passive: { senseBonus: 0.3 },
    desc: 'Built to replace the one you lost. It reads power levels, badly.' },
  { id: 'fruit_of_might', name: 'Fruit of the Tree of Might', cat: 'consumable', cost: 0, use: { powerMult: 1.6, karma: -10 },
    desc: 'A whole world\'s life energy in one piece of fruit. It tastes of everything that died.' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

// Goods you can only buy in one place. A shop that sells the same six things
// on every world is not a shop, it is a menu; these are the things a world
// makes for itself.
export const LOCAL_GOODS = {
  earth: ['capsule_house', 'dragon_radar_kit'],
  planet_vegeta: ['battle_armour', 'scouter', 'attack_ball', 'merit_sigil'],
  sadala: ['battle_armour', 'sadala_ration'],
  namek: ['namek_jar', 'ajisa_seed', 'namekian_spear'],
  new_namek: ['namek_jar', 'ajisa_seed', 'namekian_spear'],
  yardrat: ['yardrat_text', 'spirit_silk'],
  cereal: ['cereal_grain'],
  frieza_79: ['scouter', 'battle_armour', 'force_rations', 'field_medkit', 'battle_rifle'],
  u11_world: ['pride_uniform'],
  u10_world: ['devotion_beads'],
  otherworld: ['halo_polish'],
};

export function getItem(id) {
  return ITEM_BY_ID[id];
}

export function shopStock(placeTags, planetId) {
  const local = (LOCAL_GOODS[planetId] || []).map((id) => ITEM_BY_ID[id]).filter(Boolean);
  // What a world sells is what a world has. Nobody on Namek stocks a hovercar,
  // and the Frieza Force does not sell you a Flying Nimbus.
  const off = {
    namek: ['transport', 'property', 'accessory'],
    new_namek: ['transport', 'property'],
    void: ['property'],
    otherworld: ['transport', 'property', 'gear', 'accessory', 'weapon'],
    planet_vegeta: ['property', 'accessory'],
    yardrat: ['transport', 'property'],
  }[planetId] || [];
  const general = ITEMS.filter((i) => {
    // Something another world makes for itself is not on the shelf here.
    const madeElsewhere = Object.entries(LOCAL_GOODS)
      .some(([pid, ids]) => pid !== planetId && ids.includes(i.id) && !(LOCAL_GOODS[planetId] || []).includes(i.id));
    if (madeElsewhere) return false;
    if (off.includes(i.cat)) return false;
    if (i.cost === 0) return false;
    if (i.cat === 'accessory' && !placeTags.includes('civilised') && !placeTags.includes('urban') && !placeTags.includes('tournament')) return false;
    if (i.id === 'cyber_eye' && !placeTags.includes('lab') && !placeTags.includes('tech')) return false;
    if (i.cat === 'property' && !placeTags.includes('civilised') && !placeTags.includes('urban')) return false;
    if ((i.id === 'scouter' || i.id === 'battle_armour') && !placeTags.includes('imperial') && !placeTags.includes('tech')) return false;
    if ((i.id === 'gravity_chamber' || i.id === 'spaceship' || i.id === 'gravity_capsule') && !placeTags.includes('tech')) return false;
    if (i.cat === 'weapon' && !placeTags.includes('civilised') && !placeTags.includes('urban') && !placeTags.includes('tournament') && !placeTags.includes('imperial')) return false;
    if ((i.weaponType === 'ranged') && !placeTags.includes('tech') && !placeTags.includes('imperial')) return false;
    return true;
  });
  // Local goods first: they are the reason to shop here rather than anywhere.
  return local.concat(general.filter((i) => !local.includes(i)));
}

// Wishes the Dragon Balls can grant. `power` is what a dragon has to be able
// to manage: Shenron cannot exceed his creator, Porunga is stronger and speaks
// three times, and Super Shenron does whatever is asked without comment.
export const DRAGONS = {
  shenron: { id: 'shenron', name: 'Shenron', power: 3, wishes: 1, voice: 'a voice like a landslide', desc: 'Earth\'s dragon. One wish, within the power of the one who made him.' },
  porunga: { id: 'porunga', name: 'Porunga', power: 4, wishes: 3, voice: 'a voice that is mostly chest', desc: 'Namek\'s dragon. Three wishes, one soul at a time, in the Namekian tongue.' },
  super: { id: 'super', name: 'Super Shenron', power: 6, wishes: 1, voice: 'no voice at all, only the wish coming true', desc: 'The dragon of the Super Dragon Balls. Anything. Once.' },
};

export const WISH_GROUPS = ['Life and death', 'Yourself', 'The world', 'Other people', 'Small things'];

export const WISHES = [
  // ------------------------------------------------------ life and death
  { id: 'revive_named', group: 'Life and death', name: 'Bring back someone by name', power: 2, karma: 6,
    desc: 'Say the name. They come back exactly as they were, minus the dying.', pick: 'dead' },
  { id: 'revive_many', group: 'Life and death', name: 'Revive everyone killed by one thing', power: 4, karma: 15,
    desc: 'A whole planet, if the dragon is strong enough. Porunga will not; Shenron might.' },
  { id: 'revive_all', group: 'Life and death', name: 'Undo every death you have caused', power: 4, karma: 30,
    desc: 'Everyone you killed. All of them. The dragon does not ask why.', needs: 'kills' },
  { id: 'immortality', group: 'Life and death', name: 'Eternal life', power: 5, karma: -8,
    desc: 'You will not age and you cannot die of it. Everything else still applies, and the gods notice.' },
  { id: 'youth', group: 'Life and death', name: 'Twenty years back', power: 3, karma: 0,
    desc: 'Twenty years off the clock, with everything you learned still in there.' },
  { id: 'cure', group: 'Life and death', name: 'Make me whole', power: 2, karma: 0,
    desc: 'Every scar, every old injury, every lost piece. Gone, as though it never happened.', needs: 'scars' },

  // ------------------------------------------------------------ yourself
  { id: 'power_up', group: 'Yourself', name: 'Make me the strongest in the universe', power: 5, karma: -6,
    desc: 'The dragon takes the years off the end to pay for it.' },
  { id: 'unlock_potential', group: 'Yourself', name: 'Unlock all my latent potential', power: 4, karma: 0,
    desc: 'Everything you could ever have been, available now.' },
  { id: 'next_form', group: 'Yourself', name: 'Give me the next transformation', power: 3, karma: -2,
    desc: 'The form you are reaching for, handed over. It will feel unearned because it is.' },
  { id: 'knowledge', group: 'Yourself', name: 'Teach me a technique', power: 2, karma: 0,
    desc: 'The dragon can put anything anyone has ever known into your head.' },
  { id: 'change_race', group: 'Yourself', name: 'Make me a different species', power: 5, karma: -3,
    desc: 'Saiyan, Namekian, whatever you have envied. Your body reorganises. Your memories stay.', pick: 'race' },
  { id: 'know_everyone', group: 'Yourself', name: 'Let me see everyone as they are', power: 3, karma: -4,
    desc: 'Every person you know, fully understood. Their strength, their secrets, what they want. It is a violation and it works.' },
  { id: 'tail_back', group: 'Yourself', name: 'Give me back my tail', power: 1, karma: 0, race: ['saiyan', 'halfsaiyan'],
    desc: 'It grows back stronger, apparently.' },
  { id: 'erase_memory', group: 'Yourself', name: 'Erase all memory of me', power: 3, karma: -4,
    desc: 'Nobody will remember what you did. Nobody at all.' },

  // ----------------------------------------------------------- the world
  { id: 'restore_planet', group: 'The world', name: 'Restore a destroyed world', power: 5, karma: 20,
    desc: 'Rock, water, air. The people are a separate wish.' },
  { id: 'restore_people', group: 'The world', name: 'Bring back a dead world\'s people', power: 5, karma: 25,
    desc: 'Everyone who was on it when it went. Porunga did this once. Shenron cannot.', needs: 'planet_restored' },
  { id: 'remove_threat', group: 'The world', name: 'Send a tyrant somewhere they cannot come back from', power: 5, karma: 12,
    desc: 'Name the one you mean. If they are stronger than the dragon\'s maker, the dragon says so and waits.', pick: 'threat' },
  { id: 'peace', group: 'The world', name: 'Peace on this world', power: 4, karma: 18,
    desc: 'The wars stop. The tyrants find they no longer want to. It lasts a generation, then people are people again.' },
  { id: 'own_world', group: 'The world', name: 'A world of my own', power: 4, karma: -2,
    desc: 'Empty, habitable, and yours. Nobody to rule, unless you bring them.' },
  { id: 'wealth', group: 'The world', name: 'Unimaginable wealth', power: 1, karma: -2,
    desc: 'Vulgar, but it works.' },

  // -------------------------------------------------------- other people
  { id: 'for_someone', group: 'Other people', name: 'Grant what someone else wants', power: 3, karma: 14,
    desc: 'You know what they have been chasing. Give it to them instead of yourself.', pick: 'living' },
  { id: 'partner', group: 'Other people', name: 'Someone to love me', power: 3, karma: -10,
    desc: 'The dragon will make somebody. They will love you and they will know why, and so will you.' },
  { id: 'strengthen_ally', group: 'Other people', name: 'Make a friend strong enough to stand beside me', power: 4, karma: 4,
    desc: 'Pick them. They wake up a hundred times what they were and have to learn to live in it.', pick: 'living' },

  // -------------------------------------------------------- small things
  { id: 'feast', group: 'Small things', name: 'The best meal of my life', power: 1, karma: 0,
    desc: 'Forty courses. Somebody will be furious you spent it on this.' },
  { id: 'better_underwear', group: 'Small things', name: 'A really nice pair of underwear', power: 1, karma: 0,
    desc: 'Someone genuinely did this once. Shenron granted it without comment.' },
  { id: 'speak', group: 'Small things', name: 'Say it in your own words', power: 0, karma: 0, freeText: true,
    desc: 'Speak the wish aloud. The dragon will interpret, and dragons are literal.' },
];

export const WISH_BY_ID = Object.fromEntries(WISHES.map((w) => [w.id, w]));

/**
 * Map a spoken wish onto the nearest thing a dragon can do. This is the
 * fallback when no model is connected; a dragon is a literal creature, so
 * keyword matching is honestly not far from the source material.
 */
export function interpretWishLocally(text) {
  const t = String(text || '').toLowerCase();
  const rules = [
    [/\bbring\b[\s\S]{0,30}\bback\b|\brevive\b|\bresurrect|\balive again\b|\bback to life\b|\bundo\b[\s\S]{0,20}\bdeath\b|\bnot be dead\b/, 'revive_named'],
    [/\beveryone\b[\s\S]{0,30}\b(back|alive)\b|\ball of them\b|\bevery(one| person) (who|that) died\b/, 'revive_many'],
    [/\bimmortal|\bnever die\b|\blive forever\b|\beternal life\b/, 'immortality'],
    [/\byoung|\byouth|\byears back\b|\bage\b.*\bback/, 'youth'],
    [/\bheal|\bscar|\bwhole again\b|\bmy eye\b|\bmy arm\b|\binjur/, 'cure'],
    [/\bstrongest\b|\bmost powerful\b|\bpower level\b|\bstronger\b/, 'power_up'],
    [/\bpotential\b/, 'unlock_potential'],
    [/\btransform|\bsuper saiyan\b|\bform\b/, 'next_form'],
    [/\bteach|\btechnique|\bkamehameha|\binstant transmission\b|\blearn\b/, 'knowledge'],
    [/\bmake me (a|an) (saiyan|namekian|human|earthling|android|majin|frost|kai)|\bturn me into\b|\bdifferent species\b|\bbecome a\b/, 'change_race'],
    [/\bknow everything\b|\bsecrets\b|\bsee everyone\b|\btruth about\b/, 'know_everyone'],
    [/\btail\b/, 'tail_back'],
    [/\bforget me\b|\bforgotten\b|\bnobody remember/, 'erase_memory'],
    [/\brestore\b.*\b(planet|world)|\bplanet\b.*\bback\b|\bnamek\b.*\bback\b|\bvegeta\b.*\bback\b/, 'restore_planet'],
    [/\bpeople of\b|\bpopulation\b|\bthe namekians\b|\bthe saiyans back\b/, 'restore_people'],
    [/\bkill\b|\bdestroy\b|\bget rid of\b|\bbanish|\bfrieza\b|\bcell\b|\bbuu\b|\bsend .* away\b/, 'remove_threat'],
    [/\bpeace\b|\bend (the )?war|\bno more fighting\b/, 'peace'],
    [/\bplanet of my own\b|\bmy own (planet|world)\b|\ba world\b/, 'own_world'],
    [/\brich\b|\bmoney\b|\bzeni\b|\bwealth|\bgold\b/, 'wealth'],
    [/\blove me\b|\bsomeone to love\b|\bwife\b|\bhusband\b|\bpartner\b|\bgirlfriend\b|\bboyfriend\b/, 'partner'],
    [/\bmake .* strong|\bfor (my|him|her|them)\b.*\bstrong/, 'strengthen_ally'],
    [/\bfor (him|her|them|my)\b|\bwhat (he|she|they) want/, 'for_someone'],
    [/\bfood\b|\beat\b|\bmeal\b|\bfeast\b|\bhungry\b/, 'feast'],
    [/\bunderwear\b|\bpanties\b|\bpants\b/, 'better_underwear'],
  ];
  // "everyone" beats "bring back one", so the broader rules are checked first.
  const broad = rules.filter(([, id]) => id === 'revive_many' || id === 'revive_all');
  for (const [re, id] of broad) if (re.test(t)) return id;
  for (const [re, id] of rules) if (re.test(t)) return id;
  return null;
}
