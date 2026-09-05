// The canon spine. These fire as world events in the year they are due, and
// the player can walk into them, ignore them, or change them outright. Once a
// threat is resolved differently, the timeline forks and later entries adapt.

export const TIMELINE = [
  { id: 'saiyan_purge', year: 737, name: 'Planet Vegeta Falls', planet: 'planet_vegeta', threat: 12e7,
    blurb: 'Frieza fires a single ball of light at the Saiyan homeworld. Four survive.',
    scope: 'planet', tags: ['saiyan', 'genocide'], cancelIf: 'frieza_dead' },
  { id: 'rr_army', year: 749, name: 'The Red Ribbon Army Rises', planet: 'earth', threat: 200,
    blurb: 'A private army with tanks and helicopters starts collecting Dragon Balls by force.',
    scope: 'region', tags: ['army', 'crime'] },
  { id: 'piccolo_daimao', year: 753, name: 'King Piccolo Freed', planet: 'earth', threat: 260,
    blurb: 'The Demon King is out of his rice cooker and is killing every martial artist on the planet.',
    scope: 'planet', tags: ['demon', 'martial'] },
  { id: 'tournament_23', year: 756, name: '23rd World Martial Arts Tournament', planet: 'earth', threat: 300,
    blurb: 'The strongest fighters on Earth, and one of them is not human.', scope: 'event', tags: ['tournament'] },
  { id: 'raditz_arrives', year: 761, name: 'A Saiyan Lands on Earth', planet: 'earth', threat: 1500,
    blurb: 'A man with hair to his knees asks about someone\'s tail and takes a child hostage.',
    scope: 'region', tags: ['saiyan', 'invasion'], cancelIf: 'saiyans_never_came' },
  { id: 'saiyan_invasion', year: 762, name: 'The Saiyans Arrive', planet: 'earth', threat: 18000,
    blurb: 'Two elite Saiyans land outside East City and start planting seeds that grow monsters.',
    scope: 'planet', tags: ['saiyan', 'invasion'], cancelIf: 'saiyans_never_came' },
  { id: 'namek_war', year: 762, name: 'The Battle for Namek', planet: 'namek', threat: 12e7,
    blurb: 'Frieza comes for the Namekian Dragon Balls and Namek has five minutes left.',
    scope: 'planet', tags: ['frieza', 'namek', 'dragonballs'], cancelIf: 'frieza_dead' },
  { id: 'garlic_jr', year: 763, name: 'The Black Water Mist', planet: 'earth', threat: 40000,
    blurb: 'An immortal exile fills the sky with fog that turns people into demons.',
    scope: 'region', tags: ['demon'] },
  { id: 'trunks_warning', year: 764, name: 'A Boy From the Future', planet: 'earth', threat: 1e8,
    blurb: 'A purple-haired stranger cuts a tyrant in half and then warns everyone about three years from now.',
    scope: 'event', tags: ['prophecy'] },
  { id: 'androids', year: 767, name: 'The Androids Awaken', planet: 'earth', threat: 3e7,
    blurb: 'Two of them walk out of a mountain lab and start destroying cities for something to do.',
    scope: 'planet', tags: ['android'], cancelIf: 'gero_dead' },
  { id: 'cell_games', year: 767, name: 'The Cell Games', planet: 'earth', threat: 3e8,
    blurb: 'A perfect creature announces a tournament and gives the world nine days to prepare.',
    scope: 'planet', tags: ['tournament', 'bioandroid'], cancelIf: 'cell_dead' },
  { id: 'tournament_25', year: 774, name: '25th World Martial Arts Tournament', planet: 'earth', threat: 5e6,
    blurb: 'The champion is a fraud, the challengers are gods, and a wizard is in the car park.',
    scope: 'event', tags: ['tournament'] },
  { id: 'buu_freed', year: 774, name: 'Majin Buu Is Released', planet: 'earth', threat: 8e8,
    blurb: 'A pink cloud pours out of a ball in the desert and the planet\'s population starts dropping.',
    scope: 'planet', tags: ['majin', 'apocalypse'], cancelIf: 'babidi_dead' },
  { id: 'beerus_visit', year: 778, name: 'A God of Destruction Wakes', planet: 'earth', threat: 1e14,
    blurb: 'A purple cat arrives at a birthday party and asks about a Super Saiyan God.',
    scope: 'planet', tags: ['divine'] },
  { id: 'golden_frieza', year: 779, name: 'The Emperor Returns', planet: 'earth', threat: 4e11,
    blurb: 'Frieza is alive, gold, and has spent four months doing the one thing he never bothered with.',
    scope: 'planet', tags: ['frieza'], cancelIf: 'frieza_erased' },
  { id: 'u6_tournament', year: 779, name: 'Tournament of Destroyers', planet: 'void', threat: 3e11,
    blurb: 'Two universes bet their pride on five fighters each in a ring between worlds.',
    scope: 'event', tags: ['tournament', 'divine'] },
  { id: 'tournament_of_power', year: 780, name: 'The Tournament of Power', planet: 'void', threat: 6e13,
    blurb: 'Eight universes, eighty fighters, forty-eight minutes, and the losers stop existing.',
    scope: 'multiverse', tags: ['tournament', 'divine', 'apocalypse'] },
  { id: 'moro_escape', year: 781, name: 'The Planet-Eater Escapes', planet: 'void', threat: 5e12,
    blurb: 'Something very old breaks out of the Galactic Prison and starts draining worlds dry.',
    scope: 'galaxy', tags: ['galactic', 'apocalypse'] },
  { id: 'granolah_wish', year: 782, name: 'The Survivor\'s Wish', planet: 'cereal', threat: 8e12,
    blurb: 'The last Cerealian asks a dragon to make him the strongest in the universe, and it works.',
    scope: 'galaxy', tags: ['cerealian', 'dragonballs'] },
  { id: 'red_ribbon_return', year: 783, name: 'Red Ribbon, Again', planet: 'earth', threat: 4e12,
    blurb: 'A grandson with a grudge and a company with a budget restart the old programme.',
    scope: 'planet', tags: ['android'] },
  { id: 'uub_arrives', year: 790, name: 'The Reincarnation Fights', planet: 'earth', threat: 2e12,
    blurb: 'A shy boy at the tournament turns out to be the good half of the thing that ate the world.',
    scope: 'event', tags: ['tournament'] },
];

