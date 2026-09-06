// The Tournament of Power, played by its own rules.
//
// A bracket is the wrong shape for it. The Tournament of Power is eighty
// fighters on one flat stage for forty-eight minutes, with no killing, no
// flight, and no elimination except over the edge - and every universe that
// ends the clock with nobody left standing stops existing.
//
// So this is a survival board rather than a ladder: a clock that runs down, a
// stage that everyone is on at once, fights happening around you whether you
// take part or not, and the constant question of whether to spend the round
// on somebody dangerous, somebody easy, or a teammate about to go over.

import { clamp } from './rng.js';
import { UNIVERSES, universeFighters, getUniverse } from '../data/universes.js';
import { canonAvailable, canonPower } from '../data/canon.js';
import { combatPower } from './stats.js';
import { addFact } from './memory.js';
import { livingNpcs } from './state.js';
import { generateFullName } from '../data/names.js';

const FILLER_NOTES = [
  'One of the ones nobody wrote a name down for. Still eighty people on the stage.',
  'Never fought anyone famous. Still made the team.',
  'A whole life led up to standing here, same as everybody else on this stage.',
  'Nobody in the crowd knows this name yet.',
];

export const RULES = [
  'Ring-out only. Nobody is killed and nobody is meant to be.',
  'No flying. Your feet stay on the stage or you have left it.',
  'Forty-eight minutes on the clock, and no extensions.',
  'Every universe still holding fighters at the end survives. The rest are erased.',
  'Weapons are allowed. Killing is not. Zeno is watching and does not warn twice.',
];

const MINUTES = 48;

function fighterFrom(spec, universe) {
  return {
    id: spec.id,
    name: spec.name,
    universe,
    power: Math.max(1, spec.power),
    stamina: 100,
    grip: 100,           // how well they are holding their footing
    out: false,
    outAt: null,
    note: spec.flavour || spec.note || '',
    aggression: spec.aggression ?? 0.5,
  };
}

/**
 * Ten to a team, always - the number canon actually used. A universe's data
 * rarely names ten fighters, so whatever is left after the named roster is
 * filled with people the story never got around to naming. They still count.
 */
function fillToTen(rng, roster, universeNumber, universeName) {
  const out = roster.slice();
  let i = out.length;
  while (out.length < 10) {
    const power = out.length
      ? Math.round((roster[roster.length - 1]?.power || 1e9) * rng.float(0.05, 0.4))
      : Math.round(1e9 * rng.float(0.3, 1.2));
    out.push(fighterFrom({
      id: `filler_${universeNumber}_${i}`,
      name: generateFullName(rng, 'other'),
      power: Math.max(1, power),
      flavour: rng.pick(FILLER_NOTES),
    }, universeNumber));
    i += 1;
  }
  return out;
}

/**
 * Build the stage. The player's universe is whichever one they belong to;
 * everybody else is drawn from the universes that actually competed - all
 * eight of them, ten fighters each, eighty on the stage, the actual shape of
 * the thing rather than a scaled-down stand-in for it.
 */
