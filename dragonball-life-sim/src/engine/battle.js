// Turn-based combat.
//
// Fights you care about are played, not rolled. Power level still decides most
// of it - a hundredfold gap is not something tactics fix - but inside a
// plausible band, stance, ki management, technique choice and when you
// transform all move the result.

import { clamp } from './rng.js';
import { render } from './text.js';
import { combatPower, powerTier, zenkaiBoost, winChance } from './stats.js';
import { TECH_BY_ID } from '../data/techniques.js';
import { getTransformation, ladderFor } from '../data/transformations.js';
import { getPlace } from '../data/places.js';
import { getRace, hasPerk } from '../data/races.js';
import { numberish } from './text.js';
import { damageGear } from './inventory.js';
import { spreadWord, DEED_SCALE } from './settlement.js';

/**
 * What people say mid-fight. Nobody in this setting fights silently: they
 * comment on a form, they gloat, they concede, they get insulted at being
 * held back against. The bank is keyed by what just happened and picked from
 * by the speaker's temperament.
 */
const VOICE = {
  proud: {
    form: ['"So that is what you have been hiding."', '"Do it again. Slower."', '"Finally."'],
    hurt: ['"That one counted."', '"Good. Again."', 'They spit and do not look away.'],
    winning: ['"Is this all of it?"', '"You are not going to reach me."', '"Stand up."'],
    losing: ['"I am not finished."', '"You have not won anything yet."', 'They will not go down and will not say why.'],
    insulted: ['"Do not do that." Their voice has changed. "Do not hold back on me."', '"I know what you are doing. Stop it."'],
    beaten: ['"...Fine. You were better."', 'They laugh, which is somehow worse.'],
  },
  cheerful: {
    form: ['"Whoa! What is that one?"', '"That is amazing. Can you teach me?"', 'They are grinning at it.'],
    hurt: ['"Okay! Okay. That hurt."', '"You are strong!"', 'They shake it off, delighted.'],
    winning: ['"Come on, you can do better than that!"', '"This is fun!"'],
    losing: ['"I am not done yet!"', '"Just getting warmed up."'],
    insulted: ['"You are going easy on me. Do not do that, it is boring."'],
    beaten: ['"That was great. Let us do it again some time."'],
  },
  cruel: {
    form: ['"How quaint."', '"Do you think that changes anything?"', 'They look bored.'],
    hurt: ['Their face does something unpleasant.', '"You will regret that."'],
    winning: ['"I want you to understand how far apart we are."', '"Beg. It will not help."'],
    losing: ['"This is not possible."', '"You are nothing. You are NOTHING."'],
    insulted: ['"Restraint? From you?" They are furious.'],
    beaten: ['"This is not over. It is never over."'],
  },
  professional: {
    form: ['They note it and adjust.', '"Interesting. Not enough."'],
    hurt: ['They acknowledge it with a nod.', 'They reassess, visibly.'],
    winning: ['"You are outmatched. I would stop."'],
    losing: ['They stop talking entirely.'],
    insulted: ['"Fight properly or do not fight."'],
    beaten: ['"Noted." They mean it.'],
  },
  frightened: {
    form: ['"What ARE you?"', 'They take a step back and do not know they did.'],
    hurt: ['They make a sound they did not intend to.'],
    winning: ['"Stay down. Please stay down."'],
    losing: ['"Wait — wait, listen —"'],
    insulted: ['"Why are you playing with me?"'],
    beaten: ['They are already apologising.'],
  },
};

/** Something to say, if this fighter is the sort who says things. */
export function voiceLine(battle, rng, kind) {
  const v = battle.them.voice;
  if (!v) return null;
  const bank = VOICE[v] || VOICE.professional;
  const set = bank[kind];
  if (!set || !set.length) return null;
  if (!rng.chance(0.55)) return null;
  return `${battle.them.name}: ${rng.pick(set)}`.replace(/^([^:]+): (They|Their)/, '$2');
}

/** What you can say back, given what just happened. */
export const REPLIES = [
  { id: 'taunt', label: 'Taunt them', text: '"Is that it?"', effect: { theirRage: 12, myFocus: 0 } },
  { id: 'respect', label: 'Give them their due', text: '"You are better than they said."', effect: { theirRage: -10, myFocus: 4 } },
  { id: 'warn', label: 'Warn them off', text: '"Walk away. I am asking once."', effect: { theirRage: -6, surrender: 0.12 } },
  { id: 'silent', label: 'Say nothing', text: '', effect: { myFocus: 6 } },
];

export const STANCES = {
  neutral: { name: 'Neutral', desc: 'No commitment either way.', atk: 1, def: 1, dodge: 0, kiRegen: 1, stamRegen: 1 },
  aggressive: { name: 'Aggressive', desc: 'Hit harder. Get hit harder.', atk: 1.38, def: 0.72, dodge: -0.05, kiRegen: 0.8, stamRegen: 0.8 },
  defensive: { name: 'Defensive', desc: 'Weather it. Wait for the opening.', atk: 0.78, def: 1.45, dodge: 0.05, kiRegen: 1.2, stamRegen: 1.5 },
  evasive: { name: 'Evasive', desc: 'Do not be where the fist is.', atk: 0.85, def: 1.05, dodge: 0.26, kiRegen: 1.1, stamRegen: 1.2 },
  focused: { name: 'Focused', desc: 'Read them. Build the shot.', atk: 1.05, def: 0.9, dodge: 0.02, kiRegen: 1.9, stamRegen: 1.0, crit: 0.14 },
};

/** Does this technique do anything a turn can express? */
function usableInBattle(e) {
  return !!(e.atk || e.blind || e.heal || e.drain || e.escape || e.multiplier || e.absorb || e.regen);
}

