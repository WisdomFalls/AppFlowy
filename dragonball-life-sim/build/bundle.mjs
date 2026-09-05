#!/usr/bin/env node
// Dependency-free bundler. Each module keeps its own scope and hands back an
// export object, so module-local names never collide - which matters when the
// output is one <script> block in a single-file page.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'src');

// Bare side-effect imports are stripped first so they cannot be swallowed by
// the clause of a later `import ... from` statement.
const BARE_IMPORT_RE = /^[ \t]*import\s+['"](\.[^'"]+)['"];?[ \t]*$/gm;
const IMPORT_RE = /^[ \t]*import\s+([^;]*?)\s+from\s+['"](\.[^'"]+)['"];?[ \t]*$/gm;
const EXPORT_DECL_RE = /^[ \t]*export\s+(const|let|var|function|class|async\s+function)\s+([A-Za-z_$][\w$]*)/gm;
const EXPORT_LIST_RE = /^[ \t]*export\s*\{([^}]*)\}\s*;?[ \t]*$/gm;

function slug(file) {
  return relative(SRC, file).replace(/[^A-Za-z0-9]/g, '_');
}

function parseModule(file) {
  const code = readFileSync(file, 'utf8');
  const deps = [];
  const importLines = [];

  let body = code.replace(BARE_IMPORT_RE, (whole, spec) => {
    deps.push(resolve(dirname(file), spec));
    return '';
  });

  body = body.replace(IMPORT_RE, (whole, clause, spec) => {
    const target = resolve(dirname(file), spec);
    deps.push(target);
    if (!clause) return '';
    const name = `__mod_${slug(target)}`;
    const trimmed = clause.trim();
    const braced = /^\{([\s\S]*)\}$/.exec(trimmed);
    if (braced) {
      // { a, b as c }  ->  const { a, b: c } = __mod_x;
      const bindings = braced[1]
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const as = /^(\S+)\s+as\s+(\S+)$/.exec(part);
          return as ? `${as[1]}: ${as[2]}` : part;
        });
      return bindings.length ? `const { ${bindings.join(', ')} } = ${name};` : '';
    }
    const star = /^\*\s+as\s+(\S+)$/.exec(trimmed);
    if (star) return `const ${star[1]} = ${name};`;
    throw new Error(`Unsupported import form in ${relative(SRC, file)}: ${trimmed}`);
  });

  const exported = new Set();
  EXPORT_DECL_RE.lastIndex = 0;
  let m;
  while ((m = EXPORT_DECL_RE.exec(body))) exported.add(m[2]);
  EXPORT_LIST_RE.lastIndex = 0;
  while ((m = EXPORT_LIST_RE.exec(body))) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) exported.add(name);
    }
  }

  body = body
    .replace(EXPORT_DECL_RE, (whole, kind, name) => whole.replace(/^([ \t]*)export\s+/, '$1'))
    .replace(EXPORT_LIST_RE, '');

  if (/^[ \t]*export\s/m.test(body)) {
    throw new Error(`Unsupported export form in ${relative(SRC, file)}`);
  }

  return { file, body, deps, exported: Array.from(exported), importLines };
}

const cache = new Map();
const order = [];
const visiting = new Set();

function visit(file) {
  if (cache.has(file)) return;
  if (visiting.has(file)) {
    throw new Error('Import cycle involving ' + relative(SRC, file));
  }
  visiting.add(file);
  const mod = parseModule(file);
  cache.set(file, mod);
  for (const dep of mod.deps) visit(dep);
  visiting.delete(file);
  order.push(mod);
}

export function bundleJs(entry) {
  cache.clear();
  order.length = 0;
  visiting.clear();
  visit(entry);

  const parts = order.map((mod) => {
    const name = `__mod_${slug(mod.file)}`;
    const returns = mod.exported.length ? `\n  return { ${mod.exported.join(', ')} };` : '';
    return `/* ==== ${relative(SRC, mod.file)} ==== */\nconst ${name} = (function () {\n${mod.body.trim()}${returns}\n})();\n`;
  });

  const js = parts.join('\n');
  if (/^[ \t]*(import|export)\s/m.test(js)) {
    throw new Error('Leftover module syntax in bundle');
  }
  return js;
}

function main() {
  const js = bundleJs(resolve(SRC, 'main.js'));
  const css = readFileSync(resolve(SRC, 'ui', 'styles.css'), 'utf8');
  const shell = readFileSync(resolve(SRC, 'ui', 'shell.html'), 'utf8');

  const page = `<title>Dragon Ball: Mortal Coil</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@400;600;800&display=swap">
<style>
${css}
</style>
${shell}
<script>
(function () {
"use strict";
${js}
})();
</script>
`;
  mkdirSync(resolve(ROOT, 'dist'), { recursive: true });
  const out = resolve(ROOT, 'dist', 'dragonball-life-sim.html');
  writeFileSync(out, page);
  const kb = (Buffer.byteLength(page) / 1024).toFixed(1);
  console.log(`bundled ${order.length} modules -> dist/dragonball-life-sim.html (${kb} KB)`);
}

if (process.argv[1] && process.argv[1].endsWith('bundle.mjs')) main();
