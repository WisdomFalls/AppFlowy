// Careers. Each is a ladder: you start at rung 0 and get promoted when your
// performance, stats and years served clear the next rung's bar. Salary is in
// Zeni per year.

export const CAREERS = [
  {
    id: 'martial_instructor', name: 'Martial Arts School', field: 'martial',
    where: ['urban', 'dojo', 'coast'], req: { technique: 30 }, karma: 3,
    blurb: 'Teach forms to children and the occasional adult who should know better.',
    rungs: [
      { title: 'Sweeping Student', pay: 4000, req: {} },
      { title: 'Assistant Instructor', pay: 16000, req: { technique: 40, years: 2 } },
      { title: 'Instructor', pay: 42000, req: { technique: 55, charisma: 45, years: 5 } },
      { title: 'Head Sensei', pay: 95000, req: { technique: 70, charisma: 55, years: 10 } },
      { title: 'School Founder', pay: 220000, req: { technique: 82, charisma: 65, fame: 30, years: 16 } },
    ],
  },
  {
    id: 'tournament_fighter', name: 'Tournament Circuit', field: 'martial',
    where: ['tournament', 'urban', 'fame'], req: { strength: 40 }, karma: 0,
    blurb: 'Prize money, sponsorships, and a jaw that clicks in cold weather.',
    rungs: [
      { title: 'Undercard Nobody', pay: 6000, req: {} },
      { title: 'Regional Contender', pay: 30000, req: { strength: 50, fame: 10, years: 2 } },
      { title: 'Ranked Fighter', pay: 90000, req: { strength: 62, fame: 25, years: 5 } },
      { title: 'Championship Challenger', pay: 260000, req: { strength: 75, fame: 45, years: 8 } },
      { title: 'World Champion', pay: 900000, req: { strength: 88, fame: 70, years: 12 } },
    ],
  },
  {
    id: 'capsule_engineer', name: 'Capsule Corporation', field: 'science',
    where: ['tech', 'urban'], req: { intellect: 55 }, karma: 2,
    blurb: 'The company that put a house in your pocket. The coffee is excellent.',
    rungs: [
      { title: 'Intern', pay: 12000, req: {} },
      { title: 'Junior Engineer', pay: 55000, req: { intellect: 60, years: 2 } },
      { title: 'Systems Engineer', pay: 130000, req: { intellect: 70, years: 5 } },
      { title: 'Division Head', pay: 400000, req: { intellect: 80, charisma: 55, years: 10 } },
      { title: 'Chief Scientist', pay: 1200000, req: { intellect: 90, charisma: 60, years: 16 } },
    ],
  },
  {
    id: 'frieza_force', name: 'Frieza Force', field: 'military',
    where: ['imperial'], req: { strength: 45 }, karma: -12,
    blurb: 'Planet clearing, with a pension. The turnover is extraordinary.',
    rungs: [
      { title: 'Conscript', pay: 20000, req: {} },
      { title: 'Purge Trooper', pay: 70000, req: { strength: 55, years: 2 } },
      { title: 'Squad Leader', pay: 210000, req: { strength: 68, discipline: 50, years: 5 } },
      { title: 'Elite Officer', pay: 700000, req: { strength: 80, discipline: 60, years: 9 } },
      { title: 'Sector Commander', pay: 2500000, req: { strength: 90, charisma: 60, years: 14 } },
    ],
  },
  {
    id: 'galactic_patrol', name: 'Galactic Patrol', field: 'military',
    where: ['urban', 'imperial', 'prison'], req: { discipline: 45, technique: 40 }, karma: 8,
    blurb: 'Interstellar policing, chronic understaffing, an excellent hat.',
    rungs: [
      { title: 'Cadet', pay: 18000, req: {} },
      { title: 'Patrolman', pay: 60000, req: { discipline: 50, years: 2 } },
      { title: 'Special Agent', pay: 180000, req: { discipline: 62, technique: 60, years: 5 } },
      { title: 'Elite Patroller', pay: 520000, req: { discipline: 75, technique: 72, years: 9 } },
      { title: 'Galactic King\'s Adjutant', pay: 1600000, req: { discipline: 85, charisma: 65, years: 15 } },
    ],
  },
  {
    id: 'farmer', name: 'Farming', field: 'civilian',
    where: ['wild', 'forest', 'quiet'], req: {}, karma: 4,
    blurb: 'Radishes, mostly. Occasionally a spaceship lands in the north field.',
    rungs: [
      { title: 'Farmhand', pay: 8000, req: {} },
      { title: 'Tenant Farmer', pay: 26000, req: { discipline: 40, years: 3 } },
      { title: 'Landowner', pay: 70000, req: { discipline: 55, intellect: 45, years: 8 } },
      { title: 'Regional Supplier', pay: 190000, req: { intellect: 60, charisma: 50, years: 14 } },
    ],
  },
  {
    id: 'police', name: 'City Police', field: 'civilian',
    where: ['urban', 'civilised'], req: { discipline: 40 }, karma: 6,
    blurb: 'Traffic, robberies, and the occasional dinosaur in a shopping centre.',
    rungs: [
      { title: 'Recruit', pay: 14000, req: {} },
      { title: 'Officer', pay: 45000, req: { discipline: 45, years: 2 } },
      { title: 'Detective', pay: 110000, req: { intellect: 60, discipline: 55, years: 6 } },
      { title: 'Chief', pay: 300000, req: { charisma: 65, discipline: 70, years: 12 } },
    ],
  },
  {
    id: 'doctor', name: 'Medicine', field: 'science',
    where: ['urban', 'civilised'], req: { intellect: 65 }, karma: 10,
    blurb: 'Half your patients arrive with injuries that should have killed them.',
    rungs: [
      { title: 'Medical Student', pay: 0, req: {} },
      { title: 'Resident', pay: 60000, req: { intellect: 68, years: 4 } },
      { title: 'Physician', pay: 200000, req: { intellect: 74, years: 8 } },
      { title: 'Surgeon', pay: 520000, req: { intellect: 84, technique: 60, years: 13 } },
    ],
  },
  {
    id: 'entertainer', name: 'Entertainment', field: 'fame',
    where: ['urban', 'fame'], req: { charisma: 55 }, karma: 0,
    blurb: 'Films, talk shows, and a signature pose you will regret.',
    rungs: [
      { title: 'Extra', pay: 9000, req: {} },
      { title: 'Featured Performer', pay: 48000, req: { charisma: 60, fame: 12, years: 2 } },
      { title: 'Star', pay: 260000, req: { charisma: 72, fame: 35, years: 6 } },
      { title: 'Household Name', pay: 1100000, req: { charisma: 85, fame: 65, years: 11 } },
    ],
  },
  {
    id: 'bounty_hunter', name: 'Bounty Hunting', field: 'martial',
    where: ['urban', 'imperial', 'ruins', 'crime'], req: { strength: 45, speed: 45 }, karma: -2,
    blurb: 'Warrants, spaceports, and people who very much do not want to come with you.',
    rungs: [
      { title: 'Skip Tracer', pay: 15000, req: {} },
      { title: 'Licensed Hunter', pay: 70000, req: { strength: 55, years: 2 } },
      { title: 'High-Value Specialist', pay: 260000, req: { strength: 70, technique: 60, years: 6 } },
      { title: 'Legendary Hunter', pay: 900000, req: { strength: 85, fame: 40, years: 11 } },
    ],
  },
  {
    id: 'criminal', name: 'Organised Crime', field: 'crime',
    where: ['urban', 'crime', 'ruins'], req: {}, karma: -14,
    blurb: 'Capsule smuggling, protection, and a boss who does not accept resignations.',
    rungs: [
      { title: 'Lookout', pay: 11000, req: {} },
      { title: 'Enforcer', pay: 60000, req: { strength: 50, years: 2 } },
      { title: 'Lieutenant', pay: 220000, req: { charisma: 55, strength: 62, years: 5 } },
      { title: 'Syndicate Boss', pay: 1400000, req: { charisma: 72, intellect: 65, years: 10 } },
    ],
  },
  {
    id: 'guardian_service', name: 'Guardian Service', field: 'divine',
    where: ['sacred', 'divine'], req: { kiControl: 60, discipline: 60 }, karma: 12,
    blurb: 'Watching the whole planet from a floating tile. Very few holidays.',
    rungs: [
      { title: 'Lookout Attendant', pay: 0, req: {} },
      { title: 'Apprentice Guardian', pay: 0, req: { kiControl: 68, discipline: 66, years: 5 } },
      { title: 'Guardian of Earth', pay: 0, req: { kiControl: 82, discipline: 80, years: 15 } },
    ],
  },
  {
    id: 'mechanic', name: 'Hovercar Mechanic', field: 'civilian',
    where: ['urban', 'tech'], req: { intellect: 40 }, karma: 2,
    blurb: 'Everything on this planet flies and all of it eventually stops flying.',
    rungs: [
      { title: 'Apprentice', pay: 10000, req: {} },
      { title: 'Mechanic', pay: 38000, req: { intellect: 45, years: 2 } },
      { title: 'Shop Owner', pay: 120000, req: { intellect: 58, charisma: 50, years: 7 } },
    ],
  },
  {
    id: 'chef', name: 'Cooking', field: 'civilian',
    where: ['urban', 'coast', 'civilised'], req: {}, karma: 4,
    blurb: 'One Saiyan customer can end a restaurant. Two is a business plan.',
    rungs: [
      { title: 'Dishwasher', pay: 7000, req: {} },
      { title: 'Line Cook', pay: 28000, req: { technique: 35, years: 2 } },
      { title: 'Chef', pay: 90000, req: { technique: 50, intellect: 45, years: 6 } },
      { title: 'Celebrated Restaurateur', pay: 420000, req: { charisma: 65, fame: 25, years: 12 } },
    ],
  },
  {
    id: 'scientist_rogue', name: 'Independent Research', field: 'science',
    where: ['lab', 'tech', 'ruins'], req: { intellect: 70 }, karma: -6,
    blurb: 'Nobody funds this work, which is exactly why it gets done in a mountain.',
    rungs: [
      { title: 'Lab Assistant', pay: 20000, req: {} },
      { title: 'Researcher', pay: 80000, req: { intellect: 74, years: 3 } },
      { title: 'Project Lead', pay: 300000, req: { intellect: 82, years: 8 } },
      { title: 'Mad Genius', pay: 900000, req: { intellect: 92, years: 14 } },
    ],
  },
];

