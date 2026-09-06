// A parametric portrait. Every choice in the character creator changes the
// drawing, and the drawing follows the character through the game: transform
// and the aura appears, lose the tail and the tail is gone.

export const HAIR_STYLES = [
  { id: 'spiked', name: 'Spiked upward' },
  { id: 'wild', name: 'Wild and unruly' },
  { id: 'long', name: 'Long and loose' },
  { id: 'ponytail', name: 'Tied back' },
  { id: 'bob', name: 'Short bob' },
  { id: 'cropped', name: 'Cropped close' },
  { id: 'mohawk', name: 'Mohawk' },
  { id: 'bald', name: 'Shaved bald' },
  { id: 'braid', name: 'Single braid' },
  { id: 'topknot', name: 'Topknot' },
  { id: 'flame', name: 'Swept-back flame' },
  { id: 'pigtails', name: 'Twin tails' },
  { id: 'afro', name: 'Afro' },
  { id: 'buzz', name: 'Buzzed' },
  { id: 'sidepart', name: 'Neat side-part' },
];

export const HAIR_COLOURS = [
  { id: 'black', name: 'Black', hex: '#181420' },
  { id: 'darkbrown', name: 'Dark brown', hex: '#3b2418' },
  { id: 'brown', name: 'Brown', hex: '#6b4326' },
  { id: 'blonde', name: 'Blonde', hex: '#e8c766' },
  { id: 'white', name: 'White', hex: '#efeae2' },
  { id: 'silver', name: 'Silver', hex: '#c8ccd6' },
  { id: 'lavender', name: 'Lavender', hex: '#b49ede' },
  { id: 'blue', name: 'Blue', hex: '#4a7bd4' },
  { id: 'orange', name: 'Orange', hex: '#e2762f' },
  { id: 'red', name: 'Red', hex: '#b8342c' },
  { id: 'green', name: 'Green', hex: '#4c9e63' },
  { id: 'pink', name: 'Pink', hex: '#e58fb4' },
];

export const EYE_SHAPES = [
  { id: 'sharp', name: 'Sharp' },
  { id: 'round', name: 'Round' },
  { id: 'narrow', name: 'Narrow' },
  { id: 'heavy', name: 'Heavy-lidded' },
  { id: 'wide', name: 'Wide' },
];

export const EYE_COLOURS = [
  { id: 'black', name: 'Black', hex: '#1a1620' },
  { id: 'brown', name: 'Brown', hex: '#5b3a1e' },
  { id: 'green', name: 'Green', hex: '#3f8f5c' },
  { id: 'blue', name: 'Blue', hex: '#3f7fc4' },
  { id: 'grey', name: 'Grey', hex: '#8a8f9c' },
  { id: 'gold', name: 'Gold', hex: '#d6a83c' },
  { id: 'red', name: 'Red', hex: '#b8342c' },
  { id: 'violet', name: 'Violet', hex: '#8b6bd6' },
];

export const SKIN_TONES = [
  { id: 'pale', name: 'Pale', hex: '#f0d3bc' },
  { id: 'light', name: 'Light', hex: '#e5bb99' },
  { id: 'tan', name: 'Tan', hex: '#c99266' },
  { id: 'brown', name: 'Brown', hex: '#95633c' },
  { id: 'deep', name: 'Deep', hex: '#5f3a24' },
  { id: 'green', name: 'Namekian green', hex: '#5d9b52' },
  { id: 'pink', name: 'Majin pink', hex: '#e79ec0' },
  { id: 'white', name: 'Chitin white', hex: '#eae6dd' },
  { id: 'blue', name: 'Cold blue', hex: '#8fb2cc' },
  { id: 'grey', name: 'Ash grey', hex: '#9aa0a6' },
  { id: 'purple', name: 'Kai violet', hex: '#a884c4' },
];

export const FACE_SHAPES = [
  { id: 'square', name: 'Square' },
  { id: 'round', name: 'Round' },
  { id: 'angular', name: 'Angular' },
  { id: 'long', name: 'Long' },
];

export const OUTFITS = [
  { id: 'gi_orange', name: 'Orange gi', main: '#e2762f', trim: '#2c4d9e' },
  { id: 'gi_blue', name: 'Blue gi', main: '#2f5bb7', trim: '#e8e2d6' },
  { id: 'gi_black', name: 'Black gi', main: '#25222e', trim: '#c0392b' },
  { id: 'armour_saiyan', name: 'Saiyan battle armour', main: '#3a4250', trim: '#c9a227' },
  { id: 'armour_frieza', name: 'Frieza Force armour', main: '#4b3f6b', trim: '#d8dde6' },
  { id: 'namek_robe', name: 'Namekian robes', main: '#6d4aa0', trim: '#d8d2c4' },
  { id: 'casual', name: 'Ordinary clothes', main: '#6d7280', trim: '#e8e2d6' },
  { id: 'coat', name: 'Long coat', main: '#3c3229', trim: '#8a6f4a' },
  { id: 'lab', name: 'Lab issue', main: '#dfe3e8', trim: '#5b6470' },
  { id: 'kai', name: 'Kai vestments', main: '#3f7a6d', trim: '#e2c96a' },
  { id: 'none', name: 'Bare-chested', main: null, trim: null },
];

export const STANCES = [
  { id: 'turtle', name: 'Turtle School' },
  { id: 'crane', name: 'Crane School' },
  { id: 'saiyan', name: 'Saiyan brawler' },
  { id: 'namek', name: 'Namekian guard' },
  { id: 'demon', name: 'Demon style' },
  { id: 'formless', name: 'No style at all' },
  { id: 'custom', name: 'Something of your own' },
];

export const BUILD_SHAPES = ['small', 'wiry', 'lean', 'balanced', 'stocky', 'massive'];

// Marks are things that happened to a body: scars, burns, what is missing, what
// was inked on. A character can carry any number, chosen at creation or
// earned in play, and each one is drawn.
export const MARK_PRESETS = [
  { id: 'scar_cheek', name: 'Scar across the cheek', where: 'face' },
  { id: 'scar_eye', name: 'Scar through one eye', where: 'face' },
  { id: 'scar_brow', name: 'Split eyebrow', where: 'face' },
  { id: 'scar_chest', name: 'Scar across the chest', where: 'body' },
  { id: 'scar_arm', name: 'Old cut down the arm', where: 'body' },
  { id: 'burn_arm', name: 'Burn scars, forearms', where: 'body' },
  { id: 'burn_face', name: 'Burn along the jaw', where: 'face' },
  { id: 'missing_eye', name: 'Missing eye', where: 'face' },
  { id: 'missing_ear', name: 'Missing ear', where: 'face' },
  { id: 'missing_arm', name: 'Missing arm', where: 'body' },
  { id: 'cyber_eye', name: 'Mechanical eye', where: 'face' },
  { id: 'missing_leg', name: 'Missing leg', where: 'body' },
  { id: 'cyber_arm', name: 'Mechanical arm', where: 'body' },
  { id: 'cyber_leg', name: 'Mechanical leg', where: 'body' },
  { id: 'dots', name: 'Forehead dots', where: 'face' },
  { id: 'thirdeye', name: 'Third eye', where: 'face' },
  { id: 'tattoo_face', name: 'Face tattoo', where: 'face' },
  { id: 'tattoo_arm', name: 'Arm tattoo', where: 'body' },
  { id: 'crack_tooth', name: 'Cracked tooth', where: 'face' },
  { id: 'birthmark', name: 'Birthmark', where: 'face' },
  { id: 'custom', name: 'Something else', where: 'body' },
];

// Accessories are things a body wears. Some you can pick at the start; others
// arrive with the items you own, the titles you win, and the state you are in
// (the dead wear a halo whether they like it or not).
export const ACCESSORY_PRESETS = [
  { id: 'headband', name: 'Headband', starter: true },
  { id: 'bandana', name: 'Bandana', starter: true },
  { id: 'glasses', name: 'Glasses', starter: true },
  { id: 'sunglasses', name: 'Sunglasses', starter: true },
  { id: 'earring', name: 'Single earring', starter: true },
  { id: 'earrings', name: 'Earrings', starter: true },
  { id: 'necklace', name: 'Necklace', starter: true },
  { id: 'wristbands', name: 'Wristbands', starter: true },
  { id: 'cape', name: 'Cape', starter: true },
  { id: 'turban', name: 'Turban', starter: true },
  { id: 'hat', name: 'Wide hat', starter: true },
  { id: 'eyepatch', name: 'Eyepatch', starter: true },
  { id: 'scarf', name: 'Scarf', starter: true },
  { id: 'scouter', name: 'Scouter', starter: false, item: 'scouter' },
  { id: 'potara', name: 'Potara earrings', starter: false, item: 'potara' },
  { id: 'sword', name: 'Sword on the back', starter: false, item: 'z_sword' },
  { id: 'pole', name: 'Power Pole', starter: false, item: 'power_pole' },
  { id: 'belt', name: 'Championship belt', starter: false, item: 'championship_belt' },
  { id: 'shell', name: 'Turtle shell', starter: false, item: 'turtle_shell' },
  { id: 'halo', name: 'Halo', starter: false },
  { id: 'custom', name: 'Something else', starter: true },
];

