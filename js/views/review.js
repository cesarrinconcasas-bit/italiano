// Repaso diario: recordar sin mirar, con autoevaluación honesta (sé honesto contigo).
import { h, icon, btn, audioControls, put, clear } from '../ui.js';
import * as speech from '../speech.js';
import { get, gradeCard } from '../store.js';
import { dueQueue, difficultQueue, todayStr, addDays } from '../srs.js';
import { itemForCard, dueCount } from '../common.js';

export function render(main, params) {
  const practice = params.mode === 'dificiles';
  const ids = (practice ? difficultQueue(get().cards) : dueQueue(get().cards, todayStr())).filter(itemForCard);
  const S = { queue: ids.map((id) => ({ id, again: 0 })), done: 0, total: ids.length, results: { again: 0, hard: 0, good: 0 } };
  const body = h('div');
  put(main, body);

  const empty = () => {
    const diff = difficultQueue(get().cards).length;
    const tomorrow = dueQueue(get().cards, addDays(todayStr(), 1), 999).length;
    clear(body) && put(body, 
      h('h1', null, 'Repaso'),
      h('div', { class: 'card' },
        h('h2', null, Object.keys(get().cards).length ? 'No tienes repasos pendientes hoy.' : 'Todavía no hay nada que repasar.'),
        h('p', null, Object.keys(get().cards).length
          ? `Mañana tendrás ${tomorrow} ${tomorrow === 1 ? 'tarjeta' : 'tarjetas'}. Repasar con días de por medio ayuda a recordar por más tiempo.`
          : 'Las palabras y frases de cada lección entran aquí después de verlas.'),
      ),
      diff
        ? h('a', { class: 'btn btn-secondary btn-block', href: '#/repaso/dificiles', 'data-act': 'practice-hard' }, `Practicar mis ${diff} palabras difíciles`)
        : null,
      h('a', { class: 'btn btn-primary btn-block', href: '#/lecciones' }, 'Ir a las lecciones'),
    );
  };

  if (!S.total) return empty();

  function draw() {
    speech.stop();
    clear(body) && put(body, );
    window.scrollTo(0, 0);
    if (!S.queue.length) return summary();
    const entry = S.queue[0];
    const { item, lesson } = itemForCard(entry.id);
    const text = item.say || item.ita;
    // Se alterna: ver el español y decirlo en italiano / escuchar el italiano y entenderlo.
    const mode = (S.done + entry.again) % 2 === 0 ? 'say' : 'listen';

    put(body, 
      h('div', { class: 'ex-progress' },
        h('span', null, practice ? `Práctica extra · ${S.done + 1} de ${S.total}` : `Repaso · ${S.done + 1} de ${S.total}`),
        h('span', { class: 'muted small' }, `Lección ${lesson.id}`),
      ),
    );

    const answer = h('div', { class: 'reveal', hidden: true },
      h('p', { class: 'item-ita', lang: 'it' }, item.ita),
      h('p', { class: 'item-es' }, item.es),
      audioControls(text, { key: `rev:${entry.id}` }),
      h('p', { class: 'ex-prompt center' }, '¿Lo recordaste?'),
      h('div', { class: 'grade-buttons' },
        btn('No lo sabía', () => rate('again'), { cls: 'grade again', attrs: { 'data-act': 'grade-again' } }),
        btn('Más o menos', () => rate('hard'), { cls: 'grade hard', attrs: { 'data-act': 'grade-hard' } }),
        btn('Lo sabía', () => rate('good'), { cls: 'grade good', attrs: { 'data-act': 'grade-good' } }),
      ),
    );

    const show = btn('Mostrar respuesta', () => {
      card.querySelector('.question').hidden = true;
      show.remove();
      answer.hidden = false;
      speech.speak(text);
    }, { cls: 'btn-primary btn-block', ic: 'eye', attrs: { 'data-act': 'reveal' } });

    const question = mode === 'say'
      ? h('div', { class: 'question' },
          h('p', { class: 'line-who' }, 'Dilo en voz alta en italiano, sin mirar:'),
          h('p', { class: 'item-es big' }, item.es))
      : h('div', { class: 'question' },
          h('p', { class: 'line-who' }, 'Escucha. ¿Qué significa? Piénsalo y luego revisa.'),
          speech.canSpeak() ? null : h('p', { class: 'item-ita big', lang: 'it' }, item.ita),
          h('div', { class: 'audio-row' },
            btn('Escuchar', () => speech.speak(text), { cls: 'btn-audio big', ic: 'play', attrs: { 'data-act': 'rev-listen' } }),
            btn('Lento', () => speech.speak(text, { slow: true }), { cls: 'btn-audio big', ic: 'slow' }),
          ));
    const card = h('div', { class: 'item-card' }, question, show, answer);
    put(body, card);
    if (mode === 'listen') speech.speak(text);

    function rate(result) {
      S.results[result] += 1;
      if (!practice) gradeCard(entry.id, result);
      S.queue.shift();
      if (result === 'again' && entry.again < 2) {
        S.queue.push({ ...entry, again: entry.again + 1 });
      } else {
        S.done += 1;
      }
      S.total = S.done + S.queue.length;
      draw();
    }
  }

  function summary() {
    const left = dueCount();
    put(body, 
      h('div', { class: 'celebrate' }, icon('check', 40)),
      h('h1', null, practice ? '¡Práctica terminada!' : '¡Repaso terminado!'),
      h('div', { class: 'card' },
        h('p', null, `Lo sabías: ${S.results.good} · Más o menos: ${S.results.hard} · Todavía no: ${S.results.again}`),
        practice
          ? h('p', { class: 'muted' }, 'La práctica extra no cambia tu calendario de repaso.')
          : h('p', { class: 'muted' }, 'Lo que no recordaste volverá pronto; lo que sabías, en unos días.'),
      ),
      left && !practice ? btn(`Seguir: ${left} pendientes`, () => {
        main.replaceChildren();
        render(main, params);
      }, { cls: 'btn-primary btn-block', attrs: { 'data-act': 'continue-review' } }) : null,
      h('a', { class: 'btn btn-secondary btn-block', href: '#/', 'data-act': 'to-home' }, 'Volver al inicio'),
    );
  }

  draw();
}
