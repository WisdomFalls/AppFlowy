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
    id: 'galactic_patrol', name: 'Galactic Patrol', field: 'military',
    where: ['urban', 'imperial', 'prison', 'civilised', 'tech', 'lawful'],
    notPlanets: ['otherworld', 'void'],
    req: { discipline: 45, technique: 40 }, karma: 8,
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

// Every world off Earth had exactly one job on it, which made "find work"
// somewhere else a formality. A world people live on has more than one thing
// for them to do.
CAREERS.push(
  {
    id: 'saiyan_breeder', name: 'The Register Office', field: 'admin',
    where: ['saiyan'], planets: ['planet_vegeta', 'sadala'], req: { intellect: 40 }, karma: -10,
    blurb: 'Somebody assigns the class at birth, keeps the pairings, and files the deaths. It is not a popular job.',
    currency: 'merit',
    rungs: [
      { title: 'Register Clerk', pay: 25, req: {} },
      { title: 'Assessor', pay: 80, req: { intellect: 52, years: 3 } },
      { title: 'Class Adjudicator', pay: 240, req: { intellect: 65, charisma: 50, years: 8 } },
      { title: 'Keeper of the Register', pay: 700, req: { intellect: 78, charisma: 62, years: 15 } },
    ],
  },
  {
    id: 'pod_wright', name: 'Attack Pod Yards', field: 'technical',
    where: ['saiyan', 'imperial', 'tech'], planets: ['planet_vegeta', 'frieza_79', 'sadala'],
    req: { intellect: 45 }, karma: -3,
    blurb: 'The pods do not build themselves, and a badly built one kills a child on a nine-year journey.',
    currency: 'merit',
    rungs: [
      { title: 'Yard Hand', pay: 20, req: {} },
      { title: 'Fitter', pay: 70, req: { intellect: 55, years: 3 } },
      { title: 'Navigator-Programmer', pay: 210, req: { intellect: 68, discipline: 55, years: 8 } },
      { title: 'Yard Master', pay: 620, req: { intellect: 80, charisma: 55, years: 14 } },
    ],
  },
  {
    id: 'force_medic', name: 'Frieza Force Medical', field: 'technical',
    where: ['imperial'], planets: ['frieza_79', 'void'], req: { intellect: 45 }, karma: -4,
    blurb: 'You run the tanks. Everybody who comes out of one owes you and nobody says so.',
    currency: 'scrip',
    rungs: [
      { title: 'Tank Attendant', pay: 45, req: {} },
      { title: 'Field Medic', pay: 150, req: { intellect: 55, years: 2 } },
      { title: 'Ward Officer', pay: 500, req: { intellect: 68, discipline: 58, years: 7 } },
      { title: 'Chief Surgeon', pay: 1700, req: { intellect: 82, years: 14 } },
    ],
  },
  {
    id: 'planet_broker', name: 'Planet Trade Appraisal', field: 'trade',
    where: ['imperial', 'tech', 'civilised'], planets: ['frieza_79', 'void'],
    req: { charisma: 45 }, karma: -20,
    blurb: 'You value a world, and somebody else empties it. The paperwork is impeccable.',
    currency: 'scrip',
    rungs: [
      { title: 'Survey Clerk', pay: 60, req: {} },
      { title: 'Appraiser', pay: 220, req: { charisma: 55, intellect: 55, years: 3 } },
      { title: 'Senior Broker', pay: 900, req: { charisma: 68, intellect: 65, years: 9 } },
      { title: 'Regional Director', pay: 3200, req: { charisma: 80, intellect: 72, fame: 30, years: 16 } },
    ],
  },
  {
    id: 'namek_grower', name: 'Ajisa and Water', field: 'trade',
    where: ['namek', 'sacred'], planets: ['namek', 'new_namek'], req: { discipline: 30 }, karma: 8,
    blurb: 'Growing the trees and keeping the wells. It is most of what anyone here actually does.',
    currency: 'water',
    rungs: [
      { title: 'Of the Fields', pay: 3, req: {} },
      { title: 'Grower', pay: 10, req: { discipline: 45, years: 3 } },
      { title: 'Well-Keeper', pay: 26, req: { discipline: 58, intellect: 50, years: 9 } },
      { title: 'Keeper of the Groves', pay: 65, req: { discipline: 70, years: 18 } },
    ],
  },
  {
    id: 'namek_dragon_watch', name: 'The Watch on the Balls', field: 'spiritual',
    where: ['namek', 'sacred'], planets: ['namek', 'new_namek'], req: { kiControl: 50 }, karma: 16,
    blurb: 'Every village keeps one. Guarding it is a life, and it is usually a quiet one.',
    currency: 'water',
    rungs: [
      { title: 'Watcher', pay: 5, req: {} },
      { title: 'Guardian', pay: 18, req: { kiControl: 62, strength: 50, years: 5 } },
      { title: 'Keeper', pay: 45, req: { kiControl: 75, years: 12 } },
    ],
  },
  {
    id: 'yardrat_navigator', name: 'The Long Routes', field: 'technical',
    where: ['spirit', 'civilised'], planets: ['yardrat'], req: { intellect: 50 }, karma: 6,
    blurb: 'Yardratians do not fly ships. They tell other people where things are, very precisely.',
    currency: 'shard',
    rungs: [
      { title: 'Route Student', pay: 3, req: {} },
      { title: 'Route-Speaker', pay: 12, req: { intellect: 60, kiControl: 50, years: 4 } },
      { title: 'Far-Speaker', pay: 34, req: { intellect: 72, kiControl: 65, years: 11 } },
    ],
  },
  {
    id: 'cereal_farmer', name: 'The Longgrain Harvest', field: 'trade',
    where: ['farm', 'rural', 'civilised', 'conquered'], planets: ['cereal'],
    req: { durability: 30 }, karma: 10,
    blurb: 'The crop the planet is named for, worked by the handful of people left to work it.',
    currency: 'shard',
    rungs: [
      { title: 'Field Hand', pay: 4, req: {} },
      { title: 'Harvester', pay: 14, req: { durability: 45, years: 3 } },
      { title: 'Holding Keeper', pay: 40, req: { durability: 58, intellect: 45, years: 10 } },
    ],
  },
  {
    id: 'pride_trooper', name: 'The Pride Troopers', field: 'law',
    where: ['lawful', 'civilised', 'urban'], planets: ['u11_world'], req: { discipline: 55 }, karma: 20,
    blurb: 'Universe 11 has one job and it is this one. There is a pose and you are expected to learn it.',
    currency: 'favour',
    rungs: [
      { title: 'Recruit', pay: 20, req: {} },
      { title: 'Trooper', pay: 70, req: { discipline: 62, strength: 55, years: 3 } },
      { title: 'Squad Leader', pay: 220, req: { discipline: 72, strength: 68, years: 9 } },
      { title: 'Commander', pay: 700, req: { discipline: 85, strength: 80, fame: 40, years: 16 } },
    ],
  },
  {
    id: 'devotion_order', name: 'The Order of Rumsshi', field: 'spiritual',
    where: ['devout', 'civilised', 'urban'], planets: ['u10_world'], req: { discipline: 45 }, karma: 4,
    blurb: 'Strength as worship. Everything you lift is counted and somebody very senior reads the totals.',
    currency: 'favour',
    rungs: [
      { title: 'Novice', pay: 12, req: {} },
      { title: 'Devotee', pay: 45, req: { discipline: 55, strength: 55, years: 4 } },
      { title: 'Elder of the Order', pay: 180, req: { discipline: 70, strength: 70, years: 12 } },
    ],
  },
);

