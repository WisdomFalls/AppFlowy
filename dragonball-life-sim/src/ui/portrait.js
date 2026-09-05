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

  if (a.marking === 'scar') {
    parts.push(`<path d="M${cx + 10} ${headTop + 12} l6 30" stroke="rgba(0,0,0,.35)" stroke-width="2.5" stroke-linecap="round"/>`);
  } else if (a.marking === 'dots') {
    for (let i = 0; i < 3; i++) {
      parts.push(`<circle cx="${cx - 10 + i * 10}" cy="${headTop + 8}" r="2.2" fill="rgba(0,0,0,.4)"/>`);
    }
  } else if (a.marking === 'thirdeye') {
    parts.push(eyeShape('round', cx, headTop + 12, eyeColour));
  }

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" role="img" aria-label="Character portrait" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
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
    marking: rng.pick(['none', 'none', 'scar', 'dots', 'thirdeye']),
    buildShape: 'balanced',
    heightCm: rng.int(150, 200),
    weightKg: rng.int(48, 110),
    stance: rng.pick(STANCES).id,
    stanceName: '',
  };
}
