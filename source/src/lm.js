// ---------- lab engine: tiny language models you can train on a phone (pure logic, no DOM) ----------
const LM = (() => {
  // The three *Rt factories are self-contained on purpose: exportHtml() pastes their source into the
  // take-home file. They must not reach outside themselves and must not contain line comments.

  // Shared helpers: text clean-up, seeded random numbers, sampling.
  const baseRt = function () {
    function norm(text) {
      return String(text == null ? '' : text)
        .replace(/\r\n?|[\u000B\u000C\u0085\u2028\u2029]/g, '\n')
        .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, '\'')
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g, '"')
        .replace(/[\u2014\u2015]/g, ' - ')
        .replace(/[\u2010-\u2013\u2212]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/[\t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
        .replace(/[\u0000-\u0008\u000E-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2060\uFEFF]/g, '');
    }
    function clean(text) {
      let s = norm(String(text == null ? '' : text).slice(0, 240000))
        .replace(/ +/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      if (s.length > 60000) {
        s = s.slice(0, 60000);
        if (/[\uD800-\uDBFF]$/.test(s)) s = s.slice(0, -1);
        s = s.trim();
      }
      return s;
    }
    function mulberry(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function seedOf(v) {
      if (typeof v === 'string') {
        let h = 2166136261;
        for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
      }
      const x = +v;
      if (x !== x) return 1;
      return (Math.floor(x) ^ Math.floor((x % 1) * 4294967296)) >>> 0;
    }
    function rngOf(o) {
      return o && typeof o.rng === 'function' ? o.rng : mulberry(seedOf(o && o.seed != null ? o.seed : 1));
    }
    function temp(t, fallback) {
      const x = typeof t === 'number' && t === t ? t : fallback;
      return x < 0.2 ? 0.2 : x > 2 ? 2 : x;
    }
    function pick(w, n, total, r) {
      let x = r * total;
      for (let i = 0; i < n; i++) { x -= w[i]; if (x < 0) return i; }
      return n - 1;
    }
    return { norm, clean, mulberry, seedOf, rngOf, temp, pick };
  };

  // Copycat: word-level n-gram tables with back-off.
  const ngramRt = function (B) {
    const TOKEN = /\n|\d+(?:[.,:]\d+)+|'?[\p{L}\p{N}\p{M}_]+(?:['-][\p{L}\p{N}\p{M}_]+)*'?|-+|\S/gu;
    const WORDY = /[\p{L}\p{N}]/u;
    const CLOSE = /^[.,!?;:)\]}%']$/;
    const OPEN = /^[(\[{$#@\u00A3\u20AC]$/;

    function tokens(text) { return text.match(TOKEN) || []; }

    /* Space (or nothing) that goes in front of tok when it follows prev. st.q tracks an open double quote. */
    function gap(prev, tok, st) {
      let sp = ' ';
      if (prev === null || prev === '\n' || tok === '\n' || prev === '/' || tok === '/') sp = '';
      else if (tok === '"') sp = st.q ? '' : ' ';
      else if (CLOSE.test(tok)) sp = '';
      if (prev !== null && (OPEN.test(prev) || (prev === '"' && st.q))) sp = '';
      if (tok === '"') st.q = !st.q;
      else if (tok === '\n') st.q = false;
      return sp;
    }
    function bump(map, id) { map.set(id, (map.get(id) || 0) + 1); }

    /* tabs[k] maps a context of k tokens (packed into one number) to a Map of next token -> count. */
    function build(text, n) {
      const order = n >= 3 ? 3 : n >= 2 ? 2 : n >= 1 ? 1 : 2;
      const toks = tokens(text), N = toks.length;
      const index = new Map(), fold = new Map(), words = [], ids = new Int32Array(N);
      for (let i = 0; i < N; i++) {
        const t = toks[i];
        let id = index.get(t);
        if (id === undefined) {
          id = words.length;
          index.set(t, id);
          words.push(t);
          const low = t.toLowerCase();
          if (!fold.has(low)) fold.set(low, id);
        }
        ids[i] = id;
      }
      const V = words.length, uni = new Map(), starts = new Map(), tabs = [null];
      for (let k = 1; k <= order; k++) tabs.push(new Map());
      let patterns = 0;
      for (let i = 0; i < N; i++) {
        const id = ids[i];
        bump(uni, id);
        if (WORDY.test(toks[i]) && (i === 0 || /^[\n.!?]$/.test(toks[i - 1]))) bump(starts, id);
        let key = 0, pw = 1;
        for (let k = 1; k <= order && k <= i; k++) {
          key += ids[i - k] * pw;
          pw *= V;
          let m = tabs[k].get(key);
          if (!m) { m = new Map(); tabs[k].set(key, m); patterns++; }
          bump(m, id);
        }
      }
      return { kind: 'ngram', n: order, text, tokens: N, vocab: V, patterns, words, index, fold, tabs, uni, starts };
    }

    function context(m, text) {
      const toks = tokens(B.norm(text)), st = { q: false }, ctx = [];
      let prev = null;
      for (let i = 0; i < toks.length; i++) { gap(prev, toks[i], st); prev = toks[i]; }
      for (let i = Math.max(0, toks.length - m.n); i < toks.length; i++) {
        let id = m.index.get(toks[i]);
        if (id === undefined) id = m.fold.get(toks[i].toLowerCase());
        ctx.push(id === undefined ? -1 : id);
      }
      return { ctx, prev, st };
    }

    /* Longest context seen in training wins; then plain word frequency (sentence openers for an empty context). */
    function lookup(m, ctx) {
      const L = ctx.length;
      let hit = null, key = 0, pw = 1;
      for (let k = 1; k <= m.n && k <= L; k++) {
        const id = ctx[L - k];
        if (id < 0) break;
        key += id * pw;
        pw *= m.vocab;
        const s = m.tabs[k].get(key);
        if (!s) break;
        hit = s;
      }
      return hit || (L || !m.starts.size ? m.uni : m.starts);
    }

    function generate(m, prompt, opts) {
      const o = opts || {}, rand = B.rngOf(o), inv = 1 / B.temp(o.temperature, 1);
      const max = o.maxTokens == null ? 40 : Math.max(0, o.maxTokens | 0);
      const p = String(prompt == null ? '' : prompt);
      const c = context(m, p), ctx = c.ctx, st = c.st, tight = /\s$/.test(p), pieces = [];
      let prev = c.prev;
      for (let i = 0; i < max && m.tokens; i++) {
        const ids = [], w = [];
        let total = 0;
        lookup(m, ctx).forEach(function (count, id) {
          const x = inv === 1 ? count : Math.pow(count, inv);
          ids.push(id);
          w.push(x);
          total += x;
        });
        const id = ids[B.pick(w, w.length, total, rand())], tok = m.words[id], sp = gap(prev, tok, st);
        pieces.push((i === 0 && tight ? '' : sp) + tok);
        prev = tok;
        ctx.push(id);
        if (ctx.length > m.n) ctx.shift();
      }
      return { text: p + pieces.join(''), pieces };
    }

    function next(m, text, temperature) {
      const inv = 1 / B.temp(temperature, 1), out = [];
      if (!m.tokens) return out;
      let total = 0;
      lookup(m, context(m, String(text == null ? '' : text).slice(-400)).ctx).forEach(function (count, id) {
        const x = Math.pow(count, inv);
        out.push({ token: m.words[id], p: x });
        total += x;
      });
      out.sort(function (a, b) { return b.p - a.p; });
      out.length = Math.min(out.length, 5);
      for (let i = 0; i < out.length; i++) out[i].p /= total;
      return out;
    }

    return { tokens, build, generate, next };
  };

  // Tiny Brain: running a trained character-level network (no training code in here).
  const nnRt = function (B) {
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const NAMES = ['E', 'W1', 'b1', 'W2', 'b2'];

    function decode(s) {
      const n = Math.floor(s.length * 3 / 4) - (s.slice(-2) === '==' ? 2 : s.slice(-1) === '=' ? 1 : 0);
      const out = new Uint8Array(n), lut = new Uint8Array(128);
      for (let i = 0; i < 64; i++) lut[B64.charCodeAt(i)] = i;
      for (let i = 0, o = 0; i < s.length; i += 4) {
        const v = lut[s.charCodeAt(i) & 127] << 18 | lut[s.charCodeAt(i + 1) & 127] << 12
          | lut[s.charCodeAt(i + 2) & 127] << 6 | lut[s.charCodeAt(i + 3) & 127];
        if (o < n) out[o++] = v >> 16 & 255;
        if (o < n) out[o++] = v >> 8 & 255;
        if (o < n) out[o++] = v & 255;
      }
      return out;
    }

    /* One flat weight array P, with a named view per tensor. */
    function wire(br, P) {
      const V = br.vocab.length, D = br.ctx * br.emb, H = br.hidden;
      const sizes = [V * br.emb, H * D, H, V * H, V];
      const total = sizes[0] + sizes[1] + sizes[2] + sizes[3] + sizes[4];
      br.P = P || new Float32Array(total);
      if (br.P.length !== total) throw new Error('LM: weights do not match the model shape');
      for (let i = 0, o = 0; i < 5; o += sizes[i], i++) br[NAMES[i]] = br.P.subarray(o, o + sizes[i]);
      br.map = new Map();
      for (let i = 0; i < V; i++) br.map.set(br.vocab[i], i);
      br.fb = br.map.has(' ') ? br.map.get(' ') : 0;
      br.pad = br.map.has('\n') ? br.map.get('\n') : br.fb;
      br.tmp = { x: new Float64Array(D), h: new Float64Array(H), p: new Float64Array(V), ids: new Int32Array(br.ctx) };
      return br;
    }

    function load(p) {
      const br = wire({
        kind: 'nn', vocab: Array.from(p.vocab), ctx: p.ctx, emb: p.emb, hidden: p.hidden,
        step: p.step || 0, loss: p.loss == null ? null : p.loss,
      });
      const bytes = decode(p.w.d);
      if (bytes.length !== br.P.length) throw new Error('LM: weights do not match the model shape');
      for (let i = 0, o = 0; i < 5; i++) {
        const w = br[NAMES[i]], s = p.w.s[i] / 127;
        for (let j = 0; j < w.length; j++) w[j] = (bytes[o++] - 128) * s;
      }
      return br;
    }

    /* Last ctx characters of text as ids, left-padded with the line-break id. */
    function context(br, text, ids) {
      const n = br.ctx, cs = Array.from(B.norm(String(text == null ? '' : text).slice(-(n * 4 + 16))));
      for (let c = 0; c < n; c++) {
        const j = cs.length - n + c;
        const id = j < 0 ? undefined : br.map.get(cs[j]);
        ids[c] = j < 0 ? br.pad : id === undefined ? br.fb : id;
      }
      return ids;
    }

    /* Forward pass: embeddings side by side -> tanh layer -> softmax (with temperature T) into out. */
    function probs(br, ids, T, out) {
      const emb = br.emb, H = br.hidden, V = br.vocab.length, D = br.ctx * emb;
      const E = br.E, W1 = br.W1, b1 = br.b1, W2 = br.W2, b2 = br.b2, x = br.tmp.x, h = br.tmp.h;
      for (let c = 0; c < br.ctx; c++) {
        const s = ids[c] * emb, d = c * emb;
        for (let e = 0; e < emb; e++) x[d + e] = E[s + e];
      }
      for (let j = 0, r = 0; j < H; j++, r += D) {
        let a = b1[j];
        for (let k = 0; k < D; k++) a += W1[r + k] * x[k];
        h[j] = Math.tanh(a);
      }
      let top = -Infinity, z = 0;
      for (let v = 0, r = 0; v < V; v++, r += H) {
        let a = b2[v];
        for (let j = 0; j < H; j++) a += W2[r + j] * h[j];
        a /= T;
        out[v] = a;
        if (a > top) top = a;
      }
      for (let v = 0; v < V; v++) { const e = Math.exp(out[v] - top); out[v] = e; z += e; }
      for (let v = 0; v < V; v++) out[v] /= z;
      return out;
    }

    function generate(br, prompt, opts) {
      const o = opts || {}, rand = B.rngOf(o), T = B.temp(o.temperature, 0.8);
      const max = o.maxChars == null ? 160 : Math.max(0, o.maxChars | 0);
      const p = String(prompt == null ? '' : prompt);
      const ids = context(br, p, br.tmp.ids), V = br.vocab.length, out = br.tmp.p, pieces = [];
      for (let i = 0; i < max; i++) {
        probs(br, ids, T, out);
        const id = B.pick(out, V, 1, rand());
        pieces.push(br.vocab[id]);
        ids.copyWithin(0, 1);
        ids[br.ctx - 1] = id;
      }
      return { text: p + pieces.join(''), pieces };
    }

    function next(br, text, temperature) {
      const out = probs(br, context(br, text, br.tmp.ids), B.temp(temperature, 1), br.tmp.p), list = [];
      for (let v = 0; v < br.vocab.length; v++) list.push({ token: br.vocab[v], p: out[v] });
      list.sort(function (a, b) { return b.p - a.p; });
      list.length = Math.min(list.length, 5);
      return list;
    }

    return { NAMES, wire, load, context, probs, generate, next };
  };

  const B = baseRt();
  const NG = ngramRt(B);
  const NN = nnRt(B);

  // ---------- text ----------
  const WORD = /\d+(?:[.,:]\d+)+|[\p{L}\p{N}\p{M}_]+(?:['-][\p{L}\p{N}\p{M}_]+)*/gu;
  // Counts describe the cleaned text, i.e. what a model would actually read.
  function stats(text) {
    const s = B.clean(text), words = s.match(WORD) || [];
    return { chars: s.length, words: words.length, uniqueWords: new Set(words.map((w) => w.toLowerCase())).size };
  }

  // ---------- copycat ----------
  const ngram = {
    train: (text, n) => NG.build(B.clean(text), n),
    generate: (model, prompt, opts) => NG.generate(model, prompt, opts),
    next: (model, contextText, temperature) => NG.next(model, contextText, temperature),
  };

  // ---------- tiny brain ----------
  const MAX_VOCAB = 96;
  const HELD_OUT = 0.1;
  const size = (v, d) => (v >= 1 ? Math.floor(v) : d);

  // Encode text with the brain's alphabet and (re)allocate optimiser state. The last 10% is held out.
  function bind(br, chars) {
    const N = chars.length, data = new Uint8Array(N);
    for (let i = 0; i < N; i++) { const id = br.map.get(chars[i]); data[i] = id === undefined ? br.fb : id; }
    br.data = data;
    br.split = N < 20 ? N : Math.floor(N * (1 - HELD_OUT));
    if (!br.G) {
      const A = br.P.constructor, n = br.P.length;
      br.G = new A(n); br.M = new A(n); br.S = new A(n);
      br.t = 0;
      br.last = NaN;
      br.tr = { dh: new Float64Array(br.hidden), dx: new Float64Array(br.ctx * br.emb), pos: new Int32Array(32) };
      br.rand = B.mulberry((B.seedOf(br.seed == null ? 1 : br.seed) ^ Math.imul(br.step + 1, 0x9E3779B1)) >>> 0);
    }
    return br;
  }
  function chars(text) { return Array.from(B.clean(text) || '\n'); }

  function create(text, opts) {
    const o = opts || {}, cs = chars(text), freq = new Map();
    for (const c of cs) freq.set(c, (freq.get(c) || 0) + 1);
    const vocab = Array.from(freq.keys()).sort((a, b) => freq.get(b) - freq.get(a) || (a < b ? -1 : 1)).slice(0, MAX_VOCAB);
    const br = { kind: 'nn', vocab, ctx: size(o.ctx, 8), emb: size(o.emb, 16), hidden: size(o.hidden, 96), step: 0, loss: null };
    NN.wire(br, o.f64 ? new Float64Array(vocab.length * br.emb + br.hidden * (br.ctx * br.emb + 1 + vocab.length) + vocab.length) : null);
    br.seed = o.seed == null ? 1 : o.seed;
    const rand = B.mulberry(B.seedOf(br.seed));
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const fill = (w, sd) => { for (let i = 0; i < w.length; i++) w[i] = gauss() * sd; };
    fill(br.E, 0.5);
    fill(br.W1, (5 / 3) / Math.sqrt(br.ctx * br.emb));
    fill(br.W2, 0.1 / Math.sqrt(br.hidden));
    return bind(br, cs);
  }
  function attach(brain, text) { return bind(brain, chars(text)); }

  // Mean cross-entropy over the targets at pos[0..nb), with its gradient left in br.G (hand-written backprop).
  function grads(br, pos, nb) {
    const ctx = br.ctx, emb = br.emb, H = br.hidden, V = br.vocab.length, D = ctx * emb;
    const P = br.P, G = br.G, data = br.data, pad = br.pad;
    const oW1 = V * emb, ob1 = oW1 + H * D, oW2 = ob1 + H, ob2 = oW2 + V * H;
    const x = br.tmp.x, h = br.tmp.h, p = br.tmp.p, ids = br.tmp.ids, dh = br.tr.dh, dx = br.tr.dx;
    const inv = 1 / nb;
    let loss = 0;
    G.fill(0);
    for (let b = 0; b < nb; b++) {
      const t = pos[b], y = data[t];
      for (let c = 0; c < ctx; c++) {
        const j = t - ctx + c, id = j < 0 ? pad : data[j], s = id * emb, d = c * emb;
        ids[c] = id;
        for (let e = 0; e < emb; e++) x[d + e] = P[s + e];
      }
      for (let j = 0, r = oW1; j < H; j++, r += D) {
        let a = P[ob1 + j];
        for (let k = 0; k < D; k++) a += P[r + k] * x[k];
        h[j] = Math.tanh(a);
      }
      let top = -Infinity, z = 0;
      for (let v = 0, r = oW2; v < V; v++, r += H) {
        let a = P[ob2 + v];
        for (let j = 0; j < H; j++) a += P[r + j] * h[j];
        p[v] = a;
        if (a > top) top = a;
      }
      for (let v = 0; v < V; v++) { const e = Math.exp(p[v] - top); p[v] = e; z += e; }
      loss -= Math.log(p[y] / z + 1e-30);
      // Backward: softmax + cross-entropy gives (p - onehot); then through W2, tanh, W1 and into the embeddings.
      dh.fill(0);
      for (let v = 0, r = oW2; v < V; v++, r += H) {
        const d = (p[v] / z - (v === y ? 1 : 0)) * inv;
        G[ob2 + v] += d;
        for (let j = 0; j < H; j++) { G[r + j] += d * h[j]; dh[j] += d * P[r + j]; }
      }
      dx.fill(0);
      for (let j = 0, r = oW1; j < H; j++, r += D) {
        const d = dh[j] * (1 - h[j] * h[j]);
        G[ob1 + j] += d;
        for (let k = 0; k < D; k++) { G[r + k] += d * x[k]; dx[k] += d * P[r + k]; }
      }
      for (let c = 0; c < ctx; c++) {
        const s = ids[c] * emb, d = c * emb;
        for (let e = 0; e < emb; e++) G[s + e] += dx[d + e];
      }
    }
    return loss * inv;
  }

  function adam(br, lr) {
    const P = br.P, G = br.G, M = br.M, S = br.S, n = P.length;
    const t = ++br.t, a = lr * Math.sqrt(1 - Math.pow(0.999, t)) / (1 - Math.pow(0.9, t));
    for (let i = 0; i < n; i++) {
      const g = G[i], m = 0.9 * M[i] + 0.1 * g, s = 0.999 * S[i] + 0.001 * g * g;
      M[i] = m;
      S[i] = s;
      P[i] -= a * m / (Math.sqrt(s) + 1e-8);
    }
  }

  function needData(br, who) { if (!br.data) throw new Error(`LM.nn.${who}: this brain has no text, call LM.nn.attach(brain, text) first`); }

  function train(brain, steps, opts) {
    needData(brain, 'train');
    const o = opts || {}, nb = size(o.batch, 32), lr = o.lr > 0 ? +o.lr : 0.003, n = size(steps, 0);
    if (!n) return brain.last;
    if (brain.tr.pos.length < nb) brain.tr.pos = new Int32Array(nb);
    const pos = brain.tr.pos, span = brain.split;
    let sum = 0;
    for (let s = 0; s < n; s++) {
      for (let b = 0; b < nb; b++) pos[b] = Math.floor(brain.rand() * span);
      sum += grads(brain, pos, nb);
      adam(brain, lr);
    }
    brain.step += n;
    return (brain.last = sum / n);
  }

  // Evenly spaced targets from the held-out tail (or from everything when the text is too short to split).
  function evalLoss(brain, n) {
    needData(brain, 'evalLoss');
    const data = brain.data, N = data.length, lo = brain.split < N ? brain.split : 0, span = N - lo;
    const m = Math.min(span, size(n, 512)), ids = brain.tmp.ids, out = brain.tmp.p;
    let sum = 0;
    for (let i = 0; i < m; i++) {
      const t = lo + Math.floor(i * span / m);
      for (let c = 0; c < brain.ctx; c++) { const j = t - brain.ctx + c; ids[c] = j < 0 ? brain.pad : data[j]; }
      sum -= Math.log(NN.probs(brain, ids, 1, out)[data[t]] + 1e-30);
    }
    return (brain.loss = sum / m);
  }

  const nn = {
    create, train, evalLoss, attach,
    generate: (brain, prompt, opts) => NN.generate(brain, prompt, opts),
    next: (brain, contextText, temperature) => NN.next(brain, contextText, temperature),
    paramCount: (brain) => brain.P.length,
    // Test hook: loss and gradient (in brain.G) for chosen target positions, without an optimiser step.
    lossAndGrads: (brain, positions) => { needData(brain, 'lossAndGrads'); return grads(brain, positions, positions.length); },
  };

  // ---------- saving ----------
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function encode64(bytes) {
    const out = [];
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
      out.push(B64[a >> 2], B64[(a & 3) << 4 | b >> 4], i + 1 < bytes.length ? B64[(b & 15) << 2 | c >> 6] : '=', i + 2 < bytes.length ? B64[c & 63] : '=');
    }
    return out.join('');
  }
  // Each tensor is stored as one byte per weight: round(w / scale * 127) + 128, where scale is its largest |w|.
  function pack(model) {
    if (model.kind === 'ngram') return { kind: 'ngram', n: model.n, text: model.text };
    if (model.kind !== 'nn') throw new Error('LM.pack: unknown model');
    const bytes = new Uint8Array(model.P.length), scales = [];
    let o = 0;
    for (const name of NN.NAMES) {
      const w = model[name];
      let top = 0;
      for (let i = 0; i < w.length; i++) { const a = Math.abs(w[i]); if (a > top) top = a; }
      const scale = +(top || 1).toPrecision(7);
      scales.push(scale);
      for (let i = 0; i < w.length; i++) {
        const q = Math.round(w[i] / scale * 127);
        bytes[o++] = (q > 127 ? 127 : q < -127 ? -127 : q) + 128;
      }
    }
    const loss = model.data ? evalLoss(model) : model.loss;
    return {
      kind: 'nn', vocab: model.vocab.join(''), ctx: model.ctx, emb: model.emb, hidden: model.hidden, step: model.step,
      loss: Number.isFinite(loss) ? +loss.toFixed(4) : null, w: { s: scales, d: encode64(bytes) },
    };
  }
  function unpack(obj) {
    if (obj && obj.kind === 'ngram') return ngram.train(obj.text, obj.n);
    if (obj && obj.kind === 'nn') return NN.load(obj);
    throw new Error('LM.unpack: unknown model');
  }

  // ---------- take-home file ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
  // JSON that is safe inside a script element: no tag can open or close in it.
  const scriptJson = (v) => JSON.stringify(v).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${`000${c.charCodeAt(0).toString(16)}`.slice(-4)}`);
  const clip = (v, n) => Array.from(String(v == null ? '' : v).replace(/\s+/g, ' ').trim()).slice(0, n).join('');
  const count = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, ',');

  const EXPORT_CSS = `:root{--bg:#f3f5fb;--card:#fff;--ink:#15171f;--mute:#585e72;--line:#d5d9ea;--acc:#3b5bff;--on:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#0f1117;--card:#191c26;--ink:#f2f3f8;--mute:#a4a9bd;--line:#2f3447;--acc:#93a4ff;--on:#0c0e15}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{max-width:34rem;margin:0 auto;padding:calc(28px + env(safe-area-inset-top,0px)) 16px calc(36px + env(safe-area-inset-bottom,0px))}
.kind{margin:0 0 6px;color:var(--acc);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
h1{margin:0 0 10px;font-size:30px;line-height:1.15;overflow-wrap:anywhere}
h2{margin:0 0 6px;font-size:17px}
p{margin:0 0 6px;overflow-wrap:anywhere}
.meta{color:var(--mute);font-size:15px}
.how{margin:14px 0 18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px;margin:0 0 16px}
label{display:flex;justify-content:space-between;margin:0 0 6px;font-weight:600;font-size:15px}
textarea{display:block;width:100%;margin:0 0 14px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit;resize:vertical}
input[type=range]{display:block;width:100%;margin:0 0 4px;accent-color:var(--acc)}
.ends{display:flex;justify-content:space-between;margin:0 0 14px;color:var(--mute);font-size:13px}
button{display:block;width:100%;min-height:50px;border:0;border-radius:14px;background:var(--acc);color:var(--on);font:inherit;font-weight:700;font-size:17px}
button:active{opacity:.8}
textarea:focus-visible,input:focus-visible,button:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.out{min-height:7.5em;margin:14px 0 0;padding:12px;border-radius:12px;background:var(--bg);color:var(--mute);white-space:pre-wrap;overflow-wrap:anywhere}
.out.on{color:var(--ink)}
.out b{color:var(--acc)}
pre{margin:10px 0 0;padding:12px;border-radius:12px;background:var(--bg);font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}
footer{color:var(--mute);font-size:13px;text-align:center}`;

  // Page behaviour. Kept free of line comments and of anything that could be read as a link.
  const EXPORT_UI = `(function () {
  'use strict';
  var data = JSON.parse(document.getElementById('model').textContent);
  var model = Engine.load(data.model), brain = data.model.kind === 'nn';
  var $ = function (id) { return document.getElementById(id); };
  var start = $('start'), heat = $('heat'), heatv = $('heatv'), out = $('out');
  var timer = 0, runs = 0;
  function label() { heatv.textContent = (+heat.value).toFixed(1); }
  function run() {
    clearInterval(timer);
    var prompt = start.value;
    var res = Engine.generate(model, prompt, { temperature: +heat.value, seed: (Date.now() + (++runs) * 7919) >>> 0, maxTokens: 60, maxChars: 240 });
    var pieces = res.pieces, i = 0;
    var head = document.createElement('b'), tail = document.createElement('span');
    head.textContent = prompt;
    out.textContent = '';
    out.className = 'out on';
    out.appendChild(head);
    out.appendChild(tail);
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { tail.textContent = pieces.join(''); return; }
    timer = setInterval(function () {
      if (i >= pieces.length) { clearInterval(timer); return; }
      tail.textContent += pieces[i++];
    }, brain ? 16 : 70);
  }
  heat.addEventListener('input', label);
  $('go').addEventListener('click', run);
  label();
  $('static').hidden = true;
  $('play').hidden = false;
})();`;

  function exportHtml(packed, meta) {
    const m = meta || {}, brain = packed.kind === 'nn', model = unpack(packed);
    const info = { name: clip(m.name, 80) || 'My tiny model', madeBy: clip(m.madeBy, 80), trainedOn: clip(m.trainedOn, 120), date: clip(m.date, 40) };
    const samples = [1, 2, 3].map((seed) => (brain
      ? NN.generate(model, '', { seed, maxChars: 140 })
      : NG.generate(model, '', { seed, maxTokens: 28 })).text.trim());
    const how = brain
      ? `This is a tiny neural network. It reads the last ${model.ctx} characters and guesses the next one, using ${count(model.P.length)} numbers it tuned over ${count(model.step)} practice steps.`
      : `This is a copycat model. It looks at the last ${model.n === 1 ? 'word' : `${model.n} words`} and picks a word that followed ${model.n === 1 ? 'it' : 'them'} somewhere in its ${count(model.tokens)}-word training text.`;
    const by = [info.madeBy && `Made by ${esc(info.madeBy)}`, esc(info.date)].filter(Boolean).join(' &middot; ');
    const engine = brain
      ? `var Engine = (function (B) { var R = (${nnRt})(B); return { load: R.load, generate: R.generate }; })((${baseRt})());`
      : `var Engine = (function (B) { var R = (${ngramRt})(B); return { load: function (p) { return R.build(p.text, p.n); }, generate: R.generate }; })((${baseRt})());`;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
<title>${esc(info.name)}</title>
<style>
${EXPORT_CSS}
</style>
</head>
<body>
<main>
<p class="kind">${brain ? 'Tiny Brain' : 'Copycat'}</p>
<h1>${esc(info.name)}</h1>
${by ? `<p class="meta">${by}</p>\n` : ''}${info.trainedOn ? `<p class="meta">Trained on ${esc(info.trainedOn)}</p>\n` : ''}<p class="how">${how}</p>
<section class="card" id="play" hidden>
<label for="start">Starting words</label>
<textarea id="start" rows="2" autocapitalize="sentences" placeholder="Type a few words, or leave this empty"></textarea>
<label for="heat">Creativity <output id="heatv" for="heat"></output></label>
<input id="heat" type="range" min="0.2" max="1.6" step="0.1" value="${brain ? '0.8' : '1'}">
<div class="ends"><span>Careful</span><span>Wild</span></div>
<button id="go" type="button">Generate</button>
<div class="out" id="out" aria-live="polite">Tap Generate and the model starts writing here.</div>
</section>
<section class="card" id="static">
<h2>Things this model wrote</h2>
<p class="meta">This preview cannot run the model. Open the file in a web browser to write with it yourself.</p>
${samples.map((s) => `<pre>${esc(s)}</pre>`).join('\n')}
</section>
<footer>Built in the Attention Span Lab. The whole model lives in this file and it works offline.</footer>
</main>
<script type="application/json" id="model">${scriptJson({ meta: info, model: packed })}<\/script>
<script id="engine">
'use strict';
${engine}
<\/script>
<script id="ui">
${EXPORT_UI}
<\/script>
</body>
</html>
`;
  }

  return { clean: B.clean, stats, ngram, nn, pack, unpack, exportHtml };
})();
