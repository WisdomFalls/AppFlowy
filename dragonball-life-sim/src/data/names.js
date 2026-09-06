// Race-appropriate name generation. Every species in Dragon Ball is named
// after a theme: Saiyans are vegetables, Namekians are snails and instruments,
// Frieza's clan is cold things, Majins are desserts. Random NPCs follow the
// same rules, so a generated stranger reads as canon-adjacent rather than random.

const SAIYAN_ROOTS = ['Broc', 'Kale', 'Cabb', 'Leek', 'Turn', 'Chard', 'Rad', 'Beet', 'Cress', 'Fenn',
  'Zuk', 'Pars', 'Sorr', 'Endiv', 'Okra', 'Yam', 'Squash', 'Marrow', 'Tater', 'Shallot', 'Scal',
  'Rutab', 'Cel', 'Art', 'Bok', 'Nap', 'Rap', 'Sav', 'Mizun', 'Daik', 'Wasab', 'Lott', 'Burd'];
const SAIYAN_TAILS = ['a', 'us', 'in', 'ip', 'ini', 'ari', 'ot', 'ash', 'ov', 'el', 'ura', 'ito', 'as', 'oc', 'ika'];

const NAMEK_ROOTS = ['Pic', 'Cym', 'Tam', 'Dru', 'Ob', 'Fif', 'Bon', 'Cong', 'Vio', 'Mand', 'Chim',
  'Gong', 'Kaz', 'Har', 'Lut', 'Reb', 'Zith', 'Sit', 'Tromb', 'Cor', 'Fluge', 'Ocar', 'Marim'];
const NAMEK_TAILS = ['colo', 'bal', 'bourine', 'm', 'oe', 'e', 'go', 'a', 'la', 'olin', 'es', 'oo',
  'p', 'her', 'ec', 'ar', 'one', 'net', 'ina', 'ba'];

const FROST_ROOTS = ['Fri', 'Coo', 'Chil', 'Fro', 'Glac', 'Sle', 'Rim', 'Hai', 'Bliz', 'Freo', 'Kelv',
  'Slu', 'Perm', 'Tund', 'Snow', 'Icic', 'Nip', 'Crys', 'Ber', 'Arct'];
const FROST_TAILS = ['eza', 'ler', 'led', 'st', 'ier', 'et', 'e', 'l', 'zard', 'n', 'in', 'sh',
  'afrost', 'ra', 'cap', 'le', 'py', 'tal', 'g', 'ic'];

const MAJIN_ROOTS = ['Nou', 'Pral', 'Sorb', 'Gat', 'Trif', 'Cust', 'Fudg', 'Mering', 'Toff', 'Marz',
  'Parf', 'Waf', 'Bonb', 'Eclai', 'Torte', 'Str', 'Gan', 'Nug', 'Jell', 'Sund'];
const MAJIN_TAILS = ['gat', 'ine', 'et', 'eau', 'le', 'ard', 'e', 'ue', 'ee', 'ipan', 'ait', 'er',
  'on', 'r', 'lla', 'ache', 'at', 'y', 'ae', 'u'];

const EARTH_ROOTS = ['Ram', 'Mis', 'Moch', 'Tempur', 'Wont', 'Ba', 'Ank', 'Daif', 'Karaag', 'Sush',
  'Udo', 'Sob', 'Nato', 'Gyoz', 'Tak', 'Okon', 'Sen', 'Kats', 'Yak', 'Dang', 'Tofu', 'Panc',
  'Brief', 'Trunk', 'Slack', 'Bloom', 'Corset', 'Cami', 'Denim', 'Tight'];
const EARTH_TAILS = ['en', 'o', 'i', 'a', 'an', 'un', 'in', 'zu', 'ro', 'ki', 'chi', 'ta', 'ma', 'shi', 'su'];
const EARTH_SURNAMES = ['Briefs', 'Son', 'Mao', 'Satan', 'Ox', 'Tao', 'Shen', 'Hasky', 'Bacterian',
  'Ranfan', 'Nam', 'Giran', 'Pamput', 'Yamu', 'Spopovich', 'Kuriza', 'Toriyama', 'Wagon', 'Norimaki'];

const KAI_ROOTS = ['Sh', 'Kib', 'Zam', 'Gow', 'Rum', 'Hel', 'Iw', 'Kur', 'Fuw', 'Ea', 'Ogm', 'Kh'];
const KAI_TAILS = ['in', 'ito', 'asu', 'asu', 'sshi', 'les', 'ne', 'u', 'a', 'sa', 'ai', 'ne'];

