/**
 * Generate a single exercise object.
 * @param {{ ops: string[], min: number, max: number }} settings
 * @returns {{ a: number, op: string, b: number, answer: number }}
 */
export function generateExercise(settings) {
  const { ops, min, max } = settings;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;

  if (op === '+') {
    a = randInt(min, max);
    b = randInt(min, max);
    answer = a + b;
  } else if (op === '-') {
    a = randInt(min, max);
    b = randInt(min, max);
    if (b > a) [a, b] = [b, a];
    answer = a - b;
  } else if (op === '×') {
    a = randInt(min, max);
    b = randInt(min, max);
    answer = a * b;
  } else {
    // Division: generate answer and divisor first to guarantee whole numbers
    answer = randInt(min, max);
    b = randInt(min, max);
    if (b === 0) b = 1;
    a = answer * b;
    if (a > max) {
      b = Math.max(1, Math.floor(max / answer));
      a = answer * b;
    }
  }

  return { a, op, b, answer };
}

/**
 * Generate a session of N unique exercises.
 * @param {{ ops: string[], min: number, max: number, aantal: number }} settings
 * @returns {Array<{ a: number, op: string, b: number, answer: number }>}
 */
export function generateSession(settings) {
  const seen = new Set();
  const exercises = [];
  let attempts = 0;
  const maxAttempts = settings.aantal * 20;

  while (exercises.length < settings.aantal && attempts < maxAttempts) {
    const ex = generateExercise(settings);
    const key = `${ex.a}${ex.op}${ex.b}`;
    if (!seen.has(key)) {
      seen.add(key);
      exercises.push(ex);
    }
    attempts++;
  }

  // If range too small for unique exercises, allow duplicates to fill remainder
  while (exercises.length < settings.aantal) {
    exercises.push(generateExercise(settings));
  }

  return exercises;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
