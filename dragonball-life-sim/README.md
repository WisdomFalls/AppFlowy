# Dragon Ball: Mortal Coil

A mobile life simulator in the shape of BitLife or Manhua Life, set in Dragon Ball.
You are born as one of twelve species in a chosen era, and you live one year at a
time: training, fighting, falling out with people, unlocking transformations, dying,
and continuing in the Other World because death is a location in this setting rather
than an ending.

It runs as a single self-contained HTML file. No build step is needed to play it and
it has no runtime dependencies.

```
npm run build   # bundle src/ into dist/dragonball-life-sim.html
npm test        # 34 unit and content tests
npm run sim     # play N complete lifetimes headlessly and report on balance
```

## The design problem

The brief was "nothing fully scripted, consistent with the lore, and never repetitive".
Those three pull against each other: consistency wants authored content, novelty wants
generation, and lore wants both to stay inside the rules of the setting. The engine
splits the work in three.

**Nothing is a written scene.** A template declares when it may fire, which entities
it needs, a *shape* of prose, and choices whose outcomes are computed from live state.
The shape is a grammar: `{a|b|c}` picks an alternative, `#bank#` pulls from a phrase
bank, `[slot]` substitutes an entity. One template line routinely renders in thousands
of distinct ways, and the same choice produces different results because the outcome is
rolled against stats rather than written down. A 200-lifetime run produces around 2,300
distinct event titles across 21,000 events, with no single beat above 5% of the total.

**Memory decides what you see next.** Every resolved event is fingerprinted by template
plus cast. Selection weight is divided by how recently that exact shape occurred and how
often the template has been used at all, so the same beat with the same people is
effectively impossible to see twice, and a beat with a new cast still reads as new.
Durable facts ("Piccolo took you on", "you let Kale die") are queryable, so later events
can call back to earlier ones by name. Running arcs apply pressure: a rivalry that has
gone quiet for six years starts pushing itself back to the surface.

**The model writes, the engine referees.** Where a model is available the game asks it
for entirely new events, given a compact picture of the character, their relationships,
their story memory, and an explicit list of recent beats not to repeat. The reply is
JSON: prose plus proposed consequences. Every number in it is clamped, every unknown key
dropped, and anything that would break the simulation is simply not applied. That is what
makes it safe to let a language model invent content at runtime: it can change the story
but it cannot change the rules.

## What is in it

| | |
|---|---|
| Species | 12, each with its own stat floor, growth curve, lifespan, ageing rate, maturity rate and mechanics: Saiyan zenkai, Namekian regeneration and solo reproduction, Frost Demon innate power and terrible work ethic, Majin absorption, Android infinite stamina, Shinjin divine ki |
| Transformations | 46 across race-specific ladders, gated on power, stats, story flags, mentors and rituals rather than a single unlock number — plus mastery levels and forms you invent and name yourself |
| Techniques | 54 in six branches with a real prerequisite tree, plus a signature technique you invent and name yourself |
| Canon characters | 75, era-gated by birth and death year, with power interpolated across the sagas so Goku in Age 762 is not Goku in Age 780 |
| Places | 34 across 10 worlds, each with its own training multiplier and danger |
| Timeline | 21 canon events from the fall of Planet Vegeta to the Tournament of Power. They fire on their year whether you want them to or not, and you play them rather than read them |
| Events | 98 templates plus unlimited model-authored ones |
| Careers | 15 with promotion ladders, from martial arts instructor to Frieza Force sector commander |
| Social verbs | 20 direct interactions per person, from teaching and healing to extortion and a duel to the death |
| Universes | 8 besides your own, with their gods, their angels and their fighters at tournament strength |
| Wishes | 27 across five categories, and three dragons with different limits on what they will do |

Also: relationships that decay if you neglect them, romance and marriage and children who
inherit your potential, the Dragon Balls and twelve wishes with real costs, tournaments,
crime and prison, the Hyperbolic Time Chamber, King Yemma's desk, Snake Way, Hell,
revival, reincarnation, and a legacy mode that continues as your child in a world that
remembers everything the previous generation did.

## The year, as a budget

Power in this game is exponential and training multiplies, so an unbounded year is not a
year — it is a way to reach thirteen billion by age five. Every activity costs slots from
a yearly budget that is a function of biological maturity, and most actions also have a
hard per-year cap.

A toddler gets one slot; a fighter in their prime gets six; the very old get three. Perks
move it: android stamina and a meditative discipline each add one, discipline at 80 adds
one, injury takes one away, and the dead get an extra because they have nothing else to
do. Training also grants power against a separate yearly ceiling, so spending every slot
on the same drill produces diminishing returns rather than an exploit.

Maturity and ageing are separate rates. A Namekian is an adult in four years but lives
three hundred; a Kai ages so slowly they are still a child at twelve. The budget follows
maturity, the lifespan follows ageing.

## Tournaments

A tournament is a bracket you fight, not a placement you are told. The field is
seeded from whoever is actually alive and fighting in that year, so a draw has
names in it. Your match opens on the battle screen; everyone else's resolves
around you, round by round, and you watch the half of the draw you are not in
thin out while you wait.

