// ---------- constants ----------
const STORE_KEY = 'attention-span.v2';
const MODELS_KEY = 'attention-span.v2.models';
const OLD_KEY = 'attention-span.v1';
const SRS_DAYS = [1, 2, 4, 8, 16, 30];
const MAX_SAVERS = 2;
const MAX_MODELS = 4;
const DROP_SIZE = 5;
const DROP_DAY_ONE = Date.UTC(2026, 10, 10) / 864e5; // Daily Drop #1
const LAB_TEXT_MAX = 20000;
const STEPS = { session: 400, replay: 100, drop: 150, warmup: 100 };
const BIG_BRAIN_LEVEL = 3;

const LEVELS = [
  { at: 0, title: 'Curious' }, { at: 50, title: 'Tuned In' }, { at: 130, title: 'Switched On' },
  { at: 240, title: 'Pattern Spotter' }, { at: 380, title: 'Prompt Smith' }, { at: 550, title: 'Context Keeper' },
  { at: 760, title: 'Model Whisperer' }, { at: 1010, title: 'Sharp Operator' }, { at: 1300, title: 'AI Native' },
  { at: 1650, title: 'Full Attention' },
];
const THEMES = [
  { id: 'indigo', name: 'Indigo', level: 1 }, { id: 'tangerine', name: 'Tangerine', level: 3 },
  { id: 'mint', name: 'Mint', level: 5 }, { id: 'berry', name: 'Berry', level: 7 }, { id: 'gold', name: 'Gold', level: 9 },
];
const FEELS = [
  { id: 'new', label: 'Brand new to it', note: 'We start from zero. No jargon.' },
  { id: 'some', label: 'I use it now and then', note: 'You will learn the why behind what you have seen.' },
  { id: 'daily', label: 'I use it every day', note: 'Skip ahead any time with a chapter test.' },
  { id: 'build', label: 'I build with it', note: 'The Builder track, with code, is open from day one.' },
];
const REPOS = {
  'ai-foundations': { slug: 'google-deepmind/ai-foundations', branch: 'main' },
  educational: { slug: 'google-deepmind/educational', branch: 'master' },
};

