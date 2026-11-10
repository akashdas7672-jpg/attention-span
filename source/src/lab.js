// ---------- Lab: build a tiny language model on this device ----------
let LAB = null;
const LIVE = {};
const KINDS = {
  ngram: { name: 'Copycat', icon: 'chain', tone: 4, time: 'Instant', blurb: 'Counts which word tends to follow which, then writes by looking back a word or two. Quick, and it sounds like its source.' },
  nn: { name: 'Tiny Brain', icon: 'brain', tone: 0, time: 'Under a minute', blurb: 'A small neural network with thousands of dials. It starts out writing nonsense and learns letter by letter while you watch.' },
};
const TRAIN_STEPS = 3000;
const TRAIN_MORE = 2000;
const TRAIN_MAX = 15000;

function labReady() { return typeof LM === 'object' && LM && LM.ngram && LM.nn; }
function liveModel(m) {
  if (!LIVE[m.id]) {
    LIVE[m.id] = LM.unpack(m.packed);
    if (m.kind === 'nn' && m.text) LM.nn.attach(LIVE[m.id], m.text);
  }
  return LIVE[m.id];
}
function modelLine(m) {
  return m.kind === 'ngram'
    ? `Read ${num(m.stats.tokens)} words · looks back ${m.stats.n}`
    : `${num(m.stats.params)} dials · ${num(m.steps)} practice steps`;
}

function viewLab() {
  if (!labReady()) return `<header class="page-head"><h1>Lab</h1><p>The Lab is not bundled with this build.</p></header>`;
  const list = MODELS.map((m) => `<button class="model-row" data-action="lab-open" data-id="${m.id}"><span class="badge tone-${KINDS[m.kind].tone} on">${icon(KINDS[m.kind].icon)}</span>
    <span class="s-name"><b>${esc(m.name)}</b><small>${KINDS[m.kind].name} · ${esc(m.sourceTitle)}</small><small>${modelLine(m)}</small></span>${icon('right')}</button>`).join('');
  return `<header class="page-head"><h1>Lab</h1><p>Build a tiny AI that writes. It learns and runs right here on your phone.</p></header>
    <section class="hero tone-5 lab-hero"><span class="eyebrow">Make something real</span><h2>Build your own language model</h2>
      <ol class="lab-steps"><li><b>1</b>Feed it some text</li><li><b>2</b>Watch it learn</li><li><b>3</b>Keep it as a file</li></ol>
      <button class="btn ink wide" data-action="lab-new">${icon('plus')} New model</button><span class="hero-art">${icon('flask')}</span></section>
    <h3 class="sec">Your models</h3>
    ${list ? `<section class="card models">${list}</section>` : `<section class="card empty">${mascot('idle', 72)}<p>Nothing here yet. Your first model takes about two minutes.</p></section>`}
    <h3 class="sec">What is going on here?</h3>
    <section class="card prose"><p>The assistants you chat with are <b>large</b> language models: billions of dials, trained on a vast amount of text in data centres. What you build here is the same idea at pocket size, a model that learns from text and then predicts what comes next.</p>
      <p>It will not answer questions. It will babble in the style of whatever you fed it, and you will see exactly how it got there.</p></section>`;
}

