// Checks the Lab's model engine (src/lm.js) and the starter packs. Usage: node tools/test_lm.mjs
import fs from 'node:fs';
import vm from 'node:vm';
const LM = new Function(fs.readFileSync(new URL('../src/lm.js', import.meta.url), 'utf8') + '\nreturn LM;')();
const packs = JSON.parse(fs.readFileSync(new URL('../content/lab/datasets.json', import.meta.url), 'utf8')).packs;
let failed = 0;
const ok = (cond, name, extra = '') => { if (!cond) failed++; console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${extra ? ' · ' + extra : ''}`); };

const messy = LM.clean('  “Hi”  —  there\r\n\r\n\r\n\r\nyou\u0007  ');
ok(messy === '"Hi" - there\n\nyou', 'clean normalises quotes, dashes, spaces and blank lines', JSON.stringify(messy));
ok(LM.stats(messy).words === 3 && LM.stats(messy).chars === messy.length, 'stats counts words and characters');

// Numerical gradient check on a tiny brain (64-bit weights so the finite differences are exact enough).
{
  const b = LM.nn.create('the cat sat on the mat. the dog sat on the log. '.repeat(6), { ctx: 3, emb: 4, hidden: 6, seed: 3, f64: true });
  const pos = [5, 9, 14, 22, 31];
  LM.nn.lossAndGrads(b, pos);
  const G = Array.from(b.G), P = b.P;
  let worst = 0, checked = 0;
  for (let i = 0; i < P.length; i += Math.max(1, Math.floor(P.length / 60))) {
    const old = P[i], h = 1e-5;
    P[i] = old + h; const up = LM.nn.lossAndGrads(b, pos);
    P[i] = old - h; const dn = LM.nn.lossAndGrads(b, pos);
    P[i] = old;
    const numeric = (up - dn) / (2 * h);
    if (Math.abs(numeric) < 1e-7 && Math.abs(G[i]) < 1e-7) continue;
    worst = Math.max(worst, Math.abs(numeric - G[i]) / (Math.abs(numeric) + Math.abs(G[i])));
    checked++;
  }
  ok(checked > 20 && worst < 1e-3, 'backpropagation matches numerical gradients', `${checked} weights checked, worst relative error ${worst.toExponential(2)}`);
}

for (const p of packs) {
  const text = LM.clean(p.text);
  ok(text.length >= 3500 && !/[^\x09\x0A\x20-\x7E]/.test(text), `pack ${p.id} is plain ASCII and long enough`, `${text.length} chars`);
  for (const n of [1, 2, 3]) {
    const m = LM.ngram.train(text, n);
    const g = LM.ngram.generate(m, 'The', { maxTokens: 30, temperature: 1, seed: 4 });
    ok('The' + g.pieces.join('') === g.text && !/ [.,!?;:]/.test(g.text), `pack ${p.id} copycat n=${n} generates clean text`);
    if (n === 2) {
      const again = LM.ngram.generate(LM.unpack(JSON.parse(JSON.stringify(LM.pack(m)))), 'The', { maxTokens: 30, temperature: 1, seed: 4 });
      ok(again.text === g.text, `pack ${p.id} copycat survives save and load`);
      ok(LM.ngram.generate(m, 'zzqx never seen', { maxTokens: 6, seed: 1 }).pieces.length > 0 && LM.ngram.generate(m, '', { maxTokens: 6, seed: 1 }).text.length > 0, `pack ${p.id} copycat backs off on unseen and empty prompts`);
    }
  }
  const b = LM.nn.create(text, { seed: 2 });
  const start = LM.nn.train(b, 20);
  const t0 = Date.now();
  LM.nn.train(b, 2880);
  const ms = Date.now() - t0;
  const trained = LM.nn.train(b, 100);
  const end = LM.nn.evalLoss(b);
  const sample = LM.nn.generate(b, '', { maxChars: 90, temperature: 0.8, seed: 3 }).text;
  ok(trained < start * 0.6, `pack ${p.id} tiny brain learns`, `error ${start.toFixed(2)} -> ${trained.toFixed(2)} (unseen text ${end.toFixed(2)}), ${Math.round(2880 / (ms / 1000))} steps/s, sample ${JSON.stringify(sample.slice(0, 70))}`);
  const packed = LM.pack(b);
  const size = JSON.stringify(packed).length;
  const back = LM.unpack(JSON.parse(JSON.stringify(packed)));
  LM.nn.attach(back, text);
  ok(size < 40000 && Math.abs(LM.nn.evalLoss(back) - end) < 0.15, `pack ${p.id} tiny brain survives save and load`, `${size} bytes`);
  if (p.id === packs[0].id) {
    for (const [kind, pk] of [['brain', packed], ['copycat', LM.pack(LM.ngram.train(text, 2))]]) {
      const html = LM.exportHtml(pk, { name: '</script><b>"x\'', madeBy: 'A & B', trainedOn: p.title, date: '2026-11-09' });
      ok(!/https?:\/\/|src=["']\/\//.test(html) && html.length < 150000 && (html.match(/<\/script>/g) || []).length === 3, `exported ${kind} page is self-contained and survives a hostile name`, `${html.length} bytes`);
      const extra = LM.exportHtml(pk, { name: 'x', photo: 'data:image/jpeg;base64,AAAA', link: 'https://example.org/app/' });
      const hostile = LM.exportHtml(pk, { name: 'x', photo: 'data:text/html;base64,AAAA', link: 'javascript:alert(1)' });
      ok(extra.includes('<img class="who" src="data:image/jpeg;base64,AAAA"') && extra.includes('href="https://example.org/app/"') && !hostile.includes('<img') && !hostile.includes('javascript:'), `exported ${kind} page takes a safe photo and link and drops unsafe ones`);
      const engine = html.split('<script id="engine">')[1].split('</script>')[0];
      let ran = true;
      try { vm.runInNewContext(engine, {}); } catch (e) { ran = false; console.log(e.message); }
      ok(ran, `exported ${kind} engine code runs on its own`);
    }
  }
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