const PHYSICAL = [
  { id: 'jab', name: 'Quick strike', base: 9, stamina: 6, speedWeight: 1.3, hit: 0.92 },
  { id: 'combo', name: 'Combination', base: 17, stamina: 13, speedWeight: 1.0, hit: 0.82 },
  { id: 'heavy', name: 'Heavy blow', base: 28, stamina: 21, speedWeight: 0.7, hit: 0.68, stagger: 0.3 },
  { id: 'grapple', name: 'Grapple and throw', base: 14, stamina: 15, speedWeight: 0.8, hit: 0.74, stagger: 0.5 },
];

function sideTemplate(name, power, opts = {}) {
  return {
    name,
    power,
    basePower: power,
    hp: 100,
    hpMax: 100,
    ki: opts.ki ?? 100,
    kiMax: opts.kiMax ?? 100,
    stamina: 100,
    staminaMax: 100,
    stance: 'neutral',
    form: null,
    formName: null,
    guarding: false,
    charged: 0,
    staggered: 0,
    blinded: 0,
    infiniteStamina: !!opts.infiniteStamina,
    regenerates: !!opts.regenerates,
    techniques: opts.techniques || [],
    forms: opts.forms || [],
    raceId: opts.raceId || 'other',
    speedStat: opts.speedStat ?? 50,
    instinct: opts.instinct ?? 50,
    // What they say when things happen. Filled in by the caller.
    voice: opts.voice || null,
  };
}

/** Set up a battle between the player and one opponent. */
export function createBattle(state, rng, opts = {}) {
  const c = state.character;
  const race = getRace(c.raceId);
  const place = getPlace(opts.placeId || c.placeId);
  const foeSpec = opts.foe || { name: 'a stranger', power: combatPower(c) };

  const me = sideTemplate(c.name, combatPower(c, { form: null }), {
    speedStat: c.stats.speed,
    instinct: c.battleInstinct ?? 50,
    ki: c.vitals.ki,
    kiMax: Math.max(20, c.vitals.kiMax),
    infiniteStamina: hasPerk(c, 'infiniteStamina'),
    regenerates: hasPerk(c, 'regeneration'),
    techniques: c.techniques.slice(),
    forms: c.transformations.slice(),
    raceId: c.raceId,
  });
  me.hp = clamp(c.vitals.health, 5, 100);
  me.hpMax = 100;

  const them = sideTemplate(foeSpec.name, Math.max(1, foeSpec.power), {
    speedStat: foeSpec.speedStat ?? 50,
    instinct: foeSpec.instinct ?? 50,
    voice: foeSpec.voice || null,
    techniques: foeSpec.techniques || [],
    forms: foeSpec.forms || [],
    raceId: foeSpec.raceId || 'other',
    infiniteStamina: foeSpec.raceId === 'android',
    regenerates: ['namekian', 'majin', 'bioandroid'].includes(foeSpec.raceId),
  });

  return {
    id: 'battle_' + (state.stats.fights + 1),
    me,
    them,
    foeRef: { canonId: foeSpec.canonId || null, npcId: foeSpec.npcId || null },
    intro: foeSpec.intro || '',
    round: 1,
    log: [],
    over: false,
    outcome: null,
    stakes: opts.stakes || 'serious',       // spar | serious | lethal
    reason: opts.reason || 'fight',
    placeId: place.id,
    civilians: !!(place.tags.includes('urban') || place.tags.includes('civilised')),
    destruction: 0,
    relocated: false,
    zenkai: 0,
    fled: false,
    surrendered: false,
    protecting: !!opts.protecting,
    // How much of yourself you are using. Holding back keeps a fight going,
    // tests somebody without ending them, and is how half the cast fights.
    restraint: opts.restraint ?? (opts.stakes === 'spar' ? 0.5 : 1),
    // Tournament rules. A ring changes what winning means: you do not have to
    // put somebody down, you have to put them outside.
    ringOut: !!(opts.context && opts.context.ringOut),
    noKilling: !!(opts.context && opts.context.noKilling),
    context: opts.context || { reason: opts.reason || 'fight' },
  };
}

function effectivePower(side, battle) {
  const form = side.form ? getTransformation(side.form) : null;
  const mult = form ? form.mult : 1;
  const condition = clamp(0.45 + (side.hp / side.hpMax) * 0.55, 0.45, 1);
  const kiFactor = clamp(0.6 + (side.ki / Math.max(1, side.kiMax)) * 0.4, 0.6, 1);
  // Whatever you are keeping in reserve does not land on them.
  const held = battle && side === battle.me ? (battle.restraint ?? 1) : 1;
  return Math.max(1, side.basePower * mult * condition * kiFactor * held);
}

/** The gap that decides whether somebody can be touched at all. */
export function speedGap(a, b) {
  const mine = (a.speedStat ?? 50) * (a.form ? 1.4 : 1);
  const theirs = (b.speedStat ?? 50) * (b.form ? 1.4 : 1);
  return mine / Math.max(1, theirs);
}

function ratioOf(attacker, defender, battle) {
  return effectivePower(attacker, battle) / Math.max(1, effectivePower(defender, battle));
}

/** Damage scaling: power dominates, but never to the point of certainty. */
function scaleByPower(ratio) {
  return clamp(Math.pow(ratio, 0.45), 0.12, 6.5);
}

function stanceOf(side) {
  return STANCES[side.stance] || STANCES.neutral;
}

// --------------------------------------------------------------- available