// ---------- build flow ----------
function labOverlay(title, body, foot) {
  const el = $('#lab');
  el.hidden = false;
  document.documentElement.classList.add('locked');
  el.className = 'ss lab tone-5';
  el.innerHTML = `<header class="ss-top"><button class="icon-btn" data-action="lab-close" aria-label="Close">${icon('x')}</button><b class="ss-title">${esc(title)}</b><span class="ss-combo"></span></header>
    <main class="ss-body" id="lab-body">${body}</main><footer class="ss-foot" id="lab-foot">${foot}</footer>`;
}
function labClose() {
  if (LAB) { LAB.running = false; clearInterval(LAB.typer); }
  LAB = null;
  const el = $('#lab');
  el.hidden = true; el.innerHTML = '';
  document.documentElement.classList.remove('locked');
  closeSheet();
  render();
}
function labNew() {
  if (!labReady()) return;
  if (MODELS.length >= MAX_MODELS) { toast(`You can keep ${MAX_MODELS} models. Delete one to make room.`); return; }
  LAB = { step: 'feed', pack: PACKS[0] ? PACKS[0].id : 'own', own: '', kind: 'ngram', n: 2 };
  labRender();
}
function labText() {
  if (LAB.pack === 'own') return LM.clean(LAB.own).slice(0, LAB_TEXT_MAX);
  const p = PACKS.find((x) => x.id === LAB.pack);
  return p ? LM.clean(p.text) : '';
}
function labSourceTitle() { const p = PACKS.find((x) => x.id === LAB.pack); return p ? p.title : 'My own words'; }
function labRender() {
  const stepNo = { feed: 1, brain: 2, train: 3, name: 4 }[LAB.step];
  const head = `<span class="eyebrow">Step ${stepNo} of 4</span>`;
  if (LAB.step === 'feed') {
    const own = LAB.pack === 'own';
    const st = own ? LM.stats(LM.clean(LAB.own)) : null;
    labOverlay('New model', `<section class="s-q">${head}<h2 class="q-prompt">What should it learn from?</h2>
      <div class="opts">${PACKS.map((p) => `<button class="opt${LAB.pack === p.id ? ' sel' : ''}" data-action="lab-pack" data-v="${p.id}"><span class="opt-ic">${icon(p.icon)}</span><span><b>${esc(p.title)}</b><small>${esc(p.blurb)}</small></span></button>`).join('')}
        <button class="opt${own ? ' sel' : ''}" data-action="lab-pack" data-v="own"><span class="opt-ic">${icon('pencil')}</span><span><b>My own words</b><small>Paste captions, emails or notes you wrote</small></span></button></div>
      ${own ? `<textarea class="input" id="lab-own" rows="6" data-input="lab-own" placeholder="Paste at least a few paragraphs. More text makes a better model.">${esc(LAB.own)}</textarea>
        <p class="hint left" id="lab-count">${labCount(st)}</p><p class="hint left">${icon('shield')} Your text stays on this phone. Nothing is uploaded.</p>` : ''}</section>`,
    `<button class="btn primary wide" data-action="lab-next"${own && st.chars < 300 ? ' disabled' : ''} id="lab-go">Continue</button>`);
  } else if (LAB.step === 'brain') {
    labOverlay('New model', `<section class="s-q">${head}<h2 class="q-prompt">Pick a kind of brain</h2>
      <div class="opts">${Object.entries(KINDS).map(([k, v]) => `<button class="opt tall${LAB.kind === k ? ' sel' : ''}" data-action="lab-kind" data-v="${k}"><span class="opt-ic tone-${v.tone}">${icon(v.icon)}</span><span><b>${v.name} <em>${v.time}</em></b><small>${v.blurb}</small></span></button>`).join('')}</div>
      <p class="hint left">You can build both and compare them.</p></section>`,
    `<button class="btn primary wide" data-action="lab-next">${LAB.kind === 'nn' ? 'Start training' : 'Build it'}</button>`);
  } else if (LAB.step === 'train' && LAB.kind === 'ngram') {
    const m = LAB.model;
    labOverlay('New model', `<section class="s-q">${head}<h2 class="q-prompt">Copycat is ready</h2>
      <p class="s-text">It read every word once and noted what came next. To write, it looks back and picks a word that followed those words before.</p>
      <div class="tiles">${tile(num(m.tokens), 'words read')}${tile(num(m.vocab), 'different words')}${tile(num(m.patterns), 'patterns kept')}</div>
      <span class="eyebrow">How far back it looks</span>
      <div class="seg">${[1, 2, 3].map((n) => `<button class="${LAB.n === n ? 'on' : ''}" data-action="lab-n" data-v="${n}">${plural(n, 'word')}</button>`).join('')}</div>
      <div class="lab-out" id="lab-sample">${esc(LAB.sample)}</div>
      <p class="hint left">${LAB.n === 1 ? 'One word back: it rambles and loses the thread.' : LAB.n === 2 ? 'Two words back: phrases start to hold together.' : 'Three words back: fluent, but it mostly repeats what it read.'}</p></section>`,
    `<div class="foot-row"><button class="btn soft" data-action="lab-resample" aria-label="Another sample">${icon('refresh')}</button><button class="btn primary wide" data-action="lab-next">Looks good</button></div>`);
  } else if (LAB.step === 'train') {
    labOverlay('Training', `<section class="s-q">${head}<h2 class="q-prompt" id="lab-stage">Watch it learn</h2>
      <div class="tiles">${tile(num(LM.nn.paramCount(LAB.brain)), 'dials')}${tile(`<span id="lab-step">0</span>`, 'practice steps')}${tile(`<span id="lab-loss">–</span>`, 'error')}</div>
      <div class="chart"><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline id="lab-line" points=""/></svg><span>Error, lower is better</span></div>
      <span class="eyebrow">What it writes right now</span><div class="lab-out mono" id="lab-sample"></div>
      <p class="hint left" id="lab-note"></p></section>`, labTrainFoot());
    labTrainUi();
  } else if (LAB.step === 'name') {
    labOverlay('New model', `<form class="s-q" data-submit="lab-save">${head}<h2 class="q-prompt">Name your model</h2>
      <p class="s-text">${KINDS[LAB.kind].name}, trained on ${esc(labSourceTitle())}.</p>
      <input class="input big" id="lab-name" maxlength="24" value="${esc(LAB.name)}" placeholder="Give it a name">
      <p class="hint left">You can export it as a small web page and keep it or send it to someone.</p></form>`,
    `<button class="btn primary wide" data-action="lab-save">Save model</button>`);
  }
}
function labCount(st) { return `${num(st.chars)} characters · ${num(st.words)} words${st.chars < 300 ? ` · ${num(300 - st.chars)} more to go` : ''}`; }
function labOwnInput(v) {
  LAB.own = v;
  const st = LM.stats(LM.clean(v));
  $('#lab-count').textContent = labCount(st);
  $('#lab-go').disabled = st.chars < 300;
}
function labSample() {
  LAB.seed = (LAB.seed || 1) + 1;
  LAB.sample = LM.ngram.generate(LAB.model, '', { maxTokens: 28, temperature: 0.9, seed: LAB.seed }).text.trim();
}
function labNext() {
  if (!LAB) return;
  buzz('tick');
  if (LAB.step === 'feed') {
    if (labText().length < 300) { toast('It needs a little more text to learn from.'); return; }
    LAB.step = 'brain';
  } else if (LAB.step === 'brain') {
    const text = labText();
    LAB.step = 'train';
    if (LAB.kind === 'ngram') { LAB.model = LM.ngram.train(text, LAB.n); labSample(); sound('good'); }
    else {
      LAB.brain = LM.nn.create(text, { seed: (Date.now() % 9973) + 1 });
      Object.assign(LAB, { losses: [], loss: null, first: null, target: TRAIN_STEPS, running: true, lastPlot: 0, lastSample: -999, sample: '', t0: performance.now() + 60, s0: 0 });
      labRender();
      setTimeout(labTrainTick, 60);
      return;
    }
  } else if (LAB.step === 'train') {
    if (LAB.kind === 'nn') { LAB.running = false; if (LAB.brain.step < 200) { toast('Give it a few more seconds of practice.'); LAB.running = true; LAB.t0 = performance.now(); LAB.s0 = LAB.brain.step; setTimeout(labTrainTick, 0); return; } }
    LAB.step = 'name';
    LAB.name = LAB.name || `${labSourceTitle().split(/\s+/)[0].replace(/[^A-Za-z]/g, '')} ${LAB.kind === 'nn' ? 'Brain' : 'Copycat'}`;
  }
  labRender();
}
function labSetN(n) { LAB.n = n; LAB.model = LM.ngram.train(labText(), n); labSample(); buzz('tick'); labRender(); }

