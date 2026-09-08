// Living with what a fight took.
//
// An injury that only ever subtracts is a punishment, not a mechanic. These
// are the answers: an engineer who can bolt something on, a Namekian who can
// simply put it back, and the long, unglamorous business of relearning how to
// fight with a body that is a different shape than it was.

import { registerEvents } from '../generator.js';
import { apply, fact, relate, trainYear, powerLine, findNpc, canonHere, meetCanon } from './helpers.js';
import { injuries, injuryList, prostheticOptions, fitProsthetic, restoreBody,
  fittersFor, INJURIES } from '../body.js';
import { getPlace } from '../../data/places.js';
import { currencyFor, priceIn, canAfford, debit, formatMoney } from '../../data/currency.js';
import { hasPerk } from '../../data/races.js';

function maimed(ctx) {
  return injuries(ctx.character).length > 0;
}

function unfixed(ctx) {
  return prostheticOptions(ctx.character);
}

registerEvents([
  {
    id: 'get_fitted', tags: ['life', 'body'], weight: 40, minBioAge: 10,
    when: (ctx) => !ctx.character.inAfterlife && unfixed(ctx).length > 0
      && fittersFor(ctx.year, ctx.place.planet).length > 0,
    slots: (ctx) => {
      const opt = unfixed(ctx)[0];
      const fitters = fittersFor(ctx.year, ctx.place.planet);
      const best = fitters.sort((a, b) => b.quality - a.quality)[0];
      const cheap = fitters.sort((a, b) => a.cost - b.cost)[0];
      return {
        missing: opt.spec.name,
        injuryId: opt.entry.id,
        side: opt.entry.side || '',
        part: opt.part.name,
        bestId: best.id, bestName: best.name, bestBlurb: best.blurb,
        bestCost: best.cost, bestQuality: best.quality,
        cheapId: cheap.id, cheapName: cheap.name, cheapBlurb: cheap.blurb,
        cheapCost: cheap.cost, cheapQuality: cheap.quality,
        same: best.id === cheap.id ? 'yes' : 'no',
      };
    },
    title: 'Something To Replace It',
    text: `{You have been managing|You have got used to it, which is not the same as being fine|`
      + `It has been long enough that people have stopped asking}. `
      + `{Somebody mentions that [missing] does not have to be permanent|`
      + `There is a way round [missing] and you have been putting it off|`
      + `[bestName] can do something about [missing]}.`,
    choices: (ctx, s) => {
      const list = [];
      const cur = currencyFor(getPlace(ctx.character.placeId).planet);
      const fit = (fitterId, quality, cost, name) => (c2, sl) => {
        const cur2 = currencyFor(getPlace(c2.character.placeId).planet);
        const price = priceIn(cost, cur2.id);
        if (price && !canAfford(c2.character, cur2.id, price)) {
          return { text: 'You cannot cover it, and they are not doing it on credit.', changes: [] };
        }
        if (price) debit(c2.character, cur2.id, price);
        const res = fitProsthetic(c2.character, sl.injuryId, quality);
        const fitter = fittersFor(c2.year, getPlace(c2.character.placeId).planet).find((f) => f.id === fitterId);
        fact(c2, `Had ${res.part ? res.part.name : 'a replacement'} fitted by ${name}.`,
          { type: 'body', weight: 6, tags: ['injury'] });
        return {
          text: `${res.text} {The first week is the worst part|`
            + `Learning it takes a season and you have the season|`
            + `You spend a month reaching for things and missing}.`,
          changes: apply(c2, { happiness: 12, karma: fitter && fitter.karma ? fitter.karma : 0 }),
        };
      };

      list.push({
        id: 'best', label: `Go to ${s.bestName}`,
        hint: `${s.bestBlurb}${s.bestCost ? ' ' + formatMoney(priceIn(s.bestCost, cur.id), cur.id) : ' No charge.'}`,
        effect: fit(s.bestId, s.bestQuality, s.bestCost, s.bestName),
      });
      if (s.same === 'no') {
        list.push({
          id: 'cheap', label: `Go to ${s.cheapName}`,
          hint: `${s.cheapBlurb}${s.cheapCost ? ' ' + formatMoney(priceIn(s.cheapCost, cur.id), cur.id) : ' No charge.'}`,
          effect: fit(s.cheapId, s.cheapQuality, s.cheapCost, s.cheapName),
        });
      }
      list.push({
        id: 'adapt', label: 'Learn to fight without it', effect: (c2, sl) => {
          const t = trainYear(c2, { intensity: 1.6 });
          c2.character.flags.adapted_to_injury = true;
          return {
            text: `{You are not having metal in you|You rebuild the whole style around the gap|`
              + `Everything you knew how to do, you learn again from the other side}. `
              + `{It takes a year and it works|You are worse at four things and better at one|`
              + `Nobody who fights you afterwards guesses}. ${powerLine(t.gained)}`,
            changes: apply(c2, { stats: { technique: 6, discipline: 5 }, happiness: 6 }),
          };
        },
      });
      list.push({
        id: 'wait', label: 'Leave it', effect: (c2) => ({
          text: `{You leave it|It is part of you now|You have stopped thinking of it as missing}.`,
          changes: apply(c2, { stats: { discipline: 2 } }),
        }),
      });
      return list;
    },
  },

  // A Namekian healer, or a wish, puts back what a machine can only replace.
  {
    id: 'healer_offers', tags: ['life', 'body', 'canon'], weight: 34, minBioAge: 8,
    when: (ctx) => !ctx.character.inAfterlife && maimed(ctx)
      && (ctx.place.planet === 'namek' || ctx.place.planet === 'new_namek'
        || canonHere(ctx, (c) => ['dende', 'guru', 'moori'].includes(c.id)).length > 0),
    slots: (ctx) => {
      const canon = canonHere(ctx, (c) => ['dende', 'guru', 'moori'].includes(c.id));
      const who = canon.length ? ctx.rng.pick(canon) : null;
      return {
        who: who ? who.name : 'an elder with both hands out',
        canonId: who ? who.id : null,
        what: injuryList(ctx.character).map((i) => i.name).join(' and '),
      };
    },
    title: 'Hands Out',
    text: `{[who] looks at you for a long moment and does not comment|`
      + `[who] asks you to sit down and puts both hands out|`
      + `Somebody notices [what] and says nothing about it, which is how you know they can help}. `
      + `{This is not medicine. It is somebody deciding you are whole and being right|`
      + `They do not explain what they are about to do|It takes about four seconds}.`,
    choices: (ctx, s) => [
      {
        id: 'accept', label: 'Let them', effect: (c2, sl) => {
          if (sl.canonId) {
            const npc = meetCanon(c2, sl.canonId);
            if (npc) relate(c2, npc, { closeness: 14, trust: 20 });
          }
          const res = restoreBody(c2.character);
          fact(c2, `Was made whole again by ${sl.who}.`, { type: 'body', weight: 8, tags: ['injury'] });
          return {
            text: `${res.text} {You look at your own hand for a while|`
              + `There is no scar and no seam and nothing to show for any of it|`
              + `Something you had accepted as permanent simply stops being true}.`,
            changes: apply(c2, { happiness: 25, health: 20 }),
          };
        },
      },
      {
        id: 'refuse', label: 'Refuse', effect: (c2, sl) => ({
          text: `{You say no|You have earned every one of these|`
            + `You would rather keep the record}. `
            + `{[who] does not argue|They put their hands down and never mention it again|`
            + `Nobody understands it, including you, entirely}.`,
          changes: apply(c2, { happiness: -4, stats: { discipline: 6 } }),
          view: { who: sl.who },
        }),
      },
    ],
  },

  // The part nobody writes about: the year after.
  {
    id: 'phantom', tags: ['life', 'body'], weight: 18, minBioAge: 10,
    when: (ctx) => maimed(ctx) && !hasPerk(ctx.character, 'regeneration'),
    slots: (ctx) => ({
      what: injuryList(ctx.character)[0]?.name || 'the injury',
      when: ctx.rng.pick(['in the middle of a movement you have done ten thousand times',
        'reaching for something on a shelf', 'halfway through a form',
        'in your sleep', 'when somebody throws you something']),
    }),
    title: 'It Is Still There',
    text: `{It happens [when]|[when], it happens again|You forget, [when], and then you remember}. `
      + `{The part of you that is gone still reports for work|`
      + `Your body has not been told|Something that is not there hurts, which is a difficult thing to explain}.`,
    choices: (ctx, s) => [
      { id: 'work', label: 'Work through it', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.5 });
        return { text: `{You drill it until the body updates its map|`
          + `Repetition is the only thing that works and it takes months|`
          + `You go at it the way you go at everything}. ${powerLine(t.gained)}`,
        changes: apply(c2, { stats: { discipline: 4, technique: 3 }, happiness: -3 }) };
      } },
      { id: 'sit', label: 'Sit with it', effect: (c2) => ({
        text: `{You stop fighting it|It is a thing that happens and then stops happening|`
          + `You let it be there}. {It gets quieter|It does not get quieter for another two years|`
          + `Some days you barely notice}.`,
        changes: apply(c2, { happiness: 6, stats: { kiControl: 3 } }),
      }) },
    ],
  },
]);
