# Attention Span

A four-minute daily habit for getting fluent in AI, built as an installable web app: add it to an iPhone Home Screen and it runs full screen and offline. Everything stays on the device; there is no server.

## What is in it

- **Today**: the next session, the week's streak, the Daily Drop (the same five questions for everyone that day, with a shareable grid) and a warm-up of earlier questions that are due.
- **Journey**: two tracks.
  - *AI Fluency*: 9 chapters, 45 sessions, plain language and no code. Each session teaches three ideas and checks each one straight away.
  - *Builder*: the technical track, adapted from Google DeepMind's course notebooks, with Python.
- **Lab**: build a tiny language model on the phone (a word-level Copycat, a small neural Tiny Brain or a Bigger Brain), spend practice steps earned in sessions to train it further, and export it as a single web page that works offline. An ownership ladder leads on to running a real open model on your own computer.
- **Rewards**: points, ten levels, colour themes, badges and optional team prizes.
- **Me**: profile photo, stats, activity calendar, settings, backup code.

## Layout

- `src/`: app code (no framework) and styles. `lm.js` is the Lab's model engine.
- `content/fluency/`: the beginner track, one file per chapter. `GUIDE.md` is the writing guide and file format; `OUTLINE.md` is the course outline.
- `content/builder/`: the technical track, one file per unit (`SCHEMA.md` has the format).
- `content/daily.json`: the Daily Drop question pool.
- `content/lab/datasets.json`: starter text for the Lab, written by `tools/make_packs.mjs`.
- `content/program.json`: optional team prizes (see below).
- `docs/`: the journey map (`JOURNEY.md`), the motion specification (`MOTION.md`) and the interaction and accessibility specification (`INTERACTION.md`) the app is built to.
- `assets/`: app icons.
- `dist/`: build output. Host this folder.

## Commands

```bash
node tools/build.mjs
```

```bash
python3 tools/validate_fluency.py content/fluency/f*.json content/daily.json
```

```bash
python3 tools/validate.py content/builder/*.json
```

```bash
node tools/test_lm.mjs
```

```bash
node tools/make_packs.mjs
```

Host the contents of `dist/` on any HTTPS static host, open it in Safari on the iPhone, then tap Share and Add to Home Screen.

## Team prizes

`content/program.json` adds a prizes section to the Rewards tab. It is empty by default.

```json
{
  "org": "Your team name",
  "contact": "who hands out the prizes",
  "prizes": [
    { "id": "swag", "title": "Team hoodie", "detail": "Pick it up at the front desk", "points": 500 }
  ]
}
```

When someone reaches the points, they tap Claim and get a short code to show the contact. The code is an honour-system receipt, not proof: progress lives on each person's phone, so real verification, a shared leaderboard and reminders need sign-in and a small server.

## Notes

- Progress is stored on the device. Me, Back up progress gives a code to restore elsewhere (Safari and the Home Screen app keep separate storage). The photo and Lab models are not in the code.
- A streak needs working days only; weekends never break it. The daily reminder is a calendar event, so it needs no server.
- Haptics use the vibration API where it exists and the system switch tick on recent iOS versions.
- Drag interactions (reorder, swipe to sort, drag into a gap) all have a tap alternative and a keyboard path. Results are announced to screen readers, and focus is kept inside whatever is on top.

## Credits

The Builder track and many ideas in the Fluency track are adapted from Google DeepMind's open materials, [AI Research Foundations](https://github.com/google-deepmind/ai-foundations) and [DeepMind Educational](https://github.com/google-deepmind/educational) (CC BY 4.0 and Apache 2.0). The visual style follows the claymorphism and block-colour guidance in [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). Not an official Google product.
