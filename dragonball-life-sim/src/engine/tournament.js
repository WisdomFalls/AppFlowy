// Tournaments as brackets you actually fight.
//
// The old version rolled a placement and printed it. A tournament is supposed
// to be the one place in this setting where you find out exactly where you sit
// against named people, so it now runs as a real bracket: seeded entrants,
// round by round, your match played on the battle screen and everyone else's
// resolved against them. You can watch the field thin out around you, and the
// people who beat you are people you can go and find afterwards.

import { clamp } from './rng.js';
import { render, numberish, ordinal } from './text.js';
import { combatPower, winChance, powerTier } from './stats.js';
import { CANON, canonAlive, canonPower, getCanon } from '../data/canon.js';
import { generateFullName } from '../data/names.js';
import { getRace } from '../data/races.js';
import { spreadWord, DEED_SCALE } from './settlement.js';
import { universeFighters, multiverseField } from '../data/universes.js';

// ------------------------------------------------------------------ formats

export const FORMATS = {
  wmat: {
    id: 'wmat',
    name: 'World Martial Arts Tournament',
    where: 'papaya',
    size: 8,
    stakes: 'serious',
    rules: {
      ringOut: true,
      noKilling: true,
      note: 'Ring-out or knockout. Killing gets you disqualified and arrested.',
    },
    flavour: 'The ring is stone, the crowd is enormous, and the announcer has been doing this for thirty years.',
    spread: 14,
    // Who turns up to a public martial arts tournament on Earth. Emperors,
    // gods and things that eat planets have better things to do, and the
    // draw reads as nonsense the moment Frieza is in it.
    enters: (ch) => ch.tags.some((t) => ['ally', 'rival', 'mentor', 'human', 'saiyan', 'prodigy', 'crane', 'antihero', 'majin', 'namekian', 'comic'].includes(t))
      && !ch.tags.some((t) => ['divine', 'imperial', 'emperor', 'destroyer', 'angel', 'omniking', 'threat', 'dragon', 'wish', 'judge', 'spirit'].includes(t))
      && (ch.power ? Object.keys(ch.power).length > 1 : true),
  },
  otherworld: {
    id: 'otherworld',
    name: 'Other World Tournament',
    where: 'otherworld_arena',
    size: 8,
    stakes: 'serious',
    rules: {
      ringOut: true,
      noKilling: false,
      note: 'Everybody here is already dead. Ring-out only; you cannot kill a ghost twice.',
    },
    flavour: 'Grand Kai\'s planet, and the best fighters of seven galaxies, all of them past the point of dying.',
    spread: 30,
    // The dead, and only the dead.
    enters: (ch, year) => ch.years[1] !== null && year > ch.years[1]
      && !ch.tags.some((t) => ['destroyer', 'angel', 'omniking', 'dragon', 'wish'].includes(t)),
  },
  cell_games: {
    id: 'cell_games',
    name: 'The Cell Games',
    where: 'wastes',
    size: 4,
    stakes: 'lethal',
    rules: {
      ringOut: false,
      noKilling: false,
      note: 'One at a time, against him, until somebody stops. Nobody agreed to any rules.',
    },
    flavour: 'A ring cut into the plateau and a broadcast going out to a planet that expects to die.',
    spread: 60,
    enters: (ch) => ch.tags.some((t) => ['ally', 'rival', 'hero', 'saiyan', 'threat'].includes(t))
      && !ch.tags.some((t) => ['divine', 'angel', 'omniking', 'dragon'].includes(t)),
  },
  invitational: {
    id: 'invitational',
    name: 'Invitational',
    where: null,
    size: 8,
    stakes: 'serious',
    rules: {
      ringOut: false,
      noKilling: true,
      note: 'Your tournament, your rules.',
    },
    flavour: 'Your name on the poster, which means the result is yours whichever way it goes.',
    spread: 20,
    // Your tournament. Whether the big names come depends on your standing,
    // which the caller decides by passing a filter.
    enters: (ch) => !ch.tags.some((t) => ['destroyer', 'angel', 'omniking', 'dragon', 'wish', 'judge'].includes(t)),
  },
  destroyers: {
    id: 'destroyers',
    name: 'Tournament of Destroyers',
    where: 'tournament_u6',
    size: 6,
    stakes: 'serious',
    spread: 40,
    rules: {
      ringOut: true,
      noKilling: true,
      note: 'Ring-out or knockout. Two gods are in the stands and neither of them is patient.',
    },
    flavour: 'A neutral ring between two universes, with Beerus and Champa arguing over the seating.',
    universe: 6,
    enters: (ch) => ch.tags.some((t) => ['u6', 'rival', 'ally', 'saiyan', 'threat'].includes(t))
      && !ch.tags.some((t) => ['destroyer', 'angel', 'omniking', 'dragon', 'wish', 'judge', 'emperor'].includes(t)),
  },
  top: {
    id: 'top',
    name: 'Tournament of Power',
    where: 'top_arena',
    size: 12,
    stakes: 'serious',
    rules: {
      ringOut: true,
      noKilling: true,
      teams: true,
      note: 'Ring-out only, no killing, no flight, forty-eight minutes. The losing universes are erased.',
    },
    flavour: 'A flat world with no sky, and every fighter from ten universes standing on it at once.',
    spread: 25,
    enters: (ch) => !ch.tags.some((t) => ['destroyer', 'angel', 'omniking', 'dragon', 'wish', 'judge'].includes(t)),
  },
};

