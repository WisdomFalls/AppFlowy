import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { bundleJs } from '../build/bundle.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('the bundler flattens the module graph into valid script source', () => {
  const js = bundleJs(resolve(ROOT, 'src', 'main.js'));
  assert.ok(js.length > 100_000, 'bundle looks suspiciously small');
  assert.ok(!/^[ \t]*import\s/m.test(js), 'leftover import statement');
  assert.ok(!/^[ \t]*export\s/m.test(js), 'leftover export statement');
  // Parses as a script, which is what the published page will run it as.
  assert.doesNotThrow(() => new vm.Script(`(function(){"use strict";\n${js}\n})`),
    'bundle must parse as a classic script');
});

test('the built page is self contained and within the artifact size limit', (t) => {
  const out = resolve(ROOT, 'dist', 'dragonball-life-sim.html');
  if (!existsSync(out)) {
    t.skip('run `npm run build` first');
    return;
  }
  const html = readFileSync(out, 'utf8');
  assert.ok(html.includes('<title>'), 'page needs a title');
  assert.ok(html.includes('id="app"'), 'page needs its shell');
  assert.ok(Buffer.byteLength(html) < 16 * 1024 * 1024, 'page exceeds the 16MB artifact limit');

  // Only the font stylesheet may come from outside; everything else is inlined.
  const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  for (const url of external) {
    assert.ok(url.startsWith('https://fonts.googleapis.com/'),
      `unexpected external resource: ${url}`);
  }
  assert.ok(!html.includes('<!DOCTYPE'), 'the artifact wrapper supplies the doctype');
});
