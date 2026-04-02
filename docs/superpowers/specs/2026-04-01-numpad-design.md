# Custom Numpad Feature Design

**Date:** 2026-04-01
**Stack:** Plain HTML/CSS/JavaScript (no build step)
**Feature:** In-UI numeric keypad on the exercise screen to prevent native mobile keyboard from appearing

---

## Overview

Replace the native keyboard input on the exercise screen with a custom in-UI numeric keypad. The answer input field becomes read-only (native keyboard never appears). Children tap large buttons to enter their answer. The ✅ check button is integrated as the bottom-right key of the keypad grid.

---

## Exercise Screen Changes

### Answer Display

The existing `<input type="number" id="answer-input">` stays in the DOM but gets `readonly` added. It shows the digits tapped so far. The `answerInput.focus()` calls in `app.js` are removed (focusing a readonly field serves no purpose and may trigger the native keyboard on some browsers).

### Keypad Grid

A `<div class="numpad">` replaces the existing `<button id="btn-controleren">`. It is placed after the feedback div. Layout — 3 columns × 4 rows:

```
[ 1 ] [ 2 ] [ 3 ]
[ 4 ] [ 5 ] [ 6 ]
[ 7 ] [ 8 ] [ 9 ]
[Wis] [ 0 ] [ ✅ ]
```

Each digit button has `data-val="<digit>"`. The Wis button has `data-val="wis"`. The ✅ button triggers `checkAnswer()`.

### Keypad Behaviour

- **Digit tap:** Appends digit to `answerInput.value`. Maximum 4 digits (prevents absurdly long numbers).
- **Wis tap:** Clears `answerInput.value` to `''`.
- **✅ tap:** Calls `checkAnswer()` — identical to the old Controleren button.
- **Keypad disabled state:** When `checkAnswer()` shows the correct answer and waits before advancing, the numpad buttons are disabled (same timing as the old btn-controleren disable). This prevents double-tapping during the 1.5s / 2s pause.
- **Desktop keyboard:** The existing `keydown` Enter listener on `answerInput` is removed (the field is readonly). Enter key support is dropped — desktop users can click ✅.

### Reset on New Exercise

`showExercise()` clears `answerInput.value = ''` and re-enables all numpad buttons (existing reset logic extended).

---

## File Changes

| File | Changes |
|---|---|
| `index.html` | Add `readonly` to answer input; replace `<button id="btn-controleren">` with `<div class="numpad">` containing 12 buttons |
| `style.css` | Add `.numpad` (CSS grid, 3 cols), `.numpad-btn` (large rounded buttons), `.numpad-wis` (red tint), `.numpad-ok` (blue primary) |
| `app.js` | Remove `btnControleren` ref and its listeners; remove `answerInput.focus()` calls; add numpad click handler; update disable/enable logic to target numpad buttons |

---

## Out of Scope

- Negative number support (answers are always ≥ 0 given current constraints)
- Decimal point button
- Haptic feedback
- Animation on digit tap
