// Where you came from, decided for you.
//
// Character creation used to be a shop: pick a build, pick a face, pick an
// upbringing. That is not how being born works, and it is not how a life sim
// reads. You choose a species and a century; everything else is rolled against
// what that species was doing in that century.
//
// The roll is not uniform. A Saiyan born in Age 730 goes into a creche on
// Planet Vegeta because that is what happened to Saiyans born in Age 730.

import { RACES, getRace, UPBRINGINGS, TEMPERAMENTS, BODY_TYPES } from '../data/races.js';
import { PLACES, getPlace } from '../data/places.js';
import { defaultAppearance, HAIR_STYLES, HAIR_COLOURS, EYE_SHAPES, EYE_COLOURS,
  SKIN_TONES, FACE_SHAPES, OUTFITS, STANCES, MARK_PRESETS, ACCESSORY_PRESETS } from '../ui/portrait.js';

/**
 * How likely each upbringing is, for this species in this year. Weight 0 means
 * it cannot happen at all.
 */
function upbringingWeights(raceId, year, homeworld) {
  const w = {
    warrior_clan: 3, street: 3, wealthy: 2, temple: 2, lab: 1, farm: 3, city: 4,
    orphan_pod: 1, royal: 0.5, exile: 1.5,
    self_raised: 1.5, animals: 0.8, foster: 2.5, saiyan_creche: 0, conquered: 1,
  };

  switch (raceId) {
    case 'saiyan':
      if (homeworld === 'sadala') {
        // Sadala never burned, and Universe 6 was never Frieza's to grind
        // down - no scattering, no genocide, nobody's childhood built out
        // of a pod and a stranger. Most kids there grow up with an actual
        // family and a warrior tradition instead of whatever survival looks
        // like after the thing that shaped Universe 7's Saiyans.
        Object.assign(w, { saiyan_creche: 0, warrior_clan: 8, city: 5, wealthy: 3, royal: 1, foster: 3,
          farm: 2, temple: 1, orphan_pod: 0.4, exile: 0.4, self_raised: 0.6, animals: 0.3 });
      } else if (year < 737) {
        // Planet Vegeta ran a creche system until it did not.
        Object.assign(w, { saiyan_creche: 14, warrior_clan: 6, royal: 1.5, city: 0, farm: 0, wealthy: 0, temple: 0, lab: 0, animals: 0.3 });
      } else {
        Object.assign(w, { saiyan_creche: 0, orphan_pod: 8, exile: 6, self_raised: 4, foster: 5, animals: 2, warrior_clan: 2, city: 1, farm: 1, wealthy: 0.3, royal: 0.4 });
      }
      break;
    case 'halfsaiyan':
      Object.assign(w, { saiyan_creche: 0, city: 6, wealthy: 5, farm: 4, temple: 2, warrior_clan: 2, royal: 0, foster: 2, animals: 0.4 });
      break;
    case 'earthling':
      Object.assign(w, { saiyan_creche: 0, city: 8, farm: 6, street: 5, temple: 4, wealthy: 3, warrior_clan: 3, royal: 0.3, lab: 1, animals: 1, self_raised: 1 });
      if (year >= 749 && year < 756) w.conquered = 4;      // Red Ribbon years
      break;
    case 'namekian':
      Object.assign(w, { saiyan_creche: 0, temple: 8, warrior_clan: 5, exile: 3, self_raised: 4, city: 0, wealthy: 0, street: 0, farm: 1, lab: 0, foster: 2, animals: 0 });
      if (year >= 762 && year <= 763) w.exile = 12;        // Frieza on Namek
      break;
    case 'frostdemon':
      Object.assign(w, { saiyan_creche: 0, royal: 12, warrior_clan: 5, wealthy: 4, city: 0, farm: 0, temple: 0, street: 0, foster: 0, animals: 0, self_raised: 1 });
      break;
    case 'majin':
      Object.assign(w, { saiyan_creche: 0, self_raised: 8, animals: 5, exile: 4, street: 3, city: 2, temple: 1, farm: 1, wealthy: 0, royal: 0, lab: 1 });
      break;
    case 'android':
    case 'bioandroid':
      Object.assign(w, { saiyan_creche: 0, lab: 16, self_raised: 3, city: 2, exile: 2, street: 1, farm: 0, temple: 0, wealthy: 0, royal: 0, animals: 0, foster: 1 });
      break;
    case 'shinjin':
      Object.assign(w, { saiyan_creche: 0, temple: 14, royal: 4, city: 0, farm: 0, street: 0, wealthy: 0, lab: 0, animals: 0, self_raised: 1, foster: 1 });
      break;
    case 'tuffle':
      Object.assign(w, { saiyan_creche: 0, lab: 8, exile: 8, self_raised: 4, wealthy: 3, city: 2, conquered: 6, farm: 0, warrior_clan: 0, royal: 1 });
      break;
    case 'yardratian':
      Object.assign(w, { saiyan_creche: 0, temple: 10, city: 3, self_raised: 3, farm: 2, warrior_clan: 1, wealthy: 1, royal: 0.5, animals: 0.5 });
      break;
    case 'cerealian':
      Object.assign(w, { saiyan_creche: 0, conquered: 10, exile: 6, self_raised: 5, animals: 2, farm: 3, city: 2, street: 2, royal: 0.5, wealthy: 0.5 });
      break;
    case 'half_android':
      Object.assign(w, { saiyan_creche: 0, lab: 6, city: 6, wealthy: 3, foster: 4, street: 2, self_raised: 2, farm: 1, temple: 0, royal: 0 });
      break;
    case 'half_frostkin':
      Object.assign(w, { saiyan_creche: 0, city: 5, exile: 5, wealthy: 4, foster: 3, warrior_clan: 2, royal: 1, temple: 1, animals: 0.5 });
      break;
    case 'frost_android':
      Object.assign(w, { saiyan_creche: 0, lab: 8, exile: 6, royal: 3, self_raised: 3, city: 1, wealthy: 1, farm: 0, temple: 0, street: 1 });
      break;
    case 'half_cerealian':
      Object.assign(w, { saiyan_creche: 0, city: 6, farm: 4, foster: 3, exile: 2, temple: 1, self_raised: 1, wealthy: 1, royal: 0.3, warrior_clan: 0.5, animals: 0.4 });
      break;
    case 'kryllian':
      Object.assign(w, { saiyan_creche: 0, warrior_clan: 10, self_raised: 1, foster: 1, exile: 3, city: 0.5, temple: 2, animals: 2, farm: 1, wealthy: 0, royal: 0 });
      break;
    default:
      break;
  }
  return w;
}

