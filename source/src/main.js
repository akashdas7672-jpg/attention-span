// ---------- actions ----------
const ACTIONS = {
  tab: (el) => { buzz('tick'); go(el.dataset.v); },
  start: (el) => startSession(el.dataset.id),
  session: (el) => openSessionSheet(el.dataset.id),
  chapter: (el) => {
    const t = trackOf(UI.track || S.track);
    UI.open[t.id] = UI.open[t.id] === el.dataset.id ? '-' : el.dataset.id;
    buzz('tick');
    render();
  },
  track: (el) => { UI.track = el.dataset.v; S.track = el.dataset.v; save(); buzz('tick'); render(); },
  test: (el) => startTest(el.dataset.id),
  drop: () => startDrop(),
  warmup: () => startWarmup(),
  'streak-info': () => openStreakInfo(),
  seen: (el) => { S.seen[el.dataset.v] = 1; save(); render(); },
  theme: (el) => {
    const t = THEMES.find((x) => x.id === el.dataset.v);
    if (!t) return;
    if (!themeUnlocked(t)) { toast(`Reach level ${t.level} to unlock ${t.name}.`); buzz('bad'); return; }
    S.theme = t.id; save(); buzz('ok'); render();
  },
  badge: (el) => openBadge(el.dataset.id),
  claim: (el) => openClaim(el.dataset.id),
  copy: async (el) => {
    let ok = false;
    try { await navigator.clipboard.writeText(el.dataset.v); ok = true; } catch (e) { ok = false; }
    toast(ok ? 'Copied.' : 'Select the text and copy it by hand.');
  },
  share: () => doShare(),
  'edit-name': () => openEditName(),
  'photo-remove': () => { S.photo = ''; save(); render(); },
  backup: () => openBackup(),
  restore: () => openRestore(),
  'install-help': () => openInstallHelp(),
  about: () => openAbout(),
  reset: () => openReset(),
  'reset-confirm': () => {
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(MODELS_KEY); localStorage.removeItem(OLD_KEY); } catch (e) { /* storage unavailable */ }
    location.reload();
  },
  'close-sheet': () => closeSheet(),
  // sessions
  'ss-next': () => ssNext(),
  'ss-quit': () => ssQuit(),
  'ss-leave': () => { closeSheet(); closeSession(); },
  'q-pick': (el) => qPick(Number(el.dataset.v)),
  'q-gap': () => qGap(),
  'q-tf': (el) => qTf(el.dataset.v === '1'),
  'q-check': () => qCheck(),
  'q-row': (el) => qRow(Number(el.dataset.pos)),
  'q-match': (el) => qMatch(el.dataset.side, Number(el.dataset.v)),
  'q-sort': (el) => qSort(Number(el.dataset.v)),
  // plays
  'w-draw': () => wDraw(),
  'w-step': () => wStep(),
  'w-set': (el) => wSet('set', el.dataset.v),
  'w-focus': () => wSet('focus'),
  'w-pt': (el) => wSet('pt', el.dataset.v),
  'w-side': (el) => wSet('side', el.dataset.v),
  'w-reveal': () => wSet('reveal'),
  // onboarding
  'ob-next': () => { UI.onboard++; buzz('tick'); renderOnboarding(); },
  'ob-feel': (el) => { UI.feel = el.dataset.v; buzz('tick'); renderOnboarding(); },
  'ob-finish': () => { if (UI.feel) finishOnboarding(); },
  // lab
  'lab-new': () => labNew(),
  'lab-close': () => labClose(),
  'lab-pack': (el) => { LAB.pack = el.dataset.v; buzz('tick'); labRender(); },
  'lab-kind': (el) => { LAB.kind = el.dataset.v; buzz('tick'); labRender(); },
  'lab-next': () => labNext(),
  'lab-n': (el) => labSetN(Number(el.dataset.v)),
  'lab-resample': () => { labSample(); $('#lab-sample').textContent = LAB.sample; buzz('tick'); },
  'lab-pause': () => labPause(),
  'lab-more': () => labMore(),
  'lab-save': () => labSave($('#lab-name').value),
  'lab-open': (el) => labOpen(el.dataset.id),
  'lab-gen': () => labGenerate(),
  'lab-export': () => labExport(),
  'lab-share': () => labShare(),
  'lab-rename': () => labRename(),
  'lab-delete': () => labDelete(),
  'lab-delete-confirm': () => labDeleteConfirm(),
};
const INPUTS = {
  'w-temp': (v) => wTemp(v),
  'w-fit': (v) => wFit(v),
  'w-noise': (v) => wNoise(v),
  'lab-own': (v) => labOwnInput(v),
  'lab-temp': (v) => { if (LAB) LAB.temp = Number(v); },
};
const SUBMITS = {
  name: () => { S.name = $('#name-input').value.trim().slice(0, 24); save(); closeSheet(); render(); },
  'ob-name': () => { S.name = $('#ob-name').value.trim().slice(0, 24); save(); UI.onboard = 2; renderOnboarding(); },
  restore: () => {
    try { importCode($('#restore-input').value); closeSheet(); applyTheme(); render(); toast('Progress restored.'); }
    catch (e) { toast(e.message && /backup/.test(e.message) ? e.message : 'That code could not be read. Check you copied all of it.'); }
  },
  'lab-save': () => labSave($('#lab-name').value),
  'lab-rename': () => {
    const m = MODELS.find((x) => x.id === LAB.id);
    const name = $('#lab-rename').value.trim().slice(0, 24);
    if (m && name) { m.name = name; saveModels(); closeSheet(); labOpen(m.id); }
  },
};
const DRAGS = { order: (e, el) => dragOrder(e, el), sort: (e, el) => dragSort(e, el), chip: (e, el) => dragChip(e, el) };

