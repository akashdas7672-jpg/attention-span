// ---------- sessions: teach a card, then check it ----------
let L = null;
let closeTimer = 0;
let swapToken = 0;
const PRAISE = ['Nice.', 'Exactly.', 'Sharp.', 'You got it.', 'Spot on.', 'Yes.', 'Nailed it.'];
const Q_LABEL = { mcq: 'Quick check', cloze: 'Fill the gap', order: 'Put in order', match: 'Match the pairs', sort: 'Sort them' };

function openSession(l, resume) {
  L = Object.assign({
    i: 0, retry: [], results: [], combo: 0, bestCombo: 0, shownCombo: 0, q: null, answered: false, busy: false, panes: null, pi: 0,
    base: l.steps.length, cardTotal: l.steps.filter((s) => s.type === 'card').length, startedAt: Date.now(),
  }, l);
  if (resume) {
    L.results = resume.results.slice();
    L.combo = resume.combo; L.bestCombo = resume.bestCombo;
    L.retry = resume.retry.filter((n) => L.steps[n] && L.steps[n].type !== 'card').map((n) => ({ ...L.steps[n], retrying: true, src: n }));
    L.i = clamp(resume.i, 0, L.base);
    // Everything was answered before leaving and nothing needs a second look: go straight to the results.
    if (L.i >= L.base && !enterRetries()) L.allDone = true;
  }
  closeSheet();
  clearTimeout(closeTimer);
  document.documentElement.classList.add('locked');
  const el = $('#session');
  el.hidden = false;
  el.className = `ss tone-${L.tone ?? 0}`;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', L.title);
  el.innerHTML = `<header class="ss-top"><button class="icon-btn" data-action="ss-quit" aria-label="Leave">${icon('x')}</button>
    <div class="ss-bar" id="ss-bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100"><i id="ss-fill"></i></div><div class="ss-combo" id="ss-combo"></div></header>
    <main class="ss-body" id="ss-body"></main><footer class="ss-foot" id="ss-foot"></footer>`;
  audio();
  syncInert();
  if (L.allDone) { L.i = L.base; finishSession(); return; }
  renderStep();
  setCombo();
}
function closeSession() {
  L = null;
  W = null;
  const el = $('#session');
  document.documentElement.classList.remove('locked');
  render();
  const hide = () => { el.hidden = true; el.innerHTML = ''; el.classList.remove('closing'); syncInert(); };
  clearTimeout(closeTimer);
  if (REDUCED_MOTION) hide();
  else { el.classList.add('closing'); closeTimer = setTimeout(hide, 200); syncInert(); }
  focusOn($('#view h1'));
}

function startSession(id) {
  const s = SESSIONS[id];
  if (!s) return;
  if (!sessionUnlocked(s)) { toast('Finish the session before this one first.'); return; }
  const r = S.resume && S.resume.id === id && S.resume.n === s.steps.length ? S.resume : null;
  openSession({ mode: 'learn', session: s, title: s.title, tone: s.chapter.tone, steps: s.steps.slice() }, r);
  if (r && r.i > 0 && L && !L.panes) toast('Picked up where you left off.', 1800);
}
function startDrop() {
  if (dropResult()) { openDropSheet(); return; }
  const qs = dropQuestions();
  if (!qs.length) { toast('No Daily Drop is bundled with this build.'); return; }
  openSession({ mode: 'drop', title: `Daily Drop #${dropNumber()}`, tone: 3, steps: qs });
}
function startWarmup() {
  const keys = dueKeys().slice(0, 5);
  if (keys.length < 3) { toast('Nothing to refresh yet. Finish a session first.'); return; }
  openSession({ mode: 'warmup', title: 'Warm-up', tone: 4, steps: shuffle(keys.map((k) => QUESTIONS[k])) });
}
function startTest(chapterId) {
  const ch = TRACKS.flatMap((t) => t.chapters).find((c) => c.id === chapterId);
  if (!ch) return;
  const qs = ch.sessions.map((s) => shuffle(s.qs)[0]).filter(Boolean).slice(0, 6);
  openSession({ mode: 'test', chapter: ch, title: `${ch.title}: test`, tone: ch.tone, steps: shuffle(qs) });
}
// Keeps the place in a session so that leaving half way loses nothing.
function saveResume(at) {
  if (!L || L.mode !== 'learn' || L.panes) return;
  const inRetry = L.steps.length > L.base;
  S.resume = {
    id: L.session.id, n: L.base, i: Math.min(at, L.base), results: L.results.slice(), combo: L.combo, bestCombo: L.bestCombo,
    retry: (inRetry ? L.steps.slice(L.base + 1) : L.retry).map((st) => st.src).filter((n) => typeof n === 'number'),
  };
  save();
}
// Questions missed the first time come back once at the end.
function enterRetries() {
  if (!L.retry.length) return false;
  const n = L.retry.length;
  L.steps = L.steps.concat([{ type: 'card', interlude: true, title: n === 1 ? 'One to revisit' : `${n} to revisit`, body: 'Here they are again while they are fresh. Getting it right the second time is how it sticks.' }], L.retry);
  L.retry = [];
  return true;
}

