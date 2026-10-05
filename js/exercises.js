// Arma la lista de ejercicios de una lección: automáticos (vocabulario y frases)
// + los escritos a mano. `rand` se puede inyectar para pruebas.
import { normalize } from './check.js';

export function shuffle(arr, rand = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const cardId = (lessonId, itemId) => `${lessonId}:${itemId}`;

// Busca la tarjeta (palabra o frase) que corresponde a un texto en italiano.
export function findCardFor(lesson, text) {
  if (!text) return null;
  const n = normalize(text);
  const item = [...lesson.vocab, ...lesson.phrases].find((it) => normalize(it.ita) === n);
  return item ? cardId(lesson.id, item.id) : null;
}

function distractors(pool, correct, key, count, rand) {
  const others = pool.filter((it) => it[key] !== correct[key]);
  return shuffle(others, rand).slice(0, count).map((it) => it[key]);
}

export function buildExercises(lesson, rand = Math.random) {
  const out = [];
  const vocab = shuffle(lesson.vocab, rand).slice(0, 3);
  const phrases = shuffle(lesson.phrases, rand).slice(0, 3);

  vocab.forEach((it, i) => {
    out.push({
      type: 'pick',
      prompt: 'Escucha. ¿Qué significa?',
      audio: it.say || it.ita,
      audioOnly: true,
      options: shuffle([it.es, ...distractors(lesson.vocab, it, 'es', 2, rand)], rand),
      answer: it.es,
      optionsLang: 'es',
      why: `"${it.ita}" = ${it.es}.`,
      card: cardId(lesson.id, it.id),
      auto: true,
    });
    const ph = phrases[i];
    if (ph) {
      out.push({
        type: 'pick',
        prompt: `¿Cómo se dice en italiano? "${ph.es}"`,
        options: shuffle([ph.ita, ...distractors(lesson.phrases, ph, 'ita', 2, rand)], rand),
        answer: ph.ita,
        optionsLang: 'it',
        speakAnswer: ph.say || ph.ita,
        why: `"${ph.es}" = "${ph.ita}".`,
        card: cardId(lesson.id, ph.id),
        auto: true,
      });
    }
  });

  for (const ex of lesson.exercises) {
    const e = { ...ex };
    if (e.type === 'pick') {
      e.options = shuffle(e.options, rand);
      e.card = findCardFor(lesson, e.answer) || findCardFor(lesson, e.audio);
    } else if (e.type === 'build') {
      e.card = findCardFor(lesson, e.ita);
    } else if (e.type === 'type') {
      e.card = findCardFor(lesson, e.answer);
    }
    out.push(e);
  }
  return out;
}
