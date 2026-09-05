// The skill tree. Six branches, each with prerequisites, teachers and a real
// combat effect. `learnDC` is rolled against a blend of relevant stats.

export const BRANCHES = {
  ki: { name: 'Ki Arts', blurb: 'Turning your life force into ordnance.', colour: '#4aa3ff' },
  body: { name: 'Body Arts', blurb: 'Fists, forms, and the schools that teach them.', colour: '#ff7a45' },
  motion: { name: 'Movement', blurb: 'Getting somewhere before anyone sees you leave.', colour: '#37d67a' },
  support: { name: 'Support', blurb: 'Sensing, healing, hiding, and thinking ahead.', colour: '#b07cff' },
  forbidden: { name: 'Forbidden', blurb: 'Techniques with a price attached.', colour: '#ff4d6d' },
  divine: { name: 'Divine', blurb: 'Things mortals are not supposed to be able to do.', colour: '#ffd23f' },
};

export const TECHNIQUES = [
  // ------------------------------------------------------------------- Ki
  { id: 'ki_blast', name: 'Ki Blast', branch: 'ki', tier: 1, learnDC: 10, prereq: [], stat: { kiControl: 15 },
    effect: { atk: 4, kiCost: 2 }, teachers: ['roshi', 'krillin', 'piccolo', 'any_master'],
    desc: 'The first thing anyone learns. A fistful of your own energy, thrown.' },
  { id: 'kamehameha', name: 'Kamehameha', branch: 'ki', tier: 3, learnDC: 45, prereq: ['ki_blast'], stat: { kiControl: 45 },
    effect: { atk: 26, kiCost: 12, crit: 0.08 }, teachers: ['roshi', 'goku', 'gohan', 'krillin'],
    desc: 'Fifty years to invent, an afternoon to copy if you have the eyes for it.' },
  { id: 'super_kamehameha', name: 'Super Kamehameha', branch: 'ki', tier: 5, learnDC: 68, prereq: ['kamehameha'], stat: { kiControl: 68 },
    effect: { atk: 52, kiCost: 24, crit: 0.1 }, teachers: ['goku', 'gohan'],
    desc: 'The same technique with everything you have behind it.' },
  { id: 'masenko', name: 'Masenko', branch: 'ki', tier: 3, learnDC: 40, prereq: ['ki_blast'], stat: { kiControl: 40 },
    effect: { atk: 22, kiCost: 10 }, teachers: ['piccolo', 'gohan'],
    desc: 'Both hands to the forehead. Faster to fire than a Kamehameha, and it shows.' },
  { id: 'special_beam_cannon', name: 'Special Beam Cannon', branch: 'ki', tier: 5, learnDC: 62, prereq: ['masenko'], stat: { kiControl: 62, discipline: 55 },
    effect: { atk: 44, kiCost: 20, pierce: 0.5, chargeTurns: 1 }, teachers: ['piccolo'],
    desc: 'A drilling spiral that goes through anything, if you get the time to charge it.' },
  { id: 'galick_gun', name: 'Galick Gun', branch: 'ki', tier: 4, learnDC: 52, prereq: ['ki_blast'], stat: { kiControl: 50 },
    effect: { atk: 30, kiCost: 14 }, teachers: ['vegeta', 'nappa'],
    desc: 'Saiyan royal artillery. Purple, loud, and extremely rude.' },
  { id: 'final_flash', name: 'Final Flash', branch: 'ki', tier: 7, learnDC: 78, prereq: ['galick_gun'], stat: { kiControl: 75 },
    effect: { atk: 85, kiCost: 40, chargeTurns: 2, crit: 0.15 }, teachers: ['vegeta'],
    desc: 'Everything you have, gathered slowly, released once.' },
  { id: 'big_bang', name: 'Big Bang Attack', branch: 'ki', tier: 6, learnDC: 70, prereq: ['galick_gun'], stat: { kiControl: 66 },
    effect: { atk: 60, kiCost: 28 }, teachers: ['vegeta'],
    desc: 'One palm, one sphere, one crater where the argument used to be.' },
  { id: 'destructo_disc', name: 'Destructo Disc', branch: 'ki', tier: 4, learnDC: 55, prereq: ['ki_blast'], stat: { kiControl: 58, technique: 55 },
    effect: { atk: 34, kiCost: 15, pierce: 0.9 }, teachers: ['krillin'],
    desc: 'It cuts through anything, which is why the strong ones dodge instead of blocking.' },
  { id: 'dodon_ray', name: 'Dodon Ray', branch: 'ki', tier: 3, learnDC: 38, prereq: ['ki_blast'], stat: { kiControl: 38 },
    effect: { atk: 20, kiCost: 8, pierce: 0.3 }, teachers: ['tao', 'tien', 'crane_hermit'],
    desc: 'Crane School. One finger, one hole.' },
  { id: 'tri_beam', name: 'Tri-Beam', branch: 'ki', tier: 6, learnDC: 66, prereq: ['dodon_ray'], stat: { kiControl: 60, discipline: 70 },
    effect: { atk: 70, kiCost: 20, healthCost: 12 }, teachers: ['tien'],
    desc: 'Damage scaled to your own life, not your power. It works on anyone. Once or twice.' },
  { id: 'death_beam', name: 'Death Beam', branch: 'ki', tier: 4, learnDC: 44, prereq: ['ki_blast'], stat: { kiControl: 52 },
    effect: { atk: 28, kiCost: 6, pierce: 0.7, speed: 6 }, teachers: ['frieza', 'cooler'],
    desc: 'No charge, no flourish, no warning. Imperial efficiency.' },
  { id: 'death_ball', name: 'Death Ball', branch: 'ki', tier: 7, learnDC: 80, prereq: ['death_beam'], stat: { kiControl: 74 },
    effect: { atk: 95, kiCost: 45, chargeTurns: 2, planetKiller: true }, teachers: ['frieza'],
    desc: 'A small sun on a fingertip. It does not stop at the person you aimed at.' },
  { id: 'spirit_bomb', name: 'Spirit Bomb', branch: 'ki', tier: 8, learnDC: 85, prereq: ['kamehameha'], stat: { kiControl: 80, discipline: 70 },
    effect: { atk: 120, kiCost: 10, chargeTurns: 3, goodOnly: true }, teachers: ['king_kai'],
    desc: 'You do not power it. Everything alive nearby does, if they feel like it.' },
  { id: 'hellzone_grenade', name: 'Hellzone Grenade', branch: 'ki', tier: 6, learnDC: 72, prereq: ['ki_blast', 'ki_sense'], stat: { kiControl: 70, technique: 65 },
    effect: { atk: 66, kiCost: 30, inescapable: 0.5 }, teachers: ['piccolo'],
    desc: 'Surround them with orbs first. Then close your hand.' },
  { id: 'energy_absorb', name: 'Energy Absorption', branch: 'ki', tier: 4, learnDC: 50, prereq: [], stat: { intellect: 45 },
    effect: { drain: 0.3, kiCost: 0 }, teachers: ['gero', 'android_19'], races: ['android', 'bioandroid', 'majin', 'tuffle'],
    desc: 'Their attack becomes your fuel. Very unfair, which is the point.' },

  // ----------------------------------------------------------------- Body
  { id: 'basic_martial_arts', name: 'Basic Martial Arts', branch: 'body', tier: 1, learnDC: 8, prereq: [], stat: {},
    effect: { atk: 3, def: 3 }, teachers: ['any_master', 'roshi', 'grandpa'],
    desc: 'Stance, breathing, and how to fall without breaking.' },
  { id: 'turtle_style', name: 'Turtle School Style', branch: 'body', tier: 2, learnDC: 28, prereq: ['basic_martial_arts'], stat: { discipline: 30 },
    effect: { atk: 8, def: 8, kiControl: 4 }, teachers: ['roshi'],
    desc: 'Milk deliveries, field ploughing, and eventually the strongest style on Earth.' },
  { id: 'crane_style', name: 'Crane School Style', branch: 'body', tier: 2, learnDC: 28, prereq: ['basic_martial_arts'], stat: { technique: 35 },
    effect: { atk: 10, def: 4, speed: 4 }, teachers: ['crane_hermit', 'tien', 'tao'],
    desc: 'Faster and meaner than the Turtle School, and it will tell you so.' },
  { id: 'wolf_fang_fist', name: 'Wolf Fang Fist', branch: 'body', tier: 3, learnDC: 36, prereq: ['basic_martial_arts'], stat: { speed: 45 },
    effect: { atk: 16, speed: 5, combo: 0.2 }, teachers: ['yamcha'],
    desc: 'A flurry that looks unstoppable right up until someone stronger walks through it.' },
  { id: 'dragon_throw', name: 'Dragon Throw', branch: 'body', tier: 3, learnDC: 34, prereq: ['basic_martial_arts'], stat: { strength: 48 },
    effect: { atk: 14, counter: 0.15 }, teachers: ['roshi', 'ox_king'],
    desc: 'Their own momentum, redirected into the ground.' },
  { id: 'meteor_combination', name: 'Meteor Combination', branch: 'body', tier: 5, learnDC: 60, prereq: ['wolf_fang_fist', 'afterimage'], stat: { speed: 65, technique: 60 },
    effect: { atk: 38, combo: 0.35, speed: 4 }, teachers: ['goku', 'gohan'],
    desc: 'Twelve strikes before they finish blinking, and a kick to close.' },
  { id: 'dragon_fist', name: 'Dragon Fist', branch: 'body', tier: 8, learnDC: 88, prereq: ['meteor_combination', 'kamehameha'], stat: { strength: 75, kiControl: 75 },
    effect: { atk: 110, kiCost: 35, pierce: 0.6, crit: 0.2 }, teachers: ['goku'],
    desc: 'You punch through them and a golden dragon comes out the other side.' },
  { id: 'iron_body', name: 'Iron Body', branch: 'body', tier: 3, learnDC: 40, prereq: ['basic_martial_arts'], stat: { durability: 55, discipline: 50 },
    effect: { def: 18, healthMax: 10 }, teachers: ['ox_king', 'nam', 'any_master'],
    desc: 'Get hit on purpose, thousands of times, until it stops mattering.' },
  { id: 'stretch_limb', name: 'Elastic Limbs', branch: 'body', tier: 2, learnDC: 15, prereq: [], stat: {},
    effect: { atk: 6, reach: 0.2 }, teachers: [], races: ['namekian', 'majin'],
    desc: 'Your arm arrives several seconds before the rest of you.' },

  // --------------------------------------------------------------- Motion
  { id: 'bukujutsu', name: 'Flight', branch: 'motion', tier: 2, learnDC: 22, prereq: [], stat: { kiControl: 25 },
    effect: { speed: 8, def: 3 }, teachers: ['any_master', 'krillin', 'piccolo', 'chichi'],
    desc: 'Ki under your feet instead of ground. Half the fighters on Earth still cannot do it.' },
  { id: 'afterimage', name: 'Afterimage', branch: 'motion', tier: 4, learnDC: 48, prereq: ['bukujutsu'], stat: { speed: 55, technique: 50 },
    effect: { dodge: 0.14, speed: 4 }, teachers: ['roshi', 'goku', 'tien'],
    desc: 'You leave a picture of yourself standing where you used to be.' },
  { id: 'high_speed', name: 'High-Speed Movement', branch: 'motion', tier: 3, learnDC: 38, prereq: ['bukujutsu'], stat: { speed: 50 },
    effect: { speed: 10 }, teachers: ['any_master', 'vegeta', 'burter'],
    desc: 'Simply moving faster than eyes track. Unglamorous and devastating.' },
  { id: 'instant_transmission', name: 'Instant Transmission', branch: 'motion', tier: 6, learnDC: 74, prereq: ['ki_sense', 'bukujutsu'], stat: { kiControl: 72 },
    effect: { speed: 14, dodge: 0.1, escape: true }, teachers: ['yardrat_elder', 'goku'],
    desc: 'Lock onto a ki signature anywhere and simply be there.' },
  { id: 'kai_kai', name: 'Kai Kai', branch: 'motion', tier: 6, learnDC: 70, prereq: [], stat: { kiControl: 68 },
    effect: { speed: 12, escape: true }, teachers: ['supreme_kai', 'whis'], races: ['shinjin'],
    desc: 'The divine version, and it does not need a ki signature to aim at.' },
  { id: 'time_skip', name: 'Time-Skip', branch: 'motion', tier: 9, learnDC: 92, prereq: ['high_speed', 'ki_sense'], stat: { technique: 85, kiControl: 80 },
    effect: { speed: 20, dodge: 0.22, firstStrike: true }, teachers: ['hit'],
    desc: 'You take half a second out of the universe and spend it privately.' },

  // -------------------------------------------------------------- Support
  { id: 'ki_sense', name: 'Ki Sense', branch: 'support', tier: 2, learnDC: 20, prereq: [], stat: { kiControl: 25 },
    effect: { def: 4, accuracy: 0.08 }, teachers: ['any_master', 'krillin', 'piccolo', 'king_kai'],
    desc: 'Feeling where everyone is and roughly how frightened you should be.' },
  { id: 'ki_suppress', name: 'Ki Suppression', branch: 'support', tier: 3, learnDC: 34, prereq: ['ki_sense'], stat: { kiControl: 42, discipline: 40 },
    effect: { stealth: 0.3 }, teachers: ['piccolo', 'vegeta', 'any_master'],
    desc: 'Becoming a hole in the world where a fighter should be.' },
  { id: 'telepathy', name: 'Telepathy', branch: 'support', tier: 3, learnDC: 36, prereq: ['ki_sense'], stat: { intellect: 50, kiControl: 40 },
    effect: { social: 6 }, teachers: ['king_kai', 'piccolo', 'chiaotzu'],
    desc: 'Talking without talking. Excellent for co-ordination, terrible for privacy.' },
  { id: 'healing', name: 'Healing Hands', branch: 'support', tier: 5, learnDC: 60, prereq: ['ki_sense'], stat: { kiControl: 65, intellect: 55 },
    effect: { heal: 30, kiCost: 20 }, teachers: ['dende', 'guru', 'supreme_kai'], races: ['namekian', 'shinjin', 'earthling', 'yardratian', 'cerealian'],
    desc: 'Pouring your own life into someone else until they stand up.' },
  { id: 'regenerate', name: 'Regeneration', branch: 'support', tier: 4, learnDC: 45, prereq: [], stat: {},
    effect: { regen: 0.12, kiCost: 8 }, teachers: [], races: ['namekian', 'majin', 'bioandroid'],
    desc: 'Losing an arm is an inconvenience with a five second fix.' },
  { id: 'multiform', name: 'Multi-Form', branch: 'support', tier: 5, learnDC: 58, prereq: ['ki_suppress'], stat: { kiControl: 62, technique: 60 },
    effect: { attacks: 2, powerSplit: 0.6 }, teachers: ['tien', 'piccolo'],
    desc: 'Four of you, each a quarter as strong. Better than it sounds, sometimes.' },
  { id: 'solar_flare', name: 'Solar Flare', branch: 'support', tier: 3, learnDC: 30, prereq: ['ki_blast'], stat: { technique: 40 },
    effect: { blind: 0.4, kiCost: 6 }, teachers: ['tien', 'krillin', 'goku'],
    desc: 'The single most useful technique ever invented, and nobody respects it.' },
  { id: 'telekinesis', name: 'Telekinesis', branch: 'support', tier: 4, learnDC: 46, prereq: ['ki_sense'], stat: { kiControl: 55, intellect: 55 },
    effect: { control: 0.2, kiCost: 10 }, teachers: ['chiaotzu', 'babidi', 'piccolo'],
    desc: 'Holding people still with your mind while your fists catch up.' },
  { id: 'senzu_farming', name: 'Senzu Cultivation', branch: 'support', tier: 4, learnDC: 50, prereq: [], stat: { intellect: 50, discipline: 60 },
    effect: { senzuPerYear: 1 }, teachers: ['korin', 'yajirobe'],
    desc: 'Korin will not just give you the beans. He might let you learn to grow them.' },

  // ------------------------------------------------------------ Forbidden
  { id: 'kaioken', name: 'Kaio-ken', branch: 'forbidden', tier: 5, learnDC: 64, prereq: ['ki_sense'], stat: { discipline: 60, durability: 55 },
    effect: { multiplier: 2, healthCost: 8 }, teachers: ['king_kai'],
    desc: 'Multiply everything by more than your body can survive, briefly.' },
  { id: 'mafuba', name: 'Evil Containment Wave', branch: 'forbidden', tier: 6, learnDC: 72, prereq: ['ki_control_mastery'], stat: { kiControl: 70, discipline: 75 },
    effect: { seal: 0.5, selfKill: 0.5 }, teachers: ['roshi', 'mutaito', 'trunks'],
    desc: 'Seal anything into a jar. It usually kills whoever performs it.' },
  { id: 'body_change', name: 'Body Change', branch: 'forbidden', tier: 6, learnDC: 70, prereq: ['telepathy'], stat: { technique: 70, kiControl: 60 },
    effect: { steal: true, kiCost: 25 }, teachers: ['ginyu'],
    desc: 'Swap bodies with someone stronger. Try not to get interrupted by a frog.' },
  { id: 'absorb', name: 'Absorption', branch: 'forbidden', tier: 7, learnDC: 76, prereq: [], stat: { durability: 60 },
    effect: { absorb: true }, teachers: [], races: ['majin', 'bioandroid', 'namekian'],
    desc: 'Take them in. Keep the useful parts.' },
  { id: 'life_drain', name: 'Life Drain', branch: 'forbidden', tier: 6, learnDC: 70, prereq: ['ki_sense'], stat: { kiControl: 65 },
    effect: { drain: 0.4, karma: -12 }, teachers: ['babidi', 'garlic', 'gero'],
    desc: 'Their years, added to yours. People notice this sort of thing.' },
  { id: 'suicide_blast', name: 'Final Explosion', branch: 'forbidden', tier: 7, learnDC: 60, prereq: ['ki_blast'], stat: { discipline: 70 },
    effect: { atk: 400, selfKill: 0.95 }, teachers: ['vegeta', 'chiaotzu', 'android_16'],
    desc: 'Every scrap of energy you have, released at once, from inside your own body.' },
  { id: 'mind_control', name: 'Majin Control', branch: 'forbidden', tier: 7, learnDC: 78, prereq: ['telepathy'], stat: { intellect: 70 },
    effect: { dominate: 0.3, karma: -20 }, teachers: ['babidi', 'bibidi'],
    desc: 'Find the evil already inside someone and turn the volume up.' },

  // --------------------------------------------------------------- Divine
  { id: 'ki_control_mastery', name: 'Ki Mastery', branch: 'divine', tier: 5, learnDC: 60, prereq: ['ki_sense', 'ki_suppress'], stat: { kiControl: 70, discipline: 65 },
    effect: { kiMax: 25, efficiency: 0.2 }, teachers: ['king_kai', 'kami', 'guru', 'whis'],
    desc: 'Not a technique. The point where your ki stops being something you use.' },
  { id: 'god_ki', name: 'Divine Ki', branch: 'divine', tier: 8, learnDC: 86, prereq: ['ki_control_mastery'], stat: { kiControl: 82, discipline: 78 },
    effect: { divine: true, atk: 40, def: 20 }, teachers: ['whis', 'beerus', 'supreme_kai'],
    desc: 'A different kind of energy entirely. Mortals cannot sense it or fight it.' },
  { id: 'hakai', name: 'Hakai', branch: 'divine', tier: 10, learnDC: 96, prereq: ['god_ki'], stat: { kiControl: 90, discipline: 85 },
    effect: { erase: 0.15, kiCost: 50 }, teachers: ['beerus', 'whis'],
    desc: 'Not damage. Deletion. The target simply stops having existed.' },
  { id: 'ultra_instinct_art', name: 'Instinctive Motion', branch: 'divine', tier: 9, learnDC: 92, prereq: ['afterimage', 'ki_control_mastery'], stat: { kiControl: 85, discipline: 80 },
    effect: { dodge: 0.3, counter: 0.25 }, teachers: ['whis'],
    desc: 'Training your body to answer before your mind has finished the question.' },
  { id: 'fusion_dance', name: 'Fusion Dance', branch: 'divine', tier: 6, learnDC: 55, prereq: ['bukujutsu'], stat: { technique: 60, discipline: 50 },
    effect: { fusion: 'dance' }, teachers: ['goku', 'metamoran_elder'],
    desc: 'Two warriors, identical power, and a pose you will be teased about forever.' },
  { id: 'potara_craft', name: 'Potara Rite', branch: 'divine', tier: 8, learnDC: 84, prereq: [], stat: { intellect: 75, kiControl: 70 }, races: ['shinjin'],
    effect: { fusion: 'potara' }, teachers: ['supreme_kai', 'old_kai'],
    desc: 'The earrings are the easy part. Knowing when to use them is not.' },
  { id: 'spirit_control', name: 'Spirit Control', branch: 'divine', tier: 6, learnDC: 68, prereq: ['ki_control_mastery'], stat: { kiControl: 75 }, races: ['yardratian', 'earthling', 'namekian', 'cerealian'],
    effect: { kiMax: 30, shapeShift: true }, teachers: ['yardrat_elder'],
    desc: 'The Yardratian approach: never mind muscle, reshape the spirit.' },
];

export const TECH_BY_ID = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t]));

export function getTechnique(id) {
  return TECH_BY_ID[id];
}

/** Techniques a character could plausibly start learning right now. */
export function availableTechniques(character) {
  return TECHNIQUES.filter((t) => {
    if (character.techniques.includes(t.id)) return false;
    if (t.races && !t.races.includes(character.raceId)) return false;
    return t.prereq.every((p) => character.techniques.includes(p));
  });
}

export function techniquePower(character) {
  let atk = 0, def = 0, speed = 0;
  for (const id of character.techniques) {
    const t = TECH_BY_ID[id];
    if (!t) continue;
    atk += t.effect.atk || 0;
    def += t.effect.def || 0;
    speed += t.effect.speed || 0;
  }
  return { atk, def, speed };
}
