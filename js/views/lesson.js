import { h, icon, btn, audioControls, feedback, PRAISE, ENCOURAGE, randomOf, put, clear } from '../ui.js';
import * as speech from '../speech.js';
import { get, update, exerciseResult, logError, day } from '../store.js';
import { getLesson } from '../data/lessons.js';
import { buildExercises, cardId, shuffle } from '../exercises.js';
import { checkTyped, normalize, tokenize } from '../check.js';
import { introduce, markStep, lessonState, ME } from '../common.js';
import { todayStr } from '../srs.js';

const STEPS = ['Inicio', 'Vocabulario', 'Frases', 'Gramática', 'Diálogo', 'Ejercicios', 'Conversación', 'Resumen'];

export function render(main, { id }) {
  const lesson = getLesson(id);
  if (!lesson) {
    put(main, h('h1', null, 'Lección no encontrada'), h('a', { class: 'btn btn-primary', href: '#/lecciones' }, 'Ver lecciones'));
    return;
  }
  const saved = lessonState(lesson.id);
  const ctl = {
    lesson,
    step: saved.done ? 0 : Math.min(saved.step || 0, STEPS.length - 2),
    sub: 0,
    session: null, // ejercicios
  };

  const top = h('div', { class: 'lesson-top' });
  const body = h('div', { class: 'lesson-body' });
  main.classList.add('lesson-main');
  put(main, top, body);

  const go = (step) => {
    speech.stop();
    if (step > ctl.step) {
      update((s) => {
        markStep();
        const ls = (s.lessons[lesson.id] = s.lessons[lesson.id] || { step: 0, done: false, attempts: 0 });
        if (!ls.done) ls.step = Math.max(ls.step || 0, step);
      });
    }
    ctl.step = step;
    ctl.sub = 0;
    draw();
  };

  function header() {
    top.replaceChildren(
      h('a', { class: 'icon-btn', href: '#/', 'aria-label': 'Salir de la lección', 'data-act': 'exit' }, icon('x', 26)),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': STEPS.length - 1, 'aria-valuenow': ctl.step },
        h('div', { class: 'progress-fill', style: { width: `${(ctl.step / (STEPS.length - 1)) * 100}%` } })),
      h('span', { class: 'step-name' }, STEPS[ctl.step]),
    );
  }

  function nav(onNext, label = 'Siguiente', { back = null } = {}) {
    return h('div', { class: 'nav-buttons' },
      back ? btn('Anterior', back, { cls: 'btn-secondary', ic: 'left', attrs: { 'data-act': 'prev' } }) : null,
      btn(label, onNext, { cls: 'btn-primary', attrs: { 'data-act': 'next' } }),
    );
  }

  function draw() {
    header();
    clear(body) && put(body, );
    window.scrollTo(0, 0);
    [stepIntro, stepItems('vocab'), stepItems('phrases'), stepGrammar, stepDialogue, stepExercises, stepConversation, stepSummary][ctl.step]();
  }

  // 0. Inicio
  function stepIntro() {
    const st = lessonState(lesson.id);
    put(body, 
      h('p', { class: 'eyebrow' }, `Lección ${lesson.id} · Semana ${lesson.week}`),
      h('h1', null, lesson.title),
      h('p', { class: 'ita-sub' }, lesson.titleIt),
      h('div', { class: 'card' },
        h('h2', null, 'Al terminar podrás:'),
        h('p', null, lesson.goal),
        h('p', { class: 'muted' }, `${lesson.vocab.length} palabras · ${lesson.phrases.length} frases · diálogo · ejercicios · conversación. Unos ${lesson.minutes} minutos.`),
        st.done ? h('p', { class: 'ok-text' }, `Ya la completaste${st.bestScore != null ? ` (mejor resultado: ${st.bestScore}%)` : ''}. Repetirla te ayuda a recordar.`) : null,
      ),
      h('div', { class: 'card tip' },
        h('p', null, icon('info'), ' Consejo: usa audífonos o el altavoz, y repite en voz alta. Hablar en voz alta, aunque sea solo, es parte del aprendizaje.'),
      ),
      nav(() => go(1), st.done ? 'Repetir la lección' : 'Empezar'),
    );
  }

  // 1–2. Vocabulario y frases: una tarjeta a la vez
  function stepItems(kind) {
    return () => {
      const items = lesson[kind];
      const i = ctl.sub;
      const it = items[i];
      update((s) => introduce(s, cardId(lesson.id, it.id)));
      const isWord = kind === 'vocab';
      put(body, 
        h('p', { class: 'eyebrow' }, `${isWord ? 'Palabra' : 'Frase'} ${i + 1} de ${items.length}`),
        h('div', { class: 'item-card' },
          h('p', { class: `item-ita ${isWord ? 'word' : ''}`, lang: 'it' }, it.ita),
          h('p', { class: 'item-es' }, it.es),
          audioControls(it.say || it.ita, { key: `${lesson.id}:${it.id}` }),
        ),
        i === 0 ? h('p', { class: 'muted small' }, 'Escucha, repite en voz alta y, si quieres, grábate para comparar.') : null,
        nav(
          () => (i < items.length - 1 ? ((ctl.sub = i + 1), draw()) : go(ctl.step + 1)),
          i < items.length - 1 ? 'Siguiente' : 'Continuar',
          { back: i > 0 ? () => ((ctl.sub = i - 1), draw()) : null },
        ),
      );
      speech.speak(it.say || it.ita);
    };
  }

  // 3. Gramática
  function stepGrammar() {
    const g = lesson.grammar;
    put(body, 
      h('p', { class: 'eyebrow' }, 'Gramática breve'),
      h('h1', null, g.title),
      h('div', { class: 'card' }, g.explain.map((p) => h('p', null, p))),
      h('h2', null, 'Ejemplos'),
      g.examples.map((ex) =>
        h('div', { class: 'item-card small' },
          h('p', { class: 'item-ita', lang: 'it' }, ex.ita),
          h('p', { class: 'item-es' }, ex.es),
          audioControls(ex.say || ex.ita, { record: false, repeat: false }),
        ),
      ),
      lesson.falseFriends?.length
        ? h('div', { class: 'card false-friends', 'data-test': 'false-friends' },
            h('h2', null, 'Ojo: falsos amigos'),
            lesson.falseFriends.map((f) =>
              h('div', { class: 'ff' },
                h('p', null, h('strong', { lang: 'it' }, f.ita), ' = ', f.es),
                h('p', { class: 'muted' }, f.trap),
                audioControls(f.ita, { record: false, repeat: false }),
              )),
          )
        : null,
      nav(() => go(4), 'Continuar'),
    );
  }

  // 4. Diálogo
  function stepDialogue() {
    const d = lesson.dialogue;
    let showEs = false;
    let playing = false;
    const list = h('ol', { class: 'dialogue' });
    const lines = d.lines.map((ln, idx) => {
      const person = d.people[ln.who];
      const es = h('p', { class: 'line-es', hidden: true }, ln.es);
      const li = h('li', { class: `line ${ln.who === ME ? 'me' : ''}`, 'data-line': idx },
        h('p', { class: 'line-who' }, person.name),
        h('p', { class: 'line-ita', lang: 'it' }, ln.ita),
        es,
        h('div', { class: 'audio-row compact' },
          btn('Escuchar', () => speech.speak(ln.say || ln.ita, { kind: person.voice }), { cls: 'btn-audio', ic: 'play' }),
          btn('Lento', () => speech.speak(ln.say || ln.ita, { kind: person.voice, slow: true }), { cls: 'btn-audio', ic: 'slow' }),
        ),
      );
      list.append(li);
      return { li, es, ln, person };
    });

    const playAll = async (slow) => {
      if (playing) {
        playing = false;
        speech.stop();
        setPlayLabels();
        return;
      }
      playing = true;
      setPlayLabels();
      for (const L of lines) {
        if (!playing) break;
        L.li.classList.add('speaking');
        L.li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        const ok = await speech.speak(L.ln.say || L.ln.ita, { kind: L.person.voice, slow });
        L.li.classList.remove('speaking');
        if (!ok) break;
        await speech.wait(500);
      }
      playing = false;
      setPlayLabels();
    };
    const allBtn = btn('Escuchar todo', () => playAll(false), { cls: 'btn-primary', ic: 'play', attrs: { 'data-act': 'play-all' } });
    const allSlow = btn('Todo lento', () => playAll(true), { cls: 'btn-secondary', ic: 'slow', attrs: { 'data-act': 'play-all-slow' } });
    function setPlayLabels() {
      allBtn.querySelector('span:last-child').textContent = playing ? 'Detener' : 'Escuchar todo';
      allSlow.querySelector('span:last-child').textContent = playing ? 'Detener' : 'Todo lento';
    }
    const toggle = btn('Mostrar español', () => {
      showEs = !showEs;
      lines.forEach((L) => (L.es.hidden = !showEs));
      toggle.querySelector('span:last-child').textContent = showEs ? 'Ocultar español' : 'Mostrar español';
    }, { cls: 'btn-secondary', ic: 'eye', attrs: { 'data-act': 'toggle-es' } });

    put(body, 
      h('p', { class: 'eyebrow' }, 'Diálogo'),
      h('h1', null, d.title),
      h('p', { class: 'muted' }, d.setting),
      h('div', { class: 'card tip' }, h('p', null, 'Primero escucha todo sin ver el español. ¿Entiendes la idea general? Después muestra la traducción y escucha otra vez.')),
      h('div', { class: 'button-row' }, allBtn, allSlow, toggle),
      list,
      nav(() => go(5), 'Ir a los ejercicios'),
    );
  }

  // 5. Ejercicios
  function stepExercises() {
    if (!ctl.session) {
      const list = buildExercises(lesson);
      ctl.session = { queue: list.map((e) => ({ ...e, retry: false })), total: list.length, firstOk: 0, done: 0, mistakes: [] };
    }
    const S = ctl.session;
    if (!S.queue.length) {
      const score = Math.round((S.firstOk / S.total) * 100);
      update((s) => {
        s.lessons[lesson.id].pendingScore = score;
      });
      go(6);
      return;
    }
    const ex = S.queue[0];
    put(body, 
      h('div', { class: 'ex-progress' },
        h('span', null, `Ejercicio ${Math.min(S.done + 1, S.total)} de ${S.total}`),
        ex.retry ? h('span', { class: 'pill' }, 'Otra oportunidad') : null,
      ),
    );
    const finish = async (ok, given, extra = {}) => {
      if (!ex.retry) {
        if (ok) S.firstOk += 1;
        exerciseResult(ex.card, ok);
        S.done += 1;
      } else if (ok) {
        exerciseResult(ex.card, true);
      }
      const expected = ex.type === 'pick' ? ex.answer : ex.type === 'build' ? ex.ita : ex.answer;
      const filled = ex.type === 'pick' && ex.ita && ex.ita.includes('___') ? ex.ita.replace('___', ex.answer) : null;
      if (!ok) {
        logError({ lesson: lesson.id, prompt: exPrompt(ex), given: given || '(sin respuesta)', expected });
        if (!ex.retry) S.mistakes.push({ prompt: exPrompt(ex), expected });
      }
      const lines = [];
      if (ok && extra.typo) lines.push(h('p', null, 'Revisa la ortografía: ', h('strong', { lang: 'it' }, ex.answer)));
      if (!ok) {
        lines.push(h('p', null, 'Respuesta correcta: ', h('strong', null, expected)));
        if (filled) lines.push(h('p', { lang: 'it' }, filled));
        if (ex.why) lines.push(h('p', { class: 'why' }, ex.why));
      } else if (ex.why && ex.type === 'pick' && !ex.auto) {
        lines.push(h('p', { class: 'why' }, ex.why));
      }
      const audioText = ex.type === 'pick' ? ex.speakAnswer || filled || ex.audio || italianOrNull(ex) : expected;
      await feedback({ ok, title: ok ? randomOf(PRAISE) : randomOf(ENCOURAGE), lines, speakText: audioText });
      S.queue.shift();
      if (!ok && !ex.retry) S.queue.push({ ...ex, retry: true });
      draw();
    };

    if (ex.type === 'pick') renderPick(ex, finish);
    else if (ex.type === 'build') renderBuild(ex, finish);
    else renderType(ex, finish);
  }

  function renderPick(ex, finish) {
    put(body, h('h2', { class: 'ex-prompt' }, ex.prompt));
    if (ex.audio) {
      put(body, h('div', { class: 'audio-row' },
        btn('Escuchar', () => speech.speak(ex.audio), { cls: 'btn-audio big', ic: 'play', attrs: { 'data-act': 'ex-listen' } }),
        btn('Lento', () => speech.speak(ex.audio, { slow: true }), { cls: 'btn-audio big', ic: 'slow' }),
      ));
      speech.speak(ex.audio);
    }
    if (ex.ita) put(body, h('p', { class: 'ex-sentence', lang: 'it' }, ex.ita));
    else if (ex.audio && (!ex.audioOnly || !speech.canSpeak())) put(body, h('p', { class: 'ex-sentence', lang: 'it' }, ex.audio));
    if (ex.audioOnly && !speech.canSpeak()) put(body, h('p', { class: 'muted small' }, 'No hay voz italiana en este dispositivo: lee el texto.'));
    const opts = h('div', { class: 'options' });
    ex.options.forEach((o) => {
      const b = btn(o, () => {
        opts.querySelectorAll('button').forEach((x) => (x.disabled = true));
        const ok = o === ex.answer;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) [...opts.children].find((x) => x.dataset.value === ex.answer)?.classList.add('right');
        finish(ok, o);
      }, { cls: 'option', attrs: { 'data-value': o } });
      opts.append(b);
    });
    put(body, opts);
  }

  function renderBuild(ex, finish) {
    const tokens = tokenize(ex.ita);
    const bankTiles = shuffle([...tokens, ...(ex.extra || [])]);
    const answer = h('div', { class: 'build-answer', 'aria-label': 'Tu frase' });
    const bank = h('div', { class: 'build-bank' });
    const check = btn('Comprobar', () => {
      const built = [...answer.children].map((t) => t.dataset.word).join(' ');
      const ok = normalize(built) === normalize(ex.ita);
      check.disabled = true;
      finish(ok, built);
    }, { cls: 'btn-primary', attrs: { 'data-act': 'check', disabled: true } });
    const refresh = () => (check.disabled = answer.children.length === 0);
    bankTiles.forEach((w, i) => {
      const tile = h('button', { type: 'button', class: 'tile', 'data-word': w, 'data-idx': i, lang: 'it' }, w);
      tile.addEventListener('click', () => {
        (tile.parentElement === bank ? answer : bank).append(tile);
        refresh();
      });
      bank.append(tile);
    });
    put(body, 
      h('h2', { class: 'ex-prompt' }, 'Ordena las palabras para decir:'),
      h('p', { class: 'ex-sentence' }, `"${ex.es}"`),
      answer,
      h('p', { class: 'muted small' }, ex.extra ? 'Toca las palabras en orden. Ojo: sobra una palabra.' : 'Toca las palabras en orden. Toca otra vez para quitarla.'),
      bank,
      h('div', { class: 'nav-buttons' }, check),
    );
  }

  function renderType(ex, finish) {
    const input = h('input', { type: 'text', class: 'type-input', lang: 'it', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Escribe en italiano', 'data-act': 'type-input' });
    const submit = () => {
      if (!input.value.trim()) {
        input.focus();
        return;
      }
      const r = checkTyped(input.value, ex.answer, ex.alts || []);
      input.disabled = true;
      finish(r.ok, input.value, { typo: r.ok && !r.exact });
    };
    input.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
    put(body, 
      h('h2', { class: 'ex-prompt' }, 'Escribe en italiano, sin mirar:'),
      h('p', { class: 'ex-sentence' }, `"${ex.es}"`),
      input,
      h('div', { class: 'nav-buttons' },
        btn('No me acuerdo', () => {
          input.disabled = true;
          finish(false, '');
        }, { cls: 'btn-secondary', attrs: { 'data-act': 'dont-know' } }),
        btn('Comprobar', submit, { cls: 'btn-primary', attrs: { 'data-act': 'check' } }),
      ),
    );
    setTimeout(() => input.focus(), 50);
  }

  // 6. Conversación guiada: Cesar dice su parte
  function stepConversation() {
    const d = lesson.dialogue;
    const i = ctl.sub;
    const ln = d.lines[i];
    const person = d.people[ln.who];
    const last = i === d.lines.length - 1;
    const next = () => (last ? go(7) : ((ctl.sub = i + 1), draw()));
    put(body, 
      h('p', { class: 'eyebrow' }, `Conversación · ${i + 1} de ${d.lines.length}`),
      i === 0 ? h('div', { class: 'card tip' }, h('p', null, 'Ahora tú eres Cesar. Cuando te toque, intenta decir la frase en italiano en voz alta antes de ver la respuesta.')) : null,
    );
    if (ln.who !== ME) {
      put(body, 
        h('div', { class: 'item-card' },
          h('p', { class: 'line-who' }, `${person.name} dice:`),
          h('p', { class: 'item-ita', lang: 'it' }, ln.ita),
          h('p', { class: 'item-es' }, ln.es),
          h('div', { class: 'audio-row' },
            btn('Escuchar', () => speech.speak(ln.say || ln.ita, { kind: person.voice }), { cls: 'btn-audio', ic: 'play' }),
            btn('Lento', () => speech.speak(ln.say || ln.ita, { kind: person.voice, slow: true }), { cls: 'btn-audio', ic: 'slow' }),
          ),
        ),
        nav(next, last ? 'Terminar' : 'Siguiente'),
      );
      speech.speak(ln.say || ln.ita, { kind: person.voice });
    } else {
      const reveal = h('div', { class: 'reveal', hidden: true },
        h('p', { class: 'item-ita', lang: 'it' }, ln.ita),
        audioControls(ln.say || ln.ita, { key: `conv:${lesson.id}:${i}`, kind: person.voice }),
      );
      const show = btn('Ver la respuesta', () => {
        reveal.hidden = false;
        show.remove();
        speech.speak(ln.say || ln.ita, { kind: person.voice });
      }, { cls: 'btn-primary btn-block', ic: 'eye', attrs: { 'data-act': 'reveal' } });
      put(body, 
        h('div', { class: 'item-card me' },
          h('p', { class: 'line-who' }, 'Tu turno. Di en italiano:'),
          h('p', { class: 'item-es big' }, ln.es),
          show,
          reveal,
        ),
        nav(next, last ? 'Terminar' : 'Siguiente'),
      );
    }
  }

  // 7. Resumen
  function stepSummary() {
    const S = ctl.session;
    const score = S ? Math.round((S.firstOk / S.total) * 100) : (lessonState(lesson.id).pendingScore ?? null);
    update((s) => {
      const t = todayStr();
      for (const it of [...lesson.vocab, ...lesson.phrases]) introduce(s, cardId(lesson.id, it.id));
      const ls = (s.lessons[lesson.id] = s.lessons[lesson.id] || {});
      ls.done = true;
      ls.step = 0;
      ls.attempts = (ls.attempts || 0) + 1;
      ls.completedAt = t;
      delete ls.pendingScore;
      if (score !== null) {
        ls.lastScore = score;
        ls.bestScore = Math.max(ls.bestScore || 0, score);
      }
      const dd = day(t);
      if (!dd.lessonsDone.includes(lesson.id)) dd.lessonsDone.push(lesson.id);
    });
    const msg = score === null ? '' : score >= 85 ? '¡Excelente trabajo!' : score >= 60 ? '¡Muy bien! Vas avanzando.' : 'Buen esfuerzo. Lo que te costó aparecerá más en tu repaso.';
    put(body, 
      h('div', { class: 'celebrate' }, icon('check', 40)),
      h('h1', null, '¡Lección terminada!'),
      score !== null ? h('p', { class: 'big-score' }, `${score}%`, h('span', { class: 'muted small' }, ' de aciertos al primer intento')) : null,
      h('p', null, msg),
      h('div', { class: 'card' },
        h('p', null, `${lesson.vocab.length + lesson.phrases.length} palabras y frases se agregaron a tu repaso. Te las pediremos a partir de mañana, en días cada vez más separados.`),
      ),
      S && S.mistakes.length
        ? h('div', { class: 'card' },
            h('h2', null, 'Para repasar'),
            h('ul', { class: 'mistakes' }, S.mistakes.map((m) => h('li', null, h('span', { class: 'muted' }, m.prompt), h('br'), h('strong', { lang: 'it' }, m.expected)))),
          )
        : null,
      h('div', { class: 'nav-buttons column' },
        h('a', { class: 'btn btn-primary', href: '#/repaso', 'data-act': 'to-review' }, 'Ir al repaso'),
        h('a', { class: 'btn btn-secondary', href: '#/', 'data-act': 'to-home' }, 'Volver al inicio'),
      ),
    );
  }

  draw();
}

function exPrompt(ex) {
  if (ex.type === 'pick') return [ex.prompt, ex.ita, ex.audioOnly ? `(audio: "${ex.audio}")` : null].filter(Boolean).join(' ');
  if (ex.type === 'build') return `Ordenar: "${ex.es}"`;
  return `Escribir: "${ex.es}"`;
}

// Solo se escucha la respuesta si está en italiano (lo declara el ejercicio).
function italianOrNull(ex) {
  return ex.optionsLang === 'it' ? ex.answer : null;
}