const YARDRAT_ROOTS = ['Pyb', 'Nym', 'Sel', 'Ith', 'Vas', 'Oor', 'Ilu', 'Zeph', 'Ael', 'Mir', 'Tho'];
const YARDRAT_TAILS = ['ara', 'ai', 'un', 'is', 'ha', 'en', 'or', 'ya', 'esh', 'im', 'al'];

const CEREAL_ROOTS = ['Gran', 'Oat', 'Muesl', 'Bran', 'Barl', 'Ry', 'Farr', 'Spel', 'Grit', 'Cong',
  'Sorgh', 'Mil', 'Quin', 'Amar', 'Buckw', 'Sem'];
const CEREAL_TAILS = ['olah', 'meel', 'i', 'nolo', 'ey', 'e', 'o', 't', 's', 'ee', 'um', 'let', 'oa', 'anth', 'heat', 'ina'];

const TUFFLE_ROOTS = ['Rai', 'Hatch', 'Bab', 'Dr. Kol', 'Vor', 'Nex', 'Cir', 'Pol', 'Ax', 'Tuf'];
const TUFFLE_TAILS = ['chi', 'iyack', 'y', 'ex', 'tan', 'us', 'cuit', 'ymer', 'ion', 'fle'];

const ANDROID_PREFIX = ['Android', 'Unit', 'Model', 'Prototype', 'Series', 'Specimen'];
const ANDROID_SUFFIX = ['DX', 'MK', 'RR', 'ZX', 'HV', 'NX'];

const BIO_ROOTS = ['Cell', 'Bio', 'Chim', 'Gen', 'Splice', 'Vect', 'Clon', 'Hyb'];
const BIO_TAILS = ['-Alpha', '-Beta', '-Gamma', '-Delta', '-Omega', '-Prime', '-Zero', ' Jr.'];

const NAME_TABLES = {
  saiyan: [SAIYAN_ROOTS, SAIYAN_TAILS],
  halfsaiyan: [SAIYAN_ROOTS.concat(EARTH_ROOTS), SAIYAN_TAILS.concat(EARTH_TAILS)],
  earthling: [EARTH_ROOTS, EARTH_TAILS],
  namekian: [NAMEK_ROOTS, NAMEK_TAILS],
  frostdemon: [FROST_ROOTS, FROST_TAILS],
  majin: [MAJIN_ROOTS, MAJIN_TAILS],
  shinjin: [KAI_ROOTS, KAI_TAILS],
  yardratian: [YARDRAT_ROOTS, YARDRAT_TAILS],
  cerealian: [CEREAL_ROOTS, CEREAL_TAILS],
  tuffle: [TUFFLE_ROOTS, TUFFLE_TAILS],
  half_frostkin: [FROST_ROOTS.concat(EARTH_ROOTS), FROST_TAILS.concat(EARTH_TAILS)],
  half_android: [EARTH_ROOTS, EARTH_TAILS],
  other: [EARTH_ROOTS, EARTH_TAILS],
};

