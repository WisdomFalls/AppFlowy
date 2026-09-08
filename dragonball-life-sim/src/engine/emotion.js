// What a character feels and how it manifests.
//
// This layer distinguishes between:
// - Emotional state (what the character feels): computed from personality, relationships, events, and context
// - Expression (what the face shows): computed by the visual system from emotional state + character morphology
//
// The simulation owns emotional semantics. The visual system owns how those semantics render.
//
// Free-text moods (existing system) persist for backward compatibility and allow fine-grained
// narrative moods. This system provides semantic emotion enums for structured decision-making.

/**
 * Primary emotional states. Core, distinct emotions that appear frequently in the Dragon Ball
 * universe and drive behavior meaningfully. All states are at 0-100 intensity unless dual-state.
 * Most emotions are single-state; some are pairs (affectionate+flustered, afraid+confident).
 */
export const EMOTION = {
  // Base emotional states (single value 0-100)
  flustered: 'flustered',      // embarrassed, caught off-guard, blushing
  affectionate: 'affectionate', // warm, caring, attracted; pairs with flustered at high intensity
  determined: 'determined',    // focused, committed, resolute
  excited: 'excited',          // enthusiastic, eager, anticipatory
  amused: 'amused',            // entertained, laughing, finding humor
  afraid: 'afraid',            // anxious, fearful, intimidated; opposes confident
  confident: 'confident',      // assured, believing in oneself; opposes afraid
  furious: 'furious',          // angry, enraged, hostile
  disappointed: 'disappointed', // let down, unsatisfied, disheartened
  grieving: 'grieving',        // mourning, heartbroken, devastated
  suspicious: 'suspicious',    // distrustful, wary, cautious
  relieved: 'relieved',        // at ease after stress, grateful for escape
  uncomfortable: 'uncomfortable', // uneasy, bothered, wanting to leave
};

/**
 * Emotional state of a character at a point in time.
 * Used for decision-making (NPC behavior, player perception) and visual rendering.
 * Moods (free-text) are preserved for narrative flavor and backward compatibility.
 */
export function createEmotionalState() {
  return {
    // Current semantic emotions, each 0-100 intensity
    flustered: 0,
    affectionate: 0,
    determined: 0,
    excited: 0,
    amused: 0,
    afraid: 0,
    confident: 0,
    furious: 0,
    disappointed: 0,
    grieving: 0,
    suspicious: 0,
    relieved: 0,
    uncomfortable: 0,
  };
}

/**
 * Get the dominant emotion(s) in a character's current state.
 * Returns ordered list [{ emotion, intensity }], strongest first.
 * Multiple emotions can be "active" at once (e.g., afraid+furious, amused+uncomfortable).
 */
export function getDominantEmotions(emotionalState, threshold = 20) {
  return Object.entries(emotionalState || {})
    .filter(([_, intensity]) => intensity >= threshold)
    .map(([emotion, intensity]) => ({ emotion, intensity }))
    .sort((a, b) => b.intensity - a.intensity);
}

/**
 * Bridge existing free-text moods to semantic emotions.
 * Maps legacy mood strings to equivalent primary emotions.
 * Used for backward compatibility during transition from mood-only to emotion+mood system.
 */
export function moodToEmotionBridge(moodString) {
  if (!moodString) return null;
  const m = moodString.toLowerCase();

  // Exact or partial matches to emotional states
  if (m.includes('furious') || m.includes('angry')) return { furious: 80 };
  if (m.includes('grieving') || m.includes('mourning') || m.includes('heartbroken')) return { grieving: 90 };
  if (m.includes('frightened') || m.includes('afraid') || m.includes('terrified')) return { afraid: 85, confident: 10 };
  if (m.includes('excited') || m.includes('eager')) return { excited: 80, determined: 30 };
  if (m.includes('relieved')) return { relieved: 75 };
  if (m.includes('suspicious') || m.includes('wary')) return { suspicious: 60 };
  if (m.includes('disappointed')) return { disappointed: 70 };
  if (m.includes('frustrated') || m.includes('annoyed')) return { furious: 40, disappointed: 30 };
  if (m.includes('stressed') || m.includes('overwhelmed')) return { uncomfortable: 60, afraid: 30 };
  if (m.includes('exhausted') || m.includes('weary')) return { uncomfortable: 40 };
  if (m.includes('restless') || m.includes('agitated')) return { uncomfortable: 50, excited: 20 };
  if (m.includes('spoiling for a fight')) return { furious: 50, excited: 60, determined: 40 };
  if (m.includes('determined') || m.includes('resolute')) return { determined: 80 };
  if (m.includes('amused') || m.includes('entertained')) return { amused: 70 };
  if (m.includes('affectionate') || m.includes('romantic')) return { affectionate: 70 };

  // No clear mapping
  return null;
}

