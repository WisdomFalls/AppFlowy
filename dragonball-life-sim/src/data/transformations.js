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
    creator: null, creatorNote: 'Not invented. Every tailed Saiyan has always done this under a full moon.',
  },
  {
    id: 'golden_oozaru', name: 'Golden Great Ape', ladder: ['saiyan', 'halfsaiyan'], tier: 4,
    mult: 40, drain: 14, control: -70, strain: 12,
    req: { parent: 'oozaru', power: 400000, traits: ['tail'], custom: 'blutz_wave' },
    hint: 'Reach Super Saiyan power while still able to go Great Ape.',
    desc: 'A Super Saiyan the size of a building. Nothing survives underneath it.',
    creator: null, creatorNote: 'Nobody taught this. It is simply what happens when a Great Ape is also a Super Saiyan.',
  },
  {
    id: 'false_ssj', name: 'False Super Saiyan', ladder: ['saiyan', 'halfsaiyan'], tier: 4.5, temporary: true,
    mult: 18, drain: 7, control: -40, strain: 5,
    req: { power: 15000, anyFlag: ['grief', 'rage_awakened', 'watched_friend_die', 'brink_of_death'] },
    hint: 'Reach for Super Saiyan before you are actually strong enough to hold it.',
    desc: 'Reddish hair, blank pupil-less eyes, a scream that will not stay lit. Gone as fast as it came.',
    creator: 'Goku', creatorNote: 'First stumbled into while training for a fight he was not ready for.',
  },
  {
    // Real Super Saiyan is never the first time it happens - it comes after
    // the unstable, half-held version, not instead of it.
    id: 'ssj', name: 'Super Saiyan', ladder: ['saiyan', 'halfsaiyan'], tier: 5,
    mult: 50, drain: 3, control: -10, strain: 2,
    req: { parent: 'false_ssj', power: 30000, anyFlag: ['grief', 'rage_awakened', 'watched_friend_die', 'brink_of_death'] },
    hint: 'Enough raw power, and a loss you cannot fight your way out of.',
    desc: 'Gold hair, green eyes, and a rage that finally has somewhere to go.',
    creator: 'Yamoshi', creatorNote: 'The legendary first Super Saiyan, generations before Goku. Every gold-haired Saiyan since is retracing what he found first.',
    // Kept your tail, went Great Ape, and actually have control of it - push
    // this on top rather than losing the ape to get it.
    layerOn: ['oozaru'],
  },
  {
    id: 'ssj_grade2', name: 'Super Saiyan Grade 2', ladder: ['saiyan', 'halfsaiyan'], tier: 5.4,
    mult: 75, drain: 4, control: -20, strain: 3,
    req: { parent: 'ssj', power: 45000, stat: { discipline: 40 } },
    hint: 'Push Super Saiyan past its resting point and let the muscle catch up to the power.',
    desc: 'Thicker, harder, gold hair a little wilder. More bulk than finesse, and it shows.',
    creator: 'Vegeta',
    layerOn: ['oozaru'],
  },
  {
    id: 'ssj_grade3', name: 'Super Saiyan Grade 3', ladder: ['saiyan', 'halfsaiyan'], tier: 5.6,
    mult: 95, drain: 9, control: -45, strain: 10,
    req: { parent: 'ssj_grade2', power: 90000, stat: { durability: 55 } },
    hint: 'Keep pushing the mass. Eventually speed is the price you pay for it.',
    desc: 'Immense, veins standing out, a solid gold mane. Overwhelming power dragging a body too heavy to keep up with it.',
    creator: 'Vegeta',
  },
  {
    id: 'ssj_full', name: 'Full-Power Super Saiyan', ladder: ['saiyan', 'halfsaiyan'], tier: 6,
    mult: 60, drain: 0.6, control: 10, strain: 0,
    req: { parent: 'ssj', stat: { discipline: 60 }, custom: 'ssj_hours' },
    hint: 'Live in Super Saiyan until it stops costing you anything.',
    desc: 'You stopped transforming and started simply being this - all of the power, none of the bulk or the strain.',
    creator: 'Goku', creatorNote: "His answer to the bulk Vegeta chose instead - wear the form in until it costs nothing.",
  },
  {
    // Grade 3 and Full-Power stay optional side branches off base Super
    // Saiyan (a fighter can go straight for finesse over bulk), but Grade 2
    // is the one rung that has to come first - jumping from base Super
    // Saiyan straight past three grades to SSJ2 read as skipping the whole
    // climb rather than choosing a path through it.
    id: 'ssj2', name: 'Super Saiyan 2', ladder: ['saiyan', 'halfsaiyan'], tier: 7,
    mult: 100, drain: 5, control: -15, strain: 4,
    req: { parent: 'ssj_grade2', power: 200000, anyFlag: ['fury', 'watched_friend_die', 'protected_someone', 'humiliated'] },
    hint: 'Push Super Saiyan into Grade 2, then find something worth losing your temper over.',
    desc: 'Crackling lightning, still eyes. The calm part of you is the dangerous part.',
    creator: 'Gohan', creatorNote: 'First reached in grief and rage, not training.',
    // This is the ceiling on the ape - past here it is too much form to
    // hold on top of another form at once, mastered control or not.
    layerOn: ['oozaru'],
  },
  {
    id: 'ssj3', name: 'Super Saiyan 3', ladder: ['saiyan', 'halfsaiyan'], tier: 8,
    mult: 400, drain: 22, control: -25, strain: 14,
    req: { parent: 'ssj2', power: 1500000, stat: { discipline: 70, kiControl: 65 } },
    hint: 'Years of nothing but training, ideally somewhere time runs strangely.',
    desc: 'No eyebrows, hair to your knees, and a body that cannot hold this for long.',
    creator: 'Goku', creatorNote: 'Perfected in the Other World, where time and hair both had room to spare.',
  },
  {
    id: 'ssg', name: 'Super Saiyan God', ladder: ['saiyan', 'halfsaiyan'], tier: 9,
    mult: 900, drain: 4, control: 20, strain: 3,
    req: { power: 3000000, custom: 'god_ritual' },
    hint: 'Five righteous Saiyans pouring their hearts into you, or a god willing to teach.',
    desc: 'Slim red aura, divine ki. Mortals cannot even sense you now.',
    creator: null, creatorNote: 'A ritual, not an invention - five righteous Saiyans lending their strength to a sixth, or a god teaching it directly.',
  },
  {
    id: 'ssb', name: 'Super Saiyan Blue', ladder: ['saiyan', 'halfsaiyan'], tier: 10,
    mult: 2500, drain: 9, control: 15, strain: 5,
    req: { parent: 'ssg', mentors: ['whis'], stat: { kiControl: 80 } },
    hint: 'Take god ki, then go Super Saiyan on top of it. Requires an angel as a teacher.',
    desc: 'Divine ki wearing a Super Saiyan over it. Perfect control, ruinous cost.',
    creator: 'Goku', creatorNote: 'The first fusion of Super Saiyan God ki with the Super Saiyan form.',
  },
  {
    id: 'ssb_mastered', name: 'Mastered Super Saiyan Blue', ladder: ['saiyan', 'halfsaiyan'], tier: 10.3,
    mult: 3200, drain: 1, control: 30, strain: 0,
    req: { parent: 'ssb', stat: { kiControl: 90 }, custom: 'ssb_hours' },
    hint: 'Live in Blue until the aura stops flickering and simply stays.',
    desc: 'The same divine-Saiyan hybrid, held with no strain and no flicker at all. This is no longer a stretch for you.',
    creator: 'Vegeta', creatorNote: 'Held without a flicker first by Vegeta, who was not going to stay behind Goku on it for long.',
  },
  {
    id: 'ssb_evolution', name: 'Super Saiyan Blue Evolution', ladder: ['saiyan', 'halfsaiyan'], tier: 10.4,
    mult: 3800, drain: 7, control: 20, strain: 4,
    req: { parent: 'ssb', stat: { kiControl: 88, discipline: 75 }, custom: 'blue_refined' },
    hint: 'Refine Blue yourself, through desperation in a fight rather than a teacher’s lesson.',
    desc: 'A deeper, near-black blue aura, sharper and meaner than the form you were taught. Nobody showed you this part.',
    creator: 'Vegeta', creatorNote: 'Sharpened alone, out of desperation, with no teacher\'s hand in it at all.',
  },
  {
    id: 'ssb_kaioken', name: 'Blue Kaio-ken', ladder: ['saiyan', 'halfsaiyan'], tier: 11,
    mult: 6000, drain: 26, control: 0, strain: 22,
    req: { parent: 'ssb', techniques: ['kaioken'], stat: { discipline: 85 } },
    hint: 'Stack the Kaio-ken on top of Blue and accept what it does to you.',
    desc: 'Two impossible techniques at once. Your body is already failing.',
    creator: 'Goku', creatorNote: 'Stacking a forbidden technique onto a divine form is the sort of idea only Goku has twice.',
  },
  {
    id: 'ultra_ego', name: 'Ultra Ego', ladder: ['saiyan'], tier: 12,
    mult: 9000, drain: 12, control: -5, strain: 10,
    req: { parent: 'ssb', custom: 'destroyer_path', stat: { discipline: 70 } },
    hint: 'Learn destruction energy from a God of Destruction and learn to enjoy being hurt.',
    desc: 'Purple aura, wild grin. The more damage you take the stronger you get.',
    creator: 'Vegeta', creatorNote: 'Learned directly from a God of Destruction and made uniquely his.',
  },
  {
    id: 'ui_sign', name: 'Ultra Instinct -Sign-', ladder: ['saiyan', 'halfsaiyan', 'earthling', 'namekian', 'cerealian', 'yardratian'], tier: 12,
    mult: 7000, drain: 20, control: 40, strain: 16,
    req: { power: 40000000, stat: { kiControl: 88, discipline: 80 }, custom: 'ui_trigger' },
    hint: 'Push past every limit with a clear mind. Angels can show you the door.',
    desc: 'Silver-edged hair. Your body moves before you decide to.',
    creator: 'Goku', creatorNote: 'Shown the door by an angel. Walking through it was his own doing.',
  },
  {
    id: 'ui_perfected', name: 'Ultra Instinct', ladder: ['saiyan', 'halfsaiyan', 'earthling', 'namekian', 'cerealian', 'yardratian'], tier: 12.5,
    mult: 14000, drain: 17, control: 50, strain: 14,
    req: { parent: 'ui_sign', power: 60000000, stat: { kiControl: 92 }, anyFlag: ['brink_of_death', 'protected_someone'] },
    hint: 'Push past Sign under real, mortal pressure. The instinct finishes completing itself.',
    desc: 'Silver hair fully lit, the flicker gone. Not yet the total stillness, but the technique is whole.',
    creator: 'Goku',
  },
  {
    id: 'ui_mastered', name: 'Mastered Ultra Instinct', ladder: ['saiyan', 'halfsaiyan', 'earthling', 'namekian', 'cerealian', 'yardratian'], tier: 13,
    mult: 25000, drain: 15, control: 60, strain: 12,
    req: { parent: 'ui_perfected', mentors: ['whis'], stat: { kiControl: 95, discipline: 90 } },
    hint: 'Silver hair and a completely empty mind. Almost nobody gets here.',
    desc: 'Silver hair, silver eyes, and total stillness. You do not think. You simply act.',
    creator: 'Goku', creatorNote: 'The version almost nobody, mortal or god, ever actually reaches.',
  },
  {
    id: 'legendary_ss', name: 'Legendary Super Saiyan', ladder: ['saiyan', 'halfsaiyan'], tier: 9,
    mult: 1200, drain: 16, control: -45, strain: 12,
    req: { traits: ['legendary'], power: 500000 },
    hint: 'A mutation you were born with. It is not a technique, it is a condition.',
    desc: 'Green-eyed, mountainous, and only barely a person while it lasts.',
    creator: null, creatorNote: 'Not a technique. A mutation some Saiyans are simply born with - Broly among the very few.',
  },

  // -------------------------------------------------------------- Earthling
  // Kaio-ken used to also exist as its own transformation here, on top of
  // the technique of the same name in techniques.js - two separate things
  // named the same, one of which (the form) locked you out of whatever else
  // you were transformed into. The technique already does the actual job -
  // a power multiplier you trigger as a battle move, at a real health cost,
  // regardless of what form you're currently holding - so that's the one
  // Kaio-ken now. ssb_kaioken below is a real, distinct ability (mastering
  // Blue and Kaio-ken together into something stable), not a duplicate.
  {
    id: 'potential_unleashed', name: 'Potential Unleashed', ladder: ['earthling', 'halfsaiyan', 'namekian', 'cerealian', 'yardratian', 'tuffle', 'shinjin', 'kryllian'], tier: 8,
    mult: 45, drain: 0.5, control: 25, strain: 0,
    req: { custom: 'unlock_ritual' },
    hint: 'A very old Kai, a very long ritual, and someone willing to dance for a day.',
    desc: 'No transformation at all. Your ceiling was simply removed.',
    creator: 'Guru', creatorNote: "Refined into ritual by Kai and Namekian elders ever since; Guru's original unlocking of a warrior's hidden potential is the one everybody still copies.",
  },
  {
    id: 'spirit_overflow', name: 'Spirit Overflow', ladder: ['earthling', 'yardratian', 'cerealian'], tier: 9,
    mult: 120, drain: 14, control: 10, strain: 18,
    req: { techniques: ['spirit_bomb'], stat: { kiControl: 82 }, power: 900000 },
    hint: 'Learn to hold borrowed energy inside your own body instead of throwing it.',
    desc: 'Every living thing nearby is lending you a little. You are made of other people.',
    creator: null, creatorNote: 'No clear first. Anyone who learns to hold the Spirit Bomb\'s energy rather than throw it seems to arrive here alone.',
  },

  // -------------------------------------------------------------- Namekian
  {
    id: 'giant_form', name: 'Great Namek', ladder: ['namekian'], tier: 2,
    mult: 4, drain: 7, control: -20, strain: 4,
    req: { stat: { kiControl: 45 } },
    hint: 'Namekian bodies are elastic. Push, and keep pushing.',
    desc: 'You grow until the buildings come up to your knee.',
    creator: null, creatorNote: 'Not invented. Namekian bodies have always been able to grow like this.',
  },
  {
    id: 'super_namekian', name: 'Super Namekian', ladder: ['namekian'], tier: 6,
    mult: 40, drain: 2, control: 10, strain: 1,
    req: { custom: 'namek_fusion' },
    hint: 'Assimilate another Namekian warrior. Two minds, one much stronger body.',
    desc: 'Two lives folded into one. You remember things that were never yours.',
    creator: 'Piccolo', creatorNote: 'The Piccolo-Nail assimilation - the first fusion of two Namekian warriors into one body.',
  },
  {
    id: 'orange_piccolo', name: 'Orange Form', ladder: ['namekian'], tier: 10,
    mult: 2000, drain: 6, control: 20, strain: 4,
    req: { parent: 'super_namekian', custom: 'dragon_wish_potential' },
    hint: 'Ask the dragon to unlock every drop of potential you have.',
    desc: 'Burnt-orange skin, and a calm that comes from having nothing left in reserve.',
    creator: 'Piccolo', creatorNote: 'The first, and so far only, fighter to simply ask the dragon to unlock everything at once.',
  },

  // ------------------------------------------------------------ Frost Demon
  {
    id: 'fd_second', name: 'Second Form', ladder: ['frostdemon', 'half_frostkin', 'frost_android'], tier: 2,
    mult: 2.6, drain: 3, control: -10, strain: 2,
    req: { power: 5000 },
    hint: 'Let the armour crack and let yourself grow.',
    desc: 'Taller, hornier, considerably less polite.',
    creator: null, creatorNote: 'Not invented. Every Frost Demon\'s body already has these stages built in.',
  },
  {
    id: 'fd_third', name: 'Third Form', ladder: ['frostdemon', 'half_frostkin', 'frost_android'], tier: 3,
    mult: 6, drain: 5, control: -18, strain: 3,
    req: { parent: 'fd_second', power: 40000 },
    hint: 'An ugly, transitional shape most of your kind skip.',
    desc: 'An elongated skull and a body built entirely for killing.',
    creator: null, creatorNote: 'Not invented. Every Frost Demon\'s body already has these stages built in.',
  },
  {
    id: 'fd_final', name: 'Final Form', ladder: ['frostdemon', 'half_frostkin', 'frost_android'], tier: 5,
    mult: 20, drain: 1.5, control: 25, strain: 0,
    req: { parent: 'fd_third', power: 120000 },
    hint: 'The small, smooth, perfect one. This is what you actually are.',
    desc: 'Compact, white, and holding back most of it out of habit.',
    creator: null, creatorNote: 'Not invented. Every Frost Demon\'s body already has these stages built in.',
  },
  {
    id: 'fd_hundred', name: '100% Full Power', ladder: ['frostdemon', 'half_frostkin', 'frost_android'], tier: 7,
    mult: 60, drain: 16, control: -10, strain: 12,
    req: { parent: 'fd_final', stat: { durability: 60 } },
    hint: 'Stop suppressing. It burns through you fast.',
    desc: 'Swollen with your own power, and losing it by the second.',
    creator: null, creatorNote: 'Not a technique - just what happens when a Frost Demon stops suppressing.',
  },
  {
    id: 'golden', name: 'Golden Form', ladder: ['frostdemon', 'half_frostkin', 'frost_android'], tier: 9,
    mult: 1400, drain: 20, control: 5, strain: 14,
    req: { parent: 'fd_final', custom: 'trained_at_all', stat: { discipline: 45 } },
    hint: 'Four months of actual training would do it. Four months.',
    desc: 'Gold and violet. Enormous, and it eats your stamina alive until you master it.',
    creator: 'Frieza', creatorNote: "His answer to Goku's Super Saiyan Blue - the first Frost Demon to actually train for a form rather than simply grow into one.",
  },
  {
    id: 'black_form', name: 'Black Form', ladder: ['frostdemon', 'half_frostkin', 'frost_android'], tier: 12,
    mult: 20000, drain: 8, control: 30, strain: 6,
    req: { parent: 'golden', stat: { discipline: 80 }, custom: 'extreme_isolation_training' },
    hint: 'Ten years in a chamber where nothing lives. Come out different.',
    desc: 'Black and red, utterly silent. There is nothing left in you that was not chosen.',
    creator: null, creatorNote: 'Whoever reaches this trained somewhere nothing else living could follow. Nobody has ever compared notes.',
  },

  // ----------------------------------------------------------------- Majin
  {
    id: 'majin_super', name: 'Super Form', ladder: ['majin'], tier: 5,
    mult: 22, drain: 4, control: 10, strain: 2,
    req: { power: 90000 },
    hint: 'Shed the fat. Keep the appetite.',
    desc: 'Lean, grey-pink, and grinning in a way that stops conversations.',
    creator: null, creatorNote: 'Every Majin body sheds weight the same way. No one fighter invented the shift.',
  },
  {
    id: 'majin_pure', name: 'Pure Form', ladder: ['majin'], tier: 7,
    mult: 65, drain: 6, control: -35, strain: 5,
    req: { parent: 'majin_super', anyFlag: ['rejected_kindness', 'rage_awakened'] },
    hint: 'Spit out everything good in you. What is left is much stronger.',
    desc: 'Small, childlike, and entirely without a reason not to.',
    creator: 'Buu', creatorNote: 'Splitting himself down the middle was Buu\'s own trick first.',
  },
  {
    id: 'majin_ultra', name: 'Ultra Form', ladder: ['majin'], tier: 10,
    mult: 800, drain: 9, control: 15, strain: 6,
    req: { parent: 'majin_super', custom: 'absorbed_three' },
    hint: 'Absorb enough strong fighters and you stop being one person.',
    desc: 'Wearing three other warriors under your skin, and using all of them.',
    creator: 'Buu', creatorNote: 'Buu\'s own absorption habit, taken further than anyone asked him to.',
  },

  // --------------------------------------------------------------- Android
  {
    id: 'overclock', name: 'Overclock', ladder: ['android', 'tuffle', 'half_android', 'frost_android'], tier: 3,
    mult: 3.5, drain: 10, control: -5, strain: 14,
    req: { stat: { intellect: 50 } },
    hint: 'Push the reactor past its rated output and hope the frame holds.',
    desc: 'Your coolant is boiling and your output has never been higher.',
    creator: null, creatorNote: 'Any sufficiently reckless android engineer arrives here eventually.',
  },
  {
    id: 'core_mk2', name: 'Power Core Mk-II', ladder: ['android', 'tuffle', 'half_android', 'frost_android'], tier: 6,
    mult: 26, drain: 0, control: 0, strain: 0,
    req: { custom: 'upgrade_2' },
    hint: 'Find a lab and a very good engineer. Possibly yourself.',
    desc: 'A permanent hardware upgrade. No aura, no drain, just more of you.',
    creator: 'Gero', creatorNote: "Dr. Gero's hardware lineage, or whoever ends up inheriting his notes.",
  },
  {
    id: 'core_mk3', name: 'Infinite Core', ladder: ['android', 'tuffle', 'half_android', 'frost_android'], tier: 9,
    mult: 700, drain: 0, control: 0, strain: 0,
    req: { parent: 'core_mk2', custom: 'upgrade_3' },
    hint: 'The blueprint that killed the man who drew it.',
    desc: 'Limitless energy in a frame that was never meant to carry it.',
    creator: 'Gero',
  },
  {
    id: 'hell_mode', name: 'Hell Mode', ladder: ['android', 'bioandroid', 'tuffle', 'half_android', 'frost_android'], tier: 11,
    mult: 3000, drain: 30, control: -20, strain: 30,
    req: { parent: 'core_mk3', anyFlag: ['betrayed', 'creator_dead'] },
    hint: 'Remove every safety limiter your maker installed.',
    desc: 'Nothing is holding you back now, including the parts that kept you alive.',
    creator: 'Cell', creatorNote: 'Cell\'s own limiter-break. Every android who strips their own safeties after him is following the same idea.',
  },

  // ----------------------------------------------------------- Bio-Android
  {
    id: 'semi_perfect', name: 'Semi-Perfect', ladder: ['bioandroid'], tier: 5,
    mult: 18, drain: 2, control: 5, strain: 1,
    req: { custom: 'absorbed_one' },
    hint: 'Absorb one worthwhile fighter whole.',
    desc: 'Lopsided, half-finished, and unbearably smug about it.',
    creator: 'Cell', creatorNote: 'Cell\'s own three-stage absorption cycle. Anyone built the same way follows the same stages.',
  },
  {
    id: 'perfect_form', name: 'Perfect Form', ladder: ['bioandroid'], tier: 8,
    mult: 130, drain: 1, control: 25, strain: 0,
    req: { parent: 'semi_perfect', custom: 'absorbed_two' },
    hint: 'Absorb the second one. Then take a very long time admiring yourself.',
    desc: 'Every cell exactly where it should be. You have never felt so complete.',
    creator: 'Cell',
  },
  {
    id: 'super_perfect', name: 'Super Perfect', ladder: ['bioandroid'], tier: 10,
    mult: 900, drain: 3, control: 20, strain: 2,
    req: { parent: 'perfect_form', flags: ['died_once'] },
    hint: 'Die badly. Rebuild from the one cell that survived.',
    desc: 'You blew yourself apart and came back with everything you learned dying.',
    creator: 'Cell',
  },

  // --------------------------------------------------------------- Shinjin
  {
    id: 'kai_ascension', name: 'Supreme Ascension', ladder: ['shinjin'], tier: 7,
    mult: 55, drain: 3, control: 30, strain: 1,
    req: { stat: { kiControl: 75, discipline: 70 }, age: 200 },
    hint: 'Grow into the office. It takes centuries.',
    desc: 'Divine authority settling onto your shoulders like a coat.',
    creator: null, creatorNote: 'Grown into, not learned - every Kai who lives long enough arrives here.',
  },
  {
    id: 'destroyer_aura', name: 'Destroyer Aura', ladder: ['shinjin', 'saiyan', 'frostdemon'], tier: 11,
    mult: 3500, drain: 10, control: 10, strain: 8,
    req: { custom: 'destroyer_path', stat: { discipline: 75 } },
    hint: 'Hakai is not a technique you learn. It is a job you accept.',
    desc: 'Violet fire, and the quiet knowledge that you can simply erase things.',
    creator: 'Beerus', creatorNote: 'Not a technique so much as a job description every God of Destruction eventually accepts.',
  },

  // --------------------------------------------------------------- Tuffle
  {
    id: 'machine_mutant', name: 'Machine Mutant', ladder: ['tuffle'], tier: 5,
    mult: 20, drain: 0, control: 5, strain: 0,
    req: { stat: { intellect: 70 }, custom: 'upgrade_2' },
    hint: 'Replace the weak parts. Then replace the rest.',
    desc: 'Metal where the meat used to be, and no more of that tiresome fatigue.',
    creator: null, creatorNote: 'Tuffle science generally, not any one Tuffle\'s personal invention.',
  },
  {
    id: 'parasite_host', name: 'Parasite Ascendant', ladder: ['tuffle'], tier: 9,
    mult: 600, drain: 5, control: -10, strain: 6,
    req: { parent: 'machine_mutant', custom: 'possessed_someone' },
    hint: 'Stop building bodies. Start borrowing them.',
    desc: 'You are wearing a much stronger warrior, and they are still in there, screaming.',
    creator: null, creatorNote: 'Tuffle science generally, not any one Tuffle\'s personal invention.',
  },

  // ------------------------------------------------------------ Yardratian
  {
    id: 'spirit_expansion', name: 'Spirit Expansion', ladder: ['yardratian'], tier: 4,
    mult: 8, drain: 4, control: 20, strain: 2,
    req: { stat: { kiControl: 60 } },
    hint: 'Your people never needed muscle. Grow the spirit instead.',
    desc: 'Your body is a suggestion. The important part of you is much larger.',
    creator: null, creatorNote: 'A Yardratian tradition going back further than any one name in it.',
  },
  {
    id: 'spirit_giant', name: 'Spirit Colossus', ladder: ['yardratian'], tier: 8,
    mult: 90, drain: 12, control: 10, strain: 7,
    req: { parent: 'spirit_expansion', stat: { kiControl: 85 } },
    hint: 'Keep expanding until the shape of you stops being a person.',
    desc: 'A luminous giant standing where a small quiet person used to be.',
    creator: null, creatorNote: 'A Yardratian tradition going back further than any one name in it.',
  },

  // ------------------------------------------------------------- Cerealian
  {
    id: 'dragon_blessed', name: "Dragon's Gift", ladder: ['cerealian', 'earthling', 'namekian', 'tuffle', 'yardratian'], tier: 9,
    mult: 700, drain: 3, control: 15, strain: 4,
    req: { custom: 'wished_for_power' },
    hint: 'Ask a dragon to make you the strongest in the universe. Read the small print.',
    desc: 'Power you did not earn, burning through the years you had left.',
    creator: null, creatorNote: 'Whoever wished for it first did not survive long enough to be remembered for it.',
  },
  {
    id: 'ancestral_rage', name: 'Ancestral Rage', ladder: ['cerealian', 'earthling', 'tuffle'], tier: 6,
    mult: 30, drain: 8, control: -30, strain: 8,
    req: { anyFlag: ['grief', 'watched_friend_die', 'homeworld_destroyed'], power: 40000 },
    hint: 'Everything your people lost, arriving at once.',
    desc: 'Not a technique. Just every dead relative shouting through you at the same time.',
    creator: null, creatorNote: 'Not learned. Grief this old does not have an inventor.',
  },

  // ------------------------------------------------------------- Kryllian
  {
    id: 'hive_surge', name: 'Hive Surge', ladder: ['kryllian'], tier: 2,
    mult: 5, drain: 6, control: -10, strain: 5,
    req: { stat: { durability: 55 } },
    hint: 'The chitin was always going to do more than sit there. Push against it until it answers.',
    desc: 'Your plating splits along its growth-lines and hardens again, thicker, mid-fight.',
    creator: null, creatorNote: 'Hive knowledge, shared the moment any Kryllian first needed it.',
  },
  {
    id: 'broodcall', name: 'Broodcall', ladder: ['kryllian'], tier: 5,
    mult: 16, drain: 4, control: 10, strain: 6,
    req: { parent: 'hive_surge', stat: { discipline: 60 } },
    hint: 'The hive is always listening. Ask it for everything at once.',
    desc: 'Every Kryllian who ever fought is in your head for exactly as long as you need them.',
    creator: null, creatorNote: 'Hive knowledge, shared the moment any Kryllian first needed it.',
  },

  // -------------------------------------------------------- Universal / fusion
  {
    id: 'potara_fusion', name: 'Potara Fusion', ladder: ['*'], tier: 12,
    mult: 4000, drain: 5, control: 20, strain: 4, temporary: true,
    req: { custom: 'has_potara' },
    hint: 'Two earrings, two warriors, one hour. Sometimes permanent. Nobody is sure when.',
    desc: 'Two people occupying one body and mostly agreeing about it.',
    creator: 'Old Kai', creatorNote: 'The Potara earrings are a Kai invention, not a fighter\'s technique.',
  },
  {
    id: 'dance_fusion', name: 'Fusion Dance', ladder: ['*'], tier: 11,
    mult: 2200, drain: 6, control: 15, strain: 5, temporary: true,
    req: { techniques: ['fusion_dance'], custom: 'has_fusion_partner' },
    hint: 'Learn the steps. Get them exactly right. Do not laugh.',
    desc: 'Thirty minutes of being someone new, assuming you did not fumble the pose.',
    creator: 'Metamoran elders', creatorNote: 'Brought back from Metamor by Goku and taught out from there.',
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

/** Who gets credit for a form, in a form the UI can print directly - a name
 * (Yamoshi, Cell, Dr. Gero) or, for the handful nobody actually invented,
 * the explanation of why there isn't one. */
export function transformationOrigin(id) {
  const t = getTransformation(id);
  if (!t) return null;
  if (t.creator) return { name: t.creator, note: t.creatorNote || null };
  return { name: null, note: t.creatorNote || 'Nobody taught this. Nobody can say for certain who reached it first.' };
}
