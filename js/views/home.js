import { h, icon, put } from '../ui.js';
import { get } from '../store.js';
import { LESSONS } from '../data/lessons.js';
import { PLAN } from '../data/plan.js';
import { nextLesson, lessonState, dueCount, streak, todayGoals, learnedCount } from '../common.js';

function greeting() {
  const hr = new Date().getHours();
  return hr < 12 ? 'Buenos días' : hr < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export function render(main) {
  const s = get();
  const next = nextLesson();
  const due = dueCount();
  const goals = todayGoals();
  const goalsDone = goals.filter((g) => g.done).length;
  const st = streak();

  put(main, 
    h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, greeting()),
      h('h1', null, `Hola, ${s.name}`),
      h('p', { class: 'muted' }, '15 a 20 minutos al día son suficientes. Lo importante es no dejar de practicar.'),
    ),
  );

  // Acción principal
  if (next) {
    const ls = lessonState(next.id);
    const resuming = ls.step > 0;
    put(main, 
      h('a', { class: 'big-action', href: `#/leccion/${next.id}`, 'data-act': 'continue-lesson' },
        h('span', { class: 'big-action-icon' }, icon('play', 28)),
        h('span', null,
          h('span', { class: 'big-action-label' }, resuming ? 'Continuar' : 'Empezar', ` · Lección ${next.id}`),
          h('span', { class: 'big-action-title' }, next.title),
          h('span', { class: 'big-action-sub' }, `${next.minutes} minutos aprox.`),
        ),
      ),
    );
  } else {
    put(main, h('div', { class: 'card' }, h('h2', null, '¡Terminaste todas las lecciones disponibles!'),
      h('p', null, 'Sigue con el repaso diario y repite las conversaciones. Las siguientes semanas del plan están en "Lecciones".')));
  }

  put(main, 
    h('a', { class: `big-action secondary ${due ? '' : 'quiet'}`, href: '#/repaso', 'data-act': 'go-review' },
      h('span', { class: 'big-action-icon' }, icon('cards', 28)),
      h('span', null,
        h('span', { class: 'big-action-label' }, 'Repaso de hoy'),
        h('span', { class: 'big-action-title' }, due ? `${due} ${due === 1 ? 'tarjeta pendiente' : 'tarjetas pendientes'}` : 'No tienes pendientes'),
        h('span', { class: 'big-action-sub' }, due ? 'Primero lo que más te cuesta.' : 'Vuelve mañana o practica las difíciles.'),
      ),
    ),
  );

  // Metas pequeñas
  put(main, 
    h('section', { class: 'card' },
      h('div', { class: 'card-head' },
        h('h2', null, icon('target'), ' Metas de hoy'),
        h('span', { class: 'pill' }, `${goalsDone} de ${goals.length}`),
      ),
      h('ul', { class: 'goals' },
        goals.map((g) => h('li', { class: g.done ? 'done' : '' },
          h('span', { class: 'goal-check' }, g.done ? icon('check', 20) : null),
          h('a', { href: g.href }, g.label),
          g.progress && !g.done ? h('span', { class: 'muted small' }, g.progress) : null,
        )),
      ),
    ),
  );

  const week = PLAN.find((w) => (w.lessons || []).includes(next ? next.id : LESSONS[LESSONS.length - 1].id));
  put(main, 
    h('section', { class: 'stats-row' },
      h('div', { class: 'stat' }, h('span', { class: 'stat-num' }, String(st)), h('span', { class: 'stat-label' }, st === 1 ? 'día seguido' : 'días seguidos')),
      h('div', { class: 'stat' }, h('span', { class: 'stat-num' }, String(learnedCount())), h('span', { class: 'stat-label' }, 'aprendidas')),
      h('div', { class: 'stat' }, h('span', { class: 'stat-num' }, `${LESSONS.filter((l) => lessonState(l.id).done).length}/${LESSONS.length}`), h('span', { class: 'stat-label' }, 'lecciones')),
    ),
  );
  if (week) {
    put(main, 
      h('section', { class: 'card' },
        h('h2', null, `Semana ${week.week}: ${week.title}`),
        h('p', { class: 'muted' }, 'Al terminar esta semana podrás:'),
        h('ul', { class: 'can-do' }, week.canDo.map((c) => h('li', null, c))),
      ),
    );
  }
}