// ------------------------------------------------------------------ seeding

const FIGHT_TAGS = ['hero', 'rival', 'antihero', 'villain', 'warrior', 'mentor', 'saiyan', 'threat', 'emperor'];

function canonFighters(state, year, band, format) {
  const out = [];
  const enters = (format && format.enters) || (() => true);
  const wantsDead = format && format.id === 'otherworld';
  for (const ch of CANON) {
    if (canonAlive(ch, year) === wantsDead) continue;
    if (!ch.tags.some((t) => FIGHT_TAGS.includes(t))) continue;
    if (ch.tags.includes('omniking') || ch.tags.includes('destroyer') || ch.tags.includes('angel')) continue;
    if (!enters(ch, year)) continue;
    const npc = state.npcs['canon_' + ch.id];
    if (npc && npc.alive === false) continue;
    const power = Math.max(1, canonPower(ch, wantsDead ? ch.years[1] : year));
    if (power < band.min || power > band.max) continue;
    out.push({
      id: 'canon_' + ch.id,
      canonId: ch.id,
      name: ch.name,
      power,
      raceId: ch.race,
      isCanon: true,
      flavour: ch.quirk || ch.personality || '',
    });
  }
  return out;
}

// Written to follow "They ", so everything here is third-person plural.
const FILLER_QUIRKS = [
  'fight out of a stance nobody teaches any more',
  'have not lost in eleven years and say so before the bell',
  'are here because the prize money is the only way out of a debt',
  'wear the colours of a school that burned down',
  'have an entire village in the stands',
  'refuse to give a name to the officials',
  'are visibly older than everyone else in the draw',
  'trained alone, badly, and got frighteningly good anyway',
  'came second last time and have thought about nothing else since',
  'are not from this planet and have not been asked',
  'have never fought anyone they did not put in hospital',
  'bow to the ring before they bow to you',
];

function filler(rng, power, raceHint) {
  const raceId = raceHint || rng.weighted(
    ['earthling', 'earthling', 'earthling', 'namekian', 'saiyan', 'other', 'android'],
    () => 1,
  );
  return {
    id: 'field_' + Math.floor(rng.next() * 1e9).toString(36),
    canonId: null,
    name: generateFullName(rng, raceId === 'other' ? 'earthling' : raceId),
    power: Math.max(1, Math.round(power)),
    raceId,
    isCanon: false,
    flavour: rng.pick(FILLER_QUIRKS),
  };
}

/**
 * Build a field around the player. Canon fighters in the right band get first
 * call, because being drawn against a name is the point of entering; the rest
 * is filled with people invented for this draw, spread either side of you so
 * the bracket has somebody you should beat and somebody you should not.
 */