// ---------- utils ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Inline formatting: `code` and **bold** on escaped text.
function fmt(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
function plain(s) {
  return String(s ?? '').replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1');
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Shuffles until the order differs from the original (for order and match questions).
function shuffleMoved(arr) {
  if (arr.length < 2) return arr.slice();
  for (let n = 0; n < 8; n++) { const a = shuffle(arr); if (a.some((v, i) => v !== arr[i])) return a; }
  return arr.slice().reverse();
}
function pad2(n) { return String(n).padStart(2, '0'); }
function dayKey(d = new Date()) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function dayIdxOf(d = new Date()) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
function todayIdx() { return dayIdxOf(new Date()); }
function idxToDate(i) { const u = new Date(i * 864e5); return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()); }
function keyOfIdx(i) { return dayKey(idxToDate(i)); }
function weekStartIdx(i = todayIdx()) { const dow = (idxToDate(i).getDay() + 6) % 7; return i - dow; }
function plural(n, one, many = one + 's') { return `${n} ${n === 1 ? one : many}`; }
function num(n) { return Number(n).toLocaleString('en-US'); }

// ---------- content index ----------
const C = window.CONTENT || {};
const TRACKS = (C.tracks || []).map((t) => ({ ...t }));
const SESSIONS = {};
const QUESTIONS = {};
const ORDERED = {};
for (const t of TRACKS) {
  ORDERED[t.id] = [];
  t.chapters.forEach((ch, ci) => {
    ch.track = t; ch.index = ci; ch.tone = ci % 8;
    ch.sessions.forEach((s, si) => {
      s.chapter = ch; s.index = si;
      s.steps.forEach((st, i) => {
        if (st.type !== 'card') { st.key = `${s.id}#${i}`; st.session = s; QUESTIONS[st.key] = st; }
      });
      s.qs = s.steps.filter((st) => st.type !== 'card');
      s.mins = Math.max(2, Math.round((s.steps.length * 22) / 60));
      SESSIONS[s.id] = s;
      ORDERED[t.id].push(s);
    });
  });
}
const DAILY = (C.daily || []).map((q, i) => ({ ...q, key: `d#${i}` }));
const PROGRAM = C.program || {};
const PACKS = C.packs || [];
function trackOf(id) { return TRACKS.find((t) => t.id === id) || TRACKS[0]; }
function labUrl(s) {
  const r = REPOS[s.chapter.repo] || REPOS['ai-foundations'];
  return `https://colab.research.google.com/github/${r.slug}/blob/${r.branch}/${s.lab}`;
}

// ---------- state ----------
function defaultState() {
  return {
    v: 2,
    onboarded: false,
    createdAt: Date.now(),
    name: '',
    photo: '',
    feel: '',
    track: 'fluency',
    points: 0,
    streak: { count: 0, best: 0, last: -1, savers: 1, saved: [] },
    days: {},
    done: {},
    drops: {},
    q: {},
    badges: {},
    theme: 'indigo',
    stats: {
      sessions: 0, perfect: 0, answers: 0, correct: 0, bestCombo: 0, warmups: 0, drops: 0, dropPerfect: 0,
      shares: 0, models: 0, trained: 0, exports: 0, builder: 0, surprises: 0,
    },
    mainModel: '',
    steps: 0,
    packs: ['hype', 'fables'],
    remind: { time: '', set: false },
    resume: null,
    ladder: { run: [false, false, false, false] },
    claimed: {},
    seen: {},
    settings: { sound: true, haptics: true },
  };
}
function mergeDefaults(base, saved) {
  for (const k of Object.keys(saved || {})) {
    const v = saved[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      base[k] = mergeDefaults(base[k], v);
    } else {
      base[k] = v;
    }
  }
  return base;
}
// Carries name, streak, activity and Builder progress over from the first version of the app.
function migrateV1(o) {
  const s = defaultState();
  s.name = o.name || '';
  s.points = o.xp || 0;
  if (o.streak) {
    s.streak.count = o.streak.count || 0; s.streak.best = o.streak.best || 0;
    s.streak.last = typeof o.streak.last === 'number' ? o.streak.last : -1;
  }
  for (const [k, d] of Object.entries(o.days || {})) s.days[k] = { pts: d.xp || 0, sessions: d.lessons || 0 };
  for (const [id, st] of Object.entries(o.skills || {})) {
    if (st.lessons >= 1 && SESSIONS[`${id}a`]) s.done[`${id}a`] = { stars: 2, n: 1, at: Date.now() };
    if (st.lessons >= 3 && SESSIONS[`${id}b`]) s.done[`${id}b`] = { stars: 2, n: 1, at: Date.now() };
  }
  s.stats.sessions = o.lessonsTotal || 0;
  if (o.settings && o.settings.sound === false) s.settings.sound = false;
  return s;
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return mergeDefaults(defaultState(), JSON.parse(raw));
    const old = localStorage.getItem(OLD_KEY);
    if (old) return migrateV1(JSON.parse(old));
  } catch (e) { /* storage blocked or corrupt: start fresh */ }
  return defaultState();
}
let S = loadState();
let saveFailed = false;
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); saveFailed = false; } catch (e) { saveFailed = true; }
}
// Lab models are large, so they live under their own key and are written only when they change.
function loadModels() {
  try { const raw = localStorage.getItem(MODELS_KEY); if (raw) { const a = JSON.parse(raw); if (Array.isArray(a)) return a; } } catch (e) { /* none saved */ }
  return [];
}
let MODELS = loadModels();
function saveModels() {
  try { localStorage.setItem(MODELS_KEY, JSON.stringify(MODELS)); return true; } catch (e) { return false; }
}

function today() {
  const k = dayKey();
  if (!S.days[k]) S.days[k] = { pts: 0, sessions: 0 };
  return S.days[k];
}
function activeOn(i) { const d = S.days[keyOfIdx(i)]; return !!(d && (d.sessions > 0 || d.drop || d.warm)); }

// ---------- levels and points ----------
function levelOf(p = S.points) {
  let n = 0;
  while (n + 1 < LEVELS.length && p >= LEVELS[n + 1].at) n++;
  const cur = LEVELS[n], nx = LEVELS[n + 1];
  return {
    n: n + 1, title: cur.title, at: cur.at, next: nx ? nx.at : null, nextTitle: nx ? nx.title : null,
    frac: nx ? (p - cur.at) / (nx.at - cur.at) : 1, toGo: nx ? nx.at - p : 0,
  };
}
function addPoints(n) {
  const before = levelOf().n;
  S.points += n;
  today().pts += n;
  const after = levelOf().n;
  return { leveled: after > before, level: after };
}
function themeUnlocked(t) { return levelOf().n >= t.level; }
function applyTheme() {
  const t = THEMES.find((x) => x.id === S.theme && themeUnlocked(x)) || THEMES[0];
  document.documentElement.dataset.accent = t.id;
}

