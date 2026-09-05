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
  { id: 'cyber_arm', name: 'Mechanical arm', where: 'body' },
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

function look(list, id, fallback) {
  return list.find((x) => x.id === id) || list.find((x) => x.id === fallback) || list[0];
}

/**
 * Hair comes in two layers: anything that hangs down (a braid, a ponytail,
 * long hair) is drawn behind the head, and the cap and fringe are drawn over
 * it. Drawing them together is what puts a plait down somebody's face.
 */
function hairBackPath(style, headTop, cx, headR) {
  const crown = headTop - 12;
  const brow = headTop + 16;
  const L = cx - headR - 2;
  const R = cx + headR + 2;
  switch (style) {
    case 'long':
      return `M${L - 2} ${brow} Q${cx} ${crown - 6} ${R + 2} ${brow}
        L${R + 8} ${brow + 112} L${R - 12} ${brow + 106}
        L${R - 12} ${brow + 30} L${L + 12} ${brow + 30}
        L${L + 12} ${brow + 106} L${L - 8} ${brow + 112} Z`;
    case 'ponytail':
      return `M${R - 10} ${brow - 6} L${R + 14} ${brow + 6} L${R + 22} ${brow + 70}
        L${R + 4} ${brow + 72} L${R - 8} ${brow + 14} Z`;
    case 'braid':
      return `M${cx - 8} ${brow + 4} L${cx + 8} ${brow + 4}
        L${cx + 6} ${brow + 104} L${cx - 6} ${brow + 104} Z`;
    default:
      return '';
  }
}

function hairPath(style, headTop, cx, headR) {
  const crown = headTop - 12;          // top of the skull
  const L = cx - headR - 2;            // just outside the left temple
  const R = cx + headR + 2;
  const brow = headTop + 16;           // where the hairline meets the face
  // A filled dome: up over the crown, then back along the hairline.
  const cap = `M${L} ${brow + 2} Q${cx} ${crown - 14} ${R} ${brow + 2}
    Q${cx} ${brow + 12} ${L} ${brow + 2} Z`;

  switch (style) {
    case 'spiked':
      return `M${L} ${brow + 8}
        L${L - 6} ${crown - 26} L${cx - headR * 0.55} ${crown - 4}
        L${cx - headR * 0.3} ${crown - 40} L${cx - 4} ${crown - 6}
        L${cx + headR * 0.15} ${crown - 44} L${cx + headR * 0.45} ${crown - 6}
        L${cx + headR * 0.7} ${crown - 30} L${R + 6} ${crown - 4}
        L${R} ${brow + 8}
        Q${cx} ${brow + 16} ${L} ${brow + 8} Z`;
    case 'wild':
      return `M${L} ${brow + 10}
        C${L - 12} ${crown - 8} ${cx - headR * 0.6} ${crown - 26} ${cx - headR * 0.5} ${crown - 2}
        C${cx - headR * 0.3} ${crown - 32} ${cx - 2} ${crown - 30} ${cx - 2} ${crown - 2}
        C${cx + headR * 0.25} ${crown - 28} ${cx + headR * 0.7} ${crown - 22} ${cx + headR * 0.55} ${crown}
        C${R + 8} ${crown - 12} ${R + 14} ${crown + 16} ${R} ${brow + 10}
        Q${cx} ${brow + 18} ${L} ${brow + 10} Z`;
    case 'long':
    case 'ponytail':
    case 'braid':
      return cap;
    case 'bob':
      return `M${L - 4} ${brow + 44} Q${L - 6} ${crown - 14} ${cx} ${crown - 16}
        Q${R + 6} ${crown - 14} ${R + 4} ${brow + 44}
        L${R - 8} ${brow + 40} Q${R - 10} ${brow + 6} ${cx} ${brow + 4}
        Q${L + 10} ${brow + 6} ${L + 8} ${brow + 40} Z`;
    case 'cropped':
      return `M${L} ${brow - 2} Q${cx} ${crown - 8} ${R} ${brow - 2}
        Q${cx} ${brow + 8} ${L} ${brow - 2} Z`;
    case 'mohawk':
      return `M${cx - 10} ${brow} C${cx - 13} ${crown - 34} ${cx + 13} ${crown - 34} ${cx + 10} ${brow}
        Q${cx} ${brow + 8} ${cx - 10} ${brow} Z`;
    case 'topknot':
      return `${cap}
        M${cx - 12} ${crown - 2} C${cx - 14} ${crown - 26} ${cx + 14} ${crown - 26} ${cx + 12} ${crown - 2} Z`;
    default:
      return '';
  }
}