// ---------- Tiny Brain training loop ----------
function labTrainFoot() {
  const b = LAB.brain;
  if (LAB.running) return `<div class="foot-row"><button class="btn soft" data-action="lab-pause">Pause</button><button class="btn primary wide" data-action="lab-next"${b.step < 200 ? ' disabled' : ''} id="lab-done">Stop here and keep it</button></div>`;
  return `<div class="foot-row"><button class="btn soft" data-action="lab-more"${b.step >= TRAIN_MAX ? ' disabled' : ''}>${b.step >= LAB.target ? `Train ${num(TRAIN_MORE)} more` : 'Resume'}</button><button class="btn primary wide" data-action="lab-next">Keep it</button></div>`;
}
function labStageText(ratio) {
  if (ratio > 0.86) return ['Guessing at random', 'Right now every letter is a coin toss.'];
  if (ratio > 0.72) return ['Finding the common letters', 'It has noticed spaces and the letters that turn up most.'];
  if (ratio > 0.6) return ['Short words are forming', 'Letter pairs and little words are starting to stick.'];
  return ['Picking up the rhythm', 'Word shapes and line lengths now look like the source. It is still a tiny brain.'];
}
function labTrainUi() {
  const b = LAB.brain;
  if (!$('#lab-step')) return;
  $('#lab-step').textContent = num(b.step);
  $('#lab-loss').textContent = LAB.loss == null ? '–' : LAB.loss.toFixed(2);
  const ls = LAB.losses;
  if (ls.length > 1) {
    const hi = Math.max(...ls), lo = Math.min(...ls) - 0.05;
    $('#lab-line').setAttribute('points', ls.map((v, i) => `${((i / (ls.length - 1)) * 100).toFixed(1)},${(38 - ((v - lo) / (hi - lo || 1)) * 34).toFixed(1)}`).join(' '));
  }
  const [title, note] = labStageText(LAB.first ? LAB.loss / LAB.first : 1);
  $('#lab-stage').textContent = LAB.running ? title : b.step >= LAB.target ? 'Training done' : 'Paused';
  // Once it stops, compare with text it never practised on: a big gap is overfitting, shown live.
  const gap = !LAB.running && LAB.unseen != null
    ? (LAB.unseen > LAB.loss * 2.5 + 0.4
      ? ` On lines it never practised on, its error is ${LAB.unseen.toFixed(2)}. It memorised the page more than it learned the pattern. More text closes that gap.`
      : ` On lines it never practised on, its error is ${LAB.unseen.toFixed(2)}, almost as good. It learned the pattern, not just the page.`) : '';
  $('#lab-note').textContent = note + gap;
  $('#lab-sample').textContent = LAB.sample || '…';
  const done = $('#lab-done');
  if (done) done.disabled = b.step < 200;
}
function labTrainTick() {
  if (!LAB || !LAB.running || LAB.step !== 'train') return;
  const b = LAB.brain;
  const t0 = performance.now();
  let sum = 0, n = 0;
  // At most about 250 steps a second, so the learning is slow enough to watch on a fast device.
  const allowed = LAB.s0 + (t0 - LAB.t0) * 0.25 + 8;
  while (performance.now() - t0 < 18 && b.step < LAB.target && b.step < allowed) { sum += LM.nn.train(b, 4); n++; }
  if (n) {
    const loss = sum / n;
    if (LAB.first == null) LAB.first = loss;
    LAB.loss = LAB.loss == null ? loss : LAB.loss * 0.92 + loss * 0.08;
    S.stats.trained += n * 4;
  }
  if (b.step - LAB.lastSample >= 250) { LAB.lastSample = b.step; LAB.sample = LM.nn.generate(b, '', { maxChars: 110, temperature: 0.8, seed: 11 }).text; }
  if (b.step - LAB.lastPlot >= 20) { LAB.lastPlot = b.step; LAB.losses.push(LAB.loss); labTrainUi(); }
  if (b.step >= LAB.target) {
    LAB.running = false;
    LAB.unseen = LM.nn.evalLoss(b);
    LAB.sample = LM.nn.generate(b, '', { maxChars: 110, temperature: 0.8, seed: 11 }).text;
    labTrainUi();
    $('#lab-foot').innerHTML = labTrainFoot();
    sound('done'); buzz('win'); save();
    return;
  }
  setTimeout(labTrainTick, 0);
}
function labPause() { if (!LAB) return; LAB.running = false; LAB.unseen = LM.nn.evalLoss(LAB.brain); labTrainUi(); $('#lab-foot').innerHTML = labTrainFoot(); save(); }
function labMore() {
  if (!LAB || LAB.running) return;
  if (LAB.brain.step >= LAB.target) LAB.target = Math.min(TRAIN_MAX, LAB.target + TRAIN_MORE);
  LAB.running = true;
  LAB.unseen = null;
  LAB.t0 = performance.now(); LAB.s0 = LAB.brain.step;
  $('#lab-foot').innerHTML = labTrainFoot();
  labTrainTick();
}

