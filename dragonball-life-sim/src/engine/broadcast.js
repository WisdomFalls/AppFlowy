// Watching television. A quiet way to spend an evening, and the one place
// news.js's galaxy headlines actually reach the player as something other
// than a panel they had to go looking for - the set finds you, the way a
// real broadcast does, instead of the other way around.

import { render } from './text.js';
import { newsFeed } from './news.js';
import { adjust } from './state.js';
import { homeOf, homeBonus } from './settlement.js';

const AMBIENT_PROGRAMS = [
  `{A cooking segment turns a Namekian water jar into "an artisanal palate cleanser"|`
    + `A home-renovation show puts a gravity chamber in somebody's garden and calls it a feature|`
    + `A talk show host interviews a man who claims he once shook Mr. Satan's hand}. `
    + `{You do not learn anything, which is the point|It is exactly as pointless as you needed it to be tonight|`
    + `Nothing about it asks anything of you}.`,
  `{A rerun of an old World Martial Arts Tournament final plays, commentary and all|`
    + `Highlights from Papaya Island run on a loop, the ring somehow still standing in every clip|`
    + `An announcer who has clearly done this for thirty years narrates a fight everyone already knows the ending to}. `
    + `{The crowd noise is the same crowd noise it always is|You could recite the next line before it's said|`
    + `It is comfortable exactly because you already know how it ends}.`,
  `{A nature documentary follows something enormous and mostly harmless across a jungle that is not this one|`
    + `A children's show explains ki as "the feeling you get when you really want a snack"|`
    + `A weather segment reports on a storm three systems over as though anyone here could do anything about it}. `
    + `{The narrator has a voice built for calming down small children and nobody else|`
    + `It is aggressively gentle in a way that works on you anyway|`
    + `You did not know you needed something this undemanding until it was on}.`,
  `{A panel show argues, at length and with real anger, about whether a fighter from decades ago could have beaten one from this year|`
    + `A call-in program takes questions from people who are certain they saw a UFO and are, this once, probably right|`
    + `A rerun of a cooking competition ends in a tie nobody involved seems happy about}. `
    + `{Nothing gets resolved and nobody involved seems to mind|You have opinions about the argument and keep them to yourself|`
    + `It is the kind of program built entirely to not require anything of you}.`,
  `{A late-night infomercial promises a training weight that "does the work for you," which is not how any of this works|`
    + `A soap opera reveals, for the fourth time this season, that a character everyone thought was dead is not|`
    + `A quiz show host asks a contestant to name three planets and gets two of them confused with moons}. `
    + `{You watch it anyway|It is bad in a way that is almost restful|None of it matters and that is exactly the appeal tonight}.`,
];

const NO_NEWS_LEAD = [
  'Nothing new tonight. The same stories run twice, the way they do on a slow week.',
  'The news desk is stretching a quiet week into a full segment, and everyone involved knows it.',
  'Nothing has happened worth the airtime, so the airtime goes to something else instead.',
];

/**
 * The set finds a recent galaxy headline if there is one worth leading
 * with, and falls back to pure filler otherwise - a program built out of
 * something that actually happened reads differently from one that did not.
 */
function pickProgram(state, rng) {
  const feed = newsFeed(state, 6);
  const c = state.character;
  const fresh = feed.filter((n) => c.age - (n.year - c.birthYear) <= 3);
  if (fresh.length && rng.chance(0.55)) {
    const item = rng.pick(fresh);
    const framing = rng.pick([
      'The evening broadcast leads with it',
      'A news desk somewhere is still running this story',
      'It gets a whole segment, dressed up with a graphic',
      'Somebody with a studio and a microphone is explaining it to you',
    ]);
    return `${framing}: "${item.headline}" {They cut to a panel of people arguing about what it means|`
      + `They have nothing new to add and say so at length|The footage, such as it is, does not really show anything}.`;
  }
  return `${rng.pick(NO_NEWS_LEAD)} ${rng.pick(AMBIENT_PROGRAMS)}`;
}

/** An evening in, in front of whatever the set is showing. Requires
 * actually being home - nobody watches somebody else's television. */
export function watchBroadcast(state, rng) {
  const home = homeOf(state);
  const bonus = homeBonus(state);
  const text = render(pickProgram(state, rng), {}, rng);
  const gain = 5 + (bonus.here ? Math.min(6, bonus.comfort * 0.3) : 0);
  adjust(state, { happiness: gain });
  return { text, home: !!home };
}