export function startSurvival(state, rng, opts = {}) {
  const c = state.character;
  const year = c.birthYear + c.age;
  const myUniverse = opts.universe ?? 7;
  const perTeam = 10;

  const teams = [];
  const competing = UNIVERSES.filter((u) => u.competed);
  for (const u of competing) {
    const named = universeFighters(u.id, year)
      .slice(0, perTeam)
      .map((f, i) => fighterFrom({ ...f, id: `${u.id}_${i}` }, u.number));
    const roster = fillToTen(rng, named, u.number, u.name);
    teams.push({ universe: u.number, id: u.id, name: u.name, epithet: u.epithet, fighters: roster });
  }

  // Your side: the canon cast who would actually be sent, then - if there is
  // still room - whoever in your own life is strong and trusted enough to
  // stand there too. Nobody unproven gets a seat; power without your trust
  // does not buy one either.
  const canonMates = canonAvailable(year, (x) => x.tags.some((t) => ['hero', 'rival', 'antihero', 'ally'].includes(t))
    && !x.tags.some((t) => ['divine', 'destroyer', 'angel', 'omniking', 'dragon'].includes(t)))
    .sort((a, b) => canonPower(b, year) - canonPower(a, year))
    .slice(0, perTeam - 1)
    .map((x, i) => fighterFrom({ id: 'ally_' + i, name: x.name, power: canonPower(x, year), flavour: x.quirk }, myUniverse));

  const myPower = combatPower(c);
  const trusted = livingNpcs(state)
    .filter((n) => (n.closeness || 0) > 60 && (n.trust ?? 0) > 55 && (n.power || 0) > myPower * 0.15)
    .sort((a, b) => (b.power || 0) - (a.power || 0));

  const mates = canonMates.slice();
  for (const npc of trusted) {
    if (mates.length >= perTeam - 1) break;
    if (mates.some((m) => m.name === npc.name)) continue;
    mates.push(fighterFrom({
      id: 'trusted_' + npc.id, name: npc.name, power: npc.power || 1,
      flavour: 'Not from any story anybody else knows. Yours.',
    }, myUniverse));
  }

  const me = fighterFrom({ id: 'me', name: c.name, power: myPower }, myUniverse);
  me.isPlayer = true;
  const myRoster = fillToTen(rng, [me, ...mates], myUniverse, `Universe ${myUniverse}`);
  teams.unshift({ universe: myUniverse, id: 'u' + myUniverse, name: `Universe ${myUniverse}`, epithet: 'yours', fighters: myRoster });

  return {
    minute: 0,
    minutes: MINUTES,
    teams,
    me,
    myUniverse,
    log: [`Forty-eight minutes. ${teams.reduce((n, t) => n + t.fighters.length, 0)} fighters. One stage.`],
    over: false,
    outcome: null,
    erased: [],
    knockedOut: 0,
    saved: 0,
    spectating: false,
  };
}

export function allFighters(board) {
  return board.teams.flatMap((t) => t.fighters);
}

export function standing(board) {
  return allFighters(board).filter((f) => !f.out);
}

export function myTeam(board) {
  return board.teams.find((t) => t.universe === board.myUniverse);
}

/** Everyone still up who is not on your side. */
export function opponents(board) {
  return standing(board).filter((f) => f.universe !== board.myUniverse);
}

/** Teammates in trouble: low grip, and about to go over. */
export function endangered(board) {
  return myTeam(board).fighters.filter((f) => !f.out && !f.isPlayer && f.grip < 55);
}

export function survivalActions(board) {
  const out = [];
  const me = board.me;
  if (board.over) return out;

  // Going out does not end the tournament for you, it changes what you can
  // do in it. Eighty people do not stop fighting because one of them landed
  // wrong - you watch the rest of it happen from the edge of the stage,
  // the way it actually went for everyone who was eliminated early.
  if (me.out) {
    return [{
      id: 'watch', kind: 'watch', label: 'Watch from the edge',
      hint: 'You are out. Your universe is not, not yet. See how it goes.',
    }];
  }

  const foes = opponents(board).sort((a, b) => a.power - b.power);

  // Somebody you can plausibly move. Attacking upward is how you lose a round
  // and your footing at the same time.
  for (const f of foes.slice(0, 3)) {
    const ratio = me.power / Math.max(1, f.power);
    out.push({
      id: 'push:' + f.id, kind: 'push', label: `Put ${f.name} out`,
      hint: `U${f.universe} - ${ratio > 1.6 ? 'you are stronger' : ratio > 0.7 ? 'close to even' : 'stronger than you'}`
        + (f.note ? ` - ${f.note}` : ''),
    });
  }
  const biggest = foes[foes.length - 1];
  if (biggest && biggest !== foes[0]) {
    out.push({ id: 'push:' + biggest.id, kind: 'push', label: `Go for ${biggest.name}`,
      hint: `U${biggest.universe} - the dangerous one. ${biggest.note || ''}` });
  }

  for (const mate of endangered(board)) {
    out.push({ id: 'save:' + mate.id, kind: 'save', label: `Catch ${mate.name}`,
      hint: `They are going over. Spend the minute on them instead.` });
  }

  out.push({ id: 'hold', kind: 'hold', label: 'Hold your ground',
    hint: 'Recover footing and stamina. The clock is on your side if your universe is ahead.' });
  out.push({ id: 'hunt', kind: 'hunt', label: 'Take whoever comes',
    hint: 'Stay in the middle of it. Faster, riskier, and you do not choose who.' });
  out.push({ id: 'hide', kind: 'hide', label: 'Get out of the middle',
    hint: 'The edge of the stage. Nobody finds you for a while, and you do nothing.' });
  return out;
}

