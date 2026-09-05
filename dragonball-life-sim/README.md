# Dragon Ball: Mortal Coil

A mobile life simulator in the shape of BitLife or Manhua Life, set in Dragon Ball.
You are born as one of twelve species in a chosen era, and you live one year at a
time: training, working, falling out with people, unlocking transformations, dying,
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

**The model writes, the engine referees.** Where Claude is available the game asks it
for entirely new events, given a compact picture of the character, their relationships,
their story memory, and an explicit list of recent beats not to repeat. The reply is
JSON: prose plus proposed consequences. Every number in it is clamped, every unknown key
dropped, and anything that would break the simulation is simply not applied. That is what
makes it safe to let a language model invent content at runtime: it can change the story
but it cannot change the rules.

## What is in it

| | |
|---|---|
| Species | 12, each with its own stat floor, growth curve, lifespan, ageing rate and mechanics: Saiyan zenkai, Namekian regeneration and solo reproduction, Frost Demon innate power and terrible work ethic, Majin absorption, Android upgrades, Shinjin divine ki |
| Transformations | 46 across race-specific ladders, gated on power, stats, story flags, mentors and rituals rather than a single unlock number |
| Techniques | 54 in six branches with a real prerequisite tree, plus a signature technique you invent and name yourself |
| Canon characters | 75, era-gated by birth and death year, with power interpolated across the sagas so Goku in Age 762 is not Goku in Age 780 |
| Places | 34 across Earth, Namek, Planet Vegeta, the Frieza Force, Yardrat, the Other World and the Null Realm, each with its own training multiplier and danger |
| Timeline | 21 canon events from the fall of Planet Vegeta to the Tournament of Power. You can walk into any of them, and if you resolve one differently the timeline forks |
| Events | 78 templates plus unlimited model-authored ones |
| Careers | 15 with promotion ladders, from martial arts instructor to Frieza Force sector commander |

Also: relationships that decay if you neglect them, marriage and children who inherit
your potential, the Dragon Balls and twelve wishes with real costs, tournaments,
crime and prison, the Hyperbolic Time Chamber, King Yemma's desk, Snake Way, Hell,
revival, reincarnation, and a legacy mode that continues as your child in a world that
remembers everything the previous generation did.

## Layout

```
src/
  data/         content: races, techniques, transformations, canon, places,
                timeline, jobs, items, names, the phrasing lexicon
  engine/
    rng.js          seeded PRNG - every life replays from its seed
    text.js         the grammar
    memory.js       fingerprints, facts, threads
    generator.js    eligibility, weighted selection, choice resolution
    lifecycle.js    the year loop, death, afterlife, legacy
    stats.js        power maths - exponential, so growth compounds
    combat.js       exchange-model fights, tournaments
    progression.js  transformation gating
    aieffects.js    the referee for model-authored events
    ai.js           sampling backends and prompts
    events/         78 event templates in seven themed packs
  ui/           mobile-first interface, vanilla DOM
build/bundle.mjs  dependency-free bundler: per-module scope, single-file output
```

## The AI layer

Two optional backends, and the game is complete without either:

- **Published as an Artifact**, it uses the viewer's own Claude through the `sample`
  capability. No key, no setup. The first call asks the viewer's permission.
- **Anywhere else**, you can paste an Anthropic API key under the Life tab. It is stored
  in that browser only and sent only to Anthropic.

Three modes: off, mixed (the default, roughly every other year), and every year. Any
event also has a "Something else happens instead" button that asks Claude for a
replacement on the spot.

The API path uses `claude-opus-5` with server-side refusal fallbacks enabled. It has not
been executed against the live API from this environment, which has no credentials; the
capability path is the one the published page uses.