export function buildEntrants(state, rng, format, opts = {}) {
  const c = state.character;
  const year = opts.year ?? (c.birthYear + c.age);
  const mine = combatPower(c);
  const size = opts.size || format.size;
  const spread = opts.spread ?? format.spread ?? 20;

  const band = { min: mine / spread, max: mine * spread };
  let pool = opts.canon === false ? [] : canonFighters(state, year, band, format);
  if (opts.canonFilter) pool = pool.filter((e) => opts.canonFilter(e));

  // The other universes send their own people. They are not in the canon file
  // because they only exist for one era, but they are named, and beating one
  // of them is remembered. A player-hosted tournament can reach for this too
  // (opts.universeScope for another world in your own universe, opts.multiversal
  // for a real cross-universe draw) - not just the lore-locked formats.
  const myUniverse = c.universe || 7;
  if (format.universe || format.id === 'top' || opts.multiversal || opts.universeScope) {
    const visitors = (opts.multiversal || format.id === 'top'
      ? multiverseField(year, ['u' + myUniverse])
      : universeFighters('u' + (opts.universeScope || format.universe), year))
      .filter((f) => f.power >= band.min / 3 && f.power <= band.max * 3)
      .map((f) => ({
        id: 'universe_' + f.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        canonId: null,
        name: f.name,
        power: f.power,
        raceId: f.raceId,
        isCanon: true,           // a known name, for the standings tag
        universe: f.universe,
        flavour: f.flavour,
      }));
    // The home crowd gets its share of the draw; the visitors take the rest.
    const visitorShare = (opts.multiversal || format.id === 'top') ? 0.7 : 0.5;
    const visitorSlots = Math.max(1, Math.round((size - 1) * visitorShare));
    pool = pool.slice(0, Math.max(0, size - 1 - visitorSlots))
      .concat(visitors.sort(() => rng.next() - 0.5).slice(0, visitorSlots));
  }
  // Keep the marquee names, not the first eight alphabetically.
  pool = pool.sort(() => rng.next() - 0.5).slice(0, Math.max(0, Math.floor((size - 1) * 0.55)));

  const entrants = pool.slice();
  const spots = size - 1 - entrants.length;
  // Somebody nobody has ever heard of should not out-power Goku in his own
  // era. Invented entrants are capped under the best name in the draw.
  const bestCanon = entrants.reduce((m, e) => Math.max(m, e.power), 0);
  const ceiling = bestCanon ? Math.max(mine * 2.5, bestCanon * 0.92) : mine * spread;
  for (let i = 0; i < spots; i++) {
    // Half the invented field sits below you and half above, on a log spread,
    // so a bracket is never all cannon fodder or all executioners.
    const t = (i + 0.5) / Math.max(1, spots);
    const exponent = (t - 0.5) * 2 * Math.log(spread * 0.5);
    const power = Math.min(ceiling, mine * Math.exp(exponent) * rng.float(0.7, 1.4));
    entrants.push(filler(rng, power, opts.raceHint));
  }

  entrants.push({
    id: 'player',
    canonId: null,
    name: c.name,
    power: mine,
    raceId: c.raceId,
    isCanon: false,
    isPlayer: true,
    flavour: '',
  });

  return entrants;
}

// ------------------------------------------------------------------ bracket

function seedBracket(rng, entrants) {
  // Seed by power the way a real draw does - strongest apart - then shuffle
  // inside the halves so the same field does not produce the same bracket.
  const sorted = entrants.slice().sort((a, b) => b.power - a.power);
  const slots = [];
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    slots.push(sorted[lo++]);
    if (lo <= hi) slots.push(sorted[hi--]);
  }
  const pairs = [];
  for (let i = 0; i < slots.length; i += 2) {
    const a = slots[i];
    const b = slots[i + 1] || null;
    pairs.push(rng.chance(0.5) ? { a, b } : { a: b || a, b: b ? a : null });
  }
  return pairs.map((p, i) => ({ index: i, a: p.a, b: p.b, winner: null, line: '' }));
}

export function createTournament(state, rng, opts = {}) {
  const format = FORMATS[opts.formatId] || FORMATS.wmat;
  const c = state.character;
  const year = opts.year ?? (c.birthYear + c.age);
  const entrants = opts.entrants || buildEntrants(state, rng, format, opts);
  const size = entrants.length;

  const t = {
    formatId: format.id,
    name: opts.name || format.name,
    edition: opts.edition || null,
    year,
    size,
    purse: opts.purse ?? 0,
    stakes: opts.stakes || format.stakes,
    placeId: opts.placeId || format.where || c.placeId,
    rules: { ...format.rules, ...(opts.rules || {}) },
    entrants,
    rounds: [seedBracket(rng, entrants)],
    roundIndex: 0,
    finished: false,
    placement: null,
    eliminatedBy: null,
    beat: [],
    disqualified: false,
    history: [],
  };
  return t;
}

export function roundName(t, roundIndex = t.roundIndex) {
  const left = t.rounds[roundIndex] ? t.rounds[roundIndex].length * 2 : 0;
  if (left <= 2) return 'The final';
  if (left <= 4) return 'The semi-finals';
  if (left <= 8) return 'The quarter-finals';
  return `Round ${roundIndex + 1}`;
}

