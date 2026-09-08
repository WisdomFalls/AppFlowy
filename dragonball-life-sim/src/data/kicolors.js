// The colour a character's own ki actually takes, once they have enough
// control over it to notice. Purely descriptive - a name and a line of
// flavour text, nothing about how it renders. What this looks like on
// screen is separate, later work; this just gives the game's own text
// something specific to say instead of "ki" every time.

export const KI_COLORS = [
  { id: 'white', name: 'white', desc: 'Plain, and plainly enough - most people never get further than this.' },
  { id: 'blue', name: 'blue', desc: 'Cool and steady. The default most fighters settle into.' },
  { id: 'gold', name: 'gold', desc: 'Warm and loud. It gets noticed from a long way off.' },
  { id: 'crimson', name: 'crimson', desc: 'Dark red, closer to a wound than a fire.' },
  { id: 'violet', name: 'violet', desc: 'Somewhere between a bruise and a threat.' },
  { id: 'emerald', name: 'emerald', desc: 'Green, sharp-edged, easy to mistake for something poisonous.' },
  { id: 'silver', name: 'silver', desc: 'Cold and precise, like it was measured before it was let out.' },
  { id: 'magenta', name: 'magenta', desc: 'Bright enough that nobody who has seen it once forgets it.' },
  { id: 'jet', name: 'jet black', desc: 'Wrong to look at directly, and nobody quite says why.' },
  { id: 'amber', name: 'amber', desc: 'The colour of something about to catch.' },
  { id: 'cyan', name: 'cyan', desc: 'Bright and cold, like the inside of a glacier lit from within.' },
  { id: 'rose', name: 'rose', desc: 'Softer than anyone expects, right up until it is not.' },
];

export function getKiColor(id) {
  return KI_COLORS.find((k) => k.id === id) || null;
}
