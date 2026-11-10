// ---------- plays: small interactive toys shown on a card ----------
let W = null;
const FIT_PTS = [[8, 16], [18, 22], [28, 34], [40, 38], [50, 52], [62, 55], [74, 70], [88, 78]];
const FIT_BASE = 6;
const ARTS = {
  heart: ['............', '..XX....XX..', '.XXXX..XXXX.', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', '.XXXXXXXXXX.', '..XXXXXXXX..', '...XXXXXX...', '....XXXX....', '.....XX.....', '............'],
  smile: ['...XXXXXX...', '..X......X..', '.X........X.', 'X..XX..XX..X', 'X..XX..XX..X', 'X..........X', 'X.X......X.X', 'X..X....X..X', 'X...XXXX...X', '.X........X.', '..X......X..', '...XXXXXX...'],
  star: ['.....XX.....', '.....XX.....', '....XXXX....', 'XXXXXXXXXXXX', '.XXXXXXXXXX.', '..XXXXXXXX..', '...XXXXXX...', '..XXXXXXXX..', '..XXX..XXX..', '.XXX....XXX.', '.XX......XX.', '............'],
  bolt: ['......XXXX..', '.....XXXX...', '....XXXX....', '...XXXX.....', '..XXXXXXXX..', '.....XXXX...', '....XXXX....', '...XXXX.....', '..XXX.......', '..XX........', '.XX.........', '............'],
};
const ART_COLORS = { heart: [239, 68, 112], smile: [245, 166, 35], star: [99, 102, 241], bolt: [20, 160, 120] };

function pct(x) { const v = x * 100; return v >= 9.5 || v === 0 ? `${Math.round(v)}%` : `${v.toFixed(1).replace(/\.0$/, '')}%`; }
function predictProbs(p, t) {
  const raw = p.words.map((w) => Math.pow(w[1] / 100, 1 / t));
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((x) => x / sum);
}
function fitError(m) { return FIT_PTS.reduce((a, [x, y]) => a + Math.abs(y - (m * x + FIT_BASE)), 0) / FIT_PTS.length; }
function nearestPoints(p, i, n = 2) {
  const a = p.points[i];
  return p.points.map((b, j) => [j, Math.hypot(a[1] - b[1], a[2] - b[2])]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, n).map(([j]) => j);
}
// Spreads each cluster out around its centre and fits everything in the box, so labels do not collide.
function mapLayout(p) {
  if (p._xy) return p._xy;
  const groups = {};
  p.points.forEach((pt) => { const g = groups[pt[3]] || (groups[pt[3]] = { x: 0, y: 0, n: 0 }); g.x += pt[1]; g.y += pt[2]; g.n++; });
  const raw = p.points.map((pt) => { const g = groups[pt[3]]; const cx = g.x / g.n, cy = g.y / g.n; return [cx + (pt[1] - cx) * 2, cy + (pt[2] - cy) * 2, pt[2] < cy]; });
  const xs = raw.map((r) => r[0]), ys = raw.map((r) => r[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  p._xy = raw.map((r) => ({ x: 13 + ((r[0] - x0) / (x1 - x0 || 1)) * 74, y: 15 + ((r[1] - y0) / (y1 - y0 || 1)) * 70, up: r[2] }));
  return p._xy;
}

const PLAYS = {
  predict: {
    init: () => ({ t: 1, picks: {}, n: 0, last: null }),
    html(p) {
      const probs = predictProbs(p, W.t);
      return `<p class="pw-prompt">${esc(p.prompt)} <span class="pw-slot${W.last !== null ? ' pop' : ''}">${W.last !== null ? esc(p.words[W.last][0]) : '?'}</span></p>
        <div class="pw-bars">${p.words.map((w, i) => `<div class="pw-row${W.last === i ? ' hit' : ''}"><span class="pw-word">${esc(w[0])}</span><span class="pw-track"><i style="--p:${Math.max(2, probs[i] * 100)}%"></i></span><span class="pw-pct">${pct(probs[i])}</span><span class="pw-n">${W.picks[i] ? '×' + W.picks[i] : ''}</span></div>`).join('')}</div>
        ${p.slider ? `<label class="slider"><span>Safe</span><input type="range" min="0.2" max="2.2" step="0.1" value="${W.t}" data-input="w-temp" aria-label="Creativity"><span>Wild</span></label>` : ''}
        <button class="btn soft wide" data-action="w-draw">${icon('dice')} Draw a word</button>
        <p class="play-note">${W.n ? `Drawn ${plural(W.n, 'time')}.${W.n >= 5 ? ' Likely words win most often, not every time.' : ''}` : 'Tap a few times and watch which word comes out.'}</p>`;
    },
  },
  tokens: {
    init: () => ({ stage: 0 }),
    html(p) {
      const st = W.stage;
      const piece = (t, i) => `<span class="tk tone-${i % 8}" style="animation-delay:${Math.min(i, 5) * 60}ms"><b>${esc(t).replace(/^ /, '<i>·</i>')}</b>${st === 2 ? `<small>${100 + (hashStr(t) % 49900)}</small>` : ''}</span>`;
      return `<div class="tk-text">${st === 0 ? `<span class="tk-whole">${esc(p.text)}</span>` : p.pieces.map(piece).join('')}</div>
        <button class="btn soft wide" data-action="w-step">${st === 0 ? 'Split it into pieces' : st === 1 ? 'Show the ID numbers' : 'Start again'}</button>
        <p class="play-note">${st === 0 ? 'This is what you typed.' : st === 1 ? `${p.pieces.length} pieces. A dot marks a space. The model only ever sees these.` : 'Each piece is swapped for a number, because numbers are all a model works with.'}</p>`;
    },
  },
  attention: {
    init: () => ({ set: 0, on: false }),
    html(p) {
      const s = p.sets[W.set];
      const top = s.weights.reduce((b, w, i) => (i !== s.focus && w > s.weights[b] ? i : b), s.focus === 0 ? 1 : 0);
      return `${p.sets.length > 1 ? `<div class="seg">${p.sets.map((_, i) => `<button class="${i === W.set ? 'on' : ''}" data-action="w-set" data-v="${i}">Sentence ${i + 1}</button>`).join('')}</div>` : ''}
        <p class="at-words">${s.words.map((w, i) => (i === s.focus
          ? `<button class="at-w focus${W.on ? ' lit' : ''}" data-action="w-focus">${esc(w)}</button>`
          : `<span class="at-w${W.on && i === top ? ' top' : ''}" style="--a:${W.on ? s.weights[i] : 0}">${esc(w)}</span>`)).join(' ')}</p>
        <p class="play-note">${W.on ? esc(s.note) : `Tap “${esc(s.words[s.focus])}” to see which words it leans on.`}</p>`;
    },
  },
  map: {
    init: () => ({ sel: null }),
    html(p) {
      const groups = [...new Set(p.points.map((pt) => pt[3]))];
      const near = W.sel !== null ? nearestPoints(p, W.sel) : [];
      const a = W.sel !== null ? p.points[W.sel] : null;
      const xy = mapLayout(p);
      return `<div class="mp"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${near.map((j) => `<line x1="${xy[W.sel].x}" y1="${xy[W.sel].y}" x2="${xy[j].x}" y2="${xy[j].y}"/>`).join('')}</svg>
        ${p.points.map((pt, i) => `<button class="mp-pt g${groups.indexOf(pt[3])}${xy[i].up ? ' up' : ''}${W.sel === i ? ' sel' : near.includes(i) ? ' near' : W.sel !== null ? ' far' : ''}" style="left:${xy[i].x}%;top:${xy[i].y}%" data-action="w-pt" data-v="${i}"><i></i><span>${esc(pt[0])}</span></button>`).join('')}</div>
        <p class="play-note">${a ? `Closest to “${esc(a[0])}”: ${near.map((j) => esc(p.points[j][0])).join(' and ')}.` : 'Tap a word to find its nearest neighbours.'}</p>`;
    },
  },
  compare: {
    init: () => ({ side: 'a', shown: {} }),
    html(p) {
      const s = p[W.side];
      return `<div class="seg">${['a', 'b'].map((k) => `<button class="${k === W.side ? 'on' : ''}" data-action="w-side" data-v="${k}">${esc(p[k].label)}</button>`).join('')}</div>
        <div class="bubble user"><small>Prompt</small>${esc(s.prompt)}</div>
        ${W.shown[W.side] ? `<div class="bubble bot enter"><small>What comes back</small>${esc(s.result)}</div>` : `<button class="btn soft wide" data-action="w-reveal">See what comes back</button>`}
        <p class="play-note">${W.shown.a && W.shown.b ? 'Same model, same job. The only difference is what was on the page.' : 'Try both prompts.'}</p>`;
    },
  },
  fit: {
    init: () => ({ m: 0.15, hit: false }),
    html(p) {
      return `<div class="fit-plot"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g id="fit-res"></g><line id="fit-line" x1="0" x2="100" y1="0" y2="0"/></svg>
        ${FIT_PTS.map(([x, y]) => `<i class="fit-dot" style="left:${x}%;bottom:${y}%"></i>`).join('')}<span class="fit-y">${esc(p.y)}</span><span class="fit-x">${esc(p.x)}</span></div>
        <label class="slider"><span>Flat</span><input type="range" min="0" max="1.7" step="0.01" value="${W.m}" data-input="w-fit" aria-label="Dial"><span>Steep</span></label>
        <div class="fit-err"><span>Error</span><span class="pw-track"><i id="fit-bar"></i></span></div>
        <p class="play-note" id="fit-note"></p>`;
    },
    draw: fitDraw,
  },
  denoise: {
    init: (p) => {
      const r = rng(hashStr(p.art));
      return { k: 0, noise: Array.from({ length: 144 * 3 }, () => Math.floor(r() * 256)) };
    },
    html: () => `<canvas class="dn-canvas" id="dn-canvas" width="240" height="240" aria-label="Picture"></canvas>
      <label class="slider"><span>Static</span><input type="range" min="0" max="10" step="1" value="${W.k}" data-input="w-noise" aria-label="Noise removed"><span>Picture</span></label>
      <p class="play-note" id="dn-note"></p>`,
    draw: denoiseDraw,
  },
  chat: {
    init: () => ({ n: 1 }),
    html(p) {
      const label = { system: 'System · hidden instructions', user: 'User · you', assistant: 'Assistant · the model' };
      return `<div class="chat">${p.turns.slice(0, W.n).map(([role, text], i) => `<div class="turn ${role}${i === W.n - 1 ? ' enter' : ''}"><small>${label[role]}</small>${esc(text)}</div>`).join('')}</div>
        ${W.n < p.turns.length ? `<button class="btn soft wide" data-action="w-step">Show the next turn</button>` : ''}
        <p class="play-note">${W.n < p.turns.length ? 'A chat is one long page with labels on it.' : 'The model reads the whole page, labels included, then writes the next turn.'}</p>`;
    },
  },
};

function playHtml(p) {
  const def = PLAYS[p.kind];
  if (!def) return '';
  try {
    W = { p, ...def.init(p) };
    return `<div class="play play-${p.kind}" id="play">${def.html(p)}</div>`;
  } catch (e) { W = null; return ''; }
}
function playInit(p) { const def = PLAYS[p.kind]; if (W && def && def.draw) def.draw(); }
function playRedraw() {
  const el = $('#play');
  if (!el || !W) return;
  const def = PLAYS[W.p.kind];
  el.innerHTML = def.html(W.p);
  if (def.draw) def.draw();
}
function fitDraw() {
  const line = $('#fit-line');
  if (!line || !W) return;
  const m = W.m;
  line.setAttribute('y1', 100 - FIT_BASE);
  line.setAttribute('y2', 100 - (m * 100 + FIT_BASE));
  $('#fit-res').innerHTML = FIT_PTS.map(([x, y]) => `<line x1="${x}" x2="${x}" y1="${100 - y}" y2="${100 - (m * x + FIT_BASE)}"/>`).join('');
  const err = fitError(m);
  const good = err < 3.4;
  const bar = $('#fit-bar');
  bar.style.setProperty('--p', `${clamp(err * 2.4, 3, 100)}%`);
  bar.parentNode.classList.toggle('good', good);
  $('#fit-note').textContent = good
    ? 'Snug. That is training in miniature: nudge the dial until the error is small.'
    : 'Drag the dial until the line runs through the dots and the error bar shrinks.';
  if (good && !W.hit) { W.hit = true; buzz('ok'); sound('good'); }
  if (!good) W.hit = false;
}
function denoiseDraw() {
  const cv = $('#dn-canvas');
  if (!cv || !W) return;
  const ctx = cv.getContext('2d');
  const art = ARTS[W.p.art] || ARTS.heart, fg = ART_COLORS[W.p.art] || ART_COLORS.heart, bg = [246, 244, 255];
  const k = W.k / 10, cell = cv.width / 12;
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const target = art[y][x] === 'X' ? fg : bg;
      const o = (y * 12 + x) * 3;
      const c = [0, 1, 2].map((j) => Math.round(W.noise[o + j] * (1 - k) + target[j] * k));
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
    }
  }
  $('#dn-note').textContent = W.k === 0 ? 'Pure static. Drag the slider to remove noise a step at a time.' : W.k < 10 ? `Step ${W.k} of 10. A picture is emerging from the noise.` : 'Done. Nothing was looked up: the picture was built out of static.';
}

// ---------- play actions ----------
function wDraw() {
  if (!W) return;
  const probs = predictProbs(W.p, W.t);
  let r = Math.random(), i = 0;
  while (i < probs.length - 1 && r > probs[i]) { r -= probs[i]; i++; }
  W.last = i; W.picks[i] = (W.picks[i] || 0) + 1; W.n++;
  sound('pop'); buzz('tick');
  playRedraw();
}
function wTemp(v) {
  if (!W) return;
  W.t = Number(v);
  const probs = predictProbs(W.p, W.t);
  $$('#play .pw-row').forEach((row, i) => {
    $('.pw-track i', row).style.setProperty('--p', `${Math.max(2, probs[i] * 100)}%`);
    $('.pw-pct', row).textContent = pct(probs[i]);
  });
}
function wStep() {
  if (!W) return;
  if (W.p.kind === 'tokens') W.stage = (W.stage + 1) % 3;
  else if (W.p.kind === 'chat') W.n = Math.min(W.p.turns.length, W.n + 1);
  sound('pop'); buzz('tick');
  playRedraw();
}
function wSet(key, v) {
  if (!W) return;
  if (key === 'set') { W.set = Number(v); W.on = false; }
  else if (key === 'focus') W.on = !W.on;
  else if (key === 'pt') W.sel = W.sel === Number(v) ? null : Number(v);
  else if (key === 'side') W.side = v;
  else if (key === 'reveal') W.shown[W.side] = true;
  sound('tap'); buzz('tick');
  playRedraw();
}
function wFit(v) { if (W) { W.m = Number(v); fitDraw(); } }
function wNoise(v) { if (W) { const k = Number(v); if (k !== W.k) buzz('tick'); W.k = k; denoiseDraw(); } }
