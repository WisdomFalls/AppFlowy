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

  const runners = {
    timing: runTiming, sequence: runSequence, endurance: runEndurance, push: runPush,
    stillness: runStillness, rampage: runRampage,
  };
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


// ---------------------------------------------------------- stillness

/**
 * Meditation. A thought drifts in; you tap to let it go. Tapping when nothing
 * is there is chasing it, which costs you. Doing nothing while a thought sits
 * costs you more. The difficulty is that most of the time the right move is
 * to do nothing at all.
 */
function runStillness(trial, stage, foot, onDone) {
  const rounds = Math.max(6, trial.rounds * 2);
  let round = 0;
  let score = 0;
  let thought = null;
  let raf = null;
  let stop = false;

  const ring = mk('div', 'still-ring');
  const inner = mk('div', 'still-inner');
  ring.appendChild(inner);
  stage.appendChild(ring);
  const label = mk('div', 'still-label', 'Breathe.');
  stage.appendChild(label);
  const tally = mk('div', 'push-meter', `0 of ${rounds}`);
  stage.appendChild(tally);

  const btn = mk('button', 'primary-btn', 'Let it go');
  btn.type = 'button';
  foot.appendChild(btn);

  const settle = (good, why) => {
    score += good;
    round += 1;
    thought = null;
    inner.classList.remove('lit');
    label.textContent = why;
    tally.textContent = `${round} of ${rounds}`;
    if (round >= rounds) {
      stop = true;
      if (raf) cancelAnimationFrame(raf);
      finishScreen(stage, foot, Math.max(0, score / rounds), onDone);
    }
  };

  btn.addEventListener('click', () => {
    if (stop) return;
    if (thought) settle(1, 'Gone. Back to the breath.');
    else settle(0, 'Nothing was there. You went looking.');
  });

  let last = performance.now();
  let wait = 900 + Math.random() * 1800;
  const tick = (now) => {
    if (stop) return;
    const dt = now - last;
    last = now;
    if (!thought) {
      wait -= dt;
      if (wait <= 0) {
        thought = { life: 1100 - trial.difficulty * 110 };
        inner.classList.add('lit');
        label.textContent = 'Something has your attention.';
      }
    } else {
      thought.life -= dt;
      if (thought.life <= 0) {
        settle(0.15, 'It carried you off. You come back late.');
        wait = 700 + Math.random() * 1600;
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

// ------------------------------------------------------------ rampage

/**
 * The Great Ape. You are not fighting anything; you are trying to steer forty
 * tonnes of yourself away from the things you would regret. Each beat offers
 * two directions and you pick, with your grip slipping the whole time.
 */
function runRampage(trial, stage, foot, onDone) {
  const beats = Math.max(5, trial.rounds + 3);
  const TARGETS = [
    ['A ridge line', 'A lit town', 0],
    ['Open water', 'The camp you came from', 0],
    ['The empty quarter', 'The people who found you', 0],
    ['A mountain', 'The road out', 0],
    ['Nothing at all', 'Whoever is shouting your name', 0],
    ['The far side of the valley', 'The nearest thing that moves', 0],
  ];
  let beat = 0;
  let held = 0;
  let grip = 1;

  const bar = mk('div', 'endurance-bar');
  const fill = mk('div', 'endurance-fill');
  bar.appendChild(fill);
  stage.appendChild(bar);
  const scene = mk('div', 'trial-readout');
  stage.appendChild(scene);
  const meter = mk('div', 'push-meter', 'Your grip on yourself');
  stage.appendChild(meter);

  const render = () => {
    fill.style.width = Math.max(0, grip * 100) + '%';
    fill.style.background = grip > 0.6 ? 'var(--ki)' : grip > 0.3 ? 'var(--gold)' : 'var(--blood)';
    meter.textContent = grip > 0.6 ? 'You are still in there.'
      : grip > 0.3 ? 'It is getting away from you.' : 'There is almost nothing of you left in this.';
  };

  const step = () => {
    if (beat >= beats) {
      finishScreen(stage, foot, held / beats, onDone);
      return;
    }
    const pair = TARGETS[beat % TARGETS.length];
    const flip = Math.random() < 0.5;
    const options = flip ? [pair[1], pair[0]] : [pair[0], pair[1]];
    const safeIndex = flip ? 1 : 0;
    scene.textContent = `Something is in front of you. ${options[0]}, or ${options[1]}.`;
    foot.innerHTML = '';
    options.forEach((label, i) => {
      const b = mk('button', 'choice', '');
      b.type = 'button';
      b.appendChild(mk('span', 'choice-label', label));
      b.addEventListener('click', () => {
        // The worse your grip, the more likely the ape decides for you.
        const yours = Math.random() < grip;
        const chose = yours ? i : Math.floor(Math.random() * 2);
        if (chose === safeIndex) {
          held += yours ? 1 : 0.5;
          scene.textContent = 'You turn. Nothing there but rock.';
        } else {
          scene.textContent = yours
            ? 'You go through it. You will find out what was in it later.'
            : 'You do not turn. You watch yourself not turn.';
        }
        grip = Math.max(0.05, grip - (0.06 + trial.difficulty * 0.03));
        beat += 1;
        render();
        setTimeout(step, 550);
      });
      foot.appendChild(b);
    });
  };
  render();
  step();
}
