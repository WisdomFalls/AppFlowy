// Everyday life: childhood, school, work, money, health, ageing.

import { registerEvents, pickNpc, npcSlot, slotNpc } from '../generator.js';
import { apply, fact, stranger, relate, thread, trainYear, powerLine, money, canAfford,
  elsewhere, moveTo, odds, scaledFoePower, killNpc, meetCanon, canonHere } from './helpers.js';
import { CAREERS, getCareer, careersFor } from '../../data/jobs.js';
import { ITEMS, getItem, shopStock } from '../../data/items.js';
import { numberish, zeni } from '../text.js';
import { STAT_LABELS } from '../stats.js';

registerEvents([
  // ------------------------------------------------------------- childhood
  {
    id: 'first_power', once: true, tags: ['childhood', 'discovery'], weight: 40,
    minAge: 3, maxAge: 9,
    when: (ctx) => !ctx.flag('found_power'),
    slots: () => ({}),
    title: 'Something Under the Skin',
    text: `You are {playing|sulking|hiding|climbing something you should not be} #daypart# when it happens.
      {A rock the size of a hovercar|A tree|A boulder|Half a shed} {goes over|comes apart|moves} and you were the only one there.
      Nobody saw. {You do not tell anyone|You tell nobody|You keep it to yourself}. #ambience#`,
    choices: () => [
      {
        id: 'push', label: 'Push it, see what happens', hint: 'Reckless. Effective.',
        effect: (ctx) => {
          ctx.character.flags.found_power = true;
          const t = trainYear(ctx, { intensity: 0.7 });
          const changes = apply(ctx, { stats: { strength: 3, discipline: -1 }, happiness: 6, health: -4 });
          fact(ctx, 'Discovered their own strength before anyone taught them anything.', { weight: 4, tags: ['origin'] });
          return { text: `You spend {the rest of the month|weeks|every spare hour} {trying to do it again|breaking things on purpose|working out the trick}. Twice you nearly take your own arm off. On the {ninth|twentieth|thirtieth} try it happens again, and this time you meant it. ${powerLine(t.gained)}`, changes };
        },
      },
      {
        id: 'hide', label: 'Tell nobody and never do it again', hint: 'Safer. Slower.',
        effect: (ctx) => {
          ctx.character.flags.found_power = true;
          ctx.character.flags.suppressed_power = true;
          const changes = apply(ctx, { stats: { discipline: 4, charisma: 2 }, happiness: -3 });
          fact(ctx, 'Hid their strength as a child and told no one.', { weight: 3, tags: ['origin', 'secret'] });
          return { text: `You bury it. {For years|For a long time|Until much later} you are just a {quiet|ordinary|unremarkable} child who is careful with doorhandles.`, changes };
        },
      },
      {
        id: 'show', label: 'Show a grown-up', hint: 'This changes how people see you.',
        effect: (ctx) => {
          ctx.character.flags.found_power = true;
          const parent = pickNpc(ctx, (n) => n.relation === 'parent');
          if (parent) relate(ctx, parent, { closeness: 6, respect: 12, note: 'Saw what you could do.' });
          const changes = apply(ctx, { fame: 2, happiness: 4, stats: { charisma: 3 } });
          fact(ctx, `Showed ${parent ? parent.name : 'the adults'} what they could do, aged ${ctx.age}.`, { weight: 3, tags: ['origin', 'family'] });
          return { text: parent
            ? `${parent.name} {goes very quiet|sits down|stares for a long moment}. {Then they start training you|Then they start asking questions|Then they make you promise not to show anyone else}.`
            : `The adults {do not believe you|laugh|change the subject}, right up until you do it again in front of them.`, changes };
        },
      },
    ],
  },

  {
    id: 'childhood_wild', tags: ['childhood', 'quiet'], weight: 22,
    minAge: 4, maxAge: 12, placeTags: ['wild', 'forest', 'quiet', 'coast'],
    slots: () => ({}),
    title: 'Out in the Green',
    text: `{Nobody is watching you|You are alone all day, again|The adults have given up on supervising you}.
      You spend the year {catching fish with your hands|fighting dinosaurs that are much bigger than you|climbing things|following a river to see where it goes}. #ambience#`,
    choices: () => [
      { id: 'live', label: 'Live like an animal', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 0.8, placeMult: 1.4 });
        const changes = apply(ctx, { stats: { strength: 3, speed: 3, durability: 3, intellect: -2 }, happiness: 8 });
        return { text: `You come back {filthy|bleeding|with a fish|three days late} and {perfectly happy|entirely unrepentant|already asleep on your feet}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'watch', label: 'Watch, learn, copy', effect: (ctx) => {
        const changes = apply(ctx, { stats: { technique: 4, intellect: 3, kiControl: 2 }, happiness: 4 });
        return { text: `You spend it {studying how things move|copying what the animals do|learning where everything sleeps}. It looks like idleness. It is not.`, changes };
      } },
    ],
  },

  {
    id: 'school_years', tags: ['childhood', 'social'], weight: 26,
    minBioAge: 6, maxBioAge: 17, placeTags: ['urban', 'civilised'],
    when: (ctx) => !ctx.character.inAfterlife,
    slots: (ctx) => ({ subject: ctx.rng.pick(['maths', 'literature', 'physical education', 'history', 'chemistry', 'civics']) }),
    title: 'School',
    text: `{Another year of|A whole year of|Twelve months of} [subject] and {being told to sit still|pretending to be normal|hiding what you can do in gym class}.
      #ambience#`,
    choices: (ctx) => [
      { id: 'study', label: 'Actually study', effect: (c2) => {
        const changes = apply(c2, { stats: { intellect: 5, discipline: 3 }, happiness: -2 });
        if (c2.stats.intellect > 70) fact(c2, 'Top of the class, which surprised everyone including them.', { weight: 2 });
        return { text: `{You get good marks|You top the year|You do genuinely well}. Your {family|guardian|teacher} is {astonished|delighted|suspicious}.`, changes };
      } },
      { id: 'fight', label: 'Get into fights behind the gym', effect: (c2) => {
        const changes = apply(c2, { stats: { strength: 4, speed: 2, charisma: -2 }, happiness: 3, health: -5 });
        const foe = stranger(c2, { age: c2.age + c2.rng.int(-1, 3), relation: 'rival', metHow: 'school' });
        relate(c2, foe, { tension: 30, respect: 15 });
        thread(c2, 'rivalry', foe.id, { title: `Rivalry with ${foe.name}`, heat: 45, maxStage: 4 });
        return { text: `You are {suspended twice|in trouble constantly|known for it}. ${foe.name} is the only one who keeps getting back up, which is how you end up {friends of a sort|permanently unfinished business|circling each other for years}.`, changes };
      } },
      { id: 'coast', label: 'Coast', effect: (c2) => {
        const changes = apply(c2, { stats: { charisma: 4 }, happiness: 5 });
        return { text: `You do {the absolute minimum|nothing|as little as possible} and are {surprisingly popular|left alone|everybody's friend} for it.`, changes };
      } },
    ],
  },

  {
    id: 'saiyan_tail_trouble', once: true, tags: ['childhood', 'race'], weight: 30,
    races: ['saiyan', 'halfsaiyan'], minAge: 3, maxAge: 16,
    when: (ctx) => ctx.character.tail && !ctx.flag('tail_lesson'),
    slots: () => ({}),
    title: 'The Tail',
    text: `Somebody {grabs it|steps on it|pulls it, hard} and the world goes white.
      You {drop|fold up|cannot breathe}. {It is the only real weakness you have|Nobody warned you about this|You had no idea}.`,
    choices: () => [
      { id: 'train_tail', label: 'Train the weakness out of it', hint: 'Months of deliberate pain.', effect: (ctx) => {
        ctx.character.flags.tail_lesson = true;
        ctx.character.flags.tail_trained = true;
        const changes = apply(ctx, { stats: { durability: 6, discipline: 5 }, health: -8, happiness: -4 });
        fact(ctx, 'Trained the weakness out of their tail the hard way.', { weight: 3, tags: ['saiyan'] });
        return { text: `You have somebody {pull it|grip it|stand on it} daily until it stops working. It takes {a year|months|longer than you expected} and it is {miserable|agony|the worst thing you have ever chosen}. Then one day it simply does not hurt.`, changes };
      } },
      { id: 'cut_tail', label: 'Cut it off', hint: 'You lose the Great Ape form.', danger: true, effect: (ctx) => {
        ctx.character.flags.tail_lesson = true;
        ctx.character.tail = false;
        ctx.character.transformations = ctx.character.transformations.filter((t) => t !== 'oozaru' && t !== 'golden_oozaru');
        const changes = apply(ctx, { health: -10, happiness: -6, stats: { durability: 2 } });
        fact(ctx, 'Cut off their own tail. It never grew back.', { weight: 4, tags: ['saiyan', 'loss'] });
        return { text: `{It takes one motion|You do it yourself|You do not let anyone else do it}. The pain is {enormous|brief and enormous|worse than expected}, and then it is over, and something you will never get back is gone with it.`, changes };
      } },
      { id: 'guard', label: 'Just be careful forever', effect: (ctx) => {
        ctx.character.flags.tail_lesson = true;
        const changes = apply(ctx, { stats: { technique: 3 }, happiness: -1 });
        return { text: `You {learn to keep it wrapped|keep it out of reach|never turn your back}. It works, mostly. Everyone who matters knows about it anyway.`, changes };
      } },
    ],
  },

  // ------------------------------------------------------------------ work
  {
    id: 'job_offer', tags: ['career', 'opportunity'], weight: 24,
    minBioAge: 15, maxBioAge: 66,
    when: (ctx) => !ctx.character.career,
    slots: (ctx) => {
      const options = careersFor(ctx.character, ctx.place.tags, ctx.place.planet);
      if (!options.length) return null;
      const career = ctx.rng.pick(options);
      return { careerId: career.id, careerName: career.name, rung: career.rungs[0].title, pay: career.rungs[0].pay };
    },
    title: 'An Offer of Work',
    text: (ctx, s) => {
      const career = getCareer(s.careerId);
      return `{Somebody|A notice|A friend of a friend|An advertisement} {offers you|points you toward|mentions} work: [careerName], starting as a [rung].
        ${career.blurb} {The money is ${zeni(s.pay)} a year|It pays ${zeni(s.pay)}|They mention ${zeni(s.pay)}}.`;
    },
    choices: (ctx, s) => [
      { id: 'take', label: `Take the job`, effect: (c2, sl) => {
        const career = getCareer(sl.careerId);
        c2.character.career = { id: career.id, rung: 0, title: career.rungs[0].title, years: 0, performance: 50 };
        const changes = apply(c2, { zeni: career.rungs[0].pay, karma: career.karma, happiness: 3 });
        fact(c2, `Took work as a ${career.rungs[0].title} (${career.name}).`, { type: 'career', weight: 3, tags: ['career'] });
        return { text: `You start on {a Monday|the first of the month|the worst possible day}. {It is not what you imagined|The first week is humiliating|You are better at it than you expected}.`, changes };
      } },
      { id: 'refuse', label: 'Refuse. You have training to do.', effect: (c2) => {
        const changes = apply(c2, { happiness: 2, zeni: -200 });
        const t = trainYear(c2, { intensity: 1.2 });
        return { text: `You would rather {be strong than solvent|train|starve properly}. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  {
    id: 'work_year', tags: ['career'], weight: 18,
    when: (ctx) => !!ctx.character.career && !ctx.character.inAfterlife,
    slots: (ctx) => ({ careerId: ctx.character.career.id, title: ctx.character.career.title }),
    title: (ctx) => `Work: ${ctx.character.career.title}`,
    text: `{Another year of it|The job continues|Twelve months of [title] work}.
      {It pays|It is steady|It is not what you would choose}. #ambience#`,
    choices: (ctx) => [
      { id: 'hard', label: 'Work hard for the promotion', effect: (c2) => {
        const career = getCareer(c2.character.career.id);
        c2.character.career.performance = Math.min(100, c2.character.career.performance + c2.rng.int(6, 18));
        const pay = career.rungs[c2.character.career.rung].pay;
        const changes = apply(c2, { zeni: pay, happiness: -3, stats: { discipline: 2 }, health: -2 });
        return { text: `You {put in the hours|take the extra shifts|make yourself useful}. Somebody senior {notices|says nothing but notices|writes it down}.`, changes };
      } },
      { id: 'coast', label: 'Do the minimum, train on your own time', effect: (c2) => {
        const career = getCareer(c2.character.career.id);
        c2.character.career.performance = Math.max(0, c2.character.career.performance - c2.rng.int(2, 10));
        const pay = career.rungs[c2.character.career.rung].pay;
        const t = trainYear(c2, { intensity: 0.9 });
        const changes = apply(c2, { zeni: Math.round(pay * 0.9), happiness: 4 });
        return { text: `The work gets {done|mostly done|done eventually}. Your real year happens {before dawn|after hours|somewhere nobody from work would recognise}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'quit', label: 'Quit', danger: true, effect: (c2) => {
        const old = c2.character.career.title;
        c2.character.career = null;
        const changes = apply(c2, { happiness: 8, zeni: -1000 });
        fact(c2, `Walked out of the ${old} job.`, { type: 'career', weight: 2, tags: ['career'] });
        return { text: `You {hand in the uniform|do not give notice|leave mid-shift}. It feels {excellent|reckless|like the first true thing you have done in years}.`, changes };
      } },
    ],
  },

  {
    id: 'promotion', tags: ['career', 'opportunity'], weight: 30,
    when: (ctx) => {
      const car = ctx.character.career;
      if (!car) return false;
      const career = getCareer(car.id);
      const next = career.rungs[car.rung + 1];
      if (!next) return false;
      if ((next.req.years || 0) > car.years) return false;
      for (const [k, v] of Object.entries(next.req)) {
        if (k === 'years') continue;
        if (k === 'fame' && ctx.character.fame < v) return false;
        if (STAT_LABELS[k] && (ctx.character.stats[k] || 0) < v) return false;
      }
      return car.performance > 55;
    },
    slots: (ctx) => {
      const career = getCareer(ctx.character.career.id);
      const next = career.rungs[ctx.character.career.rung + 1];
      return { newTitle: next.title, newPay: next.pay };
    },
    title: 'Promotion',
    text: `{They call you in|It is announced|Nobody makes a speech about it}: you are being made [newTitle].
      {The pay goes to|It comes with|The money is now} [newPay:cap] a year.`,
    choices: () => [
      { id: 'accept', label: 'Accept', effect: (ctx) => {
        const career = getCareer(ctx.character.career.id);
        ctx.character.career.rung += 1;
        ctx.character.career.title = career.rungs[ctx.character.career.rung].title;
        ctx.character.career.performance = 50;
        const changes = apply(ctx, { happiness: 8, fame: career.field === 'fame' || career.field === 'martial' ? 5 : 1, zeni: career.rungs[ctx.character.career.rung].pay });
        fact(ctx, `Promoted to ${ctx.character.career.title}.`, { type: 'career', weight: 3, tags: ['career'] });
        return { text: `{You take it|Of course you take it|You take it, and the extra hours with it}.`, changes };
      } },
      { id: 'decline', label: 'Decline. The hours would end your training.', effect: (ctx) => {
        const changes = apply(ctx, { happiness: -2, stats: { discipline: 3 } });
        const t = trainYear(ctx, { intensity: 1.1 });
        return { text: `They {do not understand|are baffled|take it badly}. You do not explain. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  // ----------------------------------------------------------------- health
  {
    id: 'illness', tags: ['health', 'recovery'], weight: 12,
    minBioAge: 12,
    when: (ctx) => ctx.character.vitals.health < 85 || ctx.rng.chance(0.25),
    slots: (ctx) => ({
      illness: ctx.rng.pick(['a fever that will not break', 'something in your lungs', 'an old injury turning bad',
        'a virus nobody can name', 'a heart that skips', 'blood poisoning from a wound you ignored']),
    }),
    title: 'Something Is Wrong',
    text: `[illness:cap]. {You train through it for a month before it puts you down|It arrives fast|You ignore it until you cannot}.
      {The doctors are polite and unhelpful|Nobody knows what it is|They tell you to rest, which is not a thing you do}.`,
    choices: (ctx) => [
      { id: 'rest', label: 'Rest properly', effect: (c2) => {
        const changes = apply(c2, { health: 22, happiness: -6 });
        return { text: `You do {nothing|absolutely nothing|the one thing you are worst at} for {months|half a year|a long time}. It works. You come back {soft|slower|behind where you were}.`, changes };
      } },
      { id: 'push', label: 'Train through it', danger: true, effect: (c2) => {
        if (odds(c2, 0.45)) {
          const t = trainYear(c2, { intensity: 1.3 });
          const changes = apply(c2, { health: -14, stats: { discipline: 4, durability: 3 } });
          return { text: `It nearly kills you and it does not stop you. {Somehow you come out stronger|The fever burns off something else with it|You do not recommend this}. ${powerLine(t.gained)}`, changes };
        }
        const changes = apply(c2, { health: -30, happiness: -10 });
        return { text: `You collapse {in the middle of a form|face down in the dirt|during the third set} and wake up somewhere with a drip in your arm. It sets you back {a year|badly|further than resting would have}.`, changes };
      } },
      { id: 'senzu', label: 'Use a senzu bean', locked: !ctx.character.senzu, lockReason: 'You have no senzu beans.',
        effect: (c2) => {
          if (c2.character.senzu <= 0) return { text: 'You reach for a bean you do not have.' };
          c2.character.senzu -= 1;
          const changes = apply(c2, { health: 100, ki: 999, happiness: 5 });
          return { text: `One bean. {The whole thing simply stops|You are well before you finish chewing|Whatever it was, it is gone}.`, changes };
        } },
    ],
  },

  {
    id: 'aging_body', tags: ['health', 'quiet'], weight: 16,
    minBioAge: 44,
    slots: () => ({}),
    title: 'The Body Keeps Score',
    text: `{Your knee goes on a stair|You notice the recovery takes days now, not hours|Something in your back gives out doing nothing at all}.
      {It is not an injury|Nothing is torn|The doctor finds nothing}. {It is just time|It is simply age|This is what it is now}.`,
    choices: () => [
      { id: 'adapt', label: 'Train smarter, not harder', effect: (ctx) => {
        const changes = apply(ctx, { stats: { technique: 5, kiControl: 4, strength: -2 }, happiness: 2 });
        return { text: `You stop trying to be twenty. {Technique starts covering what strength used to|You get more efficient|You learn to win earlier}.`, changes };
      } },
      { id: 'deny', label: 'Refuse to slow down', effect: (ctx) => {
        const t = trainYear(ctx, { intensity: 1.5 });
        const changes = apply(ctx, { health: -14, stats: { strength: 2, discipline: 3 } });
        return { text: `You train like you are {twenty|still in your prime|not listening}. It costs you. ${powerLine(t.gained)}`, changes };
      } },
    ],
  },

  // ------------------------------------------------------------------ money
  {
    id: 'shop_visit', tags: ['opportunity', 'money'], weight: 14,
    minBioAge: 14,
    when: (ctx) => ctx.character.zeni > 20000 && !ctx.character.inAfterlife,
    slots: (ctx) => {
      const stock = shopStock(ctx.place.tags).filter((i) => !ctx.character.items.includes(i.id) && i.cost <= ctx.character.zeni * 3);
      if (!stock.length) return null;
      const item = ctx.rng.pick(stock);
      return { itemId: item.id, itemName: item.name, cost: item.cost, itemDesc: item.desc };
    },
    title: 'For Sale',
    text: `{A shop|A dealer|A very persistent salesman|A catalogue} has [itemName] going for [cost] Zeni. [itemDesc]`,
    choices: (ctx, s) => [
      { id: 'buy', label: `Buy it (${zeni(s.cost)})`, locked: !canAfford(ctx, s.cost), lockReason: 'You cannot afford it.',
        effect: (c2, sl) => {
          if (c2.character.zeni < sl.cost) return { text: 'You count it twice. It is still not enough.' };
          c2.character.zeni -= sl.cost;
          c2.character.items.push(sl.itemId);
          fact(c2, `Bought ${sl.itemName}.`, { type: 'item', weight: 2, tags: ['asset'] });
          const changes = apply(c2, { happiness: 5 });
          return { text: `{You hand over the money|It is worth it|You do not haggle}. ${sl.itemName} is yours.`, changes };
        } },
      { id: 'walk', label: 'Walk away', effect: () => ({ text: `{You have other priorities|Another time|You keep walking}.` }) },
    ],
  },

  {
    id: 'money_trouble', tags: ['money', 'setback'], weight: 12,
    minBioAge: 16,
    when: (ctx) => ctx.character.zeni < 40000,
    slots: (ctx) => ({
      cause: ctx.rng.pick(['a landlord with a court order', 'the damage you did to somebody\'s building',
        'a debt you forgot about', 'a hospital bill', 'the crater in the neighbour\'s field',
        'an insurance company that has seen the footage']),
    }),
    title: 'The Bill Arrives',
    text: `[cause:cap]. {It is more than you have|You cannot pay it|The number is not survivable}.`,
    choices: () => [
      { id: 'work', label: 'Take whatever work you can get', effect: (ctx) => {
        const changes = apply(ctx, { zeni: ctx.rng.int(15000, 60000), happiness: -6, health: -3 });
        return { text: `{Hauling|Demolition|Bodyguard work|Moving furniture with your bare hands}. It is {beneath you|honest|exhausting} and it clears the debt.`, changes };
      } },
      { id: 'fight', label: 'Fight for money', effect: (ctx) => {
        const changes = apply(ctx, { zeni: ctx.rng.int(30000, 140000), health: -12, karma: -3, fame: 3 });
        return { text: `{Underground bouts|A ring behind a warehouse|Somebody's basement}. {No rules and no doctor|The purse is cash|You do not ask who is betting}.`, changes };
      } },
      { id: 'ignore', label: 'Ignore it entirely', effect: (ctx) => {
        const changes = apply(ctx, { happiness: 3, karma: -4 });
        ctx.character.flags.wanted = true;
        return { text: `You {leave town|do not open the letters|move without a forwarding address}. It will {come back|find you|matter later}.`, changes };
      } },
    ],
  },

  {
    id: 'travel_urge', tags: ['travel', 'opportunity'], weight: 11,
    minBioAge: 13,
    when: (ctx) => !ctx.character.inAfterlife,
    slots: (ctx) => {
      const dest = elsewhere(ctx, (p) => p.planet === ctx.place.planet || ctx.character.items.includes('spaceship') || ctx.character.items.includes('attack_ball'));
      if (!dest) return null;
      return { destId: dest.id, destName: dest.name, destDesc: dest.desc, destTrain: dest.training };
    },
    title: 'Somewhere Else',
    text: `{You have heard about|Somebody mentions|You keep thinking about} [destName]. [destDesc]
      {The training there is supposed to be brutal|Nobody you know has been|It would mean leaving everything here}.`,
    choices: (ctx, s) => [
      { id: 'go', label: `Go to ${s.destName}`, effect: (c2, sl) => {
        moveTo(c2, sl.destId);
        const t = trainYear(c2, { intensity: 1.1 });
        const changes = apply(c2, { happiness: 6, zeni: -8000 });
        return { text: `{You go|You leave without saying goodbye properly|You pack in an afternoon}. It is {nothing like you pictured|colder|harder|exactly as advertised}. ${powerLine(t.gained)}`, changes };
      } },
      { id: 'stay', label: 'Stay where you are', effect: (c2) => {
        const changes = apply(c2, { happiness: -2, stats: { discipline: 2 } });
        return { text: `You stay. {There are reasons|Someone here needs you|You tell yourself there are reasons}.`, changes };
      } },
    ],
  },
]);
