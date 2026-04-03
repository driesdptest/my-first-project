import { generateSession } from './exercises.js';

// --- State ---
let session = null;     // array of { a, op, b, answer }
let sessionIndex = 0;
let results = [];       // array of booleans (true = correct)
let settings = null;
let mode = 'random'; // 'random' | 'eigen'

// --- Settings screen elements ---
const btnStarten = document.getElementById('btn-starten');
const getalError = document.getElementById('getal-error');
const aantalError = document.getElementById('aantal-error');
const minInput = document.getElementById('min-getal');
const maxInput = document.getElementById('max-getal');
const aantalInput = document.getElementById('aantal');
const opCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');

// --- Mode toggle elements ---
const btnModeRandom = document.getElementById('btn-mode-random');
const btnModeEigen = document.getElementById('btn-mode-eigen');
const randomSection = document.getElementById('random-section');
const eigenSection = document.getElementById('eigen-section');
const patternList = document.getElementById('pattern-list');
const btnAddPattern = document.getElementById('btn-add-pattern');

// --- Validation ---
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
    getalError.textContent = '';
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

opCheckboxes.forEach(c => c.addEventListener('change', validate));
minInput.addEventListener('input', validate);
maxInput.addEventListener('input', validate);
aantalInput.addEventListener('input', validate);

// --- Start session ---
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

// --- Screen transitions ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

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
  const row = document.createElement('div');
  row.className = 'pattern-row';
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

// --- Exercise screen elements ---
const problemDisplay = document.getElementById('problem-display');
const answerInput = document.getElementById('answer-input');
const feedbackMsg = document.getElementById('feedback-msg');
const progressLabel = document.getElementById('progress-label');
const progressFill = document.getElementById('progress-fill');
const numpadBtns = document.querySelectorAll('.numpad-btn');

function setNumpadEnabled(enabled) {
  numpadBtns.forEach(btn => { btn.disabled = !enabled; });
}

const CELEBRATION_MSGS = [
  'Goed zo! 🎉', 'Super! ⭐', 'Wauw, geweldig! 🌟',
  'Fantastisch! 🏆', 'Jij bent een rekenster! 🌈', 'Bravo! 👏'
];

let attempts = 0;

function showExercise() {
  const ex = session[sessionIndex];
  problemDisplay.textContent = `${ex.a} ${ex.op} ${ex.b} = ?`;
  answerInput.value = '';
  feedbackMsg.textContent = '';
  feedbackMsg.className = 'feedback';
  attempts = 0;
  updateProgress();
}

function updateProgress() {
  const current = sessionIndex + 1;
  const total = session.length;
  progressLabel.textContent = `Vraag ${current} van ${total}`;
  progressFill.style.width = `${((current - 1) / total) * 100}%`;
}

function nextExercise() {
  sessionIndex++;
  if (sessionIndex >= session.length) {
    showResults();
  } else {
    showExercise();
  }
}

document.querySelector('.numpad').addEventListener('click', e => {
  const btn = e.target.closest('.numpad-btn');
  if (!btn || btn.disabled) return;
  const val = btn.dataset.val;
  if (val === 'wis') {
    answerInput.value = '';
  } else if (btn.classList.contains('numpad-ok')) {
    checkAnswer();
  } else {
    if (answerInput.value.length < 4) {
      answerInput.value += val;
    }
  }
});

function checkAnswer() {
  const userAnswer = parseInt(answerInput.value, 10);
  if (isNaN(userAnswer)) return;

  const correct = session[sessionIndex].answer;

  if (userAnswer === correct) {
    results.push(true);
    feedbackMsg.textContent = CELEBRATION_MSGS[Math.floor(Math.random() * CELEBRATION_MSGS.length)];
    feedbackMsg.className = 'feedback correct';
    launchConfetti();
    setNumpadEnabled(false);
    answerInput.disabled = true;
    setTimeout(() => {
      setNumpadEnabled(true);
      answerInput.disabled = false;
      nextExercise();
    }, 1500);
  } else {
    attempts++;
    if (attempts < 3) {
      const msgs = ['Probeer nog eens! 💪', 'Bijna! Probeer nog één keer! 🤔'];
      feedbackMsg.textContent = msgs[Math.min(attempts - 1, msgs.length - 1)];
      feedbackMsg.className = 'feedback wrong';
      triggerShake(answerInput);
      answerInput.value = '';
    } else {
      results.push(false);
      feedbackMsg.textContent = `Het antwoord is ${correct}`;
      feedbackMsg.className = 'feedback reveal';
      setNumpadEnabled(false);
      answerInput.disabled = true;
      setTimeout(() => {
        setNumpadEnabled(true);
        answerInput.disabled = false;
        nextExercise();
      }, 2000);
    }
  }
}

function triggerShake(el) {
  el.classList.remove('shake');
  void el.offsetWidth; // force reflow to restart animation
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

// Placeholders replaced in Tasks 7 and 8
const confettiCanvas = document.getElementById('confetti-canvas');
const ctx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiAnimating = false;
const CONFETTI_COLORS = ['#1a73e8','#fbbc04','#34a853','#ea4335','#ff6d00','#ab47bc'];

function launchConfetti(fullBurst = false) {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  const count = fullBurst ? 180 : 80;
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height * 0.4,
      w: 8 + Math.random() * 8,
      h: 5 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 6,
      alpha: 1,
    });
  }
  if (!confettiAnimating) animateConfetti();
}

function animateConfetti() {
  confettiAnimating = true;
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = confettiParticles.filter(p => p.alpha > 0.05);
  confettiParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.spin;
    p.alpha -= 0.012;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate((p.angle * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });
  if (confettiParticles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiAnimating = false;
  }
}

const starsDisplay = document.getElementById('stars-display');
const scoreDisplay = document.getElementById('score-display');
const resultMsg = document.getElementById('result-msg');
const btnOpnieuw = document.getElementById('btn-opnieuw');
const btnInstellingen = document.getElementById('btn-instellingen');

function showResults() {
  const correct = results.filter(Boolean).length;
  const total = results.length;
  const pct = correct / total;

  scoreDisplay.textContent = `Je hebt ${correct} van de ${total} sommen goed!`;

  if (pct >= 0.8) {
    starsDisplay.textContent = '⭐⭐⭐';
    resultMsg.textContent = 'Geweldig! Je bent een rekenkampioen! 🏆';
    launchConfetti(true);
  } else if (pct >= 0.5) {
    starsDisplay.textContent = '⭐⭐';
    resultMsg.textContent = 'Goed gedaan! Blijf zo doorgaan!';
  } else {
    starsDisplay.textContent = '☆☆☆';
    resultMsg.textContent = 'Blijf oefenen, je komt er!';
  }

  showScreen('screen-resultaten');
}

btnOpnieuw.addEventListener('click', () => {
  if (!settings) return;
  session = generateSession(settings);
  sessionIndex = 0;
  results = [];
  showScreen('screen-oefening');
  showExercise();
});

btnInstellingen.addEventListener('click', () => {
  showScreen('screen-instellingen');
});