function eject(board, fighter, byName) {
  if (fighter.out) return;
  fighter.out = true;
  fighter.outAt = board.minute;
  board.log.push(`${fighter.name} goes over the edge${byName ? `, and ${byName} put them there` : ''}. Universe ${fighter.universe}.`);
  const team = board.teams.find((t) => t.universe === fighter.universe);
  if (team && team.fighters.every((f) => f.out)) {
    board.erased.push(team);
    board.log.push(`That is the last of ${team.name}. ${team.name} is erased.`);
  }
}

/** One minute of the tournament. */
export function survivalTurn(state, board, rng, actionId) {
  if (board.over) return { lines: [], over: true };
  const me = board.me;
  const lines = [];
  board.minute += 1;

  const spend = (n) => { me.stamina = clamp(me.stamina - n, 0, 100); };

  if (actionId.startsWith('push:')) {
    const target = allFighters(board).find((f) => f.id === actionId.slice(5) && !f.out);
    if (target) {
      const ratio = me.power / Math.max(1, target.power);
      const chance = clamp(0.18 + Math.pow(ratio, 0.32) * 0.32 + (100 - target.grip) / 260
        + (me.stamina - 50) / 400, 0.05, 0.92);
      spend(14);
      if (rng.chance(chance)) {
        eject(board, target, 'you');
        board.knockedOut += 1;
        lines.push(rng.pick([
          `You get under ${target.name} and the stage runs out behind them.`,
          `One exchange, one opening, and ${target.name} is over the line.`,
          `${target.name} does not come back from that. Out.`,
        ]));
      } else {
        target.grip = clamp(target.grip - rng.int(10, 26), 0, 100);
        me.grip = clamp(me.grip - rng.int(4, 16), 0, 100);
        lines.push(rng.pick([
          `${target.name} plants and holds. You have moved them and not enough.`,
          `You take ground off ${target.name} and give some of your own back.`,
          `Neither of you goes over. Both of you are closer to it.`,
        ]));
      }
    }
  } else if (actionId.startsWith('save:')) {
    const mate = allFighters(board).find((f) => f.id === actionId.slice(5) && !f.out);
    if (mate) {
      spend(10);
      const ok = rng.chance(clamp(0.45 + (me.stamina - 40) / 200, 0.2, 0.92));
      if (ok) {
        mate.grip = clamp(mate.grip + 40, 0, 100);
        board.saved += 1;
        lines.push(`You get a hand to ${mate.name} before the edge does. They are back on the stage and they owe you.`);
      } else {
        eject(board, mate, null);
        me.grip = clamp(me.grip - 12, 0, 100);
        lines.push(`You are half a second late. ${mate.name} goes over anyway, and you nearly follow.`);
      }
    }
  } else if (actionId === 'hold') {
    me.stamina = clamp(me.stamina + 16, 0, 100);
    me.grip = clamp(me.grip + 22, 0, 100);
    lines.push(rng.pick([
      'You stop moving and let it come to you. Nothing does, for a minute.',
      'You set your feet and breathe. It is the only thing on the board worth doing.',
      'You spend the minute getting your footing back.',
    ]));
  } else if (actionId === 'hunt') {
    const foes = opponents(board);
    if (foes.length) {
      const target = rng.pick(foes);
      const ratio = me.power / Math.max(1, target.power);
      spend(18);
      if (rng.chance(clamp(0.2 + Math.pow(ratio, 0.3) * 0.3, 0.05, 0.85))) {
        eject(board, target, 'you');
        board.knockedOut += 1;
        lines.push(`Somebody comes at you out of the crowd. It is ${target.name}, and it is very brief.`);
      } else {
        me.grip = clamp(me.grip - rng.int(10, 24), 0, 100);
        lines.push(`${target.name} finds you first, and you spend the minute not going over.`);
      }
    }
  } else if (actionId === 'hide') {
    me.stamina = clamp(me.stamina + 8, 0, 100);
    me.grip = clamp(me.grip + 10, 0, 100);
    lines.push(rng.pick([
      'You put yourself where the stage is empty. Nobody comes looking.',
      'There is a corner of this thing where nothing is happening. You use it.',
      'You stay out of it. Somewhere behind you, two universes stop existing.',
    ]));
    if (rng.chance(0.3)) lines.push('Somebody very high up notices you doing nothing, and remembers.');
  } else if (actionId === 'watch') {
    lines.push(rng.pick([
      'You watch it from the edge, same as everyone else who has already gone over.',
      'Being out does not mean being gone. You are still watching your universe fight for its life.',
      'You do not get another turn in this. You get a very good seat.',
    ]));
  }

  // Everything else on the stage happens whether you look at it or not.
  lines.push(...backgroundMinute(board, rng));

  if (!me.out) {
    // Being outnumbered on your own side costs you footing every minute.
    const mine = myTeam(board).fighters.filter((f) => !f.out).length;
    const others = opponents(board).length;
    if (others > mine * 3 && rng.chance(0.35)) {
      me.grip = clamp(me.grip - rng.int(6, 15), 0, 100);
      lines.push('There are too many of them and not enough of you. You lose ground you did not choose to lose.');
    }
    if (me.grip <= 0) {
      eject(board, me, null);
      lines.push('Your foot finds nothing. That is the tournament, for you. You are not done watching, though.');
    }
  }

  // The clock, a true sole survivor across all eighty, or your own universe
  // going out entirely - any of those and it is actually over. Your own
  // elimination alone is not one of them any more.
  const everyoneUp = standing(board);
  const myGone = myTeam(board).fighters.every((f) => f.out);
  if (board.minute >= board.minutes || everyoneUp.length <= 1 || myGone) {
    finishSurvival(state, board);
    return { lines: lines.concat(board.log.slice(-1)), over: true, outcome: board.outcome };
  }
  board.log.push(...lines);
  return { lines, over: false };
}

