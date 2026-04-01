# Eigen Sommen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "custom patterns" mode to the settings screen where the parent defines fixed-operand exercises (e.g., `9 − ?`) instead of using fully random generation.

**Architecture:** Four-file change — `exercises.js` gets a new `generateFromPattern` function and an extended `generateSession`; `style.css` gets toggle and pattern row styles; `index.html` gets the toggle markup and custom section; `app.js` gets mode switching, pattern row management, and updated session start logic.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, no dependencies.

---

## File Map

| File | What changes |
|---|---|
| `exercises.js` | Add `generateFromPattern(pattern)`, extend `generateSession` to accept `{ patterns, aantal }` |
| `style.css` | Add `.mode-toggle`, `.mode-btn`, `.pattern-row`, `.pat-*`, `.btn-add-pattern`, `.btn-delete-pattern` |
| `index.html` | Add mode toggle + wrap existing settings in `#random-section` + add `#eigen-section` |
| `app.js` | Add mode state, toggle handlers, pattern row add/remove, updated `validate()` and `btnStarten` click |

---

## Task 1: generateFromPattern and extended generateSession

**Files:**
- Modify: `exercises.js`
- Modify: `test.html`

- [ ] **Step 1: Add tests for generateFromPattern to test.html**

Add the following tests after the existing 8 tests (before the summary line `out.innerHTML += ...`):

```js
const pat = { fixed: 9, op: '-', min: 1, max: 8 };

test('generateFromPattern: optelling antwoord klopt', () => {
  for (let i = 0; i < 50; i++) {
    const ex = generateFromPattern({ fixed: 6, op: '+', min: 1, max: 5 });
    assert(ex.a === 6, `a moet 6 zijn, got ${ex.a}`);
    assert(ex.answer === ex.a + ex.b, `${ex.a}+${ex.b}≠${ex.answer}`);
    assert(ex.b >= 1 && ex.b <= 5, `b=${ex.b} buiten bereik`);
  }
});

test('generateFromPattern: aftrekking niet negatief', () => {
  for (let i = 0; i < 50; i++) {
    const ex = generateFromPattern(pat);
    assert(ex.a === 9, `a moet 9 zijn`);
    assert(ex.answer >= 0, `antwoord ${ex.answer} is negatief`);
    assert(ex.answer === ex.a - ex.b, `${ex.a}-${ex.b}≠${ex.answer}`);
  }
});

test('generateFromPattern: vermenigvuldigen klopt', () => {
  for (let i = 0; i < 50; i++) {
    const ex = generateFromPattern({ fixed: 4, op: '×', min: 1, max: 10 });
    assert(ex.a === 4, `a moet 4 zijn`);
    assert(ex.answer === ex.a * ex.b, `${ex.a}×${ex.b}≠${ex.answer}`);
  }
});

test('generateFromPattern: deling geeft geheel getal', () => {
  for (let i = 0; i < 50; i++) {
    const ex = generateFromPattern({ fixed: 12, op: '÷', min: 1, max: 6 });
    assert(ex.a === 12, `a moet 12 zijn`);
    assert(ex.b !== 0, 'deling door nul');
    assert(Number.isInteger(ex.answer), `${ex.a}÷${ex.b}=${ex.answer} is geen geheel getal`);
    assert(ex.a / ex.b === ex.answer, `${ex.a}÷${ex.b}≠${ex.answer}`);
  }
});

test('generateSession met patterns: juist aantal', () => {
  const patterns = [
    { fixed: 9, op: '-', min: 1, max: 8 },
    { fixed: 5, op: '+', min: 1, max: 5 },
  ];
  const session = generateSession({ patterns, aantal: 10 });
  assert(session.length === 10, `verwacht 10, kreeg ${session.length}`);
});

test('generateSession met patterns: alleen opgegeven bewerkingen', () => {
  const patterns = [{ fixed: 9, op: '-', min: 1, max: 8 }];
  const session = generateSession({ patterns, aantal: 10 });
  session.forEach(ex => {
    assert(ex.a === 9, `a moet 9 zijn, got ${ex.a}`);
    assert(ex.op === '-', `bewerking moet - zijn, got ${ex.op}`);
  });
});
```

Also add `generateFromPattern` to the import line at the top of test.html:

Change:
```js
import { generateExercise, generateSession } from './exercises.js';
```
To:
```js
import { generateExercise, generateSession, generateFromPattern } from './exercises.js';
```

- [ ] **Step 2: Open test.html in browser**

Open `test.html`. The 6 new tests should show **red** (function not found). Existing 8 tests stay green.

- [ ] **Step 3: Add generateFromPattern to exercises.js**

