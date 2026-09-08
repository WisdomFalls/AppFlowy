# Dragon Ball: Mortal Coil — Visual Design Specification

## Overview

Dragon Ball: Mortal Coil is a text-driven life simulation game set in the Dragon Ball universe. The game needs a complete visual design overhaul covering character customization, UI styling, transformation visuals, and overall aesthetic customization. This specification is designed as a handoff document for visual design and implementation work.

---

## Design Philosophy

### Current System (Technical Foundation)
- **Dark-first design**: The game uses a night sky aesthetic with scouter-style readouts
- **Phone-first responsive**: Optimized for mobile (500px base), scales to desktop (900px+)
- **Minimalist anime aesthetic**: Inspired by Dragon Ball UI design (Scouter readouts, martial arts tournament boards)
- **Performance-conscious**: SVG-based portrait rendering, CSS-only animations
- **Accessibility-aware**: Focus states, color-blindness considerations, reduced-motion support

### Design Goals
1. **Personalization**: Allow players to deeply customize character appearance and identity
2. **Dragon Ball Authenticity**: Maintain the series' visual language (scouters, auras, power levels, transformations)
3. **Narrative Integration**: Make visuals responsive to character state (power level increases, transformations, injuries)
4. **Clarity Under Constraints**: Small screen real estate with high information density
5. **Visual Feedback**: Immediate visual response to game actions (battles, transformations, power-ups)

---

## Color Palette

### Dark Mode (Primary)
```
Ground:         #14121d (deep space background)
Ground-2:       #1b1826 (slightly lighter surface)
Surface:        #221e30 (card/modal background)
Surface-2:      #2b2639 (surface hover/active state)
Line:           #3a3349 (border/divider, normal)
Line-soft:      #2f2a3e (border/divider, subtle)

Ink:            #f4eee4 (primary text)
Ink-2:          #c3b9cd (secondary text)
Ink-3:          #8f8499 (tertiary/hint text)

Accent (Gi):    #ff7a1a (orange - action, primary buttons)
Accent-soft:    #b8541010 (orange tint for backgrounds)
Ki:             #3fd6a4 (cyan - power, success, life force)
Blood:          #ff4d5e (red - danger, health, combat)
Gold:           #f5c451 (yellow - treasure, currency, tournaments)
Void:           #8b7bff (purple - divine, AI, special)
```

### Light Mode (Inverted)
The system has full light mode support with inverted palette. All color tokens swap appropriately.

### Usage Guidelines
- **Gi (Orange)**: Primary call-to-action, highlights, active states, character stats
- **Ki (Cyan)**: Success states, life/health recovery, positive mechanics
- **Blood (Red)**: Danger, health loss, combat damage, negative states
- **Gold (Yellow)**: Currency, tournaments, items, special achievements
- **Void (Purple)**: Divine beings, AI decisions, multiversal scope

---

## Typography System

### Font Stack
- **Display**: `Anton` (fallback: Arial Narrow, Impact) — large headers, titles, stats
- **Body**: `Newsreader` (fallback: Georgia, Times New Roman) — narrative text, descriptions
- **Mono**: `JetBrains Mono` (fallback: ui-monospace) — technical readouts, power levels, timestamps

### Sizing & Hierarchy
```
Hero Logo:        38px display (title screen)
Section Title:    24-26px display (uppercase, letter-spaced)
Subsection:       21px display (character name, major labels)
Primary Label:    16.5px body (event descriptions)
Body Text:        14.5-15.5px body (main content)
UI Label:         11-12px mono (field labels, hints)
Tiny Label:       8.5-10px mono (metadata, timestamps, tags)
```

### Spacing & Scale
- **Base unit**: 2px (use multiples: 2, 4, 6, 8, 10, 12, 14, 16...)
- **Border radius**: 14px (large), 9px (medium), 6px (small), 99px (pills)
- **Gap/padding**: 6px-20px depending on context
- **Line height**: 1.55 (body), 1.25 (labels), 1 (titles)

---

## Component Specifications

### Buttons & Interactive Elements

