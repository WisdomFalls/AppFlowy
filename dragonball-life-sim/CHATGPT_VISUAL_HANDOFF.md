# ChatGPT Visual Design Handoff — Quick Reference

You are taking over the **visual design, styling, and customization systems** for Dragon Ball: Mortal Coil, a Dragon Ball universe life simulation game. The game engine and all logic are complete and stable. Your job is to make it look great and feel deeply customizable.

---

## What You're Working With

### The Game
- **Genre**: Life simulation with battles, tournaments, leveling, NPC interaction
- **Setting**: Dragon Ball universe (multiple planets, races, eras)
- **Platforms**: Mobile-first (responsive to desktop)
- **Aesthetic**: Dark sci-fi theme (scouter readouts, martial arts tournaments)
- **State Management**: All game state is managed by JavaScript backend; you handle presentation only

### The Codebase
```
src/
├── ui/
│   ├── shell.html          ← Main HTML structure (modify for layout/new UI)
│   └── styles.css          ← Complete stylesheet (main work area)
├── engine/
│   ├── state.js            ← Game state (READ ONLY)
│   ├── generator.js        ← Event/text generation (READ ONLY)
│   ├── render/
│   │   ├── portrait.js     ← Character portrait SVG (can enhance)
│   │   └── screens.js      ← Screen rendering (READ ONLY)
│   └── [other logic]       ← DO NOT MODIFY
├── data/
│   ├── canon.js            ← Character data (READ ONLY)
│   └── timeline.js         ← Story events (READ ONLY)
└── [test, build files]

dist/dragonball-life-sim.html ← Final bundled output (auto-generated)
```

### Current Visual State
✅ **Complete**
- Full dark/light theme support
- Mobile-responsive layout (500px → 1400px)
- Component system (buttons, cards, tabs, bars)
- Sticky HUD and dock (header/footer)
- Battle, tournament, trial screens

⚠️ **Needs Improvement**
- Character portrait customization (currently basic SVG)
- Character creation UI (looks functional but not visually exciting)
- Color palette could be used more strategically
- Animations and micro-interactions are minimal
- Portrait doesn't show enough personality/customization options
- Battle UI could be more visually distinctive
- No visual transformation effects

---

## Your Main Tasks

### 1. Character Portrait Customization (Highest Priority)
**Current state**: Basic SVG portrait, static appearance
**Goal**: Rich customization that players can use to personalize their character

What to design:
- Hair style picker (spiky, straight, wavy, etc.)
- Skin tone selector (8-12 colors)
- Hair color picker (12+ colors, independent from style)
- Eye style and color options
- Gi/outfit color and style variations
- Facial features (beard, scars, tattoos, optional)
- Body build sliders (muscle tone, size)
- Posture options (neutral, fighting stance, injured)

**Integration**: 
- Live preview updates as player customizes
- Customization UI in character creation screen
- Saved customization persists through game
- Portrait updates reflect game state (power level, health, transformation)

### 2. Character Creation Screen Enhancement
**Current state**: Functional form with minimal styling
**Goal**: Visually compelling first impression

Improvements:
- Make portrait preview larger and more prominent
- Show customization options right next to preview (side-by-side on desktop)
- Highlight personality choices (appearance, name, etc.)
- Add visual feedback for each choice
- Make species selection more visually distinct (cards with race descriptions)
- Add era selection with visual context (timeline visualization)

### 3. UI Polish & Refinement
**Improve**:
- Button states and hover effects (more responsive feedback)
- Card styling (make event cards more visually distinct)
- Typography hierarchy (use font sizes more intentionally)
- Color accent usage (make action buttons pop more)
- Spacing and breathing room (adjust padding/margins for visual rhythm)
- Loading states (spinners, skeleton screens if needed)

### 4. Battle Screen Visual Enhancement
**Current state**: Functional, shows all info, somewhat plain
**Goal**: Exciting, clear, visually engaging battle experience

