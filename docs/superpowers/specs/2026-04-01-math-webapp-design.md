# Math Webapp Design — Rekenapp voor Kinderen

**Date:** 2026-04-01
**Stack:** Plain HTML/CSS/JavaScript (no build step)
**Audience:** 6-year-old boy (child UI) + parent (setup screen)
**Language:** Dutch throughout

---

## Overview

A single-page math practice webapp. The parent configures a session, then hands the device to the child who works through a set of exercises with celebratory feedback.

---

## Screens

### 1. Instellingen (Parent Setup)

The starting screen. Parent configures:

- **Bewerkingen** — checkboxes for: Optellen (+), Aftrekken (−), Vermenigvuldigen (×), Delen (÷). At least one must be selected.
- **Getallen** — min and max number inputs (e.g., min: 1, max: 10). Min must be ≥ 1, max must be > min.
- **Aantal oefeningen** — number input (e.g., 5, 10, 20). Range: 1–50.
- **Starten** button — disabled until at least one operation is selected and numbers are valid.

### 2. Oefening (Exercise)

One problem at a time. Layout:

- **Voortgangsbalk** — progress bar at top (e.g., "Vraag 3 van 10")
- **Som** — large display of the problem (e.g., `7 + 4 = ?`)
- **Antwoord** — large number input field
- **Controleren** button — submits the answer

**Feedback behavior:**
- **Correct:** confetti burst animation + random Dutch celebration message ("Goed zo! 🎉", "Super! ⭐", "Wauw, geweldig! 🌟", "Fantastisch! 🏆"). Brief pause, then next exercise.
- **Wrong (attempt 1):** shake animation on input + message "Probeer nog eens! 💪". Input cleared, focus returned.
- **Wrong (attempt 2):** same shake + "Bijna! Probeer nog één keer! 🤔"
- **Wrong (attempt 3 / max attempts reached):** show correct answer briefly ("Het antwoord is [X]"), then move on after 2 seconds.

### 3. Resultaten (End Screen)

Shown after all exercises are completed.

- **Score display:** "Je hebt [X] van de [Y] sommen goed!" with a star rating visual (0–3 stars based on score %)
  - 0–49%: 0 stars + "Blijf oefenen, je komt er!"
  - 50–79%: 2 stars + "Goed gedaan! Blijf zo doorgaan!"
  - 80–100%: 3 stars + full confetti + "Geweldig! Je bent een rekenkampioen! 🏆"
- **Opnieuw** button — replay with same settings
- **Instellingen** button — back to setup screen

---

## Exercise Generation

- Pick a random operation from the selected set.
- Pick two random numbers within [min, max].
- **Subtraction:** swap so the larger number comes first (result ≥ 0).
- **Division:** generate the answer first (random number in range), then the divisor (random number in range, ≠ 0), compute dividend = answer × divisor. If dividend > max, retry. This guarantees whole-number answers.
- No duplicate exercises within a single session (regenerate on collision).

---

## File Structure

```
my-first-project/
├── index.html       # markup for all three screens (shown/hidden via JS)
├── style.css        # child-friendly design: big fonts, bright colors, animations
└── app.js           # settings logic, exercise generation, feedback, screen transitions
```

No dependencies, no build step. Open `index.html` in any browser. Deploy via GitHub Pages.

---

## Visual Design

- **Font:** Nunito (Google Fonts) — rounded, friendly, highly legible for children
- **Colors:** bright and cheerful (e.g., blue/yellow/green palette), high contrast
- **Buttons & inputs:** large, rounded, easy to tap on tablet
- **Confetti:** pure CSS/JS animation, no external libraries
- **Responsive:** works on desktop and tablet

---

## Out of Scope

- User accounts or login
- Score history / persistence across sessions
- Difficulty levels or automatic progression
- Sound effects
- Mobile app packaging