#### Primary Button (Call to Action)
```
State:          Default | Hover | Active | Disabled
Background:     Gi (#ff7a1a)
Text:           #17110a (dark brown, high contrast)
Border:         1px solid, Gi 70% + black mix
Padding:        14px (vertical) × 14px (horizontal)
Border-radius:  12px
Font:           20px Anton, uppercase, letter-spaced
Interaction:    Hover = brightness(1.08), Active = translateY(1px)
Disabled:       opacity: 0.42, cursor: not-allowed
```

#### Ghost Button (Secondary)
```
Background:     Ground-2 (#1b1826)
Border:         1px solid Line (#3a3349)
Text:           Ink-2 (#c3b9cd), 12px mono
Padding:        11px × 14px
Hover:          Border-color → Gi, Text → Gi
Danger variant: Border/text → Blood on hover
Transition:     150ms ease
```

#### Tab Button
```
Width:          46px (mobile), 64px (desktop)
Padding:        8px × 0 (mobile), 11px × 0 (desktop)
Border-radius:  10px
Border:         1px solid Line
Background:     Ground
Font:           8.5px mono (mobile), 10.5px mono (desktop)
Active/Hover:   Border-color → Gi, Text → Gi
Icon size:      15px (mobile), 21px (desktop)
```

### Cards & Containers

#### Entry Card (Timeline Event)
```
Background:     Surface (#221e30)
Border:         1px solid Line-soft
Border-radius:  14px
Padding:        12px × 13px
Margin-bottom:  10px
Title:          15.5px bold body
Text:           15px body, Ink-2
Outcome text:   15px body, Ink-2

Variants:
- World event:  Left border 2px Void (#8b7bff), text = Ink
- Battle win:   Left border 2px Ki (#3fd6a4), text = Ink-2
- Death:        Left border 2px Blood (#ff4d5e), text = Ink-2
```

#### Stat Box (2-column Grid)
```
Grid:           2 columns on mobile, 3 on desktop
Gap:            7px
Item padding:   8px × 10px
Item border:    1px solid Line-soft
Item radius:    9px
Background:     Ground-2

Label:          9px mono, uppercase, Ink-3
Value:          17px mono, bold, Gi color
Progress bar:   3px height, rounded, Gi background
```

#### Dossier (Key-Value List)
```
Layout:         Grid (no columns, just rows)
Row border:     1px solid Line-soft, bottom only
Row padding:    6px × 0
Key width:      82px (fixed)
Key font:       9px mono, uppercase, Ink-3
Value font:     14.5px body, Ink
Value.unknown:  Ink-3 color
```

### Bars & Fills

#### Health/Status Bar
```
Height:         4px (normal), 9px (prominent)
Background:     Line-soft (#2f2a3e)
Border-radius:  99px
Overflow:       hidden

Fill types:
- Health:       Blood (#ff4d5e)
- Ki/Power:     Ki (#3fd6a4)
- Happiness:    Gold (#f5c451)
- Stamina:      Gold (#f5c451)
- Destruction:  Void (#8b7bff)

Transition:     width 350ms ease (smooth power-up animations)
```

### Badges & Pills

#### Skill/Status Pill
```
Padding:        3px × 7px
Border-radius:  99px
Border:         1px solid Line
Font:           10px mono, letter-spaced
Background:     Ground
Color:          Ink-2
Variants:
- Good:         Border/text = Ki, slightly brightened
- Bad:          Border/text = Blood
- Gold:         Border/text = Gold
- Strong:       Font weight 600, text = Ink
```

### Inputs & Forms

#### Text Input
```
Width:          100%
Padding:        10px × 12px
Border-radius:  9px
Border:         1px solid Line
Background:     Ground-2
Font:           16px body (mobile), auto-scales
Color:          Ink
Placeholder:    Ink-3
Focus:          Outline 2px Gi (#ff7a1a), offset 2px
```

#### Select Dropdown
```
Inherits:       Text input styles
Font:           13px mono
Options:        Inherit from select (browser default)
```

