// The other eleven universes.
//
// Universe 7 is the one every other file assumes, so this is everything that
// is not it: the gods who run each universe, the fighters they send, and how
// the place feels if you ever get there. Powers are given for Age 780, the
// year of the Tournament of Power, and scaled from there like everything else.

export const UNIVERSES = [
  {
    id: 'u1', number: 1, name: 'Universe 1', epithet: 'the untouchable',
    mortalLevel: 'highest', erased: false, competed: false,
    destroyer: 'Iwan', angel: 'Awamo', kai: 'Anato',
    flavour: 'A universe so far above the mortal average it was excused from the tournament entirely. Nobody from here has any reason to talk to you.',
    fighters: [],
  },
  {
    id: 'u2', number: 2, name: 'Universe 2', epithet: 'the universe of love',
    mortalLevel: 'low', erased: true, competed: true,
    destroyer: 'Heles', angel: 'Sour', kai: 'Pell',
    flavour: 'Everything here is beauty as a doctrine, which sounds harmless right up until they transform.',
    fighters: [
      { name: 'Ribrianne', power: 2.4e12, race: 'other', note: 'Turns love into mass and throws it at you.' },
      { name: 'Kakunsa', power: 1.1e12, race: 'other', note: 'Fights on all fours and enjoys it.' },
      { name: 'Rozie', power: 1.0e12, race: 'other', note: 'Fast, small, and completely fearless.' },
      { name: 'Jimizu', power: 9e11, race: 'other', note: 'Teleports every time you are about to land one.' },
    ],
  },
  {
    id: 'u3', number: 3, name: 'Universe 3', epithet: 'the machine universe',
    mortalLevel: 'low', erased: true, competed: true,
    destroyer: 'Mosco', angel: 'Camparri', kai: 'Ea',
    flavour: 'A universe that solved fighting with engineering, then kept going long after it should have stopped.',
    fighters: [
      { name: 'Paparoni', power: 1.6e12, race: 'android', note: 'Designed every other fighter here.' },
      { name: 'Koitsukai', power: 8e11, race: 'android', note: 'Three machines that combine into one worse machine.' },
      { name: 'Maji-Kayo', power: 7e11, race: 'other', note: 'Liquid. Punching it accomplishes nothing.' },
    ],
  },
  {
    id: 'u4', number: 4, name: 'Universe 4', epithet: 'the invisible universe',
    mortalLevel: 'low', erased: true, competed: true,
    destroyer: 'Quitela', angel: 'Cognac', kai: 'Cus',
    flavour: 'Cheats openly, and its god is a rat who finds the whole thing funny.',
    fighters: [
      { name: 'Gamisalas', power: 6e11, race: 'other', note: 'Invisible, and not in a way you can sense.' },
      { name: 'Damon', power: 9e11, race: 'other', note: 'So small nobody could find him for most of the tournament.' },
      { name: 'Shantza', power: 5e11, race: 'other', note: 'Illusions, and the patience to use them properly.' },
    ],
  },
  {
    id: 'u6', number: 6, name: 'Universe 6', epithet: 'the twin universe',
    mortalLevel: 'mid', erased: false, competed: true,
    destroyer: 'Champa', angel: 'Vados', kai: 'Fuwa',
    flavour: 'Universe 7 with the pieces rearranged: the same planets, a different history, and a Saiyan homeworld that never fell.',
    fighters: [
      { name: 'Hit', power: 3.5e13, race: 'other', note: 'Time-skip, and the professionalism to use it once.' },
      { name: 'Cabba', power: 2e12, race: 'saiyan', note: 'Polite, quick, and improving faster than anyone expects.' },
      { name: 'Frost', power: 1.2e12, race: 'frostdemon', note: 'Frieza with better public relations.' },
      { name: 'Botamo', power: 8e11, race: 'other', note: 'Rubber. Physical damage simply does not register.' },
      { name: 'Magetta', power: 1.4e12, race: 'other', note: 'A metal man from a volcano who fights by throwing magma.' },
      { name: 'Kale', power: 2.8e13, race: 'saiyan', note: 'Shy until she is not, and then a Legendary Super Saiyan.' },
      { name: 'Caulifla', power: 8e12, race: 'saiyan', note: 'Learned Super Saiyan in an afternoon out of sheer arrogance.' },
    ],
  },
  {
    id: 'u9', number: 9, name: 'Universe 9', epithet: 'the trio of danger',
    mortalLevel: 'lowest', erased: true, competed: true,
    destroyer: 'Sidra', angel: 'Mojito', kai: 'Roh',
    flavour: 'The lowest mortal level of any universe that competed, and everyone there knew what that meant.',
    fighters: [
      { name: 'Bergamo', power: 9e11, race: 'other', note: 'Grows in proportion to whatever is hitting him.' },
      { name: 'Basil', power: 7e11, race: 'other', note: 'All legs, all the time.' },
      { name: 'Lavender', power: 7e11, race: 'other', note: 'Poison in the air around him.' },
    ],
  },
  {
    id: 'u10', number: 10, name: 'Universe 10', epithet: 'the universe of muscle',
    mortalLevel: 'low', erased: true, competed: true,
    destroyer: 'Rumsshi', angel: 'Cukatail', kai: 'Gowasu',
    flavour: 'A god who believes in bodies, and a universe built to agree with him.',
    fighters: [
      { name: 'Obni', power: 1.5e12, race: 'other', note: 'Reads your movements a second before you make them.' },
      { name: 'Jilcol', power: 6e11, race: 'other', note: 'Enormous, and does not tire.' },
      { name: 'Zircor', power: 7e11, race: 'other', note: 'Fights with a discipline nobody else there has.' },
    ],
  },
  {
    id: 'u11', number: 11, name: 'Universe 11', epithet: 'the universe of justice',
    mortalLevel: 'high', erased: false, competed: true,
    destroyer: 'Vermoud', angel: 'Marcarita', kai: 'Khai',
    flavour: 'The Pride Troopers, a doctrine of justice they mean literally, and the strongest mortal in the twelve universes standing quietly behind them.',
    fighters: [
      { name: 'Jiren', power: 9e13, race: 'other', note: 'Strength past a God of Destruction, and a reason for it he will not discuss.' },
      { name: 'Toppo', power: 4e13, race: 'other', note: 'A Pride Trooper who becomes a God of Destruction candidate mid-fight.' },
      { name: 'Dyspo', power: 6e12, race: 'other', note: 'Faster than anything else in the ring.' },
      { name: 'Kahseral', power: 2e12, race: 'other', note: 'Leads by standing in front of people.' },
    ],
  },
];

export const UNIVERSE_BY_ID = Object.fromEntries(UNIVERSES.map((u) => [u.id, u]));

export function getUniverse(id) {
  return UNIVERSE_BY_ID[id];
}

/** Universes you could plausibly reach or meet, excluding your own. */
export function otherUniverses() {
  return UNIVERSES.filter((u) => u.fighters.length > 0);
}

/**
 * Fighters from a universe, scaled from their Age 780 figures. The rest of the
 * game interpolates power across the sagas; these people only appear in one
 * era, so the scale is a straight multiplier on how far off 780 you are.
 */
export function universeFighters(universeId, year = 780) {
  const u = getUniverse(universeId);
  if (!u) return [];
  const drift = Math.pow(1.12, year - 780);
  return u.fighters.map((f) => ({
    name: f.name,
    power: Math.max(1, Math.round(f.power * drift)),
    raceId: f.race,
    universe: u.number,
    flavour: f.note,
  }));
}

/** Everyone from every competing universe, for a multiverse draw. */
export function multiverseField(year = 780, exclude = []) {
  const out = [];
  for (const u of UNIVERSES) {
    if (!u.competed || exclude.includes(u.id)) continue;
    out.push(...universeFighters(u.id, year));
  }
  return out;
}