Each format has its own rules and its own idea of who turns up. Frieza does not
enter the World Martial Arts Tournament. The dead fight in the Other World and
cannot die of it. Ring-out is a real move: throwing somebody out is how most
tournaments end, it works on people you could never knock down, and they will
do it to you. Killing under tournament rules ends your tournament.

The canon tournaments run through the same bracket. Winning the World Martial
Arts Tournament gets you the belt, and you wear it. Winning the Tournament of
Power saves Universe 7 and hands you the Super Dragon Balls; losing it can
erase you along with everything else.

You can also hold your own. Put up a purse, decide what calibre of field you
are trying to attract, and find out who answers.

## Fighting

Fights are turn-based rather than a die roll. You pick a stance (each trades attack,
defence and ki economy differently), then spend turns on physical strikes, techniques
from your tree, guarding, charging, or transforming mid-fight — the escalation is the
point, and so is coming out of a form when the drain gets away from you.

Damage scales on the power ratio through a compressed curve, so a large gap is decisive
without being instant and an upset is always possible. Ki and stamina are real budgets.
Techniques that drain, absorb, regenerate or heal resolve on their own branches instead
of being treated as strikes. A destruction meter tracks what the fight is doing to the
area around it, and Instant Transmission lets you move the fight somewhere emptier — the
consequences of not doing that are collateral karma, which the world remembers. Saiyans
take a zenkai from surviving near death; losing badly leaves you humiliated, furious, or
on the brink, and those states are exactly what the transformation ladder wants.

Losing is not dying. A defeat leaves you wrecked, with a health floor, unless the fight
was declared lethal — and lethal is something you choose, not something you stumble into.

