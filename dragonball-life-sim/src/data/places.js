// Locations. `danger` drives encounter lethality, `tags` gate events, and
// `training` is the multiplier for training done here.

export const PLACES = [
  // Earth
  { id: 'east_city', name: 'East City', planet: 'earth', danger: 1, training: 1.0, tags: ['urban', 'civilised', 'jobs'], desc: 'Neon, noodle stands, and a hover-traffic problem.' },
  { id: 'west_city', name: 'West City', planet: 'earth', danger: 1, training: 1.0, tags: ['urban', 'civilised', 'jobs', 'tech'], desc: 'Capsule Corporation money, everywhere you look.' },
  { id: 'satan_city', name: 'Satan City', planet: 'earth', danger: 1, training: 1.1, tags: ['urban', 'civilised', 'jobs', 'fame'], desc: 'Renamed after a man who mostly got lucky. He is beloved anyway.' },
  { id: 'paozu', name: 'Mount Paozu', planet: 'earth', danger: 2, training: 1.35, tags: ['wild', 'quiet', 'forest'], desc: 'Deep forest, dinosaurs, and nobody to bother you for a hundred kilometres.' },
  { id: 'kame_house', name: 'Kame House', planet: 'earth', danger: 1, training: 1.5, tags: ['dojo', 'coast', 'mentor'], desc: 'A pink house on a tiny island, containing the strongest man on Earth and his magazines.' },
  { id: 'korin_tower', name: 'Korin Tower', planet: 'earth', danger: 2, training: 1.7, tags: ['dojo', 'sacred', 'senzu'], desc: 'A stone pillar into the clouds with a cat at the top who does not explain himself.' },
  { id: 'lookout', name: "Kami's Lookout", planet: 'earth', danger: 1, training: 2.0, tags: ['sacred', 'divine', 'chamber'], desc: 'A floating tile platform above the world, and the door to the Time Chamber.' },
  { id: 'time_chamber', name: 'Hyperbolic Time Chamber', planet: 'earth', danger: 4, training: 12.0, tags: ['sacred', 'extreme', 'chamber'], desc: 'A year inside for a day outside. White in every direction, and the air fights you.' },
  { id: 'wastes', name: 'The Wastelands', planet: 'earth', danger: 4, training: 1.6, tags: ['wild', 'ruins', 'battlefield'], desc: 'Cracked rock and craters. Every important fight seems to end up here.' },
  { id: 'papaya', name: 'Papaya Island', planet: 'earth', danger: 2, training: 1.2, tags: ['tournament', 'coast'], desc: 'Home of the World Martial Arts Tournament and its extremely fragile ring.' },
  { id: 'penguin_village', name: 'Penguin Village', planet: 'earth', danger: 1, training: 0.7, tags: ['strange', 'comedy'], desc: 'The physics here are wrong and everybody seems fine with it.' },
  { id: 'red_ribbon_lab', name: 'Red Ribbon Laboratory', planet: 'earth', danger: 5, training: 1.3, tags: ['tech', 'evil', 'lab'], desc: 'Buried under a mountain, still humming decades after the army fell.' },
  { id: 'capsule_corp', name: 'Capsule Corporation', planet: 'earth', danger: 1, training: 2.2, tags: ['tech', 'jobs', 'gravity', 'urban'], desc: 'The gravity chamber in the back garden has killed better warriors than you.' },
  { id: 'yunzabit', name: 'Yunzabit Heights', planet: 'earth', danger: 3, training: 1.4, tags: ['wild', 'cold', 'namek'], desc: 'Where the ship landed. Cold, empty, and full of old Namekian ghosts.' },
  { id: 'devils_hand', name: "Devil's Hand", planet: 'earth', danger: 4, training: 1.5, tags: ['wild', 'cursed'], desc: 'A stone claw reaching out of the sea. Things live in the water here.' },

  // Space
  { id: 'planet_vegeta', name: 'Planet Vegeta', planet: 'planet_vegeta', danger: 5, training: 1.9, tags: ['saiyan', 'highgrav', 'doomed'], desc: 'Ten times Earth gravity and a culture that solves everything by hitting it.' },
  { id: 'sadala', name: 'Planet Sadala', planet: 'sadala', danger: 4, training: 1.9, tags: ['saiyan', 'highgrav', 'u6', 'academy'], desc: 'The Saiyan homeworld that never blew up, in a universe next door - and the one place in known space that turned fighting into a curriculum.' },
  { id: 'frost_belt', name: 'The Frost Belt', planet: 'frost_belt', danger: 6, training: 1.7, tags: ['imperial', 'evil', 'jobs', 'u6', 'corporate'], desc: 'Frost Enterprises, in the flesh: gleaming reception halls over sub-levels the tours never reach.' },
  { id: 'namek', name: 'Planet Namek', planet: 'namek', danger: 3, training: 1.5, tags: ['namek', 'dragonballs', 'peaceful'], desc: 'Green sky, blue grass, three suns and no night at all.' },
  { id: 'new_namek', name: 'New Namek', planet: 'new_namek', danger: 2, training: 1.5, tags: ['namek', 'dragonballs', 'peaceful'], desc: 'They rebuilt. Same grass, same sky, better security.' },
  { id: 'frieza_ship', name: "Frieza's Flagship", planet: 'void', danger: 6, training: 1.7, tags: ['imperial', 'evil', 'jobs'], desc: 'Corridors of purple metal and a throne that hovers.' },
  { id: 'planet_frieza_79', name: 'Planet Frieza 79', planet: 'frieza_79', danger: 5, training: 1.8, tags: ['imperial', 'jobs', 'highgrav'], desc: 'One of hundreds of identical garrison worlds, numbered rather than named.' },
  { id: 'yardrat', name: 'Planet Yardrat', planet: 'yardrat', danger: 2, training: 2.1, tags: ['spirit', 'teachers', 'quiet'], desc: 'Small people, enormous techniques, and an unshakeable calm about all of it.' },
  { id: 'cereal', name: 'Planet Cereal', planet: 'cereal', danger: 3, training: 1.4, tags: ['ruins', 'dragonballs', 'farm', 'conquered'], desc: 'Ruins, dust, longgrain in the fields nobody has taken yet, and a dragon nobody outside the system has heard of.' },
  { id: 'kryllos', name: 'Kryllos', planet: 'kryllos', danger: 4, training: 1.6, tags: ['wild', 'hivekind', 'civilised'], desc: 'Red dust and hive-mounds to the horizon. Every Kryllian you meet already knows you are here.' },
  { id: 'metamor', name: 'Planet Metamor', planet: 'metamor', danger: 1, training: 1.3, tags: ['peaceful', 'farm', 'teachers'], desc: 'Terraced farmland and a training ground shaped like two facing footprints, worn smooth by centuries of the same dance.' },
  { id: 'vezra', name: 'Vezra', planet: 'vezra', danger: 1, training: 1.5, tags: ['spirit', 'quiet', 'teachers'], desc: 'Crystal forests that hum faintly in the wind. Nobody here has ever successfully lied to anyone else.' },
  { id: 'verdana', name: 'The Verdana Concourse', planet: 'verdana', danger: 2, training: 1.1, tags: ['urban', 'civilised', 'jobs', 'tournament'], desc: 'A trade city grown into a jungle canopy. A dozen species, one currency board, and no questions asked.' },
  { id: 'coldrift', name: 'Coldrift Mining Colony', planet: 'coldrift', danger: 5, training: 1.7, tags: ['imperial', 'jobs', 'highgrav', 'cold'], desc: 'Ice, crystal dust, and a quota that does not care how many shifts you have already worked.' },
  { id: 'bestia_wilds', name: 'The Bestia Canopy', planet: 'bestia_prime', danger: 7, training: 2.6, tags: ['feral', 'wild', 'uninhabited', 'jungle'], desc: 'Trees older than any language, and something with too many teeth in almost all of them.' },
  { id: 'cinder_flats', name: 'The Cinder Flats', planet: 'cinder_reach', danger: 8, training: 2.9, tags: ['feral', 'wild', 'uninhabited', 'volcanic'], desc: 'Heat that cracks stone and beasts that shrug it off. Hit something before it hits you.' },
  { id: 'kai_planet', name: "King Kai's Planet", planet: 'otherworld', danger: 2, training: 3.5, tags: ['divine', 'otherworld', 'highgrav', 'mentor'], desc: 'Ten times gravity on a rock the size of a football pitch, with a monkey and a cricket.' },
  { id: 'sacred_world', name: 'Sacred World of the Kais', planet: 'otherworld', danger: 3, training: 3.0, tags: ['divine', 'otherworld', 'sacred'], desc: 'Where the Z-Sword is stuck in a rock and the trees are all wrong.' },
  { id: 'beerus_world', name: "Beerus's World", planet: 'otherworld', danger: 8, training: 6.0, tags: ['divine', 'destroyer', 'extreme'], desc: 'A pillar in an empty sky, a sleeping cat, and his impossibly polite attendant.' },
  { id: 'champa_world', name: "Champa's World", planet: 'otherworld', danger: 8, training: 6.0, tags: ['divine', 'destroyer', 'extreme', 'u6'], desc: "Beerus's world, if it had better restaurants and a more openly hungry god." },
  { id: 'grand_zeno', name: "The King's Palace", planet: 'otherworld', danger: 9, training: 1.0, tags: ['divine', 'omniking'], desc: 'A white nowhere containing a small child who can delete universes.' },

  // Other World
  { id: 'snake_way', name: 'Snake Way', planet: 'otherworld', danger: 3, training: 2.2, tags: ['otherworld', 'road'], desc: 'A million kilometres of serpent-shaped road over a cloud of nothing.' },
  { id: 'check_in', name: "King Yemma's Office", planet: 'otherworld', danger: 1, training: 1.0, tags: ['otherworld', 'judgement'], desc: 'A desk the size of a stadium and a queue that goes back centuries.' },
  { id: 'hell', name: 'Hell', planet: 'otherworld', danger: 6, training: 2.4, tags: ['otherworld', 'evil', 'prison'], desc: 'Spike-fields, blood-red clouds, and every villain you ever heard of comparing notes.' },
  { id: 'otherworld_arena', name: 'Other World Tournament Grounds', planet: 'otherworld', danger: 4, training: 2.0, tags: ['otherworld', 'tournament'], desc: 'Dead fighters from every quadrant, and nobody has to hold back.' },
  { id: 'top_arena', name: 'Null Realm', planet: 'void', danger: 9, training: 1.0, tags: ['tournament', 'divine', 'extreme'], desc: 'A stone platform in a place with no time, watched by two omni-kings.' },

  // Misc
  { id: 'galactic_prison', name: 'Galactic Prison', planet: 'void', danger: 7, training: 2.0, tags: ['prison', 'crime'], desc: 'Where the Galactic Patrol puts the ones they cannot kill.' },
  { id: 'universe11', name: 'Nikoji', planet: 'u11_world', danger: 7, training: 2.2, tags: ['u11', 'lawful', 'civilised'], desc: 'Universe 11. Everybody here is on duty, and the training is done in formation.' },
  { id: 'universe10', name: 'Bell', planet: 'u10_world', danger: 5, training: 2.0, tags: ['u10', 'devout', 'civilised'], desc: 'Universe 10. Strength as worship, and a god in the stands taking notes.' },
  { id: 'tournament_u6', name: 'World of Void Arena', planet: 'void', danger: 6, training: 1.0, tags: ['tournament', 'u6'], desc: 'A neutral ring between universes, with gods in the stands.' },
  { id: 'driftkin_fleet', name: 'The Driftkin Fleet', planet: 'void', danger: 3, training: 1.4, tags: ['wild', 'nomadic', 'ships'], desc: 'A few hundred linked hulls, none of them younger than a century, going wherever the last vote decided.' },
];

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));

export function getPlace(id) {
  return PLACE_BY_ID[id] || PLACE_BY_ID.east_city;
}

export function placesOn(planet) {
  return PLACES.filter((p) => p.planet === planet);
}

export function placesWith(tag) {
  return PLACES.filter((p) => p.tags.includes(tag));
}
