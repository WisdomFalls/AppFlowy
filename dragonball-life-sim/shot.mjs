import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 430, height: 932 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await p.goto('file:///home/user/AppFlowy/dragonball-life-sim/dist/dragonball-life-sim.html');
await p.waitForTimeout(600);
// start a game fast
async function tap(sel) {
  const els = await p.$$(sel);
  for (const e of els) {
    if (!(await e.isVisible())) continue;
    try { await e.click({ timeout: 1500 }); } catch { continue; }
    await p.waitForTimeout(300);
    return true;
  }
  return false;
}
for (const label of ['New Life', 'Begin', 'Start', 'Random', 'Roll', 'Live it']) {
  await tap(`button:has-text("${label}")`);
}
// Live a few years, then look at the Power panel.
for (let i = 0; i < 8; i++) {
  await tap('button:has-text("AGE UP")');
  // clear any event by taking the first choice
  for (let k = 0; k < 4; k++) {
    const cs = await p.$$('#sheet-foot button, #sheet-body button.row');
    let clicked = false;
    for (const c of cs.reverse()) {
      if (!(await c.isVisible())) continue;
      try { await c.click({ timeout: 1500 }); } catch { continue; }
      await p.waitForTimeout(150); clicked = true; break;
    }
    if (!clicked) break;
  }
  // If a fight opened, finish it.
  for (let k = 0; k < 60; k++) {
    if (!(await p.$('#screen-battle.active'))) break;
    if (!(await tap('button:has-text("Heavy blow")'))) {
      if (!(await tap('#battle-actions button'))) break;
    }
  }
  await p.waitForTimeout(120);
}
await tap('#screen-play .navbtn:has-text("POWER"), button:has-text("POWER")');
await p.waitForTimeout(600);
console.log('--- sheet ---');
console.log(await p.evaluate(() => (document.getElementById('sheet')||{}).innerText || 'no sheet'));
await p.screenshot({ path: process.argv[2] || '/tmp/x.png', fullPage: false });
console.log('errors:', errs.length ? errs.join('\n') : 'none');
console.log('title:', await p.title());
console.log(await p.evaluate(() => document.body.innerText.slice(0, 700)));
await b.close();
