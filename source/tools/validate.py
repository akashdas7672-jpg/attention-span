"""Validate unit JSON files against content/SCHEMA.md. Usage: python3 validate.py file.json [...]"""
import json, sys
from collections import Counter

ICONS = set("dice chain scale brain token book vector layers eye target wrench rocket chip chat robot flask dna graph chart bird puzzle spark shield gauge memory tune filter compass trophy code".split())
errors, warnings = [], []

def err(where, msg): errors.append(f"{where}: {msg}")
def warn(where, msg): warnings.append(f"{where}: {msg}")

def check_str(where, v, name, maxlen=None, required=True):
    if v is None:
        if required: err(where, f"missing {name}")
        return
    if not isinstance(v, str) or not v.strip():
        err(where, f"{name} must be a non-empty string"); return
    if maxlen and len(v) > maxlen: err(where, f"{name} longer than {maxlen} chars ({len(v)})")
    if "$" in v and "\\" in v: err(where, f"{name} looks like LaTeX")

def check_options(where, ex):
    opts = ex.get("options")
    if not isinstance(opts, list) or not 3 <= len(opts) <= 4:
        err(where, "options must be a list of 3-4 strings"); return
    for o in opts: check_str(where, o, "option", 70)
    if len(set(opts)) != len(opts): err(where, "options not unique")
    a = ex.get("answer")
    if not isinstance(a, int) or isinstance(a, bool) or not 0 <= a < len(opts): err(where, "answer must be a valid option index")

def check_file(path):
    try: unit = json.load(open(path, encoding="utf-8"))
    except Exception as e: err(path, f"invalid JSON: {e}"); return
    uid = unit.get("id")
    check_str(path, uid, "id"); check_str(path, unit.get("title"), "title", 60); check_str(path, unit.get("subtitle"), "subtitle", 70)
    if unit.get("repo") not in ("ai-foundations", "educational"): err(path, "repo must be ai-foundations or educational")
    skills = unit.get("skills")
    if not isinstance(skills, list) or not skills: err(path, "skills must be a non-empty list"); return
    for si, s in enumerate(skills, 1):
        w = f"{path}:{s.get('id', si)}"
        if s.get("id") != f"{uid}-{si}": err(w, f"skill id should be {uid}-{si}")
        check_str(w, s.get("title"), "title", 28); check_str(w, s.get("lab"), "lab")
        if s.get("icon") not in ICONS: err(w, f"icon {s.get('icon')!r} not in list")
        cards = s.get("cards")
        if not isinstance(cards, list) or not 2 <= len(cards) <= 4: err(w, "cards must be 2-4")
        else:
            for c in cards:
                check_str(w, c.get("title"), "card title", 40); check_str(w, c.get("body"), "card body")
                if isinstance(c.get("body"), str) and len(c["body"].split()) > 70: err(w, f"card body over 70 words: {c['title']}")
                if c.get("code") is not None and len(c["code"].splitlines()) > 8: err(w, "card code over 8 lines")
        exs = s.get("exercises")
        if not isinstance(exs, list) or not 12 <= len(exs) <= 16: err(w, f"exercises must be 12-16 (got {len(exs) if isinstance(exs, list) else 'none'})"); exs = exs if isinstance(exs, list) else []
        types = Counter(); answers = Counter(); longest = 0; mc = 0; prompts = set()
        for ei, ex in enumerate(exs, 1):
            we = f"{w}#{ei}"; t = ex.get("type"); types[t] += 1
            if t not in ("mcq", "tf", "cloze", "order", "match"): err(we, f"bad type {t!r}"); continue
            check_str(we, ex.get("prompt"), "prompt", 160); check_str(we, ex.get("explain"), "explain")
            if isinstance(ex.get("explain"), str) and len(ex["explain"].split()) > 45: err(we, "explain over 45 words")
            if ex.get("prompt") in prompts: err(we, "duplicate prompt in skill")
            prompts.add(ex.get("prompt"))
            if "level" in ex and ex["level"] not in (1, 2, 3): err(we, "level must be 1, 2 or 3")
            code = ex.get("code")
            if code is not None:
                if not isinstance(code, str): err(we, "code must be a string")
                elif len(code.splitlines()) > 10: err(we, "code over 10 lines")
            if t in ("mcq", "cloze"):
                check_options(we, ex)
                if isinstance(ex.get("answer"), int) and isinstance(ex.get("options"), list) and 0 <= ex["answer"] < len(ex["options"]):
                    answers[ex["answer"]] += 1; mc += 1
                    lens = [len(o) for o in ex["options"]]
                    if lens[ex["answer"]] == max(lens) and lens.count(max(lens)) == 1: longest += 1
            if t == "cloze":
                n = (ex.get("prompt") or "").count("___") + (code or "").count("___")
                if n != 1: err(we, f"cloze needs exactly one ___ (found {n})")
            if t == "tf" and not isinstance(ex.get("answer"), bool): err(we, "tf answer must be true/false")
            if t == "order":
                items = ex.get("items")
                if not isinstance(items, list) or not 3 <= len(items) <= 6: err(we, "items must be 3-6")
                else:
                    for it in items: check_str(we, it, "item", 48)
                    if len(set(items)) != len(items): err(we, "items not unique")
            if t == "match":
                pairs = ex.get("pairs")
                if not isinstance(pairs, list) or not 4 <= len(pairs) <= 5: err(we, "pairs must be 4-5")
                else:
                    for p in pairs:
                        if not (isinstance(p, list) and len(p) == 2): err(we, "each pair must be [left, right]"); continue
                        check_str(we, p[0], "left", 24); check_str(we, p[1], "right", 52)
                    if len({p[0] for p in pairs if isinstance(p, list)}) != len(pairs) or len({p[1] for p in pairs if isinstance(p, list) and len(p) == 2}) != len(pairs): err(we, "pair sides not unique")
        for need in ("mcq", "tf", "cloze"):
            if types[need] == 0: err(w, f"no {need} exercise")
        if types["order"] + types["match"] == 0: err(w, "needs at least one order or match")
        if mc >= 6 and answers.most_common(1)[0][1] > mc * 0.5: warn(w, f"answer index bias {dict(answers)}")
        if mc >= 6 and longest > mc * 0.5: warn(w, f"correct option is the longest in {longest}/{mc} choice questions")

for p in sys.argv[1:]: check_file(p)
for x in warnings: print("WARN", x)
for x in errors: print("ERROR", x)
print(f"{len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)