export function playerMatch(t) {
  const round = t.rounds[t.roundIndex];
  if (!round) return null;
  return round.find((m) => !m.winner && ((m.a && m.a.isPlayer) || (m.b && m.b.isPlayer))) || null;
}

export function playerOpponent(t) {
  const m = playerMatch(t);
  if (!m) return null;
  return m.a && m.a.isPlayer ? m.b : m.a;
}

/** Resolve every match in the current round that is not the player's. */
export function resolveOtherMatches(state, rng, t) {
  const round = t.rounds[t.roundIndex];
  const lines = [];
  for (const m of round) {
    if (m.winner) continue;
    if ((m.a && m.a.isPlayer) || (m.b && m.b.isPlayer)) continue;
    if (!m.b) { m.winner = m.a; m.line = `${m.a.name} has a bye.`; lines.push(m.line); continue; }
    const p = winChance(m.a.power, m.b.power);
    const aWins = rng.chance(p);
    m.winner = aWins ? m.a : m.b;
    const loser = aWins ? m.b : m.a;
    m.line = describeOtherMatch(rng, m.winner, loser, t);
    lines.push(m.line);
    if (t.rules.noKilling !== true && t.stakes === 'lethal' && rng.chance(0.35)) {
      loser.dead = true;
      if (loser.canonId) {
        const npc = state.npcs['canon_' + loser.canonId];
        if (npc) { npc.alive = false; npc.causeOfDeath = `Killed at the ${t.name}`; }
      }
      lines.push(`${loser.name} does not get up.`);
    }
  }
  return lines;
}

function describeOtherMatch(rng, winner, loser, t) {
  const gap = winner.power / Math.max(1, loser.power);
  const shape = gap > 12
    ? `{[w] ends it in one exchange|[l] is out before the crowd has settled|[w] does not appear to try}`
    : gap > 2.5
      ? `{[w] takes [l] apart methodically|[w] wins it comfortably|[l] never finds a way in}`
      : `{[w] beats [l] by about a second|[w] and [l] go the distance and [w] takes it|[l] loses it on a mistake nobody else sees}`;
  const out = render(shape, {}, rng)
    .replace(/\[w\]/g, winner.name)
    .replace(/\[l\]/g, loser.name);
  const ringOut = t.rules.ringOut && rng.chance(0.35) ? ' Ring-out.' : '';
  return out + '.' + ringOut;
}

/** Record the result of the player's match and advance the bracket. */
export function recordPlayerResult(state, rng, t, won, opts = {}) {
  const m = playerMatch(t);
  if (!m) return { finished: t.finished };
  const me = m.a && m.a.isPlayer ? m.a : m.b;
  const foe = m.a && m.a.isPlayer ? m.b : m.a;

  if (!foe) {
    m.winner = me;
  } else if (won) {
    m.winner = me;
    t.beat.push(foe.name);
  } else {
    m.winner = foe;
    t.eliminatedBy = foe.name;
  }
  m.line = foe
    ? (won ? `You beat ${foe.name}.` : `${foe.name} beats you.`)
    : 'You have a bye.';

  if (opts.disqualified) {
    t.disqualified = true;
    m.winner = foe || me;
    t.eliminatedBy = foe ? foe.name : 'the officials';
  }

  return advanceRound(state, rng, t);
}

/** Build the next round from this round's winners, or finish. */
export function advanceRound(state, rng, t) {
  const round = t.rounds[t.roundIndex];
  if (round.some((m) => !m.winner)) return { finished: false, waiting: true };

  t.history.push({
    name: roundName(t),
    lines: round.map((m) => m.line).filter(Boolean),
  });

  const winners = round.map((m) => m.winner).filter(Boolean);
  const stillIn = winners.some((w) => w.isPlayer);

  if (winners.length <= 1) {
    t.finished = true;
    t.placement = stillIn ? 1 : placementFor(t);
    return { finished: true, champion: winners[0] || null };
  }

  if (!stillIn && !t.finished) {
    // You are out. The rest of the draw still happens; you get to watch it,
    // because knowing who won the thing you lost is part of the sting.
    const rest = simulateRest(rng, winners, t);
    t.finished = true;
    t.placement = placementFor(t);
    t.champion = rest.champion;
    t.restLines = rest.lines;
    return { finished: true, champion: rest.champion, eliminated: true };
  }

  const pairs = [];
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push({ index: i / 2, a: winners[i], b: winners[i + 1] || null, winner: null, line: '' });
  }
  t.rounds.push(pairs);
  t.roundIndex += 1;
  return { finished: false, nextRound: roundName(t) };
}