// ---------- step rendering ----------
function setProgress() {
  if (!L) return;
  const pending = L.retry.length ? L.retry.length + 1 : 0;
  const frac = L.panes ? 1 : (L.i + (L.answered ? 1 : 0)) / (L.steps.length + pending);
  const f = $('#ss-fill');
  if (f) f.style.setProperty('--p', `${Math.max(4, Math.min(100, frac * 100))}%`);
  const barEl = $('#ss-bar');
  if (barEl) barEl.setAttribute('aria-valuenow', Math.round(Math.min(1, frac) * 100));
  const c = $('#ss-combo');
  if (c && (L.mode === 'drop' || L.mode === 'test')) {
    const n = L.steps.filter((s) => s.type !== 'card').length;
    c.innerHTML = `<span class="count-chip">${Math.min(L.results.length + (L.answered ? 0 : 1), n)}/${n}</span>`;
  }
}
// The run counter is redrawn, and so pops, only when its number changes.
function setCombo() {
  if (!L || L.mode === 'drop' || L.mode === 'test' || L.shownCombo === L.combo) return;
  const c = $('#ss-combo');
  if (!c) return;
  L.shownCombo = L.combo;
  c.innerHTML = L.combo >= 2 ? `<span class="combo-chip">${flameGlyph(true, 18)}${L.combo}</span>` : '';
}
// The outgoing step fades out briefly before the next one comes in.
function swapBody(build) {
  const body = $('#ss-body');
  const old = body.firstElementChild;
  const token = ++swapToken;
  const at = L;
  const run = () => { if (token !== swapToken || L !== at) return; body.scrollTop = 0; L.busy = false; build(body); };
  if (!old || REDUCED_MOTION) { run(); return; }
  L.busy = true;
  old.classList.add('leave');
  setTimeout(run, 100);
}
function renderStep() {
  const st = L.steps[L.i];
  L.answered = false; L.ok = null; W = null;
  swapBody((body) => {
    if (st.type === 'card') {
      const n = L.steps.slice(0, L.i + 1).filter((s) => s.type === 'card' && !s.interlude).length;
      const eyebrow = st.interlude ? 'Second look' : `Idea ${n} of ${L.cardTotal}`;
      body.innerHTML = `<article class="s-card enter"><span class="eyebrow">${eyebrow}</span><h2>${fmt(st.title)}</h2>
        <p class="s-text">${fmt(st.body)}</p>${st.code ? codeBlock(esc(st.code)) : ''}${st.play ? playHtml(st.play) : ''}</article>`;
      $('#ss-foot').innerHTML = `<button class="btn primary wide" data-action="ss-next">${st.interlude ? 'Go' : 'Got it'}</button>`;
      if (st.play) playInit(st.play);
    } else {
      L.q = prepareQuestion(st);
      body.innerHTML = `<section class="s-q enter" id="s-q"></section>`;
      refreshQ();
    }
    setProgress();
    focusOn($('h2', body));
  });
}
function codeBlock(html) { return `<pre class="code"><code>${html}</code></pre>`; }

