// Fights that come looking for you: rivals, invaders, monsters, crime, and the
// consequences of being someone people have heard of.

import { registerEvents, pickNpc, npcSlot } from '../generator.js';
import { apply, fact, stranger, relate, thread, bumpThread, trainYear, powerLine,
  meetCanon, canonHere, odds, killNpc, findNpc, scaledFoePower, tierOf } from './helpers.js';
import { fight, narrateFight, describeGap } from '../combat.js';
import { combatPower, powerTier, zenkaiBoost } from '../stats.js';
import { numberish } from '../text.js';
import { canonAvailable, canonPower } from '../../data/canon.js';
import { hasPerk } from '../../data/races.js';

function fightOutcome(ctx, foe, opts = {}) {
  const res = fight(ctx.state, ctx.rng, foe, opts);
  ctx.state.stats.fights++;
  if (res.won) ctx.state.stats.wins++; else ctx.state.stats.losses++;

  // A beating should hurt without quietly ending the run: only an explicitly
  // lethal outcome is allowed to take the last of your health.
  const raw = Math.round(res.damageTaken * (opts.damageScale ?? 0.7));
  const floor = res.lethal ? 0 : 8;
  const damage = Math.min(raw, Math.max(0, ctx.character.vitals.health - floor));
  const changes = {
    health: -damage,
    ki: -20,
    happiness: res.won ? 8 : -8,
    fame: res.won ? (opts.fameGain ?? 3) : 0,
  };
  apply(ctx, changes);
  if (res.zenkai) {
    fact(ctx, `Came back from near death stronger. Zenkai.`, { type: 'zenkai', weight: 4, tags: ['saiyan', 'power'] });
  }
  return { res, changes };
}