export function battleActions(state, battle) {
  const c = state.character;
  const me = battle.me;
  const out = [];

  for (const move of PHYSICAL) {
    const cost = me.infiniteStamina ? 0 : move.stamina;
    out.push({
      id: 'phys:' + move.id,
      kind: 'physical',
      label: move.name,
      hint: `${cost ? cost + ' stamina' : 'free'} - ${move.base} base`,
      disabled: me.stamina < cost,
      reason: me.stamina < cost ? 'Not enough stamina' : null,
    });
  }

  for (const id of me.techniques) {
    const tech = TECH_BY_ID[id];
    if (!tech || !tech.effect) continue;
    const e = tech.effect;
    if (!usableInBattle(e)) continue;
    const cost = e.kiCost || 0;
    out.push({
      id: 'tech:' + id,
      kind: 'ki',
      label: tech.name,
      hint: [
        e.atk ? `${e.atk} power` : null,
        cost ? `${cost} ki` : 'no ki',
        e.pierce ? 'pierces guard' : null,
        e.chargeTurns ? `${e.chargeTurns} turn charge` : null,
        e.blind ? 'blinds' : null,
        e.heal ? 'heals' : null,
        e.escape ? 'escape' : null,
      ].filter(Boolean).join(' - '),
      disabled: me.ki < cost,
      reason: me.ki < cost ? 'Not enough ki' : null,
    });
  }

  out.push({ id: 'guard', kind: 'defend', label: 'Guard', hint: 'Cut the next hit hard, recover stamina' });
  // Charging is not a free hit for them if you are far enough ahead: at that
  // gap you are simply not where the punch lands.
  const foe = battle.them;
  const edge = speedGap(me, foe) * Math.pow(ratioOf(me, foe, battle), 0.25);
  out.push({
    id: 'charge', kind: 'defend', label: 'Charge ki',
    hint: edge > 1.8 ? 'You can afford to. They will not reach you.'
      : edge > 1.2 ? 'Risky. You are faster, but not by much.'
        : 'Big ki gain, and they get a free swing.',
  });

  // How much of yourself you are using. This is how you test somebody, drag a
  // fight out, or stop pretending.
  const held = battle.restraint ?? 1;
  const steps = [
    { v: 0.25, label: 'Barely trying', hint: 'A quarter of you. They will think they are doing well.' },
    { v: 0.5, label: 'Hold back', hint: 'Half. Enough to test them properly.' },
    { v: 0.75, label: 'Most of it', hint: 'Nearly everything.' },
    { v: 1, label: 'Stop holding back', hint: 'All of it. No more of this.' },
  ];
  for (const step of steps) {
    if (Math.abs(step.v - held) < 0.01) continue;
    out.push({
      id: 'restraint:' + step.v, kind: 'stance',
      label: step.label, hint: step.hint,
    });
  }

  for (const key of Object.keys(STANCES)) {
    if (key === me.stance) continue;
    out.push({
      id: 'stance:' + key,
      kind: 'stance',
      label: STANCES[key].name,
      hint: STANCES[key].desc,
    });
  }

  const availableForms = me.forms
    .map((id) => getTransformation(id))
    .filter((f) => f && f.id !== me.form)
    .sort((a, b) => a.mult - b.mult);
  for (const form of availableForms) {
    out.push({
      id: 'form:' + form.id,
      kind: 'form',
      label: `Transform: ${form.name}`,
      hint: `x${numberish(form.mult)} power - ${form.drain} ki upkeep`,
      disabled: me.ki < form.drain * 2,
      reason: me.ki < form.drain * 2 ? 'Not enough ki to hold it' : null,
    });
  }
  if (me.form) {
    out.push({ id: 'form:none', kind: 'form', label: 'Drop the form', hint: 'Stop the ki drain' });
  }

  if (c.senzu > 0) {
    out.push({ id: 'senzu', kind: 'item', label: 'Eat a senzu bean', hint: `Full heal - ${c.senzu} left` });
  }

  if (battle.ringOut) {
    // Throwing somebody out of the ring is a real option against a fighter
    // you could never knock down, and it is how most tournaments end.
    const off = them_off_balance(battle);
    out.push({
      id: 'ringout',
      kind: 'move',
      label: 'Throw them out of the ring',
      hint: off ? 'They are off balance. Take the chance.' : 'Needs them staggered, hurt, or blinded first.',
      disabled: !off,
      reason: off ? null : 'They are still set',
    });
  }

  if (battle.civilians && !battle.relocated && c.techniques.includes('instant_transmission')) {
    out.push({
      id: 'relocate', kind: 'move', label: 'Take it somewhere empty',
      hint: 'Instant Transmission. Nobody down there has to die for this.',
    });
  }
  out.push({
    id: 'flee', kind: 'move', label: 'Break off and run',
    hint: c.techniques.includes('instant_transmission') ? 'Instant Transmission out' : 'Speed against theirs',
  });
  if (battle.stakes !== 'spar') {
    out.push({ id: 'surrender', kind: 'move', label: 'Yield', hint: 'Stop fighting. Hope they accept it.' });
  }
  if (battle.them.voice) {
    for (const r of REPLIES) {
      out.push({ id: 'say:' + r.id, kind: 'talk', label: r.label, hint: r.text || 'Let it stand.' });
    }
  }

  return out;
}

/** Is the opponent in a state where a throw could actually put them out? */
function them_off_balance(battle) {
  const them = battle.them;
  return !!(them.staggered > 0 || them.blinded > 0 || them.hp <= them.hpMax * 0.45);
}

// ------------------------------------------------------------------- turn