function prepareQuestion(st) {
  const q = { type: st.type, misses: 0, sel: null };
  if (st.type === 'mcq' || st.type === 'cloze') q.order = shuffle(st.options.map((_, i) => i));
  else if (st.type === 'order') { q.list = shuffleMoved(st.items.map((_, i) => i)); q.pick = null; }
  else if (st.type === 'match') { q.left = shuffle(st.pairs.map((_, i) => i)); q.right = shuffleMoved(q.left); q.done = []; q.pickL = null; q.bad = null; q.fresh = null; }
  else if (st.type === 'sort') { q.items = shuffle(st.items.map((_, i) => i)); q.n = 0; q.counts = [0, 0]; q.busy = false; q.flash = null; q.hint = -1; }
  return q;
}
function tfLabels(st) { return st.labels || { true: 'True', false: 'False' }; }
function questionLabel(st) {
  if (st.retrying) return 'One more time';
  if (st.type === 'tf') { const l = tfLabels(st); return `${l.true} or ${l.false.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())}?`; }
  return Q_LABEL[st.type] || 'Question';
}
function gapHtml(st, q) {
  const filled = q.sel !== null;
  const state = L.answered ? (L.ok ? ' right' : ' wrong') : '';
  return `<span class="gap${filled ? ' filled' : ''}${state}" id="q-gap" data-action="q-gap" role="button" tabindex="0" aria-label="${filled ? `Gap, filled with ${esc(st.options[q.sel])}. Press to clear it` : 'Gap, empty'}">${filled ? esc(st.options[q.sel]) : '&nbsp;'}</span>`;
}
function questionHtml(st, q) {
  const done = L.answered;
  let prompt = fmt(st.prompt), code = st.code ? esc(st.code) : '', area = '';
  if (st.type === 'mcq') {
    const verdict = (i) => (done && i === st.answer ? '<span class="sr-only">Correct answer: </span>' : done && i === q.sel ? '<span class="sr-only">Your answer, not right: </span>' : '');
    area = `<div class="opts" role="radiogroup" aria-label="${esc(plain(st.prompt))}">${q.order.map((i) => {
      const cls = done ? (i === st.answer ? ' right' : i === q.sel ? ' wrong' : ' dim') : (i === q.sel ? ' sel' : '');
      const tab = (q.sel === null ? i === q.order[0] : i === q.sel) ? 0 : -1;
      return `<button class="opt${cls}" role="radio" aria-checked="${i === q.sel}" tabindex="${tab}" data-action="q-pick" data-v="${i}"${done ? ' disabled' : ''}><span class="opt-dot">${done && i === st.answer ? icon('check') : done && i === q.sel ? icon('x') : ''}</span><span>${verdict(i)}${fmt(st.options[i])}</span></button>`;
    }).join('')}</div>`;
  } else if (st.type === 'tf') {
    const lab = tfLabels(st);
    area = `<div class="tf">${[true, false].map((v) => {
      const cls = done ? (v === st.answer ? ' right' : v === q.sel ? ' wrong' : ' dim') : '';
      const said = done && v === st.answer ? '<span class="sr-only">Correct answer: </span>' : done && v === q.sel ? '<span class="sr-only">Your answer, not right: </span>' : '';
      return `<button class="tf-btn${cls}" data-action="q-tf" data-v="${v ? 1 : 0}"${done ? ' disabled' : ''}>${said}${esc(lab[v])}</button>`;
    }).join('')}</div>`;
  } else if (st.type === 'cloze') {
    const gap = gapHtml(st, q);
    if (code.includes('___')) code = code.replace('___', gap); else prompt = prompt.replace('___', gap);
    area = `<div class="chips">${q.order.map((i) => {
      const cls = done ? (i === st.answer ? ' right' : ' dim') : (i === q.sel ? ' used' : '');
      return `<button class="chip${cls}" aria-pressed="${i === q.sel}" data-action="q-pick" data-drag="chip" data-v="${i}"${done ? ' disabled' : ''}>${esc(st.options[i])}</button>`;
    }).join('')}</div>`;
  } else if (st.type === 'order') {
    area = `<ol class="rows" id="q-rows">${q.list.map((it, pos) => `<li class="row${q.pick === pos ? ' sel' : ''}${done ? ' right' : ''}" ${done ? '' : `data-drag="order" data-action="q-row" role="button" tabindex="0" aria-pressed="${q.pick === pos}" aria-label="${esc(plain(st.items[it]))}, position ${pos + 1} of ${q.list.length}"`} data-pos="${pos}"><span class="row-n">${pos + 1}</span><span class="row-t">${fmt(st.items[it])}</span>${done ? '' : `<span class="row-grip">${icon('grip')}</span>`}</li>`).join('')}</ol>
      ${done && !L.ok ? '<p class="q-note">This is the right order.</p>' : ''}`;
  } else if (st.type === 'match') {
    const item = (i, side) => {
      const k = q.done.indexOf(i);
      const cls = k >= 0 ? ` done tone-${k % 8}${q.fresh === i ? ' fresh' : ''}` : (side === 'l' && q.pickL === i ? ' sel' : '') + (q.bad && q.bad[side] === i ? ' shake' : '');
      return `<button class="m-item${cls}"${side === 'l' ? ` aria-pressed="${q.pickL === i}"` : ''} data-action="q-match" data-side="${side}" data-v="${i}"${k >= 0 ? ' disabled' : ''}>${fmt(st.pairs[i][side === 'l' ? 0 : 1])}</button>`;
    };
    area = `<div class="match"><div class="m-col">${q.left.map((i) => item(i, 'l')).join('')}</div><div class="m-col">${q.right.map((i) => item(i, 'r')).join('')}</div></div>`;
  } else if (st.type === 'sort') {
    if (done) {
      area = `<div class="sort-review">${st.buckets.map((b, bi) => `<div class="sr-col b${bi}"><h4>${esc(b)}</h4>${st.items.filter((it) => it[1] === bi).map((it) => `<p>${fmt(it[0])}</p>`).join('')}</div>`).join('')}</div>`;
    } else {
      const cur = st.items[q.items[q.n]];
      area = `<div class="sort"><div class="sort-stage"><div class="sort-card${q.flash ? ' ' + q.flash : ''}" id="sort-card" data-drag="sort">${fmt(cur[0])}${q.note ? `<small>${esc(q.note)}</small>` : ''}</div></div>
        <p class="sort-left">${q.n + 1} of ${q.items.length}</p>
        <div class="buckets">${st.buckets.map((b, bi) => `<button class="bucket b${bi}${q.hint === bi ? ' hint' : ''}" aria-label="Put in ${esc(b)}. ${q.counts[bi]} so far" data-action="q-sort" data-v="${bi}">${bi === 0 ? icon('left') : ''}<b>${esc(b)}</b><span>${q.counts[bi]}</span>${bi === 1 ? icon('right') : ''}</button>`).join('')}</div></div>`;
    }
  }
  return `<span class="eyebrow">${questionLabel(st)}</span><h2 class="q-prompt">${prompt}</h2>${code ? codeBlock(code) : ''}${area}`;
}
function footHtml(st, q) {
  if (L.answered) {
    const ok = L.ok;
    const title = ok ? PRAISE[(L.results.length + L.i) % PRAISE.length] : st.retrying ? 'Here is the answer' : 'Not quite';
    let ans = '';
    if (!ok && (st.type === 'mcq' || st.type === 'cloze')) ans = `<p class="fb-ans">Answer: ${fmt(st.options[st.answer])}</p>`;
    if (!ok && st.type === 'tf') ans = `<p class="fb-ans">Answer: ${esc(tfLabels(st)[st.answer])}</p>`;
    return `<div class="fb ${ok ? 'good' : 'bad'}"><div class="fb-head">${icon(ok ? 'check' : 'x')}<strong>${title}</strong></div>${ans}<p>${fmt(st.explain || '')}</p>
      <button class="btn ${ok ? 'good' : 'bad'} wide" data-action="ss-next">Continue</button></div>`;
  }
  if (st.type === 'mcq') return `<button class="btn primary wide" data-action="q-check"${q.sel === null ? ' disabled' : ''}>Check</button>`;
  if (st.type === 'cloze') return `<button class="btn primary wide" data-action="q-check"${q.sel === null ? ' disabled' : ''}>Check</button><p class="hint">Drag a word into the gap, or tap it.</p>`;
  if (st.type === 'order') return `<button class="btn primary wide" data-action="q-check">Check</button><p class="hint">Drag to reorder. Or tap one, then tap where it goes.</p>`;
  if (st.type === 'match') return `<p class="hint">Tap an item on the left, then its match on the right.</p>`;
  if (st.type === 'sort') return `<p class="hint">Swipe the card to a side, or tap a side.</p>`;
  return `<p class="hint">Tap your answer.</p>`;
}
// Redraws the question. When the keyboard focus was inside it, focus goes back to `focusSel` so the place is not lost.
function refreshQ(focusSel) {
  const st = L.steps[L.i];
  const el = $('#s-q'), foot = $('#ss-foot');
  const a = document.activeElement;
  const had = !!focusSel && !!a && ((el && el.contains(a)) || foot.contains(a));
  if (el) el.innerHTML = questionHtml(st, L.q);
  foot.innerHTML = footHtml(st, L.q);
  if (had) { const t = $(focusSel, $('#session')); if (t) t.focus({ preventScroll: true }); }
}