/** Worlds that do not exist in a given year, because somebody blew them up. */
function existsIn(placeId, year) {
  if (placeId === 'planet_vegeta') return year < 737;
  if (placeId === 'namek') return year < 763;
  if (placeId === 'new_namek') return year >= 763;
  if (placeId === 'cereal') return year < 740 || year > 780;
  return true;
}

/** Nobody is born in the Hyperbolic Time Chamber or on Beerus's world. */
const UNBORN_TAGS = ['otherworld', 'divine', 'extreme', 'tournament', 'prison', 'destroyer', 'omniking'];
function birthable(place, year) {
  if (!place || !existsIn(place.id, year)) return false;
  if (place.tags.some((t) => UNBORN_TAGS.includes(t))) return false;
  if (place.planet === 'otherworld' || place.planet === 'void') return false;
  return true;
}

/** A homeworld that makes sense for this species, upbringing and year. */
function placeFor(rng, raceId, upbringingId, year, preferredPlaceId) {
  const race = getRace(raceId);
  let homes = (race.homeworlds || []).map((id) => getPlace(id))
    .filter((p) => birthable(p, year));
  if (!homes.length) homes = PLACES.filter((p) => p.tags.includes('civilised') && birthable(p, year));

  if (upbringingId === 'saiyan_creche' && existsIn('planet_vegeta', year)) return 'planet_vegeta';
  // Whichever homeworld drove the upbringing odds above should be the one
  // this life actually lands on, as long as the upbringing itself has not
  // pulled it somewhere more specific (a lab, a wild place, a temple).
  if (preferredPlaceId && homes.some((h) => h.id === preferredPlaceId)
    && !['lab', 'animals', 'self_raised', 'temple'].includes(upbringingId)) {
    return preferredPlaceId;
  }
  if (upbringingId === 'lab') {
    const labs = PLACES.filter((p) => (p.tags.includes('lab') || p.tags.includes('tech')) && birthable(p, year));
    if (labs.length) return rng.pick(labs).id;
  }
  if (upbringingId === 'animals' || upbringingId === 'self_raised') {
    const wilds = PLACES.filter((p) => (p.tags.includes('wild') || p.tags.includes('forest') || p.tags.includes('mountain'))
      && birthable(p, year) && homes.some((h) => h.planet === p.planet));
    if (wilds.length) return rng.pick(wilds).id;
  }
  if (upbringingId === 'temple') {
    const temples = PLACES.filter((p) => (p.tags.includes('sacred') || p.tags.includes('mentor'))
      && birthable(p, year) && homes.some((h) => h.planet === p.planet));
    if (temples.length) return rng.pick(temples).id;
  }
  return homes.length ? rng.pick(homes).id : 'east_city';
}

