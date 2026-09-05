// Seeded, serialisable PRNG. Every life is reproducible from its seed, which
// keeps saves honest and makes the soak tests deterministic.

export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export class Rng {
  constructor(seed = Date.now()) {
    this.state = (typeof seed === 'number' ? seed >>> 0 : hashSeed(seed)) || 1;
    this.calls = 0;
  }

  static fromJSON(o) {
    const r = new Rng(1);
    r.state = o.state >>> 0 || 1;
    r.calls = o.calls || 0;
    return r;
  }

  toJSON() {
    return { state: this.state, calls: this.calls };
  }

  // mulberry32
  next() {
    this.calls++;
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  float(min = 0, max = 1) {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min, max) {
    if (max === undefined) {
      max = min - 1;
      min = 0;
    }
    if (max < min) return min;
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** True with probability p. */
  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Pick n distinct members, or as many as exist. */
  sample(arr, n) {
    const pool = arr.slice();
    const out = [];
    while (pool.length && out.length < n) {
      out.push(pool.splice(Math.floor(this.next() * pool.length), 1)[0]);
    }
    return out;
  }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Weighted pick. `weightOf` returns a non-negative number. */
  weighted(items, weightOf) {
    let total = 0;
    const weights = [];
    for (const item of items) {
      const w = Math.max(0, weightOf(item) || 0);
      weights.push(w);
      total += w;
    }
    if (total <= 0) return this.pick(items);
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Roughly normal, clamped to [min, max]. */
  gauss(mean, sd, min = -Infinity, max = Infinity) {
    const u = (this.next() + this.next() + this.next() + this.next() - 2) * 1.4142;
    return Math.max(min, Math.min(max, mean + u * sd));
  }

  /** Drift a 0-100 stat by a bounded random walk. */
  drift(value, amount) {
    return clamp(value + this.float(-amount, amount), 0, 100);
  }
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

/** Deterministic per-topic sub-stream, so unrelated systems don't desync. */
export function substream(rng, topic) {
  return new Rng(hashSeed(topic + ':' + rng.state + ':' + rng.calls));
}
