# Fluency track: writing guide and file format

The Fluency track teaches how modern AI works to people who have never studied it.
One file per chapter: `content/fluency/f<N>.json`. Check with `python3 tools/validate_fluency.py content/fluency/f<N>.json`.

## Who is reading

A smart adult who works at a marketing and advertising company: creatives, strategists, account leads,
producers, media buyers, finance, HR. They use a phone, they have about four minutes, and they have
never written code. Assume no maths beyond percentages and no computer-science vocabulary at all.

## How a session teaches

A session is one sitting: 3 ideas, 6 questions, a takeaway. Teach first, then check.

- A **card** teaches exactly one idea. Start from something the reader already knows (autocomplete,
  a playlist that learns your taste, briefing a freelancer, a mixing desk), then name the idea.
- The **first question after a card** checks the idea just taught. Anyone who read the card gets it right.
- The **second question** uses the idea in a small, concrete situation, often from agency work
  (a brief, a caption, a tagline, a client email, a deck, audience research, a media plan, meeting notes).
- Never ask about something the session has not taught yet. Never rely on an earlier session for a key fact
  without restating it in a few words.
- Difficulty rises slowly inside a chapter. The first session of a chapter is the easiest.

## Voice

- Plain, warm, direct. Short sentences. Second person ("you"). No hype, no exclamation marks, no emoji.
- Define any new term the first time it appears, in eight words or fewer, and only introduce a term the
  reader will meet again. Prefer the plain word: "settings" or "dials" before "parameters", "pieces of
  words" before "tokens", "practice run" before "training".
- No code, no formulas, no Greek letters, no backticks. Numbers are fine when they are simple (99%, 3 words).
- Never use: stochastic, logits, softmax, backpropagation, tensor, hyperparameter, epoch, corpus, inference,
  n-gram, vector, latent, gradient. Say what they mean instead.
- Be accurate. State only well-established facts. No statistics unless the outline gives them. No claims about
  specific products' prices, limits or version numbers (they go stale). You may mention chat assistants in
  general ("a chat assistant such as ChatGPT, Claude or Gemini") but do not compare or rank them.
- Do not name real clients or real people, and do not state any company's AI policy. For privacy and policy
  topics say "check your company's policy".
- Wrong options must be plausible to someone who skipped the card and clearly wrong to someone who read it.
  No trick questions, no "all of the above", no jokes as options. Keep options similar in length; the correct
  option must not be the longest more than occasionally. Spread the correct answer across positions.
- `explain` says why the right answer is right in one or two friendly sentences. It is shown after every
  answer, right or wrong, so do not write "Correct!" or "Wrong".

## File format

```json
{
  "id": "f1",
  "title": "Meet the machine",
  "blurb": "What AI actually is, minus the hype.",
  "sessions": [
    {
      "id": "f1-1",
      "title": "What counts as AI?",
      "icon": "spark",
      "goal": "Tell a hand-written rule from a learned pattern.",
      "steps": [
        { "type": "card", "title": "Rules someone wrote", "body": "..." },
        { "type": "tf", "prompt": "...", "answer": true, "explain": "..." },
        { "type": "mcq", "prompt": "...", "options": ["...", "...", "..."], "answer": 1, "explain": "..." },
        { "type": "card", "title": "...", "body": "...", "play": { "kind": "predict", "...": "..." } }
      ],
      "takeaway": "AI learns patterns from examples; ordinary software follows rules a person wrote.",
      "tryit": "Spot three things on your phone today that learned from examples."
    }
  ]
}
```

Chapter: `id` (file name), `title` (≤ 28 chars), `blurb` (≤ 64 chars), exactly 5 `sessions`.

Session
- `id`: `<chapter id>-<n>`, numbered from 1.
- `title`: ≤ 30 chars. `goal`: ≤ 80 chars, finishes the sentence "After this you can…" and starts with a verb.
- `icon`: one of dice chain scale brain token book vector layers eye target wrench rocket chip chat robot
  flask dna graph chart bird puzzle spark shield gauge memory tune filter compass trophy code.
- `steps`: 3 or 4 cards and 6 or 7 questions. The first step is a card. Never more than 2 cards in a row,
  never more than 3 questions in a row. Use at least 3 different question types; at most 3 `mcq`.
- `takeaway`: the one sentence to remember, ≤ 24 words.
- `tryit`: one small thing to try at work or on their phone today, ≤ 30 words, starts with a verb.

Card
- `title` ≤ 36 chars. `body` ≤ 50 words (≤ 34 words when the card has a `play`). One idea.
- `**bold**` is allowed for the one term being introduced. Nothing else is formatted.
- `play` (optional): an interactive toy shown under the text. See below. Use only where the outline says so.

