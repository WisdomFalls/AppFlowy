// Transformation ladders. Each form multiplies effective power, drains ki, and
// unlocks only when its requirement object is satisfied by the live character.
//
// req fields (all optional, all ANDed):
//   power      minimum base power level
//   parent     transformation that must already be unlocked
//   stat       { statName: minimum }
//   flags      story flags that must be set
//   anyFlag    at least one of these story flags
//   traits     character traits/perks required (e.g. 'tail')
//   mentors    mentors you must have trained under
//   techniques techniques you must know
//   age        minimum age
//   custom     id resolved by the engine's special-case table

export const TRANSFORMATIONS = [
  // ---------------------------------------------------------------- Saiyan
  {
    id: 'oozaru', name: 'Great Ape', ladder: ['saiyan', 'halfsaiyan'], tier: 1,
    mult: 10, drain: 8, control: -60, strain: 6,
    req: { traits: ['tail'], custom: 'blutz_wave' },
    hint: 'Keep your tail and look at a full moon (or make your own Blutz Wave).',
    desc: 'Twelve metres of unthinking Saiyan. Enormous power, almost no judgement.',
  },
  {
    id: 'golden_oozaru', name: 'Golden Great Ape', ladder: ['saiyan', 'halfsaiyan'], tier: 4,
    mult: 40, drain: 14, control: -70, strain: 12,
    req: { parent: 'oozaru', power: 400000, traits: ['tail'], custom: 'blutz_wave' },
    hint: 'Reach Super Saiyan power while still able to go Great Ape.',
    desc: 'A Super Saiyan the size of a building. Nothing survives underneath it.',
  },
  {
    id: 'ssj', name: 'Super Saiyan', ladder: ['saiyan', 'halfsaiyan'], tier: 5,
    mult: 50, drain: 3, control: -10, strain: 2,
    req: { power: 30000, anyFlag: ['grief', 'rage_awakened', 'watched_friend_die', 'brink_of_death'] },
    hint: 'Enough raw power, and a loss you cannot fight your way out of.',
    desc: 'Gold hair, green eyes, and a rage that finally has somewhere to go.',
  },
  {
    id: 'ssj_full', name: 'Full-Power Super Saiyan', ladder: ['saiyan', 'halfsaiyan'], tier: 6,
    mult: 60, drain: 0.6, control: 10, strain: 0,
    req: { parent: 'ssj', stat: { discipline: 60 }, custom: 'ssj_hours' },
    hint: 'Live in Super Saiyan until it stops costing you anything.',
    desc: 'You stopped transforming and started simply being this.',
  },
  {
    id: 'ssj2', name: 'Super Saiyan 2', ladder: ['saiyan', 'halfsaiyan'], tier: 7,
    mult: 100, drain: 5, control: -15, strain: 4,
    req: { parent: 'ssj', power: 200000, anyFlag: ['fury', 'watched_friend_die', 'protected_someone', 'humiliated'] },
    hint: 'Master Super Saiyan, then find something worth losing your temper over.',
    desc: 'Crackling lightning, still eyes. The calm part of you is the dangerous part.',
  },
  {
    id: 'ssj3', name: 'Super Saiyan 3', ladder: ['saiyan', 'halfsaiyan'], tier: 8,
    mult: 400, drain: 22, control: -25, strain: 14,
    req: { parent: 'ssj2', power: 1500000, stat: { discipline: 70, kiControl: 65 } },
    hint: 'Years of nothing but training, ideally somewhere time runs strangely.',
    desc: 'No eyebrows, hair to your knees, and a body that cannot hold this for long.',
  },
  {
    id: 'ssg', name: 'Super Saiyan God', ladder: ['saiyan', 'halfsaiyan'], tier: 9,
    mult: 900, drain: 4, control: 20, strain: 3,
    req: { power: 3000000, custom: 'god_ritual' },
    hint: 'Five righteous Saiyans pouring their hearts into you, or a god willing to teach.',
    desc: 'Slim red aura, divine ki. Mortals cannot even sense you now.',
  },
  {
    id: 'ssb', name: 'Super Saiyan Blue', ladder: ['saiyan', 'halfsaiyan'], tier: 10,
    mult: 2500, drain: 9, control: 15, strain: 5,
    req: { parent: 'ssg', mentors: ['whis'], stat: { kiControl: 80 } },
    hint: 'Take god ki, then go Super Saiyan on top of it. Requires an angel as a teacher.',
    desc: 'Divine ki wearing a Super Saiyan over it. Perfect control, ruinous cost.',
  },
  {
    id: 'ssb_kaioken', name: 'Blue Kaio-ken', ladder: ['saiyan', 'halfsaiyan'], tier: 11,
    mult: 6000, drain: 26, control: 0, strain: 22,
    req: { parent: 'ssb', techniques: ['kaioken'], stat: { discipline: 85 } },
    hint: 'Stack the Kaio-ken on top of Blue and accept what it does to you.',
    desc: 'Two impossible techniques at once. Your body is already failing.',
  },
  {
    id: 'ultra_ego', name: 'Ultra Ego', ladder: ['saiyan'], tier: 12,
    mult: 9000, drain: 12, control: -5, strain: 10,
    req: { parent: 'ssb', custom: 'destroyer_path', stat: { discipline: 70 } },
    hint: 'Learn destruction energy from a God of Destruction and learn to enjoy being hurt.',
    desc: 'Purple aura, wild grin. The more damage you take the stronger you get.',
  },
  {
    id: 'ui_sign', name: 'Ultra Instinct -Sign-', ladder: ['saiyan', 'halfsaiyan', 'earthling', 'namekian', 'cerealian', 'yardratian'], tier: 12,
    mult: 7000, drain: 20, control: 40, strain: 16,
    req: { power: 40000000, stat: { kiControl: 88, discipline: 80 }, custom: 'ui_trigger' },
    hint: 'Push past every limit with a clear mind. Angels can show you the door.',
    desc: 'Silver-edged hair. Your body moves before you decide to.',
  },
  {
    id: 'ui_mastered', name: 'Mastered Ultra Instinct', ladder: ['saiyan', 'halfsaiyan', 'earthling', 'namekian', 'cerealian', 'yardratian'], tier: 13,
    mult: 25000, drain: 15, control: 60, strain: 12,
    req: { parent: 'ui_sign', mentors: ['whis'], stat: { kiControl: 95, discipline: 90 } },
    hint: 'Silver hair and a completely empty mind. Almost nobody gets here.',
    desc: 'Silver hair, silver eyes, and total stillness. You do not think. You simply act.',
  },
  {
    id: 'legendary_ss', name: 'Legendary Super Saiyan', ladder: ['saiyan', 'halfsaiyan'], tier: 9,
    mult: 1200, drain: 16, control: -45, strain: 12,
    req: { traits: ['legendary'], power: 500000 },
    hint: 'A mutation you were born with. It is not a technique, it is a condition.',
    desc: 'Green-eyed, mountainous, and only barely a person while it lasts.',
  },

  // -------------------------------------------------------------- Earthling
  {
    id: 'kaioken', name: 'Kaio-ken', ladder: ['earthling', 'saiyan', 'halfsaiyan', 'namekian', 'cerealian', 'yardratian', 'tuffle'], tier: 3,
    mult: 3, drain: 6, control: 0, strain: 9,
    req: { techniques: ['kaioken'] },
    hint: 'Train under King Kai in the Other World, or find someone he taught.',
    desc: 'A crimson aura and a body being asked to do more than it can.',
  },
  {
    id: 'kaioken_x10', name: 'Kaio-ken x10', ladder: ['earthling', 'saiyan', 'halfsaiyan', 'namekian', 'cerealian', 'yardratian', 'tuffle'], tier: 6,
    mult: 10, drain: 18, control: -10, strain: 25,
    req: { parent: 'kaioken', stat: { durability: 70, discipline: 65 } },
    hint: 'Survive the Kaio-ken often enough that your body stops tearing.',
    desc: 'Ten times over. Every use costs you something you do not get back.',
  },
  {
    id: 'potential_unleashed', name: 'Potential Unleashed', ladder: ['earthling', 'halfsaiyan', 'namekian', 'cerealian', 'yardratian', 'tuffle', 'shinjin'], tier: 8,
    mult: 45, drain: 0.5, control: 25, strain: 0,
    req: { custom: 'unlock_ritual' },
    hint: 'A very old Kai, a very long ritual, and someone willing to dance for a day.',
    desc: 'No transformation at all. Your ceiling was simply removed.',
  },
  {
    id: 'spirit_overflow', name: 'Spirit Overflow', ladder: ['earthling', 'yardratian', 'cerealian'], tier: 9,
    mult: 120, drain: 14, control: 10, strain: 18,
    req: { techniques: ['spirit_bomb'], stat: { kiControl: 82 }, power: 900000 },
    hint: 'Learn to hold borrowed energy inside your own body instead of throwing it.',
    desc: 'Every living thing nearby is lending you a little. You are made of other people.',
  },

  // -------------------------------------------------------------- Namekian
  {
    id: 'giant_form', name: 'Great Namek', ladder: ['namekian'], tier: 2,
    mult: 4, drain: 7, control: -20, strain: 4,
    req: { stat: { kiControl: 45 } },
    hint: 'Namekian bodies are elastic. Push, and keep pushing.',
    desc: 'You grow until the buildings come up to your knee.',
  },
  {
    id: 'super_namekian', name: 'Super Namekian', ladder: ['namekian'], tier: 6,
    mult: 40, drain: 2, control: 10, strain: 1,
    req: { custom: 'namek_fusion' },
    hint: 'Assimilate another Namekian warrior. Two minds, one much stronger body.',
    desc: 'Two lives folded into one. You remember things that were never yours.',
  },
  {
    id: 'orange_piccolo', name: 'Orange Form', ladder: ['namekian'], tier: 10,
    mult: 2000, drain: 6, control: 20, strain: 4,
    req: { parent: 'super_namekian', custom: 'dragon_wish_potential' },
    hint: 'Ask the dragon to unlock every drop of potential you have.',
    desc: 'Burnt-orange skin, and a calm that comes from having nothing left in reserve.',
  },

  // ------------------------------------------------------------ Frost Demon
  {
    id: 'fd_second', name: 'Second Form', ladder: ['frostdemon'], tier: 2,
    mult: 2.6, drain: 3, control: -10, strain: 2,
    req: { power: 5000 },
    hint: 'Let the armour crack and let yourself grow.',
    desc: 'Taller, hornier, considerably less polite.',
  },
  {
    id: 'fd_third', name: 'Third Form', ladder: ['frostdemon'], tier: 3,
    mult: 6, drain: 5, control: -18, strain: 3,
    req: { parent: 'fd_second', power: 40000 },
    hint: 'An ugly, transitional shape most of your kind skip.',
    desc: 'An elongated skull and a body built entirely for killing.',
  },
  {
    id: 'fd_final', name: 'Final Form', ladder: ['frostdemon'], tier: 5,
    mult: 20, drain: 1.5, control: 25, strain: 0,
    req: { parent: 'fd_third', power: 120000 },
    hint: 'The small, smooth, perfect one. This is what you actually are.',
    desc: 'Compact, white, and holding back most of it out of habit.',
  },
  {
    id: 'fd_hundred', name: '100% Full Power', ladder: ['frostdemon'], tier: 7,
    mult: 60, drain: 16, control: -10, strain: 12,
    req: { parent: 'fd_final', stat: { durability: 60 } },
    hint: 'Stop suppressing. It burns through you fast.',
    desc: 'Swollen with your own power, and losing it by the second.',
  },
  {
    id: 'golden', name: 'Golden Form', ladder: ['frostdemon'], tier: 9,
    mult: 1400, drain: 20, control: 5, strain: 14,
    req: { parent: 'fd_final', custom: 'trained_at_all', stat: { discipline: 45 } },
    hint: 'Four months of actual training would do it. Four months.',
    desc: 'Gold and violet. Enormous, and it eats your stamina alive until you master it.',
  },
  {
    id: 'black_form', name: 'Black Form', ladder: ['frostdemon'], tier: 12,
    mult: 20000, drain: 8, control: 30, strain: 6,
    req: { parent: 'golden', stat: { discipline: 80 }, custom: 'extreme_isolation_training' },
    hint: 'Ten years in a chamber where nothing lives. Come out different.',
    desc: 'Black and red, utterly silent. There is nothing left in you that was not chosen.',
  },

  // ----------------------------------------------------------------- Majin
  {
    id: 'majin_super', name: 'Super Form', ladder: ['majin'], tier: 5,
    mult: 22, drain: 4, control: 10, strain: 2,
    req: { power: 90000 },
    hint: 'Shed the fat. Keep the appetite.',
    desc: 'Lean, grey-pink, and grinning in a way that stops conversations.',
  },
  {
    id: 'majin_pure', name: 'Pure Form', ladder: ['majin'], tier: 7,
    mult: 65, drain: 6, control: -35, strain: 5,
    req: { parent: 'majin_super', anyFlag: ['rejected_kindness', 'rage_awakened'] },
    hint: 'Spit out everything good in you. What is left is much stronger.',
    desc: 'Small, childlike, and entirely without a reason not to.',
  },
  {
    id: 'majin_ultra', name: 'Ultra Form', ladder: ['majin'], tier: 10,
    mult: 800, drain: 9, control: 15, strain: 6,
    req: { parent: 'majin_super', custom: 'absorbed_three' },
    hint: 'Absorb enough strong fighters and you stop being one person.',
    desc: 'Wearing three other warriors under your skin, and using all of them.',
  },

  // --------------------------------------------------------------- Android
  {
    id: 'overclock', name: 'Overclock', ladder: ['android', 'tuffle'], tier: 3,
    mult: 3.5, drain: 10, control: -5, strain: 14,
    req: { stat: { intellect: 50 } },
    hint: 'Push the reactor past its rated output and hope the frame holds.',
    desc: 'Your coolant is boiling and your output has never been higher.',
  },
  {
    id: 'core_mk2', name: 'Power Core Mk-II', ladder: ['android', 'tuffle'], tier: 6,
    mult: 26, drain: 0, control: 0, strain: 0,
    req: { custom: 'upgrade_2' },
    hint: 'Find a lab and a very good engineer. Possibly yourself.',
    desc: 'A permanent hardware upgrade. No aura, no drain, just more of you.',
  },
  {
    id: 'core_mk3', name: 'Infinite Core', ladder: ['android', 'tuffle'], tier: 9,
    mult: 700, drain: 0, control: 0, strain: 0,
    req: { parent: 'core_mk2', custom: 'upgrade_3' },
    hint: 'The blueprint that killed the man who drew it.',
    desc: 'Limitless energy in a frame that was never meant to carry it.',
  },
  {
    id: 'hell_mode', name: 'Hell Mode', ladder: ['android', 'bioandroid', 'tuffle'], tier: 11,
    mult: 3000, drain: 30, control: -20, strain: 30,
    req: { parent: 'core_mk3', anyFlag: ['betrayed', 'creator_dead'] },
    hint: 'Remove every safety limiter your maker installed.',
    desc: 'Nothing is holding you back now, including the parts that kept you alive.',
  },

  // ----------------------------------------------------------- Bio-Android
  {
    id: 'semi_perfect', name: 'Semi-Perfect', ladder: ['bioandroid'], tier: 5,
    mult: 18, drain: 2, control: 5, strain: 1,
    req: { custom: 'absorbed_one' },
    hint: 'Absorb one worthwhile fighter whole.',
    desc: 'Lopsided, half-finished, and unbearably smug about it.',
  },
  {
    id: 'perfect_form', name: 'Perfect Form', ladder: ['bioandroid'], tier: 8,
    mult: 130, drain: 1, control: 25, strain: 0,
    req: { parent: 'semi_perfect', custom: 'absorbed_two' },
    hint: 'Absorb the second one. Then take a very long time admiring yourself.',
    desc: 'Every cell exactly where it should be. You have never felt so complete.',
  },
  {
    id: 'super_perfect', name: 'Super Perfect', ladder: ['bioandroid'], tier: 10,
    mult: 900, drain: 3, control: 20, strain: 2,
    req: { parent: 'perfect_form', flags: ['died_once'] },
    hint: 'Die badly. Rebuild from the one cell that survived.',
    desc: 'You blew yourself apart and came back with everything you learned dying.',
  },

  // --------------------------------------------------------------- Shinjin
  {
    id: 'kai_ascension', name: 'Supreme Ascension', ladder: ['shinjin'], tier: 7,
    mult: 55, drain: 3, control: 30, strain: 1,
    req: { stat: { kiControl: 75, discipline: 70 }, age: 200 },
    hint: 'Grow into the office. It takes centuries.',
    desc: 'Divine authority settling onto your shoulders like a coat.',
  },
  {
    id: 'destroyer_aura', name: 'Destroyer Aura', ladder: ['shinjin', 'saiyan', 'frostdemon'], tier: 11,
    mult: 3500, drain: 10, control: 10, strain: 8,
    req: { custom: 'destroyer_path', stat: { discipline: 75 } },
    hint: 'Hakai is not a technique you learn. It is a job you accept.',
    desc: 'Violet fire, and the quiet knowledge that you can simply erase things.',
  },

  // --------------------------------------------------------------- Tuffle
  {
    id: 'machine_mutant', name: 'Machine Mutant', ladder: ['tuffle'], tier: 5,
    mult: 20, drain: 0, control: 5, strain: 0,
    req: { stat: { intellect: 70 }, custom: 'upgrade_2' },
    hint: 'Replace the weak parts. Then replace the rest.',
    desc: 'Metal where the meat used to be, and no more of that tiresome fatigue.',
  },
  {
    id: 'parasite_host', name: 'Parasite Ascendant', ladder: ['tuffle'], tier: 9,
    mult: 600, drain: 5, control: -10, strain: 6,
    req: { parent: 'machine_mutant', custom: 'possessed_someone' },
    hint: 'Stop building bodies. Start borrowing them.',
    desc: 'You are wearing a much stronger warrior, and they are still in there, screaming.',
  },

  // ------------------------------------------------------------ Yardratian
  {
    id: 'spirit_expansion', name: 'Spirit Expansion', ladder: ['yardratian'], tier: 4,
    mult: 8, drain: 4, control: 20, strain: 2,
    req: { stat: { kiControl: 60 } },
    hint: 'Your people never needed muscle. Grow the spirit instead.',
    desc: 'Your body is a suggestion. The important part of you is much larger.',
  },
  {
    id: 'spirit_giant', name: 'Spirit Colossus', ladder: ['yardratian'], tier: 8,
    mult: 90, drain: 12, control: 10, strain: 7,
    req: { parent: 'spirit_expansion', stat: { kiControl: 85 } },
    hint: 'Keep expanding until the shape of you stops being a person.',
    desc: 'A luminous giant standing where a small quiet person used to be.',
  },

  // ------------------------------------------------------------- Cerealian
  {
    id: 'dragon_blessed', name: "Dragon's Gift", ladder: ['cerealian', 'earthling', 'namekian', 'tuffle', 'yardratian'], tier: 9,
    mult: 700, drain: 3, control: 15, strain: 4,
    req: { custom: 'wished_for_power' },
    hint: 'Ask a dragon to make you the strongest in the universe. Read the small print.',
    desc: 'Power you did not earn, burning through the years you had left.',
  },
  {
    id: 'ancestral_rage', name: 'Ancestral Rage', ladder: ['cerealian', 'earthling', 'tuffle'], tier: 6,
    mult: 30, drain: 8, control: -30, strain: 8,
    req: { anyFlag: ['grief', 'watched_friend_die', 'homeworld_destroyed'], power: 40000 },
    hint: 'Everything your people lost, arriving at once.',
    desc: 'Not a technique. Just every dead relative shouting through you at the same time.',
  },

  // -------------------------------------------------------- Universal / fusion
  {
    id: 'potara_fusion', name: 'Potara Fusion', ladder: ['*'], tier: 12,
    mult: 4000, drain: 5, control: 20, strain: 4, temporary: true,
    req: { custom: 'has_potara' },
    hint: 'Two earrings, two warriors, one hour. Sometimes permanent. Nobody is sure when.',
    desc: 'Two people occupying one body and mostly agreeing about it.',
  },
  {
    id: 'dance_fusion', name: 'Fusion Dance', ladder: ['*'], tier: 11,
    mult: 2200, drain: 6, control: 15, strain: 5, temporary: true,
    req: { techniques: ['fusion_dance'], custom: 'has_fusion_partner' },
    hint: 'Learn the steps. Get them exactly right. Do not laugh.',
    desc: 'Thirty minutes of being someone new, assuming you did not fumble the pose.',
  },
];

export const TRANSFORM_BY_ID = Object.fromEntries(TRANSFORMATIONS.map((t) => [t.id, t]));

export function ladderFor(raceId) {
  return TRANSFORMATIONS.filter(
    (t) => t.ladder.includes(raceId) || t.ladder.includes('*')
  ).sort((a, b) => a.tier - b.tier);
}

export function getTransformation(id) {
  return TRANSFORM_BY_ID[id];
}
