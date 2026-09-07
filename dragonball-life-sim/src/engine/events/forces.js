// Somebody else's organisation, arriving.
//
// Every threat in the game used to be a stranger with no affiliation. These
// are the standing forces turning up for their own reasons - to recruit, to
// arrest, to test, to collect - with their own colours and their own squads.

import { registerEvents } from '../generator.js';
import { apply, fact, relate, stranger, offerBattle, squadOf, trainYear, powerLine, moveTo } from './helpers.js';
import { combatPower, powerTier } from '../stats.js';
import { FACTIONS, factionsPresent, factionIntent, getFaction } from '../../data/factions.js';
import { getPlace } from '../../data/places.js';
import { generateFullName } from '../../data/names.js';
import { spreadWord, DEED_SCALE } from '../settlement.js';
import { currencyFor, credit, formatMoney } from '../../data/currency.js';
import { worldPowerBaseline } from '../../data/timeline.js';
import { numberish } from '../text.js';
import { clamp } from '../rng.js';
import { startTrial } from '../trials.js';

// Pick which squad a faction sends. A faction with no history with you picks
// freely; one that has lost to you before stops sending its rookies - each
// loss rules out another rung from the bottom, until only the strongest
// squad it has is left to send.
function pickSquad(rng, faction, grudge) {
  if (!grudge) return rng.pick(faction.squads);
  const bySize = [...faction.squads].sort((a, b) => a.power - b.power);
  const floor = Math.min(bySize.length - 1, grudge);
  return bySize[rng.int(floor, bySize.length - 1)];
}

function pickForce(ctx) {
  const here = getPlace(ctx.character.placeId);
  const options = factionsPresent(ctx.year, here.planet, ctx.character.universe || 7);
  if (!options.length) return null;
  const faction = ctx.rng.pick(options);
  const grudge = (ctx.character.flags.factionGrudge || {})[faction.id] || 0;
  const squad = pickSquad(ctx.rng, faction, grudge);
  // A martial arts school on Earth does not scale with the galactic power
  // curve. Only the forces that operate at that level do.
  const galactic = Math.max(50, worldPowerBaseline(ctx.year));
  const baseline = faction.scope === 'planet' ? Math.min(galactic, 400 + ctx.year * 2) : galactic;
  return {
    faction,
    squad,
    grudge,
    // Your own people do not size you up as a stranger every time they turn
    // up - that used to happen regardless of membership, which read as never
    // actually having joined.
    intent: ctx.character.faction === faction.id ? 'colleague' : factionIntent(faction, ctx.character),
    // Escalating gets them more people too, not just a stronger squad type.
    power: Math.round(baseline * squad.power * ctx.rng.float(0.6, 1.6) * (1 + Math.min(grudge, 5) * 0.12)),
    arrival: faction.scope === 'planet'
      ? ctx.rng.pick(['They walk in', 'A truck stops at the edge of town', 'They are simply there one morning',
        'Somebody knocks', 'They come up the road on foot'])
      : ctx.rng.pick(['They come down in the morning', 'You see the ships first',
        'Something enters the atmosphere and does not slow down', 'Three pods, and they land badly on purpose']),
    officer: generateFullName(ctx.rng, ctx.rng.pick(['other', 'earthling', 'saiyan', 'frostdemon'])),
  };
}

const INTENT_TEXT = {
  target: `{They are here for you|Somebody gave them your description|They are not asking anybody else questions}.`,
  arrest: `{They have read your file|There is a warrant and it has your name on it|They are polite about it, which is worse}.`,
  recruit: `{They want you|Somebody has been watching you fight|They have brought paperwork}.`,
  ally: `{They are not here for you|They want help and are too proud to say so|They ask, eventually}.`,
  test: `{They want to see what you are|It is a challenge, dressed up|Somebody wants to know if the rumours hold}.`,
  wary: `{They are watching you|Nobody says anything|They give you a wide berth and keep giving it}.`,
  passing: `{They are here for something else entirely|It has nothing to do with you|You happen to be standing there}.`,
  colleague: `{Your own people|Colleagues, not strangers|Somebody you already answer to}.`,
};

