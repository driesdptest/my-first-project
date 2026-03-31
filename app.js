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

// --- Placeholders: filled in later tasks ---
function showExercise() {}
