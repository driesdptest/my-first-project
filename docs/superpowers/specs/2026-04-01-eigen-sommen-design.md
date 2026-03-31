# Eigen Sommen Feature Design

**Date:** 2026-04-01
**Stack:** Plain HTML/CSS/JavaScript (no build step)
**Feature:** Custom exercise pattern mode for the Rekenapp

---

## Overview

Add a "custom patterns" mode to the parent settings screen. Instead of generating fully random exercises, the parent defines one or more fixed-operand patterns (e.g., `9 − ?` where `?` varies between 1 and 8). The session then picks randomly from all defined patterns.

---

## Settings Screen Changes

### Mode Toggle

A toggle appears at the top of the settings card with two pill buttons:
- **Willekeurig 🎲** (default) — existing random mode, unchanged
- **Eigen sommen ✏️** — custom pattern mode

Switching modes shows/hides the relevant section:
- Willekeurig: shows Bewerkingen + Getallen sections (existing)
- Eigen sommen: hides Bewerkingen + Getallen, shows custom pattern list

**Aantal oefeningen** input remains visible in both modes.

### Custom Pattern Builder

A list of pattern rows, each containing:

| Field | Description | Constraints |
|---|---|---|
| Vast getal | Fixed left-hand number | ≥ 1 |
| Bewerking | Operation dropdown (+, −, ×, ÷) | Required |
| Van | Min value for variable (right-hand) | ≥ 1 |
| Tot | Max value for variable | > Van |

Additional per-operation constraints:
- **Aftrekken (−):** `Tot` must be < `Vast getal` (prevents negative results)
- **Delen (÷):** variable range used as divisor; whole-number results guaranteed by retrying until `vast getal % b === 0`, fallback to `b = 1`

An **"＋ Som toevoegen"** button adds a new blank row. Each row has a **✕** delete button.

The **Starten** button remains disabled until at least one pattern row is fully valid.

---

## Exercise Generation Changes

### New function: `generateFromPattern(pattern)`

Added to `exercises.js`. Takes `{ fixed, op, min, max }`, returns `{ a, op, b, answer }` — same shape as `generateExercise`.

Logic per operation:
- `+`: `a = fixed`, `b = randInt(min, max)`, `answer = a + b`
- `-`: `a = fixed`, `b = randInt(min, max)` (max < fixed enforced by UI), `answer = a - b`
- `×`: `a = fixed`, `b = randInt(min, max)`, `answer = a * b`
- `÷`: `a = fixed`, `b = randInt(min, max)` (b ≠ 0), answer = a / b — only valid if `fixed % b === 0`; retries until whole number found (max 50 attempts, fallback to b=1 if fixed divisible by 1)

### Updated function: `generateSession`

Accepts either:
- `{ ops, min, max, aantal }` — existing random mode (unchanged)
- `{ patterns, aantal }` — custom mode: picks a random pattern per exercise, calls `generateFromPattern`

Deduplication by key `${a}${op}${b}` works identically in both modes.

---

## File Changes

| File | Changes |
|---|---|
| `index.html` | Mode toggle markup, custom pattern list section |
| `style.css` | Toggle pill button styles, pattern row layout styles |
| `app.js` | Toggle handler, pattern row add/remove/validate, updated session start |
| `exercises.js` | Add `generateFromPattern`, extend `generateSession` to accept patterns |

---

## Out of Scope

- Mixing random and custom exercises in the same session
- Patterns with the variable on the left side (e.g., `? − 3`)
- Saving/persisting custom patterns between sessions
