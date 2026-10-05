import { h, icon } from './ui.js';
import * as speech from './speech.js';
import * as rec from './recorder.js';
import { onChange, requestPersist } from './store.js';
import { dueCount } from './common.js';
import * as home from './views/home.js';
import * as lessons from './views/lessons.js';
import * as lesson from './views/lesson.js';
import * as review from './views/review.js';
import * as progress from './views/progress.js';
import * as audios from './views/audios.js';
import * as more from './views/more.js';

const routes = [
  { re: /^#?\/?$/, tab: 'home', title: 'Inicio', view: home.render },
  { re: /^#\/lecciones$/, tab: 'lessons', title: 'Lecciones', view: lessons.render },
  { re: /^#\/leccion\/(\d+)$/, tab: null, title: 'Lección', view: (m, p) => lesson.render(m, { id: p[1] }) },
  { re: /^#\/repaso$/, tab: 'review', title: 'Repaso', view: (m) => review.render(m, {}) },
  { re: /^#\/repaso\/dificiles$/, tab: 'review', title: 'Práctica', view: (m) => review.render(m, { mode: 'dificiles' }) },
  { re: /^#\/progreso$/, tab: 'progress', title: 'Progreso', view: progress.render },
  { re: /^#\/mas$/, tab: 'more', title: 'Más', view: more.renderMenu },
  { re: /^#\/audios$/, tab: 'more', title: 'Mis audios', view: audios.render, cleanup: audios.cleanup },
  { re: /^#\/ajustes$/, tab: 'more', title: 'Ajustes', view: more.renderSettings },
  { re: /^#\/respaldo$/, tab: 'more', title: 'Copia de seguridad', view: more.renderBackup },
  { re: /^#\/ayuda$/, tab: 'more', title: 'Ayuda', view: more.renderHelp },
];

const TABS = [
  { id: 'home', href: '#/', label: 'Inicio', ic: 'home' },
  { id: 'lessons', href: '#/lecciones', label: 'Lecciones', ic: 'book' },
  { id: 'review', href: '#/repaso', label: 'Repaso', ic: 'cards' },
  { id: 'progress', href: '#/progreso', label: 'Progreso', ic: 'chart' },
  { id: 'more', href: '#/mas', label: 'Más', ic: 'more' },
];

const main = document.getElementById('main');
const nav = document.getElementById('tabs');
let current = null;

function drawTabs(active) {
  const due = dueCount();
  nav.replaceChildren(
    ...TABS.map((t) =>
      h('a', { href: t.href, class: `tab ${t.id === active ? 'active' : ''}`, 'aria-current': t.id === active ? 'page' : null, 'data-tab': t.id },
        icon(t.ic, 26),
        h('span', null, t.label),
        t.id === 'review' && due ? h('span', { class: 'badge', 'aria-label': `${due} pendientes` }, due > 99 ? '99+' : String(due)) : null,
      ),
    ),
  );
}

function route() {
  speech.stop();
  rec.release();
  if (current && current.cleanup) current.cleanup();
  document.querySelectorAll('.sheet, .overlay').forEach((el) => el.remove());

  const hash = location.hash || '#/';
  let match = null;
  const r = routes.find((x) => (match = hash.match(x.re)));
  current = r || routes[0];
  main.replaceChildren();
  main.className = 'main';
  document.title = `${current.title} · Italiano per Cesar`;
  nav.hidden = current.tab === null;
  document.body.classList.toggle('no-tabs', current.tab === null);
  if (current.tab) drawTabs(current.tab);
  current.view(main, match || []);
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
onChange(() => current && current.tab && drawTabs(current.tab));
route();
requestPersist();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Service worker', e));
}