/**
 * Update emotional intensity based on context. Emotions decay over time unless reinforced by events.
 * Returns updated emotionalState.
 */
export function decayEmotions(emotionalState, decayRate = 0.95) {
  const state = Object.assign({}, emotionalState || {});
  for (const emotion in state) {
    if (state[emotion] > 0) {
      state[emotion] = Math.max(0, Math.round(state[emotion] * decayRate));
    }
  }
  return state;
}

/**
 * Set or modify an emotion. Handles opposing emotions (afraid/confident, etc).
 * Positive intensity increases the emotion; negative decreases it.
 */
export function setEmotion(emotionalState, emotion, intensity) {
  const state = Object.assign({}, emotionalState || {});
  const clamped = Math.max(0, Math.min(100, intensity));

  // Handle opposing pairs
  const opposites = { afraid: 'confident', confident: 'afraid' };
  if (opposites[emotion]) {
    const opposite = opposites[emotion];
    state[opposite] = Math.max(0, state[opposite] - Math.abs(intensity - (state[emotion] || 0)) * 0.5);
  }

  state[emotion] = clamped;
  return state;
}

/**
 * Shift emotional intensity smoothly. Useful for gradual transitions.
 * moveAmount can be positive (increase intensity) or negative (decrease).
 */
export function shiftEmotion(emotionalState, emotion, moveAmount) {
  const current = (emotionalState || {})[emotion] || 0;
  return setEmotion(emotionalState, emotion, current + moveAmount);
}

/**
 * Map a character's dominant emotions to a canonical expression label for the visual system.
 * The visual system uses this to decide what the character's face looks like.
 *
 * Returns a structured expression object for the renderer:
 * { primary, secondary, intensity }
 *
 * primary/secondary: expression enum values (flustered, affectionate, afraid, etc.)
 * intensity: 0-100 scale for how strong the expression should be
 */
export function emotionToExpression(emotionalState, character = {}) {
  const emotions = getDominantEmotions(emotionalState, 15);

  if (!emotions.length) {
    return { primary: 'neutral', secondary: null, intensity: 0 };
  }

  const primary = emotions[0];
  const secondary = emotions[1];

  // Handle specific emotion combos for richer expressions
  // (e.g., affectionate + flustered = more complex than either alone)
  if (primary.emotion === 'affectionate' && secondary?.emotion === 'flustered') {
    return { primary: 'affectionate_flustered', secondary: null, intensity: Math.min(primary.intensity, secondary.intensity) };
  }
  if (primary.emotion === 'afraid' && secondary?.emotion === 'confident') {
    // Conflicted: afraid but trying to be brave
    return { primary: 'courageous', secondary: 'afraid', intensity: primary.intensity };
  }
  if (primary.emotion === 'furious' && secondary?.emotion === 'determined') {
    return { primary: 'furious_determined', secondary: null, intensity: primary.intensity };
  }

  // Simple mapping: primary emotion maps directly to expression
  return {
    primary: primary.emotion,
    secondary: secondary?.emotion || null,
    intensity: primary.intensity,
  };
}

/**
 * Initialize or sync a character's emotional state from their free-text mood.
 * Call once per character or when mood changes significantly.
 * Does not destroy existing structured emotions; bridges where emotion is null.
 */
export function syncEmotionalState(character) {
  if (!character.emotionalState) {
    character.emotionalState = createEmotionalState();
  }

  // If a free-text mood exists and emotions are minimal, bridge them
  if (character.mood) {
    const bridged = moodToEmotionBridge(character.mood);
    if (bridged) {
      for (const [emotion, intensity] of Object.entries(bridged)) {
        // Only override if current emotion is low/zero
        if ((character.emotionalState[emotion] || 0) < 20) {
          character.emotionalState[emotion] = intensity;
        }
      }
    }
  }

  return character.emotionalState;
}
