// ---------- icons (24×24 stroke glyphs) ----------
const ICON_PATHS = {
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="8" cy="16" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/>',
  chain: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  scale: '<path d="M12 3v18M7 21h10M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/><path d="M16 16l3-8 3 8a4.6 4.6 0 0 1-6 0zM2 16l3-8 3 8a4.6 4.6 0 0 1-6 0z"/>',
  brain: '<path d="M12 5a3 3 0 1 0-6 .1 4 4 0 0 0-2.5 5.8 4 4 0 0 0 .6 6.6A4 4 0 1 0 12 18z"/><path d="M12 5a3 3 0 1 1 6 .1 4 4 0 0 1 2.5 5.8 4 4 0 0 1-.6 6.6A4 4 0 1 1 12 18z"/><path d="M12 5v13"/>',
  token: '<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><path d="M8.5 9.5h7M12 9.5V16"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  vector: '<path d="M4 20V4M4 20h16"/><path d="M4 20L18 7"/><path d="M12 6.5h6.5V13"/>',
  layers: '<path d="M12 2.5l9.5 5L12 12.5 2.5 7.5z"/><path d="M2.5 12.5L12 17.5l9.5-5"/><path d="M2.5 17L12 22l9.5-5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  chip: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/><path d="M8 10h8M8 14h5"/>',
  robot: '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M2 14h2M20 14h2M9 13v2M15 13v2"/>',
  flask: '<path d="M10 2v7.5L4.7 20.5a1 1 0 0 0 .9 1.5h12.8a1 1 0 0 0 .9-1.5L14 9.5V2"/><path d="M8.5 2h7M7 16h10"/>',
  dna: '<path d="M2 15c6.7-6 13.3 0 20-6"/><path d="M9 22c1.8-2 2.5-4 2.8-6M15 2c-1.8 2-2.5 4-2.8 6"/><path d="M17 6l-2.5-2.5M7 18l2.5 2.5M6.5 12.5l1 1M16.5 10.5l1 1M10 16l1.5 1.5M12.5 6.5L14 8"/>',
  graph: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><circle cx="19" cy="16" r="1.8"/><path d="M7.5 6h9M6.3 8.2l4.4 7.6M17.7 8.2l-4.4 7.6M14.4 17.5l2.9-1"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17v-4M13 17V8M18 17V5"/>',
  bird: '<path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.3-2.3L2 20"/><path d="M20 7l2 .5-2 .5M10 18v3M14 17.8V21M7 18a6 6 0 0 0 3.8-10.6"/>',
  puzzle: '<path d="M9 3h6v3a2 2 0 1 0 4 0V3h2v6h-3a2 2 0 1 0 0 4h3v8h-6v-3a2 2 0 1 0-4 0v3H3v-8h3a2 2 0 1 0 0-4H3V3h6z"/>',
  spark: '<path d="M12 2.5l1.9 6.1a2 2 0 0 0 1.4 1.4l6.2 1.9-6.2 1.9a2 2 0 0 0-1.4 1.4L12 21.5l-1.9-6.3a2 2 0 0 0-1.4-1.4L2.5 12l6.2-1.9a2 2 0 0 0 1.4-1.4z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/><circle cx="12" cy="14" r="1.2" fill="currentColor"/>',
  memory: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10v4M10 10v4M14 10v4M18 10v4M6 18v2M10 18v2M14 18v2M18 18v2"/>',
  tune: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16"/><path d="M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0z"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  // interface
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/>',
  crown: '<path d="M11.6 3.3a.5.5 0 0 1 .8 0l3 5.6a1 1 0 0 0 1.5.3l4.3-3.7a.5.5 0 0 1 .8.5L19.1 16.3a1 1 0 0 1-1 .7H5.8a1 1 0 0 1-1-.7L2 6a.5.5 0 0 1 .8-.5l4.3 3.7a1 1 0 0 0 1.5-.3z"/><path d="M5 21h14"/>',
  dumbbell: '<path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  sound: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>',
  ext: '<path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  back: '<path d="M12 19l-7-7 7-7M19 12H5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  snow: '<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
  chest: '<path d="M3 10a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10H3z"/><path d="M3 12h18M10 12v3h4v-3"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  quest: '<path d="M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a2 2 0 0 1 2-2h11"/>',
  home: '<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  grip: '<circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/>',
  pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.5v.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
};
function icon(name, cls = '') {
  const p = ICON_PATHS[name] || ICON_PATHS.spark;
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

// Solid, colourful glyphs for streaks, stars and points.
function flameGlyph(lit = true, size = 26) {
  const a = lit ? 'var(--flame)' : 'var(--mute-2)';
  const b = lit ? 'var(--gold)' : 'var(--mute)';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path fill="${a}" d="M12 1.5c.6 3.2 2.6 5.3 4.4 7.2C18 10.4 19.5 12.3 19.5 15a7.5 7.5 0 0 1-15 0c0-2.4 1.2-4.2 2.6-5.6.3 1.6 1.1 2.8 2.4 3.4C8.8 8.7 10 4.9 12 1.5z"/><path fill="${b}" d="M12 11.5c1.7 1.6 3.3 3.1 3.3 5.1a3.3 3.3 0 0 1-6.6 0c0-1.5.8-2.6 1.7-3.4.2.8.6 1.3 1.2 1.6-.1-1.2 0-2.3.4-3.3z"/></svg>`;
}
function starGlyph(on = true, size = 22) {
  return `<svg class="starg${on ? ' on' : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path fill="${on ? 'var(--gold)' : 'var(--mute)'}" stroke="${on ? 'var(--gold-deep)' : 'var(--mute-2)'}" stroke-width="1.4" stroke-linejoin="round" d="M12 2.6l2.8 5.9 6.4.9-4.7 4.5 1.2 6.4-5.7-3.1-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.9z"/></svg>`;
}
function stars(n, size = 18) { return `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map((i) => starGlyph(i <= n, size)).join('')}</span>`; }
function pointGlyph(size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="var(--gold)"/><circle cx="12" cy="12" r="10" fill="none" stroke="var(--gold-deep)" stroke-width="1.6"/><path fill="var(--gold-ink)" d="M13.2 5.5L7.5 13h3.9l-.7 5.5 5.8-7.6h-4z"/></svg>`;
}

// ---------- mascot: "Bit", a small robot ----------
function mascot(mood = 'happy', size = 96) {
  const eyes = {
    happy: '<path d="M33 46q5-7 10 0M57 46q5-7 10 0" stroke="var(--m-ink)" stroke-width="4" fill="none" stroke-linecap="round"/>',
    idle: '<circle cx="38" cy="45" r="5.5" fill="var(--m-ink)"/><circle cx="62" cy="45" r="5.5" fill="var(--m-ink)"/><circle cx="40" cy="43" r="1.8" fill="#fff"/><circle cx="64" cy="43" r="1.8" fill="#fff"/>',
    sad: '<circle cx="38" cy="47" r="5" fill="var(--m-ink)"/><circle cx="62" cy="47" r="5" fill="var(--m-ink)"/><path d="M31 38l12 4M69 38l-12 4" stroke="var(--m-ink)" stroke-width="3.5" stroke-linecap="round"/>',
    wow: '<circle cx="38" cy="45" r="7" fill="var(--m-ink)"/><circle cx="62" cy="45" r="7" fill="var(--m-ink)"/><circle cx="40.5" cy="42.5" r="2.4" fill="#fff"/><circle cx="64.5" cy="42.5" r="2.4" fill="#fff"/>',
  }[mood] || '';
  const mouth = {
    happy: '<path d="M40 60q10 9 20 0" stroke="var(--m-ink)" stroke-width="4" fill="none" stroke-linecap="round"/>',
    idle: '<path d="M43 61q7 4 14 0" stroke="var(--m-ink)" stroke-width="4" fill="none" stroke-linecap="round"/>',
    sad: '<path d="M42 64q8-6 16 0" stroke="var(--m-ink)" stroke-width="4" fill="none" stroke-linecap="round"/>',
    wow: '<ellipse cx="50" cy="63" rx="6" ry="7" fill="var(--m-ink)"/>',
  }[mood] || '';
  return `<svg class="mascot mascot-${mood}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <line x1="50" y1="20" x2="50" y2="9" stroke="var(--m-body-deep)" stroke-width="4" stroke-linecap="round"/>
    <circle class="m-bulb" cx="50" cy="8" r="6" fill="var(--m-bulb)"/>
    <rect x="14" y="40" width="10" height="20" rx="5" fill="var(--m-body-deep)"/>
    <rect x="76" y="40" width="10" height="20" rx="5" fill="var(--m-body-deep)"/>
    <rect x="20" y="24" width="60" height="58" rx="20" fill="var(--m-body-deep)"/>
    <rect x="20" y="20" width="60" height="56" rx="20" fill="var(--m-body)"/>
    <rect x="27" y="30" width="46" height="38" rx="14" fill="var(--m-face)"/>
    ${eyes}${mouth}
    <circle cx="30" cy="58" r="3.5" fill="var(--m-cheek)" opacity=".45"/><circle cx="70" cy="58" r="3.5" fill="var(--m-cheek)" opacity=".45"/>
  </svg>`;
}
