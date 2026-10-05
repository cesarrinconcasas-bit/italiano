// Cálculos compartidos entre pantallas (metas, racha, conteos).
import { get, day } from './store.js';
import { todayStr, addDays, dueQueue, isLearned, newCard } from './srs.js';
import { LESSONS, getLesson } from './data/lessons.js';

// Quién es "yo" en los diálogos.
export const ME = 'cesar';

export function lessonState(id) {
  return get().lessons[id] || { step: 0, done: false, bestScore: null, lastScore: null, attempts: 0 };
}

export function nextLesson() {
  return LESSONS.find((l) => !lessonState(l.id).done) || null;
}

export function dueCount() {
  return dueQueue(get().cards, todayStr(), 999).length;
}

function active(d) {
  return d && (d.reviewed > 0 || d.steps > 0 || d.recordings > 0 || (d.lessonsDone && d.lessonsDone.length));
}

export function streak() {
  const days = get().days;
  let t = todayStr();
  if (!active(days[t])) t = addDays(t, -1);
  let n = 0;
  while (active(days[t])) {
    n++;
    t = addDays(t, -1);
  }
  return n;
}

export function lastDays(n = 14) {
  const out = [];
  let t = todayStr();
  for (let i = 0; i < n; i++) {
    out.unshift({ date: t, active: !!active(get().days[t]) });
    t = addDays(t, -1);
  }
  return out;
}

// Metas pequeñas del día.
export function todayGoals() {
  const d = get().days[todayStr()] || { reviewed: 0, recordings: 0, steps: 0, lessonsDone: [] };
  const due = dueCount();
  return [
    {
      id: 'review',
      label: due > 0 ? `Repasar tus tarjetas (${due} pendientes)` : 'Repaso al día',
      done: due === 0,
      href: '#/repaso',
    },
    {
      id: 'lesson',
      label: 'Avanzar 3 partes de una lección (o terminar una)',
      done: d.steps >= 3 || d.lessonsDone.length > 0,
      progress: `${Math.min(d.steps, 3)}/3`,
      href: '#/lecciones',
    },
    {
      id: 'speak',
      label: 'Grabarte 3 veces y comparar',
      done: d.recordings >= 3,
      progress: `${Math.min(d.recordings, 3)}/3`,
      href: '#/lecciones',
    },
  ];
}

// Busca la palabra o frase de una tarjeta "lección:item".
export function itemForCard(id) {
  const [lid, iid] = id.split(':');
  const lesson = getLesson(lid);
  if (!lesson) return null;
  const vocab = lesson.vocab.find((x) => x.id === iid);
  const item = vocab || lesson.phrases.find((x) => x.id === iid);
  return item ? { lesson, item, kind: vocab ? 'word' : 'phrase' } : null;
}

export function learnedCount() {
  return Object.values(get().cards).filter(isLearned).length;
}

// Presenta una palabra o frase: entra al repaso a partir de mañana.
export function introduce(state, id) {
  if (!state.cards[id]) {
    const t = todayStr();
    state.cards[id] = { ...newCard(t), due: addDays(t, 1) };
  }
}

export function markStep() {
  day().steps += 1;
}

export function formatDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-US', { weekday: 'short', day: 'numeric', month: 'short' });
}