/** Every accessory the character is wearing right now, from all sources. */
export function wornAccessories(character) {
  const a = character.appearance || {};
  const out = new Set(a.accessories || []);
  const items = character.items || [];
  for (const acc of ACCESSORY_PRESETS) {
    if (acc.item && items.includes(acc.item)) out.add(acc.id);
  }
  // Shop accessories carry the id of what they put on you.
  for (const id of items) {
    if (id.startsWith('acc_')) out.add(id.slice(4));
  }
  if (items.includes('cyber_eye')) out.add('cyber_eye');
  if (character.inAfterlife && !character.keptBody) out.add('halo');
  // Missing an eye without a patch is a choice; the default is the patch.
  const marks = allMarks(character);
  if (marks.includes('missing_eye') && !out.has('cyber_eye')) out.add('eyepatch');
  return [...out];
}

/** Marks from creation plus everything the life has left on the body. */
export function allMarks(character) {
  const a = character.appearance || {};
  const list = (a.marks || []).slice();
  // Legacy single marking from older saves.
  if (a.marking && a.marking !== 'none' && !list.length) {
    list.push(a.marking === 'scar' ? 'scar_cheek' : a.marking);
  }
  for (const sc of character.scars || []) if (sc.mark && !list.includes(sc.mark)) list.push(sc.mark);
  return list;
}

/** Darken or lighten a hex colour, for brows and shadow detail. */
function shade(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c) => Math.max(0, Math.min(255, Math.round(c + (amount < 0 ? c * amount : (255 - c) * amount))));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function look(list, id, fallback) {
  return list.find((x) => x.id === id) || list.find((x) => x.id === fallback) || list[0];
}

/**
 * Hair comes in two layers: anything that hangs down (a braid, a ponytail,
 * long hair) is drawn behind the head, and the cap and fringe are drawn over
 * it. Drawing them together is what puts a plait down somebody's face.
 */
/**
 * The skull, as numbers. Hair used to guess at these and sat eight pixels
 * below the crown, which put a band across the forehead and left the top of
 * the head bare. Everything that has to sit on the head now reads from here.
 */
function skull(headTop, cx, headR, headH) {
  return {
    cx,
    top: headTop - 12,           // the actual apex of the cranium
    temple: headTop + 18,        // widest point, where the sides go vertical
    brow: headTop + 1,           // hairline, high on the forehead
    eyeLine: headTop + 30,       // nothing that is not a deliberate fringe goes below this
    left: cx - headR,
    right: cx + headR,
    r: headR,
    chin: headTop + headH + 18,
  };
}

/**
 * The dome of the hair, following the skull outline with `lift` of clearance.
 * Mirrors the head path exactly, so hair can never sit inside the scalp.
 */
function domePath(sk, lift = 3, dropL = 0, dropR = 0) {
  const L = sk.left - lift * 0.4;
  const R = sk.right + lift * 0.4;
  const top = sk.top - lift;
  return `M${L} ${sk.brow + dropL}
    Q${L} ${top} ${sk.cx} ${top}
    Q${R} ${top} ${R} ${sk.brow + dropR}
    Q${sk.cx} ${sk.brow + 8} ${L} ${sk.brow + dropL} Z`;
}

/** A point on the dome, for hanging spikes and fringes off it. */
function onDome(sk, t, lift = 3) {
  // t: 0 at the left temple, 1 at the right. This was inverted - the first
  // spike root landed near the right temple while every path starts at the
  // left edge, so the renderer drew a straight chord clean across the face
  // to reach it, right through the eyebrows.
  const angle = Math.PI * t;
  return {
    x: sk.cx - Math.cos(angle) * (sk.r + lift * 0.4),
    y: sk.temple - Math.sin(angle) * (sk.temple - (sk.top - lift)),
  };
}

function hairBackPath(style, headTop, cx, headR, headH) {
  const sk = skull(headTop, cx, headR, headH);
  const L = sk.left - 2;
  const R = sk.right + 2;
  const y = sk.temple - 8;
  switch (style) {
    case 'long':
      return `M${L} ${y} Q${sk.cx} ${sk.top - 4} ${R} ${y}
        L${R + 7} ${y + 108} L${R - 11} ${y + 102}
        L${R - 11} ${y + 26} L${L + 11} ${y + 26}
        L${L + 11} ${y + 102} L${L - 7} ${y + 108} Z`;
    case 'ponytail':
      // Gathered at the back of the crown, falling behind the shoulder.
      return `M${R - 10} ${sk.temple - 8} Q${R + 7} ${sk.temple - 4} ${R + 9} ${sk.temple + 14}
        L${R + 12} ${sk.temple + 62} L${R + 2} ${sk.temple + 64}
        L${R - 2} ${sk.temple + 16} Q${R - 11} ${sk.temple + 4} ${R - 10} ${sk.temple - 8} Z`;
    case 'braid':
      // Down the back of the neck, not the face.
      return `M${sk.cx - 7} ${sk.chin - 6} L${sk.cx + 7} ${sk.chin - 6}
        L${sk.cx + 6} ${sk.chin + 84} L${sk.cx - 6} ${sk.chin + 84} Z`;
    case 'bob':
      return `M${L - 3} ${y} Q${sk.cx} ${sk.top - 4} ${R + 3} ${y}
        L${R + 4} ${y + 40} L${L - 4} ${y + 40} Z`;
    case 'pigtails': {
      // Gathered at each temple rather than the crown, and falling either side.
      const left = `M${L + 2} ${sk.temple - 6} Q${L - 9} ${sk.temple - 2} ${L - 11} ${sk.temple + 16}
        L${L - 13} ${sk.temple + 58} L${L - 3} ${sk.temple + 60}
        L${L + 1} ${sk.temple + 18} Q${L + 10} ${sk.temple + 4} ${L + 2} ${sk.temple - 6} Z`;
      const right = `M${R - 2} ${sk.temple - 6} Q${R + 9} ${sk.temple - 2} ${R + 11} ${sk.temple + 16}
        L${R + 13} ${sk.temple + 58} L${R + 3} ${sk.temple + 60}
        L${R - 1} ${sk.temple + 18} Q${R - 10} ${sk.temple + 4} ${R - 2} ${sk.temple - 6} Z`;
      return `${left} ${right}`;
    }
    default:
      return '';
  }
}

function hairPath(style, headTop, cx, headR, headH) {
  const sk = skull(headTop, cx, headR, headH);
  const dome = domePath(sk, 3);

  switch (style) {
    case 'spiked': {
      // Spikes are raised off points on the dome, so every root is on the head.
      const roots = [0.06, 0.22, 0.38, 0.5, 0.62, 0.78, 0.94];
      const heights = [16, 30, 22, 34, 24, 29, 15];
      let d = `M${sk.left - 1} ${sk.brow}`;
      for (let i = 0; i < roots.length; i++) {
        const a = onDome(sk, roots[i], 3);
        const b = onDome(sk, Math.min(1, roots[i] + 0.08), 3);
        const lean = (roots[i] - 0.5) * 22;
        d += ` L${a.x + lean * 0.4} ${a.y - heights[i]} L${b.x} ${b.y}`;
      }
      d += ` L${sk.right + 1} ${sk.brow} Q${sk.cx} ${sk.brow + 9} ${sk.left - 1} ${sk.brow} Z`;
      return d;
    }
    case 'wild': {
      const roots = [0.08, 0.28, 0.5, 0.72, 0.92];
      let d = `M${sk.left - 2} ${sk.brow + 4}`;
      for (let i = 0; i < roots.length; i++) {
        const a = onDome(sk, roots[i], 4);
        const b = onDome(sk, Math.min(1, roots[i] + 0.12), 4);
        const sway = (i % 2 ? 9 : -9);
        d += ` C${a.x + sway} ${a.y - 26} ${b.x + sway} ${b.y - 30} ${b.x} ${b.y}`;
      }
      d += ` L${sk.right + 2} ${sk.brow + 2} Q${sk.cx} ${sk.brow + 10} ${sk.left - 2} ${sk.brow + 2} Z`;
      return d;
    }
    case 'long':
    case 'ponytail':
      // A dome with a parted fringe, rather than a helmet.
      return `${domePath(sk, 3, 4, 4)}
        M${sk.left + 2} ${sk.brow + 2} Q${sk.cx - 6} ${sk.brow + 12} ${sk.cx + 6} ${sk.brow + 14}
        Q${sk.cx - 10} ${sk.brow + 18} ${sk.left} ${sk.brow + 12} Z`;
    case 'braid':
      return domePath(sk, 3, 4, 4);
    case 'bob':
      return `${domePath(sk, 4)}
        M${sk.left - 4} ${sk.brow + 6} L${sk.left - 5} ${sk.brow + 52} L${sk.left + 5} ${sk.brow + 52} L${sk.left + 4} ${sk.brow + 6} Z
        M${sk.right + 4} ${sk.brow + 6} L${sk.right + 5} ${sk.brow + 52} L${sk.right - 5} ${sk.brow + 52} L${sk.right - 4} ${sk.brow + 6} Z`;
    case 'cropped':
      return domePath(sk, 1.5);
    case 'mohawk': {
      const crest = onDome(sk, 0.5, 2);
      return `M${sk.cx - 11} ${sk.brow + 2}
        C${sk.cx - 15} ${crest.y - 30} ${sk.cx + 15} ${crest.y - 30} ${sk.cx + 11} ${sk.brow + 2}
        Q${sk.cx} ${sk.brow + 10} ${sk.cx - 11} ${sk.brow + 2} Z`;
    }
    case 'topknot': {
      const crest = onDome(sk, 0.5, 3);
      return `${domePath(sk, 3)}
        M${sk.cx - 11} ${crest.y + 2} C${sk.cx - 14} ${crest.y - 22} ${sk.cx + 14} ${crest.y - 22} ${sk.cx + 11} ${crest.y + 2} Z`;
    }
    case 'flame': {
      // Swept back and low at the sides, a widow's peak at the centre, and a
      // small crown of tall points concentrated over the forehead rather than
      // spread evenly - the shape that reads as "Vegeta" and not "Goku".
      const roots = [0.32, 0.44, 0.56, 0.68];
      const heights = [30, 43, 41, 27];
      const sideA = onDome(sk, 0.14, 2);
      const sideB = onDome(sk, 0.86, 2);
      let d = `M${sk.left - 1} ${sk.brow} L${sideA.x} ${sideA.y - 4}`;
      for (let i = 0; i < roots.length; i++) {
        const a = onDome(sk, roots[i], 3);
        const b = onDome(sk, Math.min(1, roots[i] + 0.1), 3);
        const lean = (roots[i] - 0.5) * 10;
        d += ` L${a.x + lean} ${a.y - heights[i]} L${b.x} ${b.y}`;
      }
      d += ` L${sideB.x} ${sideB.y - 4} L${sk.right + 1} ${sk.brow}`;
      d += ` Q${sk.cx} ${sk.brow + 15} ${sk.left - 1} ${sk.brow} Z`;
      return d;
    }
    case 'pigtails':
      // Short and close on top; the tails themselves hang behind the face.
      return domePath(sk, 2, 3, 3);
    case 'afro': {
      // A rounded cloud well clear of the skull outline, not a fitted dome.
      return domePath(sk, 24);
    }
    case 'buzz':
      // Shorter than cropped, near the scalp.
      return domePath(sk, 0.4);
    case 'sidepart':
      // One side swept up and back, the other combed down and lower.
      return domePath(sk, 2.5, 2, 12);
    default:
      return '';
  }
}

