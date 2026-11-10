// ---------- app shell ----------
const UI = { tab: 'today', track: null, open: {}, onboard: 0, feel: '', just: '', line: null, goDrop: false };
let sheetTimer = 0;
const TABS = [['today', 'Today', 'home'], ['journey', 'Journey', 'route'], ['lab', 'Lab', 'flask'], ['rewards', 'Rewards', 'gift'], ['me', 'Me', 'user']];

function isStandalone() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}
function inFrame() { try { return window.self !== window.top; } catch (e) { return true; } }

function render() {
  applyTheme();
  $('#tabbar').innerHTML = TABS.map(([id, label, ic]) => `<button class="tab${UI.tab === id ? ' on' : ''}" data-action="tab" data-v="${id}"${UI.tab === id ? ' aria-current="page"' : ''}><span class="tab-ic">${icon(ic)}</span><span>${label}</span></button>`).join('');
  const v = $('#view');
  v.className = `view view-${UI.tab}`;
  v.innerHTML = ({ today: viewToday, journey: viewJourney, lab: viewLab, rewards: viewRewards, me: viewMe }[UI.tab] || viewToday)();
}
function go(tab) {
  if (UI.tab === tab) { window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' }); return; }
  UI.tab = tab;
  render();
  window.scrollTo(0, 0);
  // Replay the short entrance on the new tab's content.
  const v = $('#view');
  v.classList.remove('tab-in');
  void v.offsetWidth;
  v.classList.add('tab-in');
}
function avatar(size = 44) {
  const inner = S.photo ? `<img src="${S.photo}" alt="">` : S.name.trim() ? `<b>${esc(S.name.trim()[0].toUpperCase())}</b>` : mascot('happy', Math.round(size * 0.86));
  return `<span class="avatar" style="--s:${size}px">${inner}</span>`;
}
function firstName() { return S.name.trim().split(/\s+/)[0] || ''; }
function bar(frac, cls = '') { return `<span class="bar ${cls}"><i style="--p:${Math.max(3, clamp(frac, 0, 1) * 100)}%"></i></span>`; }

// ---------- Today ----------
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
}
function heroHtml() {
  const s = nextSession();
  const t = trackOf(S.track);
  if (!s) {
    const other = S.track === 'fluency' ? 'builder' : 'fluency';
    return `<section class="hero tone-2"><span class="eyebrow">${esc(t.title)} complete</span><h2>You finished the whole track.</h2>
      <p>Replay any session for three stars, or switch to the ${esc(trackOf(other).title)} track.</p>
      <button class="btn ink wide" data-action="tab" data-v="journey">Open the Journey</button><span class="hero-art">${icon('trophy')}</span></section>`;
  }
  const ch = s.chapter;
  const cards = s.steps.filter((x) => x.type === 'card').length;
  const res = S.resume && S.resume.id === s.id && S.resume.n === s.steps.length && S.resume.i > 0 ? S.resume : null;
  return `<section class="hero tone-${ch.tone}"><span class="eyebrow">${res ? 'Pick up where you left off' : activeToday() ? 'Done for today. One more?' : 'Today’s session'}</span>
    <h2>${esc(s.title)}${s.part ? ` <small>part ${s.part}</small>` : ''}</h2>
    <p>${esc(s.goal || ch.title)}</p>
    <div class="hero-meta"><span>Chapter ${ch.index + 1} · ${s.index + 1} of ${ch.sessions.length}</span><span>${res ? `Step ${res.i + 1} of ${res.n}` : `${plural(cards, 'idea')} · about ${s.mins} min`}</span></div>
    <button class="btn ink wide${activeToday() ? '' : ' nudge'}" data-action="start" data-id="${s.id}">${icon('play')} ${res ? 'Resume' : 'Start'}</button><span class="hero-art">${icon(s.icon)}</span></section>`;
}
function viewToday() {
  const lv = levelOf();
  const start = weekStartIdx();
  const due = dueKeys().length;
  const drop = dropResult();
  const lit = streakAlive();
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const install = IS_IOS && !isStandalone() && !inFrame() && !S.seen.install
    ? `<section class="card tip"><div><b>Put it on your Home Screen</b><p>Tap ${icon('share')} Share, then “Add to Home Screen”. It opens full screen and works offline.</p></div><button class="icon-btn" data-action="seen" data-v="install" aria-label="Dismiss">${icon('x')}</button></section>` : '';
  return `<header class="hello"><button class="avatar-btn" data-action="tab" data-v="me" aria-label="Your profile">${avatar(50)}</button>
      <div class="hello-text"><small>${date}</small><h1>${greeting()}${firstName() ? `, ${esc(firstName())}` : ''}.</h1></div>
      <button class="stat-chip" data-action="streak-info" aria-label="Streak: ${plural(S.streak.count, 'day')}">${flameGlyph(lit, 22)}<b>${S.streak.count}</b></button></header>
    <section class="card week-card"><div class="week">${[0, 1, 2, 3, 4, 5, 6].map((i) => weekDot(start + i)).join('')}</div>
      <p>${activeToday() ? 'Today is done. See you tomorrow.' : S.streak.count > 0 && lit ? `Keep your ${plural(S.streak.count, 'day')} streak: one session or one Daily Drop.` : 'One session or one Daily Drop today starts a streak.'}</p></section>
    ${heroHtml()}
    ${modelCardHtml()}
    <div class="duo"><button class="tile tone-3${drop ? ' done' : ''}" data-action="drop"><span class="tile-ic">${icon('target')}</span><b>Daily Drop</b>
        ${drop ? `<span class="mini-grid">${drop.map((x) => `<i class="${x ? 'y' : 'n'}"></i>`).join('')}</span><small>${drop.filter(Boolean).length} of ${drop.length} · next in ${untilTomorrow()}</small>` : `<small>#${dropNumber()} · 5 questions, the same for everyone today</small>`}</button>
      <button class="tile tone-4${due < 3 ? ' quiet' : ''}" data-action="warmup"><span class="tile-ic">${icon('refresh')}</span><b>Warm-up</b>
        <small>${due >= 3 ? `${Math.min(due, 5)} quick ones to keep it fresh` : 'Nothing to refresh yet'}</small></button></div>
    <button class="card level-strip" data-action="tab" data-v="rewards"><span class="level-badge"><small>Level</small><b>${lv.n}</b></span>
      <span class="ls-text"><b>${esc(lv.title)}</b>${bar(lv.frac, 'gold')}<small>${lv.next ? `${lv.toGo} points to ${esc(lv.nextTitle)}` : `${num(S.points)} points`}</small></span>${icon('right')}</button>
    ${remindCardHtml()}
    ${install}`;
}
// The person's main model, with a fresh line from it. The line is kept for half a minute so it does not flicker.
function modelCardHtml() {
  if (!labReady()) return '';
  const m = mainModel();
  if (!m) {
    return S.stats.sessions < 1 ? '' : `<button class="card model-card empty-model" data-action="first-model"><span class="badge tone-5 on">${icon('flask')}</span><span class="s-name"><b>Build your first AI model</b><small>About a minute. It runs on this phone and it is yours to keep.</small></span>${icon('right')}</button>`;
  }
  const k = KINDS[kindKey(m)];
  if (!UI.line || UI.line.id !== m.id || Date.now() - UI.line.at > 30000) UI.line = { id: m.id, at: Date.now(), text: modelLine(m) };
  return `<button class="card model-card" data-action="lab-open" data-id="${m.id}"><span class="mc-head"><span class="badge tone-${k.tone} on">${icon(k.icon)}</span><span class="s-name"><b>${esc(m.name)}</b><small>${k.name} · ${num(S.steps)} practice steps banked</small></span>${icon('right')}</span>
    ${UI.line.text ? `<span class="mc-line">“${esc(UI.line.text)}”</span>` : ''}</button>`;
}
function remindCardHtml() {
  if (S.remind.set || S.seen.remind || S.stats.sessions < 1) return '';
  return `<section class="card tip"><div><b>When do you have four minutes?</b><p>Pick a moment and add a weekday reminder to your calendar.</p><button class="btn soft small" data-action="remind">${icon('clock')} Pick a time</button></div><button class="icon-btn" data-action="seen" data-v="remind" aria-label="Dismiss">${icon('x')}</button></section>`;
}

// ---------- Journey ----------
function viewJourney() {
  const t = trackOf(UI.track || S.track);
  if (!UI.open[t.id]) { const n = nextSession(t.id); UI.open[t.id] = n ? n.chapter.id : t.chapters[0].id; }
  const st = trackStats(t.id);
  const chapter = (ch) => {
    const cs = chapterStats(ch), unlocked = chapterUnlocked(ch), open = UI.open[t.id] === ch.id;
    const next = nextSession(t.id);
    const row = (s) => {
      const done = isDone(s.id), can = sessionUnlocked(s), cur = next && next.id === s.id;
      return `<button class="s-row${done ? ' done' : can ? '' : ' locked'}${cur ? ' cur' : ''}" data-action="session" data-id="${s.id}">
        <span class="s-ic">${done ? icon('check') : can ? icon(s.icon) : icon('lock')}</span>
        <span class="s-name"><b>${esc(s.title)}${s.part ? ` · part ${s.part}` : ''}</b><small>about ${s.mins} min</small></span>
        ${done ? stars(starsOf(s.id), 16) : cur ? '<span class="pill">Start</span>' : ''}</button>`;
    };
    const test = t.id === 'fluency' && unlocked && !cs.complete
      ? `<button class="btn ghost wide small" data-action="test" data-id="${ch.id}">Know this already? Take the 5-question test</button>` : '';
    return `<section class="chapter tone-${ch.tone}${open ? ' open' : ''}${open && UI.just === ch.id ? ' just' : ''}${unlocked ? '' : ' locked'}${cs.complete ? ' complete' : ''}">
      <button class="ch-head" data-action="chapter" data-id="${ch.id}" aria-expanded="${open}"><span class="ch-num">${unlocked ? ch.index + 1 : icon('lock')}</span>
        <span class="ch-title"><b>${esc(ch.title)}</b><small>${esc(ch.blurb || '')}</small></span>
        <span class="ch-prog">${cs.complete ? icon('check') : `${cs.done}/${cs.total}`}</span></button>
      ${open ? `<div class="ch-body">${unlocked ? '' : `<p class="ch-lock">Finish “${esc(t.chapters[ch.index - 1].title)}” to open this chapter.</p>`}${test}${ch.sessions.map(row).join('')}</div>` : ''}</section>`;
  };
  return `<header class="page-head"><h1>Journey</h1><p>${st.done} of ${st.total} sessions done</p></header>
    <div class="seg big">${TRACKS.map((x) => `<button class="${x.id === t.id ? 'on' : ''}" data-action="track" data-v="${x.id}">${esc(x.title)}</button>`).join('')}</div>
    <p class="track-note">${esc(t.note || '')}</p>
    ${t.chapters.map(chapter).join('')}`;
}
function openSessionSheet(id) {
  const s = SESSIONS[id];
  if (!s) return;
  if (!sessionUnlocked(s)) { toast(s.index === 0 ? 'Finish the chapter before this one first.' : `Finish “${s.chapter.sessions[s.index - 1].title}” first.`); buzz('bad'); return; }
  const done = isDone(s.id);
  const cards = s.steps.filter((x) => x.type === 'card').length;
  openSheet(`<div class="sheet-pad"><span class="eyebrow chip-tone tone-${s.chapter.tone}">Chapter ${s.chapter.index + 1} · session ${s.index + 1}</span>
    <h3>${esc(s.title)}${s.part ? ` · part ${s.part}` : ''}</h3>
    ${s.goal ? `<p><b>After this you can:</b> ${esc(s.goal.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase()))}.</p>` : ''}
    <p class="meta">${cards ? `${plural(cards, 'idea')} · ` : ''}${plural(s.qs.length, 'question')} · about ${s.mins} min${done ? ` · ${stars(starsOf(s.id), 16)}` : ''}</p>
    <button class="btn primary wide" data-action="start" data-id="${s.id}">${icon('play')} ${done ? 'Play again' : 'Start'}</button>
    ${s.lab ? `<a class="btn ghost wide" href="${esc(labUrl(s))}" target="_blank" rel="noopener">Open the notebook in Colab ${icon('ext')}</a>` : ''}</div>`);
}

// ---------- Rewards ----------
function viewRewards() {
  const lv = levelOf();
  const earned = BADGES.filter((b) => S.badges[b.id]).length;
  const prizes = (PROGRAM.prizes || []).map((p) => {
    const ok = S.points >= p.points;
    return `<div class="prize${ok ? ' ok' : ''}"><span class="prize-ic">${icon('gift')}</span><span class="prize-t"><b>${esc(p.title)}</b><small>${esc(p.detail || '')}</small>${ok ? '' : bar(S.points / p.points, 'gold')}<small>${ok ? 'Unlocked' : `${num(p.points - S.points)} points to go`}</small></span>
      ${ok ? `<button class="btn primary small" data-action="claim" data-id="${esc(p.id)}">${S.claimed[p.id] ? 'Code' : 'Claim'}</button>` : ''}</div>`;
  }).join('');
  return `<header class="page-head"><h1>Rewards</h1><p>${num(S.points)} points · ${earned} of ${BADGES.length} badges</p></header>
    <section class="card level-card"><span class="level-badge big"><small>Level</small><b>${lv.n}</b></span><h2>${esc(lv.title)}</h2>
      ${bar(lv.frac, 'gold tall')}<p>${lv.next ? `${lv.toGo} points to level ${lv.n + 1}, ${esc(lv.nextTitle)}` : 'Top level reached.'}</p>
      <div class="ladder">${LEVELS.map((l, i) => `<span class="${i + 1 <= lv.n ? 'on' : ''}${i + 1 === lv.n ? ' cur' : ''}" title="${esc(l.title)}">${i + 1}</span>`).join('')}</div></section>
    ${prizes ? `<h3 class="sec">${esc(PROGRAM.org ? `${PROGRAM.org} prizes` : 'Team prizes')}</h3><section class="card prizes">${prizes}</section>` : ''}
    <h3 class="sec">Colour themes</h3>
    <section class="card themes">${THEMES.map((t) => {
      const ok = themeUnlocked(t);
      return `<button class="theme th-${t.id}${S.theme === t.id ? ' on' : ''}${ok ? '' : ' locked'}" data-action="theme" data-v="${t.id}" aria-pressed="${S.theme === t.id}"><i>${ok ? (S.theme === t.id ? icon('check') : '') : icon('lock')}</i><span>${t.name}</span><small>${ok ? 'Unlocked' : `Level ${t.level}`}</small></button>`;
    }).join('')}</section>
    <h3 class="sec">Badges</h3>
    <section class="badges">${BADGES.map((b) => {
      const on = !!S.badges[b.id];
      const [have, need] = b.prog();
      return `<button class="badge-cell${on ? ' on' : ''}" data-action="badge" data-id="${b.id}"><span class="badge tone-${b.tone}${on ? ' on' : ''}">${icon(b.icon)}</span><b>${esc(b.title)}</b><small>${on ? 'Earned' : need > 1 ? `${num(Math.min(have, need))} / ${num(need)}` : 'Locked'}</small></button>`;
    }).join('')}</section>`;
}
function openBadge(id) {
  const b = BADGES.find((x) => x.id === id);
  if (!b) return;
  const on = !!S.badges[b.id];
  const [have, need] = b.prog();
  openSheet(`<div class="sheet-pad center"><span class="badge big tone-${b.tone}${on ? ' on' : ''}">${icon(b.icon)}</span><h3>${esc(b.title)}</h3><p>${esc(b.desc)}.</p>
    ${on ? `<p class="meta">Earned ${esc(S.badges[b.id])}</p>` : `${bar(have / need, 'gold tall')}<p class="meta">${num(Math.min(have, need))} of ${num(need)}</p>`}
    <button class="btn primary wide" data-action="close-sheet">Close</button></div>`);
}
function openClaim(id) {
  const p = (PROGRAM.prizes || []).find((x) => String(x.id) === String(id));
  if (!p || S.points < p.points) return;
  S.claimed[p.id] = S.claimed[p.id] || dayKey();
  save();
  openSheet(`<div class="sheet-pad center"><span class="badge big tone-3 on">${icon('gift')}</span><h3>${esc(p.title)}</h3>
    <p>Show or send this code to ${esc(PROGRAM.contact || 'whoever runs the programme')} to collect it.</p><p class="code-box">${prizeCode(p)}</p>
    <button class="btn primary wide" data-action="copy" data-v="${prizeCode(p)}">${icon('copy')} Copy code</button><button class="btn ghost wide" data-action="close-sheet">Close</button></div>`);
}

// ---------- Me ----------
function viewMe() {
  const lv = levelOf();
  const acc = S.stats.answers ? Math.round((S.stats.correct / S.stats.answers) * 100) : 0;
  const starSum = Object.values(S.done).reduce((n, d) => n + (d.stars || 0), 0);
  const start = weekStartIdx() - 28;
  const t = todayIdx();
  const cal = Array.from({ length: 35 }, (_, k) => {
    const i = start + k, stt = dayStatus(i);
    return `<i class="${stt}${i === t ? ' today' : ''}${i > t ? ' future' : ''}" title="${keyOfIdx(i)}"></i>`;
  }).join('');
  const sw = (key, label, note) => `<label class="set-row"><span><b>${label}</b><small>${note}</small></span><input type="checkbox" role="switch" data-change="setting" data-v="${key}"${S.settings[key] ? ' checked' : ''}><i class="switch"></i></label>`;
  const link = (action, ic, label, note = '') => `<button class="set-row" data-action="${action}"><span><b>${label}</b>${note ? `<small>${note}</small>` : ''}</span>${icon(ic)}</button>`;
  return `<header class="me-head"><label class="avatar-edit" aria-label="Change your photo">${avatar(96)}<span class="cam">${icon('camera')}</span><input type="file" accept="image/*" data-change="photo" hidden></label>
      <h1>${S.name.trim() ? esc(S.name.trim()) : 'Your profile'}</h1><p>Level ${lv.n} · ${esc(lv.title)}</p>
      <div class="me-actions"><button class="btn soft small" data-action="edit-name">${icon('pencil')} ${S.name.trim() ? 'Edit name' : 'Add your name'}</button>${S.photo ? `<button class="btn ghost small" data-action="photo-remove">Remove photo</button>` : ''}</div></header>
    <section class="stats">${tile(S.streak.count, 'day streak', 'flame')}${tile(S.streak.best, 'best streak')}${tile(S.stats.sessions, 'sessions')}${tile(`${acc}%`, 'first-try right')}${tile(num(S.points), 'points', 'gold')}${tile(starSum, 'stars')}</section>
    <h3 class="sec">Last five weeks</h3>
    <section class="card cal-card"><div class="cal-head">${'MTWTFSS'.split('').map((d) => `<span>${d}</span>`).join('')}</div><div class="cal">${cal}</div>
      <p class="cal-key"><span><i class="done"></i>Active</span><span><i class="saved"></i>Streak saver</span><span>${S.streak.savers} ${S.streak.savers === 1 ? 'saver' : 'savers'} in hand</span></p></section>
    <h3 class="sec">Settings</h3>
    <section class="card set">${sw('sound', 'Sounds', 'Chimes for right and wrong answers')}${sw('haptics', 'Haptics', 'Small taps you can feel, on phones that support them')}
      ${link('remind', 'clock', 'Daily reminder', S.remind.set ? `Weekdays at ${fmtTime(S.remind.time)}. Tap to change` : 'Add a weekday reminder to your calendar')}
      ${link('backup', 'copy', 'Back up progress', 'Get a code you can restore on another device')}${link('restore', 'download', 'Restore from a code')}
      ${link('install-help', 'home', 'Add to Home Screen', 'Full screen and offline')}${link('about', 'info', 'About and credits')}${link('reset', 'trash', 'Reset everything')}</section>`;
}
function openEditName() {
  openSheet(`<form class="sheet-pad" data-submit="name"><h3>What should we call you?</h3><input class="input" id="name-input" maxlength="24" autocomplete="given-name" placeholder="First name" value="${esc(S.name)}">
    <button class="btn primary wide" type="submit">Save</button></form>`);
  setTimeout(() => { const i = $('#name-input'); if (i) i.focus(); }, 60);
}
async function setPhoto(file) {
  try { S.photo = await readPhoto(file); save(); buzz('ok'); if (!S.onboarded) renderOnboarding(); else render(); toast('Looking good.'); }
  catch (e) { toast(e.message || 'That photo could not be used.'); }
  if (saveFailed) toast('This browser is out of storage, so the photo may not be kept.');
}
function openBackup() {
  const code = exportCode();
  openSheet(`<div class="sheet-pad"><h3>Back up progress</h3><p>Copy this code somewhere safe. On another device, or in the Home Screen app, choose Restore and paste it. Your photo and Lab models stay on this device.</p>
    <textarea class="input codearea" readonly rows="4">${esc(code)}</textarea><button class="btn primary wide" data-action="copy" data-v="${esc(code)}">${icon('copy')} Copy code</button></div>`);
}
function openRestore() {
  openSheet(`<form class="sheet-pad" data-submit="restore"><h3>Restore from a code</h3><p>This replaces the progress on this device.</p>
    <textarea class="input codearea" id="restore-input" rows="4" placeholder="Paste your backup code" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
    <button class="btn primary wide" type="submit">Restore</button></form>`);
}
function openAbout() {
  openSheet(`<div class="sheet-pad"><h3>About Attention Span</h3>
    <p>A four-minute daily habit for understanding how modern AI works. Everything runs on your device: your progress, your photo and the models you build never leave it.</p>
    <p>The Builder track and many ideas in the Fluency track are adapted from Google DeepMind’s open course materials, <a href="https://github.com/google-deepmind/ai-foundations" target="_blank" rel="noopener">AI Research Foundations</a> and <a href="https://github.com/google-deepmind/educational" target="_blank" rel="noopener">DeepMind Educational</a> (CC BY 4.0 and Apache 2.0). This is not an official Google product.</p>
    <p class="meta">Version ${esc(window.AS_VERSION || 'dev')}</p><button class="btn primary wide" data-action="close-sheet">Close</button></div>`);
}
function openInstallHelp() {
  openSheet(`<div class="sheet-pad"><h3>Add to Home Screen</h3><ol class="steps"><li>Open this page in <b>Safari</b> on your iPhone.</li><li>Tap the <b>Share</b> button ${icon('share')}.</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>
    <p>The Home Screen app keeps its own progress, separate from Safari. To carry progress across, use Back up progress here and Restore there.</p><button class="btn primary wide" data-action="close-sheet">Got it</button></div>`);
}
function openStreakInfo() {
  openSheet(`<div class="sheet-pad center"><div class="big-flame small">${flameGlyph(S.streak.count > 0, 84)}<b>${S.streak.count}</b></div><h3>${plural(S.streak.count, 'day')} streak</h3>
    <p>Finish one session, one Daily Drop or one warm-up each working day to keep it going. Weekends are free and never break it. Your best so far is ${plural(S.streak.best, 'day')}.</p>
    <p><b>Streak savers: ${S.streak.savers}.</b> A saver covers a missed day automatically. You earn one for every 7 days in a row, and can hold ${MAX_SAVERS}.</p>
    <button class="btn soft wide" data-action="remind">${icon('clock')} ${S.remind.set ? `Reminder: weekdays at ${fmtTime(S.remind.time)}` : 'Add a daily reminder'}</button>
    <button class="btn primary wide" data-action="close-sheet">Got it</button></div>`);
}
function openReset() {
  openSheet(`<div class="sheet-pad center">${mascot('sad', 84)}<h3>Reset everything?</h3><p>This erases your progress, points, photo and Lab models on this device. It cannot be undone.</p>
    <button class="btn bad wide" data-action="reset-confirm">Erase everything</button><button class="btn ghost wide" data-action="close-sheet">Keep my progress</button></div>`);
}

// ---------- sheets and toasts ----------
function openSheet(html) {
  const root = $('#sheet-root');
  clearTimeout(sheetTimer);
  root.hidden = false;
  root.classList.remove('out');
  root.innerHTML = `<div class="scrim" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab" data-action="close-sheet"></div>${html}</div>`;
  document.documentElement.classList.add('sheet-open');
}
function closeSheet() {
  const root = $('#sheet-root');
  if (!root || root.hidden || root.classList.contains('out')) return;
  document.documentElement.classList.remove('sheet-open');
  const hide = () => { root.hidden = true; root.innerHTML = ''; root.classList.remove('out'); };
  if (REDUCED_MOTION) { hide(); return; }
  root.classList.add('out');
  sheetTimer = setTimeout(hide, 200);
}
function toast(html, ms = 2400) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  root.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
}

