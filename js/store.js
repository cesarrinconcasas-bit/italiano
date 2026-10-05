// Estado guardado en el dispositivo (localStorage). Todo cambio pasa por update().
import { todayStr, newCard, grade, applyExercise } from './srs.js';

const KEY = 'italiano-cesar-v1';
const MAX_ERRORS = 300;

function defaults() {
  return {
    version: 1,
    name: 'Cesar',
    created: todayStr(),
    settings: { voiceF: '', voiceF2: '', voiceM: '', slowRate: 0.6 },
    lessons: {}, // id → { step, done, bestScore, lastScore, completedAt, attempts }
    cards: {}, // "lección:item" → tarjeta SRS
    errors: [], // { date, lesson, prompt, given, expected }
    days: {}, // fecha → { reviewed, recordings, steps, lessonsDone: [] }
  };
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return mergeDefaults(JSON.parse(raw));
  } catch (e) {
    console.warn('No se pudo leer el progreso', e);
  }
  return defaults();
}

function mergeDefaults(s) {
  const d = defaults();
  return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) } };
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('No se pudo guardar el progreso', e);
    return false;
  }
}

export function get() {
  return state;
}

export function update(fn) {
  fn(state);
  save();
  listeners.forEach((l) => l(state));
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function day(date = todayStr()) {
  if (!state.days[date]) state.days[date] = { reviewed: 0, recordings: 0, steps: 0, lessonsDone: [] };
  return state.days[date];
}

export function ensureCard(id) {
  if (!state.cards[id]) state.cards[id] = newCard(todayStr());
  return state.cards[id];
}

export function gradeCard(id, result) {
  update((s) => {
    const t = todayStr();
    s.cards[id] = grade(ensureCard(id), result, t);
    day(t).reviewed += 1;
  });
}

export function exerciseResult(id, correct) {
  if (!id) return;
  update((s) => {
    s.cards[id] = applyExercise(ensureCard(id), correct, todayStr());
  });
}

export function logError(entry) {
  update((s) => {
    s.errors.unshift({ date: todayStr(), ...entry });
    if (s.errors.length > MAX_ERRORS) s.errors.length = MAX_ERRORS;
  });
}

export function countRecording() {
  update(() => {
    day().recordings += 1;
  });
}

export function exportJSON() {
  return JSON.stringify({ app: 'italiano-cesar', exported: new Date().toISOString(), state }, null, 1);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'italiano-cesar' || !data.state || !data.state.cards) {
    throw new Error('Este archivo no es una copia de seguridad de esta app.');
  }
  state = mergeDefaults(data.state);
  save();
  listeners.forEach((l) => l(state));
}

export function resetAll() {
  state = defaults();
  save();
  listeners.forEach((l) => l(state));
}

// Pide al navegador que no borre los datos automáticamente (si lo permite).
export async function requestPersist() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch (e) {
    /* no disponible */
  }
  return false;
}