/**
 * A body at each point of a life. Proportions, not just size: an infant is
 * mostly head, a child is head-heavy and short-limbed, an elder has lost a
 * little height and stands differently. Everything here multiplies the adult
 * geometry, so one drawing serves every age.
 */
export const LIFE_STAGES = [
  { id: 'infant',  name: 'Infant',  until: 2,  head: 1.34, body: 0.42, neck: 0.5, drop: 62, hair: 0.35 },
  { id: 'toddler', name: 'Toddler', until: 5,  head: 1.24, body: 0.55, neck: 0.62, drop: 48, hair: 0.6 },
  { id: 'child',   name: 'Child',   until: 11, head: 1.14, body: 0.7,  neck: 0.74, drop: 32, hair: 0.85 },
  { id: 'teen',    name: 'Teenager', until: 17, head: 1.05, body: 0.87, neck: 0.88, drop: 14, hair: 1 },
  { id: 'adult',   name: 'Adult',   until: 55, head: 1,    body: 1,    neck: 1,    drop: 0,  hair: 1 },
  { id: 'elder',   name: 'Elder',   until: 999, head: 1,   body: 0.94, neck: 0.95, drop: 6,  hair: 1 },
];

/** Which stage this character is at, in biological rather than calendar years. */
export function lifeStage(character) {
  const bio = character.bioAge !== undefined
    ? character.bioAge
    : (character.age || 0) * (character.maturityRate || 1);
  return LIFE_STAGES.find((s) => bio < s.until) || LIFE_STAGES[LIFE_STAGES.length - 1];
}

/**
 * Draw anybody. NPCs keep their scars under `appearance.marks` and their
 * carried gear under `gear`, and their species decides how fast they mature,
 * so a 40-year-old Namekian is not drawn as middle-aged.
 */
export function npcPortrait(npc, opts = {}) {
  return portraitSvg({
    raceId: npc.raceId,
    sex: npc.sex,
    age: npc.age,
    maturityRate: opts.maturityRate ?? npc.maturityRate ?? 1,
    appearance: npc.appearance || {},
    items: npc.items || [],
    scars: (npc.scarStory || []),
    tail: !!npc.tail,
    inAfterlife: npc.alive === false,
    vitals: npc.vitals || { health: 90, happiness: 60 },
    stats: npc.stats || {},
    karma: npc.karma || 0,
    traits: npc.traits || [],
    tags: npc.tags || [],
    canonTags: npc.canonTags || [],
    flags: {},
  }, opts);
}

export const EXPRESSIONS = [
  { id: 'neutral', name: 'Neutral' },
  { id: 'grin', name: 'Grinning' },
  { id: 'scowl', name: 'Scowling' },
  { id: 'focused', name: 'Focused' },
  { id: 'tired', name: 'Exhausted' },
  { id: 'sad', name: 'Grieving' },
  { id: 'smug', name: 'Smug' },
  { id: 'shock', name: 'Caught off guard' },
  { id: 'rage', name: 'Furious' },
  { id: 'serene', name: 'Serene' },
];

/**
 * A resting face, read off temperament rather than the moment. Frieza does
 * not grin when he is pleased with himself, he smirks - and NPCs never had a
 * `karma` field for the old check to key off, so every one of them fell
 * through to it regardless and Frieza smiled like Goku whenever happy.
 */
const RESTING_BIAS = {
  // self-satisfied or superior - a smirk, not an open smile
  cruel: 'smug', sly: 'smug', scheming: 'smug', smug: 'smug', preening: 'smug', vain: 'smug',
  cocky: 'smug', haughty: 'smug', imperious: 'smug', mercenary: 'smug', proud: 'smug', bold: 'smug',
  urbane: 'smug', capricious: 'smug', boastful: 'smug', devious: 'smug', greedy: 'smug', evil: 'smug',
  cunning: 'smug',
  // hostile or dangerous - a scowl
  brutal: 'scowl', spiteful: 'scowl', bullying: 'scowl', fierce: 'scowl', volatile: 'scowl',
  unstable: 'scowl', grim: 'scowl', hard: 'scowl', severe: 'scowl', cold: 'scowl', blustering: 'scowl',
  booming: 'scowl', brash: 'scowl', impatient: 'scowl', petulant: 'scowl', vengeful: 'scowl',
  jealous: 'scowl',
  // warm and open - a real grin
  cheerful: 'grin', jolly: 'grin', warm: 'grin', sweet: 'grin', kind: 'grin', boisterous: 'grin',
  jokey: 'grin', easygoing: 'grin', gentle: 'grin', earnest: 'grin', childlike: 'grin', childish: 'grin',
  good: 'grin', funny: 'grin', generous: 'grin', brave: 'grin', loyal: 'grin',
  // composed
  serene: 'serene', stoic: 'serene', quiet: 'serene', placid: 'serene', ancient: 'serene',
  grave: 'serene', calm: 'serene', patient: 'serene', protective: 'serene',
  // deadpan
  professional: 'focused', dry: 'focused', blunt: 'focused', flippant: 'focused', sharp: 'focused',
  obsessive: 'focused', curious: 'focused', seeker: 'focused', superstitious: 'focused',
};

/** The first temperament word this character carries that has a resting face. */
function restingBias(character) {
  const words = [
    ...(character.traits || []),
    ...(character.tags || []),
    ...(character.canonTags || []),
  ];
  for (const w of words) if (RESTING_BIAS[w]) return RESTING_BIAS[w];
  return null;
}

/**
 * How kept-together somebody looks, 0 (fine) to 3 (wrecked). Not a costume
 * choice - read off the same vitals and flags that already drive the
 * expression, so a body that has just been through something shows it on the
 * hair and the clothes before anybody says a word.
 */
function groomingLevel(character) {
  const v = character.vitals || {};
  const f = character.flags || {};
  let messy = 0;
  if (v.health !== undefined && v.health < 45) messy += 1;
  if (v.happiness !== undefined && v.happiness < 30) messy += 1;
  if (f.brink_of_death || f.homeless || f.wretched || f.collateral || f.starved) messy += 1;
  if (f.fury || f.humiliated) messy += 1;
  return Math.min(3, messy);
}

/**
 * What the face is doing, read off the live character rather than chosen.
 * Health first, because a body at ten per cent does not smirk. Temperament
 * decides what "pleased" and "displeased" look like before the state machine
 * defaults to the generic grin or scowl.
 */
export function expressionFor(character, opts = {}) {
  if (opts.expression) return opts.expression;
  const v = character.vitals || {};
  const f = character.flags || {};
  const bias = restingBias(character);
  if (opts.form) return 'rage';
  if (v.health !== undefined && v.health < 25) return 'tired';
  if (f.fury || f.humiliated) return bias === 'smug' ? 'smug' : 'rage';
  if (f.brink_of_death) return 'shock';
  if (v.happiness !== undefined && v.happiness < 25) return (bias === 'scowl' || bias === 'smug') ? bias : 'sad';
  if (((character.karma || 0) < -40) || bias === 'smug') {
    // Content and cruel is a smirk. Nothing about being satisfied with
    // yourself for the wrong reasons should read as an open, honest grin.
    if (v.happiness !== undefined && v.happiness > 55) return 'smug';
  }
  if (bias === 'scowl' && v.happiness !== undefined && v.happiness < 55) return 'scowl';
  if (v.happiness !== undefined && v.happiness > 82) return 'grin';
  if (bias) return bias;
  if ((character.stats && character.stats.discipline) > 75) return 'serene';
  if (v.happiness !== undefined && v.happiness > 62) return 'focused';
  return 'neutral';
}