Add the following after the closing brace of `generateExercise` and before `generateSession`:

```js
/**
 * Generate a single exercise from a fixed-operand pattern.
 * @param {{ fixed: number, op: string, min: number, max: number }} pattern
 * @returns {{ a: number, op: string, b: number, answer: number }}
 */
export function generateFromPattern(pattern) {
  const { fixed, op, min, max } = pattern;
  let b, answer;

  if (op === '+') {
    b = randInt(min, max);
    answer = fixed + b;
  } else if (op === '-') {
    b = randInt(min, max);
    answer = fixed - b;
  } else if (op === '×') {
    b = randInt(min, max);
    answer = fixed * b;
  } else {
    // Division: find b in [min, max] such that fixed % b === 0
    b = null;
    for (let i = 0; i < 50; i++) {
      const candidate = randInt(min, max);
      if (candidate !== 0 && fixed % candidate === 0) {
        b = candidate;
        break;
      }
    }
    if (b === null) b = 1; // fallback: fixed / 1 = fixed
    answer = fixed / b;
  }

  return { a: fixed, op, b, answer };
}
```

- [ ] **Step 4: Extend generateSession to handle patterns mode**

Replace the existing `generateSession` function with:

```js
/**
 * Generate a session of N unique exercises.
 * Accepts either { ops, min, max, aantal } (random mode)
 * or { patterns, aantal } (custom pattern mode).
 * @param {{ ops?: string[], min?: number, max?: number, patterns?: Array<{fixed:number,op:string,min:number,max:number}>, aantal: number }} settings
 * @returns {Array<{ a: number, op: string, b: number, answer: number }>}
 */
export function generateSession(settings) {
  const seen = new Set();
  const exercises = [];
  let attempts = 0;
  const maxAttempts = settings.aantal * 20;

  function nextEx() {
    if (settings.patterns) {
      const pattern = settings.patterns[Math.floor(Math.random() * settings.patterns.length)];
      return generateFromPattern(pattern);
    }
    return generateExercise(settings);
  }

  while (exercises.length < settings.aantal && attempts < maxAttempts) {
    const ex = nextEx();
    const key = `${ex.a}${ex.op}${ex.b}`;
    if (!seen.has(key)) {
      seen.add(key);
      exercises.push(ex);
    }
    attempts++;
  }

  // If range too small for unique exercises, allow duplicates to fill remainder
  while (exercises.length < settings.aantal) {
    exercises.push(nextEx());
  }

  return exercises;
}
```

- [ ] **Step 5: Open test.html in browser**

All 14 tests should now show green. If any of the new 6 fail, check `generateFromPattern` logic.

- [ ] **Step 6: Commit**

```bash
git add exercises.js test.html
git commit -m "feat: add generateFromPattern and extend generateSession for custom patterns"
```

---

## Task 2: CSS styles for toggle and pattern rows

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add styles at the end of style.css**

Append the following to the end of `style.css`:

```css
/* Mode toggle */
.mode-toggle { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.mode-btn {
  flex: 1;
  font-family: 'Nunito', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  padding: 0.6rem 1rem;
  border: 2px solid #d0e4ff;
  border-radius: 999px;
  background: white;
  color: #555;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  margin-top: 0;
  width: auto;
}
.mode-btn.active { background: #1a73e8; color: white; border-color: #1a73e8; }

/* Pattern rows */
.pattern-list { margin-bottom: 0.75rem; }
.pattern-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
  flex-wrap: wrap;
}
.pat-fixed { width: 70px !important; flex-shrink: 0; }
.pat-min, .pat-max { width: 60px !important; flex-shrink: 0; }
.pat-label { font-size: 0.9rem; font-weight: 700; color: #555; white-space: nowrap; }
select.pat-op {
  font-family: 'Nunito', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  padding: 0.55rem 0.4rem;
  border: 3px solid #d0e4ff;
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}
select.pat-op:focus { border-color: #1a73e8; }
.btn-delete-pattern {
  font-size: 1rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: #fce8e6;
  color: #d93025;
  cursor: pointer;
  border: none;
  margin-left: auto;
  margin-top: 0;
  width: auto;
}
.btn-add-pattern {
  font-family: 'Nunito', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  background: #e8f0fe;
  color: #1a73e8;
  border: none;
  cursor: pointer;
  margin-top: 0;
  width: auto;
}
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. The settings screen should look unchanged (new classes aren't used yet). No CSS errors in the console.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add CSS for mode toggle and custom pattern rows"
```

---

## Task 3: Settings screen HTML

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the entire screen-instellingen div**

Replace the `<div id="screen-instellingen" class="screen active">` block (lines 13–49) with:

