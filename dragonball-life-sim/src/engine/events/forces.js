// Somebody else's organisation, arriving.
//
// Every threat in the game used to be a stranger with no affiliation. These
// are the standing forces turning up for their own reasons - to recruit, to
// arrest, to test, to collect - with their own colours and their own squads.

import { registerEvents } from '../generator.js';
import { apply, fact, relate, stranger, offerBattle, squadOf, trainYear, powerLine, moveTo } from './helpers.js';
import { combatPower, powerTier } from '../stats.js';
import { FACTIONS, factionsPresent, factionIntent, getFaction } from '../../data/factions.js';
import { getPlace, PLACES } from '../../data/places.js';
import { generateFullName } from '../../data/names.js';
import { spreadWord, DEED_SCALE } from '../settlement.js';
import { currencyFor, credit, formatMoney, priceIn } from '../../data/currency.js';
import { worldPowerBaseline } from '../../data/timeline.js';
import { numberish } from '../text.js';
import { clamp } from '../rng.js';
import { startTrial } from '../trials.js';
import { livingNpcs } from '../state.js';

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

// What "take an assignment" actually is, shaped by what the organisation is
// for. A lawful faction sends you after somebody; a hostile one sends you to
// take something. Difficulty and pay both scale off rank separately from this.
const MISSION_BRIEFS = {
  lawful: [
    { label: 'Patrol', order: 'Walk the sector. Report anything that should not be there.' },
    { label: 'Escort', order: 'Get them from here to there in one piece. That is the whole job.' },
    { label: 'Arrest', order: 'There is a warrant. Bring them in breathing, if you can manage it.' },
    { label: 'Investigate', order: 'Something does not add up out there. Go find out what.' },
  ],
  hostile: [
    { label: 'Collection', order: 'Whatever they owe, get it back. However you have to.' },
    { label: 'Enforcement', order: 'Somebody needs reminding who is in charge out there.' },
    { label: 'Raid', order: 'Hit them before they hit us. You know the drill.' },
  ],
  other: [
    { label: 'Errand', order: 'It is not glamorous, but it needs doing and you are here.' },
    { label: 'Recovery', order: 'Something of ours is out there. Bring it back.' },
  ],
};
function missionBrief(rng, faction) {
  const bucket = !faction ? MISSION_BRIEFS.other
    : faction.stance === 'lawful' ? MISSION_BRIEFS.lawful
      : faction.stance === 'hostile' ? MISSION_BRIEFS.hostile : MISSION_BRIEFS.other;
  const pick = rng.pick(bucket);
  return { label: pick.label, order: pick.order, blurb: `${pick.label}. ${pick.order}` };
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
        const rankIdx = clamp(ctx.character.factionRank || 0, 0, (faction && faction.ranks ? faction.ranks.length - 1 : 0));
        const rankName = faction && faction.ranks ? faction.ranks[rankIdx] : null;

        list.push({
          id: 'mission', label: rankName ? `Take an assignment (${rankName})` : 'Take an assignment', hint: s.goal,
          effect: (c2, sl) => {
            const f = getFaction(sl.factionId);
            const rank2 = clamp(c2.character.factionRank || 0, 0, (f && f.ranks ? f.ranks.length - 1 : 0));
            const brief = missionBrief(c2.rng, f);
            const trial = startTrial(c2.state, c2.rng, {
              kind: 'push',
              difficulty: clamp(2 + rank2, 1, 5),
              purpose: 'mission',
              label: brief.label,
              blurb: brief.blurb,
              payload: {
              factionId: sl.factionId, factionName: sl.factionName, basePay: 1800 + rank2 * 900,
              arrest: brief.label === 'Arrest',
            },
            });
            return { text: `${sl.officer}: "${brief.order}"`, trial };
          },
        });

        list.push({
          id: 'report', label: 'Report to your superior', hint: 'See where you stand.',
          effect: (c2, sl) => {
            const f = getFaction(sl.factionId);
            const standing = c2.character.factionStanding || 0;
            const rank2 = clamp(c2.character.factionRank || 0, 0, (f && f.ranks ? f.ranks.length - 1 : 0));
            const changes = apply(c2, { happiness: 3 });
            const lines = [c2.rng.pick([
              `${sl.officer} looks over your file without much comment.`,
              `${sl.officer} has five minutes and spends them on you.`,
              `You catch ${sl.officer} between assignments.`,
            ])];
            // A colleague, some of the time - the same station has other
            // people in it, and you do not always work alone.
            const known = livingNpcs(c2.state).filter((n) => n.factionId === sl.factionId);
            if (f && f.recruits && known.length < 4 && c2.rng.chance(0.4)) {
              const colleague = stranger(c2, { minAge: 18, maxAge: 55 });
              colleague.relation = 'colleague';
              colleague.factionId = sl.factionId;
              colleague.closeness = c2.rng.int(15, 35);
              fact(c2, `Met ${colleague.name}, also with ${sl.factionName}.`, { type: 'faction', weight: 4, subject: colleague.id, tags: ['faction', 'colleague'] });
              lines.push(`${colleague.name} is posted here too, and introduces themselves before ${sl.officer.split(' ')[0]} gets the chance.`);
            }
            if (f && f.ranks) {
              lines.push(`${rankName || f.ranks[0]}. Standing: ${Math.round(standing)}/100${rank2 < f.ranks.length - 1 ? ` toward ${f.ranks[rank2 + 1]}` : ' - there is nowhere higher to go here'}.`);
            }
            return { text: lines.join(' '), changes };
          },
        });

        if (faction && faction.stations && faction.stations.length > 1 && rankIdx >= 1) {
          list.push({
            id: 'transfer', label: 'Request a transfer', hint: 'A different station, a different world.',
            effect: (c2, sl) => {
              const f = getFaction(sl.factionId);
              const here = getPlace(c2.character.placeId).planet;
              const options = f.stations.filter((p) => p !== here);
              if (!options.length) return { text: 'There is nowhere else to send you.', changes: [] };
              const dest = c2.rng.pick(options);
              const destPlace = PLACES.find((p) => p.planet === dest);
              if (!destPlace) return { text: 'There is nowhere on record to send you.', changes: [] };
              moveTo(c2, destPlace.id);
              const changes = apply(c2, { happiness: 2 });
              fact(c2, `Transferred to a ${sl.factionName} posting on ${dest.replace(/_/g, ' ')}.`, { type: 'faction', weight: 5, tags: ['faction'] });
              return {
                text: `{The paperwork clears faster than you expected|Somebody higher up signs off without asking why|"Granted." That is the whole conversation}. `
                  + `New station, new faces, same colours.`,
                changes,
              };
            },
          });
        }

        // Cutting ties is always available. Retiring - going out the front
        // door instead of just vanishing - is only for somebody who reached
        // the top of the ladder there.
        if (faction && faction.ranks && rankIdx >= faction.ranks.length - 1) {
          list.push({
            id: 'retire', label: `Retire from ${s.factionName}`, hint: 'Go out on your own terms, at the top of it.',
            effect: (c2, sl) => {
              const f = getFaction(sl.factionId);
              const topRank = f && f.ranks ? f.ranks[f.ranks.length - 1] : 'the top';
              const cur = currencyFor(getPlace(c2.character.placeId).planet);
              const payout = priceIn(60000, cur.id);
              credit(c2.character, cur.id, payout);
              c2.character.retiredFactions = c2.character.retiredFactions || [];
              c2.character.retiredFactions.push({ factionId: sl.factionId, name: sl.factionName, rank: topRank, year: c2.year });
              c2.character.faction = null;
              c2.character.factionRank = 0;
              c2.character.factionStanding = 0;
              fact(c2, `Retired from ${sl.factionName} as ${topRank}.`, { type: 'faction', weight: 8, tags: ['faction', 'identity'] });
              const changes = apply(c2, { happiness: 16, karma: 6, fame: 8 });
              return {
                text: `{They give you a send-off that is more sincere than you expected|`
                  + `Somebody makes a speech and mostly means it|`
                  + `Nobody replaces you right away, which is its own kind of compliment}. `
                  + `${topRank}, and then nothing you owe anyone any more. ${formatMoney(payout, cur.id)} and a clean exit.`,
                changes,
              };
            },
          });
        }

        list.push({
          id: 'leave', label: `Cut ties with ${s.factionName}`, danger: true,
          effect: (c2, sl) => {
            c2.character.faction = null;
            c2.character.factionRank = 0;
            c2.character.factionStanding = 0;
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
