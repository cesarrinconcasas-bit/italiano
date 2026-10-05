import { h, icon, put } from '../ui.js';
import { getLesson } from '../data/lessons.js';
import { PLAN, DAILY_ROUTINE, WEEK_SCHEDULE } from '../data/plan.js';
import { lessonState } from '../common.js';

function lessonCard(l) {
  const st = lessonState(l.id);
  const status = st.done ? (st.bestScore != null ? `Completada · ${st.bestScore}%` : 'Completada') : st.step > 0 ? 'En curso' : 'Nueva';
  return h('a', { class: `lesson-card ${st.done ? 'done' : ''}`, href: `#/leccion/${l.id}`, 'data-lesson': l.id },
    h('span', { class: 'lesson-num' }, st.done ? icon('check', 22) : String(l.id)),
    h('span', { class: 'lesson-text' },
      h('span', { class: 'lesson-title' }, l.title),
      h('span', { class: 'lesson-sub' }, `${l.titleIt} · ${l.minutes} min`),
      h('span', { class: `lesson-status ${st.done ? 'ok' : ''}` }, status),
    ),
    icon('right'),
  );
}

export function render(main) {
  put(main, 
    h('h1', null, 'Lecciones y plan'),
    h('p', { class: 'muted' }, 'Plan de 8 semanas de italiano para viajar: de cero a A1, con lo útil de A2. Haz las lecciones en orden.'),
    h('details', { class: 'card' },
      h('summary', null, 'Cómo usar el plan cada día y cada semana'),
      h('h3', null, 'Cada día (15–20 min)'),
      h('ol', null, DAILY_ROUTINE.map((r) => h('li', null, r))),
      h('h3', null, 'Cada semana'),
      h('ul', { class: 'schedule' }, WEEK_SCHEDULE.map((d) => h('li', null, h('strong', null, d.day + ': '), d.task))),
    ),
  );

  for (const w of PLAN) {
    const sec = h('section', { class: 'week' },
      h('div', { class: 'week-head' },
        h('h2', null, `Semana ${w.week}`),
        h('span', { class: 'pill' }, w.level),
      ),
      h('p', { class: 'week-title' }, w.title),
    );
    if (w.lessons) {
      w.lessons.map(getLesson).forEach((l) => put(sec, lessonCard(l)));
    } else {
      put(sec, 
        h('div', { class: 'planned' },
          h('p', { class: 'muted small' }, 'Próximamente. Lo que aprenderás:'),
          h('ul', { class: 'can-do' }, w.canDo.map((c) => h('li', null, c))),
          h('p', { class: 'muted small' }, 'Ejemplos: ', w.topics.join(' · ')),
        ),
      );
    }
    put(main, sec);
  }
}