registerEvents([
  {
    id: 'rival_challenge', tags: ['combat', 'rivalry', 'thread'], weight: 26,
    minBioAge: 8,
    when: (ctx) => ctx.npcs.some((n) => n.relation === 'rival' || n.relation === 'nemesis'),
    slots: (ctx) => {
      const pool = ctx.npcs.filter((n) => n.relation === 'rival' || n.relation === 'nemesis');
      if (!pool.length) return null;
      const npc = ctx.rng.pick(pool);
      return { ...npcSlot(npc), gap: describeGap(combatPower(ctx.character), npc.power) };
    },
    title: (ctx, s) => `${s.npcName} Comes Back`,
    text: `[npcName] {finds you|is waiting|turns up where you train}. {They have been training|They are different|Something has changed about them}.
      [gap]`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Fight them properly', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const { res } = fightOutcome(c2, npc, { lethality: 0.06 });
        relate(c2, npc, { respect: res.won ? 12 : 20, tension: res.won ? -6 : 10, power: res.won ? 1.15 : 1.3 });
        bumpThread(c2, 'rivalry', npc.id, res.won ? -8 : 14);
        fact(c2, `${res.won ? 'Beat' : 'Lost to'} ${npc.name}.`, { type: 'fight', weight: 3, subject: npc.id, tags: ['rival'] });
        let text = narrateFight(res, c2.rng, npc.name);
        if (res.zenkai) text += ` {You come back from it stronger|Whatever nearly killed you made room for something|Your body rebuilds heavier}. ${powerLine(res.zenkai)}`;
        return { text, changes: [] };
      } },
      { id: 'refuse', label: 'Refuse the fight', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        relate(c2, npc, { respect: -15, tension: 20 });
        const changes = apply(c2, { happiness: -6, fame: -3 });
        return { text: `You {walk away|say no|do not turn around}. ${npc.name} {says something you do not respond to|tells everyone|will not ask again}.`, changes };
      } },
      { id: 'ally', label: 'Offer to train together instead', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (odds(c2, 0.45 + c2.character.stats.charisma / 300)) {
          relate(c2, npc, { relation: 'friend', closeness: 25, tension: -30, respect: 15 });
          const t = trainYear(c2, { intensity: 1.4, mentorMult: 1.25 });
          const changes = apply(c2, { happiness: 12 });
          fact(c2, `${npc.name} stopped being a rival and became something better.`, { type: 'friend', weight: 4, subject: npc.id, tags: ['rival'] });
          return { text: `{They stare at you for a long moment|It takes them a while to answer|Neither of you admits this is what you both wanted}. You spend the year {trying to break each other|going at it daily|hitting each other harder than either of you would allow a stranger to}. ${powerLine(t.gained)}`, changes };
        }
        relate(c2, npc, { tension: 15, respect: -5 });
        const changes = apply(c2, { happiness: -4 });
        return { text: `{They laugh at you|"We are not friends"|They take it as an insult}. {The offer stands and they will not take it|You do not offer twice|Fine}.`, changes };
      } },
    ],
  },

  {
    id: 'challenger', tags: ['combat'], weight: 20,
    minBioAge: 12,
    when: (ctx) => ctx.character.fame > 8 || ctx.character.stats.strength > 55,
    slots: (ctx) => ({
      why: ctx.rng.pick(['they heard about you', 'they want your reputation', 'you flattened somebody they know',
        'they have been looking for you for two years', 'a bet', 'their school sent them']),
      scale: ctx.rng.pick([0.5, 0.8, 1.1, 1.6, 2.6]),
    }),
    title: 'A Challenge',
    text: `Somebody {steps out of a crowd|is standing in the road|is on your roof} and says your name.
      {They have|You see} #strangerLook#, and they are #strangerVibe#. Apparently [why].`,
    choices: (ctx, s) => [
      { id: 'accept', label: 'Accept', effect: (c2, sl) => {
        const foe = stranger(c2, { relation: 'acquaintance', powerTarget: scaledFoePower(c2, sl.scale, 0.4), metHow: 'challenge' });
        const { res } = fightOutcome(c2, foe, { lethality: 0.08 });
        if (res.won) {
          relate(c2, foe, { respect: 30, relation: odds(c2, 0.4) ? 'rival' : 'acquaintance' });
          if (foe.relation === 'rival') thread(c2, 'rivalry', foe.id, { title: `Rivalry with ${foe.name}`, heat: 50, maxStage: 4 });
        } else {
          relate(c2, foe, { relation: 'rival', tension: 30, respect: 10 });
          thread(c2, 'rivalry', foe.id, { title: `${foe.name} beat you`, heat: 65, maxStage: 4 });
        }
        fact(c2, `${res.won ? 'Beat' : 'Lost to'} ${foe.name}, a challenger.`, { type: 'fight', weight: 2, subject: foe.id, tags: ['fight'] });
        let text = `${foe.name}. ${describeGap(res.myPower, res.theirPower)} ${narrateFight(res, c2.rng, foe.name)}`;
        if (res.zenkai) text += ` ${powerLine(res.zenkai)}`;
        return { text, changes: [] };
      } },
      { id: 'decline', label: 'Decline', effect: (c2) => {
        const changes = apply(c2, { fame: -4, happiness: -2, karma: 2 });
        return { text: `{You have nothing to prove|You keep walking|You tell them no and they do not push it}. Somebody in the crowd {says something|laughs|is disappointed}.`, changes };
      } },
      { id: 'humiliate', label: 'End it in one move', hint: 'Cruel, and it travels.', effect: (c2, sl) => {
        const foe = stranger(c2, { powerTarget: scaledFoePower(c2, sl.scale * 0.6, 0.3), metHow: 'challenge' });
        const mine = combatPower(c2.character);
        if (mine > foe.power * 3) {
          relate(c2, foe, { relation: 'enemy', tension: 60, respect: -10 });
          const changes = apply(c2, { fame: 8, karma: -8, happiness: 4 });
          fact(c2, `Humiliated ${foe.name} in public.`, { type: 'fight', weight: 3, subject: foe.id, tags: ['cruel'] });
          return { text: `{One strike|You do not even turn to face them|It takes less than a second}. ${foe.name} {does not get up|is carried out|will remember this for the rest of their life}. {The crowd goes quiet|Nobody claps|Somebody films it}.`, changes };
        }
        const { res } = fightOutcome(c2, foe, { lethality: 0.1 });
        const changes = apply(c2, { karma: -4 });
        return { text: `You go for {something showy|the quick finish|a single strike} and ${res.won ? `{it works, barely|it lands, and it is not clean|you get away with it}` : `{it does not work|they were ready for it|you are on the ground before you understand what happened}`}. ${narrateFight(res, c2.rng, foe.name)}`, changes };
      } },
    ],
  },

  {
    id: 'monster_attack', tags: ['combat', 'threat'], weight: 16,
    minBioAge: 10,
    slots: (ctx) => ({
      thing: ctx.rng.pick(['a dinosaur the size of a warehouse', 'something that came out of the sea',
        'a machine that will not stop', 'a swarm of things nobody can name', 'a demon out of an old jar',
        'a creature grown in somebody\'s basement', 'a beast with a Red Ribbon serial number on its flank']),
      target: ctx.rng.pick(['a village', 'a school', 'the market district', 'a research station', 'a convoy', 'your own street']),
    }),
    title: 'Something Is Loose',
    text: `[thing:cap] is {tearing through|standing in the middle of|already halfway through} [target].
      {The authorities are useless|People are running the wrong way|You are the closest thing to help available}.`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Deal with it', effect: (c2, sl) => {
        const foe = { name: sl.thing, power: scaledFoePower(c2, c2.rng.float(0.5, 2.2), 0.5) };
        const { res } = fightOutcome(c2, foe, { lethality: 0.14, fameGain: 8 });
        if (res.won) {
          const changes = apply(c2, { karma: 10, fame: 6, happiness: 6 });
          fact(c2, `Stopped ${sl.thing} before it reached ${sl.target}.`, { type: 'heroism', weight: 4, tags: ['hero'] });
          return { text: `${narrateFight(res, c2.rng, 'It')} {Afterwards people come out and look at you|Somebody thanks you and you do not know what to say|You leave before the cameras arrive}.`, changes };
        }
        const casualties = odds(c2, 0.5);
        const changes = apply(c2, { karma: casualties ? -2 : 3, happiness: -12 });
        if (casualties) fact(c2, `Failed to stop ${sl.thing}. ${sl.target} did not survive it.`, { type: 'failure', weight: 5, tags: ['loss'] });
        return { text: `${narrateFight(res, c2.rng, 'It')} ${casualties ? `{You wake up in the ruins|By the time you can stand it is over|You were not enough}. #grief#` : `{Somebody else finishes it|It leaves on its own|Help arrives}.`}`, changes };
      } },
      { id: 'evacuate', label: 'Get people out instead', effect: (c2, sl) => {
        const changes = apply(c2, { karma: 12, health: -6, fame: 3, happiness: 4 });
        fact(c2, `Chose to evacuate ${sl.target} rather than fight.`, { type: 'heroism', weight: 3, tags: ['hero'] });
        return { text: `You {do not fight it at all|carry people out two at a time|make four trips}. {The building goes|You lose the district and not the people|It is not a victory and everyone is alive}.`, changes };
      } },
      { id: 'leave', label: 'Not your problem', effect: (c2) => {
        const changes = apply(c2, { karma: -12, happiness: -6 });
        return { text: `You {leave|do not turn around|hear about it later on the news}. {Nobody blames you|Somebody saw you leave|You blame you}.`, changes };
      } },
    ],
  },

  {
    id: 'crime_opportunity', tags: ['crime', 'opportunity', 'villain'], weight: 12,
    minBioAge: 15,
    slots: (ctx) => ({
      job: ctx.rng.pick(['a Capsule Corp shipment with no guards worth the name',
        'a bank whose vault is a formality to somebody like you', 'a museum piece nobody would miss',
        'a payroll flyer that lands somewhere quiet', 'a warlord\'s tribute caravan',
        'a research lab with something valuable in the basement']),
      pay: ctx.rng.int(80000, 3000000),
    }),
    title: 'Easy Money',
    text: `Somebody puts it in front of you: [job]. {The take is|It would be worth about|They say} [pay] Zeni.
      {Nobody would get hurt|Probably nobody gets hurt|People would definitely get hurt}.`,
    choices: (ctx, s) => [
      { id: 'do', label: 'Take the job', effect: (c2, sl) => {
        if (odds(c2, 0.72)) {
          const changes = apply(c2, { zeni: sl.pay, karma: -10, happiness: 4 });
          fact(c2, `Robbed ${sl.job.split(' ').slice(0, 4).join(' ')}. Got away with it.`, { type: 'crime', weight: 3, tags: ['crime'] });
          return { text: `{It is embarrassingly easy|Nobody even sees you|You are gone before the alarm finishes}. ${numberish(sl.pay)} Zeni, and a name in circles you did not want to be known in.`, changes };
        }
        c2.character.flags.wanted = true;
        const changes = apply(c2, { zeni: Math.round(sl.pay * 0.3), karma: -12, fame: 5, health: -10 });
        fact(c2, `A job went wrong. There is a warrant now.`, { type: 'crime', weight: 4, tags: ['crime', 'wanted'] });
        return { text: `{It goes wrong immediately|Somebody had a scouter|There were guards after all}. You get out with {part of it|nothing but a scar|less than you hoped}, and a face on file.`, changes };
      } },
      { id: 'refuse', label: 'Walk away', effect: (c2) => {
        const changes = apply(c2, { karma: 4 });
        return { text: `{Not for that|You have been poor before|You say no and mean it}.`, changes };
      } },
      { id: 'rob_robbers', label: 'Rob the people offering', effect: (c2, sl) => {
        if (odds(c2, 0.5 + c2.character.stats.technique / 300)) {
          const changes = apply(c2, { zeni: Math.round(sl.pay * 0.6), karma: -4, fame: 3 });
          const enemy = stranger(c2, { relation: 'enemy', tension: 70, powerTarget: scaledFoePower(c2, 1.1) });
          thread(c2, 'vendetta', enemy.id, { title: `${enemy.name} wants you dead`, heat: 70, maxStage: 3 });
          return { text: `You take {their money|the whole operation|everything they brought} instead. ${enemy.name} {survives|gets away|is very much still alive} and will spend years on this.`, changes };
        }
        const changes = apply(c2, { health: -20, zeni: -Math.min(c2.character.zeni, 50000), karma: -2 });
        return { text: `{They were expecting it|There were more of them than you counted|It is a trap and you walk into it}. You get out. Barely.`, changes };
      } },
    ],
  },

  {
    id: 'nemesis_returns', tags: ['combat', 'vendetta', 'thread'], weight: 30,
    minBioAge: 10,
    when: (ctx) => ctx.memory.threads.some((t) => !t.closed && t.kind === 'vendetta'),
    slots: (ctx) => {
      const t = ctx.memory.threads.find((x) => !x.closed && x.kind === 'vendetta');
      if (!t) return null;
      const npc = findNpc(ctx.state, t.subject);
      if (!npc || !npc.alive) return null;
      return { ...npcSlot(npc), stage: t.stage };
    },
    title: (ctx, s) => `${s.npcName} Found You`,
    text: `[npcName] has {been looking for years|not stopped|been getting stronger the whole time}.
      {They do not want to talk|They talk for a long time first|They brought people}.`,
    choices: (ctx, s) => [
      { id: 'finish', label: 'Finish it', danger: true, effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        const { res } = fightOutcome(c2, npc, { lethality: 0.35, fameGain: 6 });
        let text = narrateFight(res, c2.rng, npc.name);
        if (res.won) {
          if (odds(c2, 0.55)) {
            killNpc(c2, npc, 'You finished it');
            c2.state.stats.kills++;
            apply(c2, { karma: -8 });
            text += ` {It is over|You end it|There is no version of this where they stop otherwise}.`;
          } else {
            relate(c2, npc, { tension: -20, respect: 25 });
            apply(c2, { karma: 6 });
            text += ` {You let them live|You leave them breathing|You do not finish it}, which {surprises both of you|they do not understand|may be a mistake}.`;
          }
          bumpThread(c2, 'vendetta', npc.id, -40);
        } else if (res.lethal) {
          text += ` {It ends here|You do not get up|That is the last thing that happens}.`;
          return { text, changes: [], outcome: { death: `Killed by ${npc.name}` } };
        } else {
          bumpThread(c2, 'vendetta', npc.id, 15);
          text += ` {They leave you alive on purpose|They want you to know it is not finished|You are still breathing, which is the message}.`;
        }
        return { text, changes: [] };
      } },
      { id: 'talk', label: 'Try to end it with words', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        if (odds(c2, 0.2 + c2.character.stats.charisma / 250 + c2.character.karma / 400)) {
          relate(c2, npc, { relation: 'acquaintance', tension: -50, respect: 20 });
          bumpThread(c2, 'vendetta', npc.id, -60);
          const changes = apply(c2, { karma: 10, happiness: 10, stats: { charisma: 3 } });
          fact(c2, `Talked ${npc.name} out of killing them.`, { type: 'mercy', weight: 5, subject: npc.id, tags: ['mercy'] });
          return { text: `{You say the one true thing|It takes an hour|You give them something they wanted more than your death}. ${npc.name} {leaves|sits down|puts it down}. {Not forgiveness. An ending|Neither of you is happy about it|It is finished}.`, changes };
        }
        const { res } = fightOutcome(c2, npc, { lethality: 0.3 });
        return { text: `{They do not want words|They let you finish and then move|It was never going to work}. ${narrateFight(res, c2.rng, npc.name)}`, changes: [] };
      } },
      { id: 'flee', label: 'Run', effect: (c2, sl) => {
        const npc = findNpc(c2.state, sl.npcId);
        bumpThread(c2, 'vendetta', npc.id, 20);
        const changes = apply(c2, { happiness: -10, fame: -3, health: -6 });
        return { text: `You {run|use everything you have to be somewhere else|do not fight}. {It buys a year|It buys nothing|You will have to do this eventually}.`, changes };
      } },
    ],
  },

  {
    id: 'invasion_local', tags: ['combat', 'threat', 'cosmic'], weight: 14,
    minBioAge: 12,
    slots: (ctx) => ({
      who: ctx.rng.pick(['a Frieza Force scouting party', 'three mercenaries with scouters',
        'a purge squad', 'something calling itself a tax collector', 'a ship that lands badly and opens angrily',
        'a bounty crew with your description']),
      scale: ctx.rng.float(0.8, 3.4),
    }),
    title: 'They Came Down',
    text: `[who:cap] {lands|arrives|is simply there one morning}. {They are not asking questions|They start with the outskirts|They read a number off a device and look disappointed}.`,
    choices: (ctx, s) => [
      { id: 'fight', label: 'Meet them', effect: (c2, sl) => {
        const foe = { name: sl.who, power: scaledFoePower(c2, sl.scale, 0.4) };
        const { res } = fightOutcome(c2, foe, { lethality: 0.16, fameGain: 10 });
        let text = `${describeGap(res.myPower, res.theirPower)} ${narrateFight(res, c2.rng, 'They')}`;
        if (res.won) {
          apply(c2, { karma: 8 });
          fact(c2, `Drove off ${sl.who}.`, { type: 'heroism', weight: 5, tags: ['hero', 'cosmic'] });
          if (odds(c2, 0.4)) {
            c2.character.flags.imperial_attention = true;
            text += ` {Somebody very far away is told about this|The report goes up the chain|You are now a line item in an imperial file}.`;
          }
        } else if (res.lethal) {
          return { text, changes: [], outcome: { death: `Killed resisting ${sl.who}` } };
        }
        return { text, changes: [] };
      } },
      { id: 'hide', label: 'Hide and survive', effect: (c2, sl) => {
        const changes = apply(c2, { karma: -6, happiness: -12, health: -3 });
        fact(c2, `Hid while ${sl.who} did what they came to do.`, { type: 'shame', weight: 4, tags: ['loss'] });
        return { text: `You {suppress your ki completely|get underground|do not move for two days}. {When it is over there is less of the place than there was|You come out into quiet|You are alive}. #dread#`, changes };
      } },
      { id: 'join', label: 'Offer to work for them', effect: (c2, sl) => {
        if (odds(c2, 0.5)) {
          c2.character.flags.imperial_service = true;
          const changes = apply(c2, { karma: -18, zeni: c2.rng.int(100000, 900000), fame: 4 });
          fact(c2, `Signed on with ${sl.who}.`, { type: 'career', weight: 5, tags: ['imperial', 'villain'] });
          return { text: `{They laugh, and then they take you seriously|They test you first|The paperwork is surprisingly thorough}. {You are on the ship by evening|The armour fits|You do not look back at the place you came from}.`, changes };
        }
        const foe = { name: sl.who, power: scaledFoePower(c2, sl.scale * 1.2, 0.3) };
        const { res } = fightOutcome(c2, foe, { lethality: 0.3 });
        return { text: `They {laugh|do not answer|shoot first}. ${narrateFight(res, c2.rng, 'They')}`, changes: [] };
      } },
    ],
  },

  {
    id: 'canon_encounter', tags: ['combat', 'canon'], weight: 18,
    minBioAge: 10,
    slots: (ctx) => {
      const pool = canonHere(ctx, (c) =>
        (c.tags.includes('rival') || c.tags.includes('hero') || c.tags.includes('villain'))
        && (ctx.year - c.years[0]) >= 12);
      if (!pool.length) return null;
      const c = ctx.rng.pick(pool);
      const p = canonPower(c, ctx.year);
      return { canonId: c.id, canonName: c.name, canonPersona: c.personality, canonQuirk: c.quirk,
        gap: describeGap(combatPower(ctx.character), p) };
    },
    title: (ctx, s) => `${s.canonName}`,
    text: `{You run into|Somebody points out|There is no mistaking} [canonName]. [canonPersona] [canonQuirk]
      [gap]`,
    choices: (ctx, s) => [
      { id: 'fight', label: `Ask ${s.canonName} for a fight`, effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.canonId, 'acquaintance');
        const holdingBack = npc.power > combatPower(c2.character) * 20;
        const foe = { name: npc.name, power: holdingBack ? combatPower(c2.character) * c2.rng.float(0.8, 1.6) : npc.power };
        const { res } = fightOutcome(c2, foe, { lethality: holdingBack ? 0 : 0.08 });
        relate(c2, npc, { respect: res.won ? 30 : 15, closeness: 12 });
        fact(c2, `Fought ${npc.name}${holdingBack ? ' (who was not trying)' : ''}. ${res.won ? 'Won' : 'Lost'}.`,
          { type: 'fight', weight: 5, subject: npc.id, tags: ['canon', 'fight'] });
        let text = holdingBack
          ? `{They are not using anything like everything|You can feel them holding it down to your level|It is a lesson wearing a fight's clothes}. `
          : '';
        text += narrateFight(res, c2.rng, npc.name);
        if (res.zenkai) text += ` ${powerLine(res.zenkai)}`;
        return { text, changes: [] };
      } },
      { id: 'talk', label: 'Just talk to them', effect: (c2, sl) => {
        const npc = meetCanon(c2, sl.canonId, 'acquaintance');
        relate(c2, npc, { closeness: 15, respect: 8 });
        const changes = apply(c2, { happiness: 8, stats: { intellect: 2, charisma: 2 } });
        return { text: `{It is a strange conversation|They are nothing like the stories|They are exactly like the stories}. ${npc.name} {gives you advice you do not understand yet|asks about you, which you did not expect|talks mostly about food}.`, changes };
      } },
      { id: 'avoid', label: 'Keep your distance', effect: (c2, sl) => {
        const changes = apply(c2, { happiness: -2 });
        return { text: `You {do not introduce yourself|watch from across the street|let them pass}. {Some other year|There is time|You are not ready and you know it}.`, changes };
      } },
    ],
  },

  {
    id: 'near_death', tags: ['combat', 'threat'], weight: 6,
    minBioAge: 12,
    when: (ctx) => ctx.character.vitals.health < 40,
    slots: (ctx) => ({
      cause: ctx.rng.pick(['a fight you should not have taken', 'an accident in the chamber',
        'something with more arms than you counted', 'an ambush', 'a blast you did not see coming']),
    }),
    title: 'The Edge',
    text: `[cause:cap]. {You are dying|Your body is shutting down in order|You can feel it happening from the outside}.
      {Somebody is shouting your name|Nobody is coming|You are alone with it}.`,
    choices: (ctx) => [
      { id: 'hold', label: 'Refuse to go', effect: (c2) => {
        if (odds(c2, 0.78 + c2.character.stats.durability / 500)) {
          const changes = apply(c2, { health: 20, happiness: -8, stats: { discipline: 6, durability: 5 } });
          let text = `{You do not die|Something in you will not let go|You come back from it}.`;
          if (hasPerk(c2.character, 'zenkai') || hasPerk(c2.character, 'zenkaiWeak')) {
            const z = zenkaiBoost(c2.character, c2.rng, 1.4);
            text += ` {Your body rebuilds heavier|Saiyan cells do this|When you can stand you are stronger than you have ever been}. ${powerLine(z)}`;
          }
          c2.character.flags.brink_of_death = true;
          fact(c2, 'Nearly died and did not.', { type: 'survival', weight: 5, tags: ['power'] });
          return { text, changes };
        }
        return { text: `{You cannot hold it|It goes dark at the edges and then everywhere|You stop}.`, changes: [], outcome: { death: 'Died of their injuries' } };
      } },
      { id: 'senzu', label: 'Senzu bean', locked: !ctx.character.senzu, lockReason: 'You have none.',
        effect: (c2) => {
          if (c2.character.senzu <= 0) return { text: 'There is nothing in your hand.' };
          c2.character.senzu -= 1;
          const changes = apply(c2, { health: 100, ki: 999 });
          return { text: `{Somebody puts it in your mouth|You get it down|One bean}. {Everything closes at once|You sit up|It is the strangest feeling there is}.`, changes };
        } },
    ],
  },
]);