function placementFor(t) {
  // Losing in a round of N leaves you tied for Nth; report the honest figure.
  const roundSize = t.rounds[t.roundIndex].length * 2;
  return Math.min(t.size, Math.max(2, roundSize / 2 + 1));
}

function simulateRest(rng, winners, t) {
  let field = winners.filter((w) => !w.isPlayer);
  const lines = [];
  while (field.length > 1) {
    const next = [];
    for (let i = 0; i < field.length; i += 2) {
      const a = field[i];
      const b = field[i + 1];
      if (!b) { next.push(a); continue; }
      const aWins = rng.chance(winChance(a.power, b.power));
      const w = aWins ? a : b;
      next.push(w);
      lines.push(describeOtherMatch(rng, w, aWins ? b : a, t));
    }
    field = next;
  }
  return { champion: field[0] || null, lines };
}

/** Everyone still standing, for the standings panel. */
export function standings(t) {
  const round = t.rounds[t.roundIndex] || [];
  const live = [];
  for (const m of round) {
    if (m.a) live.push(m.a);
    if (m.b) live.push(m.b);
  }
  return live.sort((a, b) => b.power - a.power);
}

export function bracketSummary(t) {
  const out = [];
  for (const h of t.history) {
    out.push({ title: h.name, lines: h.lines });
  }
  if (!t.finished) {
    const foe = playerOpponent(t);
    out.push({
      title: roundName(t),
      lines: foe ? [`You are drawn against ${foe.name} (${numberish(foe.power)}).`] : ['You have a bye.'],
    });
  }
  if (t.restLines && t.restLines.length) {
    out.push({ title: 'Without you', lines: t.restLines });
  }
  return out;
}

/** What the whole thing was worth. Returns changes for the caller to apply. */
export function payout(state, t) {
  const placement = t.placement || t.size;
  const won = placement === 1;
  const share = won ? 1 : placement <= 2 ? 0.32 : placement <= 4 ? 0.12 : 0.04;
  const beatCanon = t.beat.length;

  return {
    won,
    placement,
    zeni: Math.round((t.purse || 0) * share),
    fame: won ? 24 : Math.max(1, Math.round(14 - placement)),
    happiness: won ? 22 : placement <= 4 ? 2 : -6,
    beat: t.beat.slice(),
    champion: t.champion ? t.champion.name : (won ? state.character.name : null),
    beatCount: beatCanon,
  };
}

/** One-line description of where you finished. */
export function placementLine(t) {
  if (t.disqualified) return 'Disqualified.';
  if (t.placement === 1) return 'Champion.';
  if (t.placement === 2) return 'Runner-up.';
  return `${ordinal(t.placement || t.size)} place. ${t.eliminatedBy ? t.eliminatedBy + ' put you out.' : ''}`.trim();
}

/** Battle spec for the player's current match. */
export function matchBattleSpec(state, t) {
  const foe = playerOpponent(t);
  if (!foe) return null;
  const canon = foe.canonId ? getCanon(foe.canonId) : null;
  return {
    foe: {
      name: foe.name,
      power: foe.power,
      raceId: foe.raceId,
      canonId: foe.canonId,
      techniques: canon && canon.teaches ? canon.teaches.slice(0, 4) : [],
    },
    stakes: t.stakes,
    reason: 'tournament',
    placeId: t.placeId || state.character.placeId,
    context: {
      reason: 'tournament',
      canonId: foe.canonId,
      tournament: t.formatId,
      ringOut: !!t.rules.ringOut,
      noKilling: !!t.rules.noKilling,
    },
    intro: `${roundName(t)}. ${foe.name}, ${numberish(foe.power)}.`
      + (foe.flavour ? (foe.universe ? ` ${foe.flavour}` : ` They ${foe.flavour}.`) : '')
      + (t.rules.note ? ` ${t.rules.note}` : ''),
  };
}

/** How strong a field the player is walking into, in plain words. */
export function describeField(state, t) {
  const mine = combatPower(state.character);
  const powers = t.entrants.filter((e) => !e.isPlayer).map((e) => e.power).sort((a, b) => b - a);
  const top = powers[0] || 1;
  const median = powers[Math.floor(powers.length / 2)] || 1;
  const strongest = t.entrants.find((e) => e.power === top);
  const rel = mine / Math.max(1, top);
  const verdict = rel > 4 ? 'You are the strongest thing in this draw by a distance.'
    : rel > 1.2 ? 'You should win this, if nothing goes wrong.'
      : rel > 0.5 ? 'You can win this. You will have to be right about a few things.'
        : rel > 0.08 ? 'Somebody in this draw is out of your class.'
          : 'You have no business being in this draw.';
  return {
    verdict,
    top,
    median,
    strongestName: strongest ? strongest.name : 'somebody',
    line: `Field of ${t.size}. Strongest entrant ${strongest ? strongest.name : 'unknown'} at ${numberish(top)}; `
      + `middle of the draw around ${numberish(median)}. ${verdict}`,
  };
}

