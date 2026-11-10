"""Validate Fluency chapter files and the Daily Drop pool against content/fluency/GUIDE.md.
Usage: python3 validate_fluency.py content/fluency/f1.json [...] [content/daily.json]"""
import json, os, re, sys
from collections import Counter

ICONS = set("dice chain scale brain token book vector layers eye target wrench rocket chip chat robot flask dna graph chart bird puzzle spark shield gauge memory tune filter compass trophy code".split())
JARGON = "stochastic logits softmax backpropagation tensor hyperparameter epoch corpus inference n-gram vector latent gradient".split()
QTYPES = ("mcq", "tf", "cloze", "order", "match", "sort")
errors, warnings = [], []

def err(where, msg): errors.append(f"{where}: {msg}")
def warn(where, msg): warnings.append(f"{where}: {msg}")
def words(s): return len(re.findall(r"\S+", s or ""))

def check_str(where, v, name, maxlen=None, maxwords=None):
    if not isinstance(v, str) or not v.strip():
        err(where, f"{name} must be a non-empty string"); return False
    if maxlen and len(v) > maxlen: err(where, f"{name} longer than {maxlen} chars ({len(v)})")
    if maxwords and words(v) > maxwords: err(where, f"{name} longer than {maxwords} words ({words(v)})")
    if "`" in v: err(where, f"{name} contains a backtick (no code in this track)")
    low = v.lower()
    for j in JARGON:
        if re.search(r"(?<![a-z])" + re.escape(j) + r"s?(?![a-z])", low): warn(where, f"{name} uses jargon '{j}'")
    if "!" in v: warn(where, f"{name} contains an exclamation mark")
    return True

def check_options(where, q, maxlen):
    opts = q.get("options")
    if not isinstance(opts, list) or not 3 <= len(opts) <= 4 or not all(isinstance(o, str) for o in opts):
        err(where, "options must be a list of 3-4 strings"); return
    for o in opts: check_str(where, o, "option", maxlen)
    if len(set(o.strip().lower() for o in opts)) != len(opts): err(where, "options not unique")
    a = q.get("answer")
    if not isinstance(a, int) or isinstance(a, bool) or not 0 <= a < len(opts):
        err(where, "answer must be a valid option index"); return
    lens = [len(o) for o in opts]
    others = max(l for i, l in enumerate(lens) if i != a)
    if lens[a] > others * 1.35 and lens[a] - others > 8: warn(where, "correct option is much longer than the others")