function applyUpkeep(side, lines) {
  if (side.form) {
    const form = getTransformation(side.form);
    if (form) {
      side.ki -= form.drain;
      if (side.ki <= 0) {
        side.ki = 0;
        side.form = null;
        side.formName = null;
        lines.push(`${side.name} cannot hold the form any longer and drops out of it.`);
      }
    }
  }
  const stance = stanceOf(side);
  side.ki = clamp(side.ki + 5 * stance.kiRegen, 0, side.kiMax);
  if (!side.infiniteStamina) side.stamina = clamp(side.stamina + 11 * stance.stamRegen, 0, side.staminaMax);
  else side.stamina = side.staminaMax;
  if (side.regenerates && side.hp > 0) side.hp = clamp(side.hp + 3, 0, side.hpMax);
  if (side.staggered > 0) side.staggered -= 1;
  if (side.blinded > 0) side.blinded -= 1;
}

function strike(attacker, defender, battle, rng, spec) {
  const stance = stanceOf(attacker);
  const dstance = stanceOf(defender);
  const ratio = ratioOf(attacker, defender, battle);

  let hitChance = (spec.hit ?? 0.85) * stance.atk;
  hitChance -= dstance.dodge;
  if (defender.blinded > 0) hitChance += 0.3;
  if (attacker.blinded > 0) hitChance -= 0.35;
  if (defender.staggered > 0) hitChance += 0.2;
  hitChance = clamp(hitChance, 0.05, 0.97);

  if (!rng.chance(hitChance)) {
    return { miss: true, damage: 0 };
  }

  let dmg = spec.base * scaleByPower(ratio) * stance.atk;
  dmg /= dstance.def;
  if (defender.guarding && !spec.pierce) dmg *= 0.38;
  if (attacker.charged > 0) {
    dmg *= 1 + attacker.charged * 0.35;
    attacker.charged = 0;
  }
  const crit = rng.chance((stance.crit || 0) + (spec.crit || 0));
  if (crit) dmg *= 1.7;
  dmg *= rng.float(0.85, 1.18);

  if (!Number.isFinite(dmg)) dmg = spec.base || 8;
  const raw = Math.max(1, Math.round(dmg));
  const damage = Math.min(raw, Math.max(1, Math.round(defender.hp)));
  defender.hp = Math.max(0, defender.hp - raw);
  if (spec.stagger && rng.chance(spec.stagger)) defender.staggered = 2;

  // Big exchanges wreck the landscape, and somebody lives here.
  battle.destruction = clamp(battle.destruction + damage * (spec.blast ? 0.9 : 0.35) / 10, 0, 100);
  return { miss: false, damage, crit };
}

/**
 * Two template sets, because "You lands the heavy blow" is the kind of thing
 * that tells a reader nobody looked at the output.
 */
function describeStrike(res, attackerName, defenderName, moveName, rng, byPlayer) {
  const slots = { a: attackerName, d: defenderName, m: moveName.toLowerCase() };
  if (res.miss) {
    return render(byPlayer
      ? `{You go for the [m] and find nothing|[d] is not there when your [m] arrives|Your [m] misses}.`
      : `{[a] goes for the [m] and finds nothing|You are not there when the [m] arrives|The [m] misses you}.`,
    slots, rng);
  }
  const heavy = res.damage > 30;
  const shown = Math.round(res.damage);
  const template = byPlayer
    ? (heavy
      ? `{You land the [m] and [d] folds around it|Your [m] connects properly and [d] gets up slower|You put everything into the [m]}.`
      : `{You catch [d] with the [m]|Your [m] lands|You get the [m] through}.`)
    : (heavy
      ? `{[a] lands the [m] and you fold around it|The [m] connects properly and you get up slower|[a] puts everything into the [m]}.`
      : `{[a] catches you with the [m]|The [m] lands|[a] gets the [m] through}.`);
  return render(`${template} (${shown})`, slots, rng);
}

/** The opponent's move. Simple, but it escalates when it is losing. */
function foeTurn(state, battle, rng) {
  const them = battle.them;
  const me = battle.me;
  const lines = [];
  const hurt = them.hp / them.hpMax;
  const losing = ratioOf(them, me, battle) < 0.8;

  // Escalate: transform when hurt or outmatched.
  if (them.forms.length && !them.form && (hurt < 0.6 || losing) && rng.chance(0.55)) {
    const form = them.forms
      .map((id) => getTransformation(id))
      .filter(Boolean)
      .sort((a, b) => b.mult - a.mult)[0];
    if (form && them.ki > form.drain * 3) {
      them.form = form.id;
      them.formName = form.name;
      lines.push(`${them.name} transforms. ${form.desc}`);
      return lines;
    }
  }

  // In a ring, they will take the same shortcut you can.
  if (battle.ringOut && !battle.over) {
    const meOff = me.staggered > 0 || me.blinded > 0 || me.hp <= me.hpMax * 0.45;
    if (meOff && rng.chance(0.42)) {
      const chance = clamp(0.3 + Math.pow(ratioOf(them, me, battle), 0.3) * 0.28
        + (me.staggered ? 0.18 : 0) + (1 - me.hp / me.hpMax) * 0.22, 0.1, 0.9);
      if (rng.chance(chance)) {
        lines.push(`${them.name} gets under you and puts you over the edge. You land outside the ring.`);
        battle.byRingOut = true;
        battle.foeRingOut = true;
        finish(state, battle, rng, 'lost');
        return lines;
      }
      lines.push(`${them.name} tries to throw you out and you break the grip.`);
      return lines;
    }
  }

  if (hurt < 0.35 && rng.chance(0.35)) {
    them.stance = 'defensive';
  } else if (losing && rng.chance(0.4)) {
    them.stance = 'aggressive';
  }

  const kiMoves = them.techniques
    .map((id) => TECH_BY_ID[id])
    .filter((t) => t && t.effect && t.effect.atk > 0 && (t.effect.kiCost || 0) <= them.ki);
  if (kiMoves.length && rng.chance(0.4)) {
    const tech = rng.pick(kiMoves);
    them.ki -= tech.effect.kiCost || 0;
    const res = strike(them, me, battle, rng, {
      base: tech.effect.atk * 0.7, hit: 0.8, pierce: tech.effect.pierce > 0.5, blast: true,
    });
    lines.push(describeStrike(res, them.name, 'you', tech.name, rng, false));
    return lines;
  }

  const move = rng.weighted(PHYSICAL, (m) => (them.stamina >= m.stamina ? m.base : 0));
  if (!them.infiniteStamina) them.stamina = Math.max(0, them.stamina - move.stamina);
  const res = strike(them, me, battle, rng, move);
  lines.push(describeStrike(res, them.name, 'you', move.name, rng, false));
  return lines;
}