function eyeShape(shape, x, y, colour, mood = 'neutral', flip = 1) {
  // Expression narrows, widens or closes the eye before its shape is drawn.
  const squint = { scowl: 0.55, focused: 0.7, tired: 0.4, rage: 0.5, smug: 0.6, serene: 0.25, grin: 0.55 }[mood] || 1;
  const grow = { shock: 1.35, sad: 1.1 }[mood] || 1;
  const k = squint * grow;
  const out = [];
  if (mood === 'serene' || (mood === 'grin' && shape !== 'wide')) {
    // Eyes closed, curving the way the mouth does.
    out.push(`<path d="M${x - 9} ${y + 1} q9 ${mood === 'serene' ? 4 : -6} 18 0" fill="none" stroke="${colour}" stroke-width="2.6" stroke-linecap="round"/>`);
    return out.join('');
  }
  switch (shape) {
    case 'narrow':
      out.push(`<rect x="${x - 9}" y="${y - 2 * k}" width="18" height="${Math.max(2, 5 * k)}" rx="2.5" fill="${colour}"/>`);
      break;
    case 'round':
      out.push(`<ellipse cx="${x}" cy="${y}" rx="6" ry="${Math.max(1.6, 6 * k)}" fill="${colour}"/>`);
      break;
    case 'wide':
      out.push(`<ellipse cx="${x}" cy="${y}" rx="8.5" ry="${Math.max(2, 7 * k)}" fill="${colour}"/>`);
      break;
    case 'heavy':
      out.push(`<path d="M${x - 9} ${y} q9 ${-8 * k} 18 0 q-9 ${6 * k} -18 0 Z" fill="${colour}"/>`);
      break;
    default: // sharp
      out.push(`<path d="M${x - 10 * flip} ${y + 3 * k} L${x + 10 * flip} ${y - 4 * k} L${x + 9 * flip} ${y + 3 * k} Z" fill="${colour}"/>`);
  }
  if (mood === 'tired') {
    out.push(`<path d="M${x - 8} ${y + 7} q8 3 16 0" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1.8" stroke-linecap="round"/>`);
  }
  return out.join('');
}

/** Brow angle and mouth shape, which is most of what an expression is. */
function faceExpression(mood, cx, eyeY, mouthY, browColour) {
  const parts = [];
  const brows = {
    neutral: [-4, -4], grin: [-6, -6], scowl: [5, 5], focused: [2, 2],
    tired: [-2, -2], sad: [-7, -7], smug: [-8, 3], shock: [-9, -9],
    rage: [8, 8], serene: [-3, -3],
  }[mood] || [-4, -4];
  parts.push(`<path d="M${cx - 21} ${eyeY - 11 + brows[0]} l15 ${-brows[0] * 0.9 - 3}" stroke="${browColour}" stroke-width="3.5" stroke-linecap="round"/>`);
  parts.push(`<path d="M${cx + 21} ${eyeY - 11 + brows[1]} l-15 ${-brows[1] * 0.9 - 3}" stroke="${browColour}" stroke-width="3.5" stroke-linecap="round"/>`);

  const ink = 'rgba(0,0,0,.45)';
  const mouths = {
    neutral: `M${cx - 7} ${mouthY} q7 4 14 0`,
    grin: `M${cx - 11} ${mouthY - 2} q11 12 22 0`,
    scowl: `M${cx - 8} ${mouthY + 3} q8 -6 16 0`,
    focused: `M${cx - 8} ${mouthY} l16 0`,
    tired: `M${cx - 7} ${mouthY + 2} q7 2 14 -1`,
    sad: `M${cx - 9} ${mouthY + 4} q9 -8 18 0`,
    smug: `M${cx - 8} ${mouthY + 1} q10 -6 17 -4`,
    shock: null,
    rage: `M${cx - 11} ${mouthY - 1} q11 10 22 0 q-11 -3 -22 0`,
    serene: `M${cx - 7} ${mouthY} q7 3 14 0`,
  };
  if (mood === 'shock') {
    parts.push(`<ellipse cx="${cx}" cy="${mouthY + 2}" rx="5" ry="7" fill="${ink}"/>`);
  } else if (mood === 'rage') {
    parts.push(`<path d="${mouths.rage}" fill="${ink}"/>`);
  } else {
    parts.push(`<path d="${mouths[mood] || mouths.neutral}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`);
  }
  return parts.join('');
}

/**
 * What each transformation actually looks like, keyed by the transformation's
 * own id rather than pattern-matched off its name - a name match let "Super
 * Saiyan Blue" match the plain "Super Saiyan" gold-hair rule, so Blue forms
 * were rendered gold. hair/eyes/skin are colour overrides (undefined means
 * unchanged); aura tints the background glow; lift is how far the hairstyle
 * is pushed up ('mild' | 'strong' | 'extreme'), independent of which style it
 * actually is, so a lifted ponytail and a lifted afro both read as "standing
 * up" without needing a hand-built spiked variant of every hairstyle.
 */
const FORM_VISUALS = {
  golden_oozaru: { aura: '#ffd24a' },
  false_ssj: { hair: '#c65a3a', eyes: '#3a2018', aura: '#e07a4a', lift: 'mild' },
  ssj: { hair: '#f2cf4a', eyes: '#3ecf4a', aura: '#ffd24a', lift: 'strong' },
  ssj_grade2: { hair: '#f2cf4a', eyes: '#3ecf4a', aura: '#ffd24a', lift: 'strong' },
  ssj_grade3: { hair: '#eec53f', eyes: '#3ecf4a', aura: '#ffcf3a', lift: 'strong' },
  ssj_full: { hair: '#f2cf4a', eyes: '#3ecf4a', aura: '#ffd24a', lift: 'strong' },
  ssj2: { hair: '#f5d65a', eyes: '#3ecf4a', aura: '#ffe066', lift: 'strong' },
  ssj3: { hair: '#f5d65a', eyes: '#3ecf4a', aura: '#ffe066', lift: 'extreme' },
  ssg: { hair: '#b3324c', eyes: '#ff9fb0', aura: '#ff5f7a', lift: 'mild' },
  ssb: { hair: '#3f7fe0', eyes: '#bfe4ff', aura: '#4fa8ff', lift: 'mild' },
  ssb_mastered: { hair: '#4a8bef', eyes: '#d6f0ff', aura: '#5fb4ff', lift: 'mild' },
  ssb_evolution: { hair: '#22468f', eyes: '#9fd0ff', aura: '#1f4fc4', lift: 'mild' },
  ssb_kaioken: { hair: '#3f7fe0', eyes: '#bfe4ff', aura: '#ff4d4d', lift: 'mild' },
  ultra_ego: { eyes: '#ff3355', aura: '#ff2f55', lift: 'mild' },
  ui_sign: { hair: '#cfd3de', eyes: '#dfe7ef', aura: '#dfe7ef', lift: 'mild' },
  ui_perfected: { hair: '#dee1e9', eyes: '#e8edf5', aura: '#e8edf5', lift: 'mild' },
  ui_mastered: { hair: '#e4e7ee', eyes: '#eef2f8', aura: '#eef2f8', lift: 'mild' },
  legendary_ss: { hair: '#8ee85a', eyes: '#c8ffb0', aura: '#8bffb0', lift: 'extreme' },
  kaioken: { aura: '#ff4d4d' },
  kaioken_x10: { aura: '#ff2b2b' },
  destroyer_aura: { eyes: '#c98cff', aura: '#a13cff' },
  // Frost Demon: forms change skin, not hair - most of the line is hairless.
  fd_second: { skin: '#b8c4d6' },
  fd_third: { skin: '#8a5fb0' },
  fd_final: { skin: '#e7e2ea' },
  fd_hundred: { skin: '#f4eef7' },
  golden: { skin: '#e8c53a', eyes: '#fff3b0', aura: '#ffd24a' },
  black_form: { skin: '#241a33', eyes: '#ff3355', aura: '#8a2be2' },
  // Namekian
  giant_form: { },
  super_namekian: { aura: '#8bffb0' },
  orange_piccolo: { skin: '#e0862f', aura: '#ffb15c' },
  // Majin
  majin_super: { aura: '#ff8fd6' },
  majin_pure: { skin: '#ffd4ea', aura: '#ffd0ea' },
  majin_ultra: { skin: '#ffb3da', aura: '#ff5fae', eyes: '#fff0f8' },
  // Android/Bioandroid
  overclock: { aura: '#7ad8ff' },
  core_mk2: { aura: '#5cc4ff' },
  core_mk3: { aura: '#3fb0ff', eyes: '#bfe9ff' },
  hell_mode: { eyes: '#ff3355', aura: '#ff5050' },
  semi_perfect: { aura: '#c9ff5c' },
  perfect_form: { aura: '#b0ff5c', skin: '#c9c04a' },
  super_perfect: { aura: '#e8ff5c', eyes: '#f4ffb0' },
  // Kai
  kai_ascension: { aura: '#ffe27a' },
  // Tuffle
  machine_mutant: { aura: '#7ad8ff' },
  parasite_host: { aura: '#c9ff5c', eyes: '#e0ff9a' },
  // Yardratian
  spirit_expansion: { aura: '#b98cff' },
  spirit_giant: { aura: '#b98cff' },
  // Shared
  potential_unleashed: { aura: '#ffe27a' },
  spirit_overflow: { aura: '#b98cff' },
  ancestral_rage: { eyes: '#ff5f5f', aura: '#ff5f5f', lift: 'mild' },
  hive_surge: { aura: '#c9ff5c' },
  broodcall: { aura: '#8bffb0' },
  potara_fusion: { aura: '#ffd24a' },
  dance_fusion: { aura: '#b98cff' },
};

