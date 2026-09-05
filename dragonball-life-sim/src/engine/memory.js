// Story memory. Three jobs:
//   1. Suppression - remember the exact shape of what has already happened so
//      the generator stops offering it.
//   2. Facts - durable, queryable statements about this life, so later events
//      can refer back to earlier ones by name.
//   3. Threads - running arcs (a rivalry, a debt, a hunt) that want to advance.

export function createMemory() {
  return {
    fingerprints: {},   // shape signature -> year last seen
    templateUse: {},    // template id -> times used
    beatUse: {},        // narrative beat -> times used
    facts: [],
    threads: [],
    recent: [],         // compact recent history, newest last
    nextFactId: 1,
    nextThreadId: 1,
  };
}

/** A signature for "this specific thing, involving these specific people". */
export function fingerprint(templateId, slots = {}) {
  const parts = Object.keys(slots)
    .sort()
    .map((k) => `${k}=${String(slots[k]).slice(0, 24)}`);
  return `${templateId}|${parts.join(',')}`;
}

/**
 * Weight multiplier for offering this template again. Recently used shapes are
 * heavily suppressed; heavily used templates decay even when the cast changes.
 */
export function noveltyWeight(memory, templateId, slots, year, opts = {}) {
  const fp = fingerprint(templateId, slots);
  const lastExact = memory.fingerprints[fp];
  const uses = memory.templateUse[templateId] || 0;

  let w = 1;
  if (lastExact !== undefined) {
    const gap = year - lastExact;
    if (gap <= 0) w *= 0.001;
    else if (gap < 3) w *= 0.02;
    else if (gap < 8) w *= 0.15;
    else if (gap < 16) w *= 0.55;
    else w *= 0.85;
  } else {
    w *= 1.35;   // never seen this exact shape: prefer it
  }

  // Template fatigue, independent of cast. Steep on purpose: a life sim dies
  // the moment the player recognises a beat they have already seen.
  //
  // Templates whose slots fully determine the scene (which transformation,
  // which technique, which saga) opt out: for those, "the same shape twice" is
  // already caught by the exact-fingerprint check above, and fatiguing them
  // just makes core progression unreachable.
  if (opts.fatigue !== false) w *= 1 / (1 + uses * uses * 0.9);
  else w *= 1 / (1 + uses * 0.12);
  return w;
}

export function remember(memory, { templateId, slots, year, title, text, tags }) {
  const fp = fingerprint(templateId, slots);
  memory.fingerprints[fp] = year;
  memory.templateUse[templateId] = (memory.templateUse[templateId] || 0) + 1;
  for (const tag of tags || []) {
    memory.beatUse[tag] = (memory.beatUse[tag] || 0) + 1;
  }
  memory.recent.push({ year, title, text: (text || '').slice(0, 320) });
  if (memory.recent.length > 40) memory.recent.shift();
}

export function addFact(memory, fact) {
  const f = {
    id: memory.nextFactId++,
    type: fact.type,
    text: fact.text,
    year: fact.year,
    subject: fact.subject || null,
    object: fact.object || null,
    weight: fact.weight ?? 1,
    tags: fact.tags || [],
  };
  memory.facts.push(f);
  if (memory.facts.length > 220) {
    // Drop the least important old facts, never the heavy ones.
    memory.facts.sort((a, b) => (b.weight - a.weight) || (b.year - a.year));
    memory.facts = memory.facts.slice(0, 200);
    memory.facts.sort((a, b) => a.year - b.year || a.id - b.id);
  }
  return f;
}

export function findFacts(memory, filter = {}) {
  return memory.facts.filter((f) => {
    if (filter.type && f.type !== filter.type) return false;
    if (filter.subject && f.subject !== filter.subject) return false;
    if (filter.tag && !f.tags.includes(filter.tag)) return false;
    if (filter.sinceYear !== undefined && f.year < filter.sinceYear) return false;
    return true;
  });
}

export function hasFact(memory, type, subject) {
  return memory.facts.some((f) => f.type === type && (subject === undefined || f.subject === subject));
}

// ---------------------------------------------------------------- threads

export function openThread(memory, thread) {
  const t = {
    id: memory.nextThreadId++,
    kind: thread.kind,
    subject: thread.subject || null,
    title: thread.title || thread.kind,
    stage: 0,
    maxStage: thread.maxStage ?? 3,
    heat: thread.heat ?? 50,
    openedYear: thread.year,
    lastYear: thread.year,
    data: thread.data || {},
    closed: false,
    outcome: null,
  };
  memory.threads.push(t);
  return t;
}

export function activeThreads(memory) {
  return memory.threads.filter((t) => !t.closed);
}

export function findThread(memory, kind, subject) {
  return memory.threads.find((t) => !t.closed && t.kind === kind && (subject === undefined || t.subject === subject));
}

export function advanceThread(memory, thread, year, heatDelta = 0) {
  thread.stage += 1;
  thread.lastYear = year;
  thread.heat = Math.max(0, Math.min(100, thread.heat + heatDelta));
  if (thread.stage >= thread.maxStage) {
    thread.closed = true;
    thread.outcome = thread.outcome || 'resolved';
  }
  return thread;
}

export function closeThread(memory, thread, outcome = 'resolved') {
  thread.closed = true;
  thread.outcome = outcome;
}

/** Threads that have gone quiet want attention; the director uses this. */
export function threadPressure(memory, year) {
  return activeThreads(memory).map((t) => ({
    thread: t,
    pressure: (year - t.lastYear) * 8 + t.heat * 0.5,
  })).sort((a, b) => b.pressure - a.pressure);
}

/** Compact narrative context, used for callbacks and for the AI prompt. */
export function recallSummary(memory, limit = 10) {
  const facts = memory.facts
    .slice()
    .sort((a, b) => (b.weight - a.weight) || (b.year - a.year))
    .slice(0, limit)
    .map((f) => `Age ${f.year}: ${f.text}`);
  return facts;
}

export function recentBeats(memory, limit = 5) {
  return memory.recent.slice(-limit).map((r) => r.title);
}
