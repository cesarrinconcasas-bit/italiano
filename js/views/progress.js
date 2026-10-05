import { h, btn, put } from '../ui.js';
import * as speech from '../speech.js';
import { get } from '../store.js';
import { isLearned, todayStr } from '../srs.js';
import { LESSONS } from '../data/lessons.js';
import { lessonState, streak, lastDays, itemForCard, formatDate } from '../common.js';

export function render(main) {
  const s = get();
  const cards = Object.entries(s.cards).filter(([id]) => itemForCard(id));
  const learned = cards.filter(([, c]) => isLearned(c));
  const practicing = cards.length - learned.length;
  const today = s.days[todayStr()] || { reviewed: 0, recordings: 0 };

  put(main, 
    h('h1', null, 'Mi progreso'),
    h('section', { class: 'stats-grid' },
      stat(streak(), 'días seguidos'),
      stat(`${LESSONS.filter((l) => lessonState(l.id).done).length}/${LESSONS.length}`, 'lecciones'),
      stat(learned.length, 'aprendidas'),
      stat(practicing, 'en práctica'),
      stat(today.reviewed, 'repasos hoy'),
      stat(today.recordings, 'grabaciones hoy'),
    ),
    h('p', { class: 'muted small' }, '"Aprendida" = la recordaste en 3 repasos separados por días. "En práctica" = ya la viste, pero todavía la estás afianzando.'),
    h('section', { class: 'card' },
      h('h2', null, 'Últimos 14 días'),
      h('div', { class: 'days' }, lastDays().map((d) => h('span', { class: `day ${d.active ? 'on' : ''}`, title: formatDate(d.date), 'aria-label': `${formatDate(d.date)}: ${d.active ? 'practicaste' : 'sin práctica'}` }))),
    ),
  );

  // Palabras difíciles
  const hard = cards.filter(([, c]) => c.lapses > 0).sort(([, a], [, b]) => b.lapses - a.lapses).slice(0, 12);
  put(main, 
    h('section', { class: 'card' },
      h('h2', null, 'Lo que más te cuesta'),
      hard.length
        ? h('ul', { class: 'word-list' }, hard.map(([id, c]) => {
            const { item } = itemForCard(id);
            return h('li', null,
              btn('', () => speech.speak(item.say || item.ita), { cls: 'icon-btn', ic: 'play', attrs: { 'aria-label': `Escuchar ${item.ita}` } }),
              h('span', null, h('strong', { lang: 'it' }, item.ita), h('br'), h('span', { class: 'muted' }, item.es)),
              h('span', { class: 'pill' }, `${c.lapses} ${c.lapses === 1 ? 'fallo' : 'fallos'}`),
            );
          }))
        : h('p', { class: 'muted' }, 'Aún no hay palabras difíciles. Aparecerán aquí las que falles.'),
      hard.length ? h('a', { class: 'btn btn-secondary btn-block', href: '#/repaso/dificiles' }, 'Practicarlas ahora') : null,
    ),
  );

  // Errores recientes
  put(main, 
    h('section', { class: 'card' },
      h('h2', null, 'Errores recientes'),
      s.errors.length
        ? h('ul', { class: 'errors' }, s.errors.slice(0, 20).map((e) =>
            h('li', null,
              h('span', { class: 'muted small' }, `${formatDate(e.date)} · Lección ${e.lesson}`),
              h('span', null, e.prompt),
              h('span', null, 'Tu respuesta: ', h('em', null, e.given)),
              h('span', null, 'Correcto: ', h('strong', null, e.expected)),
            )))
        : h('p', { class: 'muted' }, 'Sin errores registrados todavía.'),
    ),
  );

  // Lecciones
  put(main, 
    h('section', { class: 'card' },
      h('h2', null, 'Lecciones'),
      h('ul', { class: 'lesson-scores' }, LESSONS.map((l) => {
        const st = lessonState(l.id);
        return h('li', null,
          h('a', { href: `#/leccion/${l.id}` }, `${l.id}. ${l.title}`),
          h('span', { class: st.done ? 'ok-text' : 'muted' },
            st.done ? (st.bestScore != null ? `${st.bestScore}% · ${st.attempts} ${st.attempts === 1 ? 'vez' : 'veces'}` : 'Completada') : st.step > 0 ? 'En curso' : 'Pendiente'),
        );
      })),
    ),
  );
}

function stat(n, label) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat-num' }, String(n)), h('span', { class: 'stat-label' }, label));
}
