// Relationships. Friends, rivals, lovers, family, children, betrayal, and the
// strangers who turn up because of something you did three years ago.

import { registerEvents, pickNpc, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, bumpThread, trainYear, powerLine,
  meetCanon, canonHere, odds, killNpc, findNpc, bondScore, scaledFoePower } from './helpers.js';
import { makeChild, describeNpc, relationLabel } from '../npc.js';
import { addNpc } from '../state.js';
import { getRace } from '../../data/races.js';
import { numberish } from '../text.js';

const MEET_PLACES = ['at a noodle stand', 'in a queue', 'at the scene of something on fire',
  'halfway up a mountain', 'in a hospital corridor', 'at a tournament weigh-in',
  'in the wreckage of a building neither of you damaged', 'on a train',
  'while you are both stealing the same thing', 'at a funeral', 'in a spaceport departure lounge',
  'when they land on you from a great height', 'in a market that is closing'];

registerEvents([
  {
    id: 'new_friend', tags: ['social'], weight: 22,
    minBioAge: 7,
    slots: (ctx) => ({ where: ctx.rng.pick(MEET_PLACES) }),
    title: 'Somebody New',
    text: `You meet them [where]. {They have|You notice} #strangerLook#, and they are #strangerVibe#.
      {Neither of you is looking for company|You would not have chosen each other|It is not obvious why it works}.`,
    choices: (ctx, s) => [
      { id: 'friend', label: 'Make a friend of them', effect: (c2) => {
        const npc = stranger(c2, { relation: 'friend', closeness: c2.rng.int(45, 70), respect: c2.rng.int(30, 60), metHow: 'chance' });
        const changes = apply(c2, { happiness: 10, stats: { charisma: 2 } });
        fact(c2, `Became friends with ${npc.name}.`, { type: 'friend', weight: 2, subject: npc.id, tags: ['social'] });
        return { text: `${npc.name}. {They talk too much|They barely talk at all|They are looking for ${npc.goal}} and {somehow it works|you like them immediately|it takes a while}. #ambience#`, changes };
      } },
      { id: 'spar', label: 'Fight them instead', effect: (c2) => {
        const npc = stranger(c2, { relation: 'rival', powerTarget: scaledFoePower(c2, 0.9, 0.6), closeness: 25, tension: 35, metHow: 'fight' });
        const better = npc.power > c2.power;
        relate(c2, npc, { respect: 20 });
        thread(c2, 'rivalry', npc.id, { title: `Rivalry with ${npc.name}`, heat: 55, maxStage: 4 });
        const changes = apply(c2, { health: -8, happiness: 6, stats: { technique: 2 } });
        fact(c2, `Started a rivalry with ${npc.name}.`, { type: 'rival', weight: 3, subject: npc.id, tags: ['rival'] });
        return { text: `{It starts over nothing|Somebody says the wrong thing|You do not remember who started it}. ${better ? `${npc.name} is better than you and you both find that out at the same time.` : `You win, and ${npc.name} takes it much better than you would have.`} {They will be back|You exchange names afterwards|Neither of you calls it a rivalry out loud}.`, changes };
      } },
      { id: 'pass', label: 'Keep walking', effect: () => ({ text: `{You do not stop|You have somewhere to be|Some other life, maybe}.` }) },
    ],
  },

  {
    id: 'romance_spark', tags: ['social', 'romance'], weight: 18,
    minBioAge: 15, maxBioAge: 70,
    when: (ctx) => !ctx.rel('spouse').length,
    slots: (ctx) => {
      const existing = ctx.npcs.filter((n) => ['friend', 'bestfriend', 'colleague', 'rival'].includes(n.relation) && n.closeness > 45);
      if (existing.length && ctx.rng.chance(0.55)) return npcSlot(ctx.rng.pick(existing));
      return { npcId: null, npcName: null };
    },
    title: 'Something Else',
    text: (ctx, s) => s.npcId
      ? `It has been {building|there for a while|obvious to everyone but you} with [npcName].
         {Neither of you says it|One of you finally says it|It comes out badly and at the wrong moment}.`
      : `You meet somebody. {They have|There is} #strangerLook#, and a way of {looking at you|listening|leaving} that you think about afterwards.`,
    choices: (ctx, s) => [
      { id: 'pursue', label: 'Say something', effect: (c2, sl) => {
        let npc = sl.npcId ? findNpc(c2.state, sl.npcId) : null;
        if (!npc) {
          npc = stranger(c2, { relation: 'lover', closeness: 55, romance: 55, minAge: Math.max(16, c2.age - 8), maxAge: c2.age + 8, metHow: 'romance' });
        } else {
          relate(c2, npc, { relation: 'lover', romance: 45, closeness: 15 });
        }
        const changes = apply(c2, { happiness: 18, stats: { charisma: 2 } });
        fact(c2, `Fell for ${npc.name}.`, { type: 'romance', weight: 4, subject: npc.id, tags: ['romance'] });
        thread(c2, 'romance', npc.id, { title: `${npc.name}`, heat: 60, maxStage: 4 });
        return { text: `{It is not smooth|You handle it badly and it works anyway|Neither of you is good at this}. ${npc.name} {says yes|laughs and says yes|says "finally"}. #joy#`, changes };
      } },
      { id: 'train', label: 'You do not have time for this', effect: (c2) => {
        const t = trainYear(c2, { intensity: 1.3 });
        const changes = apply(c2, { happiness: -6, stats: { discipline: 3 } });
        return { text: `{You choose the work|You say nothing and it passes|There will be time later, you tell yourself}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'marriage', maxUses: 3, tags: ['social', 'romance'], weight: 26,
    minBioAge: 17,
    when: (ctx) => ctx.rel('lover').some((n) => n.romance > 55 && n.closeness > 55) && !ctx.rel('spouse').length,
    slots: (ctx) => {
      const lover = ctx.rel('lover').filter((n) => n.romance > 55 && n.closeness > 55).sort((a, b) => b.romance - a.romance)[0];
      return npcSlot(lover);
    },
    title: (ctx, s) => `Marrying ${s.npcName}?`,
    text: `{One of you asks|It comes up over dinner|Their family asks first, which is worse}.
      [npcName] {is serious|means it|has clearly been thinking about it for a while}.`,
    choices: (ctx, s) => [
      { id: 'yes', label: 'Marry them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { relation: 'spouse', closeness: 20, romance: 25 });
        const changes = apply(c2, { happiness: 22, zeni: -c2.rng.int(20000, 200000), fame: 2 });
        fact(c2, `Married ${npc.name}.`, { type: 'marriage', weight: 6, subject: npc.id, tags: ['romance', 'family'] });
        return { text: `{It is a small wedding|It is an enormous wedding|Somebody destroys part of the venue and it is still the best day of the year}. #joy#`, changes };
      } },
      { id: 'no', label: 'Say no', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: -30, romance: -40, tension: 25 });
        const changes = apply(c2, { happiness: -14 });
        fact(c2, `Turned down ${npc.name}.`, { type: 'romance', weight: 3, subject: npc.id, tags: ['romance'] });
        return { text: `{They take it well, which is worse|They do not take it well|Neither of you brings it up again}. Things are {different afterwards|never quite the same|quieter}.`, changes };
      } },
      { id: 'later', label: 'Not yet', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { tension: 10, romance: -5 });
        return { text: `{"Not yet" is a whole sentence|You buy time|They accept it and start counting}.` };
      } },
    ],
  },

  {
    id: 'have_child', tags: ['social', 'family'], weight: 24,
    minBioAge: 18, maxBioAge: 55,
    when: (ctx) => {
      const race = getRace(ctx.character.raceId);
      if (race.perks.includes('asexualBirth')) return ctx.rng.chance(0.4);
      return ctx.rel('spouse').length > 0 || ctx.rel('lover').some((n) => n.romance > 65);
    },
    slots: (ctx) => {
      const race = getRace(ctx.character.raceId);
      if (race.perks.includes('asexualBirth')) return { partnerId: null, partnerName: null, asexual: true };
      const partner = ctx.rel('spouse')[0] || ctx.rel('lover').sort((a, b) => b.romance - a.romance)[0];
      if (!partner) return null;
      return { partnerId: partner.id, partnerName: partner.name, asexual: false };
    },
    title: 'A Child',
    text: (ctx, s) => s.asexual
      ? `{The egg is smaller than you expected|It happens the way it happens for your people|Nobody explained this part}.
         Namekians do this alone, and {you are not sure you are ready|it is time|it was not a decision so much as a fact}.`
      : `[partnerName] {tells you|shows you the scan|says it in the middle of something else}. {You are going to be a parent|There is going to be a child|Everything is about to change}.`,
    choices: (ctx, s) => [
      { id: 'have', label: 'Have the child', effect: (c2, sl) => {
        const partner = sl.partnerId ? findNpc(c2.state, sl.partnerId) : null;
        const child = makeChild(c2.rng, c2.character, partner, c2.year);
        addNpc(c2.state, child);
        const changes = apply(c2, { happiness: 20, zeni: -c2.rng.int(5000, 40000), health: -3 });
        fact(c2, `${child.name} was born.`, { type: 'child', weight: 7, subject: child.id, tags: ['family'] });
        thread(c2, 'parenthood', child.id, { title: `Raising ${child.name}`, heat: 60, maxStage: 5 });
        return { text: `${child.name}. {Small, loud, and already stronger than they should be|They have your eyes and somebody else's temper|You hold them and something in your chest reorganises itself}. ${child.inheritedPower > c2.character.power ? `{Something in them is already bigger than you|Their potential is frightening|You can feel it, and it is enormous}.` : ``}`, changes };
      } },
      { id: 'unready', label: 'You are not built for this', effect: (c2, sl) => {
        const partner = sl.partnerId ? findNpc(c2.state, sl.partnerId) : null;
        if (partner) relate(c2, partner, { closeness: -25, tension: 30 });
        const changes = apply(c2, { happiness: -12, karma: -4 });
        return { text: `{You say so out loud|You leave for six months|You do not handle it well}. {It is not forgiven quickly|Nobody comes out of this well|The subject is closed}.`, changes };
      } },
    ],
  },

  {
    id: 'child_grows', tags: ['social', 'family', 'parenthood'], weight: 22,
    when: (ctx) => ctx.rel('child').some((n) => n.age >= 4 && n.age <= 18),
    slots: (ctx) => {
      const kids = ctx.rel('child').filter((n) => n.age >= 4 && n.age <= 18);
      if (!kids.length) return null;
      return npcSlot(ctx.rng.pick(kids));
    },
    title: (ctx, s) => `${s.npcName} Is Growing Up`,
    text: (ctx, s) => {
      const kid = findNpc(ctx.state, s.npcId);
      return `[npcName] is ${kid ? kid.age : 8}. {They can already do things you had to learn|They ask about what you do|They broke something structural this week}.
        {Nobody has decided yet what they are going to be|You are supposed to have opinions about this|They are watching you all the time}.`;
    },
    choices: (ctx, s) => [
      { id: 'train_them', label: 'Train them', effect: (c2, sl) => {
        const kid = findNpc(c2.state, sl.npcId);
        relate(c2, kid, { closeness: 10, respect: 15, power: 1.9 });
        kid.techniques = Array.from(new Set([...(kid.techniques || []), ...c2.character.techniques.slice(0, 3)]));
        bumpThread(c2, 'parenthood', kid.id, 10);
        const changes = apply(c2, { happiness: 10, stats: { charisma: 2, discipline: 2 } });
        fact(c2, `Started training ${kid.name}.`, { type: 'family', weight: 3, subject: kid.id, tags: ['family', 'mentor'] });
        return { text: `{They are better at this than you were|They pick it up frighteningly fast|They complain constantly and improve anyway}. ${kid.name} {learns your stance|copies you exactly, including the bad habits|already has something of their own}.`, changes };
      } },
      { id: 'school', label: 'Make them study instead', effect: (c2, sl) => {
        const kid = findNpc(c2.state, sl.npcId);
        relate(c2, kid, { closeness: -4, respect: 6, tension: 8 });
        kid.stats.intellect = Math.min(99, (kid.stats.intellect || 50) + 12);
        bumpThread(c2, 'parenthood', kid.id, 5);
        const changes = apply(c2, { happiness: 3 });
        return { text: `{Somebody in this family is going to have a normal life|You have seen where the other road goes|They resent it and they will thank you later, possibly}.`, changes };
      } },
      { id: 'let_be', label: 'Let them choose', effect: (c2, sl) => {
        const kid = findNpc(c2.state, sl.npcId);
        relate(c2, kid, { closeness: 14, respect: 10, power: 1.3 });
        bumpThread(c2, 'parenthood', kid.id, 6);
        const changes = apply(c2, { happiness: 8 });
        return { text: `{You stay out of it|You wait to be asked|They will work it out}. ${kid.name} {picks something you did not expect|surprises you|goes their own way entirely}.`, changes };
      } },
    ],
  },

  {
    id: 'friend_in_trouble', tags: ['social', 'thread'], weight: 18,
    minBioAge: 12,
    when: (ctx) => ctx.npcs.some((n) => ['friend', 'bestfriend', 'spouse', 'sibling', 'child', 'student'].includes(n.relation)),
    slots: (ctx) => {
      const pool = ctx.npcs.filter((n) => ['friend', 'bestfriend', 'spouse', 'sibling', 'child', 'student'].includes(n.relation));
      if (!pool.length) return null;
      const npc = ctx.rng.pick(pool);
      return {
        ...npcSlot(npc),
        trouble: ctx.rng.pick(['owes money to people who break legs', 'has been arrested',
          'picked a fight with something out of their weight class', 'is drinking themselves into the ground',
          'has gone missing', 'took a contract they should not have taken',
          'is being leaned on by the local syndicate', 'has a debt that is being called in']),
      };
    },
    title: (ctx, s) => `${s.npcName} Is In Trouble`,
    text: `[npcName] [trouble]. {You hear it third-hand|They call you at four in the morning|Somebody else tells you, badly}.`,
    choices: (ctx, s) => [
      { id: 'help', label: 'Go and sort it out', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const violent = odds(c2, 0.6);
        relate(c2, npc, { closeness: 20, respect: 15, note: 'You showed up.' });
        const changes = apply(c2, {
          health: violent ? -12 : -2, karma: 6, happiness: 6,
          zeni: violent ? 0 : -c2.rng.int(10000, 120000), fame: violent ? 3 : 0,
        });
        fact(c2, `Got ${npc.name} out of serious trouble.`, { type: 'loyalty', weight: 3, subject: npc.id, tags: ['social'] });
        return { text: violent
          ? `You {find the people responsible|walk into the wrong building on purpose|do not use words}. {It is over in under a minute|Nobody dies|Somebody will remember your face}.`
          : `You {pay it|make a call|stand behind them while they explain themselves}. It costs you and you do not mention it again.`, changes };
      } },
      { id: 'refuse', label: 'They got themselves into it', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: -30, tension: 25, note: 'You did not come.' });
        const changes = apply(c2, { karma: -6, happiness: -8 });
        if (odds(c2, 0.3)) {
          killNpc(c2, npc, 'It went the way these things go');
          return { text: `You {stay out of it|do not answer|tell them no}. {Three weeks later|A month later|Not long after} you hear how it ended. #grief#`, changes };
        }
        return { text: `You {stay out of it|do not pick up|say no and mean it}. They {get out of it alone|do not|survive}, and something between you does not.`, changes };
      } },
    ],
  },

  {
    id: 'betrayal', tags: ['social', 'setback'], weight: 10,
    minBioAge: 15,
    when: (ctx) => ctx.npcs.some((n) => n.closeness > 40 && (n.tags.includes('devious') || n.tags.includes('jealous') || n.tension > 45)),
    slots: (ctx) => {
      const pool = ctx.npcs.filter((n) => n.closeness > 40 && (n.tags.includes('devious') || n.tags.includes('jealous') || n.tension > 45));
      if (!pool.length) return null;
      const npc = ctx.rng.pick(pool);
      return {
        ...npcSlot(npc),
        what: ctx.rng.pick(['sold your location to people who wanted it', 'took credit for what you did',
          'told them about your weakness', 'emptied your account', 'testified against you',
          'handed over the thing you asked them to keep safe', 'was working for the other side the whole time']),
      };
    },
    title: (ctx, s) => `${s.npcName}`,
    text: `[npcName] [what]. {You find out late|You find out from a stranger|You work it out yourself, which is worse}.`,
    choices: (ctx, s) => [
      { id: 'confront', label: 'Confront them', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { relation: 'enemy', closeness: -60, tension: 60 });
        c2.character.flags.betrayed = true;
        thread(c2, 'vendetta', npc.id, { title: `${npc.name} betrayed you`, heat: 75, maxStage: 3 });
        const changes = apply(c2, { happiness: -16, stats: { charisma: -2 } });
        fact(c2, `${npc.name} betrayed them.`, { type: 'betrayal', weight: 6, subject: npc.id, tags: ['betrayal'] });
        return { text: `They {do not deny it|explain, at length|say you would have done the same}. {You leave before you do something permanent|You do not raise your voice|It is the calm that frightens them}.`, changes };
      } },
      { id: 'kill', label: 'End them', danger: true, effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        killNpc(c2, npc, 'You killed them');
        c2.state.stats.kills++;
        c2.character.flags.betrayed = true;
        c2.character.flags.rage_awakened = true;
        const changes = apply(c2, { karma: -25, happiness: -10, fame: 5 });
        fact(c2, `Killed ${npc.name} for it.`, { type: 'kill', weight: 7, subject: npc.id, tags: ['betrayal', 'kill'] });
        return { text: `{It is quick|It is not quick|You do not remember deciding}. {Afterwards you sit down for a long time|Nobody saw|Somebody saw}.`, changes };
      } },
      { id: 'forgive', label: 'Let it go', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: -15, tension: 15, respect: -10 });
        const changes = apply(c2, { karma: 8, happiness: -6, stats: { discipline: 4 } });
        fact(c2, `Forgave ${npc.name} for something unforgivable.`, { type: 'mercy', weight: 4, subject: npc.id, tags: ['mercy'] });
        return { text: `You {say nothing|tell them it is finished|keep them close, which is its own kind of answer}. {It costs you more than revenge would have|You are not sure it was strength|They know what you did for them}.`, changes };
      } },
    ],
  },

  {
    id: 'family_pressure', tags: ['social', 'family'], weight: 14,
    minBioAge: 14,
    when: (ctx) => ctx.rel('parent').length > 0,
    slots: (ctx) => {
      const p = ctx.rng.pick(ctx.rel('parent'));
      return {
        ...npcSlot(p),
        want: ctx.rng.pick(['wants you to stop fighting', 'wants you to take over the family business',
          'wants to know when you are going to settle down', 'thinks you are wasting your life',
          'wants you to come home', 'has been telling everyone you are something you are not',
          'is dying and has not told you']),
      };
    },
    title: (ctx, s) => `${s.npcName}`,
    text: `[npcName] [want]. {It comes up every visit|They finally say it|You have been avoiding this conversation for years}.`,
    choices: (ctx, s) => [
      { id: 'obey', label: 'Do what they ask', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: 20, respect: 10 });
        const changes = apply(c2, { happiness: -6, karma: 4, zeni: c2.rng.int(0, 80000) });
        return { text: `{You do it|You give in|You go home for a year}. {It is not what you want and it is the right thing|They are happier than you have seen them|You resent it quietly}.`, changes };
      } },
      { id: 'refuse', label: 'Refuse', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { closeness: -18, tension: 20 });
        const t = trainYear(c2, { intensity: 1.2 });
        const changes = apply(c2, { happiness: 4, stats: { discipline: 3 } });
        return { text: `{You say no|You do not even argue|You leave that night}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'student_arrives', tags: ['social', 'mentor'], weight: 14,
    minBioAge: 22,
    when: (ctx) => ctx.character.stats.technique > 55 || ctx.character.fame > 25,
    slots: (ctx) => ({ why: ctx.rng.pick(['they saw you fight once', 'their village sent them',
      'they have nowhere else to go', 'somebody you have never met recommended you',
      'they want to beat somebody specific and you are the shortest route']) }),
    title: 'Someone Wants To Be Taught',
    text: `They are {young|not young at all|about the age you were when you started} and [why].
      {They have|You notice} #strangerLook#. {They are not talented|They are frighteningly talented|You cannot tell yet}.`,
    choices: () => [
      { id: 'take', label: 'Take them on', effect: (ctx) => {
        const npc = stranger(ctx, { relation: 'student', closeness: 40, respect: 60, minAge: 8, maxAge: 24, metHow: 'student' });
        npc.techniques = ctx.character.techniques.slice(0, 4);
        npc.power = Math.max(1, Math.round(ctx.character.power * ctx.rng.float(0.01, 0.06)));
        thread(ctx, 'legacy', npc.id, { title: `Teaching ${npc.name}`, heat: 45, maxStage: 4 });
        const changes = apply(ctx, { stats: { charisma: 3, technique: 3, discipline: 2 }, happiness: 8, fame: 3 });
        fact(ctx, `Took on ${npc.name} as a student.`, { type: 'student', weight: 4, subject: npc.id, tags: ['mentor'] });
        return { text: `${npc.name}. {The first month is chores|You make them do exactly what was done to you|You are a worse teacher than you expected}. {They stay|They keep coming back|They do not complain, which worries you}.`, changes };
      } },
      { id: 'refuse', label: 'Send them away', effect: (ctx) => {
        const changes = apply(ctx, { karma: -3, happiness: -2 });
        return { text: `{You tell them to find somebody else|You do not explain|They stand outside for two days and then they are gone}.`, changes };
      } },
      { id: 'test', label: 'Set an impossible test', effect: (ctx) => {
        if (odds(ctx, 0.4)) {
          const npc = stranger(ctx, { relation: 'student', closeness: 30, respect: 80, metHow: 'student' });
          npc.power = Math.max(1, Math.round(ctx.character.power * ctx.rng.float(0.02, 0.1)));
          npc.tags.push('patient');
          const changes = apply(ctx, { stats: { charisma: 2 }, happiness: 6 });
          fact(ctx, `${npc.name} passed a test that was designed to be unpassable.`, { type: 'student', weight: 4, subject: npc.id, tags: ['mentor'] });
          return { text: `You send them {up a mountain with no equipment|to fetch water from somewhere that has none|away for a year}. {They come back|They do it|They should not have been able to do it}. So you teach them.`, changes };
        }
        const changes = apply(ctx, { happiness: -2 });
        return { text: `They {fail|do not come back|give up in the third week}. {That is what the test was for|Most do|You do not think about it again}.`, changes };
      } },
    ],
  },

  {
    id: 'reputation_reaches', tags: ['social', 'fame'], weight: 12,
    when: (ctx) => ctx.character.fame > 20,
    slots: (ctx) => ({ what: ctx.rng.pick(['a journalist', 'a film crew', 'a sponsor',
      'somebody writing a book about fighters', 'a fan club that has been operating without your knowledge',
      'a man offering to be your manager', 'a rival school looking for a challenge match']) }),
    title: 'Being Known',
    text: `[what:cap] {finds you|turns up at your door|will not stop calling}.
      {You are apparently somebody now|People have opinions about you|Your face is on something you did not authorise}.`,
    choices: () => [
      { id: 'lean', label: 'Lean into it', effect: (ctx) => {
        const changes = apply(ctx, { fame: 12, zeni: ctx.rng.int(50000, 900000), happiness: 6, karma: -2, stats: { charisma: 4, discipline: -2 } });
        return { text: `{You say yes to everything|The money is genuinely absurd|You are on a poster in a shop window and you hate how much you like it}.`, changes };
      } },
      { id: 'refuse', label: 'Refuse all of it', effect: (ctx) => {
        const changes = apply(ctx, { fame: -6, happiness: 4, karma: 3, stats: { discipline: 3 } });
        return { text: `{You are not for sale|You close the door|You move somewhere they cannot find you}.`, changes };
      } },
    ],
  },
]);
