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
function launchConfetti() {}
function showResults() {}