#### Radio/Toggle Options
```
Layout:         flex, gap 6px, wrap
Item padding:   7px × 11px
Item border:    1px solid Line
Item radius:    99px (pill)
Background:     Ground-2
Font:           11.5px mono
Color:          Ink-2

On/Selected state:
- Border:       Gi (#ff7a1a)
- Color:        Gi
- Background:   Gi-soft (#b8541010)
Transition:     all 140ms ease
```

---

## Layout System

### Mobile-First (Default: 500px max-width)
- **Padding**: 14px horizontal throughout
- **Gap**: 6-12px between elements
- **Stack**: Vertical (flex-direction: column)
- **Sticky header**: HUD with character portrait, name, age, power level
- **Sticky footer**: Dock with "Age" button + tab buttons
- **Main content**: Feed area with max-height, scrollable

### Desktop (900px+)
- **Max-width**: 1080px (1200px at 1400px+)
- **Sheet behavior**: Fixed right column (400-460px), not bottom drawer
- **Feed width**: Increased, text max-width 66ch
- **Battle/tourney/trial screens**: Full width, centered content
- **Padding**: 20-28px horizontal (more breathing room)
- **Toolbar**: Adjusts to wider buttons (64px tabs, 22px font)

### Special Layouts

#### HUD (Header)
```
Position:       sticky top, z-index 30
Background:     Linear gradient (Ground-2 → transparent)
Padding:        10px × 14px (+ safe-area-inset)
Border-bottom:  1px solid Line-soft

Contains:
- Portrait:     40px × 47px, rounded, SVG
- Name:         21px display, uppercase, letter-spaced
- Race/Status:  10px mono, uppercase, Ink-3
- Age:          30px Gi color, bold
- Power level:  Scouter readout (see below)
- Bars:         3-column grid (health, happiness, ki)
- Pills:        Status badges (flexible wrap)
```

#### Scouter (Power Level Readout)
```
Layout:         flex, gap 10px, items-center
Padding:        7px × 10px
Border:         1px solid Line
Border-radius:  9px
Background:     Surface
Label:          9px mono, uppercase, Ink-3
Value:          17px mono, bold, Ki color, tabular-nums
Tier text:      10px mono, right-aligned, Ink-2
```

#### Dock (Footer)
```
Position:       sticky bottom, z-index 25
Background:     Ground-2
Border-top:     1px solid Line-soft
Padding:        9px × 12px (+ safe-area-inset)
Gap:            8px

Contains:
- Age button:   flex: 1 (takes remaining space)
- Tab buttons:  3-4 buttons, 46px wide each
```

#### Sheet (Modal/Drawer)
```
Mobile:
- Position:     fixed bottom
- Width:        100% (max phone-width)
- Animation:    rise (22px → 0, fade in, 260ms)
- Grab handle:  visible, 34px × 4px, centered
- Max-height:   88dvh
- Border-radius: 18px 18px 0 0

Desktop (900px+):
- Position:     fixed right
- Width:        400px (460px at 1400px+)
- Animation:    slide-in from right (24px, 200ms)
- Grab handle:  hidden
- Border-left:  1px solid Line
- Box-shadow:   -18px 0 40px -30px black
- Height:       100dvh
```

#### Battle Screen
```
Layout:         flex column, full screen
Sections:
1. Foe header:  12px × 14px padding, ground-2 bg
   - Name:      21px display, uppercase
   - Power:     15px mono bold, Blood color
   - HP bar:    9px tall
2. Battle log:  flex 1, scrollable, ends at bottom
3. Me strip:    portrait + small bars + state text
4. Battle tabs: Abilities, log, status (3 btabs)
5. Actions:     2-3 column grid (scales with screen)

Color coding:
- You:          Ki accent
- Enemy:        Blood accent
- Critical:     Gi accent
```

---

## Character Portrait System

### Current Technical Base
- **Format**: SVG, dynamically generated from character data
- **Canvas size**: 118px × 140px (default), scales to 40×47 in HUD, 130px in dossier
- **Rendering**: JavaScript path elements, no external images
- **Performance**: Instant load, cacheable