function finish(state, battle, rng, outcome) {
  battle.over = true;
  battle.outcome = outcome;
  const c = state.character;

  c.vitals.ki = Math.round(clamp(battle.me.ki, 0, c.vitals.kiMax));
  // Losing a fight leaves you wrecked, not dead. Only a fight with lethal
  // stakes is allowed to take the last of your health, because otherwise
  // every defeat became a coin flip on the following new year.
  const floor = (battle.stakes === 'lethal' && outcome === 'lost') ? 0 : 6;
  c.vitals.health = clamp(Math.round(Math.max(battle.me.hp, floor)), 0, 100);

  if (battle.me.hp <= 12 && outcome !== 'fled') {
    c.flags.brink_of_death = true;
    if (hasPerk(c, 'zenkai') || hasPerk(c, 'zenkaiWeak')) {
      battle.zenkai = zenkaiBoost(c, rng, battle.me.hp <= 4 ? 1.3 : 0.9);
    }
  }
  if (outcome === 'lost') {
    c.flags.fury = true;
    if (ratioOf(battle.them, battle.me, battle) > 4) c.flags.humiliated = true;
    if (battle.protecting) c.flags.protected_someone = true;
  }
  return battle;
}

/**
 * Play one exchange. `actionId` comes from `battleActions`.
 * Returns the lines to show plus whether the fight has ended.
 */