document.addEventListener('click', (e) => {
  if (performance.now() < suppressClickUntil) { e.preventDefault(); return; }
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  if (el.tagName !== 'A') e.preventDefault();
  fn(el, e);
});
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('[data-drag]');
  if (el && DRAGS[el.dataset.drag]) DRAGS[el.dataset.drag](e, el);
});
document.addEventListener('input', (e) => {
  const k = e.target.dataset && e.target.dataset.input;
  if (k && INPUTS[k]) INPUTS[k](e.target.value);
});
document.addEventListener('change', (e) => {
  const k = e.target.dataset && e.target.dataset.change;
  if (k === 'setting') { S.settings[e.target.dataset.v] = e.target.checked; save(); if (e.target.checked) { buzz('ok'); sound('good'); } }
  else if (k === 'photo') { const f = e.target.files && e.target.files[0]; if (f) setPhoto(f); e.target.value = ''; }
});
document.addEventListener('submit', (e) => {
  const k = e.target.dataset && e.target.dataset.submit;
  if (!k || !SUBMITS[k]) return;
  e.preventDefault();
  SUBMITS[k]();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!$('#sheet-root').hidden) closeSheet(); else if (L) ssQuit(); return; }
  const el = e.target.closest && e.target.closest('[role="button"][data-action]');
  if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); }
});

// Keeps the day and streak current when the app returns to the foreground.
function refreshClock() {
  const r = refreshStreak();
  save();
  if (!L && !LAB && S.onboarded) render();
  if (r.saved) toast(`${icon('shield')} A streak saver covered ${plural(r.saved, 'missed day')}. Your streak is safe.`, 3800);
  if (r.lost) toast('Your streak reset. One session today starts a new one.', 3600);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshClock(); });

function start() {
  applyTheme();
  if (!TRACKS.length) { $('#view').innerHTML = '<p class="card">No lessons were bundled with this build.</p>'; return; }
  render();
  refreshClock();
  if (!S.onboarded) renderOnboarding();
}
if ('serviceWorker' in navigator && location.protocol === 'https:' && !inFrame() && window.AS_PWA) {
  const had = !!navigator.serviceWorker.controller;
  let reloaded = false;
  // A new version takes over in the background: reload once, unless a session is open.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had || reloaded) return;
    reloaded = true;
    if (!L && !LAB) location.reload(); else toast('A new version is ready. It loads next time you open the app.', 4000);
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (/[?&]debug\b/.test(location.search)) window.__AS = { session: () => L, state: () => S, save, lab: () => LAB, render, startSession, models: () => MODELS };
window.claude?.hot?.ready ? window.claude.hot.ready(() => start()) : start();