Questions (every one needs `explain`, ≤ 40 words)
- `mcq`: `prompt` (≤ 150 chars), `options` (3 or 4 unique strings, each ≤ 64 chars), `answer` (0-based index).
- `tf`: `prompt` is a statement (≤ 150 chars), `answer` is true or false. Optional
  `"labels": {"true": "Fact", "false": "Myth"}` renames the two buttons (each ≤ 14 chars), for example
  Fact/Myth, AI/Not AI, Strong prompt/Weak prompt, Safe/Risky. Keep true and false roughly balanced.
- `cloze`: `prompt` (≤ 150 chars) with exactly one `___` (three underscores); `options` (3 or 4 unique
  strings, each ≤ 26 chars); `answer` index. The reader drags the right word into the gap.
- `order`: `prompt`, `items` (3 to 5 unique strings, each ≤ 42 chars) written in the CORRECT order; the app
  shuffles them and the reader drags them into order.
- `match`: `prompt`, `pairs` (3 or 4 pairs `[left, right]`; left ≤ 22 chars, right ≤ 46 chars; all unique).
- `sort`: `prompt`, `buckets` (two labels, each ≤ 16 chars), `items` (4 to 6 entries `[text, bucket]` where
  text is ≤ 50 chars and bucket is 0 or 1; use both buckets). The reader swipes each item into a bucket.

## Plays (interactive toys on a card)

Use exactly the shapes below. The card's `body` should invite the reader to try the toy.

- Next-word predictor. The reader taps to draw a word and watches likely words win most often.
  With `"slider": true` a "creativity" slider flattens or sharpens the odds.
  `{ "kind": "predict", "prompt": "Twinkle, twinkle, little", "words": [["star", 92], ["bat", 5], ["sandwich", 3]], "slider": false }`
  `prompt` ≤ 60 chars; 3 to 5 words, each ≤ 12 chars; the numbers are whole percentages that add up to 100.
- Token splitter. Shows the text, then splits it into the pieces a model would read.
  `{ "kind": "tokens", "text": "Unbelievable results!", "pieces": ["Un", "believ", "able", " results", "!"] }`
  `text` ≤ 60 chars; 3 to 14 pieces; the pieces joined together must equal `text` exactly (spaces belong
  to the start of the piece that follows them).
- Attention spotlight. The focus word lights up the words it is paying attention to.
  `{ "kind": "attention", "sets": [ { "words": ["The","dog","chased","the","ball","because","it","was","bouncy"], "focus": 6, "weights": [0,0.1,0.05,0,0.8,0,0,0,0.05], "note": "\"it\" leans on \"ball\": balls are bouncy." } ] }`
  1 or 2 sets (two sets let the reader flip between two sentences); 5 to 12 words, each ≤ 10 chars;
  `weights` has one number from 0 to 1 per word; `focus` is the index of the focus word; `note` ≤ 80 chars.
- Meaning map. Dots on a map; tapping a word highlights its nearest neighbours.
  `{ "kind": "map", "points": [["sneakers", 18, 30, "shoes"], ["trainers", 26, 24, "shoes"], ["pizza", 72, 70, "food"]] }`
  6 to 10 points `[label, x, y, group]`; label ≤ 10 chars; x and y from 5 to 95; 2 or 3 groups (≤ 12 chars);
  points in a group sit near each other, groups sit apart, and no two points are closer than 10 units.
- Prompt compare. Two prompts side by side; tapping one reveals what it would get back.
  `{ "kind": "compare", "a": { "label": "Vague", "prompt": "...", "result": "..." }, "b": { "label": "Briefed", "prompt": "...", "result": "..." } }`
  `label` ≤ 14 chars; `prompt` ≤ 150 chars; `result` ≤ 240 chars (write a realistic short output).
- Trainer. The reader drags a slider to fit a line through dots while an error bar shrinks.
  `{ "kind": "fit", "x": "Posts per week", "y": "New followers" }` (each label ≤ 22 chars).
- Noise to picture. A slider turns static into a small pixel picture.
  `{ "kind": "denoise", "art": "heart" }` where `art` is heart, smile, star or bolt.
- Chat script. Reveals a conversation turn by turn with its hidden labels.
  `{ "kind": "chat", "turns": [["system", "..."], ["user", "..."], ["assistant", "..."]] }`
  3 to 5 turns; roles are system, user or assistant; each text ≤ 110 chars.

## Before you finish

Run the validator until it prints 0 errors and 0 warnings. Then read every session top to bottom as the
reader would and fix anything that asks about an idea before the card that teaches it.