function eyeShape(shape, x, y, colour) {
  switch (shape) {
    case 'narrow':
      return `<rect x="${x - 9}" y="${y - 2}" width="18" height="5" rx="2.5" fill="${colour}"/>`;
    case 'round':
      return `<circle cx="${x}" cy="${y}" r="6" fill="${colour}"/>`;
    case 'wide':
      return `<ellipse cx="${x}" cy="${y}" rx="8.5" ry="7" fill="${colour}"/>`;
    case 'heavy':
      return `<path d="M${x - 9} ${y} q9 -8 18 0 q-9 6 -18 0 Z" fill="${colour}"/>`;
    default: // sharp
      return `<path d="M${x - 10} ${y + 3} L${x + 10} ${y - 4} L${x + 9} ${y + 3} Z" fill="${colour}"/>`;
  }
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

  const W = 220;
  const H = 260;
  const cx = W / 2;
  const headTop = 44;
  const headR = face === 'round' ? 40 : face === 'long' ? 36 : 38;
  const headH = face === 'long' ? 52 : face === 'round' ? 42 : 46;
  const chin = headTop + headH + 18;

  const shoulderWidth = { small: 44, wiry: 50, lean: 56, balanced: 62, stocky: 70, massive: 80 }[build] || 62;
  const neckWidth = { small: 11, wiry: 12, lean: 13, balanced: 15, stocky: 18, massive: 21 }[build] || 15;

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

  // Saiyan tail, behind the body.
  if (character.tail) {
    parts.push(`<path d="M${cx + shoulderWidth - 6} ${H - 10} C${cx + shoulderWidth + 34} ${H - 60}
      ${cx + shoulderWidth + 10} ${H - 108} ${cx + shoulderWidth - 16} ${H - 96}"
      fill="none" stroke="#7a4a24" stroke-width="9" stroke-linecap="round"/>`);
  }

  // Hair that hangs down goes behind everything else.
  const hasHair = !['namekian', 'frostdemon', 'majin', 'bioandroid'].includes(race) && style !== 'bald';
  if (hasHair) {
    const back = hairBackPath(style, headTop, cx, headR);
    if (back) parts.push(`<path d="${back.replace(/\s+/g, ' ')}" fill="${finalHair}" opacity="0.92"/>`);
  }

  // Torso and clothing.
  parts.push(`<path d="M${cx - shoulderWidth} ${H} L${cx - shoulderWidth + 6} ${chin + 26}
    Q${cx} ${chin + 2} ${cx + shoulderWidth - 6} ${chin + 26} L${cx + shoulderWidth} ${H} Z"
    fill="${outfit.main || skin}"/>`);
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
    L${cx + headR - 4} ${headTop + headH}
    Q${cx} ${chin + 6} ${cx - headR + 4} ${headTop + headH} Z" fill="${skin}"/>`);

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
    const d = hairPath(style, headTop, cx, headR);
    if (d) parts.push(`<path d="${d.replace(/\s+/g, ' ')}" fill="${finalHair}"/>`);
  }

  // Face.
  const eyeY = headTop + 30;
  parts.push(eyeShape(a.eyeShape || 'sharp', cx - 15, eyeY, eyeColour));
  parts.push(eyeShape(a.eyeShape || 'sharp', cx + 15, eyeY, eyeColour));
  const browColour = hasHair ? finalHair : 'rgba(0,0,0,.32)';
  parts.push(`<path d="M${cx - 20} ${eyeY - 11} l14 -4" stroke="${browColour}" stroke-width="3.5" stroke-linecap="round"/>`);
  parts.push(`<path d="M${cx + 20} ${eyeY - 11} l-14 -4" stroke="${browColour}" stroke-width="3.5" stroke-linecap="round"/>`);
  parts.push(`<path d="M${cx - 7} ${headTop + 52} q7 5 14 0" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="2.4" stroke-linecap="round"/>`);

  drawMarks(parts, character, { cx, headTop, headH, headR, chin, eyeY, eyeColour, skin, shoulderWidth, H });
  drawAccessories(parts, character, { cx, headTop, headH, headR, chin, eyeY, skin, shoulderWidth, H, hasHair, hairColour: finalHair, outfit });

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
      case 'sword':
        parts.push(`<path d="M${cx + shoulderWidth - 30} ${chin + 20} l-16 -50" stroke="#5a4a3a" stroke-width="6" stroke-linecap="round"/>`);
        parts.push(`<path d="M${cx + shoulderWidth - 40} ${chin - 20} l-12 -6 M${cx + shoulderWidth - 44} ${chin - 32} l12 -3" stroke="#c9a227" stroke-width="4" stroke-linecap="round"/>`);
        parts.push(`<path d="M${cx - shoulderWidth + 6} ${chin + 26} L${cx + shoulderWidth - 6} ${H - 30}" stroke="#5a4a3a" stroke-width="4"/>`);
        break;
      case 'pole':
        parts.push(`<path d="M${cx - shoulderWidth + 20} ${chin - 40} L${cx + shoulderWidth - 20} ${H}" stroke="#c0392b" stroke-width="5" stroke-linecap="round"/>`);
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
  return {
    hairStyle: rng.pick(HAIR_STYLES).id,
    hairColour: rng.pick(HAIR_COLOURS).id,
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
