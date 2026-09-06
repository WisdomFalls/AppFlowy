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
  // t: 0 at the left temple, 1 at the right.
  const angle = Math.PI * (1 - t);
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
 * What the face is doing, read off the live character rather than chosen.
 * Health first, because a body at ten per cent does not smirk.
 */
export function expressionFor(character, opts = {}) {
  if (opts.expression) return opts.expression;
  const v = character.vitals || {};
  const f = character.flags || {};
  if (opts.form) return 'rage';
  if (v.health !== undefined && v.health < 25) return 'tired';
  if (f.fury || f.humiliated) return 'rage';
  if (f.brink_of_death) return 'shock';
  if (v.happiness !== undefined && v.happiness < 25) return 'sad';
  if (v.happiness !== undefined && v.happiness > 82) return 'grin';
  if ((character.karma || 0) < -40) return 'smug';
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
 * Build the portrait. `character` is the live character object; `opts.form`
 * adds the aura and hair changes of an active transformation.
 */
export function portraitSvg(character, opts = {}) {
  const a = character.appearance || {};
  const skin = look(SKIN_TONES, a.skin, 'light').hex;
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

  const goldHair = opts.form && /Super Saiyan|Golden/.test(opts.form.name);
  const finalHair = goldHair ? '#f2cf4a' : hairColour;
  const auraColour = !opts.form ? null
    : /Blue/.test(opts.form.name) ? '#4fa8ff'
      : /God|Ultra Ego/.test(opts.form.name) ? '#ff5f7a'
        : /Ultra Instinct|Mastered/.test(opts.form.name) ? '#dfe7ef'
          : goldHair ? '#ffd24a' : '#b98cff';

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

  // Saiyan tail, behind the body and sized to it.
  if (character.tail) {
    const reach = 34 * stage.body + 8;
    parts.push(`<path d="M${cx + shoulderWidth - 6} ${H - 10} C${cx + shoulderWidth + reach} ${H - 60 * stage.body - 10}
      ${cx + shoulderWidth + reach * 0.3} ${chin + 30} ${cx + shoulderWidth - 14} ${chin + 34}"
      fill="none" stroke="#7a4a24" stroke-width="${6 * stage.body + 3}" stroke-linecap="round"/>`);
  }

  // Hair that hangs down goes behind everything else.
  const hasHair = !['namekian', 'frostdemon', 'majin', 'bioandroid'].includes(race)
    && style !== 'bald' && stage.hair > 0.4;
  if (hasHair) {
    const back = hairBackPath(style, headTop, cx, headR, headH);
    if (back) parts.push(`<path d="${back.replace(/\s+/g, ' ')}" fill="${finalHair}" opacity="0.92"/>`);
  }

  // Torso and clothing.
  const waistY = chin + 74;
  parts.push(`<path d="M${cx - hip} ${H}
    C${cx - hip} ${H - 30} ${cx - waist} ${waistY + 14} ${cx - waist} ${waistY}
    C${cx - waist} ${waistY - 22} ${cx - shoulderWidth} ${chin + 44} ${cx - shoulderWidth + 6} ${chin + 26}
    Q${cx} ${chin + 2} ${cx + shoulderWidth - 6} ${chin + 26}
    C${cx + shoulderWidth} ${chin + 44} ${cx + waist} ${waistY - 22} ${cx + waist} ${waistY}
    C${cx + waist} ${waistY + 14} ${cx + hip} ${H - 30} ${cx + hip} ${H} Z"
    fill="${outfit.main || skin}"/>`);
  if (fem && stage.id !== 'teen') {
    // A chest, shaped by build rather than uniform.
    const bust = { small: 7, wiry: 8, lean: 9, balanced: 11, stocky: 13, massive: 14 }[build] || 11;
    const by = chin + 40;
    parts.push(`<path d="M${cx - shoulderWidth + 12} ${by - 6}
      q${bust} ${bust + 4} ${bust * 2} 0 M${cx + shoulderWidth - 12} ${by - 6}
      q${-bust} ${bust + 4} ${-bust * 2} 0"
      fill="none" stroke="${shade(outfit.main || skin, -0.22)}" stroke-width="2.2" stroke-linecap="round"/>`);
  }
  if (outfit.main) {
    parts.push(`<path d="M${cx - 16} ${chin + 14} L${cx} ${chin + 44} L${cx + 16} ${chin + 14}
      L${cx + 26} ${chin + 22} L${cx} ${H} L${cx - 26} ${chin + 22} Z" fill="${outfit.trim}" opacity="0.9"/>`);
    if (outfit.id.startsWith('armour')) {
      parts.push(`<path d="M${cx - shoulderWidth + 2} ${chin + 34} q${shoulderWidth} -22 ${shoulderWidth * 2 - 4} 0"
        fill="none" stroke="${outfit.trim}" stroke-width="6"/>`);
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
    parts.push(`<path d="M${cx - headR + 6} ${headTop + 6} l-20 -14 l6 20 Z" fill="#c8b8d8"/>`);
    parts.push(`<path d="M${cx + headR - 6} ${headTop + 6} l20 -14 l-6 20 Z" fill="#c8b8d8"/>`);
    parts.push(`<ellipse cx="${cx}" cy="${headTop + 4}" rx="${headR - 8}" ry="14" fill="#b7a6cc" opacity="0.85"/>`);
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
    const d = hairPath(style, headTop, cx, headR, headH);
    if (d) {
      parts.push(`<path d="${d.replace(/\s+/g, ' ')}" fill="${finalHair}" stroke="${shade(finalHair, 0.22)}" stroke-width="1"/>`);
    }
  }

  // Face. The expression is read off the character, not chosen.
  const eyeY = headTop + 30;
  const eyeGap = fem ? 14 : 15;
  parts.push(eyeShape(a.eyeShape || 'sharp', cx - eyeGap, eyeY, eyeColour, mood, -1));
  parts.push(eyeShape(a.eyeShape || 'sharp', cx + eyeGap, eyeY, eyeColour, mood, 1));
  if (fem && grown) {
    // Lashes at the outer corner, which is most of the visual difference at
    // this scale without leaning on anything sillier.
    parts.push(`<path d="M${cx - eyeGap - 9} ${eyeY - 3} l-5 -3 M${cx + eyeGap + 9} ${eyeY - 3} l5 -3" stroke="rgba(0,0,0,.5)" stroke-width="2" stroke-linecap="round"/>`);
  }
  // A shade off the hair, so the brows do not merge into the hairline.
  const browColour = hasHair ? shade(finalHair, -0.25) : 'rgba(0,0,0,.32)';
  parts.push(faceExpression(mood, cx, eyeY, headTop + 52, browColour));

  drawMarks(parts, character, { cx, headTop, headH, headR, chin, eyeY, eyeColour, skin, shoulderWidth, H });
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
    stance: rng.pick(STANCES).id,
    stanceName: '',
  };
}
