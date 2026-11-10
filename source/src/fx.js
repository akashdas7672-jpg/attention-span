// ---------- sound ----------
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
  return AC;
}
function tone(ac, freq, t0, dur, type = 'sine', gain = 0.16) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ac.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}
function sound(kind) {
  if (!S.settings.sound) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  try {
    if (kind === 'good') { tone(ac, 740, t, 0.12, 'triangle'); tone(ac, 1108, t + 0.08, 0.2, 'triangle'); }
    else if (kind === 'bad') { tone(ac, 220, t, 0.16, 'triangle', 0.1); tone(ac, 165, t + 0.11, 0.22, 'triangle', 0.1); }
    else if (kind === 'done') { [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, t + i * 0.09, 0.26, 'triangle', 0.14)); }
    else if (kind === 'level') { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(ac, f, t + i * 0.07, 0.24, 'sine', 0.12)); }
    else if (kind === 'star') { tone(ac, 988, t, 0.14, 'sine', 0.12); tone(ac, 1319, t + 0.05, 0.18, 'sine', 0.08); }
    else if (kind === 'pop') { tone(ac, 620, t, 0.06, 'sine', 0.08); }
    else if (kind === 'tap') { tone(ac, 520, t, 0.05, 'sine', 0.05); }
  } catch (e) { /* audio unavailable */ }
}

// ---------- haptics ----------
const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// iOS has no vibration API. Toggling a switch-style checkbox through its label plays the system tick (iOS 18+).
function iosTick() {
  try {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.display = 'none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    document.head.removeChild(label);
  } catch (e) { /* no haptics here */ }
}
const BUZZ = { tick: [6], tap: [10], ok: [12, 60, 18], bad: [26, 50, 26, 50, 26], win: [14, 70, 14, 70, 30] };
function buzz(kind = 'tap') {
  if (!S.settings.haptics) return;
  const pat = BUZZ[kind] || BUZZ.tap;
  if (navigator.vibrate) { try { navigator.vibrate(pat); } catch (e) { /* blocked */ } return; }
  if (!IS_IOS) return;
  const n = Math.ceil(pat.length / 2);
  for (let i = 0; i < n; i++) { if (i === 0) iosTick(); else setTimeout(iosTick, i * 110); }
}

// ---------- pointer drag ----------
let suppressClickUntil = 0;
// Follows one pointer from press to release. `h.start`, `h.move(dx, dy, ev)` and `h.end(dx, dy, moved, ev)`.
// The element needs `touch-action: none` so the page does not scroll instead.
function dragStart(e, el, h) {
  if (e.button) return;
  const x0 = e.clientX, y0 = e.clientY, id = e.pointerId;
  let moved = false;
  try { el.setPointerCapture(id); } catch (err) { /* older browsers */ }
  const onMove = (ev) => {
    if (ev.pointerId !== id) return;
    const dx = ev.clientX - x0, dy = ev.clientY - y0;
    if (!moved && Math.hypot(dx, dy) > 6) { moved = true; if (h.start) h.start(ev); }
    if (moved) { ev.preventDefault(); if (h.move) h.move(dx, dy, ev); }
  };
  const onUp = (ev) => {
    if (ev.pointerId !== id) return;
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    if (moved) suppressClickUntil = performance.now() + 350;
    if (h.end) h.end(ev.clientX - x0, ev.clientY - y0, moved && ev.type !== 'pointercancel', ev);
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
}

// ---------- counters and confetti ----------
function countUp(n) { return `<span class="count" data-to="${n}">${REDUCED_MOTION ? n : 0}</span>`; }
function animateCounts(root = document) {
  if (REDUCED_MOTION) return;
  $$('.count', root).forEach((el) => {
    const to = Number(el.dataset.to);
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / 700, 0, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
function burstConfetti() {
  if (REDUCED_MOTION) return;
  const cv = $('#confetti');
  const ctx = cv && cv.getContext && cv.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ['#FFD23F', '#34D399', '#6366F1', '#FF7AB6', '#38BDF8', '#FB923C'];
  const parts = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 4, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: colors[Math.floor(Math.random() * colors.length)],
  }));
  cv.hidden = false;
  const t0 = performance.now();
  const frame = (t) => {
    const k = (t - t0) / 1600;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= 0.99;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, innerWidth, innerHeight); cv.hidden = true; }
  };
  requestAnimationFrame(frame);
}

// ---------- sharing and files ----------
function appUrl() { return location.origin + location.pathname; }
// Opens the system share sheet where there is one, otherwise copies to the clipboard.
async function shareText(text) {
  if (navigator.share) {
    try { await navigator.share({ text }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok ? 'copied' : 'failed';
  } catch (e) { return 'failed'; }
}
async function saveFile(name, mime, text) {
  let file = null;
  try { file = new File([text], name, { type: mime }); } catch (e) { file = null; }
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}
// Reads a chosen picture, crops it to a centred square and shrinks it so it fits in local storage.
function readPhoto(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error('Pick a photo')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const cv = document.createElement('canvas');
        cv.width = size; cv.height = size;
        cv.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
        resolve(cv.toDataURL('image/jpeg', 0.82));
      } catch (e) { reject(e); } finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as a picture')); };
    img.src = url;
  });
}
