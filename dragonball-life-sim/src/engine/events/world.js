// The world moving on its own: the canon timeline, tournaments, the Dragon
// Balls, space, and the gods. The player can join in, ignore it, or change it,
// and the timeline records the divergence either way.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, meetCanon, canonHere,
  odds, killNpc, findNpc, scaledFoePower, moveTo, setWorldFlag, offerBattle } from './helpers.js';
import { fight, narrateFight, describeGap, runTournament, buildField } from '../combat.js';
import { combatPower, powerTier } from '../stats.js';
import { TIMELINE, isTournamentYear, worldPowerBaseline, eraName } from '../../data/timeline.js';
import { canonAvailable } from '../../data/canon.js';
import { startSurvival, survivalActions, survivalTurn, RULES } from '../survival.js';
import { ensureBallSet, ballsHeld, ballsOn, ballManifest, scatterAfterWish, ballsAreInert } from '../dragonballs.js';
import { getItem } from '../../data/items.js';
import { getPlace, PLACES } from '../../data/places.js';
import { generateFullName } from '../../data/names.js';
import { getTechnique, TECHNIQUES } from '../../data/techniques.js';
import { numberish, zeni, ordinal } from '../text.js';
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
  return knownWell || soughtOut;
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
  {
    id: 'timeline_event', noFatigue: true, tags: ['world', 'threat', 'cosmic'], weight: 400,
    when: (ctx) => TIMELINE.some((t) => t.year === ctx.year
      && !ctx.state.world.resolved.includes(t.id)
      && !(t.cancelIf && ctx.state.world.flags[t.cancelIf])),
    slots: (ctx) => {
      const ev = ctx.forceEvId
        ? TIMELINE.find((t) => t.id === ctx.forceEvId)
        : TIMELINE.find((t) => t.year === ctx.year
          && !ctx.state.world.resolved.includes(t.id)
          && !(t.cancelIf && ctx.state.world.flags[t.cancelIf]));
      if (!ev) return null;
      const here = getPlace(ctx.character.placeId);
      const canGetThere = ev.planet === here.planet || ev.scope === 'multiverse' || ev.planet === 'void'
        || ctx.character.items.includes('spaceship') || ctx.character.techniques.includes('instant_transmission');
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
      if (s.reachable) {
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
          fact(c2, `Bought ${sl.count} Dragon Balls for ${zeni(price)}.`, { type: 'dragonball', weight: 3, tags: ['dragonball'] });
          return { text: `${zeni(price)}. {It is robbery and you pay it|You do not haggle|They throw in a bag}. ${ballsHeld(c2.state)} of seven.`, changes };
        }
        if (odds(c2, 0.35 + c2.character.stats.charisma / 250)) {
          claimBalls(c2.state, c2.rng, 1);
          const changes = apply(c2, { karma: 4, happiness: 4 });
          return { text: `{You have nothing like ${zeni(price)}|You offer something else|You do them a favour instead}. They part with one. ${ballsHeld(c2.state)} of seven.`, changes };
        }
        return { text: `{The price is ${zeni(price)}|You cannot come close|They laugh you out of the building}.`, changes: [] };
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
      const gods = canonAvailable(ctx.year, (c) => c.tags.includes('divine') && !c.tags.includes('omniking'));
      const g = gods.length ? ctx.rng.pick(gods) : null;
      if (!g) return null;
      return { godId: g.id, godName: g.name, godPersona: g.personality, godQuirk: g.quirk };
    },
    title: (ctx, s) => `${s.godName} Has Noticed You`,
    text: `{You feel it before you see anything|The air pressure changes|Everything goes very quiet}.
      [godName]. [godPersona] [godQuirk]`,
    choices: (ctx, s) => [
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
          return { text: `{They agree, which surprises everyone including them|"Very well"|There is a condition and you meet it}. The training is {nothing like training|mostly being hit while doing chores|not survivable by most people}. ${powerLine(t.gained)}`, changes };
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
        const changes = apply(c2, { health: -55, happiness: -10 });
        return { text: `{You do not see the movement|There is no fight|One gesture}. {You are through a wall and most of a hillside|You wake up much later|It is not even close to a contest}.`, changes };
      } },
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
          return { text: `The price is ${zeni(cost)}. {You do not have it|You are not close|You laugh and leave}.`, changes: [] };
        }
        ctx.character.senzu += 1;
        const changes = apply(ctx, { zeni: -cost, karma: -2 });
        return { text: `${zeni(cost)} for one bean. {It is robbery|You pay it|The seller does not tell you where it came from and you do not ask}.`, changes };
      } },
    ],
  },
]);