// ---------- streak ----------
// Weekends are free: a streak only needs the working days.
function isWeekend(i) { const d = idxToDate(i).getDay(); return d === 0 || d === 6; }
function missedWorkdays(from, to) {
  if (to - from > 120) return 99;
  let n = 0;
  for (let i = from + 1; i < to; i++) if (!isWeekend(i)) n++;
  return n;
}
function streakAlive() { return S.streak.count > 0 && missedWorkdays(S.streak.last, todayIdx()) === 0; }
// Spends streak savers on missed working days, or resets the streak when there are not enough.
function refreshStreak() {
  const t = todayIdx();
  const st = S.streak;
  if (st.count > 0 && st.last < t - 1) {
    const missed = missedWorkdays(st.last, t);
    if (missed === 0) return {};
    if (st.savers >= missed) {
      st.savers -= missed;
      for (let i = st.last + 1; i < t; i++) if (!isWeekend(i)) st.saved.push(i);
      st.saved = st.saved.slice(-60);
      st.last = t - 1;
      return { saved: missed };
    }
    st.count = 0;
    return { lost: true };
  }
  return {};
}
function activeToday() { return S.streak.last === todayIdx(); }
function extendStreak() {
  const t = todayIdx();
  const st = S.streak;
  if (st.last === t) return { extended: false };
  refreshStreak();
  st.count = (st.count > 0 && missedWorkdays(st.last, t) === 0 ? st.count : 0) + 1;
  st.last = t;
  st.best = Math.max(st.best, st.count);
  let gotSaver = false;
  if (st.count % 7 === 0 && st.savers < MAX_SAVERS) { st.savers++; gotSaver = true; }
  return { extended: true, gotSaver };
}
function dayStatus(i) {
  if (activeOn(i)) return 'done';
  if (S.streak.saved.includes(i)) return 'saved';
  return 'none';
}

// ---------- journey ----------
function isDone(id) { return !!S.done[id]; }
function starsOf(id) { return (S.done[id] || {}).stars || 0; }
function chapterStats(ch) {
  const done = ch.sessions.filter((s) => isDone(s.id)).length;
  const stars = ch.sessions.reduce((n, s) => n + starsOf(s.id), 0);
  return { done, total: ch.sessions.length, stars, maxStars: ch.sessions.length * 3, complete: done === ch.sessions.length };
}
function chapterUnlocked(ch) {
  if (ch.track.id !== 'fluency' || ch.index === 0) return true;
  return chapterStats(ch.track.chapters[ch.index - 1]).complete;
}
function sessionUnlocked(s) {
  if (isDone(s.id)) return true;
  if (s.index === 0) return chapterUnlocked(s.chapter);
  return isDone(s.chapter.sessions[s.index - 1].id);
}
function nextSession(trackId = S.track) {
  const list = ORDERED[trackId] || [];
  return list.find((s) => !isDone(s.id) && sessionUnlocked(s)) || null;
}
function trackStats(trackId) {
  const list = ORDERED[trackId] || [];
  return { done: list.filter((s) => isDone(s.id)).length, total: list.length };
}

// ---------- spaced repetition ----------
function recordQ(key, ok) {
  if (!QUESTIONS[key]) return;
  const st = S.q[key] || (S.q[key] = { b: 0, due: 0, w: 0 });
  if (ok) st.b = Math.min(SRS_DAYS.length - 1, st.b + 1); else { st.b = 0; st.w++; }
  st.due = todayIdx() + SRS_DAYS[st.b];
}
function dueKeys() {
  const t = todayIdx();
  return Object.keys(S.q).filter((k) => S.q[k].due <= t && QUESTIONS[k]).sort((a, b) => S.q[a].b - S.q[b].b || S.q[a].due - S.q[b].due);
}

// ---------- Daily Drop ----------
function dropNumber(i = todayIdx()) { return i - DROP_DAY_ONE + 1; }
// The same five questions for everyone on a given calendar day.
function dropQuestions(i = todayIdx()) {
  if (DAILY.length < DROP_SIZE) return [];
  const pool = shuffle(DAILY, rng(hashStr('drop' + i)));
  // Prefer five different topics and a mix of question types.
  const out = [];
  for (const q of pool) {
    if (out.length >= DROP_SIZE) break;
    if (out.some((o) => o.topic && o.topic === q.topic) || out.filter((o) => o.type === q.type).length >= 3) continue;
    out.push(q);
  }
  for (const q of pool) { if (out.length >= DROP_SIZE) break; if (!out.includes(q)) out.push(q); }
  return out;
}
function dropResult(i = todayIdx()) { return S.drops[keyOfIdx(i)] || null; }
function msToMidnight() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
}