/** The rest of the stage, resolved coarsely so the clock still matters. */
function backgroundMinute(board, rng) {
  const lines = [];
  const up = standing(board).filter((f) => !f.isPlayer);
  if (up.length < 2) return lines;
  const bouts = Math.min(3, Math.ceil(up.length / 6));
  for (let i = 0; i < bouts; i += 1) {
    const a = rng.pick(up);
    const b = rng.pick(up.filter((f) => f.universe !== a.universe && !f.out));
    if (!a || !b || a.out || b.out) continue;
    const ratio = a.power / Math.max(1, b.power);
    const loser = rng.chance(clamp(0.5 + Math.log10(Math.max(0.01, ratio)) * 0.3, 0.12, 0.88)) ? b : a;
    const winner = loser === a ? b : a;
    loser.grip = clamp(loser.grip - rng.int(14, 40), 0, 100);
    if (loser.grip <= 0) {
      eject(board, loser, winner.name);
      lines.push(board.log[board.log.length - 1]);
    }
  }
  return lines;
}

function finishSurvival(state, board) {
  board.over = true;
  const c = state.character;
  const mine = myTeam(board);
  const alive = mine.fighters.filter((f) => !f.out);
  const everyoneUp = standing(board);

  if (everyoneUp.length === 1 && everyoneUp[0] === board.me) {
    // Not "your universe survived" - you personally are the only person left
    // standing on the stage, out of all eighty. That is the one outcome the
    // whole tournament was actually for, and it pays out accordingly.
    board.outcome = 'solo';
    c.flags.won_tournament_of_power = true;
    c.flags.top_sole_survivor = true;
    state.world.summon = { dragon: 'super', remaining: 1, used: [], group: null, zenoGifted: true };
    board.log.push('There is nobody else on the stage. Nobody. Somebody a great deal higher up than any dragon is already asking what you want.');
  } else if (board.me.out && alive.length === 0) {
    board.outcome = 'erased';
    board.log.push(`${mine.name} has nobody left. There is a moment where everything is very bright, and then there is not a Universe ${board.myUniverse}.`);
  } else if (board.me.out) {
    board.outcome = 'out';
    board.log.push(`You are out. Your universe is not, which is the part that counted.`);
  } else if (opponents(board).length === 0) {
    board.outcome = 'won';
    c.flags.won_tournament_of_power = true;
    // The tournament was for one wish per winning universe, not one per sole
    // survivor - Universe 7 won as a team in the source material, and the
    // team decided together (or didn't) who spoke for it. Whoever from your
    // own life is still standing beside you gets tracked here so that
    // decision can actually be made instead of assumed.
    state.world.summon = { dragon: 'super', remaining: 1, used: [], group: null, zenoGifted: true };
    board.teamSurvivorIds = alive
      .filter((f) => f !== board.me && typeof f.id === 'string' && f.id.startsWith('trusted_'))
      .map((f) => f.id.slice('trusted_'.length));
    board.log.push(board.teamSurvivorIds.length
      ? `Every other universe is gone from the stage. ${mine.name} is still standing - ${alive.length} of you, not just you. One dragon, one wish, and whoever speaks for the rest.`
      : `Every other universe is gone from the stage. ${mine.name} is still standing - not just you. That is enough to keep the lights on.`);
  } else {
    board.outcome = 'survived';
    board.log.push(`The clock runs out. ${mine.name} finishes with ${alive.length} still standing. That is enough.`);
  }

  addFact(state.memory, {
    type: 'tournament', year: c.birthYear + c.age, weight: 10, tags: ['tournament', 'top'],
    text: board.outcome === 'solo'
      ? 'Was the last one standing in the Tournament of Power. Every universe, every fighter. Just them.'
      : board.outcome === 'won'
      ? 'Won the Tournament of Power outright.'
      : board.outcome === 'erased'
        ? 'Was on the stage when their universe was erased.'
        : `Fought in the Tournament of Power. ${board.knockedOut} eliminations, ${board.erased.length} universes gone.`,
  });
  return board;
}