// Penguin Village is the one place in the game where nothing sensible is on
// offer, and that is the joke rather than an oversight - but a place with no
// work at all is a dead end, so it gets the work it would actually have.
CAREERS.push({
  id: 'village_oddjobs', name: 'Whatever Needs Doing', field: 'civilian',
  where: ['strange', 'comedy', 'quiet', 'rural'], req: {}, karma: 6,
  blurb: 'The shop, the school, the one police car, and a small girl who can lift it.',
  rungs: [
    { title: 'Odd-Job Hand', pay: 3000, req: {} },
    { title: 'Shop Assistant', pay: 12000, req: { charisma: 40, years: 2 } },
    { title: 'Runs The Shop', pay: 40000, req: { charisma: 55, intellect: 45, years: 6 } },
    { title: 'Village Fixture', pay: 90000, req: { charisma: 65, years: 14 } },
  ],
});

export const CAREER_BY_ID = Object.fromEntries(CAREERS.map((c) => [c.id, c]));

export function getCareer(id) {
  return CAREER_BY_ID[id];
}

export function careersFor(character, placeTags, planetId) {
  return CAREERS.filter((c) => {
    // A world can be explicitly ruled out even when its tags would match.
    if (c.notPlanets && planetId && c.notPlanets.includes(planetId)) return false;
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
