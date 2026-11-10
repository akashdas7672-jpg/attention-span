# Motion design specification

The app is made of soft clay objects. Things you touch press in. Things you earn arrive with a small squish.
Measurements (progress, error, counts) move plainly, with no bounce. Nothing ever makes the person wait:
the Continue button works from the first frame of every animation.

## Motion principles

| Token | Value | Usage |
|---|---|---|
| `--d1` micro | 100ms | Press, select, colour change, outgoing step |
| `--d2` short | 200ms | Chips, tab content, sheet dismiss, toasts, small pops |
| `--d3` medium | 300ms | Step change, sheet present, feedback panel, cards flying off |
| `--d4` long | 500ms | Count-up, attention nudge. Nothing single runs longer |
| `--e-in` enter | `cubic-bezier(0, 0, 0.2, 1)` | Anything appearing |
| `--e-out` exit | `cubic-bezier(0.4, 0, 1, 1)` | Anything leaving |
| `--e` standard | `cubic-bezier(0.4, 0, 0.2, 1)` | Moves inside a screen: bars, neighbours making room |
| `--spring` squish | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Objects you touched or earned landing: stars, badges, chips, switches. Never on exits, never on measurements |
| Stagger | 60ms, first 5 items | Later items arrive with the fifth |
| Distance | 24px sideways, 8px up, 40px for panels | Enough to read direction, not a slide show |
| Press | scale 0.96 | Every tappable clay surface |

Direction carries meaning: forward comes from the right, leaving goes down, wrong shakes sideways, earned things grow from their own centre.

Deliberate exceptions to the 500ms cap, none of which block input: confetti (about 1.2s, ambient), a model writing its text (streamed, like a loading state), and Lab training (real work in progress).

## Animation specs

| Interaction | What moves | Time and curve | Reduced motion |
|---|---|---|---|
| Press | scale 1 to 0.96 and back | 100ms standard down, 200ms squish up | Kept (tiny) |
| Select option or chip | border and fill colour | 100ms standard | Kept |
| Correct answer | option turns green, tick scales in | 200ms squish | Colour and tick, no scale |
| Wrong answer | sideways shake, 3 swings of 6px, turns red | 300ms standard | Colour and cross, no shake |
| Feedback panel | rises 40px and fades in | 300ms enter | Fade 200ms |
| Next step | old step fades out; new one comes 24px from the right and fades in | 100ms exit, 300ms enter | Crossfade 200ms |
| Tab switch | content fades in and rises 8px; tab icon pill squishes | 200ms enter; 200ms squish | Instant |
| Sheet | slides up with a fading scrim; dismiss reverses | 300ms enter; 200ms exit | Fade 200ms |
| Session open and close | rises 24px and fades in; fades out on close | 300ms enter; 200ms exit | Fade 200ms |
| Reorder a row | lifts to 1.03 with a deeper shadow and follows the finger; neighbours slide aside; settles | lift 100ms; neighbours 200ms standard; settle 200ms squish | Follows the finger; neighbours jump |
| Swipe to sort | card follows the finger with a slight tilt; target bucket grows to 1.07; card flies off that side | bucket 100ms; fly 300ms exit; snap back 200ms squish | No tilt; card fades 200ms |
| Word into gap | chip lifts to 1.06 and follows; gap swells to 1.1 in range; chip lands | 100ms; land 200ms squish | Follows the finger; no swell |
| Progress bar | fill slides by transform, no overshoot | 300ms standard | Jumps |
| Run counter | pops from 0.8, only when the number changes | 200ms squish | Number swaps |
| Points count-up | number runs from 0 | 500ms, slowing | Final number at once |
| Stars | each grows from 0 with a quarter turn | 300ms squish, 150ms apart | All three fade in together |
| Daily Drop squares | grow in one by one, holding the result back | 200ms squish, 90ms apart | All at once |
| Badge, level, surprise | grows from 0.8; label rises 8px after | 300ms squish; 200ms enter | Fade |
| Confetti | 60 pieces fall and fade, three stars only | about 1.2s | None |
| Model writing | text appears piece by piece with a caret | 22 to 70ms a piece | Whole text at once |
| Training chart | line redraws as numbers arrive; stage title crossfades | 200ms | Kept (it reports state) |
| Start nudge | one soft ring around Start when today is not done | 500ms, twice, then still | None |

## Choreography

### Answer to feedback (six times a session, so it is quick)
1. 0ms: the option changes colour (100ms). Sound and haptic fire now, not at the end.
2. 0ms: the feedback panel rises (300ms, enter). Continue is live.
3. 100ms: the progress bar advances (300ms, standard).
4. 200ms: the run counter pops if it changed (200ms, squish).

### Session complete (the reward)
1. 0ms: the results screen fades in (200ms). Continue is live.
2. 150, 300, 450ms: the stars land (300ms each, squish). Confetti starts with the first star on a perfect run.
3. 600ms: the headline rises 8px and fades in (200ms, enter).
4. 700ms: three tiles, 60ms apart (200ms, enter); points count up (500ms).
5. 900ms: "Remember" and "Try it today" fade in together (200ms).
6. 1,100ms: the line your own model wrote types out. This is the variable reward, so it comes last.

### Wrong swipe
1. 0ms: the card shakes and turns red (300ms); a label names the right side.
2. 300ms: the correct bucket grows (100ms).
3. 600ms: the card flies to the correct side (300ms, exit).
4. 900ms: the next card pops in (200ms, squish).

### Sheet
Present: scrim fades (200ms) while the sheet slides up (300ms, enter). Dismiss: both leave together (200ms, exit), then the sheet is removed.

## Motion by habit-loop phase

- **Trigger:** motion cannot bring someone back, but the Start nudge points at the one thing to do.
- **Action:** nothing between a tap and the next thing takes longer than 300ms.
- **Variable reward:** only rewards that vary get a reveal (the Drop squares, the model's line, a surprise). Fixed rewards such as points simply appear.
- **Investment:** what the person puts in is shown going somewhere: practice steps are named as going to their model.

## Reduced motion

- Movement becomes a 200ms fade, not a hard cut.
- No shake, tilt, overshoot, confetti, pulse or looping motion.
- Things being dragged still follow the finger. That is direct control, not animation.
- Motion that reports state stays: the training chart, the progress bar (it jumps).
- Sequences collapse: stars, squares and tiles appear together.
- Timed pauses in code shorten to match.

## Performance

- Only `transform` and `opacity` animate. Bars move their fill by transform inside a clipped track.
- The attention ring is a pseudo-element that scales and fades, not an animated shadow.
- No filter on press; scale is enough.
- `will-change` is set only while something is being dragged.
- Lab training works in slices of 8ms so the chart and any animation keep their frames.
- The confetti canvas is capped at twice the screen's pixel density.
- Redrawing a question must not replay animations on things that did not change.

## Defects this spec fixes

Found by reading the code, not by measuring frame rates on a phone.

1. Matched pairs popped again every time another pair was matched.
2. The run counter popped on every step, changed or not.
3. Tab switches, closing a sheet and closing a session had no transition.
4. Progress bars overshot because a bouncy curve was used on a measurement.
5. Fifteen different durations were in use; the star pop and count-up ran past 500ms.
6. Lab training took 18ms slices, more than one frame.
