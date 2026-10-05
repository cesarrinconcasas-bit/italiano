import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, applyExercise, newCard, dueQueue, addDays, isLearned, difficultQueue } from '../js/srs.js';
import { checkTyped, normalize, tokenize } from '../js/check.js';
import { buildExercises, findCardFor } from '../js/exercises.js';
import { LESSONS } from '../js/data/lessons.js';
import { PLAN } from '../js/data/plan.js';

const T = '2026-10-02';

test('addDays cruza meses y años', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('grade: good sube de caja y aplaza; again regresa a 0 hoy y cuenta el fallo', () => {
  let c = newCard(T);
  c = grade(c, 'good', T);
  assert.deepEqual([c.box, c.due, c.lapses], [1, '2026-10-03', 0]);
  c = grade(c, 'good', '2026-10-03');
  assert.deepEqual([c.box, c.due], [2, '2026-10-05']);
  c = grade(c, 'again', '2026-10-05');
  assert.deepEqual([c.box, c.due, c.lapses], [0, '2026-10-05', 1]);
  c = grade(c, 'hard', '2026-10-05');
  assert.deepEqual([c.box, c.due], [1, '2026-10-06']);
});

test('isLearned requiere caja 3', () => {
  let c = newCard(T);
  for (const d of ['2026-10-02', '2026-10-03', '2026-10-05']) c = grade(c, 'good', d);
  assert.equal(c.box, 3);
  assert.ok(isLearned(c));
});

test('applyExercise: acierto repetido el mismo día no sube de caja; fallo sí cuenta', () => {
  let c = applyExercise(newCard(T), true, T);
  assert.equal(c.box, 1);
  c = applyExercise(c, true, T);
  assert.equal(c.box, 1);
  c = applyExercise(c, false, T);
  assert.deepEqual([c.box, c.lapses, c.due], [0, 1, T]);
});

test('dueQueue: solo pendientes, primero las más falladas', () => {
  const cards = {
    a: { box: 1, due: '2026-10-01', reps: 1, lapses: 0, last: null },
    b: { box: 0, due: T, reps: 3, lapses: 3, last: null },
    c: { box: 2, due: '2026-10-09', reps: 2, lapses: 5, last: null },
  };
  assert.deepEqual(dueQueue(cards, T), ['b', 'a']);
  assert.deepEqual(difficultQueue(cards), ['c', 'b']);
});

test('checkTyped: italiano con acentos, apóstrofos y errores de dedo', () => {
  assert.deepEqual(checkTyped('Grazie!', 'grazie'), { ok: true, exact: true });
  assert.deepEqual(checkTyped('perche', 'perché'), { ok: true, exact: false });
  assert.deepEqual(checkTyped("perche'", 'perché'), { ok: true, exact: false });
  assert.deepEqual(checkTyped("e' qui", 'è qui'), { ok: true, exact: false });
  assert.deepEqual(checkTyped('l’ora', "l'ora"), { ok: true, exact: true });
  assert.deepEqual(checkTyped('un auto', "un'auto"), { ok: true, exact: true });
  assert.deepEqual(checkTyped('arrivederci', 'arrivederci'), { ok: true, exact: true });
  assert.deepEqual(checkTyped('arivederci', 'arrivederci'), { ok: true, exact: false });
  assert.deepEqual(checkTyped('ciao', 'buongiorno'), { ok: false, exact: false });
  assert.deepEqual(checkTyped('si', 'sì'), { ok: true, exact: false });
  assert.deepEqual(checkTyped('', 'sì'), { ok: false, exact: false });
  assert.equal(normalize("Dov'è il bagno?"), 'dov è il bagno');
});

test('contenido: lecciones completas y bien formadas', () => {
  const ids = new Set();
  const itemIds = new Set();
  for (const l of LESSONS) {
    assert.ok(!ids.has(l.id), `id repetido ${l.id}`);
    ids.add(l.id);
    assert.ok(l.title && l.titleIt && l.goal && l.minutes && ['lei', 'tu'].includes(l.register), `L${l.id} cabecera`);
    assert.ok(l.vocab.length >= 8 && l.vocab.length <= 12, `L${l.id} vocabulario`);
    assert.ok(l.phrases.length >= 6, `L${l.id} frases`);
    assert.ok(l.grammar.explain.length && l.grammar.examples.length, `L${l.id} gramática`);
    for (const g of l.grammar.examples) assert.ok(g.ita && g.es, `L${l.id} ejemplo`);
    assert.ok(l.falseFriends.length >= 1, `L${l.id} falsos amigos`);
    for (const f of l.falseFriends) assert.ok(f.ita && f.es && f.trap, `L${l.id} falso amigo`);
    assert.ok(l.dialogue.lines.length >= 6, `L${l.id} diálogo`);
    assert.ok(l.dialogue.lines.some((x) => x.who === 'cesar'), `L${l.id} Cesar habla`);
    assert.equal(l.dialogue.people.cesar.voice, 'm');
    for (const it of [...l.vocab, ...l.phrases]) {
      assert.ok(it.ita && it.es, `L${l.id} item ${it.id}`);
      const key = `${l.id}:${it.id}`;
      assert.ok(!itemIds.has(key), `item repetido ${key}`);
      itemIds.add(key);
    }
    for (const line of l.dialogue.lines) {
      assert.ok(l.dialogue.people[line.who], `L${l.id} persona ${line.who}`);
      assert.ok(line.ita && line.es);
    }
    for (const ex of l.exercises) {
      if (ex.type === 'pick') {
        assert.ok(ex.options.includes(ex.answer), `L${l.id} respuesta en opciones: ${ex.answer}`);
        assert.equal(new Set(ex.options).size, ex.options.length);
        assert.ok(ex.why, `L${l.id} explicación`);
        assert.ok(['it', 'es'].includes(ex.optionsLang), `L${l.id} optionsLang en "${ex.prompt}"`);
        if (ex.ita) assert.ok(ex.ita.includes('___') || ex.audio, `L${l.id} pick con ita`);
      } else if (ex.type === 'build') {
        assert.ok(tokenize(ex.ita).length >= 2);
      } else if (ex.type === 'type') {
        assert.ok(ex.answer && ex.es);
      } else assert.fail(`tipo desconocido ${ex.type}`);
    }
    const types = new Set(l.exercises.map((e) => e.type));
    assert.ok(types.has('pick') && types.has('build') && types.has('type'), `L${l.id} variedad`);
  }
});

test('buildExercises genera ejercicios válidos y enlazados a tarjetas', () => {
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const l of LESSONS) {
    const list = buildExercises(l, rand);
    assert.ok(list.length >= 12, `L${l.id} tiene ${list.length} ejercicios`);
    for (const ex of list) if (ex.type === 'pick') {
      assert.ok(ex.options.includes(ex.answer));
      assert.equal(new Set(ex.options).size, ex.options.length, `opciones repetidas L${l.id}`);
      assert.ok(['it', 'es'].includes(ex.optionsLang));
    }
    for (const ex of l.exercises.filter((e) => e.type === 'type'))
      assert.ok(findCardFor(l, ex.answer), `L${l.id} "${ex.answer}" sin tarjeta`);
  }
});

test('store: claves propias y rechaza la copia de la app de inglés', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  const store = await import('../js/store.js');
  assert.equal(JSON.parse(store.exportJSON()).app, 'italiano-cesar');
  const before = store.exportJSON();
  assert.throws(() => store.importJSON(JSON.stringify({ app: 'ingles-karla', state: { cards: {} } })), /no es una copia/);
  assert.equal(JSON.parse(store.exportJSON()).state.created, JSON.parse(before).state.created);
  store.update((s) => (s.name = 'Cesar'));
  assert.ok(mem.has('italiano-cesar-v1') && !mem.has('ingles-karla-v1'));
});

test('plan: 8 semanas; lecciones referidas existen', () => {
  assert.equal(PLAN.length, 8);
  const ids = new Set(LESSONS.map((l) => l.id));
  for (const w of PLAN) for (const id of w.lessons || []) assert.ok(ids.has(id));
  const planned = PLAN.flatMap((w) => w.lessons || []);
  for (const l of LESSONS) assert.ok(planned.includes(l.id), `L${l.id} no está en el plan`);
});