/** Anything not named above still gets a form-tier aura rather than none. */
function formVisualsFallback(form) {
  const tier = form.tier || 1;
  const hue = Math.max(0, 260 - tier * 14);
  return { aura: `hsl(${hue}, 90%, 68%)` };
}

/**
 * Build the portrait. `character` is the live character object; `opts.form`
 * adds the aura and hair changes of an active transformation.
 */
export function portraitSvg(character, opts = {}) {
  const a = character.appearance || {};
  let skin = look(SKIN_TONES, a.skin, 'light').hex;
  const hairColour = look(HAIR_COLOURS, a.hairColour, 'black').hex;
  const eyeColour = look(EYE_COLOURS, a.eyeColour, 'black').hex;
  const outfit = look(OUTFITS, a.outfit, 'gi_orange');
  const style = a.hairStyle || 'spiked';
  const face = a.face || 'square';
  const build = a.buildShape || 'balanced';
  const race = character.raceId;

  const stage = opts.stage || lifeStage(character);

  const W = 220;
  const H = 260;
  const cx = W / 2;
  // A small body sits lower in the frame; a big head starts higher on it.
  const headTop = 44 + stage.drop;
  const headR = Math.round((face === 'round' ? 40 : face === 'long' ? 36 : 38) * stage.head);
  const headH = Math.round((face === 'long' ? 52 : face === 'round' ? 42 : 46)
    * (stage.id === 'infant' ? 0.86 : stage.id === 'toddler' ? 0.92 : 1) * stage.head);
  const chin = headTop + headH + Math.round(18 * stage.head);

  // Frame differs by sex as well as build: narrower shoulders and neck, a
  // softer jaw, a waist that comes in rather than going straight down.
  // Sex only shapes a grown body. Children are children.
  const grown = stage.id === 'adult' || stage.id === 'elder' || stage.id === 'teen';
  const fem = character.sex === 'female' && grown;
  const sexScale = (fem ? 0.84 : 1) * stage.body;
  const shoulderWidth = Math.round(({ small: 44, wiry: 50, lean: 56, balanced: 62, stocky: 70, massive: 80 }[build] || 62) * sexScale);
  const neckWidth = Math.max(7, Math.round(({ small: 11, wiry: 12, lean: 13, balanced: 15, stocky: 18, massive: 21 }[build] || 15)
    * (fem ? 0.82 : 1) * stage.neck));
  // A female frame comes in at the waist and back out; the male one tapers.
  const waist = Math.round(shoulderWidth * (fem ? 0.7 : 0.94));
  const hip = Math.round(shoulderWidth * (fem ? 0.98 : 0.9));
  const jawTaper = fem ? 8 : 4;
  const mood = expressionFor(character, opts);

  // How kept-together they are. This used to just darken every surface by
  // one flat amount, which read as a colour filter rather than a body that
  // has not been looked after - so the clothes keep their real colour and
  // neglect shows up instead as patchy dirt, tired skin and undone hair,
  // each scaled to how bad things have actually gotten.
  const grime = groomingLevel(character);
  const bodyColour = outfit.main || skin;
  const trimColour = outfit.trim || '#c9a227';

  const visuals = opts.form ? (FORM_VISUALS[opts.form.id] || formVisualsFallback(opts.form)) : null;
  const finalHair = visuals && visuals.hair ? visuals.hair : hairColour;
  const finalEyeColour = visuals && visuals.eyes ? visuals.eyes : eyeColour;
  const auraColour = visuals ? visuals.aura : null;
  if (visuals && visuals.skin) skin = visuals.skin;
  // Sallow, tired skin at the higher grooming tiers - not washed, not fed.
  if (grime >= 2) skin = shade(skin, -0.05 * (grime - 1));
  // A transformed character's hair does not lie the way it usually does -
  // scaled and lifted from a point near the crown so it reads as standing
  // up (or, for the calmer forms, just faintly raised) regardless of which
  // hairstyle it is actually made of, rather than needing a hand-built
  // spiked variant of every style.
  const hairLiftAmt = { mild: 0.07, strong: 0.16, extreme: 0.26 }[visuals && visuals.lift] || 0;
  const hairLiftAttr = hairLiftAmt
    ? ` style="transform-origin:${cx}px ${headTop + headR * 0.85}px; transform: scaleY(${1 + hairLiftAmt}) translateY(${Math.round(-hairLiftAmt * 26)}px);"`
    : '';

  const parts = [];

  parts.push(`<defs>
    <radialGradient id="pg-bg" cx="50%" cy="34%" r="72%">
      <stop offset="0%" stop-color="var(--surface-2)"/>
      <stop offset="100%" stop-color="var(--ground)"/>
    </radialGradient>
    <radialGradient id="pg-aura" cx="50%" cy="55%" r="55%">
      <stop offset="0%" stop-color="${auraColour || '#000'}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${auraColour || '#000'}" stop-opacity="0"/>
    </radialGradient>
  </defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#pg-bg)"/>`);
  if (auraColour) parts.push(`<rect width="${W}" height="${H}" fill="url(#pg-aura)"/>`);

  // A tail, behind the body and sized to it. Not every tail is the same
  // tail: a Saiyan's is a furred coil, a Frost Demon's is smooth chitin
  // tapering to a point, and it should read as the right species' at a glance.
  if (character.tail) {
    const reach = 34 * stage.body + 8;
    const path = `M${cx + shoulderWidth - 6} ${H - 10} C${cx + shoulderWidth + reach} ${H - 60 * stage.body - 10}
      ${cx + shoulderWidth + reach * 0.3} ${chin + 30} ${cx + shoulderWidth - 14} ${chin + 34}`;
    if (race === 'frostdemon') {
      const tailColour = shade(skin, -0.08);
      parts.push(`<path d="${path}" fill="none" stroke="${tailColour}" stroke-width="${5 * stage.body + 2}" stroke-linecap="round"/>`);
      // A darker tip, the way Frieza's tail reads on screen.
      parts.push(`<circle cx="${cx + shoulderWidth - 14}" cy="${chin + 34}" r="${3.4 * stage.body + 1.5}" fill="${shade(skin, -0.35)}"/>`);
    } else {
      parts.push(`<path d="${path}" fill="none" stroke="#7a4a24" stroke-width="${6 * stage.body + 3}" stroke-linecap="round"/>`);
    }
  }

  // Hair that hangs down goes behind everything else.
  const hasHair = !['namekian', 'frostdemon', 'majin', 'bioandroid'].includes(race)
    && style !== 'bald' && stage.hair > 0.4;
  if (hasHair) {
    const back = hairBackPath(style, headTop, cx, headR, headH);
    if (back) parts.push(`<g${hairLiftAttr}><path d="${back.replace(/\s+/g, ' ')}" fill="${finalHair}" opacity="0.92"/></g>`);
  }

  // Arms. There were none - the body was a torso silhouette with nothing
  // hanging off the shoulders, for every build and both sexes. Drawn behind
  // the torso fill so the shoulder seam is where the torso curve already is,
  // with no gap and no double edge.
  const armReach = (fem ? 11 : 14) * sexScale;
  for (const side of [-1, 1]) {
    const sx = cx + side * (shoulderWidth - 6);
    const ex = cx + side * (shoulderWidth + armReach - 2);
    const mx = cx + side * (shoulderWidth + armReach);
    parts.push(`<path d="M${sx} ${chin + 22}
      C${mx} ${chin + 40} ${mx - side * 4} ${chin + 96} ${ex} ${H}
      L${cx + side * (shoulderWidth - 18)} ${H}
      C${cx + side * (shoulderWidth - 10)} ${chin + 96} ${sx - side * 6} ${chin + 40} ${cx + side * (shoulderWidth - 16)} ${chin + 22} Z"
      fill="${bodyColour}"/>`);
    // Wrist and hand, in skin, where the sleeve runs out.
    parts.push(`<ellipse cx="${cx + side * (shoulderWidth + armReach * 0.5 - 6)}" cy="${H - 8}" rx="9" ry="11" fill="${skin}"/>`);
  }

  // Torso and clothing.
  const waistY = chin + 74;
  parts.push(`<path d="M${cx - hip} ${H}
    C${cx - hip} ${H - 30} ${cx - waist} ${waistY + 14} ${cx - waist} ${waistY}
    C${cx - waist} ${waistY - 22} ${cx - shoulderWidth} ${chin + 44} ${cx - shoulderWidth + 6} ${chin + 26}
    Q${cx} ${chin + 2} ${cx + shoulderWidth - 6} ${chin + 26}
    C${cx + shoulderWidth} ${chin + 44} ${cx + waist} ${waistY - 22} ${cx + waist} ${waistY}
    C${cx + waist} ${waistY + 14} ${cx + hip} ${H - 30} ${cx + hip} ${H} Z"
    fill="${bodyColour}"/>`);
  if (fem && stage.id !== 'teen') {
    // A chest, positioned on the chest rather than up near the collarbone
    // and shoulder seam - it was landing close enough to the shoulder width
    // that it read as a pair of pads sitting on top of the shoulders rather
    // than a bulge on the torso. Sized off its own rolled trait, not off
    // build - a wiry frame and a heavy one can each land anywhere on it, so a
    // wide chest over a narrow waist is a real combination rather than a
    // contradiction the renderer could not produce.
    const bustSize = Math.max(0.5, Math.min(1.8, a.bust ?? 1));
    // Lower than the collar and the top of the arm seam (chin+22..26), so
    // it reads as chest rather than shoulder.
    const by = chin + 52;
    // Where the torso's own outline already sits at chest height (a linear
    // reading of the bezier between the shoulder point and the waist point),
    // used only as the far edge each bulge is allowed to push past - not as
    // where its centre sits.
    const torsoEdgeAtChest = shoulderWidth - (shoulderWidth - waist) * 0.5;
    const bulge = (bustSize - 0.5) * 19 * stage.body;
    const outerEdge = torsoEdgeAtChest + bulge;
    // The inner curve sits close to the sternum, not at the body's centre
    // line - so each bulge spans from near the middle of the chest out to
    // the torso edge (and a little past it), centred well inboard of the
    // shoulders instead of glued to them.
    const innerEdge = torsoEdgeAtChest * 0.22;
    const rx = Math.max(7, (outerEdge - innerEdge) / 2);
    const ry = rx * 1.05;
    const bxOff = innerEdge + rx;
    for (const bside of [-1, 1]) {
      const bx = cx + bside * bxOff;
      parts.push(`<ellipse cx="${bx}" cy="${by}" rx="${rx}" ry="${ry}" fill="${bodyColour}"/>`);
      // A highlight near the top and a shadow along the underside, so it
      // reads as a curve rather than a flat disc glued to the chest.
      parts.push(`<ellipse cx="${bx - bside * rx * 0.22}" cy="${by - ry * 0.32}" rx="${rx * 0.4}" ry="${ry * 0.3}"
        fill="${shade(bodyColour, 0.14)}" opacity="0.4"/>`);
      parts.push(`<path d="M${bx - rx * 0.7} ${by + ry * 0.4} Q${bx} ${by + ry * 0.85} ${bx + rx * 0.7} ${by + ry * 0.4}"
        fill="none" stroke="${shade(bodyColour, -0.28)}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`);
    }
  }
  if (outfit.main) {
    parts.push(`<path d="M${cx - 16} ${chin + 14} L${cx} ${chin + 44} L${cx + 16} ${chin + 14}
      L${cx + 26} ${chin + 22} L${cx} ${H} L${cx - 26} ${chin + 22} Z" fill="${trimColour}" opacity="0.9"/>`);
    if (outfit.id.startsWith('armour')) {
      parts.push(`<path d="M${cx - shoulderWidth + 2} ${chin + 34} q${shoulderWidth} -22 ${shoulderWidth * 2 - 4} 0"
        fill="none" stroke="${trimColour}" stroke-width="6"/>`);
    }
    if (grime >= 1) {
      // Dirt does not sit evenly across a body - it collects at the hems,
      // the elbows, wherever a hand keeps touching. Scattered patches read
      // as neglect; one flat tint read as a colour filter.
      const spots = [
        [hip * 0.55, H - 22], [-waist * 0.5, waistY + 4], [shoulderWidth - 20, chin + 40],
        [-(shoulderWidth - 22), chin + 34], [waist * 0.15, waistY - 12], [-hip * 0.3, H - 40],
      ];
      const patchCount = grime === 1 ? 2 : grime === 2 ? 4 : 6;
      for (let i = 0; i < patchCount; i++) {
        const [ox, oy] = spots[i % spots.length];
        const jig = (i * 7) % 5;
        parts.push(`<ellipse cx="${cx + ox + jig}" cy="${oy - jig}" rx="${4 + (i % 3)}" ry="${3 + (i % 2)}"
          fill="${shade(bodyColour, -0.32)}" opacity="${0.22 + grime * 0.08}"/>`);
      }
    }
    if (grime >= 2) {
      // A tear at the hem, for a body that has just been through something.
      parts.push(`<path d="M${cx + hip - 10} ${H - 4} l6 -10 l4 8 l7 -12"
        fill="none" stroke="${shade(bodyColour, -0.4)}" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`);
    }
  }

  // Neck and head.
  parts.push(`<rect x="${cx - neckWidth / 2}" y="${chin - 14}" width="${neckWidth}" height="26" fill="${skin}"/>`);
  parts.push(`<path d="M${cx - headR} ${headTop + 18}
    Q${cx - headR} ${headTop - 12} ${cx} ${headTop - 12}
    Q${cx + headR} ${headTop - 12} ${cx + headR} ${headTop + 18}
    L${cx + headR - jawTaper} ${headTop + headH}
    Q${cx} ${chin + 6} ${cx - headR + jawTaper} ${headTop + headH} Z" fill="${skin}"/>`);

  // Ears, or whatever this species has instead.
  if (race === 'namekian') {
    parts.push(`<path d="M${cx - headR + 2} ${headTop + 34} l-16 -6 l16 12 Z" fill="${skin}"/>`);
    parts.push(`<path d="M${cx + headR - 2} ${headTop + 34} l16 -6 l-16 12 Z" fill="${skin}"/>`);
    parts.push(`<path d="M${cx - 12} ${headTop - 6} q2 -22 -8 -30" fill="none" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>`);
    parts.push(`<path d="M${cx + 12} ${headTop - 6} q-2 -22 8 -30" fill="none" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>`);
  } else if (race === 'frostdemon') {
    // The head fins and crown band tint with whatever form is active, so a
    // Golden or Black Form carries all the way through instead of stopping
    // at the face.
    const finColour = visuals && visuals.skin ? shade(skin, 0.12) : '#c8b8d8';
    const bandColour = visuals && visuals.skin ? shade(skin, 0.05) : '#b7a6cc';
    parts.push(`<path d="M${cx - headR + 6} ${headTop + 6} l-20 -14 l6 20 Z" fill="${finColour}"/>`);
    parts.push(`<path d="M${cx + headR - 6} ${headTop + 6} l20 -14 l-6 20 Z" fill="${finColour}"/>`);
    parts.push(`<ellipse cx="${cx}" cy="${headTop + 4}" rx="${headR - 8}" ry="14" fill="${bandColour}" opacity="0.85"/>`);
  } else if (race === 'majin') {
    parts.push(`<path d="M${cx + 6} ${headTop - 8} c14 -18 34 -8 26 12 c-6 14 -22 12 -26 2"
      fill="none" stroke="${skin}" stroke-width="9" stroke-linecap="round"/>`);
  } else if (race === 'shinjin') {
    parts.push(`<circle cx="${cx - headR + 2}" cy="${headTop + 38}" r="4" fill="#e2c96a"/>`);
    parts.push(`<circle cx="${cx + headR - 2}" cy="${headTop + 38}" r="4" fill="#e2c96a"/>`);
  } else {
    parts.push(`<ellipse cx="${cx - headR + 1}" cy="${headTop + 32}" rx="5" ry="8" fill="${skin}"/>`);
    parts.push(`<ellipse cx="${cx + headR - 1}" cy="${headTop + 32}" rx="5" ry="8" fill="${skin}"/>`);
  }

  // Hair.
  if (hasHair) {
    const hairParts = [];
    const d = hairPath(style, headTop, cx, headR, headH);
    if (d) {
      hairParts.push(`<path d="${d.replace(/\s+/g, ' ')}" fill="${finalHair}" stroke="${shade(finalHair, 0.22)}" stroke-width="1"/>`);
    }
    if (grime >= 1) {
      // A few strands out of place. Not a haircut, a body that has not had
      // the chance to look after itself.
      const strandColour = shade(finalHair, -0.1);
      const strands = grime + 1;
      for (let i = 0; i < strands; i++) {
        const sxp = cx - headR * 0.6 + (headR * 1.2 * i) / Math.max(1, strands - 1);
        hairParts.push(`<path d="M${sxp} ${headTop - 2} q${(i % 2 ? 6 : -6)} -10 ${(i % 2 ? -3 : 3)} -18"
          fill="none" stroke="${strandColour}" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>`);
      }
    }
    parts.push(`<g${hairLiftAttr}>${hairParts.join('')}</g>`);
  }

  // Face. The expression is read off the character, not chosen.
  const eyeY = headTop + 30;
  const eyeGap = fem ? 14 : 15;
  parts.push(eyeShape(a.eyeShape || 'sharp', cx - eyeGap, eyeY, finalEyeColour, mood, -1));
  parts.push(eyeShape(a.eyeShape || 'sharp', cx + eyeGap, eyeY, finalEyeColour, mood, 1));
  if (fem && grown) {
    // Lashes at the outer corner, which is most of the visual difference at
    // this scale without leaning on anything sillier.
    parts.push(`<path d="M${cx - eyeGap - 9} ${eyeY - 3} l-5 -3 M${cx + eyeGap + 9} ${eyeY - 3} l5 -3" stroke="rgba(0,0,0,.5)" stroke-width="2" stroke-linecap="round"/>`);
  }
  // A shade off the hair, so the brows do not merge into the hairline.
  const browColour = hasHair ? shade(finalHair, -0.25) : 'rgba(0,0,0,.32)';
  parts.push(faceExpression(mood, cx, eyeY, headTop + 52, browColour));

  if (grime >= 2) {
    // Not washed, not rested. Shadows under the eyes read as a body running
    // on nothing, rather than another dark patch glued onto the clothes.
    for (const side of [-1, 1]) {
      parts.push(`<ellipse cx="${cx + side * eyeGap}" cy="${eyeY + 7}" rx="7" ry="3.2"
        fill="${shade(skin, -0.28)}" opacity="${grime === 2 ? 0.35 : 0.5}"/>`);
    }
  }

  drawMarks(parts, character, { cx, headTop, headH, headR, chin, eyeY, eyeColour: finalEyeColour, skin, shoulderWidth, H });
  drawAccessories(parts, character, {
    cx, headTop, headH, headR, chin, eyeY, skin, shoulderWidth, H,
    hasHair, hairColour: finalHair, outfit, stage,
  });

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" role="img" aria-label="Character portrait" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}

const SCAR = 'rgba(60,20,20,.55)';
const INK = 'rgba(20,20,40,.55)';
const METAL = '#9aa3b2';

function drawMarks(parts, character, g) {
  const { cx, headTop, headH, headR, chin, eyeY, eyeColour, shoulderWidth, H } = g;
  const marks = allMarks(character);
  for (const m of marks) {
    switch (m) {
      case 'scar_cheek':
        parts.push(`<path d="M${cx + 10} ${headTop + 14} l7 30" stroke="${SCAR}" stroke-width="2.6" stroke-linecap="round"/>`);
        break;
      case 'scar_eye':
        parts.push(`<path d="M${cx - 21} ${eyeY - 16} l12 34" stroke="${SCAR}" stroke-width="2.6" stroke-linecap="round"/>`);
        break;
      case 'scar_brow':
        parts.push(`<path d="M${cx + 13} ${eyeY - 18} l3 10" stroke="${SCAR}" stroke-width="2.8" stroke-linecap="round"/>`);
        break;
      case 'scar_chest':
        parts.push(`<path d="M${cx - 18} ${chin + 30} l36 26" stroke="${SCAR}" stroke-width="3" stroke-linecap="round"/>`);
        break;
      case 'scar_arm':
        parts.push(`<path d="M${cx + shoulderWidth - 12} ${chin + 44} l4 40" stroke="${SCAR}" stroke-width="2.6" stroke-linecap="round"/>`);
        break;
      case 'burn_arm':
        for (let i = 0; i < 4; i++) {
          parts.push(`<ellipse cx="${cx - shoulderWidth + 12 + (i % 2) * 6}" cy="${chin + 50 + i * 12}" rx="5" ry="3.5" fill="rgba(120,40,30,.4)"/>`);
        }
        break;
      case 'burn_face':
        parts.push(`<path d="M${cx - headR + 6} ${headTop + headH - 6} q10 12 26 10" stroke="rgba(120,40,30,.45)" stroke-width="7" stroke-linecap="round" fill="none"/>`);
        break;
      case 'missing_eye':
        // The eye itself is gone; the patch (or the mechanical eye) is drawn
        // over it by the accessory pass.
        parts.push(`<path d="M${cx + 8} ${eyeY} q7 -3 14 0" stroke="rgba(0,0,0,.45)" stroke-width="2.4" fill="none"/>`);
        break;
      case 'missing_ear':
        parts.push(`<path d="M${cx + headR - 4} ${headTop + 26} l4 12" stroke="${SCAR}" stroke-width="3" stroke-linecap="round"/>`);
        break;
      case 'missing_arm':
        parts.push(`<path d="M${cx - shoulderWidth - 2} ${chin + 40} L${cx - shoulderWidth + 14} ${chin + 40} L${cx - shoulderWidth + 10} ${H} L${cx - shoulderWidth - 6} ${H} Z" fill="var(--ground)"/>`);
        parts.push(`<path d="M${cx - shoulderWidth} ${chin + 42} q8 -6 14 0" stroke="${SCAR}" stroke-width="3" fill="none"/>`);
        break;
      case 'missing_leg':
        // Taken below the knee. The stump ends where the leg used to carry on.
        parts.push(`<rect x="${cx + 2}" y="${chin + 96}" width="14" height="${Math.max(0, H - (chin + 96))}" fill="var(--ground)"/>`);
        parts.push(`<path d="M${cx + 3} ${chin + 96} q7 5 13 0" stroke="${SCAR}" stroke-width="3" fill="none"/>`);
        break;
      case 'cyber_leg':
        parts.push(`<rect x="${cx + 3}" y="${chin + 96}" width="12" height="${Math.max(0, H - (chin + 98))}" rx="4" fill="${METAL}"/>`);
        parts.push(`<rect x="${cx + 4}" y="${chin + 112}" width="10" height="3" fill="rgba(0,0,0,.35)"/>`);
        break;
      case 'cyber_eye':
        parts.push(`<circle cx="${cx + 15}" cy="${eyeY}" r="7" fill="${METAL}"/>`);
        parts.push(`<circle cx="${cx + 15}" cy="${eyeY}" r="3" fill="#d1322a"/>`);
        break;
      case 'cyber_arm':
        parts.push(`<path d="M${cx + shoulderWidth - 20} ${chin + 40} L${cx + shoulderWidth + 2} ${chin + 36} L${cx + shoulderWidth} ${H} L${cx + shoulderWidth - 18} ${H} Z" fill="${METAL}"/>`);
        parts.push(`<path d="M${cx + shoulderWidth - 16} ${chin + 60} h14 M${cx + shoulderWidth - 15} ${chin + 80} h14" stroke="#5e6673" stroke-width="2"/>`);
        break;
      case 'dots':
        for (let i = 0; i < 3; i++) parts.push(`<circle cx="${cx - 10 + i * 10}" cy="${headTop + 8}" r="2.2" fill="rgba(0,0,0,.4)"/>`);
        break;
      case 'thirdeye':
        parts.push(eyeShape('round', cx, headTop + 12, eyeColour));
        break;
      case 'tattoo_face':
        parts.push(`<path d="M${cx - headR + 8} ${eyeY + 6} q6 10 0 20 M${cx - headR + 12} ${eyeY + 2} q10 14 2 28" stroke="${INK}" stroke-width="2" fill="none"/>`);
        break;
      case 'tattoo_arm':
        parts.push(`<path d="M${cx + shoulderWidth - 16} ${chin + 46} q10 8 0 18 q-10 8 0 18 q10 8 0 18" stroke="${INK}" stroke-width="2.4" fill="none"/>`);
        break;
      case 'crack_tooth':
        parts.push(`<path d="M${cx - 2} ${headTop + 53} l1 4" stroke="rgba(255,255,255,.8)" stroke-width="2"/>`);
        break;
      case 'birthmark':
        parts.push(`<ellipse cx="${cx - 12}" cy="${headTop + 46}" rx="4" ry="3" fill="rgba(90,40,30,.45)"/>`);
        break;
      case 'custom':
        // Something the player described; we cannot draw it faithfully, so it
        // is a mark, placed where a mark would be.
        parts.push(`<path d="M${cx - 6} ${chin + 34} l12 14 M${cx + 6} ${chin + 34} l-12 14" stroke="${SCAR}" stroke-width="2.4" stroke-linecap="round"/>`);
        break;
      default:
        break;
    }
  }
}

function drawAccessories(parts, character, g) {
  const { cx, headTop, headH, headR, chin, eyeY, shoulderWidth, H, hairColour, outfit } = g;
  const worn = wornAccessories(character);
  const trim = (outfit && outfit.trim) || '#c9a227';
  for (const acc of worn) {
    switch (acc) {
      case 'headband':
        parts.push(`<path d="M${cx - headR + 2} ${headTop + 6} Q${cx} ${headTop - 2} ${cx + headR - 2} ${headTop + 6}" stroke="#c0392b" stroke-width="7" fill="none"/>`);
        break;
      case 'bandana':
        parts.push(`<path d="M${cx - headR} ${headTop + 8} Q${cx} ${headTop - 20} ${cx + headR} ${headTop + 8} Q${cx} ${headTop + 2} ${cx - headR} ${headTop + 8} Z" fill="#2f5bb7"/>`);
        parts.push(`<path d="M${cx + headR - 4} ${headTop + 8} l16 14 l-6 -14" fill="#2f5bb7"/>`);
        break;
      case 'turban':
        parts.push(`<ellipse cx="${cx}" cy="${headTop - 2}" rx="${headR + 4}" ry="20" fill="#e8e2d6"/>`);
        parts.push(`<path d="M${cx - headR} ${headTop + 2} Q${cx} ${headTop - 18} ${cx + headR} ${headTop + 2}" stroke="#d8cdb9" stroke-width="3" fill="none"/>`);
        break;
      case 'hat':
        parts.push(`<ellipse cx="${cx}" cy="${headTop + 2}" rx="${headR + 26}" ry="8" fill="#3c3229"/>`);
        parts.push(`<path d="M${cx - headR + 4} ${headTop + 2} Q${cx} ${headTop - 34} ${cx + headR - 4} ${headTop + 2} Z" fill="#4a3d32"/>`);
        break;
      case 'glasses':
        parts.push(`<circle cx="${cx - 15}" cy="${eyeY}" r="9" stroke="#2a2a30" stroke-width="2" fill="none"/>`);
        parts.push(`<circle cx="${cx + 15}" cy="${eyeY}" r="9" stroke="#2a2a30" stroke-width="2" fill="none"/>`);
        parts.push(`<path d="M${cx - 6} ${eyeY} h12" stroke="#2a2a30" stroke-width="2"/>`);
        break;
      case 'sunglasses':
        parts.push(`<rect x="${cx - 25}" y="${eyeY - 7}" width="20" height="13" rx="4" fill="#1a1620"/>`);
        parts.push(`<rect x="${cx + 5}" y="${eyeY - 7}" width="20" height="13" rx="4" fill="#1a1620"/>`);
        parts.push(`<path d="M${cx - 5} ${eyeY - 2} h10" stroke="#1a1620" stroke-width="2"/>`);
        break;
      case 'eyepatch':
        parts.push(`<path d="M${cx + 6} ${eyeY - 9} h18 v16 h-18 Z" fill="#1a1620"/>`);
        parts.push(`<path d="M${cx - headR} ${headTop + 22} L${cx + 24} ${eyeY - 8} M${cx + 24} ${eyeY - 8} L${cx + headR} ${headTop + 16}" stroke="#1a1620" stroke-width="2" fill="none"/>`);
        break;
      case 'scouter':
        parts.push(`<path d="M${cx + headR - 2} ${headTop + 30} l-6 -14 l-26 4" stroke="#3a3a44" stroke-width="3" fill="none"/>`);
        parts.push(`<rect x="${cx + 4}" y="${eyeY - 9}" width="20" height="15" rx="3" fill="#3fd6a4" opacity="0.8"/>`);
        break;
      case 'missing_leg':
        // Taken below the knee. The stump ends where the leg used to carry on.
        parts.push(`<rect x="${cx + 2}" y="${chin + 96}" width="14" height="${Math.max(0, H - (chin + 96))}" fill="var(--ground)"/>`);
        parts.push(`<path d="M${cx + 3} ${chin + 96} q7 5 13 0" stroke="${SCAR}" stroke-width="3" fill="none"/>`);
        break;
      case 'cyber_leg':
        parts.push(`<rect x="${cx + 3}" y="${chin + 96}" width="12" height="${Math.max(0, H - (chin + 98))}" rx="4" fill="${METAL}"/>`);
        parts.push(`<rect x="${cx + 4}" y="${chin + 112}" width="10" height="3" fill="rgba(0,0,0,.35)"/>`);
        break;
      case 'cyber_eye':
        break;
      case 'earring':
        parts.push(`<circle cx="${cx + headR + 1}" cy="${headTop + 41}" r="3" fill="${trim}"/>`);
        break;
      case 'earrings':
        parts.push(`<circle cx="${cx + headR + 1}" cy="${headTop + 41}" r="3" fill="${trim}"/>`);
        parts.push(`<circle cx="${cx - headR - 1}" cy="${headTop + 41}" r="3" fill="${trim}"/>`);
        break;
      case 'potara':
        parts.push(`<circle cx="${cx + headR + 2}" cy="${headTop + 42}" r="5" fill="#3fa46a"/>`);
        parts.push(`<circle cx="${cx - headR - 2}" cy="${headTop + 42}" r="5" fill="#3fa46a"/>`);
        break;
      case 'necklace':
        parts.push(`<path d="M${cx - 16} ${chin + 12} Q${cx} ${chin + 34} ${cx + 16} ${chin + 12}" stroke="${trim}" stroke-width="2.4" fill="none"/>`);
        parts.push(`<circle cx="${cx}" cy="${chin + 33}" r="3.5" fill="${trim}"/>`);
        break;
      case 'scarf':
        parts.push(`<path d="M${cx - 20} ${chin + 6} Q${cx} ${chin + 22} ${cx + 20} ${chin + 6} L${cx + 22} ${chin + 18} Q${cx} ${chin + 34} ${cx - 22} ${chin + 18} Z" fill="#c0392b"/>`);
        parts.push(`<path d="M${cx + 8} ${chin + 24} l6 40 l10 -4 l-8 -38 Z" fill="#c0392b"/>`);
        break;
      case 'wristbands':
        parts.push(`<rect x="${cx - shoulderWidth - 2}" y="${H - 34}" width="18" height="10" rx="2" fill="#2f5bb7"/>`);
        parts.push(`<rect x="${cx + shoulderWidth - 16}" y="${H - 34}" width="18" height="10" rx="2" fill="#2f5bb7"/>`);
        break;
      case 'cape':
        parts.push(`<path d="M${cx - shoulderWidth + 2} ${chin + 24} L${cx - shoulderWidth - 14} ${H} L${cx - shoulderWidth + 8} ${H} Z" fill="#e8e2d6" opacity="0.95"/>`);
        parts.push(`<path d="M${cx + shoulderWidth - 2} ${chin + 24} L${cx + shoulderWidth + 14} ${H} L${cx + shoulderWidth - 8} ${H} Z" fill="#e8e2d6" opacity="0.95"/>`);
        parts.push(`<path d="M${cx - shoulderWidth + 4} ${chin + 26} q${shoulderWidth - 4} -14 ${shoulderWidth * 2 - 8} 0" stroke="#e8e2d6" stroke-width="7" fill="none"/>`);
        break;
      case 'belt':
        parts.push(`<rect x="${cx - 30}" y="${H - 22}" width="60" height="14" rx="3" fill="#3a2a10"/>`);
        parts.push(`<rect x="${cx - 14}" y="${H - 24}" width="28" height="18" rx="4" fill="#f5c451"/>`);
        break;
      case 'shell':
        parts.push(`<path d="M${cx - shoulderWidth - 8} ${chin + 40} q${shoulderWidth + 8} -18 ${(shoulderWidth + 8) * 2} 0 L${cx + shoulderWidth + 4} ${chin + 60} L${cx - shoulderWidth - 4} ${chin + 60} Z" fill="#6b5a3a" opacity="0.9"/>`);
        parts.push(`<path d="M${cx - shoulderWidth + 6} ${chin + 30} L${cx + shoulderWidth - 6} ${chin + 30}" stroke="#6b5a3a" stroke-width="5"/>`);
        break;
      case 'sword': {
        // A hilt over the shoulder is all you see of a sheathed sword from the
        // front. Drawing the whole blade put a plank across the chest.
        const sx = cx + shoulderWidth - 12;
        const sy = chin + 20;
        parts.push(`<path d="M${sx} ${sy} l6 ${-26 * g.stage.body - 8}" stroke="#4a3d32" stroke-width="${4 * g.stage.body + 1.5}" stroke-linecap="round"/>`);
        parts.push(`<path d="M${sx + 1} ${sy - 22 * g.stage.body - 8} l10 -3" stroke="#c9a227" stroke-width="3" stroke-linecap="round"/>`);
        break;
      }
      case 'pole':
        parts.push(`<path d="M${cx + shoulderWidth - 4} ${chin + 6} L${cx + shoulderWidth + 4} ${H}" stroke="#c0392b" stroke-width="${4 * g.stage.body + 1.5}" stroke-linecap="round"/>`);
        break;
      case 'halo':
        parts.push(`<ellipse cx="${cx}" cy="${headTop - 30}" rx="24" ry="6" stroke="#f5c451" stroke-width="4" fill="none" opacity="0.95"/>`);
        break;
      case 'custom': {
        // A described accessory gets a small, neutral badge at the collar so it
        // is at least visibly there.
        parts.push(`<rect x="${cx + 18}" y="${chin + 14}" width="10" height="10" rx="2" fill="${trim}"/>`);
        break;
      }
      default:
        break;
    }
  }
}

/** Sensible defaults for a species, used when randomising. */
export function defaultAppearance(rng, raceId) {
  const skinByRace = {
    namekian: 'green', majin: 'pink', frostdemon: 'white', shinjin: 'purple',
    bioandroid: 'green', android: 'light', tuffle: 'grey',
  };
  const outfitByRace = {
    saiyan: 'armour_saiyan', halfsaiyan: 'gi_orange', namekian: 'namek_robe',
    frostdemon: 'armour_frieza', android: 'casual', bioandroid: 'none',
    shinjin: 'kai', majin: 'none', tuffle: 'lab', yardratian: 'namek_robe',
    cerealian: 'coat', earthling: 'gi_orange',
  };
  // Saiyans are black-haired; Namekians have none. A species that has a colour
  // gets it, and everybody else gets the full spread.
  const hairByRace = {
    saiyan: ['black', 'black', 'black', 'darkbrown'],
    halfsaiyan: ['black', 'black', 'darkbrown', 'lavender'],
    frostdemon: ['white'], majin: ['pink'], namekian: ['black'], bioandroid: ['black'],
    shinjin: ['white', 'silver'], tuffle: ['brown', 'darkbrown'],
    yardratian: ['white', 'silver', 'black'], cerealian: ['white', 'silver', 'brown'],
    android: ['black', 'blonde', 'darkbrown', 'brown', 'white'],
  };
  const palette = hairByRace[raceId] || HAIR_COLOURS.map((h) => h.id);
  return {
    hairStyle: rng.pick(HAIR_STYLES).id,
    hairColour: rng.pick(palette),
    eyeShape: rng.pick(EYE_SHAPES).id,
    eyeColour: rng.pick(EYE_COLOURS).id,
    skin: skinByRace[raceId] || rng.pick(SKIN_TONES.slice(0, 5)).id,
    face: rng.pick(FACE_SHAPES).id,
    outfit: outfitByRace[raceId] || 'casual',
    marks: rng.chance(0.4) ? [rng.pick(['scar_cheek', 'scar_brow', 'dots', 'thirdeye', 'birthmark', 'tattoo_arm', 'scar_chest'])] : [],
    customMark: '',
    accessories: rng.chance(0.35) ? [rng.pick(ACCESSORY_PRESETS.filter((x) => x.starter && x.id !== 'custom')).id] : [],
    customAccessory: '',
    buildShape: 'balanced',
    heightCm: rng.int(150, 200),
    weightKg: rng.int(48, 110),
    // Rolled independently of build, so a narrow frame and a heavy one can
    // each land anywhere on this - a wide chest over a slim waist is a real
    // body, not a contradiction.
    bust: Math.round(rng.gauss(1, 0.28, 0.55, 1.75) * 100) / 100,
    stance: rng.pick(STANCES).id,
    stanceName: '',
  };
}
