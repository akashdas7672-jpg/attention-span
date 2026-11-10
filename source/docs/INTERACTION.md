# Interaction design specification

Covers the answer controls used in sessions and the shell around them (sheets, overlays, tabs). The app is
touch-first, and every action also works from a keyboard and is announced to a screen reader.

## State matrix (answer option; the other controls inherit it)

| State | Background | Border | Text | Icon | Cursor | Shadow |
|---|---|---|---|---|---|---|
| Default | card | none | ink | empty ring | pointer | clay |
| Hover (desktop only) | card | soft grey | ink | empty ring | pointer | clay |
| Focus | card | 3px primary ring, offset 3px | ink | unchanged | n/a | clay |
| Pressed | card | none | ink | unchanged | pointer | clay, scale 0.98 |
| Selected | primary tint | primary | ink | filled dot | pointer | clay |
| Busy (100ms between steps) | unchanged | unchanged | unchanged | unchanged | default | unchanged; input ignored |
| Correct | green tint | green | dark green | tick | default | clay |
| Wrong | red tint | red | dark red | cross | default | clay |
| Dimmed (other options after answering) | card at 50% | none | ink at 50% | none | default | none |
| Disabled (Check with nothing chosen) | grey | none | muted | none | default | none |
| Dragging (chip, row, card) | card | none | ink | grip | grabbing | lifted, scale 1.03 to 1.06 |
| Drop target in range (gap, bucket) | primary tint or its own colour | solid outline | ink | n/a | n/a | scale 1.07 to 1.1 |
| Empty (unfilled gap) | none | dashed, at least 3:1 | n/a | n/a | pointer | none |

Right and wrong always carry an icon and a text line as well as colour.

## Per-control behaviour

| Control | Touch | Keyboard | Screen reader |
|---|---|---|---|
| Multiple choice | Tap, then Check | Arrows move and select within the group; Enter or Space selects; Check is a button | Radio group named by the question; result announced |
| True or false | Tap answers at once | Enter or Space | Result announced; the right answer is marked in text |
| Fill the gap | Drag a word in, or tap it; tap the gap to clear | Words are buttons; the gap is focusable, Backspace or Enter clears it | "Gap, empty" or "Gap, filled with …" |
| Reorder | Drag; or tap one, then its destination | Enter picks up, Up and Down move it, Enter drops; arrows alone move between rows | "Item, position 2 of 5"; every move announced |
| Match | Tap left, then right | Same, with Enter | Picked item is marked pressed; "Matched …" or "Not a match" |
| Sort | Swipe the card, or tap a side | Left and Right arrows, or the two buttons | Each new card is read out; a wrong placement says where it belongs |
| Sheet | Scrim, handle, or drag the handle down | Escape closes; Tab stays inside | Dialog named by its heading; focus returns to what opened it |
| Sliders | Drag | Arrows | Labelled range |

## Transitions

```
[Default] <-> [Hover] -> [Pressed] -> [Selected] -> (Check) -> [Correct]
    |                                     ^                 -> [Wrong] -> comes back once at the end
 [Focus] --------------------------------+
[Default] -> [Dragging] -> [Drop target in range] -> [Selected]   (released elsewhere: springs back)
```

Timings follow `MOTION.md`: 100ms for press and colour, 200ms for landing, 300ms for the feedback panel.

## Focus and modality

- Opening a sheet, a session, the Lab or the welcome flow moves focus into it and makes everything beneath it
  inert, so neither Tab nor a screen reader can reach the page behind.
- Each new step moves focus to its heading. After a question is redrawn, focus returns to the control that was used.
  After an answer, focus lands on Continue.
- Closing returns focus to what opened the sheet, or to the page heading after a session.

## Announcements

One polite live region carries: the result of every answer with its explanation, each new sort card, matches and
mismatches, reorder moves, widget results, the session summary, and the finished text when a Lab model writes
(once, not piece by piece). Toasts are announced through their own region.

## Accessibility checklist

- [x] Roles: radio group, dialog (sheets and overlays), switch, progress bar with a value, live regions.
- [x] Labels on icon-only buttons, the gap, reorder rows, sort buckets and the photo picker.
- [x] Keyboard: every answer type, the photo picker, clearing a gap, reordering with arrows, sheets.
- [x] Focus ring visible; focus managed across sheets and overlays.
- [x] State changes announced.
- [x] Contrast: hint text 4.6:1, green button 4.8:1, streak numbers 5.2:1, gap outline 4.6:1.
- [x] Targets at least 44px, including segmented controls.

Checked through the browser's accessibility tree and keyboard events. Not yet checked with VoiceOver on a phone.

## Responsive and content

- **Phone:** the primary layout. Bottom sheets, swipe, 44px targets.
- **Tablet and desktop:** the same single column, centred at 520px, with hover states and the keyboard paths above.
  No action depends on hover.
- **Text limits** are enforced by `tools/validate_fluency.py`: prompts 150 characters, options 64, button labels 14,
  names 24. Text wraps; only the model name in a header truncates.
- **English only.** Translated text runs 30 to 50% longer and would break the true-or-false buttons and tab labels first.

## Control API

```
Props (from the lesson step): type, prompt, options | items | pairs | buckets, answer, labels?, explain
State: selected, answered, ok, busy
Events (data-action): q-pick, q-check, q-tf, q-gap, q-row, q-match, q-sort; drags: chip, order, sort, sheet
Keys: arrows (radio group, reorder, sort), Enter and Space, Backspace on the gap, Escape, Tab
Result: feedback panel, announcement, progress, run counter, and a second look at the end for anything missed
```