/**
 * A team win only produces one wish, and board.teamSurvivorIds is whoever
 * from your own life is still standing to have an opinion about it. The
 * wish itself works exactly the same either way - you still speak it -
 * but sharing it keeps the people who earned it with you, and taking it
 * alone costs you something real with them and your own name for it.
 */
export function resolveTeamWish(state, board, share) {
  const ids = board.teamSurvivorIds || [];
  const names = [];
  for (const id of ids) {
    const npc = state.npcs[id];
    if (!npc || !npc.alive) continue;
    names.push(npc.name);
    if (share) {
      npc.closeness = clamp((npc.closeness || 0) + 12, 0, 100);
      npc.trust = clamp((npc.trust ?? 30) + 10, 0, 100);
    } else {
      npc.closeness = clamp((npc.closeness || 0) - 25, 0, 100);
      npc.trust = clamp((npc.trust ?? 30) - 20, 0, 100);
      npc.tension = clamp((npc.tension || 0) + 30, 0, 100);
    }
  }
  if (!share) state.character.karma = clamp((state.character.karma || 0) - 8, -100, 100);
  if (!names.length) {
    return share
      ? 'Nobody else from your life made it this far. The wish is yours by default.'
      : 'Nobody else from your life made it this far. There was nobody to take it from.';
  }
  return share
    ? `You put it to ${names.join(' and ')} first. Whatever gets wished for, it is agreed on.`
    : `You do not ask ${names.join(' and ')}. The wish is yours before they can object.`;
}

/** The board, flattened for the UI. */
export function survivalStatus(board) {
  return {
    minute: board.minute,
    minutes: board.minutes,
    left: board.minutes - board.minute,
    over: board.over,
    outcome: board.outcome,
    knockedOut: board.knockedOut,
    saved: board.saved,
    me: { grip: Math.round(board.me.grip), stamina: Math.round(board.me.stamina), out: board.me.out },
    teams: board.teams.map((t) => ({
      universe: t.universe, name: t.name, epithet: t.epithet,
      mine: t.universe === board.myUniverse,
      up: t.fighters.filter((f) => !f.out).length,
      total: t.fighters.length,
      erased: t.fighters.every((f) => f.out),
      fighters: t.fighters.map((f) => ({
        name: f.name, out: f.out, grip: Math.round(f.grip), isPlayer: !!f.isPlayer,
      })),
    })),
  };
}