### Customization Scope (For ChatGPT)

The portrait system needs visual enhancement in:

1. **Head/Face Shape & Features**
   - Eye style variations (wide, angular, soft)
   - Hair/style customization (length, color, spikes, etc.)
   - Facial features (nose shape, mouth, scars, tattoos)

2. **Body Anatomy**
   - Muscle definition/tone slider
   - Build variation (lean, athletic, muscular, bulky)
   - Posture (neutral, fighting stance, relaxed, injured)

3. **Customization UI**
   - Color swatches (skin, hair, gi, accents)
   - Sliders (muscle tone, size, age appearance)
   - Toggle options (facial hair, scars, tattoos, jewelry)
   - Hair style picker
   - Gi style and color options

4. **State-Responsive Visuals**
   - Injury overlay (bruises, bandages)
   - Power-up glow (aura around character)
   - Transformation visual (color shifts, energy effects)
   - Age appearance changes (young → old)
   - Health status (pale if low health, glowing if full)

5. **Animation Potential**
   - Breathing/idle animation
   - Power level pulse (glow intensifies with power)
   - Transformation effect (gradual color shift)
   - Battle stance shifts

### Design Constraints
- Must remain SVG-based for performance
- Must not require external image assets
- Must render in real-time from character state
- Must be deterministic (same character data = same appearance always)

---

## UI Screens

### Screen: Character Creation
```
Layout:         Scrollable form, create class
Title:          "Dragon Ball MORTAL COIL" (38px Anton)
Tagline:        Story text (14.5px)

Fields:
- Name input:   text, with "Roll" button (reroll random name)
- Species:      Options with race card reveal
  Card shows:   Name (20px display), description, special note (Gi color)
- Born in:      Select dropdown with era options
  Note:         Shows era name and threat level
- Sex:          Toggle options (He/She/They)
- Seed:         Optional, for reproducible runs

CTA:            "Begin a life" (primary button)
Fallback:       "Back to title" (ghost button)
Meta:           AI generation note if applicable
```

### Screen: Play (Main Loop)
```
Sticky HUD:     Character portrait, name, age, power, bars, pills
Main Feed:      Year blocks with event entries (scrollable)
  Structure:    Year header (Year X, threat level)
                Event entries (title, text, outcome)
                Choices presented as buttons below

Year Block:     Left border 2px Line, padding-left 12px
Entry types:    world (void border), death (blood), survival (ki)

When event occurs:
- Sheet pops up with full event details
- Markdown text rendered with flavor
- Choices shown as large buttons
- Outcome displayed in feed

Dock:           Age button (flex 1) + Tab buttons (tabs, inventory, dossier, etc.)
```

### Screen: Battle
```
Full screen overlay
Header:         Enemy name, class, power level
                HP bar (9px, full width)
                Secondary bars (stamina, damage, etc.)

Center:         Battle log (scrollable, ends at bottom)
                Shows turn-by-turn action narrative
                New lines fade in as they appear

You Strip:      Portrait (40×47) + name + state
                3 mini bars (HP, Ki, Stamina)
                Current status text (Healthy, Injured, etc.)

Tabs:           Abilities | Log | Status
                Switch between action pickers

Actions:        2-column grid (3-column on desktop)
                Action button with label + hint
                Disabled actions fade out
                Special actions (Gi border), escape (Void border)

Victory/Loss:   Full-screen reveal with summary and stats
```

### Screen: Tournament
```
Header:         Tournament name (25px display)
                Rule summary
                Current round indicator

Bracket:        Round sections with match-ups
                Draw cards showing:
                  - Your name/opponent name
                  - Power level comparison
                  - Matchup flavor text

Your match:     "You vs. [Opponent]" draw card
                Highlighted as "now"

Actions:        Continue, withdraw, train, etc.
```

### Screen: Death (Epitaph)
```
Kicker:         "EPILOGUE" (10px mono, Blood color)
Name:           36px display, uppercase
Dates:          12px mono, Ink-3 ("Age X-Y")
Title:          13px mono uppercase, Gold, Gi accent
Score:          52px display, Gi color (big prominent number)

Grid:           3 columns, stat breakdown
                Power reached / Battles won / People known / etc.

Dossier:        Key-value pairs of life summary

CTA:            "Back to title" (primary button)
```

