// Worlds, as places with politics rather than backdrops. Each has people on it,
// a law, somebody who defends it, and a distance from everywhere else.

export const PLANETS = [
  {
    id: 'earth', name: 'Earth', distance: 0,
    inhabitants: 'Humans, mostly, plus a handful of things that are not',
    population: 'billions', tech: 'capsule-age', alignment: 'peaceful',
    law: 'Evil is feared and answered. Someone always comes.',
    defenders: ['goku', 'piccolo', 'vegeta', 'gohan', 'android_18', 'krillin'],
    flora: 'Forests, oceans, and dinosaurs nobody got round to removing.',
    strength: 'A handful of fighters here can destroy the planet. The rest cannot fight at all.',
  },
  {
    id: 'planet_vegeta', name: 'Planet Vegeta', distance: 8,
    inhabitants: 'Saiyans, and the Tuffles they replaced',
    population: 'thousands', tech: 'imperial vassal', alignment: 'conquering',
    law: 'Strength decides. There is no second rule.',
    defenders: ['nappa', 'bardock'],
    flora: 'Red grass, hard ground, and nothing that has not learned to fight back.',
    strength: 'Everyone can fight. Most of them are worse at it than they believe.',
  },
  {
    id: 'sadala', name: 'Planet Sadala', distance: 40,
    inhabitants: 'Saiyans who never became conquerors',
    population: 'millions', tech: 'modern', alignment: 'proud',
    law: 'Honour duels, formally supervised.',
    defenders: ['cabba', 'caulifla', 'kale'],
    flora: 'Farmland, mountains, and stadiums.',
    strength: 'A warrior culture with rules, which makes it more dangerous, not less.',
  },
  {
    id: 'namek', name: 'Planet Namek', distance: 12,
    inhabitants: 'Namekians, in villages of a hundred or so',
    population: 'thousands', tech: 'none to speak of', alignment: 'peaceful',
    law: 'Elders decide. Violence is close to unthinkable.',
    defenders: ['nail', 'moori'],
    flora: 'Blue grass, three suns, and no night at all.',
    strength: 'Warrior-types are formidable. There are very few of them.',
  },
  {
    id: 'new_namek', name: 'New Namek', distance: 14, inhabitants: 'Namekians, rebuilding',
    population: 'thousands', tech: 'none to speak of', alignment: 'peaceful',
    law: 'Elders decide, and this time they keep a watch posted.',
    defenders: ['moori'], flora: 'The same blue grass, grown from seed.',
    strength: 'They have learned to be careful.',
  },
  {
    id: 'yardrat', name: 'Planet Yardrat', distance: 22,
    inhabitants: 'Yardratians, small and unhurried',
    population: 'millions', tech: 'spiritual', alignment: 'pacifist',
    law: 'Nobody is made to do anything.',
    defenders: ['yardrat_elder'],
    flora: 'Low domes, terraces, and gardens grown for the shape of them.',
    strength: 'Almost no muscle. Techniques nobody else in the universe has.',
  },
  {
    id: 'cereal', name: 'Planet Cereal', distance: 30,
    inhabitants: 'Two Cerealians, and the ruins of everyone else',
    population: 'a handful', tech: 'scavenged', alignment: 'grieving',
    law: 'There is nobody left to make one.',
    defenders: [], flora: 'Dust, wind, and the outlines of towns.',
    strength: 'One survivor with a grudge and a dragon of his own.',
  },
  {
    id: 'frieza_79', name: 'Planet Frieza 79', distance: 18,
    inhabitants: 'Frieza Force garrison, various species',
    population: 'tens of thousands', tech: 'imperial', alignment: 'imperial',
    law: 'Rank. Anything a superior wants is legal.',
    defenders: ['zarbon', 'dodoria'],
    flora: 'Nothing grows. Everything is shipped in.',
    strength: 'Individually unimpressive. There are a great many of them.',
  },
  {
    id: 'void', name: 'Deep Space', distance: 25, inhabitants: 'Whoever is passing through',
    population: 'none', tech: 'none', alignment: 'indifferent',
    law: 'None whatsoever.', defenders: [], flora: 'Nothing.',
    strength: 'Empty, until it is not.',
  },
  {
    id: 'otherworld', name: 'The Other World', distance: 100, inhabitants: 'The dead',
    population: 'uncountable', tech: 'divine', alignment: 'divine',
    law: 'King Yemma decides, and there is no appeal.', defenders: ['king_kai', 'supreme_kai'],
    flora: 'Cloud, mostly.', strength: 'Everyone here has already died once.',
  },
];

export const PLANET_BY_ID = Object.fromEntries(PLANETS.map((p) => [p.id, p]));

export function getPlanet(id) {
  return PLANET_BY_ID[id] || PLANET_BY_ID.earth;
}

/** Rough travel years between two worlds, by method. */
export function travelYears(fromId, toId, method) {
  const a = getPlanet(fromId);
  const b = getPlanet(toId);
  const gap = Math.abs((a.distance || 0) - (b.distance || 0)) + (a.id === b.id ? 0 : 6);
  switch (method) {
    case 'instant': return 0;
    case 'ship': return Math.max(0, Math.round(gap / 12));
    case 'pod': return Math.max(1, Math.round(gap / 7));
    case 'flight': return Math.max(2, Math.round(gap / 3));
    default: return Math.max(1, Math.round(gap / 8));
  }
}

export const TRAVEL_METHODS = [
  {
    id: 'instant', name: 'Instant Transmission', needs: 'the technique',
    blurb: 'Lock onto a signature and be there. No time passes at all.',
  },
  {
    id: 'ship', name: 'Capsule spaceship', needs: 'a ship',
    blurb: 'Months, sometimes a year. There is a kitchen and a gravity setting.',
  },
  {
    id: 'pod', name: 'Attack pod', needs: 'a pod',
    blurb: 'You sleep through it. Years go past while you do.',
  },
  {
    id: 'flight', name: 'Fly there yourself', needs: 'enormous speed',
    blurb: 'It can be done. It takes a very long time and you arrive hungry.',
  },
];