Where a fight needs to be resolved without you (a background war, an NPC's own life)
the same model runs headless.

## Hunting the Dragon Balls

The seven balls scatter across the universe, weighted so that finding one on a world
makes a second one there markedly less likely — your home world and known Dragon Ball
worlds get a thumb on the scale, everything else is thin. Summoning is not a menu item
you spam: attempts are limited, and a wish rescatters everything and turns the balls
inert for a year.

Finding one is a search. A planet is a 7×7 grid, you get a small number of radar sweeps,
and each sweep returns a Chebyshev-distance reading. Triangulating takes about four
sweeps of the seven available, so a careless hunt fails and a careful one usually does not.

## Learning things

Training a stat, learning a technique, unlocking a transformation, and mastering one all
run through the same trial system with four minigame shapes: timing, sequence, endurance
and push. Each stat maps to the shape that fits it — catching thrown stones blindfolded
for speed, drilled forms for technique, sitting still far too long for discipline.

Mastery is a per-form value that reduces its drain by up to three quarters and adds up to
a quarter of its power multiplier, so holding a form longer and going past your previous
ceiling are separate achievements from unlocking it. Once a form is yours you can invent
your own from it, name it, and teach it to other people.

Transformations still want an emotional trigger, but they are no longer hostage to one:
enough raw power (25× the requirement) breaks through without the story beat.

## The other universes

Eight universes besides your own, each with its God of Destruction, its angel,
its Kai, and its fighters at the strength they held for the Tournament of
Power. They seed the Tournament of Destroyers and the Tournament of Power, so
the draw contains Hit and Ribrianne and Jiren rather than invented names, and
beating one of them is remembered as beating them.

## Worlds

Ten worlds, each with its own inhabitants, flora, defenders, law and alignment. Travel
between them costs what it should: Instant Transmission is free and instant if you have
it, a pod costs years of your life, and flight costs more years than that and is gated
on your speed.

On any world you can protect it, rule it, purge it, or recruit from it, and the world
responds. Influence and law are tracked per world, and moving a world's alignment sends
its living defenders after you — turn evil on Earth and the Z Fighters come to find you,
by name, at the power they have in that year. Higher up, Beerus and Whis notice, and
noticing goes three ways: they end you, they spare you, or they decide you are
interesting enough to train.

## Wishes

Twenty-seven wishes across five categories, and three dragons that differ in
what they will do. Shenron grants one thing and cannot exceed the power of the
one who made him. Porunga grants three, one soul at a time, and stays uncoiled
across the sky between them. Super Shenron does whatever is asked, once.

A wish that needs a target asks you to name it, from the people you actually
know and the tyrants who are actually alive. You can bring back one person or
everyone, undo every death you caused, become a different species, hand a
friend the strength to stand beside you, spend it on what somebody else has
been chasing, or ask for a really nice pair of underwear.

You can also just say what you want. Where a model is connected it reads the
wish as the dragon would; without one the dragon takes you literally, which is
in character. Asking for something beyond the dragon costs you the wish and
gets you a refusal.

## People

Every person carries far more than you can see: skills, techniques, transformations,
mood, power, weapons, appearance, clothing, goals, money, home, whether they are holding
a Dragon Ball, their own relationships, fame and dead relatives. You reveal it
progressively — sparring shows you what they can do, time spent shows you who they are,
and invading their mind shows you everything at once and costs you the relationship,
sometimes converting a close friend into an enemy.

The twenty social verbs split into warm, romance and hostile. Romance is age-gated
(crushes at 10, romance at 15, commitment at 16) and runs through its own track, so
marriage, affection, children and a spouse's own expectations are all live. Hostile
covers threats, extortion, humiliation, kidnapping and a duel to the death, and the world
prices all of them.

You can also just write what you say. Free text is scored against that specific person —
"Fight me" reads very differently to a proud fighter than to someone in mourning — either
locally or by the model when one is connected, and the result moves closeness, respect,
trust, romance and tension separately.

Non-canon people are not scenery. They train, hit walls, break through them, unlock forms,
have children, and those children grow into interests of their own.

The canon cast keeps living too. Between the sagas and after the timeline runs
out, they break through walls, take students, retire and hand you their school,
have children, grow up and come looking for a fight, and eventually die of
nothing but time. Old villains are seen somewhere they should not be, and you
can go and deal with it, warn the people who need warning, or go and offer to
work for them.

## Looking like someone

Character creation is tabbed: face, hair, body, clothes, marks and self. It draws as you
edit — a parametric layered SVG portrait, back hair behind the torso, front hair over the
head, race features on top, and an aura and gold hair when a form is active.

Marks are open rather than a single dropdown: scars in several places, burns, a missing
eye, ear or arm, mechanical replacements, tattoos, and a free-text one you describe
yourself. Take as many as the body has earned. More arrive on their own — a fight that
nearly kills you leaves something behind, and losing an eye to something lethal is a
real outcome the record attributes to whoever did it.

Accessories work the same way. Headbands, capes, eyepatches, glasses and the rest can be
chosen at the start or bought later, and some arrive with the life: a scouter you own, a
belt you won, a sword you were given, a halo you did not ask for. Everything worn is
drawn.

## Death, and after

Dying puts you in the Other World with things to do: King Yemma, Snake Way, King Kai's
planet, Hell, and the ongoing question of whether anyone alive cares enough to wish you
back. Revival is not a timer. Specific people commit to gathering the balls for you, with
a chance drawn from how close you actually were and how much you were worth to them, and
their effort accumulates across years with visible milestones. When it lands, you are
alive again in the same session, in the world as it now stands.

## Layout

```
src/
  data/         content: races, techniques, transformations, canon, places,
                planets, universes, timeline, jobs, items and wishes, names,
                the phrasing lexicon
  engine/
    rng.js          seeded PRNG - every life replays from its seed
    text.js         the grammar
    memory.js       fingerprints, facts, threads
    generator.js    eligibility, weighted selection, choice resolution
    lifecycle.js    the year loop, death, afterlife, revival, legacy
    economy.js      the yearly slot budget and training ceilings
    stats.js        power maths - exponential, so growth compounds
    battle.js       turn-based combat: stances, ki, destruction, escalation
    combat.js       exchange-model fights for background resolution
    trials.js       the four minigame shapes, mastery, inventing forms
    dragonballs.js  universe-wide scatter and the radar search
    worlds.js       travel, influence, conquest, and who comes after you
    social.js       the twenty interaction verbs
    dialogue.js     scoring free-text replies against a specific person
    progression.js  transformation gating
    npc.js          NPC interiors and their own life progression
    aieffects.js    the referee for model-authored events
    ai.js           pluggable model backends and prompts
    tournament.js   brackets, formats, seeding, cross-universe fields
    events/         98 event templates in ten themed packs
  ui/           mobile-first interface, vanilla DOM
    portrait.js     the parametric SVG character
    trialui.js      the minigame screens
build/bundle.mjs  dependency-free bundler: per-module scope, single-file output
```

## The AI layer

The game is complete without a model. With one, it writes events, judges what you say to
people, and fills in the world's reactions. Three backends:

- **Published as an Artifact**, it uses the viewer's own Claude through the `sample`
  capability. No key, no setup. The first call asks the viewer's permission.
- **An Anthropic API key**, pasted under the Life tab. Stored in that browser only, sent
  only to Anthropic.
- **Any custom endpoint.** Give it a base URL, a model name, a key, an auth header name
  and prefix, and whether it speaks the OpenAI chat-completions shape or the Anthropic
  Messages shape. Replies are read out of `content[]`, `choices[]`, `response` or
  `output`, so most self-hosted gateways work as-is. There is a test button that makes
  one round trip and reports exactly what came back.

Three modes: off, mixed (the default, roughly every other year), and every year. Any
event also has a "Something else happens instead" button that asks for a replacement on
the spot.

The Anthropic path uses `claude-opus-5` with server-side refusal fallbacks enabled. It has
not been executed against the live API from this environment, which has no credentials;
the capability path is the one the published page uses.

## Balance

`npm run sim` plays complete lifetimes headlessly. The current 150-life run at a cap of
age 95:

```
crashes         : none
survived to cap : 40/80
age at end      : median 95, range 8-95
final power     : median 967,743,305, max 33,473,428,157,970,576
events per life : median 216
forms unlocked  : median 1, max 6
techniques      : median 8
people met      : median 25
```

Deaths are meant to be earned: the largest cause is fights you chose, not attrition.
No single event title is more than about 3% of everything that happens.