export function generateName(rng, raceId) {
  if (raceId === 'android' || (raceId === 'half_android' && rng.chance(0.2))) {
    return rng.chance(0.5)
      ? `${rng.pick(ANDROID_PREFIX)} ${rng.int(2, 99)}`
      : `${rng.pick(ANDROID_SUFFIX)}-${rng.int(1, 40)}`;
  }
  if (raceId === 'frost_android') {
    return rng.chance(0.5)
      ? rng.pick(FROST_ROOTS) + rng.pick(FROST_TAILS)
      : `${rng.pick(ANDROID_SUFFIX)}-${rng.int(1, 40)}`;
  }
  if (raceId === 'bioandroid') {
    return rng.pick(BIO_ROOTS) + rng.pick(BIO_TAILS);
  }
  const [roots, tails] = NAME_TABLES[raceId] || NAME_TABLES.other;
  let name = rng.pick(roots) + rng.pick(tails);
  // Occasional extra syllable, but only when the name is still short enough
  // to carry one without turning into noise.
  if (name.length <= 6 && rng.chance(0.25)) name += rng.pick(tails);
  // Keep it pronounceable: names that end on a consonant cluster get a vowel.
  if (/[bcdfgjklmnpqrstvwxz]{2}$/i.test(name)) name += rng.pick(['a', 'o', 'i', 'u']);
  if (name.length < 3) name += rng.pick(['an', 'is', 'or']);
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function generateFullName(rng, raceId) {
  const first = generateName(rng, raceId);
  if ((raceId === 'earthling' || raceId === 'halfsaiyan') && rng.chance(0.45)) {
    return `${first} ${rng.pick(EARTH_SURNAMES)}`;
  }
  return first;
}

export const EPITHETS = [
  'the Unbroken', 'of the Eastern Wastes', 'the Patient', 'Ironhand', 'the Quiet',
  'Twice-Killed', 'the Ninth', 'Stormcaller', 'the Merciless', 'of the Red Sands',
  'Nine-Fingers', 'the Undefeated', 'Ashborn', 'the Lesser', 'Skyblind', 'the Vain',
  'Halfmoon', 'Thricebound', 'the Unlucky', 'of No Fixed Planet', 'the Hollow',
  'Bloodless', 'the Younger', 'Coldwater', 'the Grinning', 'Last-of-Line',
];

export const TITLES = {
  saiyan: ['Elite', 'Low-Class Soldier', 'Squad Leader', 'Purge Commander', 'Prince', 'Deserter'],
  earthling: ['Sensei', 'Champion', 'Bandit', 'Officer', 'Doctor', 'Delivery Driver', 'Farmer', 'Student'],
  namekian: ['Warrior-Type', 'Dragon Clan', 'Elder', 'Guardian', 'Wanderer'],
  frostdemon: ['Lord', 'Commander', 'Heir', 'Governor', 'Exile'],
  majin: ['the Hungry', 'the Sleeping', 'the Pink', 'the Loud'],
  android: ['Field Unit', 'Prototype', 'Escaped Asset', 'Security Model'],
  bioandroid: ['Specimen', 'Failed Batch', 'Perfect Cell Line'],
  shinjin: ['Apprentice Kai', 'Kai of the North', 'Attendant', 'Supreme Kai Candidate'],
  tuffle: ['Chief Engineer', 'Archivist', 'Survivor', 'Machine-Wright'],
  yardratian: ['Spirit Adept', 'Elder', 'Wanderer'],
  cerealian: ['Bounty Hunter', 'Survivor', 'Scavenger', 'Last Son'],
  half_android: ['Field Unit', 'Escaped Asset', 'Student', 'Delivery Driver'],
  half_frostkin: ['Heir', 'Exile', 'Wanderer', 'Sensei'],
  frost_android: ['Prototype', 'Security Model', 'Governor', 'Escaped Asset'],
  other: ['Mercenary', 'Trader', 'Pilot', 'Nomad'],
};

export function generateTitle(rng, raceId) {
  return rng.pick(TITLES[raceId] || TITLES.other);
}

export function generateEpithet(rng) {
  return rng.pick(EPITHETS);
}

// Signature technique naming, used when a character invents their own move.
const SIG_A = ['Crimson', 'Iron', 'Falling', 'Hollow', 'Nine', 'Roaring', 'Silent', 'Burning',
  'Shattered', 'Endless', 'Twin', 'Black', 'Rising', 'Frozen', 'Ancestral', 'Final', 'Blinding',
  'Severing', 'Howling', 'Broken', 'Radiant', 'Devouring', 'Wandering', 'Thunderous'];
const SIG_B = ['Star', 'Fang', 'Comet', 'Petal', 'Chain', 'Pillar', 'Wave', 'Lotus', 'Serpent',
  'Anvil', 'Crown', 'Mirror', 'Tide', 'Spear', 'Halo', 'Coil', 'Bell', 'Gate', 'Storm', 'Blade'];
const SIG_C = ['Cannon', 'Fist', 'Barrage', 'Strike', 'Impact', 'Blast', 'Slash', 'Burst',
  'Driver', 'Bomb', 'Kick', 'Lance', 'Wave', 'Crusher', 'Blow', 'Hammer', 'Edge', 'Volley'];

export function generateSignatureName(rng) {
  const shape = rng.int(0, 2);
  if (shape === 0) return `${rng.pick(SIG_A)} ${rng.pick(SIG_B)} ${rng.pick(SIG_C)}`;
  if (shape === 1) return `${rng.pick(SIG_A)} ${rng.pick(SIG_C)}`;
  return `${rng.pick(SIG_B)}-${rng.pick(SIG_B)} ${rng.pick(SIG_C)}`;
}