// Off-world work. Earth's fifteen careers are Earth's; a Saiyan settlement
// hands out ranks, the Frieza Force hands out postings, and Namek does not
// have jobs in the sense the word usually means.
CAREERS.push(
  {
    id: 'saiyan_rank', name: 'The Saiyan Register', field: 'martial',
    where: ['saiyan'], planets: ['planet_vegeta', 'sadala'], req: { strength: 35 }, karma: -8,
    blurb: 'Graded at birth, ranked by what you take, and paid in Battle Merit.',
    currency: 'merit',
    rungs: [
      { title: 'Low-Class Conscript', pay: 30, req: {} },
      { title: 'Clearing Team Lead', pay: 90, req: { strength: 50, years: 3 } },
      { title: 'Mid-Class Warrior', pay: 260, req: { strength: 62, durability: 55, years: 6 } },
      { title: 'Elite', pay: 800, req: { strength: 75, technique: 60, fame: 25, years: 11 } },
      { title: 'Elite Commander', pay: 2400, req: { strength: 85, charisma: 60, fame: 45, years: 17 } },
    ],
  },
  {
    id: 'force_posting', name: 'Frieza Force Service', field: 'martial',
    where: ['imperial'], planets: ['frieza_79', 'void'], req: { discipline: 30 }, karma: -14,
    blurb: 'A number instead of a posting, a scouter, and a quota nobody explains.',
    currency: 'scrip',
    rungs: [
      { title: 'Conscript', pay: 40, req: {} },
      { title: 'Trooper', pay: 130, req: { strength: 45, years: 2 } },
      { title: 'Squad Leader', pay: 420, req: { strength: 58, charisma: 45, years: 5 } },
      { title: 'Sector Officer', pay: 1400, req: { strength: 70, intellect: 55, years: 10 } },
      { title: 'Sector Commander', pay: 5000, req: { strength: 82, charisma: 60, fame: 40, years: 16 } },
    ],
  },
  {
    id: 'namek_elder', name: 'The Village', field: 'spiritual',
    where: ['namek', 'sacred'], planets: ['namek', 'new_namek'], req: { kiControl: 35 }, karma: 12,
    blurb: 'Namekians do not have jobs. They have what the village needs, and somebody who does it.',
    currency: 'water',
    rungs: [
      { title: 'Of the Village', pay: 4, req: {} },
      { title: 'Warrior-Type', pay: 12, req: { strength: 45, years: 3 } },
      { title: 'Keeper of the Well', pay: 30, req: { kiControl: 60, intellect: 55, years: 8 } },
      { title: 'Village Elder', pay: 70, req: { kiControl: 72, charisma: 60, years: 15 } },
      { title: 'Eldest', pay: 160, req: { kiControl: 85, intellect: 70, fame: 30, years: 24 } },
    ],
  },
  {
    id: 'yardrat_teacher', name: 'The Yardrat Discipline', field: 'spiritual',
    where: ['spirit'], planets: ['yardrat'], req: { kiControl: 45 }, karma: 8,
    blurb: 'Teaching a technique that takes most people a decade to hold in their head.',
    currency: 'shard',
    rungs: [
      { title: 'Student of the Discipline', pay: 2, req: {} },
      { title: 'Practitioner', pay: 8, req: { kiControl: 60, years: 4 } },
      { title: 'Teacher', pay: 22, req: { kiControl: 75, intellect: 60, years: 10 } },
      { title: 'Keeper of the Method', pay: 60, req: { kiControl: 88, years: 20 } },
    ],
  },
  {
    id: 'patrol_officer', name: 'The Galactic Patrol', field: 'law',
    where: ['civilised', 'urban', 'imperial', 'tech'], req: { discipline: 40 }, karma: 15,
    blurb: 'Understaffed, generally decent, and two centuries behind the things it polices.',
    rungs: [
      { title: 'Cadet', pay: 22000, req: {} },
      { title: 'Officer', pay: 70000, req: { discipline: 55, years: 3 } },
      { title: 'Senior Officer', pay: 190000, req: { discipline: 65, intellect: 55, years: 8 } },
      { title: 'Marshal', pay: 600000, req: { discipline: 78, strength: 65, fame: 30, years: 15 } },
      { title: 'Elite Marshal', pay: 1800000, req: { discipline: 88, strength: 78, fame: 50, years: 22 } },
    ],
  },
  {
    id: 'otherworld_work', name: 'Other World Administration', field: 'spiritual',
    where: ['otherworld', 'judgement'], planets: ['otherworld'], req: { discipline: 30 }, karma: 6,
    blurb: 'The afterlife has an administration, and the administration has vacancies.',
    currency: 'favour',
    rungs: [
      { title: 'Queue Marshal', pay: 5, req: {} },
      { title: 'Ogre\'s Assistant', pay: 14, req: { strength: 45, years: 3 } },
      { title: 'Ledger Keeper', pay: 40, req: { intellect: 60, years: 8 } },
      { title: 'Yemma\'s Clerk', pay: 110, req: { intellect: 72, discipline: 65, years: 14 } },
    ],
  },
);

export const CAREER_BY_ID = Object.fromEntries(CAREERS.map((c) => [c.id, c]));

export function getCareer(id) {
  return CAREER_BY_ID[id];
}

export function careersFor(character, placeTags, planetId) {
  return CAREERS.filter((c) => {
    // A career tied to particular worlds is not available anywhere else, and
    // Earth's careers are not available off Earth.
    if (c.planets && planetId && !c.planets.includes(planetId)) return false;
    if (!c.planets && planetId && planetId !== 'earth'
      && !c.where.some((w) => ['imperial', 'tech', 'civilised', 'urban', 'saiyan', 'spirit', 'sacred', 'otherworld'].includes(w))) {
      return false;
    }
    if (!c.where.some((w) => placeTags.includes(w))) return false;
    for (const [stat, min] of Object.entries(c.req)) {
      if ((character.stats[stat] || 0) < min) return false;
    }
    return true;
  });
}