/**
 * Run a whole bracket headlessly, for the soak harness and for tournaments
 * happening somewhere you are not. Uses the same odds as everyone else's
 * matches, so a run without the UI is not a different game.
 */
export function autoRunTournament(state, rng, t) {
  let guard = 0;
  while (!t.finished && guard++ < 24) {
    resolveOtherMatches(state, rng, t);
    const foe = playerOpponent(t);
    if (!foe) { recordPlayerResult(state, rng, t, true); continue; }
    const p = winChance(combatPower(state.character), foe.power);
    const won = rng.chance(p);
    if (won) {
      // Winning a round costs you something; you do not arrive at the final fresh.
      state.character.vitals.health = clamp(state.character.vitals.health - rng.int(6, 18), 1, state.character.vitals.healthMax || 100);
    } else {
      state.character.vitals.health = clamp(state.character.vitals.health - rng.int(12, 30), 1, state.character.vitals.healthMax || 100);
    }
    recordPlayerResult(state, rng, t, won);
  }
  if (!t.finished) { t.finished = true; t.placement = t.placement || t.size; }
  return t;
}

/**
 * What the Tournament of Power was actually for. If the champion came from
 * Universe 7 - you, or one of yours - the universe stands. Otherwise the
 * winning universe's wish decides it, and in the story that wish put every
 * erased universe back; here it is a roll, weighted by who won.
 */
export function topConsequence(state, rng, t) {
  if (t.formatId !== 'top') return null;
  const champ = t.champion || (t.placement === 1 ? { isPlayer: true } : null);
  const ours = !champ || champ.isPlayer || !champ.universe;
  if (ours) {
    state.world.flags.universe_saved = true;
    if (champ && champ.isPlayer) {
      // The winner gets the Super Dragon Balls. One wish, and it can be anything.
      state.world.flags.super_dragon_balls = true;
      return 'Universe 7 stands, and the Super Dragon Balls are yours. One wish, on a scale nothing else in this setting can match.';
    }
    return 'Universe 7 stands. The Omni-Kings look faintly disappointed and go home.';
  }
  const restored = rng.chance(champ.universe === 11 ? 0.8 : 0.35);
  if (restored) {
    state.world.flags.universe_saved = true;
    return `Universe ${champ.universe} takes it, and their fighter spends the wish putting the erased universes back. Yours included. You did not earn that and you know it.`;
  }
  state.world.flags.universe_erased = true;
  return `Universe ${champ.universe} takes it. The Omni-Kings raise a hand each and everything you have ever known stops existing.`;
}

/** Apply a finished tournament's payout to the character. Returns a summary. */
export function settle(state, t, rng = null) {
  const result = payout(state, t);
  const c = state.character;
  // Winning in front of a crowd is how most people become known.
  spreadWord(state, {
    scale: DEED_SCALE.tournament * (result.won ? 3 : 1) * (t.formatId === 'top' ? 900 : 1),
  });
  c.zeni += result.zeni;
  c.fame = clamp(c.fame + result.fame, 0, 100);
  c.vitals.happiness = clamp(c.vitals.happiness + result.happiness, 0, 100);
  if (result.won) state.world.tournamentWins = (state.world.tournamentWins || 0) + 1;
  const bits = [placementLine(t)];
  if (result.beat.length) bits.push(`You went through ${result.beat.join(', ')}.`);
  if (result.zeni) bits.push(`${Math.round(result.zeni).toLocaleString('en-US')} Zeni.`);
  if (!result.won && result.champion) bits.push(`${result.champion} took it.`);
  if (t.formatId === 'wmat' && result.won && !c.items.includes('championship_belt')) {
    // The belt is a thing you own now, and it shows.
    c.items.push('championship_belt');
    bits.push('They put the belt on you.');
  }
  const fate = rng ? topConsequence(state, rng, t) : null;
  if (fate) bits.push(fate);
  return { ...result, text: bits.join(' '), erased: !!(fate && /stops existing/.test(fate)) };
}