export function takeTurn(state, battle, rng, actionId, params = {}) {
  if (battle.over) return { lines: [], over: true, outcome: battle.outcome };
  const c = state.character;
  const me = battle.me;
  const them = battle.them;
  const lines = [];
  let skipFoe = false;
  let freeSwing = false;

  me.guarding = false;

  if (actionId.startsWith('stance:')) {
    const key = actionId.slice(7);
    if (STANCES[key]) {
      me.stance = key;
      lines.push(`You shift to ${STANCES[key].name.toLowerCase()}. ${STANCES[key].desc}`);
    }
  } else if (actionId.startsWith('form:')) {
    const id = actionId.slice(5);
    if (id === 'none') {
      me.form = null;
      me.formName = null;
      lines.push('You let the form go. The drain stops.');
    } else {
      const form = getTransformation(id);
      if (form && me.forms.includes(id)) {
        me.form = id;
        me.formName = form.name;
        me.ki = Math.max(0, me.ki - form.drain);
        lines.push(`${form.name}. ${form.desc}`);
        const said = voiceLine(battle, rng, 'form');
        if (said) lines.push(said);
        else if (them.hp / them.hpMax > 0.5) {
          lines.push(`${them.name} ${rng.pick(['takes a step back', 'stops smiling', 'says nothing', 'looks at you differently'])}.`);
        }
      }
    }
  } else if (actionId.startsWith('say:')) {
    const reply = REPLIES.find((r) => r.id === actionId.slice(4));
    if (reply) {
      if (reply.text) lines.push(`You: ${reply.text}`);
      const e = reply.effect;
      if (e.theirRage) {
        them.stance = e.theirRage > 0 ? 'aggressive' : 'defensive';
        lines.push(e.theirRage > 0
          ? `${them.name} comes at you harder for that.`
          : `${them.name} steadies. Whatever that was, it landed.`);
      }
      if (e.myFocus) me.ki = clamp(me.ki + e.myFocus, 0, me.kiMax);
      if (e.surrender && them.hp / them.hpMax < 0.4 && rng.chance(e.surrender * 3)) {
        lines.push(`${them.name} stops. "...All right. All right."`);
        return { lines, over: true, outcome: finish(state, battle, rng, 'won').outcome };
      }
    }
  } else if (actionId.startsWith('restraint:')) {
    const to = Number(actionId.slice(10));
    const was = battle.restraint ?? 1;
    battle.restraint = clamp(to, 0.15, 1);
    lines.push(to > was
      ? rng.pick([
        'You stop holding back.',
        'You stop being careful with them.',
        'Whatever you were keeping back, you stop keeping it back.',
      ])
      : rng.pick([
        'You ease off. Let us see what they do with the room.',
        'You take it down a level and wait.',
        'You stop trying to finish it.',
      ]));
    if (to < was && them.hp / them.hpMax > 0.5) {
      lines.push(voiceLine(battle, rng, 'insulted') || `${them.name} notices, and does not thank you for it.`);
    }
    skipFoe = false;
  } else if (actionId === 'ringout') {
    // Strength and technique against their weight and whatever balance they
    // have left. Failing it puts you in a bad spot, which is the trade.
    const ratio = ratioOf(me, them, battle);
    const chance = clamp(0.32 + Math.pow(ratio, 0.3) * 0.28
      + (them.staggered ? 0.18 : 0) + (them.blinded ? 0.14 : 0)
      + (1 - them.hp / them.hpMax) * 0.25, 0.1, 0.94);
    me.stamina = Math.max(0, me.stamina - (me.infiniteStamina ? 0 : 18));
    if (rng.chance(chance)) {
      lines.push(render(`{You get under them and put them over the edge|You take their balance and throw|You lift them off the stone and let go}. `
        + `{They land outside|Both feet outside the ring|Out}.`, {}, rng));
      battle.byRingOut = true;
      return { lines, over: true, outcome: finish(state, battle, rng, 'won').outcome };
    }
    lines.push(render(`{They plant and you cannot move them|The throw does not come off|You get a grip and they break it}. `
      + `{You are wide open now|That cost you the position|You have given them the inside}.`, {}, rng));
    freeSwing = true;
  } else if (actionId.startsWith('phys:')) {
    const move = PHYSICAL.find((m) => m.id === actionId.slice(5));
    if (move) {
      const cost = me.infiniteStamina ? 0 : move.stamina;
      me.stamina = Math.max(0, me.stamina - cost);
      const res = strike(me, them, battle, rng, move);
      lines.push(describeStrike(res, 'You', them.name, move.name, rng, true));
    }
  } else if (actionId.startsWith('tech:')) {
    const tech = TECH_BY_ID[actionId.slice(5)];
    if (tech) {
      const e = tech.effect;
      me.ki = Math.max(0, me.ki - (e.kiCost || 0));
      if (e.heal || e.regen) {
        const amount = e.heal || Math.round(me.hpMax * e.regen);
        me.hp = clamp(me.hp + amount, 0, me.hpMax);
        lines.push(e.regen
          ? `Torn tissue closes over in seconds. (+${amount})`
          : `You put your own energy back into yourself. (+${amount})`);
      } else if (e.blind) {
        them.blinded = 2;
        lines.push(`${tech.name}. ${them.name} cannot see a thing for a moment.`);
      } else if (e.escape) {
        lines.push(`You lock onto a signature somewhere else and are simply gone.`);
        return { lines, over: true, outcome: finish(state, battle, rng, 'fled').outcome };
      } else if (e.drain || e.absorb) {
        // Absorption takes their energy rather than trading blows for it.
        const stolen = Math.round(Math.min(them.ki, 18 + (e.drain || 0.3) * 40));
        them.ki = Math.max(0, them.ki - stolen);
        me.ki = clamp(me.ki + stolen, 0, me.kiMax);
        const res = strike(me, them, battle, rng, { base: 6, hit: 0.9 });
        lines.push(`You take ${stolen} ki straight out of them. ${describeStrike(res, 'You', them.name, tech.name, rng, true)}`);
      } else if (e.multiplier) {
        me.basePower = Math.round(me.basePower * e.multiplier);
        me.hp = Math.max(1, me.hp - (e.healthCost || 8));
        lines.push(`${tech.name}. Everything multiplies, and your body starts paying for it.`);
      } else {
        if (e.healthCost) me.hp = Math.max(1, me.hp - e.healthCost);
        const res = strike(me, them, battle, rng, {
          base: e.atk || 8, hit: 0.82, pierce: (e.pierce || 0) > 0.5, crit: e.crit || 0, blast: true,
        });
        lines.push(describeStrike(res, 'You', them.name, tech.name, rng, true));
        if (e.healthCost) lines.push('It costs you as much as it costs them.');
      }
    }
  } else if (actionId === 'guard') {
    me.guarding = true;
    me.stamina = clamp(me.stamina + 22, 0, me.staminaMax);
    lines.push('You cover up and wait for it.');
  } else if (actionId === 'charge') {
    // Somebody far enough ahead in speed and power simply is not there when
    // the punch arrives. This is the whole point of Ultra Instinct.
    const edge = speedGap(me, them) * Math.pow(ratioOf(me, them, battle), 0.25);
    if (edge > 1.8 || (me.form && /Ultra Instinct/.test(me.formName || ''))) {
      me.ki = clamp(me.ki + 34 + Math.round(c.stats.kiControl * 0.4), 0, me.kiMax);
      lines.push(rng.pick([
        'You stand still and gather. They come, and you are not where they swing.',
        'You do not even watch them. Your body moves and the rest of you charges.',
        `${them.name} throws everything at where you were.`,
      ]));
      me.charged = Math.min(3, me.charged + 1);
      skipFoe = true;
    } else {
      me.ki = clamp(me.ki + 34, 0, me.kiMax);
      me.charged = Math.min(3, me.charged + 1);
      freeSwing = true;
      lines.push('You plant your feet and pull everything inward. The air goes tight.');
    }
  } else if (actionId === 'senzu') {
    if (c.senzu > 0) {
      c.senzu -= 1;
      me.hp = me.hpMax;
      me.ki = me.kiMax;
      me.stamina = me.staminaMax;
      lines.push('One bean. Everything closes at once.');
    }
  } else if (actionId === 'relocate') {
    battle.relocated = true;
    battle.civilians = false;
    battle.placeId = 'wastes';
    skipFoe = true;
    lines.push('You take hold of them and the city is simply not there any more. Bare rock, no witnesses, nothing left to break that matters.');
  } else if (actionId === 'flee') {
    const speedEdge = (c.stats.speed || 50) / 100 + (c.techniques.includes('instant_transmission') ? 1 : 0);
    const chance = clamp(0.25 + speedEdge * 0.4 - Math.log10(Math.max(1, ratioOf(them, me, battle))) * 0.2, 0.05, 0.95);
    if (rng.chance(chance)) {
      lines.push('You break off and go, and they do not follow.');
      return { lines, over: true, outcome: finish(state, battle, rng, 'fled').outcome };
    }
    lines.push('You turn to run and they are already in front of you.');
    them.stance = 'aggressive';
  } else if (actionId === 'surrender') {
    battle.surrendered = true;
    const merciful = rng.chance(0.55 + (c.karma > 30 ? 0.2 : 0) - (battle.stakes === 'lethal' ? 0.35 : 0));
    if (merciful) {
      lines.push(`${them.name} stops. Whatever this was, it is finished.`);
      return { lines, over: true, outcome: finish(state, battle, rng, 'yielded').outcome };
    }
    lines.push(`${them.name} does not accept it.`);
  }

  if (them.hp <= 0) {
    const parting = voiceLine(battle, rng, 'beaten');
    if (parting) lines.push(parting);
    lines.push(`${them.name} goes down and does not get back up.`);
    return { lines, over: true, outcome: finish(state, battle, rng, 'won').outcome };
  }

  if (!skipFoe) {
    if (freeSwing) lines.push(`${them.name} does not wait for you to finish.`);
    lines.push(...foeTurn(state, battle, rng));
    // Their turn can end the fight outright (a ring-out).
    if (battle.over) return { lines, over: true, outcome: battle.outcome };
  }

  if (me.hp <= 0) {
    lines.push('Everything goes white at the edges.');
    return { lines, over: true, outcome: finish(state, battle, rng, 'lost').outcome };
  }

  // They talk while it happens, which is most of what a Dragon Ball fight is.
  if (battle.round % 3 === 0) {
    const state2 = them.hp / them.hpMax;
    const said = voiceLine(battle, rng, state2 < 0.35 ? 'losing' : me.hp / me.hpMax < 0.45 ? 'winning' : 'hurt');
    if (said) lines.push(said);
  }

  applyUpkeep(me, lines);
  applyUpkeep(them, lines);
  battle.round += 1;
  battle.log.push(...lines);
  if (battle.log.length > 60) battle.log = battle.log.slice(-60);

  if (battle.round > 40) {
    lines.push('Neither of you can finish this. You break apart, both still standing.');
    return { lines, over: true, outcome: finish(state, battle, rng, 'draw').outcome };
  }

  return { lines, over: false, outcome: null };
}

