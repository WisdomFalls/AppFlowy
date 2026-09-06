// What the canon cast actually look like.
//
// The engine could draw the player and nobody else, so every famous fighter in
// the game was a name on a row. These are appearance records in the same shape
// the player's uses, so one drawing routine serves all of them.
//
// `eras` lets a character change across the timeline the way they do in the
// source: Goku is a child at the 21st tournament and a grandfather by Age 790,
// and the entry that applies is the last one whose year has passed.

export const CANON_LOOKS = {
  goku: {
    sex: 'male', skin: 'light', face: 'square', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'spiked', hairColour: 'black', outfit: 'gi_orange', buildShape: 'balanced',
    accessories: [], marks: [],
    eras: [
      { from: 749, buildShape: 'small', accessories: ['pole'] },
      { from: 756, buildShape: 'lean' },
      { from: 761, buildShape: 'stocky', accessories: [] },
      { from: 774, buildShape: 'stocky', accessories: ['belt'] },
    ],
  },
  vegeta: {
    sex: 'male', skin: 'light', face: 'angular', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'spiked', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'stocky',
    accessories: ['scouter'], marks: [],
    eras: [
      { from: 762, accessories: [] },
      { from: 767, outfit: 'gi_blue' },
      { from: 780, outfit: 'armour_saiyan' },
    ],
  },
  bulma: {
    sex: 'female', skin: 'pale', face: 'round', eyeShape: 'wide', eyeColour: 'blue',
    hairStyle: 'long', hairColour: 'blue', outfit: 'casual', buildShape: 'lean',
    accessories: ['earrings'], marks: [],
    eras: [{ from: 767, hairStyle: 'bob' }, { from: 780, hairStyle: 'bob', hairColour: 'lavender' }],
  },
  krillin: {
    sex: 'male', skin: 'light', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'gi_orange', buildShape: 'small',
    accessories: [], marks: ['dots'],
    eras: [{ from: 774, hairStyle: 'cropped', marks: [] }],
  },
  roshi: {
    sex: 'male', skin: 'light', face: 'round', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'white', outfit: 'casual', buildShape: 'small',
    accessories: ['sunglasses', 'shell'], marks: [],
  },
  chichi: {
    sex: 'female', skin: 'light', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'ponytail', hairColour: 'black', outfit: 'gi_black', buildShape: 'lean',
    accessories: [], marks: [],
    eras: [{ from: 767, hairStyle: 'topknot', outfit: 'casual' }],
  },
  gohan: {
    sex: 'male', skin: 'light', face: 'square', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'spiked', hairColour: 'black', outfit: 'gi_orange', buildShape: 'lean',
    accessories: [], marks: [],
    eras: [
      { from: 761, buildShape: 'small' },
      { from: 767, buildShape: 'lean', hairStyle: 'cropped' },
      { from: 774, outfit: 'casual', accessories: ['glasses'] },
    ],
  },
  goten: {
    sex: 'male', skin: 'light', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'spiked', hairColour: 'black', outfit: 'gi_orange', buildShape: 'small',
    accessories: [], marks: [],
    eras: [{ from: 780, buildShape: 'lean', hairStyle: 'cropped' }],
  },
  trunks: {
    sex: 'male', skin: 'light', face: 'square', eyeShape: 'sharp', eyeColour: 'blue',
    hairStyle: 'bob', hairColour: 'lavender', outfit: 'armour_saiyan', buildShape: 'lean',
    accessories: [], marks: [],
    eras: [{ from: 780, outfit: 'casual', hairStyle: 'cropped' }],
  },
  piccolo: {
    sex: 'male', skin: 'green', face: 'angular', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'namek_robe', buildShape: 'lean',
    accessories: ['turban', 'cape'], marks: [],
  },
  kami: {
    sex: 'male', skin: 'green', face: 'long', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'namek_robe', buildShape: 'wiry',
    accessories: ['cape'], marks: [],
  },
  frieza: {
    sex: 'male', skin: 'white', face: 'angular', eyeShape: 'sharp', eyeColour: 'red',
    hairStyle: 'bald', hairColour: 'black', outfit: 'none', buildShape: 'small',
    accessories: ['scouter'], marks: [],
    eras: [{ from: 763, accessories: [] }, { from: 779, accessories: [] }],
  },
  king_cold: {
    sex: 'male', skin: 'white', face: 'long', eyeShape: 'sharp', eyeColour: 'red',
    hairStyle: 'bald', hairColour: 'black', outfit: 'none', buildShape: 'massive',
    accessories: ['cape'], marks: [],
  },
  cell: {
    sex: 'male', skin: 'green', face: 'angular', eyeShape: 'sharp', eyeColour: 'violet',
    hairStyle: 'bald', hairColour: 'black', outfit: 'none', buildShape: 'massive',
    accessories: [], marks: ['dots'],
  },
  cooler: {
    sex: 'male', skin: 'blue', face: 'angular', eyeShape: 'narrow', eyeColour: 'red',
    hairStyle: 'bald', hairColour: 'black', outfit: 'none', buildShape: 'lean',
    accessories: [], marks: [],
  },
  nappa: {
    sex: 'male', skin: 'tan', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'massive',
    accessories: ['scouter'], marks: [],
  },
  raditz: {
    sex: 'male', skin: 'tan', face: 'angular', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'long', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'stocky',
    accessories: ['scouter'], marks: [],
  },
  bardock: {
    sex: 'male', skin: 'tan', face: 'angular', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'spiked', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'stocky',
    accessories: ['scouter'], marks: ['scar_cheek'],
  },
  tien: {
    sex: 'male', skin: 'light', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'gi_black', buildShape: 'stocky',
    accessories: [], marks: ['thirdeye'],
  },
  yamcha: {
    sex: 'male', skin: 'light', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'long', hairColour: 'black', outfit: 'gi_orange', buildShape: 'lean',
    accessories: [], marks: ['scar_cheek'],
    eras: [{ from: 761, hairStyle: 'cropped' }],
  },
  android_18: {
    sex: 'female', skin: 'pale', face: 'square', eyeShape: 'sharp', eyeColour: 'blue',
    hairStyle: 'bob', hairColour: 'blonde', outfit: 'casual', buildShape: 'lean',
    accessories: ['earring'], marks: [],
  },
  android_17: {
    sex: 'male', skin: 'pale', face: 'square', eyeShape: 'sharp', eyeColour: 'blue',
    hairStyle: 'bob', hairColour: 'black', outfit: 'casual', buildShape: 'lean',
    accessories: ['scarf'], marks: [],
  },
  beerus: {
    sex: 'male', skin: 'purple', face: 'long', eyeShape: 'narrow', eyeColour: 'gold',
    hairStyle: 'bald', hairColour: 'black', outfit: 'kai', buildShape: 'wiry',
    accessories: ['earrings'], marks: [],
  },
  whis: {
    sex: 'male', skin: 'blue', face: 'long', eyeShape: 'narrow', eyeColour: 'violet',
    hairStyle: 'cropped', hairColour: 'white', outfit: 'kai', buildShape: 'wiry',
    accessories: ['necklace'], marks: [],
  },
  king_kai: {
    sex: 'male', skin: 'blue', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'cropped', hairColour: 'black', outfit: 'kai', buildShape: 'small',
    accessories: ['sunglasses'], marks: ['dots'],
  },
  supreme_kai: {
    sex: 'male', skin: 'purple', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'mohawk', hairColour: 'white', outfit: 'kai', buildShape: 'small',
    accessories: ['potara'], marks: [],
  },
  hit: {
    sex: 'male', skin: 'pale', face: 'angular', eyeShape: 'narrow', eyeColour: 'red',
    hairStyle: 'mohawk', hairColour: 'red', outfit: 'coat', buildShape: 'lean',
    accessories: [], marks: [],
  },
  cabba: {
    sex: 'male', skin: 'tan', face: 'square', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'spiked', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'lean',
    accessories: [], marks: [],
  },
  kale: {
    sex: 'female', skin: 'tan', face: 'round', eyeShape: 'wide', eyeColour: 'black',
    hairStyle: 'ponytail', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'wiry',
    accessories: [], marks: [],
  },
  caulifla: {
    sex: 'female', skin: 'tan', face: 'angular', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'wild', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'lean',
    accessories: [], marks: [],
  },
  jiren: {
    sex: 'male', skin: 'grey', face: 'square', eyeShape: 'wide', eyeColour: 'grey',
    hairStyle: 'bald', hairColour: 'black', outfit: 'gi_black', buildShape: 'massive',
    accessories: [], marks: [],
  },
  broly: {
    sex: 'male', skin: 'tan', face: 'square', eyeShape: 'wide', eyeColour: 'black',
    hairStyle: 'wild', hairColour: 'black', outfit: 'none', buildShape: 'massive',
    accessories: ['necklace'], marks: ['scar_chest'],
  },
  buu: {
    sex: 'male', skin: 'pink', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'none', buildShape: 'massive',
    accessories: ['cape'], marks: [],
  },
  videl: {
    sex: 'female', skin: 'light', face: 'square', eyeShape: 'sharp', eyeColour: 'blue',
    hairStyle: 'ponytail', hairColour: 'black', outfit: 'casual', buildShape: 'lean',
    accessories: [], marks: [],
    eras: [{ from: 776, hairStyle: 'bob' }],
  },
  satan: {
    sex: 'male', skin: 'tan', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'wild', hairColour: 'black', outfit: 'casual', buildShape: 'massive',
    accessories: ['belt'], marks: [],
  },
  korin: {
    sex: 'male', skin: 'white', face: 'round', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'white', outfit: 'none', buildShape: 'small',
    accessories: [], marks: [],
  },
  recoome: {
    sex: 'male', skin: 'light', face: 'square', eyeShape: 'wide', eyeColour: 'blue',
    hairStyle: 'wild', hairColour: 'red', outfit: 'armour_frieza', buildShape: 'massive',
    accessories: ['scouter'], marks: [],
  },
  burter: {
    sex: 'male', skin: 'blue', face: 'long', eyeShape: 'narrow', eyeColour: 'red',
    hairStyle: 'bald', hairColour: 'black', outfit: 'armour_frieza', buildShape: 'wiry',
    accessories: ['scouter'], marks: [],
  },
  jeice: {
    sex: 'male', skin: 'pink', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'long', hairColour: 'white', outfit: 'armour_frieza', buildShape: 'lean',
    accessories: ['scouter'], marks: [],
  },
  moori: {
    sex: 'male', skin: 'green', face: 'long', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'namek_robe', buildShape: 'lean',
    accessories: [], marks: [],
  },
  oolong: {
    sex: 'male', skin: 'pink', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'casual', buildShape: 'small',
    accessories: [], marks: [],
  },
  puar: {
    sex: 'male', skin: 'blue', face: 'round', eyeShape: 'wide', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'none', buildShape: 'small',
    accessories: [], marks: [],
  },
  shenron: {
    sex: 'male', skin: 'green', face: 'long', eyeShape: 'sharp', eyeColour: 'red',
    hairStyle: 'bald', hairColour: 'black', outfit: 'none', buildShape: 'massive',
    accessories: [], marks: [],
  },
  porunga: {
    sex: 'male', skin: 'green', face: 'square', eyeShape: 'wide', eyeColour: 'red',
    hairStyle: 'bald', hairColour: 'black', outfit: 'none', buildShape: 'massive',
    accessories: [], marks: [],
  },
  gine: {
    sex: 'female', skin: 'tan', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'wild', hairColour: 'black', outfit: 'casual', buildShape: 'lean',
    accessories: [], marks: [],
  },
  turles: {
    sex: 'male', skin: 'tan', face: 'angular', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'spiked', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'stocky',
    accessories: ['scouter'], marks: [],
  },
  paragus: {
    sex: 'male', skin: 'tan', face: 'long', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'long', hairColour: 'black', outfit: 'armour_saiyan', buildShape: 'lean',
    accessories: ['eyepatch'], marks: ['missing_eye'],
  },
  zarbon: {
    sex: 'male', skin: 'green', face: 'long', eyeShape: 'sharp', eyeColour: 'gold',
    hairStyle: 'braid', hairColour: 'green', outfit: 'armour_frieza', buildShape: 'lean',
    accessories: ['scouter', 'earrings'], marks: [],
  },
  dodoria: {
    sex: 'male', skin: 'pink', face: 'round', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'armour_frieza', buildShape: 'massive',
    accessories: ['scouter'], marks: [],
  },
  ginyu: {
    sex: 'male', skin: 'purple', face: 'long', eyeShape: 'sharp', eyeColour: 'red',
    hairStyle: 'bald', hairColour: 'black', outfit: 'armour_frieza', buildShape: 'stocky',
    accessories: ['scouter'], marks: ['dots'],
  },
  gero: {
    sex: 'male', skin: 'pale', face: 'long', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'cropped', hairColour: 'white', outfit: 'lab', buildShape: 'wiry',
    accessories: ['glasses'], marks: [],
  },
  dende: {
    sex: 'male', skin: 'green', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'namek_robe', buildShape: 'small',
    accessories: [], marks: [],
  },
  guru: {
    sex: 'male', skin: 'green', face: 'round', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'namek_robe', buildShape: 'massive',
    accessories: [], marks: [],
  },
  nail: {
    sex: 'male', skin: 'green', face: 'angular', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'namek_robe', buildShape: 'stocky',
    accessories: [], marks: [],
  },
  babidi: {
    sex: 'male', skin: 'grey', face: 'long', eyeShape: 'wide', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'coat', buildShape: 'small',
    accessories: [], marks: [],
  },
  dabura: {
    sex: 'male', skin: 'grey', face: 'angular', eyeShape: 'sharp', eyeColour: 'red',
    hairStyle: 'bald', hairColour: 'black', outfit: 'coat', buildShape: 'stocky',
    accessories: ['cape'], marks: [],
  },
  future_trunks: {
    sex: 'male', skin: 'light', face: 'square', eyeShape: 'sharp', eyeColour: 'blue',
    hairStyle: 'bob', hairColour: 'lavender', outfit: 'coat', buildShape: 'lean',
    accessories: ['sword'], marks: [],
  },
  pan: {
    sex: 'female', skin: 'light', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'bob', hairColour: 'black', outfit: 'casual', buildShape: 'small',
    accessories: ['bandana'], marks: [],
  },
  bulla: {
    sex: 'female', skin: 'pale', face: 'round', eyeShape: 'wide', eyeColour: 'blue',
    hairStyle: 'long', hairColour: 'blue', outfit: 'casual', buildShape: 'lean',
    accessories: ['earrings'], marks: [],
  },
  marron: {
    sex: 'female', skin: 'pale', face: 'round', eyeShape: 'round', eyeColour: 'blue',
    hairStyle: 'ponytail', hairColour: 'blonde', outfit: 'casual', buildShape: 'small',
    accessories: [], marks: [],
  },
  uub: {
    sex: 'male', skin: 'deep', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'mohawk', hairColour: 'black', outfit: 'gi_orange', buildShape: 'lean',
    accessories: [], marks: [],
  },
  chiaotzu: {
    sex: 'male', skin: 'pale', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'gi_black', buildShape: 'small',
    accessories: [], marks: [],
  },
  yajirobe: {
    sex: 'male', skin: 'light', face: 'round', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'long', hairColour: 'black', outfit: 'coat', buildShape: 'stocky',
    accessories: ['sword'], marks: [],
  },
  ox_king: {
    sex: 'male', skin: 'tan', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'coat', buildShape: 'massive',
    accessories: ['hat'], marks: [],
  },
  popo: {
    sex: 'male', skin: 'deep', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'namek_robe', buildShape: 'stocky',
    accessories: ['turban'], marks: [],
  },
  baba: {
    sex: 'female', skin: 'light', face: 'round', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'white', outfit: 'coat', buildShape: 'small',
    accessories: ['hat'], marks: [],
  },
  old_kai: {
    sex: 'male', skin: 'purple', face: 'long', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'topknot', hairColour: 'white', outfit: 'kai', buildShape: 'small',
    accessories: ['potara'], marks: [],
  },
  tao: {
    sex: 'male', skin: 'light', face: 'angular', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'braid', hairColour: 'black', outfit: 'coat', buildShape: 'lean',
    accessories: ['sunglasses'], marks: [],
  },
  crane_hermit: {
    sex: 'male', skin: 'light', face: 'long', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'white', outfit: 'coat', buildShape: 'wiry',
    accessories: ['sunglasses'], marks: [],
  },
  launch: {
    sex: 'female', skin: 'light', face: 'round', eyeShape: 'wide', eyeColour: 'blue',
    hairStyle: 'long', hairColour: 'blonde', outfit: 'casual', buildShape: 'lean',
    accessories: [], marks: [],
  },
  pilaf: {
    sex: 'male', skin: 'blue', face: 'round', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'coat', buildShape: 'small',
    accessories: ['cape'], marks: [],
  },
  yardrat_elder: {
    sex: 'male', skin: 'blue', face: 'long', eyeShape: 'narrow', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'white', outfit: 'namek_robe', buildShape: 'small',
    accessories: [], marks: [],
  },
  android_16: {
    sex: 'male', skin: 'light', face: 'square', eyeShape: 'sharp', eyeColour: 'green',
    hairStyle: 'mohawk', hairColour: 'orange', outfit: 'casual', buildShape: 'massive',
    accessories: ['earrings'], marks: [],
  },
  zeno: {
    sex: 'male', skin: 'blue', face: 'round', eyeShape: 'round', eyeColour: 'black',
    hairStyle: 'bald', hairColour: 'black', outfit: 'kai', buildShape: 'small',
    accessories: [], marks: [],
  },
  yemma: {
    sex: 'male', skin: 'deep', face: 'square', eyeShape: 'sharp', eyeColour: 'black',
    hairStyle: 'topknot', hairColour: 'black', outfit: 'coat', buildShape: 'massive',
    accessories: [], marks: [],
  },
};