```html
<div id="screen-instellingen" class="screen active">
  <h1>Rekenapp 🧮</h1>
  <div class="card">
    <!-- Mode toggle -->
    <div class="mode-toggle">
      <button class="mode-btn active" id="btn-mode-random">Willekeurig 🎲</button>
      <button class="mode-btn" id="btn-mode-eigen">Eigen sommen ✏️</button>
    </div>

    <!-- Random mode section -->
    <div id="random-section">
      <h2>Bewerkingen</h2>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" id="op-plus" value="+"> <span>Optellen (+)</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="op-min" value="-"> <span>Aftrekken (−)</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="op-keer" value="×"> <span>Vermenigvuldigen (×)</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="op-delen" value="÷"> <span>Delen (÷)</span>
        </label>
      </div>

      <h2>Getallen</h2>
      <div class="number-row">
        <label for="min-getal">Van:</label>
        <input type="number" id="min-getal" value="1" min="1">
        <label for="max-getal">Tot:</label>
        <input type="number" id="max-getal" value="10" min="2">
      </div>
      <div class="error-msg" id="getal-error"></div>
    </div>

    <!-- Eigen sommen section (hidden by default) -->
    <div id="eigen-section" style="display:none">
      <h2>Jouw sommen</h2>
      <div id="pattern-list"></div>
      <button class="btn-add-pattern" id="btn-add-pattern">＋ Som toevoegen</button>
    </div>

    <!-- Shared: number of exercises -->
    <h2>Aantal oefeningen</h2>
    <div class="number-row">
      <input type="number" id="aantal" value="10" min="1" max="50">
    </div>
    <div class="error-msg" id="aantal-error"></div>

    <button class="btn-primary" id="btn-starten" disabled>Starten! 🚀</button>
  </div>
</div>
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. The settings screen should show:
- Two toggle pills at the top ("Willekeurig 🎲" selected/blue, "Eigen sommen ✏️" unselected)
- Existing Bewerkingen + Getallen sections below
- Aantal oefeningen and Starten button at the bottom

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add mode toggle and eigen-section HTML to settings screen"
```

---

## Task 4: app.js — mode switching, pattern management, validation

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add mode state variable**

After the existing state variables block (after `let settings = null;`), add:

```js
let mode = 'random'; // 'random' | 'eigen'
```

- [ ] **Step 2: Add eigen-section element references**

After the existing settings screen elements block (after the `opCheckboxes` line), add:

```js
// --- Mode toggle elements ---
const btnModeRandom = document.getElementById('btn-mode-random');
const btnModeEigen = document.getElementById('btn-mode-eigen');
const randomSection = document.getElementById('random-section');
const eigenSection = document.getElementById('eigen-section');
const patternList = document.getElementById('pattern-list');
const btnAddPattern = document.getElementById('btn-add-pattern');
```

- [ ] **Step 3: Replace the validate() function**

Replace the existing `validate()` function with:

```js
function validate() {
  if (mode === 'random') {
    const ops = [...opCheckboxes].filter(c => c.checked).map(c => c.value);
    const min = parseInt(minInput.value, 10);
    const max = parseInt(maxInput.value, 10);
    const aantal = parseInt(aantalInput.value, 10);
    let valid = true;

    if (isNaN(min) || isNaN(max) || min < 1 || max <= min) {
      getalError.textContent = 'Het maximale getal moet groter zijn dan het minimale getal (minimaal 1).';
      valid = false;
    } else {
      getalError.textContent = '';
    }

    if (isNaN(aantal) || aantal < 1 || aantal > 50) {
      aantalError.textContent = 'Kies een aantal tussen 1 en 50.';
      valid = false;
    } else {
      aantalError.textContent = '';
    }

    btnStarten.disabled = !(valid && ops.length > 0);
  } else {
    const aantal = parseInt(aantalInput.value, 10);
    if (isNaN(aantal) || aantal < 1 || aantal > 50) {
      aantalError.textContent = 'Kies een aantal tussen 1 en 50.';
      btnStarten.disabled = true;
    } else {
      aantalError.textContent = '';
      btnStarten.disabled = getValidPatterns().length === 0;
    }
  }
}
```

- [ ] **Step 4: Replace the btnStarten click handler**

Replace the existing `btnStarten.addEventListener('click', ...)` block with:

```js
btnStarten.addEventListener('click', () => {
  const aantal = parseInt(aantalInput.value, 10);
  if (mode === 'random') {
    const ops = [...opCheckboxes].filter(c => c.checked).map(c => c.value);
    settings = {
      ops,
      min: parseInt(minInput.value, 10),
      max: parseInt(maxInput.value, 10),
      aantal,
    };
  } else {
    settings = { patterns: getValidPatterns(), aantal };
  }
  session = generateSession(settings);
  sessionIndex = 0;
  results = [];
  showScreen('screen-oefening');
  showExercise();
});
```

