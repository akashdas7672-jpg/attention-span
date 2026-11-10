// Bundles src/ + content/ into dist/ (an installable, offline web app).
// Usage: node tools/build.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const readJson = (p, fallback) => (existsSync(join(root, p)) ? JSON.parse(read(p)) : fallback);
const FLUENCY_ORDER = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9'];
const BUILDER_ORDER = ['intro', 'c1', 'c2', 'ml', 'c3', 'c4', 'c5', 'c7', 'c8', 'frontier'];
const SRC = ['core.js', 'icons.js', 'fx.js', 'lm.js', 'model.js', 'widgets.js', 'session.js', 'ui.js', 'lab.js', 'main.js'];

// A Builder skill (cards + a pool of exercises) becomes two sessions: the ideas with the easier half, then the harder half.
function builderChapter(u) {
  return {
    id: u.id, title: u.title, blurb: u.subtitle, repo: u.repo,
    sessions: u.skills.flatMap((sk) => {
      const ex = sk.exercises.map((e, i) => ({ e, i })).sort((a, b) => (a.e.level || 2) - (b.e.level || 2) || a.i - b.i).map((x) => x.e);
      const half = Math.ceil(ex.length / 2);
      const cards = sk.cards.map((c) => ({ type: 'card', ...c }));
      const mk = (suffix, part, goal, steps) => ({ id: `${sk.id}${suffix}`, title: sk.title, part, icon: sk.icon, lab: sk.lab, goal, steps });
      return [
        mk('a', 1, 'Learn the ideas, then try the first checks.', [...cards, ...ex.slice(0, half)]),
        mk('b', 2, 'Apply them to harder, hands-on questions.', ex.slice(half)),
      ];
    }),
  };
}

const fluency = FLUENCY_ORDER.filter((id) => existsSync(join(root, 'content', 'fluency', `${id}.json`))).map((id) => readJson(`content/fluency/${id}.json`));
const builder = BUILDER_ORDER.filter((id) => existsSync(join(root, 'content', 'builder', `${id}.json`))).map((id) => builderChapter(readJson(`content/builder/${id}.json`)));
const tracks = [];
if (fluency.length) tracks.push({ id: 'fluency', title: 'AI Fluency', note: 'Nine chapters, about four minutes at a time. Plain language, no code.', chapters: fluency });
if (builder.length) tracks.push({ id: 'builder', title: 'Builder', note: 'The hands-on track, adapted from Google DeepMind’s course notebooks. Includes Python and some maths. Every chapter is open.', chapters: builder });
const bundle = {
  tracks,
  daily: readJson('content/daily.json', { questions: [] }).questions,
  program: readJson('content/program.json', {}),
  packs: readJson('content/lab/datasets.json', { packs: [] }).packs,
};
const count = (t) => t.chapters.reduce((n, c) => n + c.sessions.length, 0);

const css = read('src/styles.css');
const js = SRC.map((f) => (existsSync(join(root, 'src', f)) ? read(`src/${f}`) : f === 'lm.js' ? 'const LM = null;' : '')).join('\n');
const content = JSON.stringify(bundle).replace(/</g, '\\u003c');
const version = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">';

mkdirSync(join(root, 'dist'), { recursive: true });

const app = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Attention Span</title>
<meta name="description" content="Get fluent in AI, four minutes a day.">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#EEF0FF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121127" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Attention Span">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/icon-192.png">
${fonts}
<style>
${css}</style>
</head>
<body>
<div id="app"><main id="view"></main></div>
<nav class="tabbar" id="tabbar" aria-label="Sections"></nav>
<div id="session" hidden></div>
<div id="lab" hidden></div>
<div id="onboard" hidden></div>
<div id="sheet-root" hidden></div>
<div id="toast-root" aria-live="polite"></div>
<canvas id="confetti" hidden></canvas>
<script>window.CONTENT=${content};window.AS_PWA=true;window.AS_VERSION=${JSON.stringify(version)};</script>
<script>(()=>{'use strict';
${js}
})();</script>
</body>
</html>
`;
writeFileSync(join(root, 'dist', 'index.html'), app);

writeFileSync(join(root, 'dist', 'manifest.webmanifest'), JSON.stringify({
  name: 'Attention Span',
  short_name: 'Attention',
  description: 'Get fluent in AI, four minutes a day.',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#EEF0FF',
  theme_color: '#4F46E5',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

writeFileSync(join(root, 'dist', 'sw.js'), `// Offline cache: the app shell is cache-first and refreshed in the background.
const CACHE = 'attention-span-${version}';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(req, { ignoreSearch: url.origin === location.origin });
    const net = fetch(url.origin === location.origin ? new Request(req.url, { cache: 'no-cache' }) : req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
`);

mkdirSync(join(root, 'dist', 'icons'), { recursive: true });
for (const f of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
  const src = join(root, 'assets', f);
  if (existsSync(src)) copyFileSync(src, join(root, 'dist', 'icons', f));
}
console.log(`built ${tracks.map((t) => `${t.title}: ${t.chapters.length} chapters, ${count(t)} sessions`).join(' · ')} · daily ${bundle.daily.length} · packs ${bundle.packs.length} · index.html ${(app.length / 1024).toFixed(0)} KB`);
