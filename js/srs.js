// Repetición espaciada tipo Leitner. Funciones puras: reciben y devuelven datos.
// Una tarjeta = una palabra o frase. `box` sube cuando se recuerda y vuelve a 0 al fallar.

export const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64]; // días hasta el próximo repaso, por caja
export const LEARNED_BOX = 3; // recordada bien en 3 repasos espaciados

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return todayStr(new Date(y, m - 1, d + n));
}

export function newCard(today) {
  return { box: 0, due: today, reps: 0, lapses: 0, last: null };
}

// result: 'again' (no lo sabía) | 'hard' (más o menos) | 'good' (lo sabía)
export function grade(card, result, today) {
  const c = { ...card, reps: card.reps + 1, last: today };
  if (result === 'again') {
    c.box = 0;
    c.lapses = card.lapses + 1;
    c.due = today;
  } else if (result === 'hard') {
    c.box = Math.max(1, card.box);
    c.due = addDays(today, 1);
  } else {
    c.box = Math.min(card.box + 1, INTERVALS.length - 1);
    c.due = addDays(today, INTERVALS[c.box]);
  }
  return c;
}

// Resultado de un ejercicio dentro de una lección. Un acierto el mismo día que ya se
// practicó no sube de caja (repetir en la misma sesión no es repaso espaciado).
export function applyExercise(card, correct, today) {
  if (!correct) return grade(card, 'again', today);
  if (card.last === today && card.reps > 0) return card;
  return grade(card, 'good', today);
}

export function isDue(card, today) {
  return card.due <= today;
}

export function isLearned(card) {
  return card.box >= LEARNED_BOX;
}

export function isDifficult(card) {
  return card.lapses >= 2 || (card.lapses >= 1 && card.box < LEARNED_BOX);
}

// Tarjetas pendientes hoy: primero las más falladas, luego las más atrasadas.
export function dueQueue(cards, today, limit = 20) {
  return Object.entries(cards)
    .filter(([, c]) => isDue(c, today))
    .sort(([, a], [, b]) => b.lapses - a.lapses || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))
    .slice(0, limit)
    .map(([id]) => id);
}

export function difficultQueue(cards, limit = 15) {
  return Object.entries(cards)
    .filter(([, c]) => c.lapses > 0)
    .sort(([, a], [, b]) => b.lapses - a.lapses || a.box - b.box)
    .slice(0, limit)
    .map(([id]) => id);
}