/** Fallbacks by species, so a character with no entry still looks like itself. */
export const SPECIES_LOOK = {
  saiyan: { skin: 'tan', hairStyle: 'spiked', hairColour: 'black', outfit: 'armour_saiyan', eyeColour: 'black', face: 'angular' },
  halfsaiyan: { skin: 'light', hairStyle: 'spiked', hairColour: 'black', outfit: 'gi_orange', eyeColour: 'black', face: 'square' },
  earthling: { skin: 'light', hairStyle: 'cropped', hairColour: 'black', outfit: 'gi_orange', eyeColour: 'black', face: 'square' },
  namekian: { skin: 'green', hairStyle: 'bald', hairColour: 'black', outfit: 'namek_robe', eyeColour: 'black', face: 'angular' },
  frostdemon: { skin: 'white', hairStyle: 'bald', hairColour: 'white', outfit: 'none', eyeColour: 'red', face: 'angular' },
  majin: { skin: 'pink', hairStyle: 'bald', hairColour: 'black', outfit: 'none', eyeColour: 'black', face: 'round' },
  android: { skin: 'pale', hairStyle: 'cropped', hairColour: 'blonde', outfit: 'casual', eyeColour: 'blue', face: 'square' },
  bioandroid: { skin: 'green', hairStyle: 'bald', hairColour: 'black', outfit: 'none', eyeColour: 'violet', face: 'angular' },
  shinjin: { skin: 'purple', hairStyle: 'mohawk', hairColour: 'white', outfit: 'kai', eyeColour: 'black', face: 'square' },
  tuffle: { skin: 'grey', hairStyle: 'cropped', hairColour: 'brown', outfit: 'lab', eyeColour: 'brown', face: 'round' },
  yardratian: { skin: 'blue', hairStyle: 'bald', hairColour: 'white', outfit: 'namek_robe', eyeColour: 'black', face: 'long' },
  cerealian: { skin: 'tan', hairStyle: 'long', hairColour: 'white', outfit: 'coat', eyeColour: 'grey', face: 'angular' },
  other: { skin: 'tan', hairStyle: 'cropped', hairColour: 'black', outfit: 'coat', eyeColour: 'black', face: 'square' },
};

/**
 * The appearance a canon character has in a given year: the base record with
 * every era entry up to that year folded in, so they change on schedule and
 * stay the same in between.
 */
export function canonLook(canonId, year, raceId) {
  const base = CANON_LOOKS[canonId];
  if (!base) {
    const sp = SPECIES_LOOK[raceId] || SPECIES_LOOK.other;
    return { ...sp, buildShape: 'balanced', eyeShape: 'sharp', accessories: [], marks: [] };
  }
  const out = { ...base };
  delete out.eras;
  for (const era of base.eras || []) {
    if (year >= era.from) Object.assign(out, era);
  }
  return out;
}