/** A short readout for the UI header. */
export function battleStatus(battle) {
  return {
    round: battle.round,
    me: {
      hp: Math.round(battle.me.hp), ki: Math.round(battle.me.ki),
      stamina: Math.round(battle.me.stamina), kiMax: Math.round(battle.me.kiMax),
      form: battle.me.formName, stance: STANCES[battle.me.stance].name,
      power: Math.round(effectivePower(battle.me, battle)),
    },
    them: {
      name: battle.them.name,
      hp: Math.round(battle.them.hp), ki: Math.round(battle.them.ki),
      form: battle.them.formName, stance: STANCES[battle.them.stance].name,
      power: Math.round(effectivePower(battle.them, battle)),
      tier: powerTier(effectivePower(battle.them, battle)),
    },
    destruction: Math.round(battle.destruction),
    civilians: battle.civilians,
    gap: ratioOf(battle.me, battle.them, battle),
  };
}

export function describeMatchup(battle) {
  const r = ratioOf(battle.me, battle.them, battle);
  if (r > 30) return 'They are not in your class and you both know it.';
  if (r > 6) return 'You are clearly stronger.';
  if (r > 1.6) return 'You have the edge.';
  if (r > 0.62) return 'This is close to even.';
  if (r > 0.16) return 'They are stronger than you.';
  if (r > 0.02) return 'They are far beyond you. Tactics will not close this.';
  return 'This is suicide.';
}


/**
 * What the world does about a finished fight. Applied once, whether the fight
 * was played turn by turn or resolved headlessly.
 */
