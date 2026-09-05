// The world moving on its own: the canon timeline, tournaments, the Dragon
// Balls, space, and the gods. The player can join in, ignore it, or change it,
// and the timeline records the divergence either way.

import { registerEvents, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, meetCanon, canonHere,
  odds, killNpc, findNpc, scaledFoePower, moveTo, setWorldFlag } from './helpers.js';
import { fight, narrateFight, describeGap, runTournament, buildField } from '../combat.js';
import { combatPower, powerTier } from '../stats.js';
import { TIMELINE, isTournamentYear, worldPowerBaseline, eraName } from '../../data/timeline.js';
import { canonAvailable } from '../../data/canon.js';
import { WISHES, getItem } from '../../data/items.js';
import { getPlace, PLACES } from '../../data/places.js';
import { generateFullName } from '../../data/names.js';
import { getTechnique, TECHNIQUES } from '../../data/techniques.js';
import { numberish, zeni, ordinal } from '../text.js';

registerEvents([
  {
    id: 'timeline_event', noFatigue: true, tags: ['world', 'threat', 'cosmic'], weight: 60,
    minBioAge: 10,
    when: (ctx) => TIMELINE.some((t) => t.year === ctx.year
      && !ctx.state.world.resolved.includes(t.id)
      && !(t.cancelIf && ctx.state.world.flags[t.cancelIf])),
    slots: (ctx) => {
      const ev = TIMELINE.find((t) => t.year === ctx.year
        && !ctx.state.world.resolved.includes(t.id)
        && !(t.cancelIf && ctx.state.world.flags[t.cancelIf]));
      if (!ev) return null;
      const here = getPlace(ctx.character.placeId);
      const reachable = ev.planet === here.planet || ev.scope === 'multiverse' || ev.planet === 'void'
        || ctx.character.items.includes('spaceship') || ctx.character.techniques.includes('instant_transmission');
      return { evId: ev.id, evName: ev.name, evBlurb: ev.blurb, evThreat: ev.threat, reachable };
    },
    title: (ctx, s) => s.evName,
    text: (ctx, s) => `[evBlurb] ${s.reachable
      ? `{You could be there in a day|You are close enough to reach it|Nothing is stopping you but sense}.`
      : `{It is happening a long way from here|You hear about it days late|You have no way to get there}.`}
      ${describeGap(combatPower(ctx.character), s.evThreat)}`,
    choices: (ctx, s) => {
      const list = [];
      // Walking into a saga is an adult decision; a child can only watch.
      if (s.reachable && ctx.bioAge >= 13) {
        list.push({
          id: 'intervene', label: 'Go. Put yourself in the middle of it.', danger: true,
          effect: (c2, sl) => {
            const ev = TIMELINE.find((t) => t.id === sl.evId);
            c2.state.world.resolved.push(ev.id);
            const foe = { name: ev.name, power: ev.threat };
            const mine = combatPower(c2.character);
            const res = fight(c2.state, c2.rng, foe, { lethality: 0.3, maxRounds: 7 });
            c2.state.stats.fights++;
            apply(c2, { health: -Math.round(res.damageTaken * 0.9), ki: -40 });
            if (res.won) {
              c2.state.stats.wins++;
              setWorldFlag(c2.state, ev.id + '_changed');
              c2.state.world.divergences.push({ year: c2.year, event: ev.id, how: 'player resolved it' });
              if (ev.id === 'namek_war' || ev.id === 'golden_frieza') setWorldFlag(c2.state, 'frieza_dead');
              if (ev.id === 'androids') setWorldFlag(c2.state, 'gero_dead');
              if (ev.id === 'cell_games') setWorldFlag(c2.state, 'cell_dead');
              if (ev.id === 'buu_freed') setWorldFlag(c2.state, 'babidi_dead');
              apply(c2, { fame: 30, karma: 15, happiness: 20 });
              fact(c2, `Changed history: ${ev.name}.`, { type: 'history', weight: 10, tags: ['legend', 'divergence'] });
              return { text: `${narrateFight(res, c2.rng, ev.name)} {It should not have been you|Nobody expected you to be the one|The history books will get this wrong}. ${ev.name} ends differently because you were there.`, changes: [] };
            }
            c2.state.stats.losses++;
            if (res.lethal || odds(c2, 0.3)) {
              return { text: `${narrateFight(res, c2.rng, ev.name)} {You were never going to be enough|You knew and you went anyway|It does not even slow down}.`,
                changes: [], outcome: { death: `Died at ${ev.name}` } };
            }
            apply(c2, { fame: 12, karma: 10, happiness: -10 });
            fact(c2, `Was there when ${ev.name} happened. Survived it.`, { type: 'history', weight: 7, tags: ['witness'] });
            return { text: `${narrateFight(res, c2.rng, ev.name)} {Somebody drags you out|You live, which is not the same as helping|Others finish what you could not}.`, changes: [] };
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
      const hopeless = combatPower(ctx.character) < s.evThreat / 50;
      if (hopeless) {
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
      { id: 'enter', label: 'Enter', effect: (c2, sl) => {
        const baseline = Math.max(60, worldPowerBaseline(c2.year) * 0.02, combatPower(c2.character) * 0.25);
        const field = buildField(c2.rng, (power, i) => ({
          name: generateFullName(c2.rng, c2.rng.pick(['earthling', 'earthling', 'namekian', 'saiyan', 'other'])),
          power: Math.round(power),
        }), 4, baseline);
        const result = runTournament(c2.state, c2.rng, field, { lethality: 0.03 });
        const lines = result.record.map((r) =>
          `Round ${r.round}: ${r.foe} (${numberish(r.foePower)}). ${r.won ? 'You take it.' : 'You do not.'}`);
        if (result.won) {
          c2.state.world.tournamentWins++;
          const changes = apply(c2, { zeni: sl.purse, fame: 22, happiness: 22, health: -20 });
          fact(c2, `Won the ${ordinal(sl.num)} World Martial Arts Tournament.`, { type: 'tournament', weight: 8, tags: ['fame', 'milestone'] });
          return { text: `${lines.join(' ')} {They put a belt on you|The crowd is enormous|Somebody who has never met you cries}. World Champion.`, changes };
        }
        const changes = apply(c2, {
          zeni: result.placement <= 2 ? Math.round(sl.purse * 0.3) : 20000,
          fame: Math.max(2, 12 - result.placement * 2), happiness: -4, health: -14,
        });
        fact(c2, `Placed ${ordinal(result.placement)} at the ${ordinal(sl.num)} tournament.`, { type: 'tournament', weight: 3, tags: ['fame'] });
        return { text: `${lines.join(' ')} ${ordinal(result.placement)} place. #aftermath#`, changes };
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
    weight: (ctx) => 22 + ctx.state.world.dragonBalls * 16,
    minBioAge: 9,
    when: (ctx) => ctx.state.world.dragonBalls < 7 && !ctx.character.inAfterlife,
    slots: (ctx) => ({
      source: '#rumourSource#',
      where: ctx.rng.pick(['at the bottom of a lake', 'inside a mountain', 'in a village that worships it',
        'in the belly of something large', 'in a museum case', 'under a city', 'in a Frieza Force evidence locker',
        'on an island that is not on any map', 'in the crater it made when it landed']),
      have: ctx.state.world.dragonBalls,
    }),
    title: 'One of the Seven',
    text: `You hear it from #rumourSource#: a ball with stars inside it, [where].
      {You have [have] already|You have [have] of them|This would make [have] plus one}.`,
    choices: (ctx, s) => [
      { id: 'go', label: 'Go and get it', effect: (c2, sl) => {
        const bonus = c2.character.items.includes('dragon_radar') ? 0.4 : 0;
        if (odds(c2, 0.58 + bonus + c2.character.stats.intellect / 400)) {
          c2.state.world.dragonBalls = Math.min(7, c2.state.world.dragonBalls + 1);
          const changes = apply(c2, { happiness: 10, health: -6, zeni: -5000 });
          fact(c2, `Found a Dragon Ball. That makes ${c2.state.world.dragonBalls}.`, { type: 'dragonball', weight: 4, tags: ['dragonball'] });
          return { text: `{It takes months|It takes a week and a lot of digging|It is exactly where they said}. ${c2.state.world.dragonBalls === 7 ? `{That is seven|Seven. All of them|The last one}. {They start to glow when you put them together|The air changes|You should probably think carefully about this}.` : `${c2.state.world.dragonBalls} of seven.`}`, changes };
        }
        const changes = apply(c2, { happiness: -6, health: -8, zeni: -12000 });
        return { text: `{Somebody got there first|It is not there|It was there and now there is a hole and a set of tracks}. {You waste the season|You come back with nothing|Somebody with a radar beat you by two days}.`, changes };
      } },
      { id: 'ignore', label: 'Leave it. Wishes cause trouble.', effect: (c2) => {
        const changes = apply(c2, { karma: 3, stats: { discipline: 2 } });
        return { text: `{You have seen what people wish for|Not your business|Let somebody else be tempted}.`, changes };
      } },
    ],
  },

  {
    id: 'summon_dragon', noFatigue: true, tags: ['world', 'dragonball', 'revival'], weight: 200,
    when: (ctx) => ctx.state.world.dragonBalls >= 7,
    slots: (ctx) => ({ dragon: ctx.place.planet === 'namek' || ctx.place.planet === 'new_namek' ? 'Porunga' : 'Shenron' }),
    title: 'Summoning',
    text: `Seven balls in a circle, and {the sky goes black|the sun goes out|the clouds come apart}.
      [dragon] {rises|uncoils|fills the sky}. {"State your wish"|"Speak. I will grant one wish"|"You have summoned me. Make it quick"}.`,
    choices: (ctx, s) => {
      const c = ctx.character;
      const usable = WISHES.filter((w) => !w.race || w.race.includes(c.raceId));
      return ctx.rng.sample(usable, 4).map((w) => ({
        id: w.id,
        label: w.name,
        hint: w.desc,
        effect: (c2) => {
          c2.state.world.dragonBalls = 0;
          c2.state.world.wishesUsed.push(w.id);
          fact(c2, `Wished: ${w.name}.`, { type: 'wish', weight: 7, tags: ['dragonball', 'wish'] });
          switch (w.id) {
            case 'revive_one': {
              const dead = Object.values(c2.state.npcs).filter((n) => !n.alive);
              if (dead.length) {
                const back = c2.rng.pick(dead);
                back.alive = true;
                back.deadSince = null;
                const changes = apply(c2, { happiness: 25, karma: 8 });
                fact(c2, `Brought ${back.name} back.`, { type: 'revival', weight: 8, subject: back.id, tags: ['wish'] });
                return { text: `You say the name. {The dragon's eyes flare|It is done before you finish speaking|"It is done"}. ${back.name} {is standing there|opens their eyes somewhere and starts walking home|does not understand yet}.`, changes };
              }
              return { text: `{Nobody you love is dead yet|The dragon waits|"There is no one"}. You waste it on something small.`, changes: apply(c2, { happiness: -4 }) };
            }
            case 'immortality': {
              c2.character.flags.immortal = true;
              c2.character.lifeExpectancy = 99999;
              const changes = apply(c2, { karma: -8, happiness: 10 });
              fact(c2, 'Became immortal. Cannot die of age.', { type: 'wish', weight: 10, tags: ['wish', 'immortal'] });
              return { text: `{"It is done"|The dragon looks at you for a long moment first|Nothing feels different, which is the frightening part}. You will not age out of this. {Everything else can still kill you|That was not the same as invulnerable and you knew it|You have all the time there is}.`, changes };
            }
            case 'power_up': {
              const mult = c2.rng.float(6, 22);
              const yearsLost = c2.rng.int(8, 25);
              c2.character.lifeExpectancy = Math.max(c2.character.age + 3, c2.character.lifeExpectancy - yearsLost);
              c2.character.flags.wished_power = true;
              const changes = apply(c2, { powerMult: mult, happiness: 12, karma: -6 });
              fact(c2, `Wished for power and paid ${yearsLost} years for it.`, { type: 'wish', weight: 9, tags: ['wish', 'power'] });
              return { text: `{It arrives all at once and it hurts|Your whole body reorganises|You can feel it come in}. Power multiplied ${mult.toFixed(1)} times. {The dragon takes the payment from the far end of your life|"The years were the price"|You are ${yearsLost} years shorter now and you did not feel it go}.`, changes };
            }
            case 'unlock_potential': {
              c2.character.flags.potential_unlocked = true;
              c2.character.flags.wish_potential = true;
              const changes = apply(c2, { powerMult: c2.rng.float(3, 7), happiness: 15,
                stats: { kiControl: 8, technique: 6, discipline: 4 } });
              fact(c2, 'Had every drop of latent potential unlocked by the dragon.', { type: 'wish', weight: 9, tags: ['wish', 'power'] });
              return { text: `{Nothing visible happens|There is no glow, no shout|You feel the ceiling come off}. Everything you could ever have been is available now, and you have to go and take it.`, changes };
            }
            case 'wealth': {
              const changes = apply(c2, { zeni: c2.rng.int(50000000, 900000000), happiness: 12, karma: -3 });
              return { text: `{It is vulgar and it works|Money appears in accounts you do not have|Somebody delivers a case}. {You are rich|Obscenely rich|Rich enough that it stops being a number}.`, changes };
            }
            case 'youth': {
              c2.character.age = Math.max(16, c2.character.age - 20);
              const changes = apply(c2, { health: 40, happiness: 18 });
              fact(c2, 'Wished twenty years back onto the clock.', { type: 'wish', weight: 8, tags: ['wish'] });
              return { text: `{Twenty years come off|You feel it in your knees first|Your hands look wrong for a week}. You are ${c2.character.age} again, with everything you learned still in there.`, changes };
            }
            case 'knowledge': {
              const pool = TECHNIQUES.filter((t) => !c2.character.techniques.includes(t.id)
                && (!t.races || t.races.includes(c2.character.raceId)));
              if (pool.length) {
                const t = c2.rng.weighted(pool, (x) => x.tier);
                c2.character.techniques.push(t.id);
                c2.state.stats.techniquesLearned++;
                const changes = apply(c2, { stats: { technique: 5, kiControl: 4 }, happiness: 10 });
                fact(c2, `The dragon put the ${t.name} into their head.`, { type: 'technique', weight: 6, tags: ['wish', 'technique'] });
                return { text: `{It arrives as memory, not learning|You simply know it, the way you know your own name|There is no practice and no wonder}. The ${t.name}. {It feels like cheating|You did not earn it|It works perfectly}.`, changes };
              }
              return { text: `You already know everything the dragon can teach.`, changes: [] };
            }
            case 'restore_planet': {
              setWorldFlag(c2.state, 'planet_restored');
              const changes = apply(c2, { karma: 25, happiness: 25, fame: 12 });
              fact(c2, 'Asked the dragon to put a dead world back.', { type: 'wish', weight: 10, tags: ['wish', 'hero'] });
              return { text: `{Rock, water, air, in that order|It takes eleven seconds|The dragon says it is done and it is done}. {The people are a separate wish and you do not have another|Somewhere a world is spinning again|It is empty and it is there}.`, changes };
            }
            case 'tail_back': {
              c2.character.tail = true;
              const changes = apply(c2, { happiness: 10, powerMult: 1.3 });
              return { text: `{It grows back overnight|You wake up and it is there|It is stronger than the old one}. {You had forgotten what balance felt like|The moon is interesting again|Do not let anyone grab it}.`, changes };
            }
            case 'revive_many': {
              const dead = Object.values(c2.state.npcs).filter((n) => !n.alive);
              dead.forEach((n) => { n.alive = true; n.deadSince = null; });
              const changes = apply(c2, { happiness: 30, karma: 20, fame: 10 });
              fact(c2, `Brought back everyone who had died. All ${dead.length} of them.`, { type: 'revival', weight: 10, tags: ['wish', 'hero'] });
              return { text: `{You ask for all of them|"All of them"|You do not ask for anything for yourself}. ${dead.length ? `${dead.length} people wake up somewhere and do not know why.` : `Nobody is dead. The dragon waits, then leaves.`}`, changes };
            }
            case 'erase_memory': {
              c2.character.fame = 0;
              Object.values(c2.state.npcs).forEach((n) => { n.closeness = Math.round(n.closeness * 0.2); n.respect = 0; });
              const changes = apply(c2, { happiness: -10, karma: -4 });
              fact(c2, 'Wished to be forgotten by everyone.', { type: 'wish', weight: 9, tags: ['wish'] });
              return { text: `{It works immediately|Nobody looks up when you walk past|Somebody you love calls you "excuse me"}. {You are nobody|It is exactly what you asked for|You did not think about what it would feel like}.`, changes };
            }
            default: {
              const changes = apply(c2, { happiness: 8 });
              return { text: `{The dragon grants it without comment|"It is done"|It takes about four seconds}. {The sky comes back|The balls scatter across the world|They will be stone for a year}.`, changes };
            }
          }
        },
      }));
    },
  },

  {
    id: 'dragonball_cache', tags: ['world', 'dragonball', 'opportunity', 'revival'],
    weight: (ctx) => (ctx.state.world.dragonBalls >= 2 ? 22 : 8),
    minBioAge: 10,
    when: (ctx) => ctx.state.world.dragonBalls < 7 && !ctx.character.inAfterlife,
    slots: (ctx) => ({
      who: ctx.rng.pick(['a collector with a very good safe', 'a small emperor with a big robot',
        'a museum that does not know what it has', 'a cult that has been gathering them for a century',
        'a dying scavenger who wants one thing in return', 'a Frieza Force quartermaster with a price']),
      count: Math.min(7 - ctx.state.world.dragonBalls, ctx.rng.int(2, 3)),
    }),
    title: 'Somebody Else Has Been Collecting',
    text: `[who:cap] has [count] of them. {They are not hidden well|They are hidden extremely well|They are on display, which is insulting}.
      {You have [count] short of a wish|This would change the arithmetic|It would be most of the way there}.`,
    choices: (ctx, s) => [
      { id: 'take', label: 'Take them', danger: true, effect: (c2, sl) => {
        if (odds(c2, 0.55 + c2.character.stats.speed / 400)) {
          c2.state.world.dragonBalls = Math.min(7, c2.state.world.dragonBalls + sl.count);
          const changes = apply(c2, { karma: -8, health: -8, fame: 3 });
          fact(c2, `Took ${sl.count} Dragon Balls from ${sl.who}.`, { type: 'dragonball', weight: 4, tags: ['dragonball', 'crime'] });
          return { text: `{You are in and out in a minute|It is louder than you planned|Nobody stops you}. ${c2.state.world.dragonBalls} of seven.`, changes };
        }
        const foe = stranger(c2, { relation: 'enemy', tension: 60, powerTarget: scaledFoePower(c2, 1.1), metHow: 'dragonball' });
        const changes = apply(c2, { health: -18, karma: -6 });
        return { text: `{They were ready for you|There is a guard you did not count|An alarm nobody could hear}. ${foe.name} {gets in the way|takes your face down for reference|will remember this}.`, changes };
      } },
      { id: 'trade', label: 'Buy or bargain for them', effect: (c2, sl) => {
        const price = c2.rng.int(300000, 3000000);
        if (c2.character.zeni >= price) {
          c2.state.world.dragonBalls = Math.min(7, c2.state.world.dragonBalls + sl.count);
          const changes = apply(c2, { zeni: -price, karma: 2 });
          fact(c2, `Bought ${sl.count} Dragon Balls for ${zeni(price)}.`, { type: 'dragonball', weight: 3, tags: ['dragonball'] });
          return { text: `${zeni(price)}. {It is robbery and you pay it|You do not haggle|They throw in a bag}. ${c2.state.world.dragonBalls} of seven.`, changes };
        }
        if (odds(c2, 0.35 + c2.character.stats.charisma / 250)) {
          c2.state.world.dragonBalls = Math.min(7, c2.state.world.dragonBalls + 1);
          const changes = apply(c2, { karma: 4, happiness: 4 });
          return { text: `{You have nothing like ${zeni(price)}|You offer something else|You do them a favour instead}. They part with one. ${c2.state.world.dragonBalls} of seven.`, changes };
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
        if (odds(c2, 0.25)) {
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