Enhancements:
- Enemy portrait display (show foe's appearance, not just stats)
- Visual power level feedback (bar color shifts based on difficulty)
- Battle action organization (group abilities by type)
- Turn indicator (clear visual of whose turn it is)
- Damage feedback (numbers pop on screen, color-coded)
- Critical hit/miss visual effects
- Victory/defeat animations

### 5. Transformation & State Visuals
**Current state**: Portrait is static
**Goal**: Visuals respond to character state

Add visual changes for:
- Power level increases (aura glow, hair color shift if superform)
- Health changes (bruises, bandages at low health)
- Transformations (color shifts, intensity changes)
- Age progression (subtle changes to appearance over character lifespan)
- Battle readiness (stance changes)

### 6. Tournament & Trial Screen Design
**Current state**: Functional but plain
**Goal**: Visually exciting bracket and challenge displays

Enhancements:
- Tournament bracket visualization (make advancing clear)
- Opponent cards (show power level matchup visually)
- Challenge difficulty visualization (colors, icons, visual progression)
- Scoring/ranking display (use color and size hierarchy)

---

## Quick Start: File Locations & What to Change

### Modify These Files
```
src/ui/styles.css          (PRIMARY - 99% of work here)
src/ui/shell.html          (Secondary - HTML structure for new UI elements)
src/engine/render/portrait.js (Optional - enhance SVG generation)
```

### Read These (Do Not Modify)
```
src/engine/*.js            (All game logic - READ ONLY)
src/data/*.js              (Game data - READ ONLY)
VISUAL_DESIGN_SPECIFICATION.md (Your design guide)
```

### Do Not Touch
```
src/engine/
src/data/
Anything in .claude/, node_modules, test files
```

---

## How the System Works (Minimal Technical Brief)

### Screen Rendering
1. Game state updates (user ages, event occurs, etc.)
2. Rendering system reads state and builds HTML
3. HTML is injected into `shell.html` templates
4. CSS styles are applied based on data-attributes and classes

### Portrait System
- Generated as SVG (not an image)
- Built from character data (race, appearance customization, power level)
- Updates instantly when appearance data changes
- Located in `src/engine/render/portrait.js`

### Styling Approach
- All styling is pure CSS (no inline styles in logic)
- Theme tokens are CSS variables (--gi, --ki, --blood, etc.)
- Responsive design uses media queries (mobile at 500px, desktop at 900px)
- Animations use CSS transitions and keyframes (no JS animation)

### Data Flow
```
Character data (state.character)
        ↓
Portrait SVG generation (render/portrait.js)
        ↓
HTML injection with CSS classes
        ↓
styles.css applies styling based on classes/data-attributes
        ↓
Browser renders final visual
```

---

## Design Constraints & Guidance

### ✅ Do This
- Use the existing color palette (don't add new colors)
- Enhance CSS and HTML structure
- Create components that follow the style guide
- Test responsiveness on mobile (500px) and desktop (1400px)
- Use CSS variables for consistent spacing/sizing
- Reference the Dragon Ball aesthetic (power levels, tournaments, scouters)
- Make interactions feel snappy and responsive
- Maintain accessibility (keyboard nav, color contrast, focus indicators)

### ❌ Don't Do This
- Modify game logic or simulation rules
- Change how game state is structured
- Add external dependencies (no new npm packages)
- Use inline styles (keep it in CSS)
- Change the dark-first design philosophy
- Break mobile responsiveness
- Add new colors outside the palette
- Modify test files or build configuration

### 🎯 Keep in Mind
- Players will customize their character appearance — make it satisfying
- This is the visual *layer*, not the game engine
- All state management happens in JavaScript; you just style what exists
- Small screen real estate is precious — be intentional with spacing
- Dragon Ball fans will notice if you don't respect the aesthetic

---

## File Structure for Changes

### styles.css Sections (2000+ lines)
```css
/* Root Variables & Theme */
:root { --gi, --ki, --blood, etc. }
@media (prefers-color-scheme: light) { ... }

/* Base Styles */
body, button, input, etc.

/* Shell & Layout */
#app, .screen, .hud, .dock, .sheet

/* Components */
.bar, .pill, .row, .stat, .card, etc.

/* Screens (currently at bottom) */
.battle { ... }
.tourney { ... }
.trial { ... }
.hunt { ... }
/* Add new component sections here as needed */

/* Responsive Design */
@media (min-width: 900px) { ... }
@media (min-width: 1400px) { ... }
```

### shell.html Structure
```html
<div id="app">
  <section id="screen-title">      ← Title/start screen
  <section id="screen-create">     ← Character creation
  <section id="screen-play">       ← Main game
  <section id="screen-battle">     ← Battle
  <section id="screen-tourney">    ← Tournament
  <section id="screen-trial">      ← Challenge
  <section id="screen-hunt">       ← Item hunt
  <section id="screen-death">      ← Epitaph/end
</div>

<div class="sheet">                 ← Right sidebar (desktop) / drawer (mobile)
  <!-- Dynamic content inserted here -->
</div>
```

New customization UI will go in `screen-create` section.

---

## Example: Character Customization Component

You'll need to design a component like this (HTML + CSS):

```html
<div class="customization-panel">
  <div class="portrait-preview" id="portrait-preview">
    <!-- SVG portrait renders here -->
  </div>
  
  <div class="customization-options">
    <div class="customization-section">
      <label class="field-label">Hair Style</label>
      <div class="opts hair-styles">
        <button class="opt" data-hair-style="spiky">Spiky</button>
        <button class="opt" data-hair-style="straight">Straight</button>
        <!-- etc -->
      </div>
    </div>
    
    <div class="customization-section">
      <label class="field-label">Skin Tone</label>
      <div class="swatches" id="skin-tones">
        <button class="swatch" style="background: #c9a876" data-skin="skin1"></button>
        <!-- etc -->
      </div>
    </div>
    
    <div class="customization-section">
      <label class="field-label">Muscle Tone</label>
      <div class="slider-row">
        <input type="range" min="0" max="100" id="muscle-slider">
        <span class="slider-val" id="muscle-val">50</span>
      </div>
    </div>
  </div>
</div>
```

CSS for it would go in `styles.css`, organized in a `.customization-panel` section.

---

## Success Criteria

When you're done, the game should feel:
- **Polished**: Smooth animations, responsive interactions, intentional spacing
- **Customizable**: Players can deeply personalize their character's appearance
- **Responsive**: Works perfectly on phone and desktop without any layout issues
- **Accessible**: Keyboard-navigable, good color contrast, respects reduced-motion
- **Thematic**: Visuals reinforce the Dragon Ball aesthetic (power levels, tournaments, etc.)
- **Performant**: No janky animations, instant interactions, sub-100ms response times

---

## Next Steps

1. Read `VISUAL_DESIGN_SPECIFICATION.md` for complete design details
2. Start with character portrait customization (highest impact)
3. Move to character creation screen enhancement
4. Polish UI components and interactions
5. Enhance battle, tournament, and trial screens
6. Test thoroughly on mobile, desktop, and responsive sizes
7. Validate accessibility (keyboard, color contrast, motion)
8. Commit your work and we'll integrate it

---

## Questions or Need Clarification?

This is a **visual design handoff**, meaning:
- Game logic is complete and locked (don't change it)
- All you're doing is making it look better and feel more customizable
- Integration is straightforward (CSS + HTML structure)
- You have full creative control over the visual presentation

The codebase is stable. All 191 prior tasks are complete and tested. You're the final step before release — make it beautiful.

Good luck! 🎨
