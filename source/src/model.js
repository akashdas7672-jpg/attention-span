// ---------- your model: what the daily loop builds up ----------
const REMIND_TIMES = [['08:45', 'With my first coffee'], ['12:30', 'Over lunch'], ['17:30', 'On the way home'], ['21:00', 'Winding down']];

function mainModel() { return MODELS.find((m) => m.id === S.mainModel) || MODELS[0] || null; }
// A fresh line from the person's own model. It differs every time, which is the point.
function modelLine(m = mainModel()) {
  if (!m || !labReady()) return '';
  try {
    const live = liveModel(m);
    const seed = Math.floor(Math.random() * 1e9);
    const raw = m.kind === 'ngram'
      ? LM.ngram.generate(live, '', { maxTokens: 40, temperature: 1, seed }).text
      : LM.nn.generate(live, '', { maxChars: 140, temperature: 0.8, seed }).text;
    const line = raw.split('\n').map((x) => x.trim()).filter((x) => x.length > 8)[0] || raw.trim();
    if (line.length <= 110 && /[.!?"]$/.test(line)) return line;
    // Prefer to stop at the end of a sentence; otherwise at a word, with an ellipsis.
    const head = line.slice(0, 110);
    const stop = Math.max(head.lastIndexOf('. '), head.lastIndexOf('? '), head.lastIndexOf('! '));
    if (stop > 24) return head.slice(0, stop + 1);
    if (line.length <= 110) return line;
    return `${head.slice(0, head.lastIndexOf(' ')).trimEnd()}…`;
  } catch (e) { return ''; }
}
function lockedPacks() { return PACKS.filter((p) => !S.packs.includes(p.id)); }
// Now and then a session ends with something extra. What it is, and how much, is not predictable.
function rollSurprise() {
  if (S.stats.sessions < 2 || Math.random() > 0.34) return null;
  S.stats.surprises++;
  const locked = lockedPacks();
  if (locked.length && Math.random() < 0.5) {
    const p = locked[Math.floor(Math.random() * locked.length)];
    S.packs.push(p.id);
    return { kind: 'pack', pack: p };
  }
  const n = [100, 150, 200, 300, 500][Math.floor(Math.random() * 5)];
  S.steps += n;
  return { kind: 'steps', n };
}
// Types text into an element piece by piece; all at once when motion is reduced.
function typeInto(el, text, delay = 0, gap = 28) {
  if (!el) return;
  if (REDUCED_MOTION) { el.textContent = text; return; }
  const parts = text.split(/(?<=\s)/);
  let i = 0;
  setTimeout(() => {
    const t = setInterval(() => {
      if (!el.isConnected || i >= parts.length) { clearInterval(t); return; }
      el.textContent += parts[i++];
    }, gap);
  }, delay);
}

// ---------- daily reminder: a calendar event, so it needs no server ----------
function reminderIcs(time) {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (now.getHours() * 60 + now.getMinutes() >= h * 60 + m ? 1 : 0));
  const day = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  const stamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Attention Span//EN', 'BEGIN:VEVENT',
    `UID:daily-${S.createdAt}@attention-span`, `DTSTAMP:${stamp}`, `DTSTART:${day(start)}T${pad2(h)}${pad2(m)}00`, 'DURATION:PT5M',
    'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'SUMMARY:Attention Span: four minutes',
    `DESCRIPTION:One session or one Daily Drop keeps your streak. ${appUrl()}`, `URL:${appUrl()}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Four minutes of Attention Span', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
function fmtTime(t) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad2(m)} ${h < 12 ? 'am' : 'pm'}`;
}
function openReminder() {
  openSheet(`<form class="sheet-pad" data-submit="remind-custom"><h3>When do you have four minutes?</h3>
    <p>Pick a moment that already happens every working day. Tying a new habit to an old one is what makes it stick.</p>
    <div class="opts">${REMIND_TIMES.map(([t, label]) => `<button type="button" class="opt${S.remind.time === t ? ' sel' : ''}" data-action="remind-pick" data-v="${t}"><span class="opt-ic">${icon('clock')}</span><span><b>${label}</b><small>${fmtTime(t)}, Monday to Friday</small></span></button>`).join('')}</div>
    <label class="field"><span class="eyebrow">Or pick your own time</span><input class="input" type="time" id="remind-time" value="${esc(S.remind.time || '09:00')}"></label>
    <button class="btn primary wide" type="submit">Add to my calendar</button>
    <p class="hint">This adds a repeating event to your calendar. Nothing is sent anywhere.</p></form>`);
}
async function setReminder(time) {
  if (!/^\d\d:\d\d$/.test(time)) { toast('Pick a time first.'); return; }
  const out = await saveFile('attention-span-reminder.ics', 'text/calendar', reminderIcs(time));
  if (out === 'cancelled') return;
  S.remind = { time, set: true };
  save();
  closeSheet();
  if (!L && !LAB) render();
  toast(out === 'shared' ? `Choose Calendar to add it. Weekdays at ${fmtTime(time)}.` : `Open the downloaded file to add it. Weekdays at ${fmtTime(time)}.`, 4200);
}

// ---------- ownership ladder ----------
function ladderRungs() {
  const has = (f) => MODELS.some(f);
  const lv = levelOf().n;
  return [
    { n: 1, title: 'Copycat', note: 'Copies patterns from its text. Built in a minute.', done: has((m) => m.kind === 'ngram'), action: 'lab-new' },
    { n: 2, title: 'Tiny Brain', note: 'A small neural network you train on this phone.', done: has((m) => m.kind === 'nn'), action: 'lab-new' },
    { n: 3, title: 'Bigger Brain', note: lv >= BIG_BRAIN_LEVEL ? 'Four times the dials and a longer memory. Still tiny.' : `Unlocks at level ${BIG_BRAIN_LEVEL}.`, done: has((m) => m.size === 'big'), locked: lv < BIG_BRAIN_LEVEL, action: 'lab-new' },
    { n: 4, title: 'A real model on your computer', note: 'An open model with billions of dials, running on your own machine.', done: S.ladder.run.every(Boolean), action: 'ladder-run' },
    { n: 5, title: 'Teach it your style', note: 'Adapt an open model with your own examples. Hands-on, in the Builder track.', done: false, action: 'ladder-adapt' },
  ];
}
function ladderHtml() {
  const rungs = ladderRungs();
  const next = rungs.find((r) => !r.done && !r.locked);
  return `<section class="card rungs">${rungs.map((r) => `<button class="rung${r.done ? ' done' : ''}${r.locked ? ' locked' : ''}${next && next.n === r.n ? ' next' : ''}" data-action="${r.locked ? 'ladder-locked' : r.action}">
      <span class="rung-n">${r.done ? icon('check') : r.locked ? icon('lock') : r.n}</span><span class="s-name"><b>${r.title}</b><small>${r.note}</small></span>${icon('right')}</button>`).join('')}
    <p class="hint left">Steps 1 to 3 are for understanding, and for the pride of making one. Step 4 is the one that can stand in for a paid assistant on small jobs.</p></section>`;
}
const RUN_STEPS = [
  ['Check first', 'Ask whether you may install software on your work machine, and which tools are approved. Check your company’s policy.'],
  ['Install a runner', 'A runner is an app that loads a model and gives you a chat window. Ollama and LM Studio are two widely used ones. Download only from the maker’s own site. Some runners also offer online extras; leave those off when privacy is the point.'],
  ['Download a small open model', 'Start with one of the smallest the runner suggests. Families you will see include Gemma, Llama, Mistral, Phi and Qwen. Read the licence before using it for client work.'],
  ['Compare it', 'Give it three real tasks you would give your usual assistant, and compare the answers side by side.'],
];
function openLadderRun() {
  openSheet(`<div class="sheet-pad"><span class="eyebrow chip-tone tone-2">Step 4 of the ladder</span><h3>Run a real model on your own computer</h3>
    <p>The models you build here have thousands of dials. Open models you can download have billions, and a recent laptop can run the smaller ones. What you type never leaves your machine, and there is no fee per message.</p>
    <div class="checks">${RUN_STEPS.map(([t, d], i) => `<label class="check"><input type="checkbox" data-change="ladder" data-v="${i}"${S.ladder.run[i] ? ' checked' : ''}><i>${icon('check')}</i><span><b>${t}</b><small>${d}</small></span></label>`).join('')}</div>
    <p><b>What to expect.</b> It will be slower and less capable than the big hosted assistants. Small models do well at rewriting, tidying notes, tagging and short summaries. They struggle with long documents, hard reasoning and fresh facts. Its answers still need checking.</p>
    <p class="hint left">The app cannot see your computer, so tick these off yourself.</p>
    <button class="btn primary wide" data-action="close-sheet">Done for now</button></div>`);
}
function tickLadder(i, on) {
  const was = S.ladder.run.every(Boolean);
  S.ladder.run[i] = on;
  const fresh = checkBadges();
  save();
  buzz('tick');
  if (!was && S.ladder.run.every(Boolean)) {
    closeSheet();
    burstConfetti(); sound('level'); buzz('win');
    openSheet(`<div class="sheet-pad center"><span class="badge big tone-2 on">${icon('chip')}</span><span class="eyebrow">Graduate</span><h3>You run your own AI.</h3>
      <p>A real model, on your own machine, answering to nobody else’s servers. You know how it reads, how it learns and where it goes wrong. That puts you ahead of most people who use these tools every day.</p>
      <button class="btn primary wide" data-action="close-sheet">Brilliant</button></div>`);
    if (!L && !LAB) render();
  } else if (fresh.length) toast(`Badge earned: ${fresh[0].title}`);
}