---

## Transformation System

### Visual States (To be Designed)
Each character should visually shift when entering transformation states:

1. **Base Form** (Normal appearance)
2. **Powered Up** (Aura glow, slight color tint)
3. **Super Saiyan / Equivalent** (Hair color shift, golden aura)
4. **Ultra Form** (More intense glow, might shift hue further)
5. **Defeated/Exhausted** (Duller colors, slouch posture, damage overlays)

### Design Approach
- **Hair/aura color changes** based on transformation tier
- **Glow effects** around portrait (CSS halo or SVG filter)
- **Subtle animation** (pulse/flare effect, intensity increases with power)
- **Damage overlay** (darkening, bruise overlays, bandage patterns)
- **Energy effect** (shimmer, particle effect simulation via CSS)

### Integration Points
- Portrait should update automatically as character power grows
- Transformation should trigger visual transition (smooth fade/flash)
- Low health should show visual damage (bruises, darkening)
- Battle outcome should update appearance immediately

---

## Customization Systems

### Appearance Customization (Character Creation & Later)

#### Skin Tone
- 8-12 preset colors spanning human, alien, and fantasy ranges
- Swatch picker in UI
- Should affect portrait fill color

#### Hair
- **Style presets**: Spiky (default), straight, wavy, curly, wild, tied-back, shaved
- **Colors**: 12+ options (black, brown, blonde, white, pink, blue, purple, etc.)
- Combination picker (style + color)

#### Eyes
- **Shape**: Wide, angular, round, sleepy, intense
- **Color**: Brown, blue, green, yellow, red, white, heterochromia
- Conveys personality/power level

#### Gi / Outfit
- **Type presets**: Gi (traditional martial arts), armor (Saiyan-style), casual, tech-suit
- **Colors**: 10+ main color options
- **Accents**: Undershirt color, armband color, belt color

#### Facial Features
- **Optional**: Facial hair (none, beard, goatee, stubble, mustache)
- **Optional**: Scars (none, one, multiple)
- **Optional**: Tattoos or marks
- **Optional**: Jewelry (earrings, etc.)

#### Body Build
- **Muscle slider** (0-100): Affects body width and definition lines
- **Size slider** (0-100): Affects overall scale (young/small → mature/large)
- **Posture**: Neutral, fighting stance, injured slump

### Shop/Equipment Customization
- Purchase items that affect appearance (armor pieces, clothing, accessories)
- Visual changes reflect inventory state
- Equipped items show in portrait and battles

### Personality & Customization Text
- Character epithet/title (shown in HUD)
- Custom biography text
- Battle intro/outro quotes

---

## Visual Polish & Effects

### Animations
- **Button presses**: Scale feedback (1.02), brief color shift
- **Bar fills**: Smooth 350ms ease for power-ups and stat changes
- **Sheet open**: Rise animation (220ms), backdrop blur
- **List items**: Fade-in for newly-added entries
- **Battle log**: Lines fade in as they're added
- **Power surge**: Pulse effect when power level jumps significantly

### Micro-interactions
- Hover states on all buttons (border-color shift, brightness)
- Focus rings on keyboard navigation (2px solid Gi)
- Disabled states with reduced opacity
- Active state button press effect (slight translateY)

### Responsive Imagery
- Portrait updates in real-time as customization changes
- Bars animate smoothly as values update
- Stats refresh without page reload
- Battle actions enable/disable smoothly

### Accessibility
- All interactions must work with keyboard (tab, enter, arrow keys)
- Focus indicators always visible (minimum 2px outline)
- Color contrast ≥ 4.5:1 for text (WCAG AA)
- Reduced-motion support (remove animations for users who prefer)
- No seizure risk (< 3 flashes per second)

---

## Design Files & Assets

