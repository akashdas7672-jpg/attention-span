# Lesson content format (one JSON file per unit)

Write UTF-8 JSON, no comments. File name: `<unit id>.json`.

```json
{
  "id": "c1",
  "title": "Build Your Own Small Language Model",
  "subtitle": "AI Research Foundations · Course 1",
  "repo": "ai-foundations",
  "skills": [
    {
      "id": "c1-1",
      "title": "Probability distributions",
      "icon": "dice",
      "lab": "course_1/gdm_lab_1_1_create_your_own_probability_distribution.ipynb",
      "cards": [
        { "title": "Next-word prediction", "body": "A language model assigns a probability to every possible next word...", "code": "optional short snippet" }
      ],
      "exercises": [ ... ]
    }
  ]
}
```

Field rules
- `id` of a skill: `<unit id>-<n>` numbered from 1 in path order.
- `title` (skill): at most 28 characters, a concrete topic, Title Case not required.
- `icon`: one of: dice chain scale brain token book vector layers eye target wrench rocket chip chat robot flask dna graph chart bird puzzle spark shield gauge memory tune filter compass trophy code
- `lab`: path of the source notebook inside its repo (`repo` is `ai-foundations` or `educational`). If a skill draws on two notebooks, give the main one.
- `cards`: 2-4 short teaching cards shown before the first lesson ("tips"). `body` at most 70 words. `code` optional, at most 8 lines.
- `exercises`: 12-16 per skill. Mix: about 40% mcq, 15% tf, 20% cloze, 10% order, 10% match. At least one of each of mcq, tf, cloze; at least one order or match.
- Every exercise may carry `"level": 1|2|3` (1 = recall, 2 = understanding, 3 = apply/compute). Aim for a spread inside each skill.
- Every exercise needs `explain`: 1-2 sentences saying why the answer is right (shown after answering). At most 45 words.

Exercise types
- `mcq`: `prompt`, optional `code`, `options` (3-4 strings, unique), `answer` (0-based index).
- `tf`: `prompt` is a statement, `answer` is true or false.
- `cloze`: exactly one `___` (three underscores) across `prompt` and `code` combined; `options` (3-4 unique short strings), `answer` index. Put the blank inside `code` for code exercises.
- `order`: `prompt`, `items` (3-6 short unique strings, at most 48 chars each) listed in the CORRECT order; the app shuffles them.
- `match`: `prompt`, `pairs` (4-5 pairs `[left, right]`), left at most 24 chars, right at most 52 chars, all lefts unique, all rights unique.

Text
- Plain text. Inline code with backticks and **bold** are allowed. No LaTeX: write math with Unicode (×, ·, √, σ, ², ³, →, ≈, Σ, ∈, ≤).
- `prompt` at most 160 characters; options at most 70 characters each.
- `code` is Python, at most 10 lines, 44 characters per line where possible (phone screen).