def check_play(where, p):
    if not isinstance(p, dict): err(where, "play must be an object"); return
    k = p.get("kind")
    if k == "predict":
        check_str(where, p.get("prompt"), "play.prompt", 60)
        ws = p.get("words")
        if not isinstance(ws, list) or not 3 <= len(ws) <= 5: err(where, "predict needs 3-5 words"); return
        tot = 0
        for w in ws:
            if not (isinstance(w, list) and len(w) == 2 and isinstance(w[0], str) and isinstance(w[1], int)):
                err(where, "predict words must be [word, whole-number percent]"); return
            if len(w[0]) > 12: err(where, f"predict word '{w[0]}' longer than 12 chars")
            tot += w[1]
        if tot != 100: err(where, f"predict percentages add up to {tot}, not 100")
        if "slider" in p and not isinstance(p["slider"], bool): err(where, "predict slider must be true or false")
    elif k == "tokens":
        t, pcs = p.get("text"), p.get("pieces")
        check_str(where, t, "play.text", 60)
        if not isinstance(pcs, list) or not 3 <= len(pcs) <= 14 or not all(isinstance(x, str) and x for x in pcs):
            err(where, "tokens needs 3-14 non-empty pieces"); return
        if "".join(pcs) != t: err(where, "token pieces joined do not equal text")
    elif k == "attention":
        sets = p.get("sets")
        if not isinstance(sets, list) or not 1 <= len(sets) <= 2: err(where, "attention needs 1-2 sets"); return
        for s in sets:
            ws, wt, f = s.get("words"), s.get("weights"), s.get("focus")
            if not isinstance(ws, list) or not 5 <= len(ws) <= 12: err(where, "attention set needs 5-12 words"); continue
            if any(not isinstance(w, str) or len(w) > 10 for w in ws): err(where, "attention words must be strings of at most 10 chars")
            if not isinstance(wt, list) or len(wt) != len(ws) or any(not isinstance(x, (int, float)) or not 0 <= x <= 1 for x in wt):
                err(where, "attention weights must be one 0-1 number per word")
            if not isinstance(f, int) or not 0 <= f < len(ws): err(where, "attention focus must be a word index")
            check_str(where, s.get("note"), "attention note", 80)
    elif k == "map":
        pts = p.get("points")
        if not isinstance(pts, list) or not 6 <= len(pts) <= 10: err(where, "map needs 6-10 points"); return
        groups = set()
        for pt in pts:
            if not (isinstance(pt, list) and len(pt) == 4 and isinstance(pt[0], str) and isinstance(pt[3], str)
                    and all(isinstance(pt[i], (int, float)) and 5 <= pt[i] <= 95 for i in (1, 2))):
                err(where, "map point must be [label, x 5-95, y 5-95, group]"); return
            if len(pt[0]) > 10: err(where, f"map label '{pt[0]}' longer than 10 chars")
            if len(pt[3]) > 12: err(where, f"map group '{pt[3]}' longer than 12 chars")
            groups.add(pt[3])
        if not 2 <= len(groups) <= 3: err(where, "map needs 2-3 groups")
        for i in range(len(pts)):
            for j in range(i):
                if ((pts[i][1] - pts[j][1]) ** 2 + (pts[i][2] - pts[j][2]) ** 2) ** 0.5 < 10:
                    err(where, f"map points '{pts[i][0]}' and '{pts[j][0]}' are closer than 10 units")
    elif k == "compare":
        for side in ("a", "b"):
            s = p.get(side)
            if not isinstance(s, dict): err(where, f"compare needs side {side}"); continue
            check_str(where, s.get("label"), "compare label", 14); check_str(where, s.get("prompt"), "compare prompt", 150)
            check_str(where, s.get("result"), "compare result", 240)
    elif k == "fit":
        check_str(where, p.get("x"), "fit x", 22); check_str(where, p.get("y"), "fit y", 22)
    elif k == "denoise":
        if p.get("art") not in ("heart", "smile", "star", "bolt"): err(where, "denoise art must be heart, smile, star or bolt")
    elif k == "chat":
        turns = p.get("turns")
        if not isinstance(turns, list) or not 3 <= len(turns) <= 5: err(where, "chat needs 3-5 turns"); return
        for t in turns:
            if not (isinstance(t, list) and len(t) == 2 and t[0] in ("system", "user", "assistant")):
                err(where, "chat turn must be [system|user|assistant, text]"); return
            check_str(where, t[1], "chat text", 110)
    else:
        err(where, f"unknown play kind {k!r}")

def check_question(where, q, stats):
    t = q.get("type")
    check_str(where, q.get("prompt"), "prompt", 150)
    check_str(where, q.get("explain"), "explain", maxwords=40)
    if re.match(r"\s*(correct|right|wrong|incorrect|yes|no)\b[!.,]", (q.get("explain") or "").lower()):
        warn(where, "explain should not open with a verdict; it is shown after right and wrong answers")
    if t == "mcq":
        check_options(where, q, 64)
        if isinstance(q.get("answer"), int): stats["pos"][q["answer"]] += 1
    elif t == "tf":
        if not isinstance(q.get("answer"), bool): err(where, "tf answer must be true or false")
        else: stats["tf"][q["answer"]] += 1
        lab = q.get("labels")
        if lab is not None:
            if not (isinstance(lab, dict) and set(lab) == {"true", "false"}): err(where, 'labels must be {"true": ..., "false": ...}')
            else:
                for v in lab.values(): check_str(where, v, "label", 14)
    elif t == "cloze":
        if (q.get("prompt") or "").count("___") != 1 or "____" in (q.get("prompt") or ""): err(where, "cloze prompt needs exactly one ___")
        check_options(where, q, 26)
        if isinstance(q.get("answer"), int): stats["pos"][q["answer"]] += 1
    elif t == "order":
        it = q.get("items")
        if not isinstance(it, list) or not 3 <= len(it) <= 5 or not all(isinstance(x, str) for x in it): err(where, "order needs 3-5 items")
        else:
            for x in it: check_str(where, x, "item", 42)
            if len(set(it)) != len(it): err(where, "order items not unique")
    elif t == "match":
        pr = q.get("pairs")
        if not isinstance(pr, list) or not 3 <= len(pr) <= 4 or not all(isinstance(x, list) and len(x) == 2 for x in pr):
            err(where, "match needs 3-4 pairs")
        else:
            for l, r in pr: check_str(where, l, "left", 22); check_str(where, r, "right", 46)
            if len(set(p[0] for p in pr)) != len(pr) or len(set(p[1] for p in pr)) != len(pr): err(where, "match sides not unique")
    elif t == "sort":
        b, it = q.get("buckets"), q.get("items")
        if not isinstance(b, list) or len(b) != 2: err(where, "sort needs two buckets")
        else:
            for x in b: check_str(where, x, "bucket", 16)
        if not isinstance(it, list) or not 4 <= len(it) <= 6 or not all(isinstance(x, list) and len(x) == 2 and x[1] in (0, 1) for x in it):
            err(where, "sort needs 4-6 items [text, 0|1]")
        else:
            for x in it: check_str(where, x[0], "sort item", 50)
            if len(set(x[1] for x in it)) != 2: err(where, "sort items must use both buckets")
            if len(set(x[0] for x in it)) != len(it): err(where, "sort items not unique")
    else:
        err(where, f"unknown step type {t!r}")

