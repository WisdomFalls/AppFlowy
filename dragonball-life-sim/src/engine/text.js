// Text grammar. Templates are shapes, not sentences.
//
//   {a|b|c}    pick one alternative (nestable)
//   #bank#     pull a phrase from the lexicon (recursively expanded)
//   [slot]     substitute from the context object
//   [slot:cap] substitute and capitalise
//
// Because alternatives nest and banks expand recursively, one template line
// routinely has thousands of distinct renderings.

import { LEXICON } from '../data/lexicon.js';

const MAX_DEPTH = 8;

function pickAlt(body, rng) {
  // Split on top-level pipes only, so {a|{b|c}} works.
  const parts = [];
  let depth = 0, current = '';
  for (const ch of body) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (ch === '|' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts[Math.floor(rng.next() * parts.length)];
}

function expandAlts(str, rng, depth) {
  if (depth > MAX_DEPTH || str.indexOf('{') === -1) return str;
  let out = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '{') {
      let d = 1, j = i + 1;
      while (j < str.length && d > 0) {
        if (str[j] === '{') d++;
        else if (str[j] === '}') d--;
        if (d > 0) j++;
      }
      const body = str.slice(i + 1, j);
      out += expandAlts(pickAlt(body, rng), rng, depth + 1);
      i = j + 1;
    } else {
      out += str[i++];
    }
  }
  return out;
}

function expandBanks(str, rng, depth, used) {
  if (depth > MAX_DEPTH) return str;
  return str.replace(/#([a-zA-Z_][\w]*)#/g, (whole, key) => {
    const bank = LEXICON[key];
    if (!bank || !bank.length) return whole;
    // Avoid drawing the same phrase twice in one passage; a repeated stock
    // line is the single most obvious tell that text was generated.
    let phrase = bank[Math.floor(rng.next() * bank.length)];
    for (let tries = 0; tries < 4 && used.has(phrase) && bank.length > 1; tries++) {
      phrase = bank[Math.floor(rng.next() * bank.length)];
    }
    used.add(phrase);
    return render(phrase, {}, rng, depth + 1, used);
  });
}

function fillSlots(str, ctx) {
  return str.replace(/\[([\w.]+)(?::(\w+))?\]/g, (whole, path, mod) => {
    let value = ctx;
    for (const part of path.split('.')) {
      if (value == null) break;
      value = value[part];
    }
    if (value === undefined || value === null) return whole;
    let out = String(value);
    if (mod === 'cap') out = out.charAt(0).toUpperCase() + out.slice(1);
    if (mod === 'lower') out = out.toLowerCase();
    if (mod === 'upper') out = out.toUpperCase();
    return out;
  });
}

export function render(template, ctx, rng, depth = 0, used) {
  if (!template) return '';
  const seen = used || new Set();
  let s = String(template);
  s = expandAlts(s, rng, depth);
  s = expandBanks(s, rng, depth, seen);
  s = fillSlots(s, ctx);
  // A slot's value can itself be grammar (a template may store '#macguffin#'
  // in a slot), so run one more bounded pass over what was substituted in.
  if (/[#{]/.test(s) && depth < MAX_DEPTH) {
    s = expandAlts(s, rng, depth + 1);
    s = expandBanks(s, rng, depth + 1, seen);
  }
  return depth === 0 ? tidy(s) : s;
}

export function tidy(s) {
  let out = s
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.!?])\s*([.!?])+/g, '$1')
    .trim();
  // Sentence case: banks are written as standalone lines, so a phrase spliced
  // mid-passage can land at the start of a sentence.
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
  return out;
}

/** Rough count of distinct renderings a template can produce. */
export function variantCount(template) {
  let total = 1;
  let i = 0;
  const s = String(template || '');
  while (i < s.length) {
    if (s[i] === '{') {
      let d = 1, j = i + 1, alts = 1;
      while (j < s.length && d > 0) {
        if (s[j] === '{') d++;
        else if (s[j] === '}') d--;
        else if (s[j] === '|' && d === 1) alts++;
        if (d > 0) j++;
      }
      total *= alts;
      i++;
    } else if (s[i] === '#') {
      const m = /^#([a-zA-Z_][\w]*)#/.exec(s.slice(i));
      if (m && LEXICON[m[1]]) {
        total *= LEXICON[m[1]].length;
        i += m[0].length;
      } else i++;
    } else i++;
  }
  return total;
}

export function numberish(n) {
  if (n === undefined || n === null || Number.isNaN(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15) return (n / 1e15).toFixed(1).replace(/\.0$/, '') + ' quadrillion';
  if (abs >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + ' trillion';
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' billion';
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' million';
  if (abs >= 1e4) return Math.round(n / 1000) + ',000';
  return Math.round(n).toLocaleString('en-US');
}

export function zeni(n) {
  const v = Math.round(n);
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B Zeni';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M Zeni';
  return v.toLocaleString('en-US') + ' Zeni';
}

export function listPhrase(items, conj = 'and') {
  const a = items.filter(Boolean);
  if (a.length === 0) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} ${conj} ${a[1]}`;
  return `${a.slice(0, -1).join(', ')} ${conj} ${a[a.length - 1]}`;
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
