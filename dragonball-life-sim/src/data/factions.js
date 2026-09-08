// The organisations.
//
// The universe had exactly one power in it: the Frieza Force, mentioned by
// name in a handful of events. Everything else that happened to you happened
// because of a stranger with no affiliation. These are the standing forces -
// who they are, what they want, what they wear, and whether they are coming
// for you or for somebody else.
//
// A faction has squads, and squads have their own strength and their own
// reason to be somewhere, so an encounter is with the Ginyu Force rather than
// with "the Frieza Force" in the abstract.

export const FACTIONS = [
  {
    id: 'demon_clan',
    name: "King Piccolo's Demon Clan",
    emblem: 'No banner. You know them by the wreckage.',
    leader: null,
    colours: ['#1a1a1a', '#a8352f'],
    alignment: -90,
    from: 750, until: 753,
    scope: 'planet', planet: 'earth',
    goal: 'Make the world over in the Demon King\'s image, out of a jar that should have stayed sealed.',
    stance: 'hostile',
    recruits: false,
    desc: 'Spat from an egg with a name and a grudge already fully formed, and older than anything else on this list by three hundred years. Everything else here happened after; this is the one that was already ancient when the rest started.',
    squads: [
      { name: 'a spawn of the Demon King', power: 2, note: 'One of his own children, made rather than born, and sent to soften a town up first.' },
      { name: 'the Demon King himself', power: 20, note: 'Immortal until very recently, and has not adjusted to the idea that this can end.', elite: true },
    ],
  },
  {
    id: 'babidi_coven',
    name: "Babidi's Coven",
    emblem: 'An M, burned into the forehead of everyone he owns.',
    leader: 'babidi',
    colours: ['#5a2f6b', '#c9a227'],
    alignment: -70,
    from: 768, until: 774,
    scope: 'universe', universe: 7,
    goal: 'Find enough strong fighters, in enough places, to finally wake what his father could not finish raising.',
    stance: 'hostile',
    recruits: false,
    desc: 'A small, terrified wizard, a ship that goes wherever the readings point next, and a shortlist of the strongest fighters on whatever world it lands on. Being scouted by this crew is not a compliment.',
    squads: [
      { name: 'a Z-Fighter scout', power: 4, note: 'Mind-controlled, and fighting somebody who does not want to hurt them.' },
      { name: "Babidi's monster", power: 30, note: 'Whatever he found on the last planet, wearing the M now.', elite: true },
    ],
  },
  {
    id: 'moro_army',
    name: "Moro's Army",
    emblem: 'A brand cut into the arm of anyone who joins willingly.',
    leader: null,
    colours: ['#3a2e1a', '#7a1f1f'],
    alignment: -85,
    from: 781, until: 785,
    scope: 'galaxy', universe: 7,
    goal: 'Free every name on his ship\'s manifest, eat every planet in the way, and never go back to that cell.',
    stance: 'hostile',
    recruits: true,
    desc: 'A prisoner the Galactic Patrol should never have taken a hearing for, and the escaped population of the Galactic Prison behind him - murderers, pirates, and worse, sprung the moment he decided a sentence did not apply to him. The Patrol calls this one theirs to answer for.',
    squads: [
      { name: 'an escaped prisoner', power: 3, note: 'Out for the first time in years and not inclined to go quietly.' },
      { name: 'one of the Sealed Namekians', power: 15, note: 'Ancient, absorbed against their will, and fighting with borrowed hands.', elite: true },
      { name: 'Moro himself', power: 60, note: 'Eats worlds to grow stronger and has been doing it since before anyone here was born.', elite: true },
    ],
  },
  {
    id: 'capsule_corp_co',
    name: 'Capsule Corporation',
    emblem: 'A stylised capsule, on everything from lab coats to the side of a jet.',
    leader: 'bulma',
    colours: ['#e8762f', '#2c4d9e'],
    alignment: 55,
    from: 690,
    scope: 'planet', planet: 'earth',
    goal: 'Build whatever the world - or one specific royal family - needs next, and bill for it.',
    stance: 'friendly',
    recruits: true,
    desc: 'The reason a gravity chamber, a dragon radar, or an artificial time machine is ever a thing you can actually go and get built. Founded generations before anyone currently drawing a paycheque there, and it shows no sign of stopping.',
    squads: [
      { name: 'a security contractor', power: 0.3, note: 'Paid well to stand near expensive prototypes and hope nothing goes wrong.' },
      { name: 'the family itself', power: 4, note: 'Whoever happens to be home, which is rarely just anybody.' },
    ],
  },
  {
    id: 'frieza_force',
    name: 'The Frieza Force',
    emblem: 'A stylised horn over a planet, stamped on every chestplate.',
    leader: 'frieza',
    colours: ['#4b3f6b', '#d8dde6'],
    alignment: -75,
    from: 762, until: 780,
    scope: 'galaxy', universe: 7,
    goal: 'Clear worlds, sell worlds, and answer to one person.',
    stance: 'hostile',
    recruits: true,
    desc: 'A planet-brokerage with an army. Most of its people are conscripts from worlds it took, which is the part nobody says out loud.',
    squads: [
      { name: 'the Ginyu Force', power: 12, note: 'Five specialists who pose before they fight and mean every second of it.', elite: true },
      { name: 'a purge squad', power: 1, note: 'Low-class troops with scouters and a quota.' },
      { name: 'a garrison detachment', power: 0.5, note: 'Bored, badly paid, and a long way from anywhere.' },
      { name: 'an appraisal team', power: 0.3, note: 'They are here to value the planet, not to fight for it.' },
      { name: 'an elite guard', power: 6, note: 'Personally selected. They do not carry scouters.' },
    ],
  },
  {
    id: 'frost_enterprises',
    name: 'Frost Enterprises',
    emblem: 'A clean corporate mark. Nothing in it references what the company actually does.',
    leader: 'frost',
    colours: ['#2f6b6b', '#d8dde6'],
    alignment: -70,
    from: 765,
    scope: 'galaxy', universe: 6,
    goal: 'Run the exact same empire the Frieza Force runs next door, with a charter and a smile instead of a horn insignia.',
    stance: 'hostile',
    recruits: true,
    desc: "Universe 6's answer to the Frieza Force, and it is not a coincidence - it is the same shape of thing, wearing a company name instead of an emperor's crest. The labour is real. The press releases are better.",
    squads: [
      { name: 'a compliance team', power: 1, note: 'Here to make sure nobody asks the wrong question twice.' },
      { name: 'a site security detail', power: 0.6, note: 'Uniformed, insured, and just as willing to hurt you as any purge squad.' },
      { name: 'an acquisitions specialist', power: 4, note: 'Handles the worlds the charter cannot legally explain.' },
      { name: 'the board', power: 9, note: 'Frost personally attends when a number gets big enough.', elite: true },
    ],
  },
  {
    id: 'red_ribbon',
    name: 'The Red Ribbon Army',
    emblem: 'A red ribbon, worn at the shoulder. Every officer is a colour.',
    leader: 'gero',
    colours: ['#a8352f', '#2f2f38'],
    alignment: -55,
    from: 745, until: 760,
    scope: 'planet', planet: 'earth',
    goal: 'Find the Dragon Balls first, and build whatever is needed to keep them.',
    stance: 'hostile',
    recruits: true,
    desc: 'A private army with a research division that has outgrown it. The soldiers are ordinary. The things the research division builds are not.',
    squads: [
      { name: 'a Red Ribbon patrol', power: 0.4, note: 'Rifles, jeeps, and no idea what they are dealing with.' },
      { name: 'an officer and his detachment', power: 1.5, note: 'Named after a colour and furious about it.' },
      { name: 'a prototype', power: 8, note: 'Something out of the research wing that has not been signed off.' },
    ],
  },
  {
    id: 'red_ribbon_new',
    name: 'Red Ribbon, Reformed',
    emblem: 'The old ribbon on a corporate letterhead.',
    leader: null,
    colours: ['#a8352f', '#d8dde6'],
    alignment: -40,
    from: 781,
    scope: 'planet', planet: 'earth',
    goal: 'Finish the grandfather\'s work with a budget and a press office.',
    stance: 'hostile',
    recruits: true,
    desc: 'A grandson with a grudge, a real company behind him, and two androids who are better people than their employers.',
    squads: [
      { name: 'a corporate security team', power: 0.6, note: 'Contractors. They will stop if it stops being worth it.' },
      { name: 'the Gamma units', power: 10, note: 'Two of them, both convinced they are the heroes, and not entirely wrong.' },
    ],
  },
  {
    id: 'saiyan_army',
    name: 'The Saiyan Army',
    emblem: 'The royal crest of Vegeta, on armour that stretches to fit anyone.',
    leader: null,
    colours: ['#3a4250', '#c9a227'],
    alignment: -50,
    until: 737,
    scope: 'galaxy', universe: 7,
    goal: 'Take worlds for the Cold Empire and be paid in rank.',
    stance: 'neutral',
    recruits: true,
    desc: 'Under contract to people who despise them, and about four years from finding out how that ends.',
    squads: [
      { name: 'a low-class clearing team', power: 0.6, note: 'Sent to worlds nobody expects them to come back from.' },
      { name: 'an elite pair', power: 5, note: 'Two of them, and that is considered generous.' },
      { name: 'a royal escort', power: 9, note: 'They answer to the King and to nobody on this rock.' },
    ],
  },
  {
    id: 'saiyan_remnant',
    name: 'The Restoration Council',
    emblem: 'The old crest, re-cut badly, on whatever they could find.',
    leader: null,
    colours: ['#3a4250', '#a8352f'],
    alignment: -15,
    from: 738,
    scope: 'galaxy', universe: 7,
    goal: 'Rebuild a people, by whatever means the register permits.',
    stance: 'depends',
    recruits: true,
    desc: 'What is left, trying to reconstitute the institutions of a dead planet on borrowed ground.',
    squads: [
      { name: 'a Council escort', power: 2, note: 'Paperwork, and six people to make the paperwork stick.' },
      { name: 'a recovery team', power: 4, note: 'They are looking for survivors, and they are not asking.' },
    ],
  },
  {
    id: 'galactic_patrol',
    name: 'The Galactic Patrol',
    emblem: 'A white star on blue, and a badge that opens most doors.',
    leader: null,
    colours: ['#2f5bb7', '#e8e2d6'],
    alignment: 65,
    from: 740,
    scope: 'galaxy', universe: 7,
    goal: 'Keep the worst things in the Galactic Prison and the rest of it quiet.',
    stance: 'lawful',
    recruits: true,
    desc: 'Chronically understaffed, generally decent, and about two centuries behind the things it polices.',
    squads: [
      { name: 'a patrol officer', power: 0.8, note: 'One person, a badge, and enormous optimism.' },
      { name: 'an arrest detail', power: 3, note: 'They have read your file and brought enough people.' },
      { name: 'an elite marshal', power: 11, note: 'Sent when the file is bad enough.' },
    ],
    // The organisation Jaco and Merus both actually answer to - a real
    // rank ladder, not just "member". Stations sit on worlds important
    // enough to warrant one; a Patroller is posted to whichever is nearest
    // when they sign on, and can request a transfer once they have rank
    // enough for anyone to bother approving it.
    ranks: ['Cadet', 'Patrol Officer', 'Senior Officer', 'Investigator', 'Marshal', 'Chief Marshal'],
    // All Universe 7 - the Patrol has no jurisdiction to post anyone
    // anywhere else, same rule everything else cross-universe follows.
    stations: ['earth', 'namek', 'yardrat', 'frieza_79', 'kryllos'],
  },
  {
    id: 'crane_school',
    name: 'The Crane School',
    emblem: 'A crane in flight, embroidered small.',
    leader: 'crane_hermit',
    colours: ['#3c3229', '#8a6f4a'],
    alignment: -30,
    from: 730, until: 775,
    scope: 'planet', planet: 'earth',
    goal: 'Prove the Turtle School wrong, and take contracts on the side.',
    stance: 'rival',
    recruits: true,
    desc: 'A legitimate martial arts school that also, quietly, takes assassination work.',
    squads: [
      { name: 'a Crane student', power: 0.5, note: 'Technically excellent and morally unbothered.' },
      { name: 'a contracted killer', power: 2.5, note: 'They were paid before they arrived.' },
    ],
  },
  {
    id: 'turtle_school',
    name: 'The Turtle School',
    emblem: 'A shell, worn on the back, twenty kilos of it.',
    leader: 'roshi',
    colours: ['#e2762f', '#2c4d9e'],
    alignment: 60,
    from: 700,
    scope: 'planet', planet: 'earth',
    goal: 'Teach anybody who does the milk round first.',
    stance: 'friendly',
    recruits: true,
    desc: 'Three hundred years old, four students at a time, and the strongest tradition on the planet.',
    squads: [
      { name: 'a Turtle student', power: 0.7, note: 'They will insist on introducing the school first.' },
    ],
  },
  {
    id: 'pride_troopers',
    name: 'The Pride Troopers',
    emblem: 'A stylised P, and a pose to go with it.',
    leader: null,
    colours: ['#c0392b', '#e8e2d6'],
    alignment: 80,
    from: 778,
    scope: 'universe', universe: 11,
    goal: 'Justice, meant entirely literally, across a whole universe.',
    stance: 'lawful',
    recruits: false,
    desc: 'Universe 11\'s standing force. They announce themselves, they mean all of it, and they are stronger than they have any right to be.',
    squads: [
      { name: 'a Pride Trooper', power: 14, note: 'They will explain what justice is before they start.' },
      { name: 'a Trooper squad', power: 25, note: 'Four of them, in formation, entirely sincere.' },
    ],
  },
  {
    id: 'bandits',
    name: 'The Wastes Crews',
    emblem: 'Whatever they painted on the side of the truck.',
    leader: null,
    colours: ['#6b5a3a', '#a8352f'],
    alignment: -35,
    scope: 'planet', planet: 'earth',
    goal: 'Take enough to eat and not get noticed by anybody who matters.',
    stance: 'hostile',
    recruits: true,
    desc: 'Desert crews working roads nobody polices. Most of them would rather not fight you.',
    squads: [
      { name: 'a road crew', power: 0.2, note: 'Six of them and one working rifle.' },
      { name: 'a desert bandit', power: 0.4, note: 'Fast, hungry, and better than they look.' },
    ],
  },
  {
    id: 'demon_realm',
    name: 'The Demon Realm',
    emblem: 'A sigil that hurts slightly to look at.',
    leader: 'dabura',
    colours: ['#4b2a5a', '#a8352f'],
    alignment: -80,
    from: 770,
    scope: 'galaxy', universe: 7,
    goal: 'Get back out, and take the rest of it with them.',
    stance: 'hostile',
    recruits: false,
    desc: 'Not from here, not interested in negotiating, and only occasionally able to reach this side.',
    squads: [
      { name: 'a demon scout', power: 3, note: 'Testing whether the way through holds.' },
      { name: 'a demon warband', power: 9, note: 'The way through held.' },
    ],
  },
  {
    id: 'bounty_hunters_guild',
    name: "The Bounty Hunters' Guild",
    emblem: 'No banner - just a price list, and a strict rule about getting paid first.',
    leader: null,
    colours: ['#4a4a4a', '#c9a227'],
    alignment: -10,
    from: 700,
    scope: 'galaxy', universe: 7,
    goal: 'Whoever is worth the most today. No politics, no side, just the contract.',
    stance: 'rival',
    recruits: true,
    desc: 'Loosely organised, badly paid at the bottom, extremely well paid at the top. Anyone with a warrant, a grudge, or enough money can put a name on the list, and the Guild does not ask why - a name known enough is a name worth pricing.',
    squads: [
      { name: 'a jobbing hunter', power: 1.2, note: 'Working a low contract and hoping you are worth less trouble than the file suggests.' },
      { name: 'a licensed hunter crew', power: 4, note: 'They work in pairs. It is not a fair fight and it is not supposed to be.' },
      { name: 'a Guild specialist', power: 16, note: 'The kind of name that gets whispered before a contract this size.', elite: true },
    ],
  },
];

