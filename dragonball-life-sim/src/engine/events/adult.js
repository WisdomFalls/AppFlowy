// The long middle of a life: the years after you have stopped being promising
// and before anyone calls you old.

import { registerEvents, pickNpc, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, bumpThread, trainYear, powerLine,
  meetCanon, canonHere, odds, killNpc, findNpc, scaledFoePower, moveTo, bondScore, localMoney } from './helpers.js';
import { fight, narrateFight, describeGap } from '../combat.js';
import { combatPower, powerTier } from '../stats.js';
import { numberish } from '../text.js';
import { generateSignatureName } from '../../data/names.js';
import { TECH_BY_ID, TECHNIQUES } from '../../data/techniques.js';

registerEvents([
  {
    id: 'student_surpasses', tags: ['social', 'mentor', 'thread'], weight: 22,
    minBioAge: 24,
    when: (ctx) => ctx.npcs.some((n) => ['student', 'child'].includes(n.relation) && n.age > 12),
    slots: (ctx) => {
      const pool = ctx.npcs.filter((n) => ['student', 'child'].includes(n.relation) && n.age > 12);
      if (!pool.length) return null;
      return npcSlot(ctx.rng.pick(pool));
    },
    title: (ctx, s) => `${s.npcName} Has Got Better Than You`,
    text: `{You notice it mid-spar|It has been true for a while|They stop holding back and you understand}:
      [npcName] {is faster than you now|does not need you any more|has passed you}.
      {Neither of you says it out loud|They apologise, which is worse|You both pretend it was a fluke}.`,
    choices: (ctx, s) => [
      { id: 'proud', label: 'Be glad about it', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 20, respect: 20, power: 1.2 });
        const changes = apply(c2, { happiness: 16, karma: 6, stats: { charisma: 3, discipline: 2 } });
        fact(c2, `${npc.name} surpassed them, and they were pleased about it.`,
          { type: 'legacy', weight: 5, subject: npc.id, tags: ['mentor'] });
        return { text: `{This is the entire point of teaching somebody|You tell them so|You do not tell them, but you sleep well}. {Something in you settles|It is the best thing that has happened in years|You start planning what to teach them next}.`, changes };
      } },
      { id: 'chase', label: 'Refuse to be left behind', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { tension: 14, respect: 8 });
        const t = trainYear(c2, { intensity: 1.6 });
        const changes = apply(c2, { health: -14, happiness: -4, stats: { discipline: 5 } });
        return { text: `{You train like you are twenty again|It hurts constantly|You are not finished}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'stop', label: 'Stop teaching them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: -25, tension: 20, respect: -10 });
        const changes = apply(c2, { happiness: -12, karma: -5 });
        return { text: `{You find a reason|You do not explain|They work out why eventually}. {It is small of you and you know it|Neither of you recovers from this quickly|They find another teacher}.`, changes };
      } },
    ],
  },

  {
    id: 'mentor_dies', tags: ['social', 'loss', 'thread'], weight: 20,
    minBioAge: 20,
    when: (ctx) => ctx.npcs.some((n) => n.relation === 'mentor' && n.alive && !n.isCanon),
    slots: (ctx) => {
      const pool = ctx.npcs.filter((n) => n.relation === 'mentor' && n.alive && !n.isCanon);
      if (!pool.length) return null;
      return npcSlot(ctx.rng.pick(pool));
    },
    title: (ctx, s) => `${s.npcName} Is Dying`,
    text: `{Age, in the end|Something they picked up years ago|Nobody expected it to be this}.
      [npcName] {sends for you|does not send for you and you go anyway|has about a season left}.`,
    choices: (ctx, s) => [
      { id: 'stay', label: 'Stay with them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const teachable = (npc.techniques || []).filter((t) => !c2.character.techniques.includes(t));
        let learned = null;
        if (teachable.length) {
          learned = c2.rng.pick(teachable);
          c2.character.techniques.push(learned);
          c2.state.stats.techniquesLearned++;
        }
        killNpc(c2, npc, 'Age, at the end');
        c2.character.flags.grief = true;
        const changes = apply(c2, { happiness: -18, karma: 8, stats: { discipline: 4, technique: 3 } });
        fact(c2, `Was with ${npc.name} at the end.`, { type: 'loss', weight: 6, subject: npc.id, tags: ['loss', 'mentor'] });
        return { text: `{You stay|You do not leave the room|There is not much talking}. ${learned ? `{The last thing they teach you|At the end they show you|They spend the final week on} the ${TECH_BY_ID[learned].name}.` : `{They talk about somebody you never met|They ask about your training|Mostly you sit there}.`} #grief#`, changes };
      } },
      { id: 'away', label: 'Stay away', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        killNpc(c2, npc, 'Age, at the end');
        c2.character.flags.grief = true;
        const changes = apply(c2, { happiness: -22, karma: -6 });
        return { text: `{You cannot make yourself go|You are training|You tell yourself there is time}. {There was not|You hear about it four days later|Somebody else was with them}. #grief#`, changes };
      } },
    ],
  },

  {
    id: 'old_wound', tags: ['health', 'setback'], weight: 16,
    minBioAge: 26,
    when: (ctx) => ctx.state.stats.fights > 4,
    slots: (ctx) => ({
      part: ctx.rng.pick(['the shoulder', 'your left knee', 'the ribs on that side',
        'your right hand', 'the base of your spine', 'the eye']),
    }),
    title: 'An Old Injury',
    text: `[part:cap]. {It never healed properly|You have been managing it for years|It picks its moment}.
      {It goes mid-technique|You cannot close the hand|Something gives out under load}.`,
    choices: () => [
      { id: 'surgery', label: 'Get it properly fixed', effect: (ctx) => {
        const cost = ctx.rng.int(60000, 400000);
        if (ctx.character.zeni < cost) {
          const changes = apply(ctx, { health: -10, stats: { strength: -3 } });
          return { text: `{The surgery costs ${localMoney(ctx, cost)}|You cannot afford it|You get the estimate and laugh}. You live with it.`, changes };
        }
        const changes = apply(ctx, { zeni: -cost, health: 25, stats: { durability: 3 }, happiness: 6 });
        return { text: `{Months on your back|A good surgeon and a bad year|It works}. {You come back slower and whole|It holds|You are careful with it now}.`, changes };
      } },
      { id: 'adapt', label: 'Build a style around it', effect: (ctx) => {
        const changes = apply(ctx, { stats: { technique: 6, intellect: 3, strength: -2 }, happiness: 3 });
        fact(ctx, 'Rebuilt their whole style around an injury that never healed.', { weight: 4, tags: ['identity'] });
        return { text: `{You stop using it|You rebuild everything around the gap|It changes how you fight and the change is an improvement}. {Nobody else notices|Opponents find out too late|It becomes the thing you are known for}.`, changes };
      } },
      { id: 'ignore', label: 'Ignore it', effect: (ctx) => {
        const changes = apply(ctx, { health: -18, stats: { strength: 2, discipline: 3 } });
        return { text: `{You train through it|It gets worse|You do not mention it to anyone}. {It will matter later|You are storing this up|Fine for now}.`, changes };
      } },
    ],
  },

  {
    id: 'home_destroyed', tags: ['setback', 'threat'], weight: 12,
    minBioAge: 16,
    slots: (ctx) => ({
      cause: ctx.rng.pick(['a fight between two people who were not aiming at it',
        'an orbital strike from something that did not stop to explain',
        'a beam that missed its target by four kilometres',
        'somebody settling a grudge with the wrong address',
        'a creature that ate the district and left']),
    }),
    title: 'It Is Gone',
    text: `{Where you live|The place you grew up|The town} is {rubble|a crater|no longer there}: [cause].
      {You were not there|You were four streets away|You watched it happen from the air and could not close the distance}.`,
    choices: (ctx, s) => [
      { id: 'rebuild', label: 'Rebuild it', effect: (c2) => {
        const changes = apply(c2, { zeni: -Math.min(c2.character.zeni, 500000), karma: 12, happiness: -8, fame: 4 });
        fact(c2, 'Rebuilt a place that had been flattened.', { weight: 4, tags: ['hero'] });
        return { text: `{It takes three years|You do most of it with your hands|Other people turn up and help}. {It is not the same|It is close enough|Somebody names a street after you and you make them stop}.`, changes };
      } },
      { id: 'hunt', label: 'Find whoever did it', effect: (c2, sl) => {
        const foe = stranger(c2, { relation: 'enemy', powerTarget: scaledFoePower(c2, 1.3, 0.6), metHow: 'vendetta' });
        thread(c2, 'vendetta', foe.id, { title: `${foe.name} destroyed your home`, heat: 85, maxStage: 3 });
        c2.character.flags.grief = true;
        c2.character.flags.homeworld_destroyed = true;
        const changes = apply(c2, { happiness: -14, karma: -4, stats: { discipline: 5 } });
        fact(c2, `${foe.name} destroyed their home. That is not finished.`, { weight: 6, subject: foe.id, tags: ['vendetta'] });
        return { text: `{It takes a year to get a name|Somebody talks|You find out who}. ${foe.name}. {You do not go straight there|You start training differently|Everything after this has a shape to it}.`, changes };
      } },
      { id: 'leave', label: 'Leave and do not look back', effect: (c2) => {
        c2.character.flags.grief = true;
        const changes = apply(c2, { happiness: -16, stats: { discipline: 4, charisma: -3 } });
        return { text: `{You take what fits in a bag|There is nothing to stay for|You do not go back, ever}. #grief#`, changes };
      } },
    ],
  },

  {
    id: 'public_failure', tags: ['fame', 'setback'], weight: 14,
    minBioAge: 18,
    when: (ctx) => ctx.character.fame > 12,
    slots: (ctx) => ({
      what: ctx.rng.pick(['your technique fails in front of a crowd',
        'you are beaten by somebody nobody has heard of', 'you freeze',
        'you break a promise in public', 'the footage of you losing is everywhere',
        'you are late to something that mattered and people died']),
    }),
    title: 'In Front of Everyone',
    text: `[what:cap]. {It is broadcast|Everyone sees it|There are eleven angles of it}.
      {The commentary is brutal|Nobody says anything, which is worse|Your name trends for a week}.`,
    choices: () => [
      { id: 'own', label: 'Own it publicly', effect: (ctx) => {
        const changes = apply(ctx, { fame: -4, karma: 8, happiness: 4, stats: { charisma: 5 } });
        fact(ctx, 'Failed in public and said so out loud.', { weight: 3, tags: ['fame'] });
        return { text: `{You say what happened|No excuses|You name the mistake}. {It costs you the sponsors|People respect it more than a win|Half of them hate you anyway}.`, changes };
      } },
      { id: 'vanish', label: 'Disappear for a while', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 1.5 });
        const changes = apply(ctx, { fame: -12, happiness: -6, health: -8, stats: { discipline: 6 } });
        return { text: `{You go somewhere with no cameras|Nobody hears from you for two years|You leave the planet, briefly}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'blame', label: 'Blame somebody else', effect: (ctx) => {
        const changes = apply(ctx, { fame: 3, karma: -12, happiness: -4, stats: { charisma: -3 } });
        return { text: `{You name somebody|It works|Nobody who was there believes you}. {It buys you a year|The people who matter noticed|You have to keep it up now}.`, changes };
      } },
    ],
  },

  {
    id: 'wandering_warrior', tags: ['social', 'training'], weight: 18,
    minBioAge: 16,
    slots: (ctx) => ({
      why: ctx.rng.pick(['they are walking somewhere and it is a long way',
        'they are being followed and would rather not say by what',
        'they heard there was a fighter here', 'they have nowhere to sleep',
        'their ship is a hole in a field two valleys over']),
    }),
    title: 'A Stranger Asks For Shelter',
    text: `{They knock|They are simply outside|They are asleep against your wall by morning}.
      {They have|You notice} #strangerLook#, and they are #strangerVibe#. Apparently [why].`,
    choices: () => [
      { id: 'take_in', label: 'Take them in', effect: (ctx) => {
        const npc = stranger(ctx, { relation: 'friend', closeness: 45, respect: 40, powerScale: 1.8, metHow: 'shelter' });
        const teach = (npc.techniques || []).filter((t) => !ctx.character.techniques.includes(t));
        const changes = apply(ctx, { karma: 8, happiness: 8, zeni: -ctx.rng.int(2000, 30000) });
        let text = `${npc.name} stays {a week|a season|far longer than either of you planned}. {They fight nothing like anyone here|They eat everything|They talk in their sleep}.`;
        if (odds(ctx, 0.45)) {
          const t = trainYear(ctx, { intensity: 1.2, mentorMult: 1.4 });
          relate(ctx, npc, { relation: 'mentor', respect: 20, closeness: 10 });
          text += ` {They teach you something before they go|You spar every morning|You get better simply from being near them}. ${powerLine(t.gained)}`;
        }
        fact(ctx, `Took in ${npc.name}, who was passing through.`, { weight: 3, subject: npc.id, tags: ['social'] });
        return { text, changes };
      } },
      { id: 'fight', label: 'Test them first', effect: (ctx) => {
        const foe = stranger(ctx, { powerTarget: scaledFoePower(ctx, 1.4, 0.6), relation: 'acquaintance', metHow: 'test' });
        const res = fight(ctx.state, ctx.rng, foe, { lethality: 0.02, maxRounds: 4 });
        ctx.state.stats.fights++;
        if (res.won) ctx.state.stats.wins++; else ctx.state.stats.losses++;
        relate(ctx, foe, { respect: 25, closeness: 15, relation: 'friend' });
        const dmg = Math.min(Math.round(res.damageTaken * 0.5), Math.max(0, ctx.character.vitals.health - 15));
        const changes = apply(ctx, { health: -dmg, stats: { technique: 2 }, happiness: 5 });
        return { text: `${narrateFight(res, ctx.rng, foe.name)} {Afterwards you feed them|They laugh and ask for a bed|Neither of you mentions it again}.`, changes };
      } },
      { id: 'refuse', label: 'Send them on', effect: (ctx) => {
        const changes = apply(ctx, { karma: -4 });
        return { text: `{You point them at the road|You do not open the door|They do not argue}. {You wonder about it later|Nothing comes of it|You hear their name years afterwards and it is bigger than you expected}.`, changes };
      } },
    ],
  },

  {
    id: 'lost_scroll', tags: ['discovery', 'technique'], weight: 14,
    minBioAge: 14,
    slots: (ctx) => ({
      where: ctx.rng.pick(['in a collapsed temple', 'in a dead soldier\'s pack',
        'walled up in a building nobody has entered in a century', 'at the bottom of a lake',
        'in a market stall between a kettle and a boot', 'in the ruins of a school that burned']),
      thing: '#macguffin#',
    }),
    title: 'Somebody Wrote This Down',
    text: `[where:cap], you find [thing]. {The diagrams are wrong in a way that might be deliberate|Half of it is missing|It is in a hand you cannot read}.
      {Somebody spent a life on this|It has been waiting a long time|Whoever wrote it did not survive it}.`,
    choices: (ctx, s) => [
      { id: 'decode', label: 'Work it out', effect: (c2) => {
        const c = c2.character;
        const pool = TECHNIQUES.filter((t) => !c.techniques.includes(t.id)
          && (!t.races || t.races.includes(c.raceId))
          && t.prereq.every((p) => c.techniques.includes(p)));
        if (pool.length && odds(c2, 0.45 + c.stats.intellect / 300)) {
          const tech = c2.rng.pick(pool);
          c.techniques.push(tech.id);
          c2.state.stats.techniquesLearned++;
          const changes = apply(c2, { stats: { intellect: 4, technique: 4 }, happiness: 12 });
          fact(c2, `Reconstructed the ${tech.name} from a document nobody else could read.`,
            { type: 'technique', weight: 5, tags: ['technique', 'discovery'] });
          return { text: `{It takes two years|You reconstruct the missing half yourself|You get it wrong eleven times}. The ${tech.name}. ${tech.desc}`, changes };
        }
        const changes = apply(c2, { stats: { intellect: 3 }, happiness: -3, health: -6 });
        return { text: `{You cannot crack it|What you manage to do sets fire to a wall|It is beyond you for now}. {You keep it|You put it somewhere safe|Somebody better than you might manage it}.`, changes };
      } },
      { id: 'sell', label: 'Sell it', effect: (c2) => {
        const price = c2.rng.int(80000, 1200000);
        const changes = apply(c2, { zeni: price, karma: -3 });
        return { text: `{A collector|A school|Somebody who does not give a name} pays ${localMoney(c2, price)}. {You do not ask what they want it for|You regret it within a decade|It was only paper}.`, changes };
      } },
      { id: 'burn', label: 'Destroy it', effect: (c2) => {
        const changes = apply(c2, { karma: 6, happiness: -4, stats: { discipline: 4 } });
        fact(c2, 'Destroyed a technique rather than let it exist.', { weight: 4, tags: ['identity'] });
        return { text: `{Some things should not be reconstructed|You read enough to know why it was buried|It burns badly, which figures}. {Nobody will ever know|You are the last person who saw it|That is the end of that}.`, changes };
      } },
    ],
  },

  {
    id: 'offer_to_lead', tags: ['career', 'opportunity', 'fame'], weight: 14,
    minBioAge: 24,
    when: (ctx) => ctx.character.fame > 20 || ctx.character.stats.charisma > 65,
    slots: (ctx) => ({
      what: ctx.rng.pick(['a martial arts federation with money and no spine',
        'the defence of an entire region', 'a school that has lost its master',
        'a crew that needs somebody to be in charge', 'a village that has decided you are in charge already',
        'a Galactic Patrol division nobody else wants']),
    }),
    title: 'They Want You In Charge',
    text: `[what:cap]. {They are serious|The offer is on paper|Somebody has already told everyone you said yes}.
      {It would end your training|It is more meetings than fighting|You would be responsible for people}.`,
    choices: () => [
      { id: 'accept', label: 'Take it', effect: (ctx) => {
        const changes = apply(ctx, { fame: 12, zeni: ctx.rng.int(80000, 900000), karma: 6,
          stats: { charisma: 6, discipline: 3, strength: -2 }, happiness: 4 });
        fact(ctx, 'Ended up running something.', { type: 'career', weight: 4, tags: ['career'] });
        return { text: `{You are not good at it to begin with|You are better at it than anyone expected|It is nothing like fighting}. {Your training suffers|You learn a different kind of hard|People rely on you now}.`, changes };
      } },
      { id: 'refuse', label: 'Refuse', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 1.3 });
        const changes = apply(ctx, { fame: -3, happiness: 4, stats: { discipline: 3 } });
        return { text: `{You are not built for it|You say no in one sentence|They ask three times}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'anniversary', tags: ['quiet', 'social'], weight: 14,
    minBioAge: 18,
    when: (ctx) => Object.values(ctx.state.npcs).some((n) => !n.alive && n.closeness > 45),
    slots: (ctx) => {
      const dead = Object.values(ctx.state.npcs).filter((n) => !n.alive && n.closeness > 45);
      if (!dead.length) return null;
      const npc = ctx.rng.pick(dead);
      return { npcId: npc.id, npcName: npc.name, since: Math.max(1, ctx.year - (npc.deadSince || ctx.year)) };
    },
    title: (ctx, s) => `${s.npcName}, [since] Years On`,
    text: `{It is the same week every year|You had not thought about it and then you had|Something reminds you}:
      [npcName] has been gone [since] years. #ambience#`,
    choices: (ctx, s) => [
      { id: 'visit', label: 'Go where they are buried', effect: (c2, sl) => {
        const changes = apply(c2, { happiness: -4, karma: 4, stats: { discipline: 3 } });
        return { text: `{You do not say much|You say a great deal, out loud, alone|You sit there until it gets dark}. {It does not fix anything|You go every year now|It helps and you would not admit that}.`, changes };
      } },
      { id: 'train', label: 'Train instead', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.4 });
        const changes = apply(c2, { happiness: -6, stats: { discipline: 4 } });
        return { text: `{You do not go|You work instead|It is the only thing that helps and it does not help}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'wish', label: 'Start looking for the Dragon Balls', effect: (c2, sl) => {
        thread(c2, 'revival', sl.npcId, { title: `Bring back ${sl.npcName}`, heat: 70, maxStage: 3 });
        const changes = apply(c2, { happiness: 6, stats: { discipline: 3 } });
        fact(c2, `Decided to bring ${sl.npcName} back.`, { weight: 5, subject: sl.npcId, tags: ['dragonball'] });
        return { text: `{There is a way|Seven of them|People have done this before}. {You start asking questions|You buy a radar|It gives the years a shape}.`, changes };
      } },
    ],
  },

  {
    id: 'power_temptation', tags: ['villain', 'opportunity'], weight: 14,
    minBioAge: 18,
    slots: (ctx) => ({
      offer: ctx.rng.pick(['a fruit from a tree that drains whole worlds',
        'a wizard who can take the lid off what you already are',
        'a machine that would replace most of you with something better',
        'a contract with an empire, signed in front of witnesses',
        'a jar of something a dying scientist says will work']),
    }),
    title: 'The Shortcut',
    text: `{Somebody offers you|You are shown|It is put in front of you}: [offer].
      {It would work|It would definitely work|That is what makes it a problem}. {There is a price and they are being honest about it|They do not mention the price|You already know the price}.`,
    choices: (ctx, s) => [
      { id: 'take', label: 'Take it', danger: true, effect: (c2) => {
        const mult = c2.rng.float(1.8, 4.5);
        const changes = apply(c2, { powerMult: mult, karma: -20, happiness: 6, health: -12 });
        c2.character.flags.took_shortcut = true;
        c2.character.traits.push('compromised');
        fact(c2, 'Took a shortcut to power and paid for it in the usual currency.',
          { weight: 7, tags: ['villain', 'power'] });
        return { text: `{It works immediately|It is the best you have ever felt|Everything gets brighter and louder}. Power multiplied ${mult.toFixed(1)} times. {Something is different about you afterwards|People who knew you notice|You do not care, which is itself the change}.`, changes };
      } },
      { id: 'refuse', label: 'Refuse it', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.4 });
        const changes = apply(c2, { karma: 12, happiness: 4, stats: { discipline: 6 } });
        fact(c2, 'Was offered power for nothing and said no.', { weight: 5, tags: ['identity'] });
        return { text: `{You say no|You destroy it|You walk away and keep walking}. {It costs you years|You will wonder about it|Somebody else takes the offer, and you meet them later}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'destroy', label: 'Destroy it so nobody else can', effect: (c2, sl) => {
        const enemy = stranger(c2, { relation: 'enemy', tension: 70, powerTarget: scaledFoePower(c2, 1.2), metHow: 'vendetta' });
        thread(c2, 'vendetta', enemy.id, { title: `${enemy.name} wanted what you destroyed`, heat: 70, maxStage: 3 });
        const changes = apply(c2, { karma: 16, happiness: -2, health: -10 });
        fact(c2, 'Destroyed something that should not have existed.', { weight: 6, tags: ['hero'] });
        return { text: `{You break it in front of them|It takes some doing|There is a great deal of shouting}. ${enemy.name} {is not going to forget this|had plans for it|will be back}.`, changes };
      } },
    ],
  },

  {
    id: 'recognised_late', tags: ['social', 'fame', 'quiet'], weight: 14,
    minBioAge: 30,
    when: (ctx) => ctx.memory.facts.length > 8,
    slots: (ctx) => {
      const old = ctx.memory.facts.filter((f) => f.year < ctx.age - 12 && f.weight >= 3);
      if (!old.length) return null;
      const f = ctx.rng.pick(old);
      return { memory: f.text, years: ctx.age - f.year };
    },
    title: 'Somebody Remembers',
    text: `{A stranger stops you|Somebody at the next table|A woman with grey hair} says a name you have not heard in [years] years.
      They were there. [memory]`,
    choices: () => [
      { id: 'talk', label: 'Sit down with them', effect: (ctx) => {
        const npc = stranger(ctx, { relation: 'friend', closeness: 50, respect: 55, minAge: Math.max(20, ctx.age - 20), maxAge: ctx.age + 20, metHow: 'memory' });
        const changes = apply(ctx, { happiness: 14, stats: { charisma: 2 } });
        return { text: `{You talk for four hours|They remember it completely differently|They tell you what happened afterwards, which you never knew}. ${npc.name} {leaves you their address|becomes a fixture|had been looking for you for a long time}.`, changes };
      } },
      { id: 'deny', label: 'Say they have the wrong person', effect: (ctx) => {
        const changes = apply(ctx, { happiness: -6, fame: -2 });
        return { text: `{You lie|You say the name means nothing|They do not believe you and they let it go}. {You think about it for weeks|It follows you|Some part of you wanted to be found}.`, changes };
      } },
    ],
  },

  {
    id: 'retirement_question', tags: ['quiet', 'career'], weight: 14,
    minBioAge: 40,
    slots: () => ({}),
    title: 'How Much Longer',
    text: `{Somebody asks you outright|You catch yourself doing the sums|A doctor puts it plainly}: how much longer are you doing this?
      {The honest answer is that you do not know|You have never considered stopping|You have considered nothing else lately}.`,
    choices: () => [
      { id: 'never', label: 'Until it kills you', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 1.5 });
        const changes = apply(ctx, { health: -10, happiness: 6, stats: { discipline: 6 } });
        fact(ctx, 'Decided they were never going to stop.', { weight: 4, tags: ['identity'] });
        return { text: `{There is no version of you that stops|You say it out loud and it is true|It is not a decision so much as an admission}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'teach', label: 'Move to teaching', effect: (ctx) => {
        const npc = stranger(ctx, { relation: 'student', closeness: 40, respect: 70, minAge: 8, maxAge: 22, metHow: 'student' });
        npc.power = Math.max(1, Math.round(ctx.character.power * 0.02));
        npc.techniques = ctx.character.techniques.slice(0, 5);
        thread(ctx, 'legacy', npc.id, { title: `Teaching ${npc.name}`, heat: 50, maxStage: 4 });
        const changes = apply(ctx, { happiness: 14, karma: 8, stats: { charisma: 4, technique: 3 } });
        fact(ctx, 'Started teaching rather than competing.', { weight: 4, tags: ['legacy'] });
        return { text: `{You open a room and people come|${npc.name} is the first|It is quieter and it suits you}. {You are better at this than you were at the other thing|It does not feel like giving up|Mostly}.`, changes };
      } },
      { id: 'quit', label: 'Actually stop', effect: (ctx) => {
        ctx.character.flags.retired = true;
        const changes = apply(ctx, { happiness: 20, health: 20, stats: { discipline: -4 } });
        fact(ctx, 'Stopped fighting. Genuinely stopped.', { weight: 5, tags: ['identity'] });
        return { text: `{You put it down|The relief is enormous and slightly insulting|You do not train for a whole year}. #joy# {It lasts as long as it lasts|You mean it|Nobody who knows you believes it}.`, changes };
      } },
    ],
  },
]);
