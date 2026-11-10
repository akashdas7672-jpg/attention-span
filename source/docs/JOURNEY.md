# Journey map

Goal: everyone builds real foundations in AI, and leaves with models they made, own and can run on their own
devices. The return habit follows the four steps of the Hooked model: trigger, action, variable reward, investment.

## Persona (assumed, not researched)

A non-technical person at the agency: account lead, strategist, producer. Uses a chat assistant now and then,
feels slightly behind on AI, has four minutes between meetings, and is wary of anything that smells like mandatory
training. Wants to feel competent at work and to have something they made to show for it.

## Entry points

```
[Colleague's Daily Drop grid in chat] ─→ opens today's Drop directly
[Rollout message from the team lead] ──→ [Welcome] → [First session] → [Results] → [Build your first model]
[Exported model page from a colleague] → link back to the app → [Welcome]
[Home Screen icon] ───────────────────→ [Today] → [Session, Drop or your model]
[Daily calendar reminder] ────────────→ [Today]
                                          ↓
                         [Quit mid-session] → place saved → [Resume]
```

## The loop

| Phase | What the app does |
|---|---|
| Trigger | Asks when the person has four minutes and adds a daily calendar reminder. A colleague's shared grid opens the Drop itself. Push notifications need a server and are not built. |
| Action | Two taps to a four-minute session. Quitting saves the place. The chapter test sits at the top of each chapter. |
| Variable reward | After every session the person's own model writes a fresh line. Now and then a surprise: a new text pack or bonus practice steps. |
| Investment | Sessions earn practice steps that are spent training the model further. The model, the reminder time and the saved place all make the next visit more likely. |

## Journey

| # | Screen | User action | App response | Emotion |
|---|---|---|---|---|
| 1 | Team chat | Taps a shared grid | Opens today's Drop | Curious, a bit competitive |
| 2 | Welcome | Gives a name, picks a starting point | First session starts | Wary, then engaged |
| 3 | First session | Reads a card, answers six checks | Instant feedback | Relieved, confident |
| 4 | Results | Sees stars and points | Offers "Build your first model" | Proud |
| 5 | First model | Picks a text, taps once | A Copycat writes within a minute | Surprised, delighted |
| 6 | Reminder | Picks a time | Adds a daily calendar reminder | Committed |
| 7 | Next day | Reminder fires, opens the app | Today shows the model and banked practice steps | Welcomed back |
| 8 | Any session | Finishes | The model writes a new line; steps are banked | Curious what it says |
| 9 | Lab | Spends steps training a Tiny Brain | Error falls, writing improves | Fascinated |
| 10 | Model page | Exports the model | A page with their name, photo and a link back; a warning if it holds pasted text | Proud, and safe |
| 11 | Weeks 2 to 6 | A session a day | Levels, a Bigger Brain unlocks | Steady |
| 12 | Chapter 9 | Learns about open models | Ladder step four: run a real one on their own computer | Capable |
| 13 | Graduation | Ticks off the steps | Badge and celebration | "I own this" |

## The ownership ladder

1. **Copycat**: built on the phone in a minute. Writes by copying patterns from its text.
2. **Tiny Brain**: a small neural network trained on the phone.
3. **Bigger Brain**: four times the dials, unlocked at level 3. Still tiny.
4. **A real open model on your own computer**: a guided, self-checked setup. This is the rung that can stand in for a paid assistant on small jobs.
5. **Teach it your style**: adapting an open model with your own examples, through the Builder track.

Rungs 1 to 3 are for understanding and for pride. They do not replace a paid assistant, and the app says so.

## Friction and how it is handled

- **No return prompt.** Commitment question and calendar reminder. Push needs a server.
- **Export could leak pasted text.** A warning before exporting any model built from the person's own words; Copycat files state that they contain their text.
- **Quitting lost the answers.** The place is saved and offered again.
- **Hidden chapter test.** Moved to the top of the chapter.
- **Safari and the Home Screen app keep separate progress.** The install prompt comes right after the first win, with a one-tap progress code, and Welcome offers Restore.
- **Fluent to expert had a cliff.** Chapter 9 and the ladder bridge to the Builder track.

## Still needs a server

Sign-in, a shared leaderboard, verified prize claims, push reminders, and seeing how colleagues did on the Drop inside the app.