// ---------- onboarding ----------
function renderOnboarding() {
  const root = $('#onboard');
  root.hidden = false;
  document.documentElement.classList.add('locked');
  const step = UI.onboard;
  const dots = `<div class="ob-dots">${[0, 1, 2].map((i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>`;
  if (step === 0) {
    root.innerHTML = `<div class="ob"><div class="ob-main">${mascot('happy', 132)}<h1>Attention Span</h1><p class="ob-lede">Get fluent in AI, four minutes a day. No jargon. No code.</p>
      <ul class="ob-points"><li><span class="tone-0">${icon('spark')}</span>One small idea at a time, then a quick check</li><li><span class="tone-2">${icon('flask')}</span>Build your own tiny AI in the Lab and keep it</li><li><span class="tone-3">${icon('gift')}</span>Streaks, stars, levels and a daily team challenge</li></ul></div>
      <div class="ob-foot">${dots}<button class="btn primary wide" data-action="ob-next">Let’s go</button><button class="btn ghost wide" data-action="restore">I have a progress code</button></div></div>`;
  } else if (step === 1) {
    root.innerHTML = `<form class="ob" data-submit="ob-name"><div class="ob-main"><label class="avatar-edit" aria-label="Add a photo">${avatar(112)}<span class="cam">${icon('camera')}</span><input type="file" accept="image/*" data-change="photo" hidden></label>
      <h2>What should we call you?</h2><p class="ob-lede">Add a photo if you like. Both stay on this device.</p>
      <input class="input big" id="ob-name" maxlength="24" autocomplete="given-name" placeholder="First name" value="${esc(S.name)}"></div>
      <div class="ob-foot">${dots}<button class="btn primary wide" type="submit">Continue</button></div></form>`;
  } else {
    root.innerHTML = `<div class="ob"><div class="ob-main top"><h2>How do you feel about AI right now?</h2><p class="ob-lede">There is no wrong answer. It only sets where you start.</p>
      <div class="ob-opts">${FEELS.map((f) => `<button class="opt${UI.feel === f.id ? ' sel' : ''}" data-action="ob-feel" data-v="${f.id}"><span class="opt-dot"></span><span><b>${f.label}</b><small>${f.note}</small></span></button>`).join('')}</div></div>
      <div class="ob-foot">${dots}<button class="btn primary wide" data-action="ob-finish"${UI.feel ? '' : ' disabled'}>Start my first session</button></div></div>`;
  }
}
function finishOnboarding() {
  S.onboarded = true;
  S.feel = UI.feel || 'new';
  S.track = S.feel === 'build' && ORDERED.builder && ORDERED.builder.length ? 'builder' : 'fluency';
  save();
  $('#onboard').hidden = true; $('#onboard').innerHTML = '';
  document.documentElement.classList.remove('locked');
  render();
  const s = nextSession();
  // Someone who arrived from a colleague's shared grid gets today's Drop first.
  if (UI.goDrop && !dropResult()) startDrop(); else if (s) startSession(s.id);
}
