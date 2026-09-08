// The world moving on its own: the canon timeline, tournaments, the Dragon
// Balls, space, and the gods. The player can join in, ignore it, or change it,
// and the timeline records the divergence either way.

import { registerEvents, npcSlot } from '../generator.js';
import { clamp } from '../rng.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, meetCanon, canonHere,
  odds, killNpc, findNpc, scaledFoePower, moveTo, setWorldFlag, offerBattle, localMoney } from './helpers.js';
import { livingNpcs } from '../state.js';
import { fight, narrateFight, describeGap, runTournament, buildField } from '../combat.js';
import { combatPower, powerTier } from '../stats.js';
import { TIMELINE, isTournamentYear, worldPowerBaseline, eraName } from '../../data/timeline.js';
import { canonAvailable, canonUniverse } from '../../data/canon.js';
import { factionsPresent } from '../../data/factions.js';
import { claimStarship, shipOf } from '../settlement.js';
import { currencyFor, credit, formatMoney } from '../../data/currency.js';
import { startSurvival, survivalActions, survivalTurn, RULES } from '../survival.js';
import { ensureBallSet, ballsHeld, ballsOn, ballManifest, scatterAfterWish, ballsAreInert } from '../dragonballs.js';
import { getItem } from '../../data/items.js';
import { die } from '../lifecycle.js';
import { getPlace, PLACES } from '../../data/places.js';
import { generateFullName, generateEpithet } from '../../data/names.js';
import { getTechnique, TECHNIQUES } from '../../data/techniques.js';
import { numberish, ordinal } from '../text.js';
import { createTournament, autoRunTournament, settle } from '../tournament.js';


/**
 * The canon tournaments are tournaments, not disasters. Walking into the 23rd
 * World Martial Arts Tournament should put you in the draw, not in a lethal
 * fight with an unnamed finalist.
 */
const TIMELINE_TOURNAMENTS = {
  tournament_23: { formatId: 'wmat', purse: 500000, placeId: 'papaya' },
  tournament_25: { formatId: 'wmat', purse: 900000, placeId: 'papaya' },
  cell_games: { formatId: 'cell_games', purse: 0, placeId: 'wastes', size: 4 },
  u6_tournament: {
    formatId: 'invitational', purse: 0, placeId: 'tournament_u6', size: 6,
    name: 'The Tournament of Destroyers',
    // Universe 6 against Universe 7, chosen by two gods on a whim.
    canonFilter: (e) => true,
  },
  tournament_of_power: { formatId: 'top', purse: 0, placeId: 'top_arena', size: 12 },
};

/**
 * Whether anybody who would actually be on Universe 7's ten would bring you.
 * Being strong enough to survive it and being invited to it are different
 * questions - this one is about who vouches for you, not what you can do.
 */
function tournamentInvite(ctx) {
  const roster = canonAvailable(ctx.year, (c) => c.tags.some((t) => ['hero', 'rival', 'antihero', 'ally'].includes(t))
    && !c.tags.some((t) => ['divine', 'destroyer', 'angel', 'omniking', 'dragon'].includes(t)));
  const rosterIds = new Set(roster.map((c) => c.id));
  const knownWell = Object.values(ctx.state.npcs).some((n) => n.isCanon && n.alive
    && rosterIds.has(n.canonId) && (n.closeness || 0) > 40);
  // Famous or strong enough that the organisers went looking for you
  // specifically, the way they did for a handful of outsiders historically.
  const soughtOut = ctx.character.fame > 55 || combatPower(ctx.character) > worldPowerBaseline(ctx.year) * 3;
  // Training personally under your own universe's God of Destruction (or his
  // angel) is its own way onto the roster - he picks his own team.
  const godPicked = ctx.character.mentors.includes('beerus') || ctx.character.mentors.includes('whis');
  return knownWell || soughtOut || godPicked;
}

function timelineTournament(c2, ev) {
  const spec = TIMELINE_TOURNAMENTS[ev.id];
  if (!spec) return null;
  return createTournament(c2.state, c2.rng, {
    name: spec.name || ev.name,
    ...spec,
  });
}

/** Hand over N of the still-hidden balls, no searching required. */
function claimBalls(state, rng, count) {
  ensureBallSet(state, rng);
  const hidden = state.world.ballSet.balls.filter((b) => !b.found);
  for (const ball of rng.sample(hidden, count)) ball.found = true;
  return ballsHeld(state);
}

