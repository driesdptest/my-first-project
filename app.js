import { generateSession } from './exercises.js';

// --- State ---
let session = null;     // array of { a, op, b, answer }
let sessionIndex = 0;
let results = [];       // array of booleans (true = correct)
let settings = null;

// --- Settings screen elements ---
const btnStarten = document.getElementById('btn-starten');
const getalError = document.getElementById('getal-error');
const aantalError = document.getElementById('aantal-error');
const minInput = document.getElementById('min-getal');
const maxInput = document.getElementById('max-getal');
const aantalInput = document.getElementById('aantal');
const opCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');

// --- Validation ---
function validate() {
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
}

opCheckboxes.forEach(c => c.addEventListener('change', validate));
minInput.addEventListener('input', validate);
maxInput.addEventListener('input', validate);
aantalInput.addEventListener('input', validate);

// --- Start session ---
btnStarten.addEventListener('click', () => {
  const ops = [...opCheckboxes].filter(c => c.checked).map(c => c.value);
  settings = {
    ops,
    min: parseInt(minInput.value, 10),
    max: parseInt(maxInput.value, 10),
    aantal: parseInt(aantalInput.value, 10),
  };
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

// --- Exercise screen elements ---
const problemDisplay = document.getElementById('problem-display');
const answerInput = document.getElementById('answer-input');
const feedbackMsg = document.getElementById('feedback-msg');
const progressLabel = document.getElementById('progress-label');
const progressFill = document.getElementById('progress-fill');
const btnControleren = document.getElementById('btn-controleren');

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
  setTimeout(() => answerInput.focus(), 100);
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

btnControleren.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });

function checkAnswer() {
  const userAnswer = parseInt(answerInput.value, 10);
  if (isNaN(userAnswer)) { answerInput.focus(); return; }

  const correct = session[sessionIndex].answer;

  if (userAnswer === correct) {
    results.push(true);
    feedbackMsg.textContent = CELEBRATION_MSGS[Math.floor(Math.random() * CELEBRATION_MSGS.length)];
    feedbackMsg.className = 'feedback correct';
    launchConfetti();
    btnControleren.disabled = true;
    answerInput.disabled = true;
    setTimeout(() => {
      btnControleren.disabled = false;
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
      answerInput.focus();
    } else {
      results.push(false);
      feedbackMsg.textContent = `Het antwoord is ${correct}`;
      feedbackMsg.className = 'feedback reveal';
      btnControleren.disabled = true;
      answerInput.disabled = true;
      setTimeout(() => {
        btnControleren.disabled = false;
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
  session = generateSession(settings);
  sessionIndex = 0;
  results = [];
  showScreen('screen-oefening');
  showExercise();
});

btnInstellingen.addEventListener('click', () => {
  showScreen('screen-instellingen');
});