/** Every third year, Earth holds a tournament. */
export function isTournamentYear(year) {
  return year >= 750 && (year - 750) % 3 === 0;
}

export function timelineFor(year) {
  return TIMELINE.filter((t) => t.year === year);
}

export function eraName(year) {
  if (year < 750) return 'The Quiet Years';
  if (year < 761) return 'The Age of Tournaments';
  if (year < 764) return 'The Saiyan Wars';
  if (year < 768) return 'The Android Crisis';
  if (year < 775) return 'The Majin Era';
  if (year < 781) return 'The Age of Gods';
  if (year < 790) return 'The Galactic Age';
  return 'The Long Peace';
}

/** Rough "how strong does the world expect you to be" curve, for scaling. */
export function worldPowerBaseline(year) {
  const anchors = [
    [740, 60], [750, 150], [756, 300], [761, 4000], [762, 3000000],
    [767, 3e7], [774, 8e8], [778, 1e12], [780, 1e13], [790, 5e13],
  ];
  if (year <= anchors[0][0]) return anchors[0][1];
  if (year >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [ya, pa] = anchors[i], [yb, pb] = anchors[i + 1];
    if (year >= ya && year <= yb) {
      const t = (year - ya) / (yb - ya);
      return Math.exp(Math.log(pa) + (Math.log(pb) - Math.log(pa)) * t);
    }
  }
  return 1000;
}