registerEvents([
  // Nobody claims this planet and nobody claims this fighter either - a real
  // threat with no faction, no canon story, and no name anybody back home
  // would recognise. Wild/uninhabited worlds (places.js's 'feral' tag) are
  // exactly where a life like that goes unnoticed for decades.
  {
    id: 'planet_legend', tags: ['world', 'legend', 'opportunity'], weight: 14,
    minBioAge: 12,
    when: (ctx) => !ctx.character.inAfterlife && ctx.place.tags.includes('feral'),
    slots: (ctx) => {
      const power = Math.max(1, Math.round(combatPower(ctx.character) * ctx.rng.float(2.2, 6)));
      const npc = stranger(ctx, { placeId: ctx.character.placeId, powerTarget: power, minAge: 30, maxAge: 90, relation: 'acquaintance' });
      npc.epithet = generateEpithet(ctx.rng);
      return { name: npc.name, epithet: npc.epithet, npcId: npc.id, power: npc.power };
    },
    title: (ctx, s) => `${s.name} ${s.epithet}`,
    text: `{Nobody out here has heard of you, and you have never heard of them either|`
      + `Whatever this place is, somebody has clearly been living in it a long time|`
      + `A name means nothing this far out}. [name] [epithet]. `
      + `{No faction claims them|Nobody sent them|They belong to nowhere in particular, which is its own kind of unsettling}. `
      + `{You clock the power before you clock the person|Something about them reads wrong for how quiet this place is|`
      + `This is not who you expected to find out here}.`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Test them', danger: true, effect: (c2, sl) => offerBattle(c2, {
        name: `${sl.name} ${sl.epithet}`, power: sl.power, npcId: sl.npcId, raceId: 'other',
      }, { reason: 'legend', stakes: 'serious', intro: 'Whoever they are, they do not ask what you want first.' }) },
      { id: 'approach', label: 'Approach carefully', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (!npc) return { text: 'They are already gone by the time you decide.', changes: [] };
        relate(c2, npc, { closeness: 12, respect: 10 });
        fact(c2, `Met ${npc.name} ${npc.epithet}, a legend nobody back home has heard of.`, { type: 'social', weight: 6, subject: npc.id, tags: ['legend'] });
        return { text: `{They let you close enough to talk|You do not draw on each other|Neither of you explains yourself}. `
          + `{They do not give you the real name, if that was ever it|You get a name and nothing behind it|It is not friendship, but it is not nothing}.`,
        changes: apply(c2, { happiness: 8 }) };
      } },
      { id: 'avoid', label: 'Leave them to it', effect: (c2) => ({
        text: `{Whatever that was, it is not your business|You do not need to know|Some things are better left where you found them}.`,
        changes: apply(c2, { happiness: 2 }),
      }) },
    ],
  },

  {
    id: 'timeline_event', noFatigue: true, tags: ['world', 'threat', 'cosmic'], weight: 400,
    // Every entry on this timeline is Universe 7's own history. A Universe 6
    // Saiyan on Sadala has no way to even hear that Raditz landed on Earth in
    // a universe that is not theirs, let alone decide whether to go - so this
    // does not fire for them at all unless the event is genuinely
    // cross-universe (scope: 'multiverse': the Tournament of Power, the
    // Tournament of Destroyers).
    when: (ctx) => {
      const myUniverse = ctx.character.universe || 7;
      return TIMELINE.some((t) => t.year === ctx.year
        && !ctx.state.world.resolved.includes(t.id)
        && !(t.cancelIf && ctx.state.world.flags[t.cancelIf])
        && (myUniverse === 7 || t.scope === 'multiverse'));
    },
    slots: (ctx) => {
      const myUniverse = ctx.character.universe || 7;
      const ev = ctx.forceEvId
        ? TIMELINE.find((t) => t.id === ctx.forceEvId)
        : TIMELINE.find((t) => t.year === ctx.year
          && !ctx.state.world.resolved.includes(t.id)
          && !(t.cancelIf && ctx.state.world.flags[t.cancelIf])
          && (myUniverse === 7 || t.scope === 'multiverse'));
      if (!ev) return null;
      const here = getPlace(ctx.character.placeId);
      // A spaceship does not cross universes - ordinary travel tech only
      // matters for a character already in Universe 7. Everyone else's only
      // way in is a genuinely cross-universe event, gated below by actually
      // being invited rather than by reachability at all.
      const canGetThere = ev.scope === 'multiverse'
        || (myUniverse === 7 && (ev.planet === here.planet || ev.planet === 'void'
          || ctx.character.items.includes('spaceship') || ctx.character.techniques.includes('instant_transmission')));
      // Getting to the Null Realm is not a travel problem. It only takes
      // fighters somebody already picked, so being there at all needs
      // somebody from that roster to actually bring you - being fast enough
      // to arrive is not the same question as being invited.
      const invited = ev.id !== 'tournament_of_power' || tournamentInvite(ctx);
      const reachable = canGetThere && invited;
      return { evId: ev.id, evName: ev.name, evBlurb: ev.blurb, evThreat: ev.threat, reachable, invited, canGetThere };
    },
    title: (ctx, s) => s.evName,
    text: (ctx, s) => `[evBlurb] ${s.reachable
      ? `{You could be there in a day|You are close enough to reach it|Nothing is stopping you but sense}.`
      : (s.canGetThere && !s.invited)
        ? `{Getting there is not the problem. Nobody picked you|You are strong enough to go and nobody asked you to|`
          + `There is a roster, and your name is not on it, and nobody close enough to you put it there}.`
        : `{It is happening a long way from here|You hear about it days late|You have no way to get there}.`}
      ${describeGap(combatPower(ctx.character), s.evThreat)}`,
    choices: (ctx, s) => {
      const list = [];
      const child = ctx.age < 12;
      if (child) {
        // A child lives through a saga rather than fighting in it, but they are
        // still there, and what they do still matters to them later.
        list.push({
          id: 'child_witness', label: 'Watch it happen',
          effect: (c2, sl) => {
            const ev = TIMELINE.find((t) => t.id === sl.evId);
            c2.state.world.resolved.push(ev.id);
            c2.character.flags.witnessed_saga = true;
            const changes = apply(c2, { happiness: -10, stats: { discipline: 3 } });
            fact(c2, `Was a child when ${ev.name} happened, and saw it.`,
              { type: 'history', weight: 6, tags: ['witness', 'origin'] });
            return { text: `{You are too small to do anything but look|Somebody holds you back|You watch from a doorway}. {You will remember every second of this|It goes in and it does not come out|Nobody explains it to you}. #dread#`, changes };
          },
        });
        list.push({
          id: 'child_hide', label: 'Hide, and survive it',
          effect: (c2, sl) => {
            const ev = TIMELINE.find((t) => t.id === sl.evId);
            c2.state.world.resolved.push(ev.id);
            const changes = apply(c2, { happiness: -6, health: -4, stats: { intellect: 2, speed: 2 } });
            fact(c2, `Survived ${ev.name} by staying out of sight.`, { type: 'history', weight: 5, tags: ['witness'] });
            return { text: `{You get underground|You do not move for two days|Somebody puts you somewhere safe and does not come back for you}. {It ends|Eventually it is quiet|You come out into a different world}.`, changes };
          },
        });
        if (s.reachable) {
          list.push({
            id: 'child_run_toward', label: 'Run toward it anyway', danger: true,
            effect: (c2, sl) => {
              const ev = TIMELINE.find((t) => t.id === sl.evId);
              c2.state.world.resolved.push(ev.id);
              const hurt = odds(c2, 0.6);
              c2.character.flags.brink_of_death = hurt || c2.character.flags.brink_of_death;
              const changes = apply(c2, { health: hurt ? -45 : -12, happiness: -8, karma: 6, stats: { durability: 4, discipline: 4 } });
              fact(c2, `Ran toward ${ev.name} as a child and lived.`, { type: 'history', weight: 7, tags: ['witness', 'origin'] });
              return { text: `{You are eight and you run at it|Nobody can stop you|You do not think about it}. ${hurt ? '{It nearly kills you|You wake up much later|Somebody drags you out of the rubble}.' : '{You get closer than anyone expected|You see it properly|You are not hurt, which is luck and nothing else}.'}`, changes };
            },
          });
        }
        return list;
      }
      // A tournament has a draw and officials checking it, not just a threat
      // you can choose to walk into - old enough to survive a fight is not
      // the same question as old enough to be entered in a bracket. Nothing
      // else on the timeline (an invasion, a threat arriving) works that way,
      // so this only touches the tournament entries.
      const isTournament = s.reachable && !!TIMELINE_TOURNAMENTS[s.evId];
      const tooYoungForDraw = isTournament && ctx.bioAge < 14;
      if (s.reachable && tooYoungForDraw) {
        list.push({
          id: 'too_young_for_draw', label: 'Watch from the stands',
          effect: (c2, sl) => {
            const ev = TIMELINE.find((t) => t.id === sl.evId);
            c2.state.world.resolved.push(ev.id);
            const changes = apply(c2, { happiness: -4, stats: { discipline: 2 } });
            fact(c2, `Was too young for the draw at ${ev.name} and watched instead.`, { type: 'history', weight: 4, tags: ['witness'] });
            return { text: `{The officials take one look at you and shake their heads|Nobody says it outright, but you are not old enough for this draw|You watch the bracket fill in without your name in it}. ${describeGap(combatPower(ctx.character), s.evThreat)}`, changes };
          },
        });
      }
      if (s.reachable && !tooYoungForDraw) {
        list.push({
          id: 'intervene',
          label: TIMELINE_TOURNAMENTS[s.evId] ? 'Enter it' : 'Go. Put yourself in the middle of it.',
          danger: !TIMELINE_TOURNAMENTS[s.evId],
          hint: TIMELINE_TOURNAMENTS[s.evId]
            ? 'Fight the draw, round by round.'
            : describeGap(combatPower(ctx.character), s.evThreat),
          effect: (c2, sl) => {
            const ev = TIMELINE.find((t) => t.id === sl.evId);
            c2.state.world.resolved.push(ev.id);
            fact(c2, `Walked into ${ev.name}.`, { type: 'history', weight: 6, tags: ['witness'] });

            // The Tournament of Power is not a bracket and never was. It gets
            // its own board: one stage, forty-eight minutes, ring-out only.
            if (ev.id === 'tournament_of_power') {
              const board = startSurvival(c2.state, c2.rng, {});
              const opener = `${ev.blurb} ${RULES[0]} ${RULES[3]}`;
              if (!c2.state.autoBattle) return { text: opener, survival: board };
              let guard = 0;
              while (!board.over && guard++ < 80) {
                const acts = survivalActions(board);
                if (!acts.length) break;
                survivalTurn(c2.state, board, c2.rng, c2.rng.pick(acts).id);
              }
              if (board.outcome === 'erased') {
                return { text: `${opener} ${board.log.slice(-1)[0]}`, outcome: { death: 'Erased with Universe 7' } };
              }
              return { text: `${opener} ${board.log.slice(-2).join(' ')}` };
            }

            const bracket = timelineTournament(c2, ev);
            if (bracket) {
              const opener = `${ev.blurb} You put your name in.`;
              if (!c2.state.autoBattle) return { text: opener, tournament: bracket };
              autoRunTournament(c2.state, c2.rng, bracket);
              const out = settle(c2.state, bracket, c2.rng);
              if (out.erased) return { text: `${opener} ${out.text}`, outcome: { death: 'Erased with Universe 7' } };
              return { text: `${opener} ${out.text}` };
            }

            // A warlord with tanks does not open with a Kamehameha.
            const kit = ev.threat > 1e8 ? ['ki_blast', 'death_beam', 'death_ball']
              : ev.threat > 1e4 ? ['ki_blast', 'galick_gun']
                : ev.threat > 500 ? ['ki_blast', 'dodon_ray'] : [];
            return offerBattle(c2, {
              name: ev.foe || ev.name, power: ev.threat, raceId: 'other', techniques: kit,
            }, {
              reason: 'saga', timelineId: ev.id, stakes: 'lethal', protecting: true,
              intro: `${ev.blurb} You are standing in it.`,
            });
          },
        });
        list.push({
          id: 'support', label: 'Help without being a hero',
          effect: (c2, sl) => {
            const ev = TIMELINE.find((t) => t.id === sl.evId);
            c2.state.world.resolved.push(ev.id);
            const changes = apply(c2, { karma: 12, health: -10, fame: 5, happiness: 3 });
            fact(c2, `Was on the ground during ${ev.name}, getting people out.`, { type: 'history', weight: 5, tags: ['witness', 'hero'] });
            return { text: `You {evacuate|hold a line that does not matter|carry people|keep the ones who can still be saved alive}. {History remembers somebody else|Nobody writes your name down|You are fine with that}.`, changes };
          },
        });
      }
      list.push({
        id: 'watch', label: s.reachable ? 'Stay out of it' : 'Watch it from here',
        effect: (c2, sl) => {
          const ev = TIMELINE.find((t) => t.id === sl.evId);
          c2.state.world.resolved.push(ev.id);
          const changes = apply(c2, { happiness: -6 });
          fact(c2, `${ev.name}. Watched it happen.`, { type: 'history', weight: 3, tags: ['witness'] });
          return { text: `{It happens without you|You watch the broadcasts|You feel the ki from here and do nothing}. #dread#`, changes };
        },
      });
      list.push({
        id: 'train', label: 'Use the year to get stronger',
        effect: (c2, sl) => {
          const ev = TIMELINE.find((t) => t.id === sl.evId);
          c2.state.world.resolved.push(ev.id);
          const t = trainYear(c2, { intensity: 1.6 });
          const changes = apply(c2, { health: -10, happiness: -8, stats: { discipline: 4 } });
          return { text: `{You do not go|You train instead|Somebody else's problem}. {The world nearly ends and you are in a canyon, throwing punches|You tell yourself this is the useful thing|It might even be true}. ${powerLine(t.gained)}`, changes };
        },
      });
      // When the gap is hopeless, the reckless option stops being the default
      // one under the reader's thumb.
      // A saga you cannot survive should not have "walk into it" sitting under
      // the reader's thumb as the default option.
      if (combatPower(ctx.character) < s.evThreat * 0.3) {
        const idx = list.findIndex((c) => c.id === 'intervene');
        if (idx > -1) list.push(list.splice(idx, 1)[0]);
      }
      return list;
    },
  },

  {
    id: 'tournament', noFatigue: true, tags: ['world', 'tournament', 'fame'], weight: 40,
    minBioAge: 10,
    when: (ctx) => isTournamentYear(ctx.year) && ctx.place.planet === 'earth' && !ctx.character.inAfterlife,
    slots: (ctx) => ({
      num: Math.floor((ctx.year - 750) / 3) + 21,
      purse: 500000 + Math.floor((ctx.year - 750) * 30000),
    }),
    title: (ctx, s) => `The ${ordinal(s.num)} World Martial Arts Tournament`,
    text: `{The posters go up in spring|It comes round again|Papaya Island, same as always}.
      {Everyone who thinks they are somebody will be there|The prize is [purse] Zeni|Somebody non-human always enters and pretends otherwise}.`,
    choices: (ctx, s) => [
      { id: 'enter', label: 'Enter', hint: 'Fight the draw yourself', effect: (c2, sl) => {
        // A real bracket, seeded from who is alive and fighting in this year.
        // The UI takes over from here and hands the year back afterwards.
        const t = createTournament(c2.state, c2.rng, {
          formatId: 'wmat',
          purse: sl.purse,
          edition: sl.num,
          name: `The ${ordinal(sl.num)} World Martial Arts Tournament`,
          placeId: 'papaya',
        });
        const opener = `{You put your name down|You sign the sheet|They spell it wrong on the board and you let them}. `
          + `The draw goes up an hour later.`;
        if (!c2.state.autoBattle) return { text: opener, tournament: t };
        // Headless: run the same bracket, same odds, no screen.
        autoRunTournament(c2.state, c2.rng, t);
        const out = settle(c2.state, t, c2.rng);
        if (out.won) {
          fact(c2, `Won the ${ordinal(sl.num)} World Martial Arts Tournament.`, { type: 'tournament', weight: 8, tags: ['fame', 'milestone'] });
        } else {
          fact(c2, `${out.placement === 2 ? 'Runner-up' : ordinal(out.placement) + ' place'} at the ${ordinal(sl.num)} tournament.`, { type: 'tournament', weight: 3, tags: ['fame'] });
        }
        return { text: `${opener} ${out.text}`, changes: [] };
      } },
      { id: 'watch', label: 'Watch from the stands', effect: (c2) => {
        const changes = apply(c2, { happiness: 6, stats: { technique: 3, intellect: 2 } });
        return { text: `{You learn more watching than fighting, some years|You take notes|Somebody in the third round does something you have never seen and you spend two years working out how}.`, changes };
      } },
      { id: 'skip', label: 'Skip it', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.2 });
        return { text: `{Tournaments are for people who need an audience|You have work to do|Not this year}. ${powerLine(t.gained)}`, changes: [] };
      } },
    ],
  },

  {
    id: 'dragonball_rumour', tags: ['world', 'dragonball', 'opportunity', 'revival'],
    weight: (ctx) => 20 + ballsHeld(ctx.state) * 10,
    minBioAge: 9,
    when: (ctx) => ballsHeld(ctx.state) < 7 && !ctx.character.inAfterlife && !ballsAreInert(ctx.state),
    slots: (ctx) => {
      const set = ensureBallSet(ctx.state, ctx.rng);
      const hidden = set.balls.filter((b) => !b.found && !b.surveyed);
      if (!hidden.length) return null;
      const ball = ctx.rng.pick(hidden);
      return { star: ball.star, ballName: ball.name, where: getPlace(ball.placeId).name, region: ball.region };
    },
    title: 'Word of One of Them',
    text: `You hear it from #rumourSource#: [ballName], {on|somewhere on} [where], in [region].
      {They could be lying|It matches two other stories you have heard|It is the first solid thing anyone has said}.`,
    choices: (ctx, s) => [
      { id: 'note', label: 'Mark it down', hint: 'It goes on your manifest. Going there is another matter.',
        effect: (c2, sl) => {
          const set = c2.state.world.ballSet;
          const ball = set.balls.find((b) => b.star === sl.star);
          if (ball) ball.surveyed = true;
          const changes = apply(c2, { stats: { intellect: 1 }, zeni: -2000 });
          fact(c2, `Learned that ${sl.ballName} is on ${sl.where}.`, { type: 'dragonball', weight: 2, tags: ['dragonball'] });
          return { text: `{You write it down|You pay for the rest of the story|You buy them a drink and get the region out of them}. ${sl.ballName}: ${sl.where}, ${sl.region}.`, changes };
        } },
      { id: 'ignore', label: 'Wishes cause trouble', effect: (c2) => ({
        text: `{You have seen what people wish for|Let somebody else be tempted|Not your business}.`,
        changes: apply(c2, { karma: 3 }),
      }) },
    ],
  },

  {
    id: 'dragonball_cache', tags: ['world', 'dragonball', 'opportunity', 'revival'],
    weight: (ctx) => (ballsHeld(ctx.state) >= 2 ? 20 : 7),
    minBioAge: 10,
    when: (ctx) => ballsHeld(ctx.state) < 7 && !ctx.character.inAfterlife && !ballsAreInert(ctx.state),
    slots: (ctx) => ({
      who: ctx.rng.pick(['a collector with a very good safe', 'a small emperor with a big robot',
        'a museum that does not know what it has', 'a cult that has been gathering them for a century',
        'a dying scavenger who wants one thing in return', 'a Frieza Force quartermaster with a price']),
      count: Math.min(7 - ballsHeld(ctx.state), ctx.rng.int(1, 2)),
    }),
    title: 'Somebody Else Has Been Collecting',
    text: `[who:cap] has [count] of them. {They are not hidden well|They are hidden extremely well|They are on display, which is insulting}.
      {You have [count] short of a wish|This would change the arithmetic|It would be most of the way there}.`,
    choices: (ctx, s) => [
      { id: 'take', label: 'Take them', danger: true, effect: (c2, sl) => {
        if (odds(c2, 0.55 + c2.character.stats.speed / 400)) {
          claimBalls(c2.state, c2.rng, sl.count);
          const changes = apply(c2, { karma: -8, health: -8, fame: 3 });
          fact(c2, `Took ${sl.count} Dragon Balls from ${sl.who}.`, { type: 'dragonball', weight: 4, tags: ['dragonball', 'crime'] });
          return { text: `{You are in and out in a minute|It is louder than you planned|Nobody stops you}. ${ballsHeld(c2.state)} of seven.`, changes };
        }
        const foe = stranger(c2, { relation: 'enemy', tension: 60, powerTarget: scaledFoePower(c2, 1.1), metHow: 'dragonball' });
        const changes = apply(c2, { health: -18, karma: -6 });
        return { text: `{They were ready for you|There is a guard you did not count|An alarm nobody could hear}. ${foe.name} {gets in the way|takes your face down for reference|will remember this}.`, changes };
      } },
      { id: 'trade', label: 'Buy or bargain for them', effect: (c2, sl) => {
        const price = c2.rng.int(300000, 3000000);
        if (c2.character.zeni >= price) {
          claimBalls(c2.state, c2.rng, sl.count);
          const changes = apply(c2, { zeni: -price, karma: 2 });
          fact(c2, `Bought ${sl.count} Dragon Balls for ${localMoney(c2, price)}.`, { type: 'dragonball', weight: 3, tags: ['dragonball'] });
          return { text: `${localMoney(c2, price)}. {It is robbery and you pay it|You do not haggle|They throw in a bag}. ${ballsHeld(c2.state)} of seven.`, changes };
        }
        if (odds(c2, 0.35 + c2.character.stats.charisma / 250)) {
          claimBalls(c2.state, c2.rng, 1);
          const changes = apply(c2, { karma: 4, happiness: 4 });
          return { text: `{You have nothing like ${localMoney(c2, price)}|You offer something else|You do them a favour instead}. They part with one. ${ballsHeld(c2.state)} of seven.`, changes };
        }
        return { text: `{The price is ${localMoney(c2, price)}|You cannot come close|They laugh you out of the building}.`, changes: [] };
      } },
      { id: 'leave', label: 'Leave it alone', effect: (c2) => ({
        text: `{Somebody always wants a wish|You have seen how that ends|Not your business}.`, changes: apply(c2, { karma: 3 }),
      }) },
    ],
  },

  {
    id: 'space_offer', tags: ['world', 'travel', 'opportunity', 'cosmic'], weight: 12,
    minBioAge: 14,
    when: (ctx) => ctx.place.planet === 'earth' && !ctx.character.inAfterlife,
    slots: (ctx) => {
      const dest = ctx.rng.pick(PLACES.filter((p) => p.planet !== 'earth' && p.planet !== 'otherworld' && p.planet !== 'void'));
      return { destId: dest.id, destName: dest.name, destDesc: dest.desc };
    },
    title: 'Off-World',
    text: `{A ship needs crew|Somebody offers passage|You could build one, with the right help}: [destName].
      [destDesc] {It would be years|Nobody here would know where you went|You would be a very long way from anything familiar}.`,
    choices: (ctx, s) => [
      { id: 'go', label: `Go to ${s.destName}`, effect: (c2, sl) => {
        moveTo(c2, sl.destId);
        const t = trainYear(c2, { intensity: 1.3 });
        const changes = apply(c2, { happiness: 8, health: -6, zeni: -c2.rng.int(0, 200000), stats: { intellect: 3, discipline: 3 } });
        fact(c2, `Left the planet for ${sl.destName}.`, { type: 'travel', weight: 5, tags: ['travel', 'cosmic'] });
        return { text: `{The trip takes months|You sleep most of it|The gravity is wrong when you land and stays wrong}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'stay', label: 'Stay', effect: (c2) => ({ text: `{Not yet|There are people here|You watch it leave}.`, changes: [] }) },
    ],
  },

  {
    id: 'divine_notice', tags: ['world', 'cosmic', 'divine'], weight: 14,
    when: (ctx) => combatPower(ctx.character) > worldPowerBaseline(ctx.year) * 0.06 && ctx.year >= 770,
    slots: (ctx) => {
      // Your own universe's gods, not somebody else's - Beerus has no reason
      // to notice a Universe 6 fighter.
      const myUniverse = ctx.character.universe || 7;
      const gods = canonAvailable(ctx.year, (c) => c.tags.includes('divine') && !c.tags.includes('omniking')
        && canonUniverse(c) === myUniverse);
      const g = gods.length ? ctx.rng.pick(gods) : null;
      if (!g) return null;
      return { godId: g.id, godName: g.name, godPersona: g.personality, godQuirk: g.quirk };
    },
    title: (ctx, s) => `${s.godName} Has Noticed You`,
    text: `{You feel it before you see anything|The air pressure changes|Everything goes very quiet}.
      [godName]. [godPersona] [godQuirk]`,
    choices: (ctx, s) => {
      const destroyerGod = (canonAvailable(ctx.year, (c) => c.id === s.godId)[0] || {}).tags?.includes('destroyer');
      const base = [
      { id: 'bow', label: 'Show respect', effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.godId, 'acquaintance');
        relate(c2, npc, { closeness: 12, respect: 15 });
        const changes = apply(c2, { happiness: 6, karma: 4, stats: { discipline: 3 } });
        fact(c2, `${npc.name} took an interest.`, { type: 'divine', weight: 6, subject: npc.id, tags: ['divine'] });
        return { text: `{You do the correct thing|You go to one knee before you decide to|You say nothing, which is right}. ${npc.name} {is amused|says something you will think about for years|leaves without another word}.`, changes };
      } },
      { id: 'ask', label: 'Ask them to train you', effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.godId, 'acquaintance');
        const canon = sl.godId;
        const worthy = combatPower(c2.character) > worldPowerBaseline(c2.year) * 0.25
          && c2.character.stats.discipline > 55;
        if (worthy && odds(c2, 0.45)) {
          c2.character.mentors.push(canon);
          npc.relation = 'mentor';
          if (canon === 'whis') c2.character.flags.angel_training = true;
          if (canon === 'beerus') c2.character.flags.destroyer_training = true;
          relate(c2, npc, { closeness: 20, respect: 30 });
          const t = trainYear(c2, { intensity: 1.6, mentorMult: 2.4, placeMult: 3 });
          const changes = apply(c2, { health: -25, happiness: 15, stats: { kiControl: 8, discipline: 6 } });
          fact(c2, `Trained under ${npc.name}.`, { type: 'mentor', weight: 9, subject: npc.id, tags: ['divine', 'mentor'] });
          const lines = [`{They agree, which surprises everyone including them|"Very well"|There is a condition and you meet it}. The training is {nothing like training|mostly being hit while doing chores|not survivable by most people}. ${powerLine(t.gained)}`];
          // Beerus and Whis are never anywhere apart from each other.
          const companion = canon === 'beerus' ? 'whis' : canon === 'whis' ? 'beerus' : null;
          if (companion && !c2.character.mentors.includes(companion)
            && !Object.values(c2.state.npcs).some((n) => n.canonId === companion && n.alive)) {
            const other = meetCanon(c2, companion, 'acquaintance');
            relate(c2, other, { closeness: 8, respect: 8 });
            lines.push(`${other.name} is there too, the way ${other.name} always is.`);
          }
          return { text: lines.join(' '), changes };
        }
        relate(c2, npc, { respect: -5 });
        const changes = apply(c2, { happiness: -8 });
        return { text: `{They laugh|"No"|They look at you the way you would look at an insect asking for directions}. {Come back stronger|It is not a refusal so much as a fact|You are not worth the time yet}.`, changes };
      } },
      { id: 'defy', label: 'Stand your ground', danger: true, effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.godId, 'acquaintance');
        // Standing up to a god is about the gap, not a flat dice roll.
        const gap = combatPower(c2.character) / Math.max(1, npc.power);
        if (odds(c2, 0.05 + Math.min(0.85, gap * 0.9))) {
          relate(c2, npc, { respect: 35, closeness: 8 });
          const changes = apply(c2, { fame: 10, happiness: 12, stats: { discipline: 4 } });
          fact(c2, `Stood up to ${npc.name} and was not erased for it.`, { type: 'divine', weight: 8, subject: npc.id, tags: ['divine', 'legend'] });
          return { text: `{You do not move|You say no to a god|Everyone else in the room stops breathing}. ${npc.name} {is delighted|stares, then laughs|says "interesting" and that is the whole conversation}.`, changes };
        }
        // A God of Destruction erases things for less than this. Standing
        // your ground against one and losing badly is a real death, not a
        // beating - the gods who are not destroyers mostly just hurt you.
        const destroyer = (canonAvailable(c2.year, (c) => c.id === sl.godId)[0] || {}).tags?.includes('destroyer');
        if (destroyer && gap < 0.02 && odds(c2, 0.12)) {
          fact(c2, `Erased by ${npc.name} for the insolence of it.`, { type: 'death', weight: 10, subject: npc.id, tags: ['divine', 'death'] });
          die(c2.state, `Erased by ${npc.name}`);
          return { text: `{There is no warning|One motion, unhurried|You do not finish the sentence you were saying}. ${npc.name} does not raise their voice. There is simply less of you than there was.`, changes: [] };
        }
        const changes = apply(c2, { health: -55, happiness: -10 });
        return { text: `{You do not see the movement|There is no fight|One gesture}. {You are through a wall and most of a hillside|You wake up much later|It is not even close to a contest}.`, changes };
      } },
      ];
      // A God of Destruction can be reached through his stomach in a way no
      // other kind of god can. Nobody offers Zeno a snack.
      if (!destroyerGod) return base;
      return base.concat([{ id: 'feed', label: 'Offer them food', effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.godId, 'acquaintance');
        const cost = c2.rng.int(5000, 80000);
        // A god's palate is not moved by luck or charm nearly as much as by
        // whether the food is actually good, which is what cookingSkill tracks.
        const skill = c2.character.flags.cookingSkill || 0;
        const great = odds(c2, 0.1 + skill / 130 + (c2.character.luck || 50) / 500 + (c2.character.stats.charisma || 50) / 600);
        // Cooking for a god who has eaten everything is itself an education.
        c2.character.flags.cookingSkill = clamp(skill + c2.rng.int(1, 3), 0, 100);
        if (great) {
          relate(c2, npc, { closeness: 25, respect: 20 });
          if (!c2.character.mentors.includes(sl.godId)) c2.character.mentors.push(sl.godId);
          npc.relation = 'mentor';
          if (sl.godId === 'whis') c2.character.flags.angel_training = true;
          if (sl.godId === 'beerus') c2.character.flags.destroyer_training = true;
          const changes = apply(c2, { happiness: 14, zeni: -cost });
          fact(c2, `Fed ${npc.name} something he had never had before.`, { type: 'divine', weight: 8, subject: npc.id, tags: ['divine', 'mentor'] });
          return { text: `{He takes one bite and goes completely silent|His eyes actually open|"...more"}. {This is apparently how you get taken seriously by a god|Whatever that was, it worked|You have his full, undivided attention now, for entirely the right reason}.`, changes };
        }
        relate(c2, npc, { closeness: 6 });
        const changes = apply(c2, { happiness: 2, zeni: -Math.round(cost * 0.4) });
        return { text: `{He eats it without much comment|"Adequate"|Not bad, but not memorable}. {You have not been erased, which is something|It is not the reaction you were hoping for|Try again some other year, with something better}.`, changes };
      } }]);
    },
  },

  // The one being in existence who outranks every god you could already be
  // training under, and the only path to becoming an angel that does not
  // run through simply being born one. Reusing flags.angel_training rather
  // than inventing a parallel flag: Whis already sets it on his own "ask
  // them to train you"/feed-him branches in divine_notice above, and it was
  // never actually read anywhere until now.
  {
    id: 'grand_priest_notice', tags: ['world', 'cosmic', 'divine'], weight: 5,
    when: (ctx) => ctx.year >= 779 && !ctx.character.flags.angel_training
      && combatPower(ctx.character) > worldPowerBaseline(ctx.year) * 1.5
      && ctx.character.mentors.some((m) => (canonAvailable(ctx.year, (c) => c.id === m)[0] || {}).tags?.includes('divine')),
    slots: () => ({}),
    title: 'The Grand Priest Is Watching',
    text: `No warning, no pressure change, nothing to feel coming. He is simply there when you turn around, exactly as composed as everyone says.
      Second only to the Omni-Kings. Father to every angel serving every God of Destruction. He has, apparently, been watching you train for some time.`,
    choices: () => [
      { id: 'accept', label: 'Accept, if he is offering', effect: (c2) => {
        const npc = meetCanon(c2, 'grand_priest', 'mentor');
        c2.character.mentors.push('grand_priest');
        c2.character.flags.angel_training = true;
        relate(c2, npc, { closeness: 15, respect: 30 });
        const t = trainYear(c2, { intensity: 1.7, mentorMult: 3, placeMult: 2 });
        const changes = apply(c2, { happiness: 22, stats: { kiControl: 10, discipline: 8, technique: 6 } });
        fact(c2, 'Taken on as an angel in training by the Grand Priest himself.',
          { type: 'divine', weight: 10, subject: npc.id, tags: ['divine', 'mentor', 'angel'] });
        return { text: `{"Very well," he says, as if you had asked him to pass the salt|There is no ceremony to it - one moment you are a student, the next you simply are one|He does not explain the terms. He never does}. `
          + `{Training under him is not like training under anyone else - there is no anger in it, no theatre, only correction, applied precisely and without end|`
          + `You stop counting the ways you are wrong within the first hour|Whatever you thought discipline meant, it did not mean this}. ${powerLine(t.gained)}`,
        changes };
      } },
      { id: 'decline', label: 'This is not for you', effect: (c2) => {
        const npc = meetCanon(c2, 'grand_priest', 'acquaintance');
        relate(c2, npc, { respect: 12 });
        const changes = apply(c2, { happiness: 4, karma: 2 });
        fact(c2, 'Turned down the Grand Priest, of all people.', { type: 'divine', weight: 7, subject: npc.id, tags: ['divine'] });
        return { text: `{"As you wish," and he means it - there is no judgement in it at all|He seems, if anything, faintly pleased that you thought about it first|"Most do not ask themselves that question. You should keep doing that."} `
          + `{He is gone the way he arrived - between one blink and the next|`
          + `You are fairly sure the conversation happened, afterwards|Nobody else saw any of it}.`,
        changes };
      } },
      { id: 'defy', label: 'Ignore him and keep training', danger: true, effect: (c2) => {
        const npc = meetCanon(c2, 'grand_priest', 'acquaintance');
        // There is no gap formula that makes this survivable on its own
        // merits - it survives entirely on his own restraint, which the text
        // says plainly rather than dressing up as a fair fight.
        if (odds(c2, 0.9)) {
          relate(c2, npc, { respect: 8 });
          const changes = apply(c2, { happiness: -6 });
          return { text: `{Nothing happens. He watches you finish the set and leaves without another word|`
            + `"Interesting," he says, and that is the entire consequence of it|He does not appear to have taken any offence, which is somehow worse}.`,
          changes };
        }
        fact(c2, 'Erased for being rude to the Grand Priest.', { type: 'death', weight: 10, subject: npc.id, tags: ['divine', 'death'] });
        die(c2.state, 'Erased by the Grand Priest, politely');
        return { text: `{He does not raise his voice|There is no gesture to see, only the result of one|"That was unwise," he says, to nobody, since there is nobody left to say it to}.`, changes: [] };
      } },
    ],
  },

  // Something big enough to travel through space does not sit unguarded -
  // whoever it belongs to sends people, and how that goes depends on what
  // kind of person that turns out to be. Modelled as one resolved choice
  // rather than a full interactive fight: the stakes (their reputation,
  // whether you keep the thing, whether you come back at all) are exactly
  // what the user asked for, without needing the battle system to carry a
  // second, parallel notion of "who owns this and what happens after".
  {
    id: 'steal_starship', tags: ['world', 'opportunity', 'danger'], weight: 6,
    minBioAge: 16,
    when: (ctx) => !ctx.character.inAfterlife
      && combatPower(ctx.character) > worldPowerBaseline(ctx.year) * 0.15,
    slots: (ctx) => {
      const wanted = ctx.rng.chance(0.3);
      const here = getPlace(ctx.character.placeId);
      const factions = factionsPresent(ctx.year, here.planet, ctx.character.universe || 7).filter((f) => f.recruits);
      const ownerFaction = factions.length && ctx.rng.chance(0.35) ? ctx.rng.pick(factions) : null;
      const ownerPower = Math.round(worldPowerBaseline(ctx.year) * ctx.rng.float(0.25, 1.5));
      const ownerName = generateFullName(ctx.rng, ctx.rng.pick(['other', 'earthling', 'frostdemon', 'saiyan', 'namekian']));
      return { wanted, ownerFactionId: ownerFaction?.id, ownerFactionName: ownerFaction?.name, ownerName, ownerPower };
    },
    title: 'A Structure That Should Not Be There',
    text: (ctx, s) => `Something the size of a building, and it flies. ${s.ownerFactionName
      ? `The markings on the hull say ${s.ownerFactionName}.`
      : `No markings. Somebody rich enough not to need any.`}
      {Whoever this belongs to did not leave it unguarded|There will be people aboard, and they will not be reasonable about this|A thing like this does not sit here by accident}.`,
    choices: (ctx, s) => [
      { id: 'raid', label: 'Try to take it', danger: true, effect: (c2, sl) => {
        const gap = combatPower(c2.character) / Math.max(1, sl.ownerPower);
        const winChance = clamp(0.15 + gap * 0.42, 0.05, 0.92);
        if (odds(c2, winChance)) {
          const keeps = odds(c2, 0.35) && !shipOf(c2.state);
          if (keeps) {
            claimStarship(c2.state, c2.rng, { name: sl.ownerFactionName ? `The ${sl.ownerFactionName} vessel` : null });
            const changes = apply(c2, { happiness: 24, fame: 6, karma: sl.wanted ? 8 : -6 });
            fact(c2, `Took a space-traveling home from ${sl.ownerFactionName || sl.ownerName}.`,
              { type: 'property', weight: 9, tags: ['home', 'ship'] });
            return { text: `{Whoever was left standing does not argue|The ones who could still walk do not come back for it|It ends with the ship, and nobody left to dispute whose it is now}. `
              + `${sl.wanted ? `Word gets around that it was theirs to begin with, which does you no harm at all.` : `Nobody with a badge asks you about it, which is not the same as nobody noticing.`} `
              + `It is yours now.`, changes };
          }
          const cur = currencyFor(getPlace(c2.character.placeId).planet);
          const reward = Math.round(sl.ownerPower > 0 ? clamp(sl.ownerPower / 40, 5000, 4e7) : 20000);
          credit(c2.character, cur.id, reward);
          const inPatrol = c2.character.faction === 'galactic_patrol';
          if (inPatrol) {
            c2.character.factionStanding = clamp((c2.character.factionStanding || 0) + 12, 0, 100);
          }
          const changes = apply(c2, {
            happiness: inPatrol ? 14 : 10, fame: sl.wanted ? 14 : 4, karma: sl.wanted ? 10 : -4,
          });
          fact(c2, `Handed ${sl.ownerFactionName || sl.ownerName}'s ship over to the Galactic Patrol${sl.wanted ? ', wanted, and worth more for it' : ''}.`,
            { type: 'faction', weight: 8, tags: ['faction', 'home'] });
          return { text: `{The Patrol takes one look at the manifest and confirms it was worth having|`
            + `Whoever this was, somebody was already looking for them|It goes into evidence, minus what they decide to pay you for it}. `
            + `${formatMoney(reward, cur.id)}${inPatrol ? `, and it does your standing no harm at all` : ' and a name people recognise'}. `
            + `They keep the ship. Apparently it is more use to an investigation than it would be to you.`,
          changes };
        }
        if (sl.wanted && odds(c2, 0.6)) {
          fact(c2, `Killed trying to take ${sl.ownerName}'s ship.`, { type: 'death', weight: 9, tags: ['death'] });
          die(c2.state, `Killed by ${sl.ownerName}'s people`);
          return { text: `{They do not call anyone first|There is no warning shot|Whoever they are, they have done this before}. `
            + `It is over before you understand how outmatched you were, and they take back whatever you were carrying besides.`, changes: [] };
        }
        const inPatrol = c2.character.faction === 'galactic_patrol';
        const changes = apply(c2, {
          happiness: -16, karma: -10,
          zeni: -Math.round(Math.max(0, c2.character.zeni || 0) * 0.15),
          ...(inPatrol ? { fame: -8 } : {}),
        });
        if (inPatrol) c2.character.factionStanding = clamp((c2.character.factionStanding || 0) - 20, 0, 100);
        fact(c2, `Beaten off ${sl.ownerName}'s ship and handed to the Galactic Patrol.`, { type: 'crime', weight: 7, tags: ['crime'] });
        return { text: `{They do not kill you - that is apparently somebody else's job|"Let the Patrol deal with it," and they mean it as an insult|You are processed, lectured, and released, which is worse than it sounds}. `
          + `${inPatrol ? 'Explaining this to your own superiors is its own punishment.' : 'It goes on a record somewhere, attached to your name.'}`,
        changes };
      } },
      { id: 'walk', label: 'Leave it alone', effect: () => ({ text: `{Not worth it|You keep walking|Whatever is aboard, it is not worth what it would cost}.`, changes: [] }) },
    ],
  },

  {
    id: 'senzu_source', tags: ['world', 'opportunity'], weight: 10,
    minBioAge: 10,
    when: (ctx) => ctx.character.senzu < 3 && !ctx.character.inAfterlife,
    slots: (ctx) => ({}),
    title: 'Beans',
    text: `{You hear about the tower|Somebody mentions the cat|A bag changes hands and you see what is in it}:
      senzu beans. {One heals anything|Ten days of food and every wound closed|They do not grow fast and nobody sells them}.`,
    choices: () => [
      { id: 'climb', label: 'Climb the tower and ask', effect: (ctx) => {
        if (odds(ctx, 0.6 + ctx.character.stats.discipline / 300)) {
          const got = ctx.rng.int(1, 3);
          ctx.character.senzu += got;
          const changes = apply(ctx, { health: -8, stats: { discipline: 3, durability: 2 } });
          meetCanon(ctx, 'korin', 'acquaintance');
          fact(ctx, `Climbed Korin Tower and came down with ${got} senzu beans.`, { type: 'item', weight: 3, tags: ['item'] });
          return { text: `{The climb takes three days|It is much higher than it looks|You fall twice}. Korin {is unimpressed|makes you chase something first|gives you ${got} and tells you not to waste them}.`, changes };
        }
        const changes = apply(ctx, { health: -14, happiness: -5 });
        return { text: `{You do not make it|You fall|The cat watches you fail and says nothing helpful}. {Try again another year|Your arms give out at the halfway point|It is a very long way down}.`, changes };
      } },
      { id: 'buy', label: 'Buy them from somebody less scrupulous', effect: (ctx) => {
        const cost = ctx.rng.int(200000, 900000);
        if (ctx.character.zeni < cost) {
          return { text: `The price is ${localMoney(ctx, cost)}. {You do not have it|You are not close|You laugh and leave}.`, changes: [] };
        }
        ctx.character.senzu += 1;
        const changes = apply(ctx, { zeni: -cost, karma: -2 });
        return { text: `${localMoney(ctx, cost)} for one bean. {It is robbery|You pay it|The seller does not tell you where it came from and you do not ask}.`, changes };
      } },
    ],
  },

  {
    // Not a form - a standing amplifier stacked on top of whatever you
    // already are, same idea as Kaio-ken but permanent rather than
    // triggered, and won by circumstance rather than training. Babidi puts
    // an M on the forehead of everyone he owns; anyone else offering the
    // same trade is doing the same thing under a different name.
    id: 'majin_mark_offer', tags: ['world', 'dark', 'cosmic'], weight: 8,
    when: (ctx) => !ctx.character.flags.majinMark && !ctx.character.flags.majinMarkOffered
      && combatPower(ctx.character) > worldPowerBaseline(ctx.year) * 0.15
      && (ctx.character.karma <= 5 || ctx.character.flags.destroyer_training),
    slots: (ctx) => {
      const babidiAlive = canonAvailable(ctx.year, (c) => c.id === 'babidi').length > 0;
      return { babidiAlive, sourceName: babidiAlive ? 'Babidi' : 'a wizard who never gives his name' };
    },
    title: (ctx, s) => 'A Mark Is Offered',
    text: (ctx, s) => `[sourceName] {finds you somewhere quiet|has been watching for longer than you noticed|already knows what you want before you say it}.
      "{An M, on your forehead|A little of my magic for a little of your temper|You will not be entirely yourself after. You will be more.}"`,
    choices: (ctx, s) => [
      { id: 'accept', label: 'Accept the mark', danger: true, effect: (c2, sl) => {
        c2.character.flags.majinMark = true;
        c2.character.flags.majinMarkOffered = true;
        c2.character.flags.majinCorruption = 30;
        if (sl.babidiAlive) meetCanon(c2, 'babidi', 'acquaintance');
        const changes = apply(c2, { karma: -18, happiness: -6 });
        const lines = ['{Something settles into you that was not there before|The mark burns for a second and then does not|You feel the ceiling move, all at once}.'];
        // Discipline is what keeps it in a drawer instead of driving. A weak
        // mind gets the jolt of power and none of the control, which is
        // exactly what "could damage other if not wielded properly" means -
        // the first thing it does is something you did not choose.
        const close = livingNpcs(c2.state).filter((n) => n.closeness > 40);
        if (c2.character.stats.discipline < 45 && close.length && odds(c2, 0.55)) {
          const victim = c2.rng.pick(close);
          relate(c2, victim, { closeness: -25, trust: -15, tension: 25 });
          apply(c2, { karma: -6 });
          lines.push(`It is not patient. Something in you turns on ${victim.name} before you decide to let it, and by the time you have it back down there is no explaining it away.`);
        } else if (c2.character.stats.discipline < 45) {
          apply(c2, { health: -14 });
          lines.push('It looks for somewhere to go and finds only you. You spend the rest of the year favouring one side.');
        } else {
          lines.push('You hold it. Whatever it wanted, it does not get it this time.');
        }
        fact(c2, 'Took a mark that is not entirely yours to control.', { type: 'transformation', weight: 8, tags: ['transformation', 'dark'] });
        return { text: lines.join(' '), changes };
      } },
      { id: 'refuse', label: 'Refuse', effect: (c2, sl) => {
        c2.character.flags.majinMarkOffered = true;
        const changes = apply(c2, { happiness: -2 });
        return { text: `{"Your loss." They are gone before you can answer twice|You say no and they do not ask again|"Suit yourself." Whatever they wanted you for, someone else will do}.`, changes };
      } },
      { id: 'fight', label: 'Attack them instead', effect: (c2, sl) => offerBattle(c2, {
        name: sl.sourceName, power: Math.max(1, combatPower(c2.character) * 0.35), raceId: 'other',
        techniques: ['mind_control', 'life_drain'],
      }, { reason: 'fight', stakes: 'serious', intro: 'Whatever this was going to cost you, better to end it here.' }),
      },
    ],
  },

  // The Demon Realm has never had a place of its own in this data - a
  // faction (factions.js's demon_realm) with nowhere to actually be. This
  // is the other half of that: the tear opens wherever you happen to be
  // standing, not the other way around, so there is no travel destination
  // to add - only a doorway that shows up uninvited.
  {
    id: 'demon_tear', tags: ['world', 'dark', 'cosmic'], weight: 6,
    when: (ctx) => !ctx.character.inAfterlife && ctx.year >= 770 && (ctx.character.universe || 7) === 7
      && combatPower(ctx.character) > ctx.baseline * 0.08,
    slots: (ctx) => ({
      demonName: ctx.rng.pick(['a demon soldier', 'something with too many joints', 'a scout from the other side', 'one of Dabura\'s own']),
    }),
    title: () => 'The Air Tears',
    text: () => `{The air in front of you splits along an edge that should not exist|Something in the world simply stops being solid, for a moment, in a straight line|`
      + `A seam opens that was not there a second ago, and the wrong colour of red comes through it}. `
      + `[demonName] steps out of the Demon Realm like it owns the ground on this side too.`,
    choices: (ctx, sl) => [
      {
        id: 'fight', label: 'Fight it here', effect: (c2, sl2) => offerBattle(c2, {
          name: sl2.demonName.replace(/^a /, '').replace(/^one of /, ''),
          power: scaledFoePower(c2, 1.1, 0.4), raceId: 'other', techniques: ['dodon_ray'],
        }, {
          reason: 'fight', stakes: 'serious', placeId: 'makai',
          intro: 'The seam does not close while either of you is still standing in it.',
        }),
      },
      {
        id: 'seal', label: 'Try to force the tear shut', effect: (c2, sl2) => {
          const chance = 0.3 + (c2.character.stats.kiControl - 40) / 260 + (c2.character.stats.discipline - 40) / 300;
          if (odds(c2, chance)) {
            const changes = apply(c2, { karma: 4, fame: 2, happiness: 2 });
            fact(c2, 'Sealed a tear into the Demon Realm before anything worse came through.', { type: 'world', weight: 5, tags: ['world', 'dark'] });
            return { text: `{It takes both hands and everything you have, but the seam closes|You get your hands on the edges of it and pull|`
              + `It fights you the whole way and then it is just air again}. Nothing else gets through. Nobody official ever knows this happened.`, changes };
          }
          apply(c2, { health: -14 });
          const intro = `{It does not want to close and it is stronger than the effort you put in|`
            + `You get it half shut before it shrugs you off|`
            + `Whatever is holding it open from the other side is not interested in negotiating}. `
            + `It comes the rest of the way open anyway, and now you are already hurt.`;
          return offerBattle(c2, {
            name: sl2.demonName.replace(/^a /, '').replace(/^one of /, ''),
            power: scaledFoePower(c2, 1.1, 0.4), raceId: 'other', techniques: ['dodon_ray'],
          }, { reason: 'fight', stakes: 'serious', placeId: 'makai', intro });
        },
      },
      {
        id: 'avoid', label: 'Get clear and let it close on its own', effect: (c2) => {
          const changes = apply(c2, { happiness: -3 });
          return { text: `{You put distance between yourself and it and wait|You are not the one it is looking for, so you let it look elsewhere|`
            + `Whatever it wants, it does not seem to want you specifically, and you do not correct that impression}. `
            + `The seam holds for a while, then simply is not there any more.`, changes };
        },
      },
    ],
  },
]);