### What Exists
1. **src/ui/styles.css** — Complete stylesheet with all current components
2. **src/ui/shell.html** — HTML structure for all screens
3. **src/engine/** — JavaScript logic that renders dynamic content
4. **dist/dragonball-life-sim.html** — Bundled single-file version

### What Needs Visual Enhancement

#### Priority 1: Character Portrait System
- Expandable customization UI (hair, colors, body type)
- Real-time portrait preview as options change
- State-responsive visual updates (power, health, transformation)
- More expressive character sheet design

#### Priority 2: UI Polish & Aesthetic
- Refined color palette usage (more intentional accent colors)
- Typography hierarchy improvements
- Card and component refinements
- Micro-interaction animations

#### Priority 3: Specialized Screens
- Battle screen visual enhancements
- Tournament bracket design
- Challenge/trial difficulty visualization
- Shop and equipment appearance preview

#### Priority 4: Brand & Theming
- Dragon Ball aesthetic enhancements (scouter look, martial arts tournament boards)
- Optional theme variations (dark sci-fi, tournament-focused, etc.)
- Custom font options or icon systems
- Visual worldbuilding (planet themes, faction colors)

---

## Handoff Instructions for ChatGPT

### Scope of Work
You are responsible for **visual design and styling**, not game logic. Your work should:
- ✅ Enhance CSS styling and HTML structure for visual presentation
- ✅ Design new UI components for character customization
- ✅ Create visual effects and animations
- ✅ Improve responsive design and layouts
- ✅ Suggest and implement color/typography improvements
- ❌ Do not modify game logic or simulation engine
- ❌ Do not add new game mechanics
- ❌ Do not change how character data is structured

### Integration Points
The visual system integrates with the engine through:
1. **Portrait rendering**: `src/engine/render/portrait.js` generates SVG
2. **Event display**: Screens render state through template literals
3. **Data binding**: CSS classes and data-attributes control visual state
4. **Animation hooks**: Transitions and animations are CSS-based

### Key Files to Modify
- `src/ui/styles.css` — Stylesheet (main work)
- `src/ui/shell.html` — HTML templates (component layout)
- `src/engine/render/portrait.js` — Portrait customization (if extending)
- `dist/dragonball-life-sim.html` — Bundled output (auto-generated)

### Testing & Validation
- Test on mobile (500px) and desktop (1400px)
- Verify all screens render correctly
- Check responsive behavior (no horizontal scroll on mobile)
- Validate color contrast (WCAG AA minimum)
- Test animations on reduced-motion preference
- Ensure all interactive elements are keyboard-accessible

### Style Guidelines
- **Mobile-first**: Design for 500px, enhance at breakpoints
- **Consistency**: Maintain the dark-first, scouter-inspired aesthetic
- **Constraint-aware**: Work within the color palette, don't add new colors
- **Performance**: CSS animations only, avoid expensive DOM operations
- **Dragon Ball flavor**: Reference the series' UI language (power levels, tournaments, battles)

---

## Deliverables Checklist

When complete, ChatGPT should deliver:

- [ ] Enhanced character creation UI with live portrait preview
- [ ] Character customization system (skin tone, hair, gi color, etc.)
- [ ] Improved card and component styling
- [ ] Refined animation system with micro-interactions
- [ ] Responsive design improvements across all screens
- [ ] Battle screen visual enhancements
- [ ] Tournament/bracket visual improvements
- [ ] Updated styles.css with comprehensive component library
- [ ] Updated shell.html with new customization UI structure
- [ ] All changes tested across mobile/desktop/responsive
- [ ] Accessibility audit (WCAG AA, keyboard navigation, color contrast)

---

## Current Codebase State

### Latest Completed Task
Task #192 (System Audit) — All 191 previous tasks completed and verified.
- Core engine fully functional
- Battle system working
- NPC progression complete
- Timeline events integrated with canon characters
- 34-test suite passing
- 200-lifetime stress test passing (zero crashes)

### Next Steps
This visual design work is the final step before release. All game logic is stable; the visual layer is what remains to be polished and customized.

---

End of specification. Ready for ChatGPT handoff.