export function battleAftermath(state, rng, battle, opts = {}) {
  const c = state.character;
  const lines = [];
  const outcome = battle.outcome;

  state.stats.fights += 1;
  if (outcome === 'won') state.stats.wins += 1;
  else if (outcome === 'lost') state.stats.losses += 1;

  if (battle.zenkai) {
    lines.push(`Your body rebuilds heavier than it was. Power level up ${numberish(battle.zenkai)}.`);
  }

  // Clothes and kit take the same beating you do.
  const severity = battle.outcome === 'lost' ? 1.6 : battle.me.hp < 40 ? 1.2 : 0.6;
  for (const line of damageGear(c, rng, severity * (battle.stakes === 'spar' ? 0.4 : 1))) {
    lines.push(line);
  }

  // What the fight leaves on you. Regeneration closes almost everything; a
  // body that does not regenerate keeps a record of the fights it nearly lost.
  const scarred = markBody(state, rng, battle);
  if (scarred) lines.push(scarred);

  // Collateral. Fighting over a city is a choice, and it is remembered.
  if (battle.civilians && battle.destruction > 25) {
    const severity = battle.destruction > 70 ? 'most of a district' : 'several streets';
    const karma = -Math.round(battle.destruction / 6);
    c.karma = clamp(c.karma + karma, -100, 100);
    c.fame = clamp(c.fame + Math.round(battle.destruction / 12), 0, 100);
    c.flags.collateral = true;
    lines.push(`You fought it out over ${severity} of a populated place. People were in those buildings.`);
    if (battle.destruction > 55) c.flags.hunted_by_defenders = true;
  } else if (battle.relocated) {
    c.karma = clamp(c.karma + 4, -100, 100);
    lines.push('Nobody had to die for this one. That was your doing.');
  }

  if (outcome === 'won') {
    // How far the story travels depends on what you beat, not on you.
    const theirs = battle.them.basePower || 1;
    const scale = theirs > 1e12 ? DEED_SCALE.god_beaten
      : theirs > 1e8 ? DEED_SCALE.city
        : theirs > 1e5 ? DEED_SCALE.tournament : DEED_SCALE.street;
    const word = spreadWord(state, { scale });
    if (word.gained > 100000) {
      lines.push(`Word of this reaches about ${numberish(word.gained)} people who were not there.`);
    }
    c.fame = clamp(c.fame + (opts.fameGain ?? 4), 0, 100);
  } else if (outcome === 'lost' && battle.stakes === 'lethal' && rng.chance(0.55)) {
    return { lines, text: lines.join(' '), death: `Killed by ${battle.them.name}` };
  }

  // Whoever you fought, and why, decides what the fight changed.
  const ctxInfo = battle.context || {};
  const npc = ctxInfo.npcId ? state.npcs[ctxInfo.npcId] : (ctxInfo.canonId ? state.npcs['canon_' + ctxInfo.canonId] : null);
  if (npc) {
    npc.respect = clamp((npc.respect || 0) + (outcome === 'won' ? 16 : 22), 0, 100);
    npc.knowledge = Math.min(4, (npc.knowledge || 0) + 1);
    if (ctxInfo.reason === 'rival') {
      npc.tension = clamp(npc.tension + (outcome === 'won' ? -8 : 12), 0, 100);
      npc.power = Math.round(npc.power * (outcome === 'won' ? 1.15 : 1.3));
    }
    if (ctxInfo.reason === 'spar') {
      npc.closeness = clamp(npc.closeness + 8, 0, 100);
      npc.trust = clamp((npc.trust ?? 30) + 5, 0, 100);
    }
    if (outcome === 'won' && ctxInfo.reason !== 'spar') {
      // Beating somebody is the start of a relationship in this setting, not
      // the end of one. Half of them come back wanting a rematch as friends.
      if (npc.isCanon && rng.chance(0.5)) {
        npc.closeness = clamp(npc.closeness + 18, 0, 100);
        lines.push(`${npc.name} gets up, grins, and asks when you can do that again.`);
      } else if (rng.chance(0.3)) {
        npc.relation = 'rival';
        lines.push(`${npc.name} will be back, and better.`);
      }
    }
  }

  if (ctxInfo.timelineId && outcome === 'won') {
    state.world.divergences.push({ year: state.character.birthYear + c.age, event: ctxInfo.timelineId, how: 'you settled it' });
    if (['namek_war', 'golden_frieza'].includes(ctxInfo.timelineId)) state.world.flags.frieza_dead = true;
    if (ctxInfo.timelineId === 'androids') state.world.flags.gero_dead = true;
    if (ctxInfo.timelineId === 'cell_games') state.world.flags.cell_dead = true;
    if (ctxInfo.timelineId === 'buu_freed') state.world.flags.babidi_dead = true;
    c.karma = clamp(c.karma + 15, -100, 100);
    c.fame = clamp(c.fame + 25, 0, 100);
    lines.push('History will record this differently because you were standing there.');
  }

  return { lines, text: lines.join(' ') };
}

const SCAR_MARKS = ['scar_cheek', 'scar_brow', 'scar_chest', 'scar_arm', 'scar_eye', 'burn_arm', 'burn_face'];

function markBody(state, rng, battle) {
  const c = state.character;
  if (hasPerk(c, 'regeneration') || c.raceId === 'android') return null;
  const nearDeath = battle.me.hp <= 12 && battle.outcome !== 'fled';
  if (!nearDeath) return null;
  c.scars = c.scars || [];
  const have = new Set(c.scars.map((s) => s.mark));
  const from = battle.them.name;
  const year = c.birthYear + c.age;

  // Losing badly to something lethal can cost more than skin.
  if (battle.stakes === 'lethal' && battle.outcome === 'lost' && !have.has('missing_eye') && rng.chance(0.12)) {
    c.scars.push({ year, mark: 'missing_eye', from, text: `Lost an eye to ${from}.` });
    c.stats.speed = Math.max(1, c.stats.speed - 3);
    return `You lose the eye. ${from} does not even notice.`;
  }
  if (rng.chance(0.45)) {
    const open = SCAR_MARKS.filter((m) => !have.has(m));
    if (!open.length) return null;
    const mark = rng.pick(open);
    c.scars.push({ year, mark, from, text: `A scar from ${from}.` });
    return rng.pick([
      `It heals badly. You will carry ${from} on your skin for the rest of your life.`,
      `The cut does not close properly. A scar, then, and a story to go with it.`,
      `Something in that fight is going to show for good.`,
    ]);
  }
  return null;
}

/** Headless resolution, for the soak harness and for background fights. */
export function autoResolve(state, rng, battle) {
  let guard = 0;
  while (!battle.over && guard++ < 60) {
    const me = battle.me;
    const options = [];
    if (me.forms.length && !me.form && me.hp < 70) options.push('form:' + me.forms[me.forms.length - 1]);
    const kiMoves = me.techniques.filter((id) => {
      const t = TECH_BY_ID[id];
      return t && t.effect && t.effect.atk && (t.effect.kiCost || 0) <= me.ki;
    });
    if (kiMoves.length && rng.chance(0.4)) options.push('tech:' + rng.pick(kiMoves));
    if (me.hp < 25 && rng.chance(0.4)) options.push('guard');
    if (me.ki < 20 && rng.chance(0.5)) options.push('charge');
    options.push('phys:' + rng.pick(PHYSICAL).id);
    takeTurn(state, battle, rng, rng.pick(options));
  }
  if (!battle.over) {
    battle.over = true;
    battle.outcome = 'draw';
  }
  return battle;
}