- [ ] **Step 5: Add mode toggle handlers, pattern management, and getValidPatterns after showScreen()**

Add the following block after the `function showScreen(id) { ... }` function:

```js
// --- Mode toggle ---
btnModeRandom.addEventListener('click', () => {
  mode = 'random';
  btnModeRandom.classList.add('active');
  btnModeEigen.classList.remove('active');
  randomSection.style.display = '';
  eigenSection.style.display = 'none';
  validate();
});

btnModeEigen.addEventListener('click', () => {
  mode = 'eigen';
  btnModeEigen.classList.add('active');
  btnModeRandom.classList.remove('active');
  randomSection.style.display = 'none';
  eigenSection.style.display = '';
  validate();
});

// --- Pattern management ---
let patternIdCounter = 0;

function getValidPatterns() {
  return [...patternList.querySelectorAll('.pattern-row')].map(row => {
    const fixed = parseInt(row.querySelector('.pat-fixed').value, 10);
    const op = row.querySelector('.pat-op').value;
    const min = parseInt(row.querySelector('.pat-min').value, 10);
    const max = parseInt(row.querySelector('.pat-max').value, 10);
    if (isNaN(fixed) || fixed < 1) return null;
    if (isNaN(min) || min < 1) return null;
    if (isNaN(max) || max <= min) return null;
    if (op === '-' && max >= fixed) return null;
    return { fixed, op, min, max };
  }).filter(Boolean);
}

function addPatternRow() {
  const id = ++patternIdCounter;
  const row = document.createElement('div');
  row.className = 'pattern-row';
  row.dataset.id = id;
  row.innerHTML = `
    <input type="number" class="pat-fixed" placeholder="Getal" min="1">
    <select class="pat-op">
      <option value="+">+</option>
      <option value="-">−</option>
      <option value="×">×</option>
      <option value="÷">÷</option>
    </select>
    <span class="pat-label">van</span>
    <input type="number" class="pat-min" placeholder="1" min="1">
    <span class="pat-label">tot</span>
    <input type="number" class="pat-max" placeholder="9" min="1">
    <button class="btn-delete-pattern" type="button">✕</button>
  `;
  row.querySelector('.btn-delete-pattern').addEventListener('click', () => {
    row.remove();
    validate();
  });
  row.querySelectorAll('input, select').forEach(el => el.addEventListener('input', validate));
  patternList.appendChild(row);
  validate();
}

btnAddPattern.addEventListener('click', addPatternRow);
```

- [ ] **Step 6: Verify random mode still works**

Open `index.html`. In Willekeurig mode:
- Check one operation, set valid numbers, count → Starten enables ✓
- Uncheck all operations → Starten disables ✓
- Set min > max → error appears ✓

- [ ] **Step 7: Verify eigen mode**

Click "Eigen sommen ✏️":
- Bewerkingen + Getallen sections disappear ✓
- "Jouw sommen" section appears ✓
- Starten stays disabled (no patterns yet) ✓
- Click "＋ Som toevoegen" → a pattern row appears ✓
- Fill in `vast getal=9`, operation=`−`, van=1, tot=8 → Starten enables ✓
- Delete the row → Starten disables again ✓
- Switch back to Willekeurig → random sections reappear ✓

- [ ] **Step 8: Verify a full custom session**

Click Eigen sommen, add pattern `9 − van 1 tot 8`, set aantal=5, click Starten. All 5 exercises should be `9 − ?` with `?` between 1 and 8.

- [ ] **Step 9: Commit**

```bash
git add app.js
git commit -m "feat: add mode toggle and custom pattern management to settings"
```

---

## Task 5: Push to GitHub

**Files:**
- No changes

- [ ] **Step 1: Push**

```bash
git push
```

- [ ] **Step 2: Verify git log**

```bash
git log --oneline -6
```

Expected output (most recent first):
```
<sha> feat: add mode toggle and custom pattern management to settings
<sha> feat: add mode toggle and eigen-section HTML to settings screen
<sha> feat: add CSS for mode toggle and custom pattern rows
<sha> feat: add generateFromPattern and extend generateSession for custom patterns
<sha> docs: add eigen sommen feature design spec
<sha> fix: add null guard on replay button and remove redundant inline style
```

The app is live at `https://driesdptest.github.io/my-first-project/` after GitHub Pages picks up the push (~1 minute).