// ---------- badges ----------
const BADGES = [
  { id: 'first', title: 'First step', desc: 'Finish your first session', icon: 'rocket', tone: 0, prog: () => [S.stats.sessions, 1] },
  { id: 'streak3', title: 'Three-peat', desc: 'Reach a 3-day streak', icon: 'flame', tone: 1, prog: () => [S.streak.best, 3] },
  { id: 'streak7', title: 'Full week', desc: 'Reach a 7-day streak', icon: 'flame', tone: 3, prog: () => [S.streak.best, 7] },
  { id: 'streak30', title: 'Habit formed', desc: 'Reach a 30-day streak', icon: 'flame', tone: 7, prog: () => [S.streak.best, 30] },
  { id: 'perfect1', title: 'Flawless', desc: 'Earn three stars on a session', icon: 'star', tone: 3, prog: () => [S.stats.perfect, 1] },
  { id: 'perfect10', title: 'Star collector', desc: 'Earn three stars ten times', icon: 'star', tone: 5, prog: () => [S.stats.perfect, 10] },
  { id: 'combo5', title: 'On a roll', desc: 'Get 5 right in a row, first try', icon: 'zap', tone: 6, prog: () => [S.stats.bestCombo, 5] },
  { id: 'chapter', title: 'Chapter closed', desc: 'Finish a whole chapter', icon: 'book', tone: 2, prog: () => [TRACKS.some((t) => t.chapters.some((c) => chapterStats(c).complete)) ? 1 : 0, 1] },
  { id: 'fluent', title: 'AI fluent', desc: 'Finish every Fluency chapter', icon: 'trophy', tone: 0, prog: () => { const t = trackStats('fluency'); return [t.done, t.total || 1]; } },
  { id: 'drop1', title: 'Dropped in', desc: 'Play a Daily Drop', icon: 'target', tone: 4, prog: () => [S.stats.drops, 1] },
  { id: 'drop5', title: 'Clean sweep', desc: 'Score 5 out of 5 on a Daily Drop', icon: 'target', tone: 2, prog: () => [S.stats.dropPerfect, 1] },
  { id: 'drop7', title: 'Regular', desc: 'Play 7 Daily Drops', icon: 'target', tone: 1, prog: () => [S.stats.drops, 7] },
  { id: 'warm5', title: 'Kept fresh', desc: 'Finish 5 warm-ups', icon: 'refresh', tone: 4, prog: () => [S.stats.warmups, 5] },
  { id: 'maker', title: 'Model maker', desc: 'Build your first model in the Lab', icon: 'flask', tone: 5, prog: () => [S.stats.models, 1] },
  { id: 'trainer', title: 'Brain trainer', desc: 'Give Tiny Brains 6,000 practice steps in total', icon: 'brain', tone: 0, prog: () => [Math.min(S.stats.trained, 6000), 6000] },
  { id: 'takehome', title: 'Take-home', desc: 'Export a model you built', icon: 'gift', tone: 6, prog: () => [S.stats.exports, 1] },
  { id: 'graduate', title: 'Graduate', desc: 'Run a real open model on your own computer', icon: 'chip', tone: 2, prog: () => [S.ladder.run.filter(Boolean).length, 4] },
  { id: 'builder', title: 'Under the hood', desc: 'Finish a Builder session', icon: 'code', tone: 7, prog: () => [S.stats.builder, 1] },
  { id: 'share', title: 'Show and tell', desc: 'Share a result with your team', icon: 'share', tone: 1, prog: () => [S.stats.shares, 1] },
];
function checkBadges() {
  const fresh = [];
  for (const b of BADGES) {
    if (S.badges[b.id]) continue;
    const [have, need] = b.prog();
    if (have >= need) { S.badges[b.id] = dayKey(); fresh.push(b); }
  }
  return fresh;
}

// ---------- team prizes (optional, configured in content/program.json) ----------
function prizeCode(p) {
  const h = hashStr(`${p.id}|${S.name}|${S.createdAt}`).toString(36).toUpperCase().padStart(6, '0').slice(-6);
  return `${String(p.id).toUpperCase().slice(0, 4)}-${h}`;
}

// ---------- backup ----------
function exportCode() {
  const copy = { ...S, photo: '' };
  return 'AS2.' + btoa(unescape(encodeURIComponent(JSON.stringify(copy))));
}
function importCode(code) {
  const c = String(code || '').trim();
  if (!c.startsWith('AS2.')) throw new Error('That does not look like an Attention Span backup code.');
  const data = JSON.parse(decodeURIComponent(escape(atob(c.slice(4)))));
  if (!data || data.v !== 2) throw new Error('That backup is from an unknown version.');
  const photo = S.photo;
  S = mergeDefaults(defaultState(), data);
  S.photo = photo;
  save();
}
