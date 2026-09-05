// The playable half of a trial. Four shapes, reused everywhere: hit the beat,
// repeat the form, hold on, or decide when to stop pushing.

const SEQ_GLYPHS = ['↑', '↓', '←', '→', '◆', '●', '▲', '■', '✦'];

function q(id) { return document.getElementById(id); }
function mk(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const reducedMotion = () => window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Play a trial. Calls `onDone(score)` with a 0-1 score when it finishes.
 * Everything is torn down before the callback runs.
 */
export function playTrial(trial, onDone) {
  q('trial-kicker').textContent = trial.purpose === 'training' ? 'Training'
    : trial.purpose === 'technique' ? 'Learning'
      : trial.purpose === 'form' ? 'Reaching for it' : 'Mastering';
  q('trial-title').textContent = trial.label;
  q('trial-blurb').textContent = trial.blurb;
  const stage = q('trial-stage');
  const foot = q('trial-foot');
  stage.innerHTML = '';
  foot.innerHTML = '';

  const runners = { timing: runTiming, sequence: runSequence, endurance: runEndurance, push: runPush };
  (runners[trial.kind] || runTiming)(trial, stage, foot, onDone);
}

function finishScreen(stage, foot, score, onDone) {
  stage.innerHTML = '';
  foot.innerHTML = '';
  const pct = Math.round(score * 100);
  const out = mk('div', 'trial-readout');
  const big = mk('span', 'big', pct + '%');
  out.appendChild(big);
  out.appendChild(document.createTextNode(
    pct >= 92 ? 'Nothing wasted.' : pct >= 75 ? 'Clean work.' : pct >= 50 ? 'It will do.'
      : pct >= 25 ? 'Sloppy.' : 'That went badly.',
  ));
  stage.appendChild(out);

  const done = mk('button', 'primary-btn', 'Take the result');
  done.type = 'button';
  done.addEventListener('click', () => onDone(score));
  foot.appendChild(done);
}

// ------------------------------------------------------------ timing

function runTiming(trial, stage, foot, onDone) {
  const rounds = trial.rounds;
  const scores = [];
  let round = 0;
  let raf = null;
  let start = 0;
  // A better-suited fighter gets a wider window, not a free pass.
  const zoneWidth = Math.max(8, 26 - trial.difficulty * 3 + trial.aptitude * 12);
  const speed = 900 + trial.difficulty * 260;

  const bar = mk('div', 'timing-bar');
  const zone = mk('div', 'timing-zone');
  const marker = mk('div', 'timing-marker');
  bar.appendChild(zone);
  bar.appendChild(marker);
  stage.appendChild(bar);
  const readout = mk('div', 'trial-readout', 'Tap when the marker is inside the band.');
  stage.appendChild(readout);

  const hit = mk('button', 'primary-btn', 'Now');
  hit.type = 'button';
  foot.appendChild(hit);

  let zoneStart = 0;
  function nextRound() {
    if (round >= rounds) {
      cancelAnimationFrame(raf);
      const total = scores.reduce((a, b) => a + b, 0) / scores.length;
      finishScreen(stage, foot, total, onDone);
      return;
    }
    round += 1;
    zoneStart = 12 + Math.random() * (76 - zoneWidth);
    zone.style.left = zoneStart + '%';
    zone.style.width = zoneWidth + '%';
    q('trial-progress').textContent = `Attempt ${round} of ${rounds}`;
    start = performance.now();
    tick();
  }

  let position = 0;
  function tick() {
    const t = (performance.now() - start) / (reducedMotion() ? speed * 1.7 : speed);
    position = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2 * 100;
    marker.style.left = `calc(${position}% - 2.5px)`;
    raf = requestAnimationFrame(tick);
  }

  hit.addEventListener('click', () => {
    const centre = zoneStart + zoneWidth / 2;
    const distance = Math.abs(position - centre);
    const score = Math.max(0, 1 - distance / (zoneWidth / 2 + 12));
    scores.push(score);
    readout.textContent = score > 0.85 ? 'Dead centre.'
      : score > 0.5 ? 'Inside the band.' : score > 0.2 ? 'Clipped the edge.' : 'Nowhere near.';
    cancelAnimationFrame(raf);
    setTimeout(nextRound, 420);
  });

  nextRound();
}

// ---------------------------------------------------------- sequence

function runSequence(trial, stage, foot, onDone) {
  const length = Math.min(8, 2 + trial.rounds);
  const glyphs = SEQ_GLYPHS.slice(0, Math.min(9, 4 + trial.difficulty));
  const sequence = Array.from({ length }, () => glyphs[Math.floor(Math.random() * glyphs.length)]);
  let index = 0;
  let correct = 0;

  const readout = mk('div', 'trial-readout', 'Watch.');
  stage.appendChild(readout);
  const pad = mk('div', 'seq-pad');
  const keys = glyphs.map((g) => {
    const b = mk('button', 'seq-key', g);
    b.type = 'button';
    b.disabled = true;
    b.addEventListener('click', () => press(g, b));
    pad.appendChild(b);
    return b;
  });
  stage.appendChild(pad);
  q('trial-progress').textContent = `${length} steps`;

  function press(g, button) {
    if (g === sequence[index]) {
      correct += 1;
      button.classList.add('lit');
      setTimeout(() => button.classList.remove('lit'), 160);
    } else {
      readout.textContent = 'Wrong.';
    }
    index += 1;
    q('trial-progress').textContent = `Step ${Math.min(index + 1, length)} of ${length}`;
    if (index >= length) {
      keys.forEach((k) => { k.disabled = true; });
      finishScreen(stage, foot, correct / length, onDone);
    }
  }

  let showIndex = 0;
  const gap = reducedMotion() ? 900 : Math.max(340, 760 - trial.difficulty * 70);
  function show() {
    if (showIndex >= sequence.length) {
      readout.textContent = 'Now repeat it.';
      keys.forEach((k) => { k.disabled = false; });
      q('trial-progress').textContent = `Step 1 of ${length}`;
      return;
    }
    const g = sequence[showIndex];
    const key = keys[glyphs.indexOf(g)];
    key.classList.add('lit');
    setTimeout(() => {
      key.classList.remove('lit');
      showIndex += 1;
      setTimeout(show, gap * 0.35);
    }, gap * 0.55);
  }
  setTimeout(show, 600);
}

// --------------------------------------------------------- endurance

function runEndurance(trial, stage, foot, onDone) {
  const target = 7000 + trial.difficulty * 1800;
  const drain = 16 + trial.difficulty * 7 - trial.aptitude * 8;
  let level = 100;
  let elapsed = 0;
  let last = performance.now();
  let raf = null;
  let ended = false;

  const bar = mk('div', 'endurance-bar');
  const fill = mk('div', 'endurance-fill');
  bar.appendChild(fill);
  stage.appendChild(bar);
  const readout = mk('div', 'trial-readout', 'Tap to hold it up. Do not let it empty.');
  stage.appendChild(readout);

  const hold = mk('button', 'primary-btn', 'Hold');
  hold.type = 'button';
  hold.addEventListener('click', () => { level = Math.min(100, level + 11); });
  foot.appendChild(hold);

  function tick(now) {
    const dt = Math.min(80, now - last);
    last = now;
    elapsed += dt;
    level -= (drain * dt) / 1000;
    fill.style.width = Math.max(0, level) + '%';
    q('trial-progress').textContent = `${(elapsed / 1000).toFixed(1)}s of ${(target / 1000).toFixed(0)}s`;
    if (level <= 0 || elapsed >= target) {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      finishScreen(stage, foot, Math.min(1, elapsed / target), onDone);
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
}

// -------------------------------------------------------------- push

function runPush(trial, stage, foot, onDone) {
  const target = 8 + trial.difficulty * 2;
  let pushes = 0;
  let busted = false;

  const readout = mk('div', 'trial-readout', 'Every push is worth more and more likely to tear something.');
  stage.appendChild(readout);
  const meter = mk('div', 'push-meter', '');
  stage.appendChild(meter);

  function update() {
    const risk = Math.min(0.85, pushes * (0.05 + trial.difficulty * 0.012));
    meter.innerHTML = `Pushes: <b>${pushes}</b> of about ${target}`
      + `<br><span class="push-risk">Chance the next one tears something: ${Math.round(risk * 100)}%</span>`;
    q('trial-progress').textContent = `Banked value ${Math.round(Math.min(1, pushes / target) * 100)}%`;
  }

  const push = mk('button', 'primary-btn', 'Push harder');
  push.type = 'button';
  push.addEventListener('click', () => {
    const risk = Math.min(0.85, pushes * (0.05 + trial.difficulty * 0.012)) * (1 - trial.aptitude * 0.35);
    if (Math.random() < risk) {
      busted = true;
      readout.textContent = 'Something goes in your shoulder and the season is over.';
      finishScreen(stage, foot, Math.max(0.05, (pushes / target) * 0.35), onDone);
      return;
    }
    pushes += 1;
    update();
    if (pushes >= target * 1.6) {
      finishScreen(stage, foot, 1, onDone);
    }
  });
  foot.appendChild(push);

  const bank = mk('button', 'ghost-btn', 'Stop here and bank it');
  bank.type = 'button';
  bank.addEventListener('click', () => {
    if (busted) return;
    finishScreen(stage, foot, Math.min(1, pushes / target), onDone);
  });
  foot.appendChild(bank);

  update();
}