/** Height and weight from species and build, not from a slider. */
function bodyFor(rng, raceId, bodyId) {
  const base = {
    saiyan: [168, 66], halfsaiyan: [170, 64], earthling: [168, 62], namekian: [212, 82],
    frostdemon: [158, 52], majin: [180, 96], android: [170, 64], bioandroid: [198, 92],
    shinjin: [150, 46], tuffle: [140, 40], yardratian: [146, 38], cerealian: [172, 66],
  }[raceId] || [168, 64];
  const shift = {
    small: [-22, -16], wiry: [-8, -12], lean: [0, -6], balanced: [0, 0], stocky: [4, 14], massive: [16, 38],
  }[bodyId] || [0, 0];
  return {
    heightCm: Math.max(90, Math.round(rng.gauss(base[0] + shift[0], 8, 90, 260))),
    weightKg: Math.max(20, Math.round(rng.gauss(base[1] + shift[1], 7, 20, 300))),
  };
}

/**
 * Which battle armour a Saiyan is born into, by family circumstance. Royalty
 * and warrior clans hand down (or can afford) something well-made; a child
 * with nobody to fit them properly - an orphan, an exile, someone raised
 * self-taught after a war - ends up in whatever fits, scavenged or handed
 * on from someone else's dead relative. `fameBonus` is small: a name people
 * already recognise, not power you actually earned.
 */
const SAIYAN_ARMOUR_BY_UPBRINGING = {
  royal: { outfit: 'armour_saiyan_elite', lineage: 'royal', fameBonus: 25 },
  warrior_clan: { outfit: 'armour_saiyan_elite', lineage: 'elite', fameBonus: 10 },
  wealthy: { outfit: 'armour_saiyan', lineage: 'common', fameBonus: 4 },
  saiyan_creche: { outfit: 'armour_saiyan', lineage: 'common', fameBonus: 0 },
  city: { outfit: 'armour_saiyan', lineage: 'common', fameBonus: 0 },
  foster: { outfit: 'armour_saiyan', lineage: 'common', fameBonus: 0 },
  farm: { outfit: 'armour_saiyan', lineage: 'common', fameBonus: 0 },
  orphan_pod: { outfit: 'armour_saiyan_low', lineage: 'low', fameBonus: 0 },
  exile: { outfit: 'armour_saiyan_low', lineage: 'low', fameBonus: 0 },
  self_raised: { outfit: 'armour_saiyan_low', lineage: 'low', fameBonus: 0 },
  conquered: { outfit: 'armour_saiyan_low', lineage: 'low', fameBonus: 0 },
  default: { outfit: 'armour_saiyan', lineage: 'common', fameBonus: 0 },
};

/**
 * Roll a whole origin. The player picked a species, a century and a name;
 * everything below is what the universe decided about them.
 */