// ---------- saving, opening, exporting ----------
function labSave(name) {
  if (!LAB) return;
  const kind = LAB.kind, text = labText();
  const live = kind === 'ngram' ? LAB.model : LAB.brain;
  const m = {
    id: `m${Date.now().toString(36)}`, name: (name || LAB.name || 'My model').trim().slice(0, 24) || 'My model', kind,
    source: LAB.pack, sourceTitle: labSourceTitle(), made: dayKey(), packed: LM.pack(live), steps: kind === 'nn' ? live.step : 0,
    text: kind === 'nn' ? text : '',
    stats: kind === 'ngram' ? { tokens: live.tokens, vocab: live.vocab, patterns: live.patterns, n: live.n } : { params: LM.nn.paramCount(live), loss: LAB.loss },
  };
  MODELS.unshift(m);
  if (!saveModels()) { MODELS.shift(); toast('This phone is out of storage for the app. Delete a model and try again.'); return; }
  LIVE[m.id] = live;
  const firstEver = S.stats.models === 0;
  S.stats.models++;
  addPoints(firstEver ? 20 : 5);
  const fresh = checkBadges();
  save();
  LAB = null;
  labOpen(m.id);
  burstConfetti(); sound('level'); buzz('win');
  toast(fresh.length ? `Badge earned: ${fresh[0].title}` : `Saved. +${firstEver ? 20 : 5} points`);
}
function labOpen(id) {
  const m = MODELS.find((x) => x.id === id);
  if (!m || !labReady()) return;
  LAB = { step: 'view', id, temp: m.kind === 'nn' ? 0.8 : 1, prompt: '', out: '', next: [] };
  const k = KINDS[m.kind];
  labOverlay(m.name, `<section class="s-q"><div class="model-head"><span class="badge big tone-${k.tone} on">${icon(k.icon)}</span><div><h2 class="q-prompt">${esc(m.name)}</h2>
        <p class="meta">${k.name} · trained on ${esc(m.sourceTitle)}<br>${modelLine(m)}</p></div></div>
      <label class="field"><span class="eyebrow">Starting words (optional)</span><input class="input" id="lab-prompt" maxlength="60" placeholder="${m.kind === 'nn' ? 'Type a few letters' : 'Type a word or two'}" autocapitalize="off"></label>
      <label class="slider"><span>Safe</span><input type="range" min="0.3" max="1.6" step="0.1" value="${LAB.temp}" data-input="lab-temp" aria-label="Creativity"><span>Wild</span></label>
      <div class="lab-out big${m.kind === 'nn' ? ' mono' : ''}" id="lab-out" aria-live="polite"><span class="ph">Tap Generate and it will start writing.</span></div>
      <div id="lab-think"></div>
      <div class="model-actions"><button class="btn soft wide" data-action="lab-export">${icon('download')} Take it with you</button>
        <button class="btn ghost small" data-action="lab-share">${icon('share')} Share this line</button><button class="btn ghost small" data-action="lab-rename">${icon('pencil')} Rename</button><button class="btn ghost small" data-action="lab-delete">${icon('trash')} Delete</button></div></section>`,
  `<button class="btn primary wide" data-action="lab-gen">${icon('spark')} Generate</button>`);
}
function labGenerate() {
  if (!LAB || LAB.step !== 'view') return;
  const m = MODELS.find((x) => x.id === LAB.id);
  const live = liveModel(m);
  const prompt = ($('#lab-prompt').value || '').slice(0, 60);
  LAB.seed = (LAB.seed || Date.now() % 100000) + 1;
  const res = m.kind === 'ngram'
    ? LM.ngram.generate(live, prompt, { maxTokens: 48, temperature: LAB.temp, seed: LAB.seed })
    : LM.nn.generate(live, prompt, { maxChars: 220, temperature: LAB.temp, seed: LAB.seed });
  clearInterval(LAB.typer);
  const out = $('#lab-out');
  out.innerHTML = `<b>${esc(prompt)}</b><span id="lab-typed"></span><i class="caret"></i>`;
  const typed = $('#lab-typed');
  let i = 0;
  LAB.out = res.text;
  buzz('tap');
  const stepSize = m.kind === 'nn' ? 3 : 1;
  LAB.typer = setInterval(() => {
    if (!LAB || !typed.isConnected) return;
    typed.textContent += res.pieces.slice(i, i + stepSize).join('');
    i += stepSize;
    if (i >= res.pieces.length) {
      clearInterval(LAB.typer);
      out.querySelector('.caret').remove();
      const nxt = (m.kind === 'ngram' ? LM.ngram.next(live, res.text, LAB.temp) : LM.nn.next(live, res.text, LAB.temp)).slice(0, 4);
      $('#lab-think').innerHTML = `<span class="eyebrow">What it would write next</span><div class="pw-bars">${nxt.map((x) => `<div class="pw-row"><span class="pw-word">${esc(x.token === '\n' ? '↵ new line' : x.token === ' ' ? '␣ space' : x.token)}</span><span class="pw-track"><i style="width:${Math.max(2, x.p * 100)}%"></i></span><span class="pw-pct">${pct(x.p)}</span></div>`).join('')}</div>`;
    }
  }, REDUCED_MOTION ? 1 : m.kind === 'nn' ? 22 : 70);
}
async function labExport() {
  const m = MODELS.find((x) => x.id === LAB.id);
  if (!m) return;
  const html = LM.exportHtml(m.packed, { name: m.name, madeBy: S.name.trim(), trainedOn: m.sourceTitle, date: m.made });
  const file = `${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-model'}.html`;
  const out = await saveFile(file, 'text/html', html);
  if (out === 'cancelled') return;
  S.stats.exports++;
  const fresh = checkBadges();
  save();
  toast(fresh.length ? `Badge earned: ${fresh[0].title}` : out === 'shared' ? 'Sent. It opens in any browser, even offline.' : `Saved as ${file}. It opens in any browser, even offline.`, 3600);
}
async function labShare() {
  const m = MODELS.find((x) => x.id === LAB.id);
  if (!LAB.out) { toast('Generate something first.'); return; }
  const out = await shareText(`My model “${m.name}” wrote this on my phone:\n\n${LAB.out.trim()}\n\nBuilt in the Attention Span Lab · ${appUrl()}`);
  if (out === 'copied') toast('Copied. Paste it in your team chat.');
  if (out === 'shared' || out === 'copied') { S.stats.shares++; checkBadges(); save(); }
}
function labRename() {
  const m = MODELS.find((x) => x.id === LAB.id);
  openSheet(`<form class="sheet-pad" data-submit="lab-rename"><h3>Rename model</h3><input class="input" id="lab-rename" maxlength="24" value="${esc(m.name)}"><button class="btn primary wide" type="submit">Save</button></form>`);
}
function labDelete() {
  const m = MODELS.find((x) => x.id === LAB.id);
  openSheet(`<div class="sheet-pad center">${mascot('sad', 84)}<h3>Delete “${esc(m.name)}”?</h3><p>The model is removed from this phone. Files you already exported are not affected.</p>
    <button class="btn bad wide" data-action="lab-delete-confirm">Delete model</button><button class="btn ghost wide" data-action="close-sheet">Keep it</button></div>`);
}
function labDeleteConfirm() {
  const i = MODELS.findIndex((x) => x.id === LAB.id);
  if (i >= 0) { delete LIVE[MODELS[i].id]; MODELS.splice(i, 1); saveModels(); }
  labClose();
  toast('Model deleted.');
}