// ---------- answering ----------
function qPick(v) {
  if (!L || L.answered || L.busy) return;
  const q = L.q;
  q.sel = q.type === 'cloze' && q.sel === v ? null : v;
  sound('tap'); buzz('tick');
  refreshQ(`[data-action="q-pick"][data-v="${v}"]`);
}
// Arrow keys move through a multiple-choice group, selecting as they go.
function qPickKey(v, dir) {
  if (!L || L.answered || L.busy) return;
  const order = L.q.order, i = order.indexOf(v);
  if (i < 0) return;
  qPick(order[(i + dir + order.length) % order.length]);
}
function qGap() { if (L && !L.answered && L.q.sel !== null) { L.q.sel = null; say('Gap cleared.'); refreshQ('#q-gap'); } }
function qTf(v) { if (!L || L.answered || L.busy) return; L.q.sel = v; resolve(v === L.steps[L.i].answer); }
function qCheck() {
  if (!L || L.answered || L.busy) return;
  const st = L.steps[L.i], q = L.q;
  if (st.type === 'order') {
    const ok = q.list.every((it, pos) => it === pos);
    q.list = st.items.map((_, i) => i);
    resolve(ok);
  } else if (q.sel !== null) resolve(q.sel === st.answer);
}
// Tap fallback for reordering: tap a row, then tap the row where it should go.
function qRow(pos) {
  if (!L || L.answered) return;
  const st = L.steps[L.i], q = L.q;
  const name = (p) => plain(st.items[q.list[p]]);
  if (q.pick === null) { q.pick = pos; say(`Picked up ${name(pos)}. Use the arrow keys to move it, or choose where it goes.`); }
  else {
    if (q.pick !== pos) { const it = q.list.splice(q.pick, 1)[0]; q.list.splice(pos, 0, it); sound('pop'); }
    q.pick = null;
    say(`${name(pos)} is now at position ${pos + 1} of ${q.list.length}.`);
  }
  buzz('tick');
  refreshQ(`.row[data-pos="${pos}"]`);
}
// Arrow keys move a picked-up row, or move between rows when nothing is picked up.
function qRowKey(pos, dir) {
  if (!L || L.answered) return;
  const q = L.q, to = pos + dir;
  if (to < 0 || to >= q.list.length) return;
  if (q.pick !== pos) { const el = $(`.row[data-pos="${to}"]`); if (el) el.focus(); return; }
  const it = q.list.splice(pos, 1)[0];
  q.list.splice(to, 0, it);
  q.pick = to;
  sound('pop'); buzz('tick');
  say(`Position ${to + 1} of ${q.list.length}.`);
  refreshQ(`.row[data-pos="${to}"]`);
}
function qMatch(side, v) {
  if (!L || L.answered) return;
  const st = L.steps[L.i], q = L.q;
  q.bad = null; q.fresh = null;
  if (side === 'l') { q.pickL = q.pickL === v ? null : v; buzz('tick'); refreshQ(`.m-item[data-side="l"][data-v="${v}"]`); return; }
  if (q.pickL === null) { toast('Tap one on the left first.', 1400); return; }
  if (q.pickL === v) {
    q.done.push(v); q.fresh = v; q.pickL = null; sound('pop'); buzz('tick');
    if (q.done.length === st.pairs.length) { resolve(q.misses === 0); return; }
    say(`Matched: ${plain(st.pairs[v][0])} with ${plain(st.pairs[v][1])}.`);
    refreshQ('.m-item[data-side="l"]:not([disabled])');
    return;
  }
  const back = q.pickL;
  q.misses++; q.bad = { l: q.pickL, r: v }; q.pickL = null; sound('bad'); buzz('bad');
  say('Not a match. Try another.');
  refreshQ(`.m-item[data-side="l"][data-v="${back}"]`);
}
function qSort(b) {
  if (!L || L.answered || L.q.busy) return;
  const st = L.steps[L.i], q = L.q;
  const it = st.items[q.items[q.n]];
  const ok = it[1] === b;
  q.busy = true;
  if (!ok) q.misses++;
  q.counts[it[1]]++;
  q.flash = ok ? `fly${b}` : `nope fly${it[1]}`;
  q.note = ok ? '' : `Goes with: ${st.buckets[it[1]]}`;
  q.hint = ok ? -1 : it[1];
  sound(ok ? 'pop' : 'bad'); buzz(ok ? 'tick' : 'bad');
  refreshQ(`.bucket.b${b}`);
  setTimeout(() => {
    if (!L || L.q !== q) return;
    q.busy = false; q.flash = null; q.note = ''; q.hint = -1; q.n++;
    if (q.n >= q.items.length) { resolve(q.misses === 0); return; }
    say(`${ok ? '' : `That one goes with ${st.buckets[it[1]]}. `}Next, ${q.n + 1} of ${q.items.length}: ${plain(st.items[q.items[q.n]][0])}`);
    refreshQ(`.bucket.b${b}`);
  }, REDUCED_MOTION ? (ok ? 60 : 500) : (ok ? 300 : 900));
}
function resolve(ok) {
  const st = L.steps[L.i];
  const at = L;
  L.answered = true; L.ok = ok;
  if (!st.retrying) {
    L.results.push(ok);
    S.stats.answers++;
    if (ok) { S.stats.correct++; L.combo++; L.bestCombo = Math.max(L.bestCombo, L.combo); } else L.combo = 0;
    if (st.key && L.mode !== 'drop' && L.mode !== 'test') recordQ(st.key, ok);
    if (!ok && L.mode === 'learn') L.retry.push({ ...st, retrying: true, src: L.i });
  }
  sound(ok ? 'good' : 'bad'); buzz(ok ? 'ok' : 'bad');
  save();
  saveResume(L.i + 1);
  const verdict = ok ? 'Correct.' : st.type === 'mcq' || st.type === 'cloze' ? `Not quite. The answer is ${plain(st.options[st.answer])}.` : st.type === 'tf' ? `Not quite. The answer is ${tfLabels(st)[st.answer]}.` : st.type === 'order' ? 'Not quite. The right order is now shown.' : 'Not quite.';
  say(`${verdict} ${plain(st.explain || '')}`);
  refreshQ('[data-action="ss-next"]');
  // The bar and the run counter follow the answer by a beat.
  setTimeout(() => { if (L === at) setProgress(); }, REDUCED_MOTION ? 0 : 100);
  setTimeout(() => { if (L === at) setCombo(); }, REDUCED_MOTION ? 0 : 200);
  const fb = $('.fb');
  if (fb && fb.scrollIntoView) fb.scrollIntoView({ block: 'end', behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
}
function ssNext() {
  if (!L || L.busy) return;
  if (L.panes) { paneNext(); return; }
  const st = L.steps[L.i];
  if (st.type !== 'card' && !L.answered) return;
  buzz('tick');
  L.i++;
  if (L.i >= L.steps.length && !enterRetries()) { finishSession(); return; }
  saveResume(L.i);
  renderStep();
}
function ssQuit() {
  if (!L) return;
  if (L.panes || (L.i === 0 && !L.results.length)) { closeSession(); return; }
  const learn = L.mode === 'learn';
  openSheet(`<div class="sheet-pad center">${mascot(learn ? 'idle' : 'sad', 84)}<h3>${learn ? 'Leave for now?' : 'Leave this one?'}</h3>
    <p>${learn ? 'Your place is saved. You can pick up exactly where you left off.' : 'Your answers so far will not count.'}</p>
    <button class="btn primary wide" data-action="close-sheet">Keep going</button><button class="btn ghost wide" data-action="ss-leave">Leave</button></div>`);
}

// ---------- drag handlers (taps fall through to the click actions above) ----------
function dragOrder(e, el) {
  if (!L || L.answered) return;
  const q = L.q, list = $('#q-rows');
  const rows = $$('.row', list);
  const from = Number(el.dataset.pos);
  const rects = rows.map((r) => r.getBoundingClientRect());
  const gap = rects.length > 1 ? rects[1].top - rects[0].bottom : 0;
  const h = rects[from].height + gap;
  let to = from;
  dragStart(e, el, {
    start() { el.classList.add('dragging'); list.classList.add('sorting'); buzz('tap'); },
    move(dx, dy) {
      const y = clamp(dy, rects[0].top - rects[from].top - 10, rects[rects.length - 1].bottom - rects[from].bottom + 10);
      el.style.transform = `translateY(${y}px) scale(1.03)`;
      const mid = rects[from].top + rects[from].height / 2 + y;
      let t = from;
      rects.forEach((r, i) => {
        const m = r.top + r.height / 2;
        if (i < from && mid < m) t = Math.min(t, i);
        if (i > from && mid > m) t = Math.max(t, i);
      });
      if (t === to) return;
      to = t;
      buzz('tick');
      rows.forEach((r, i) => {
        if (i === from) return;
        const s = from < to && i > from && i <= to ? -h : from > to && i < from && i >= to ? h : 0;
        r.style.transform = s ? `translateY(${s}px)` : '';
      });
    },
    end(dx, dy, moved) {
      if (!moved) { el.classList.remove('dragging'); list.classList.remove('sorting'); el.style.transform = ''; return; }
      const it = q.list.splice(from, 1)[0];
      q.list.splice(to, 0, it);
      q.pick = null;
      sound('pop');
      say(`Moved to position ${to + 1} of ${q.list.length}.`);
      refreshQ();
    },
  });
}
function dragSort(e, el) {
  if (!L || L.answered || L.q.busy) return;
  const w = Math.min(innerWidth, 480);
  let side = -1;
  dragStart(e, el, {
    start() { el.classList.add('dragging'); },
    move(dx) {
      el.style.transform = REDUCED_MOTION ? `translateX(${dx}px)` : `translateX(${dx}px) rotate(${clamp(dx / 20, -8, 8)}deg)`;
      const s = dx < -w * 0.17 ? 0 : dx > w * 0.17 ? 1 : -1;
      if (s === side) return;
      side = s;
      if (s >= 0) buzz('tick');
      $$('.bucket').forEach((b, i) => b.classList.toggle('hot', i === s));
    },
    end(dx, dy, moved) {
      el.classList.remove('dragging');
      $$('.bucket').forEach((b) => b.classList.remove('hot'));
      if (moved && side >= 0) qSort(side); else el.style.transform = '';
    },
  });
}
function dragChip(e, el) {
  if (!L || L.answered) return;
  const gap = $('#q-gap');
  if (!gap) return;
  let over = false;
  dragStart(e, el, {
    start() { el.classList.add('dragging'); },
    move(dx, dy, ev) {
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
      const r = gap.getBoundingClientRect();
      const o = ev.clientX > r.left - 28 && ev.clientX < r.right + 28 && ev.clientY > r.top - 32 && ev.clientY < r.bottom + 32;
      if (o === over) return;
      over = o;
      gap.classList.toggle('hot', o);
      if (o) buzz('tick');
    },
    end(dx, dy, moved) {
      el.classList.remove('dragging'); el.style.transform = ''; gap.classList.remove('hot');
      if (moved && over) { L.q.sel = Number(el.dataset.v); sound('pop'); buzz('tap'); refreshQ(); }
    },
  });
}

// ---------- finishing ----------
function finishSession() {
  const total = L.results.length;
  const right = L.results.filter(Boolean).length;
  const misses = total - right;
  const r = { mode: L.mode, total, right, misses, pts: 0, stars: 0, steps: 0, combo: L.bestCombo };
  const d = today();
  if (L.mode === 'learn') {
    const s = L.session, prev = S.done[s.id];
    r.stars = misses === 0 ? 3 : misses <= 2 ? 2 : 1;
    r.first = !prev;
    r.pts = prev ? 3 + right + (r.stars > prev.stars ? 5 : 0) : 10 + 2 * right + (misses === 0 ? 5 : 0) + (L.bestCombo >= 3 ? Math.min(L.bestCombo, 6) : 0);
    r.steps = prev ? STEPS.replay : STEPS.session;
    if (r.stars === 3 && (!prev || prev.stars < 3)) S.stats.perfect++;
    S.done[s.id] = { stars: Math.max(r.stars, prev ? prev.stars : 0), n: (prev ? prev.n : 0) + 1, at: Date.now() };
    S.stats.sessions++; d.sessions++;
    if (s.chapter.track.id === 'builder' && !prev) S.stats.builder++;
    r.chapterDone = !prev && chapterStats(s.chapter).complete;
    if (S.resume && S.resume.id === s.id) S.resume = null;
  } else if (L.mode === 'drop') {
    r.pts = 2 * right + (misses === 0 ? 5 : 0);
    r.steps = STEPS.drop;
    S.drops[dayKey()] = L.results.map((x) => (x ? 1 : 0));
    const keys = Object.keys(S.drops).sort();
    while (keys.length > 60) delete S.drops[keys.shift()];
    S.stats.drops++; d.drop = true;
    if (misses === 0) S.stats.dropPerfect++;
  } else if (L.mode === 'warmup') {
    r.pts = 2 + right;
    r.steps = STEPS.warmup;
    S.stats.warmups++; d.warm = (d.warm || 0) + 1;
  } else if (L.mode === 'test') {
    r.pass = total > 0 && right / total >= 0.8;
    if (r.pass) {
      const fresh = L.chapter.sessions.filter((s) => !isDone(s.id));
      fresh.forEach((s) => { S.done[s.id] = { stars: 1, n: 0, at: Date.now(), tested: true }; });
      r.pts = 5 * fresh.length;
    }
    d.warm = (d.warm || 0) + 1;
  }
  S.steps += r.steps;
  r.surprise = L.mode === 'learn' || L.mode === 'drop' ? rollSurprise() : null;
  S.stats.bestCombo = Math.max(S.stats.bestCombo, L.bestCombo);
  const lv = addPoints(r.pts);
  r.leveled = lv.leveled; r.level = lv.level;
  r.streak = extendStreak();
  r.badges = checkBadges();
  applyTheme();
  save();
  L.result = r;
  L.panes = ['summary'];
  if (r.streak.extended) L.panes.push('streak');
  if (r.leveled) L.panes.push('level');
  if (r.badges.length) L.panes.push({ badges: r.badges });
  if (r.surprise) L.panes.push('surprise');
  if (L.mode === 'learn' && S.stats.sessions === 1 && IS_IOS && !isStandalone() && !inFrame() && !S.seen.install) L.panes.push('install');
  if (L.mode === 'learn' && !MODELS.length && labReady() && !S.seen.firstModel) L.panes.push('model');
  L.pi = 0;
  $('.ss-top').classList.add('done');
  setProgress();
  renderPane();
  sound('done'); buzz('win');
  if (r.stars === 3 || (L.mode === 'drop' && misses === 0) || r.pass) setTimeout(burstConfetti, REDUCED_MOTION ? 0 : 150);
}
function tile(value, label, cls = '') { return `<div class="r-tile ${cls}"><b>${value}</b><span>${label}</span></div>`; }
function dropSquares(res) { return res.map((x) => (x ? '🟩' : '🟥')).join(''); }
function dropGrid(res) { return `<div class="drop-grid">${res.map((x, i) => `<i class="${x ? 'y' : 'n'}" style="animation-delay:${200 + i * 90}ms">${icon(x ? 'check' : 'x')}</i>`).join('')}</div>`; }
function shareMessage() {
  const r = L && L.result;
  const streak = S.streak.count > 1 ? `\n🔥 ${S.streak.count}-day streak` : '';
  if (r && r.mode === 'learn') return `Attention Span · “${L.session.title}” ${'⭐'.repeat(r.stars)}${streak}\n${appUrl()}`;
  const res = dropResult();
  if (res) return `Attention Span · Daily Drop #${dropNumber()}\n${dropSquares(res)} ${res.filter(Boolean).length}/${res.length}${streak}\nSame five for everyone today: ${appUrl()}?go=drop`;
  return `I am getting AI-fluent four minutes a day with Attention Span.${streak}\n${appUrl()}`;
}
async function doShare() {
  const out = await shareText(shareMessage());
  if (out === 'cancelled' || out === 'failed') { if (out === 'failed') toast('Could not share from this browser.'); return; }
  S.stats.shares++;
  const fresh = checkBadges();
  save();
  toast(out === 'copied' ? 'Copied. Paste it in your team chat.' : fresh.length ? `Badge earned: ${fresh[0].title}` : 'Shared.');
}
function untilTomorrow() {
  const m = Math.ceil(msToMidnight() / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
// What the person's own model has to say, typed out last: the reward that is different every time.
function modelNote(r) {
  const m = mainModel();
  if (!m || !r.steps) return '';
  return `<div class="note model-line"><span class="eyebrow">${esc(m.name)} wrote</span><p id="ml-typed" data-line="${esc(modelLine(m))}"></p><small>+${num(r.steps)} practice steps banked for it</small></div>`;
}
function renderPane() {
  const p = L.panes[L.pi], r = L.result;
  const body = $('#ss-body');
  body.scrollTop = 0;
  let html = '', foot = `<button class="btn primary wide" data-action="ss-next">Continue</button>`;
  if (p === 'summary' && r.mode === 'learn') {
    const s = L.session;
    const head = r.stars === 3 ? 'Flawless.' : r.stars === 2 ? 'Nicely done.' : 'Done. That was a tough one.';
    html = `<div class="pane sum"><div class="big-stars">${[1, 2, 3].map((i) => `<span class="bs${i <= r.stars ? ' on' : ''}" style="animation-delay:${i * 150}ms">${starGlyph(i <= r.stars, 64)}</span>`).join('')}</div>
      <h2>${head}</h2><p class="pane-sub">${esc(s.title)}${r.chapterDone ? ` · chapter complete` : ''}</p>
      <div class="tiles">${tile(`+${countUp(r.pts)}`, 'points', 'gold')}${tile(`${r.right}/${r.total}`, 'first try')}${tile(`${r.combo}`, 'best run')}</div>
      ${s.takeaway ? `<div class="note remember"><span class="eyebrow">Remember</span><p>${fmt(s.takeaway)}</p></div>` : ''}
      ${s.tryit ? `<div class="note tryit"><span class="eyebrow">Try it today</span><p>${fmt(s.tryit)}</p></div>` : ''}
      ${s.lab ? `<a class="note lablink" href="${esc(labUrl(s))}" target="_blank" rel="noopener"><span class="eyebrow">Go hands-on</span><p>Open the matching DeepMind notebook in Colab ${icon('ext')}</p></a>` : ''}
      ${modelNote(r)}</div>`;
    foot = `<div class="foot-row"><button class="btn soft" data-action="share" aria-label="Share">${icon('share')}</button><button class="btn primary wide" data-action="ss-next">Continue</button></div>`;
  } else if (p === 'summary' && r.mode === 'drop') {
    html = `<div class="pane sum">${mascot(r.misses === 0 ? 'wow' : 'happy', 92)}<h2>${r.right} of ${r.total}</h2><p class="pane-sub">Daily Drop #${dropNumber()}</p>
      ${dropGrid(L.results)}<div class="tiles">${tile(`+${countUp(r.pts)}`, 'points', 'gold')}${tile(`+${r.steps}`, 'practice steps')}${tile(untilTomorrow(), 'to the next drop')}</div>
      <div class="note tryit"><span class="eyebrow">Same five for everyone</span><p>Share your grid and see how your team did. It gives nothing away.</p></div></div>`;
    foot = `<div class="foot-row"><button class="btn soft wide" data-action="share">${icon('share')} Share</button><button class="btn primary wide" data-action="ss-next">Continue</button></div>`;
  } else if (p === 'summary' && r.mode === 'warmup') {
    html = `<div class="pane sum">${mascot('happy', 92)}<h2>Warmed up.</h2><p class="pane-sub">Each right answer comes back later, each miss comes back sooner.</p>
      <div class="tiles">${tile(`+${countUp(r.pts)}`, 'points', 'gold')}${tile(`${r.right}/${r.total}`, 'right')}${tile(`+${r.steps}`, 'practice steps')}</div></div>`;
  } else if (p === 'summary') {
    html = r.pass
      ? `<div class="pane sum">${mascot('wow', 92)}<h2>Chapter cleared.</h2><p class="pane-sub">${r.right} of ${r.total}. Every session in “${esc(L.chapter.title)}” is marked done. Play any of them for stars.</p><div class="tiles">${tile(`+${countUp(r.pts)}`, 'points', 'gold')}</div></div>`
      : `<div class="pane sum">${mascot('idle', 92)}<h2>Not this time.</h2><p class="pane-sub">${r.right} of ${r.total}, and it takes 4 in 5 to skip. The sessions cover exactly this and take about four minutes each.</p></div>`;
  } else if (p === 'streak') {
    const start = weekStartIdx();
    html = `<div class="pane mid"><div class="big-flame">${flameGlyph(true, 120)}<b>${countUp(S.streak.count)}</b></div><h2>${S.streak.count === 1 ? 'Day one. Streak started.' : `${S.streak.count} days in a row.`}</h2>
      <div class="week">${[0, 1, 2, 3, 4, 5, 6].map((i) => weekDot(start + i)).join('')}</div>
      <p class="pane-sub">${r.streak.gotSaver ? 'You earned a streak saver. It covers one missed day automatically.' : 'One session or one Daily Drop each working day keeps it going. Weekends are free.'}</p></div>`;
  } else if (p === 'level') {
    const lv = levelOf();
    const th = THEMES.find((t) => t.level === lv.n);
    const unlocks = [th ? `The ${th.name} colour theme. Switch it on in Rewards.` : '', lv.n === BIG_BRAIN_LEVEL ? 'The Bigger Brain: a model with four times the dials. Build one in the Lab.' : ''].filter(Boolean);
    html = `<div class="pane mid"><div class="level-badge big"><small>Level</small><b>${lv.n}</b></div><h2>${esc(lv.title)}</h2>
      <p class="pane-sub">${lv.next ? `${lv.toGo} points to ${esc(lv.nextTitle)}.` : 'Top level. Full attention.'}</p>
      ${unlocks.map((u) => `<div class="note tryit"><span class="eyebrow">Unlocked</span><p>${esc(u)}</p></div>`).join('')}</div>`;
    sound('level');
  } else if (p === 'surprise') {
    const sp = r.surprise, m = mainModel();
    html = `<div class="pane mid"><div class="badge big tone-3 on">${icon('gift')}</div><span class="eyebrow">Surprise</span>
      ${sp.kind === 'pack'
        ? `<h2>A new text pack</h2><p class="pane-sub">“${esc(sp.pack.title)}”: ${esc(sp.pack.blurb.replace(/^./, (c) => c.toLowerCase()))}. It is waiting in the Lab for your next model.</p>`
        : `<h2>+${sp.n} practice steps</h2><p class="pane-sub">A bonus for ${m ? esc(m.name) : 'your first model'}. Spend them in the Lab to train it further.</p>`}</div>`;
    sound('star');
  } else if (p === 'install') {
    html = `<div class="pane mid">${mascot('happy', 92)}<h2>Put it on your Home Screen</h2>
      <p class="pane-sub">Best done now, before you build anything: the Home Screen app keeps its own progress. Tap Share ${icon('share')}, then “Add to Home Screen”.</p>
      <div class="note"><span class="eyebrow">Keep what you just earned</span><p>Copy your progress code, open the Home Screen app, and choose Restore on its first screen.</p>
        <button class="btn soft small" data-action="copy" data-v="${esc(exportCode())}">${icon('copy')} Copy my progress code</button></div></div>`;
    S.seen.install = 1; save();
  } else if (p === 'model') {
    html = `<div class="pane mid">${mascot('wow', 96)}<span class="eyebrow">Your turn</span><h2>Build your first AI model</h2>
      <p class="pane-sub">It takes about a minute, it runs on this phone, and it is yours to keep. Every session you finish earns it practice steps.</p></div>`;
    foot = `<button class="btn primary wide" data-action="first-model">${icon('flask')} Build it now</button><button class="btn ghost wide" data-action="ss-next">Not now</button>`;
    S.seen.firstModel = 1; save();
  } else if (p && p.badges) {
    const bs = p.badges;
    html = bs.length === 1
      ? `<div class="pane mid"><div class="badge big tone-${bs[0].tone} on">${icon(bs[0].icon)}</div><span class="eyebrow">Badge earned</span><h2>${esc(bs[0].title)}</h2><p class="pane-sub">${esc(bs[0].desc)}</p></div>`
      : `<div class="pane mid"><span class="eyebrow">${bs.length} badges earned</span><h2>Nice haul.</h2><div class="badge-row">${bs.map((b, i) => `<div class="badge-cell on" style="animation-delay:${200 + Math.min(i, 5) * 60}ms"><span class="badge tone-${b.tone} on">${icon(b.icon)}</span><b>${esc(b.title)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div></div>`;
    sound('star');
  }
  body.innerHTML = html;
  $('#ss-foot').innerHTML = foot;
  focusOn($('h2', body));
  if (p === 'summary' && r.total) say(`${r.right} of ${r.total} right first time. Plus ${r.pts} points.`);
  animateCounts(body, p === 'summary' ? 700 : 0);
  const ml = $('#ml-typed');
  if (ml) typeInto(ml, ml.dataset.line || '', 1100);
}
function weekDot(i) {
  const st = dayStatus(i), t = todayIdx();
  return `<div class="wd ${st}${i === t ? ' today' : ''}${i > t ? ' future' : ''}${isWeekend(i) ? ' rest' : ''}"><i>${st === 'done' ? icon('check') : st === 'saved' ? icon('shield') : ''}</i><span>${'MTWTFSS'[(idxToDate(i).getDay() + 6) % 7]}</span></div>`;
}
function paneNext() {
  buzz('tick');
  L.pi++;
  if (L.pi >= L.panes.length) { closeSession(); return; }
  renderPane();
}
function openDropSheet() {
  const res = dropResult();
  if (!res) return;
  openSheet(`<div class="sheet-pad center"><span class="eyebrow">Daily Drop #${dropNumber()}</span><h3>${res.filter(Boolean).length} of ${res.length} today</h3>${dropGrid(res)}
    <p>The next drop lands in ${untilTomorrow()}. Everyone gets the same five.</p>
    <button class="btn primary wide" data-action="share">${icon('share')} Share my grid</button><button class="btn ghost wide" data-action="close-sheet">Close</button></div>`);
}