export const FACTION_BY_ID = Object.fromEntries(FACTIONS.map((f) => [f.id, f]));

export function getFaction(id) {
  return FACTION_BY_ID[id];
}

/**
 * Factions that exist in this year, and could plausibly be where you are.
 * A "galaxy" scope means galaxy-wide within one universe, not multiverse-
 * spanning - the Frieza Force does not have a branch office in Universe 6.
 */
export function factionsPresent(year, planetId, universe = 7) {
  return FACTIONS.filter((f) => {
    if (f.from && year < f.from) return false;
    if (f.until && year > f.until) return false;
    if (f.scope === 'planet' && f.planet !== planetId) return false;
    if (f.universe && f.universe !== universe) return false;
    return true;
  });
}

/**
 * Why they are here. A faction turns up for its own reasons; whether that
 * involves you depends on what you have been doing.
 */
export function factionIntent(faction, character) {
  const karma = character.karma || 0;
  const fame = character.fame || 0;
  if (faction.stance === 'lawful') {
    if (karma < -35 && fame > 25) return 'arrest';
    if (karma > 30) return 'ally';
    return 'passing';
  }
  if (faction.stance === 'hostile') {
    if (fame > 45) return 'target';
    return karma > 40 ? 'target' : 'passing';
  }
  if (faction.stance === 'friendly') return karma >= 0 ? 'recruit' : 'wary';
  if (faction.stance === 'rival') return fame > 20 ? 'test' : 'passing';
  return 'passing';
}