export function rollOrigin(rng, raceId, birthYear, opts = {}) {
  const race = getRace(raceId);
  // Sadala (Universe 6) never burned and was never Frieza's - a Saiyan
  // whose life centres there grows up in a different culture than one from
  // Universe 7's Planet Vegeta, and that has to be decided before the
  // upbringing odds below can be picked correctly, not inferred afterward.
  let saiyanHome = null;
  if (raceId === 'saiyan') {
    if (opts.placeId) {
      const p = getPlace(opts.placeId);
      saiyanHome = p && (p.planet === 'sadala' || p.planet === 'planet_vegeta') ? p.planet : null;
    } else if (existsIn('planet_vegeta', birthYear)) {
      // Vegeta still exists in this slice of time - most Saiyan lives are
      // still Universe 7's, but Sadala is a real, standing alternative.
      saiyanHome = rng.chance(0.3) ? 'sadala' : 'planet_vegeta';
    } else if (rng.chance(0.4)) {
      // Vegeta is already gone. A Saiyan born after that is either part of
      // the scattered Universe 7 diaspora (the original, unchanged case
      // below) or simply one of Sadala's own, which never had a disaster to
      // survive in the first place - both are real, so this is not an
      // automatic default to either one.
      saiyanHome = 'sadala';
    }
  }
  const weights = upbringingWeights(raceId, birthYear, saiyanHome);
  const pool = UPBRINGINGS.filter((u) => (weights[u.id] ?? 1) > 0);
  const upbringing = rng.weighted(pool, (u) => weights[u.id] ?? 1);
  // Nothing here shattered Sadala's own institutions, so its people lean
  // less toward the cruelty that Frieza's occupation bred into Universe 7's.
  const temperament = saiyanHome === 'sadala'
    ? rng.weighted(TEMPERAMENTS, (t) => (t.tags.includes('evil') ? 0.25 : t.tags.includes('good') ? 1.6 : 1))
    : rng.pick(TEMPERAMENTS);
  const body = rng.pick(BODY_TYPES);
  const placeId = opts.placeId || placeFor(rng, raceId, upbringing.id, birthYear, saiyanHome);

  const look = defaultAppearance(rng, raceId);
  Object.assign(look, bodyFor(rng, raceId, body.id));
  look.buildShape = body.id;

  // Full-blooded Saiyans do not pick their clothes, they inherit them: every
  // household on Planet Vegeta (or off it) has its own battle armour, handed
  // down or issued, and what it looks like says something about the family
  // it came from before a word is spoken. Half-Saiyans raised off-world do
  // not get this - they dress like wherever they actually grew up.
  let lineage = null;
  let lineageFameBonus = 0;
  if (raceId === 'saiyan') {
    const tier = SAIYAN_ARMOUR_BY_UPBRINGING[upbringing.id] || SAIYAN_ARMOUR_BY_UPBRINGING.default;
    look.outfit = tier.outfit;
    lineage = tier.lineage;
    lineageFameBonus = tier.fameBonus;
  }

  // Upbringing leaves a mark before the life even starts.
  if (upbringing.id === 'animals') {
    look.marks = ['scar_arm'];
    look.outfit = 'none';
    look.hairStyle = 'wild';
  } else if (upbringing.id === 'lab') {
    look.marks = rng.chance(0.6) ? ['dots'] : [];
    look.outfit = 'lab';
  } else if (upbringing.id === 'saiyan_creche') {
    look.outfit = 'armour_saiyan';
    look.stance = 'saiyan';
  } else if (upbringing.id === 'self_raised') {
    look.marks = rng.chance(0.5) ? ['scar_cheek'] : [];
  } else if (upbringing.id === 'temple') {
    look.stance = rng.pick(['turtle', 'crane', 'namek']);
  } else if (upbringing.id === 'conquered') {
    look.marks = rng.chance(0.4) ? ['burn_arm'] : [];
  }

  return {
    upbringingId: upbringing.id,
    temperamentId: temperament.id,
    bodyId: body.id,
    placeId,
    look,
    lineage,
    lineageFameBonus,
    // Everything a life sim ought to roll rather than let you shop for.
    potential: Math.round(rng.gauss(50, 18, 5, 99)),
    battleInstinct: Math.round(rng.gauss(50, 18, 5, 99)),
    iq: Math.round(rng.gauss(100, 18, 55, 180)),
    luck: Math.round(rng.gauss(50, 20, 1, 99)),
    looks: Math.round(rng.gauss(50, 19, 3, 99)),
    charismaSeed: Math.round(rng.gauss(50, 18, 5, 99)),
  };
}

/** One line describing where this character started, for the record. */
export function describeOrigin(character) {
  const up = UPBRINGINGS.find((u) => u.id === character.upbringingId);
  const place = getPlace(character.placeId);
  return `${up ? up.name : 'Unknown origins'} on ${place ? place.name : 'somewhere'}, ${up ? up.blurb.toLowerCase() : ''}`;
}