def bias(path, stats):
    n = sum(stats["pos"].values())
    if n >= 8:
        for i, c in stats["pos"].items():
            if c / n > 0.45: warn(path, f"answer index {i} is correct in {c}/{n} choice questions")
    n = sum(stats["tf"].values())
    if n >= 6 and not 0.3 <= stats["tf"][True] / n <= 0.7: warn(path, f"true/false balance is {stats['tf'][True]}/{n} true")

def check_chapter(path):
    try: ch = json.load(open(path, encoding="utf-8"))
    except Exception as e: err(path, f"invalid JSON: {e}"); return
    cid = ch.get("id")
    if cid != os.path.splitext(os.path.basename(path))[0]: err(path, "id must match the file name")
    check_str(path, ch.get("title"), "title", 28); check_str(path, ch.get("blurb"), "blurb", 64)
    ss = ch.get("sessions")
    if not isinstance(ss, list) or len(ss) != 5: err(path, "a chapter needs exactly 5 sessions"); return
    stats = {"pos": Counter(), "tf": Counter()}
    for si, s in enumerate(ss, 1):
        w = f"{path}:{s.get('id', si)}"
        if s.get("id") != f"{cid}-{si}": err(w, f"session id should be {cid}-{si}")
        check_str(w, s.get("title"), "title", 30); check_str(w, s.get("goal"), "goal", 80)
        check_str(w, s.get("takeaway"), "takeaway", maxwords=24); check_str(w, s.get("tryit"), "tryit", maxwords=30)
        if s.get("icon") not in ICONS: err(w, f"unknown icon {s.get('icon')!r}")
        steps = s.get("steps")
        if not isinstance(steps, list) or not steps: err(w, "steps must be a non-empty list"); continue
        kinds = [st.get("type") for st in steps]
        cards = kinds.count("card"); qs = len(kinds) - cards
        if kinds[0] != "card": err(w, "first step must be a card")
        if not 3 <= cards <= 4: err(w, f"needs 3-4 cards, has {cards}")
        if not 6 <= qs <= 7: err(w, f"needs 6-7 questions, has {qs}")
        run_c = run_q = 0
        for k in kinds:
            run_c, run_q = (run_c + 1, 0) if k == "card" else (0, run_q + 1)
            if run_c > 2: err(w, "more than 2 cards in a row"); break
            if run_q > 3: err(w, "more than 3 questions in a row"); break
        qk = [k for k in kinds if k != "card"]
        if len(set(qk)) < 3: err(w, "use at least 3 different question types")
        if qk.count("mcq") > 3: err(w, "at most 3 mcq per session")
        for i, st in enumerate(steps, 1):
            ww = f"{w}#{i}"
            if st.get("type") == "card":
                check_str(ww, st.get("title"), "card title", 36)
                check_str(ww, st.get("body"), "card body", maxwords=34 if st.get("play") else 50)
                if st.get("code"): err(ww, "no code in this track")
                if st.get("play") is not None: check_play(ww, st["play"])
            else:
                check_question(ww, st, stats)
    bias(path, stats)

def check_daily(path):
    try: d = json.load(open(path, encoding="utf-8"))
    except Exception as e: err(path, f"invalid JSON: {e}"); return
    qs = d.get("questions")
    if not isinstance(qs, list) or len(qs) < 80: err(path, "daily pool needs at least 80 questions"); return
    stats = {"pos": Counter(), "tf": Counter()}
    seen = set()
    for i, q in enumerate(qs, 1):
        w = f"{path}#{i}"
        if q.get("type") not in ("mcq", "tf"): err(w, "daily questions must be mcq or tf"); continue
        check_question(w, q, stats)
        if q.get("prompt") in seen: err(w, "duplicate prompt")
        seen.add(q.get("prompt"))
    bias(path, stats)
    kinds = Counter(q.get("type") for q in qs)
    if min(kinds.get("mcq", 0), kinds.get("tf", 0)) < len(qs) * 0.35: warn(path, f"aim for a near-even mix of mcq and tf, got {dict(kinds)}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        (check_daily if os.path.basename(p) == "daily.json" else check_chapter)(p)
    for w in warnings: print("WARN ", w)
    for e in errors: print("ERROR", e)
    print(f"{len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)