registerEvents([
  {
    id: 'force_arrives', tags: ['world', 'faction'], weight: 34,
    minBioAge: 8,
    when: (ctx) => !ctx.character.inAfterlife && factionsPresent(ctx.year, ctx.place.planet, ctx.character.universe || 7).length > 0,
    slots: (ctx) => {
      const found = pickForce(ctx);
      if (!found) return null;
      return {
        factionId: found.faction.id,
        factionName: found.faction.name,
        emblem: found.faction.emblem,
        squad: found.squad.name,
        squadNote: found.squad.note,
        intent: found.intent,
        power: found.power,
        tier: powerTier(found.power),
        officer: found.officer,
        arrival: found.arrival,
        goal: found.faction.goal,
        grudge: found.grudge,
        // How many of them there actually are. A child does not get
        // surrounded by five; a known fighter does - and losing to you
        // before means they stop sending one at a time.
        bodies: Math.min(8, (found.squad.elite ? 5
          : (ctx.bioAge ?? 20) < 14 ? 1
            : ctx.rng.pick([1, 1, 2, 3, 3, 4])) + Math.min(found.grudge, 3)),
      };
    },
    title: (ctx, s) => `${s.squad.charAt(0).toUpperCase()}${s.squad.slice(1)}`,
    text: (ctx, s) => `[arrival].
      [factionName]. [emblem] [squadNote]
      ${INTENT_TEXT[s.intent] || INTENT_TEXT.passing} {[tier], as far as you can tell|They are [tier]|You put them at [tier]}.
      ${s.grudge > 0 ? `{They have not sent this many after you before|Last time was not enough, apparently|Somebody upstairs stopped underestimating you}.` : ''}`,
    choices: (ctx, s) => {
      const list = [];
      const faction = getFaction(s.factionId);

      if (s.intent !== 'colleague') list.push({
        id: 'fight', label: 'Meet them', danger: true,
        hint: 'All of them, if it comes to it.',
        effect: (c2, sl) => {
          const head = {
            name: sl.squad.replace(/^an? /, '').replace(/^the /, 'The '),
            power: sl.power, raceId: 'other',
            voice: faction && faction.alignment < -40 ? 'cruel' : 'professional',
          };
          // A squad is people, and they all swing.
          const bodies = squadOf(c2, head, sl.bodies || 1, {
            leaderName: `${sl.officer}`,
            memberName: sl.factionName.replace(/^The /, '') + ' trooper',
          });
          return offerBattle(c2, head, {
          foes: bodies,
          // They will finish an adult who takes them on. They will not
          // execute a child in the road; they will put them down and leave.
          reason: 'faction',
          stakes: (sl.intent === 'test' || (c2.bioAge ?? 20) < 15) ? 'serious' : 'lethal',
          intro: `${sl.factionName}. ${sl.officer} is the one doing the talking, right up until they are not.`,
          context: { factionId: sl.factionId },
          });
        },
      });

      if (!ctx.character.faction && (ctx.bioAge ?? 20) >= 12
        && (s.intent === 'recruit' || (faction && faction.recruits && s.intent === 'passing'))) {
        list.push({
          id: 'join', label: `Sign on with ${s.factionName}`,
          hint: s.goal,
          effect: (c2, sl) => {
            // They ask, they do not just hand it over - a real trial, not a
            // formality, and a nine-year-old failing it is exactly the point.
            const trial = startTrial(c2.state, c2.rng, {
              kind: 'sequence',
              difficulty: clamp(2 + Math.round(Math.abs((getFaction(sl.factionId) || {}).alignment || 0) / 35), 1, 5),
              purpose: 'recruitment',
              label: `Joining ${sl.factionName}`,
              blurb: 'They are not taking your word for it.',
              payload: { factionId: sl.factionId, factionName: sl.factionName },
            });
            return {
              text: `${sl.officer} looks you over. {"Prove it."|"Everybody says they can fight."|"Show me, then."}`,
              trial,
            };
          },
        });
      }

      if (s.intent === 'colleague') {
        list.push({
          id: 'checkin', label: 'Check in with them', hint: 'You already work here.',
          effect: (c2, sl) => {
            const cur = currencyFor(getPlace(c2.character.placeId).planet);
            credit(c2.character, cur.id, Math.round(sl.power * 0.3) || 500);
            const t = trainYear(c2, { intensity: 1.1, placeMult: 1.1, mentorMult: 1.2 });
            return {
              text: `{You fall in with the rest of them|Same colours, same work|Nobody has to explain the routine to you anymore}. `
                + `${sl.officer} passes on an assignment and a share of the take. ${powerLine(t.gained)}`,
              changes: apply(c2, { happiness: 5 }),
            };
          },
        });
        list.push({
          id: 'leave', label: `Cut ties with ${s.factionName}`, danger: true,
          effect: (c2, sl) => {
            c2.character.faction = null;
            fact(c2, `Cut ties with ${sl.factionName}.`, { type: 'faction', weight: 6, tags: ['faction'] });
            return {
              text: `{You hand back the colours|You do not explain yourself and they do not ask|That is the end of that}.`,
              changes: apply(c2, { happiness: -4, karma: 2 }),
            };
          },
        });
      }

      if (s.intent === 'arrest') {
        list.push({
          id: 'surrender', label: 'Go with them',
          effect: (c2, sl) => {
            c2.character.flags.arrested = true;
            // They got you. Whatever squad they had to build up to do it,
            // the problem is handled as far as they're concerned.
            if (c2.character.flags.factionGrudge) c2.character.flags.factionGrudge[sl.factionId] = 0;
            const years = c2.rng.int(1, 4);
            moveTo(c2, 'galactic_prison');
            c2.character.age += years;
            fact(c2, `${sl.factionName} took them in. ${years} years.`,
              { type: 'history', weight: 7, tags: ['prison'] });
            return { text: `{You go quietly|There is no version of this where you win|You put your hands out}. `
              + `{${years} years|It is not as bad as the stories and it is bad enough|`
              + `You come out older and considerably harder}.`,
            changes: apply(c2, { happiness: -20, fame: 8, stats: { durability: 6, discipline: 5, charisma: -4 } }) };
          },
        });
      }

      if (s.intent === 'ally' || s.intent === 'passing' || s.intent === 'wary') {
        list.push({
          id: 'help', label: 'Give them a hand',
          effect: (c2, sl) => {
            const f = getFaction(sl.factionId);
            const rep = spreadWord(c2.state, { scale: DEED_SCALE.city * 0.4, karma: f && f.alignment > 0 ? 6 : -4 });
            return { text: `{You help|It costs you a season and nothing else|They did not expect it}. `
              + `{Word gets round|Somebody in [factionName] owes you now|They will remember, which cuts both ways}. `
              + `Heard of by about ${numberish(rep.gained)} more people.`,
            changes: apply(c2, { happiness: 8 }),
            view: { factionName: sl.factionName } };
          },
        });
      }

      list.push({
        id: 'avoid', label: 'Be somewhere else',
        effect: (c2) => {
          const t = trainYear(c2, { intensity: 1.2 });
          return { text: `{You are not there when they arrive|You go up the mountain and stay there|`
            + `Whatever it is, it is not your problem}. ${powerLine(t.gained)}`, changes: [] };
        },
      });
      return list;
    },
  },
]);
