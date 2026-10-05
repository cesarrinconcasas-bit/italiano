# Italiano per Cesar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una PWA gratuita para que Cesar aprenda italiano de viaje (A1 + lo útil de A2) con 32 lecciones completas, audio, grabación, repaso espaciado y copia de seguridad, publicada en GitHub Pages.

**Architecture:** Se copia el motor de `/Volumes/storage/app/ingles` (commit `f1302ad`) y se adapta a italiano. El campo de texto meta `en` pasa a llamarse `ita`, la voz pasa a `it-IT` y las claves de almacenamiento son propias de esta app. El contenido se divide en un archivo por semana (`js/data/week1.js` … `week8.js`) que `js/data/lessons.js` reúne. No hay compilación ni dependencias: son módulos ES servidos tal cual.

**Tech Stack:** HTML/CSS/JS (módulos ES), Web Speech API, MediaRecorder, localStorage + IndexedDB, Service Worker, `node --test` (Node 22), E2E con el Chrome del sistema vía CDP (WebSocket nativo de Node, sin Playwright).

**Spec:** `docs/2026-10-05-italiano-cesar-design.md`

## Global Constraints
- Proyecto en `/Volumes/storage/app/italiano`, rama `main`. En `/Volumes/storage/app/ingles` **solo** se toca la limpieza de cachés de `sw.js` (Task 14), a pedido de Cesar, para que las apps no se crucen.
- **Las dos apps no se cruzan:** progreso (localStorage), grabaciones y audios (IndexedDB), cachés del service worker, copia de seguridad y alcance del service worker (`/italiano/` frente a `/ingles-karla/`) son independientes. Ninguna lee, escribe ni borra nada de la otra.
- Sin pagos, cuentas, APIs externas, audios ajenos ni cursos copiados. Sin calificación automática de pronunciación.
- Interfaz en español, trato de "tú", en masculino. Protagonista: Cesar (`who: 'cesar'`). Nombre: "Italiano per Cesar"; nombre corto: "Italiano".
- Claves propias: localStorage `italiano-cesar-v1`; IndexedDB `italiano-cesar`; app id de la copia de seguridad `italiano-cesar`; nombres de caché con el prefijo `italiano-cesar-`.
- Voz solo `it-IT`. Si no hay voz italiana, se avisa y **no** se habla con una voz de otro idioma.
- 32 lecciones, 4 por semana y 8 semanas. Cada lección tiene: `vocab` (8–12), `phrases` (≥6), `grammar`, `falseFriends` (≥1), `dialogue` (≥6 líneas, con Cesar) y `exercises` (con al menos un `pick`, un `build` y un `type`).
- Las respuestas escritas aceptan que falten acentos (`perche`, `e'`) y los apóstrofos curvos; en esos casos son correctas con un aviso de ortografía.
- Se sube `VERSION` en `sw.js` en cada publicación. Antes de crear el repositorio de GitHub o publicar, se pide confirmación a Cesar.
- Cada commit termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus
1. **Mismo dominio que la app de inglés** (`cesarrinconcasas-bit.github.io`): el progreso de inglés y el de italiano no deben mezclarse. El service worker de italiano solo borra cachés con su propio prefijo. Lo prueba la Task 1 (claves) y la Task 3 (`sw.js`).
2. **Dispositivo sin voz italiana:** los botones de audio no deben sonar en inglés ni en español. Debe aparecer un aviso con los pasos para descargar Alice/Federica/Luca. Lo prueba la Task 2 (E2E con `speechSynthesis.getVoices` simulado vacío, en la Task 13).
3. **Escribir sin acentos o con `e'`** (teclado de EE. UU.): se acepta con "Revisa la ortografía". Lo prueba la Task 1 (`checkTyped`).
4. **Importar por error la copia de la app de inglés:** se rechaza con un mensaje claro y el progreso no cambia. Lo prueba la Task 1 (`importJSON`).
5. **Opciones en italiano con acentos** (`Sì, grazie`, `Il conto, per favore`): deben poder escucharse. Las opciones en español no deben leerse con la voz italiana. Esto se controla con `optionsLang` y no adivinando por los acentos. Lo prueba la Task 2.

---

### Task 1: Copiar el motor y adaptarlo a italiano (con la lección 1)

**Files:**
- Create (copia desde `../ingles`): `index.html`, `manifest.webmanifest`, `package.json`, `sw.js`, `css/app.css`, `js/*.js`, `js/views/*.js`, `tests/logic.test.js`, `icons/*` (provisionales hasta la Task 3)
- Modify: `js/check.js`, `js/store.js`, `js/audiodb.js`, `js/speech.js`, `js/exercises.js`, `js/views/*.js`, `js/ui.js`
- Create: `js/data/week1.js` (solo la lección 1 por ahora), `js/data/lessons.js` (agregador), `js/data/plan.js` (provisional: 8 semanas, solo la semana 1 con `lessons: [1]`)
- Test: `tests/logic.test.js`, `tests/italian.test.js`

**Interfaces:**
- Produces:
  - Lesson schema (used by all content tasks):
    ```js
    { id, week, title /*es*/, titleIt, goal, minutes, register: 'lei'|'tu',
      vocab:   [{ id, ita, es, say? }],
      phrases: [{ id, ita, es, say? }],
      grammar: { title, explain: [str], examples: [{ ita, es }] },
      falseFriends: [{ ita, es, trap }],   // trap = la confusión típica en español
      dialogue: { title, setting, people: { cesar: { name: 'Cesar', voice: 'm' }, <otro>: { name, voice: 'f'|'f2'|'m' } },
                  lines: [{ who, ita, es }] },
      exercises: [
        { type: 'pick', prompt, ita?, audio?, audioOnly?, options, answer, why, optionsLang: 'it'|'es' },
        { type: 'build', es, ita, extra? },
        { type: 'type', es, answer, alts? } ] }
    ```
  - `js/data/lessons.js`: `export const LESSONS` (todas las semanas concatenadas, ordenadas por id) y `export function getLesson(id)`.
  - `check.js`: `normalize(s)`, `stripAccents(s)`, `checkTyped(given, answer, alts) → { ok, exact }`, `tokenize(s)`.
  - `store.js`: `KEY = 'italiano-cesar-v1'`, `exportJSON()` con `app: 'italiano-cesar'`, `importJSON(text)` (rechaza otras apps).
  - `common.js`: `ME = 'cesar'`.
  - `speech.js`: `itVoices()`, `hasItVoice()`, `speak(text, opts) → Promise<boolean>` (resuelve `false` sin hablar si no hay voz `it-IT`).

- [ ] **Step 1: Copiar los archivos del motor**

```bash
cd /Volumes/storage/app/italiano
for p in index.html manifest.webmanifest package.json sw.js css js tests icons; do cp -R ../ingles/$p .; done
rm js/data/lessons.js
git status --short
```

- [ ] **Step 2: Escribir las pruebas que fallan para la comparación de respuestas en italiano** — reemplazar el test `checkTyped tolera…` en `tests/logic.test.js` con:

```js
test('checkTyped: italiano con acentos, apóstrofos y errores de dedo', () => {
  assert.deepEqual(checkTyped('Grazie!', 'grazie'), { ok: true, exact: true });
  assert.deepEqual(checkTyped('perche', 'perché'), { ok: true, exact: false });     // falta acento
  assert.deepEqual(checkTyped("perche'", 'perché'), { ok: true, exact: false });    // acento con apóstrofo
  assert.deepEqual(checkTyped("e' qui", 'è qui'), { ok: true, exact: false });
  assert.deepEqual(checkTyped('l’ora', "l'ora"), { ok: true, exact: true });        // apóstrofo curvo
  assert.deepEqual(checkTyped('un auto', "un'auto"), { ok: true, exact: true });
  assert.deepEqual(checkTyped('arrivederci', 'arrivederci'), { ok: true, exact: true });
  assert.deepEqual(checkTyped('arivederci', 'arrivederci'), { ok: true, exact: false }); // 1 letra en palabra larga
  assert.deepEqual(checkTyped('ciao', 'buongiorno'), { ok: false, exact: false });
  assert.deepEqual(checkTyped('si', 'sì'), { ok: true, exact: false });
  assert.deepEqual(checkTyped('', 'sì'), { ok: false, exact: false });
  assert.equal(normalize("Dov'è il bagno?"), 'dov è il bagno');
});
```

Y en `tests/logic.test.js` también reemplazar el test de contenido y el de `buildExercises` para usar `ita`/`cesar`/`falseFriends`/`optionsLang`:

```js
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
```

El test del plan cambia a: `assert.equal(PLAN.length, 8)`, que toda lección referida exista y que toda lección esté en el plan (igual que en inglés).

- [ ] **Step 3: Escribir la prueba de ortografía italiana** — `tests/italian.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../js/data/lessons.js';

// Formas sin acento o mal escritas que un hispanohablante suele producir.
const WRONG = [
  [/\bperche\b/i, 'perché'], [/\bpiu\b/i, 'più'], [/\bcitta\b/i, 'città'], [/\bcaffe\b/i, 'caffè'],
  [/\bpuo\b/i, 'può'], [/\bgia\b/i, 'già'], [/\bcosi\b/i, 'così'], [/\bpero\b/i, 'però'],
  [/\b(lunedi|martedi|mercoledi|giovedi|venerdi)\b/i, 'lunedì…venerdì'], [/\bsi,/i, 'sì,'],
  [/\be'/i, 'è'], [/\bqual'è\b/i, "qual è"], [/\bun'(?=[bcdfghlmnpqrstvz])/i, 'un (masc.)'],
  [/\bquì\b|\bquà\b/i, 'qui / qua sin acento'], [/’/, "usar ' recto"],
  [/\bperfavore\b/i, 'per favore'], [/\bbuon giorno\b/i, 'buongiorno'], [/\bbuona sera\b/i, 'buonasera'],
];

function italianTexts(l) {
  const out = [l.titleIt];
  for (const it of [...l.vocab, ...l.phrases]) out.push(it.ita);
  for (const g of l.grammar.examples) out.push(g.ita);
  for (const f of l.falseFriends) out.push(f.ita);
  for (const ln of l.dialogue.lines) out.push(ln.ita);
  for (const ex of l.exercises) {
    if (ex.ita) out.push(ex.ita);
    if (ex.type === 'type') out.push(ex.answer);
    if (ex.type === 'pick' && ex.optionsLang === 'it') out.push(...ex.options);
  }
  return out.filter(Boolean);
}

test('ortografía italiana: sin acentos olvidados ni formas típicas erróneas', () => {
  const problems = [];
  for (const l of LESSONS) for (const t of italianTexts(l)) for (const [re, fix] of WRONG)
    if (re.test(t)) problems.push(`L${l.id}: "${t}" → ${fix}`);
  assert.deepEqual(problems, []);
});

test('nada de "en" heredado del inglés en los datos', () => {
  for (const l of LESSONS) assert.ok(!JSON.stringify(l).includes('"en":'), `L${l.id} usa "en"`);
});
```


- [ ] **Step 4: Ejecutar las pruebas y comprobar que fallan**

Run: `cd /Volumes/storage/app/italiano && npm test`
Expected: FAIL (`lessons.js` no existe y `checkTyped('perche','perché')` devuelve `ok:false`).

- [ ] **Step 5: Implementar `check.js` para italiano**

```js
// Comparación tolerante de respuestas escritas en italiano: ignora mayúsculas, puntuación y
// apóstrofos (rectos o curvos). Si solo faltan acentos (perche, e'), es correcta con aviso.

export function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[.,!?¿¡";:()\-–—«»]/g, ' ')
    .replace(/'/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function levenshtein(a, b) { /* sin cambios: copiar de ingles/js/check.js */ }

export function checkTyped(given, answer, alts = []) {
  const g = normalize(given);
  if (!g) return { ok: false, exact: false };
  const targets = [answer, ...alts].map(normalize);
  if (targets.includes(g)) return { ok: true, exact: true };
  const gs = stripAccents(g);
  for (const t of targets) {
    if (stripAccents(t) === gs) return { ok: true, exact: false };
    const allowed = t.length >= 10 ? 2 : t.length >= 5 ? 1 : 0;
    if (allowed && levenshtein(gs, stripAccents(t)) <= allowed) return { ok: true, exact: false };
  }
  return { ok: false, exact: false };
}

export function tokenize(sentence) {
  return sentence.split(/\s+/).filter(Boolean);
}
```

(La función `levenshtein` se copia literalmente del archivo de inglés; no lleva el comentario de relleno.)

- [ ] **Step 6: Renombrar `en` → `ita` y `karla` → `cesar` en el motor**

```bash
cd /Volumes/storage/app/italiano
sed -i '' -E 's/\.en\b/.ita/g; s/titleEn/titleIt/g; s/lang: '\''en'\''/lang: '\''it'\''/g; s/item-en/item-ita/g; s/line-en/line-ita/g; s/en-sub/ita-sub/g' js/*.js js/views/*.js css/app.css
sed -i '' -E "s/'en', 2, rand/'ita', 2, rand/" js/exercises.js
grep -rn -E "\ben\b|karla|Karla|ingl|English|en-US|EE\. ?UU|honesta" js css index.html manifest.webmanifest sw.js
```

Después se corrige a mano cada resultado del `grep`:
- `js/common.js`: añadir `export const ME = 'cesar';`.
- `js/views/lesson.js`: `ln.who === 'karla'` → `ln.who === ME`. "Ahora tú eres Karla…" → "Ahora tú eres Cesar. Cuando te toque, intenta decir la frase en italiano en voz alta antes de ver la respuesta." En la conversación, `audioControls(ln.say || ln.ita, { key, kind: person.voice })` y `speech.speak(…, { kind: person.voice })` también en el lado de Cesar.
- Todos los textos "en inglés" → "en italiano"; "honesta" → "honesto"; `name: 'Karla'` → `name: 'Cesar'`.
- `js/store.js`: `KEY = 'italiano-cesar-v1'`, `app: 'italiano-cesar'` en export/import.
- `js/audiodb.js`: `DB = 'italiano-cesar'`.
- `js/views/more.js`: archivo de respaldo `italiano-cesar-respaldo-${todayStr()}.json`; tarjeta "Voces en italiano"; texto de muestra de la voz: `'Buongiorno, mi chiamo Cesar. Piacere!'`; ayuda para iPhone: "Ajustes › Accesibilidad › Contenido leído › Voces › Italiano → descarga Alice, Federica o Luca (versión mejorada)".
- `index.html` / `manifest.webmanifest`: textos provisionales "Italiano per Cesar" (colores e íconos en la Task 3).

- [ ] **Step 7: `speech.js` con voces italianas** — reemplazar las listas y filtros:

```js
const FEMALE = ['Alice', 'Federica', 'Paola', 'Emma', 'Google italiano', 'Microsoft Elsa', 'Microsoft Isabella'];
const MALE = ['Luca', 'Microsoft Diego', 'Microsoft Cosimo', 'Microsoft Giuseppe'];

export function itVoices() {
  return voices.filter((v) => /^it[-_]IT/i.test(v.lang) && !NOVELTY.test(v.name));
}
export function hasItVoice() {
  return itVoices().length > 0;
}
```

`usVoices` se renombra a `itVoices` en todos los usos (`pick`, `voiceFor`, `more.js`). En `speak()`: `u.lang = 'it-IT'` y, antes de crear el utterance, `if (!voiceFor(kind)) return Promise.resolve(false);` (sin voz italiana no se habla). `NOVELTY` se mantiene.

- [ ] **Step 8: `exercises.js` marca el idioma de las opciones**

En las tarjetas automáticas: el `pick` de vocabulario ("Escucha. ¿Qué significa?") lleva `optionsLang: 'es'`; el de frases ("¿Cómo se dice en italiano? …") lleva `optionsLang: 'it'`. En `lesson.js`, la función `englishOrNull` se sustituye por:

```js
// Solo se escucha la respuesta si está en italiano (lo declara el ejercicio).
function italianOrNull(ex) {
  return ex.optionsLang === 'it' ? ex.answer : null;
}
```

y `const audioText = ex.type === 'pick' ? ex.speakAnswer || filled || ex.audio || italianOrNull(ex) : expected;`.

- [ ] **Step 9: Escribir la lección 1 completa en `js/data/week1.js`** y el agregador:

```js
// js/data/lessons.js
import { WEEK1 } from './week1.js';
export const LESSONS = [...WEEK1].sort((a, b) => a.id - b.id);
export function getLesson(id) {
  return LESSONS.find((l) => l.id === Number(id)) || null;
}
```

`js/data/week1.js` exporta `WEEK1 = [ { lección 1 } ]` con exactamente este contenido:

```js
export const WEEK1 = [
  {
    id: 1, week: 1, register: 'lei', minutes: 18,
    title: '¡Buenos días! Saludos y cortesía',
    titleIt: 'Buongiorno! Saluti e cortesia',
    goal: 'Saludar a cualquier hora, presentarte, dar las gracias, pedir disculpas y despedirte con educación.',
    vocab: [
      { id: 'buongiorno', ita: 'buongiorno', es: 'buenos días (hasta media tarde)' },
      { id: 'buonasera', ita: 'buonasera', es: 'buenas tardes / buenas noches (al llegar)' },
      { id: 'ciao', ita: 'ciao', es: 'hola / adiós (solo con amigos)' },
      { id: 'arrivederci', ita: 'arrivederci', es: 'adiós (formal)' },
      { id: 'per-favore', ita: 'per favore', es: 'por favor' },
      { id: 'grazie', ita: 'grazie', es: 'gracias' },
      { id: 'prego', ita: 'prego', es: 'de nada / adelante' },
      { id: 'scusi', ita: 'scusi', es: 'disculpe (a un desconocido)' },
      { id: 'si', ita: 'sì', es: 'sí' },
      { id: 'no', ita: 'no', es: 'no' },
    ],
    phrases: [
      { id: 'mi-chiamo', ita: 'Mi chiamo Cesar.', es: 'Me llamo Cesar.' },
      { id: 'come-si-chiama', ita: 'Come si chiama?', es: '¿Cómo se llama usted?' },
      { id: 'piacere', ita: 'Piacere!', es: '¡Mucho gusto!' },
      { id: 'come-sta', ita: 'Come sta?', es: '¿Cómo está usted?' },
      { id: 'bene-grazie', ita: 'Bene, grazie. E lei?', es: 'Bien, gracias. ¿Y usted?' },
      { id: 'grazie-mille', ita: 'Grazie mille!', es: '¡Muchas gracias!' },
      { id: 'buona-giornata', ita: 'Buona giornata!', es: '¡Que tenga un buen día!' },
    ],
    grammar: {
      title: '"Lei" para desconocidos, "tu" para amigos',
      explain: [
        'En Italia, a un desconocido (en el hotel, la tienda, el restaurante) se le habla de "lei", como nuestro "usted". Por eso se dice "Come sta?" y "Scusi".',
        'Con amigos o gente joven en ambiente informal se usa "tu": "Come stai?" y "Scusa". En esta app, en los lugares públicos siempre usamos "lei".',
        '"Sono" es "soy" y "è" (con acento) es "es / está": "Sono Cesar", "Lei è molto gentile". Sin acento, "e" significa "y".',
      ],
      examples: [
        { ita: 'Sono Cesar.', es: 'Soy Cesar.' },
        { ita: 'Come sta?', es: '¿Cómo está (usted)?' },
        { ita: 'Lei è molto gentile.', es: 'Usted es muy amable.' },
      ],
    },
    falseFriends: [
      { ita: 'prego', es: 'de nada / adelante / ¿dígame?', trap: 'No significa "ruego". Lo oirás todo el tiempo: al dar las gracias, al invitarte a pasar y cuando te van a atender.' },
      { ita: 'salire', es: 'subir', trap: 'Parece "salir", pero "salire" es subir. Salir es "uscire".' },
    ],
    dialogue: {
      title: 'Llegando al hotel',
      setting: 'Cesar entra a un pequeño hotel en Roma por la tarde.',
      people: { cesar: { name: 'Cesar', voice: 'm' }, giulia: { name: 'Giulia (recepción)', voice: 'f' } },
      lines: [
        { who: 'giulia', ita: 'Buonasera! Prego.', es: '¡Buenas tardes! Adelante.' },
        { who: 'cesar', ita: 'Buonasera. Mi chiamo Cesar Rincon.', es: 'Buenas tardes. Me llamo Cesar Rincon.' },
        { who: 'giulia', ita: 'Piacere, signor Rincon. Come sta?', es: 'Mucho gusto, señor Rincon. ¿Cómo está?' },
        { who: 'cesar', ita: 'Bene, grazie. E lei?', es: 'Bien, gracias. ¿Y usted?' },
        { who: 'giulia', ita: 'Molto bene, grazie. Ecco la chiave.', es: 'Muy bien, gracias. Aquí tiene la llave.' },
        { who: 'cesar', ita: 'Grazie mille! Lei è molto gentile.', es: '¡Muchas gracias! Usted es muy amable.' },
        { who: 'giulia', ita: 'Prego! Buona serata.', es: '¡De nada! Que tenga una buena noche.' },
        { who: 'cesar', ita: 'Grazie, arrivederci!', es: '¡Gracias, adiós!' },
      ],
    },
    exercises: [
      { type: 'pick', optionsLang: 'it', prompt: 'Son las 10 de la mañana. Entras a una tienda:', options: ['Buongiorno!', 'Buonasera!', 'Ciao!'], answer: 'Buongiorno!', why: '"Buongiorno" se usa en la mañana y hasta media tarde. "Ciao" es solo con amigos.' },
      { type: 'pick', optionsLang: 'it', prompt: 'Escucha. ¿Qué respondes?', audio: 'Come sta?', audioOnly: true, options: ['Bene, grazie. E lei?', 'Mi chiamo Cesar.', 'Arrivederci!'], answer: 'Bene, grazie. E lei?', why: 'Te preguntan "¿Cómo está?". Respondes "Bene, grazie. E lei?".' },
      { type: 'pick', optionsLang: 'it', prompt: 'Te dicen "Grazie!". ¿Qué respondes?', audio: 'Grazie!', options: ['Prego!', 'Scusi!', 'Piacere!'], answer: 'Prego!', why: '"Prego" = "De nada".' },
      { type: 'pick', optionsLang: 'es', prompt: '¿Qué significa "salire"?', options: ['subir', 'salir', 'saludar'], answer: 'subir', why: '"Salire" es subir. Salir se dice "uscire".' },
      { type: 'build', es: '¿Cómo se llama usted?', ita: 'Come si chiama?' },
      { type: 'build', es: 'Bien, gracias. ¿Y usted?', ita: 'Bene, grazie. E lei?', extra: ['tu'] },
      { type: 'type', es: 'gracias', answer: 'grazie' },
      { type: 'type', es: 'disculpe (a un desconocido)', answer: 'scusi' },
    ],
  },
];
```

Plan provisional (`js/data/plan.js`): se adapta `DAILY_ROUTINE` y `WEEK_SCHEDULE` de inglés (mismos textos, cambiando "inglés" por "italiano") y `PLAN` con las 8 semanas de la tabla del spec; por ahora solo la semana 1 tiene `lessons: [1]` y las demás `lessons: []`. La Task 12 lo completa.

- [ ] **Step 10: Pruebas de claves y de importación** — añadir a `tests/logic.test.js` (con un `localStorage` mínimo en memoria, porque `store.js` lo usa al importarse):

```js
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
```

- [ ] **Step 11: Ejecutar todas las pruebas**

Run: `npm test`
Expected: PASS (todas, incluida la de ortografía sobre la lección 1).

- [ ] **Step 12: Arranque rápido en el navegador**

Run: `python3 -m http.server 8766` (en segundo plano) y abrir `http://localhost:8766` en Chrome headless con el harness de la Task 13 (o a mano): sin errores en la consola, Inicio muestra la lección 1 y "Más › Ajustes" muestra "Voces en italiano".

- [ ] **Step 13: Commit**

```bash
git add -A && git commit -m "Motor copiado de Inglés con Karla y adaptado a italiano; lección 1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Falsos amigos en la lección y aviso de voz italiana

**Files:**
- Modify: `js/views/lesson.js` (paso Gramática), `js/views/home.js`, `js/views/more.js`, `css/app.css`

**Interfaces:**
- Consumes: `lesson.falseFriends`, `speech.hasItVoice()`, `speech.voicesReady()`.
- Produces: el elemento `[data-test="false-friends"]` en el paso Gramática y el aviso `[data-test="no-voice"]` en Inicio.

- [ ] **Step 1: Prueba E2E que falla** (añadir al harness de la Task 13 si ya existe; si no, crear `tests/e2e/smoke.mjs` con el mismo patrón CDP de la Task 13). Debe comprobar que en `#/leccion/1`, tras llegar al paso Gramática (botón `[data-act=next]` tres veces), existe `[data-test="false-friends"]` y contiene "salire". Con `speechSynthesis.getVoices = () => []` inyectado antes de cargar (`Page.addScriptToEvaluateOnNewDocument`), Inicio debe mostrar `[data-test="no-voice"]` y al pulsar `[data-act=listen]` en una lección `speechSynthesis.speaking` debe ser `false`.

- [ ] **Step 2: Ejecutarla y ver que falla.** Run: `node tests/e2e/run.mjs smoke` → FAIL (no existe `false-friends`).

- [ ] **Step 3: Implementar** — en `stepGrammar()` de `lesson.js`, antes de `nav(...)`:

```js
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
```

En `home.js`, después de `await speech.voicesReady()` (o al cargar las voces), si `!speech.hasItVoice()` se inserta arriba:

```js
h('div', { class: 'card warn', 'data-test': 'no-voice' },
  h('h2', null, 'Falta la voz italiana'),
  h('p', null, 'Este dispositivo no tiene una voz en italiano, así que los botones de audio no sonarán.'),
  h('p', null, 'iPhone: Ajustes › Accesibilidad › Contenido leído › Voces › Italiano → descarga Alice, Federica o Luca (mejor la versión "mejorada"). Mac: Ajustes del Sistema › Accesibilidad › Contenido leído › Voz del sistema › Gestionar voces › Italiano. Luego vuelve a abrir la app.'))
```

En `css/app.css`: `.false-friends .ff + .ff { border-top: 1px solid var(--border); padding-top: .8rem; margin-top: .8rem; }`.

- [ ] **Step 4: Ejecutar `npm test` y el E2E.** Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -am "Falsos amigos en cada lección y aviso cuando falta la voz italiana"` (más la línea Co-Authored-By).

---

### Task 3: Identidad visual, manifest, service worker y README

**Files:**
- Modify: `css/app.css` (tokens `:root` y modo oscuro), `index.html`, `manifest.webmanifest`, `sw.js`, `README.md`
- Create: `tools/make_icons.py`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/apple-touch-icon.png`

**Interfaces:**
- Produces: `sw.js` con `const PREFIX = 'italiano-cesar-'; const VERSION = PREFIX + 'v1-2026-10-05';` y `FILES` con todas las rutas, incluidos `js/data/week1.js` … `week8.js`.

- [ ] **Step 1: Prueba** — añadir a `tests/logic.test.js`:

```js
import { readFileSync, readdirSync } from 'node:fs';
test('sw.js: cachea todos los js y solo borra sus propias cachés', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(sw, /k\.startsWith\(PREFIX\) && k !== VERSION/);
  const listed = [...sw.matchAll(/'([^']+\.(?:js|css|png|webmanifest|html))'/g)].map((m) => m[1]);
  const walk = (d) => readdirSync(new URL(`../${d}`, import.meta.url), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.endsWith('.js') ? [`${d}/${e.name}`] : []));
  for (const f of walk('js')) assert.ok(listed.includes(f), `sw.js no cachea ${f}`);
});
```

- [ ] **Step 2: Ejecutar y ver que falla.** Run: `npm test` → FAIL.
- [ ] **Step 3: `sw.js`** — igual que el de inglés, pero `activate` borra solo `keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION)`, usa `caches.open(VERSION)` y `FILES` añade `js/data/week1.js` … `js/data/week8.js`.
- [ ] **Step 4: Paleta** — en `:root` (claro): `--bg:#f8f5ef; --surface:#ffffff; --surface-2:#efe9df; --text:#1d2420; --muted:#56605a; --border:#ddd5c8; --primary:#1e6b47; --primary-hover:#17583a; --primary-ink:#ffffff; --primary-soft:#dcefe4; --rec:#b8432d; --rec-soft:#fbe6e0;` (los demás tokens no cambian). En oscuro: `--bg:#0f1512; --surface:#16201b; --surface-2:#1e2b25; --text:#eef3f0; --muted:#a6b4ad; --border:#2c3c34; --primary:#5cc493; --primary-hover:#7ad4a9; --primary-ink:#06210f; --primary-soft:#173528; --rec:#ff9c84; --rec-soft:#3d1f18;`. `theme-color` en `index.html`: `#1e6b47` (claro) y `#0f1512` (oscuro); `background_color` `#f8f5ef` y `theme_color` `#1e6b47` en el manifest; `name` "Italiano per Cesar", `short_name` "Italiano", descripción "Italiano de viaje para hispanohablantes, desde cero."; `<title>`, `apple-mobile-web-app-title` "Italiano" y `document.title` en `app.js` con `· Italiano per Cesar`.
- [ ] **Step 5: Íconos** — `tools/make_icons.py` (Pillow): un cuadrado `#1e6b47` con el texto "Ciao" centrado en blanco (`/System/Library/Fonts/Supplemental/Arial Bold.ttf`, 30 % del lado) y debajo una franja fina de tres segmentos (verde `#2e8b57`, blanco, rojo `#c0392b`) al 78 % de la altura, con un margen seguro del 12 % para "maskable". Genera 512, 192 y 180 (`apple-touch-icon.png`). Run: `python3 tools/make_icons.py` y abrir el PNG de 512 para revisarlo a ojo.
- [ ] **Step 6: README** — el de inglés adaptado: nombre, "Cómo abrirla" con el enlace `https://cesarrinconcasas-bit.github.io/italiano/` y la descarga de voces italianas (iPhone y Mac, con los textos del aviso de la Task 2), "Cómo usarla cada día", "Qué hay" (32 lecciones, 8 semanas, falsos amigos), "Limitaciones honestas" y "Para desarrollo" (`npm test`, `npm run e2e`, servidor en `8766`, subir `VERSION`).
- [ ] **Step 7: `npm test`** → PASS. **Step 8: Commit** "Identidad visual, íconos, service worker con caché propia y README".

---

### Tasks 4–11: Contenido, una semana por task

Cada task crea `js/data/weekN.js` exportando `WEEKN` (la semana 1 añade las lecciones 2–4 a `WEEK1`), lo importa en `js/data/lessons.js` y añade sus ids al `PLAN`. **El esquema y el nivel de calidad son los de la lección 1 (Task 1, Step 9).**

**Pasos idénticos en cada una de estas tasks:**
- [ ] **Step 1:** Añadir los ids de la semana a `PLAN[N-1].lessons` en `plan.js` y el import en `lessons.js`. Run: `npm test` → FAIL (las lecciones no existen todavía o les faltan campos).
- [ ] **Step 2:** Escribir las 4 lecciones completas (todos los campos, con la tabla de abajo como contenido obligatorio). Reglas: italiano estándar; usar el `register` indicado; que las frases sean las que de verdad se oyen en Italia; mínimo 4 `pick` (al menos 1 de escucha con `audioOnly` y al menos 1 sobre el falso amigo), 2 `build` y 2 `type` por lección; cada respuesta `type` debe existir como `vocab` o `phrase`; diálogo de 8 a 10 líneas con Cesar como protagonista; `minutes` entre 15 y 20.
- [ ] **Step 3:** Run: `npm test` → PASS (estructura, `optionsLang`, ortografía).
- [ ] **Step 4:** Segunda lectura completa de las 4 lecciones contra esta lista: concordancia de género y número; artículo correcto (`lo`/`gli` ante s+consonante, z, gn, ps; `l'` ante vocal); acentos finales (`è`, `perché`, `più`, `città`, `caffè`, `sì`); dobles consonantes (`vorrei`, `prenotazione`, `biglietto`, `camera`, `cappuccino`); `lei` con mayúscula solo si se usa en cartas (aquí, minúscula); que las traducciones al español sean naturales en México y Colombia. Corregir lo que aparezca y volver a ejecutar `npm test`.
- [ ] **Step 5:** Commit "Semana N: lecciones a–d".

**Contenido obligatorio por lección** (vocabulario clave · frases clave · gramática · falsos amigos · diálogo):

**Task 4 — Semana 1** (`week1.js`, lecciones 2–4; `register: 'lei'`)
- **L2 *Non capisco*** — vocab: `zero, uno, due, tre, cinque, dieci, venti, capire, parlare, lentamente` · frases: `Non capisco.` `Può ripetere, per favore?` `Più lentamente, per favore.` `Parla inglese?` `Parla spagnolo?` `Come si dice … in italiano?` `Che cosa significa?` · gram.: negación con `non` antes del verbo (`Non parlo italiano`), números 0–20 (tabla en `explain`) · falsos amigos: `caldo` (caliente) y `burro` (mantequilla) · diálogo: en la taquilla de un museo, Cesar no entiende el precio y pide que lo repitan despacio.
- **L3 *Al bar*** — vocab: `un caffè, un cappuccino, un cornetto, una spremuta, l'acqua, il bancone, il tavolo, lo scontrino, la cassa, lo zucchero` · frases: `Vorrei un caffè, per favore.` `Un cappuccino e un cornetto.` `Al banco o al tavolo?` `Quanto costa?` `Pago alla cassa?` `Ecco lo scontrino.` `Senza zucchero.` · gram.: `un/uno/una/un'` y `vorrei` (= quisiera) · falsos amigos: `caffè` = espresso (no café americano); `latte` = leche (pedir "un latte" da un vaso de leche) · diálogo: Cesar paga en la caja y pide en la barra.
- **L4 *Piacere, sono Cesar*** — vocab: `americano/americana, colombiano/colombiana, messicano/messicana, gli Stati Uniti, la Florida, il lavoro, la vacanza, il marito, la moglie, in vacanza` (ajustar a 8–12) · frases: `Sono di Miami.` `Sono americano, ma parlo spagnolo.` `Sono qui in vacanza.` `Sono qui con mia moglie.` `Di dove è?` `Che lavoro fa?` `Sono agente di assicurazioni.` · gram.: adjetivos de nacionalidad `-o/-a` y `-e` invariable (`inglese`), `essere` completo en singular · falsos amigos: `la vacanza` (singular habitual: "in vacanza"); `simpatico`≈amable (igual) — usar en su lugar `fermare` (detener) vs. "firmar" (`firmare`) · diálogo: conversación en una terraza con una pareja italiana (aquí `register: 'lei'`, aunque al final ellos proponen "diamoci del tu").

**Task 5 — Semana 2** (`week2.js`, lecciones 5–8; `register: 'lei'`)
- **L5 *Al ristorante (1)*** — vocab: `la prenotazione, il tavolo, il menù, il cameriere, la cameriera, stasera, alle otto, per due, fuori, dentro` · frases: `Ho una prenotazione a nome Rincon.` `Un tavolo per due, per favore.` `Avete un tavolo fuori?` `Possiamo vedere il menù?` `Che cosa ci consiglia?` `Siamo in due.` · gram.: `avere` (ho, ha, abbiamo, avete) · falsos amigos: `la cena` = cena (igual) — usar `il primo` (primer plato, la pasta) y `il secondo` (plato fuerte, no "segundo" de tiempo) · diálogo: llegar a una trattoria con reservación.
- **L6 *Al ristorante (2)*** — vocab: `l'antipasto, il primo, il secondo, il contorno, il dolce, l'acqua naturale, l'acqua frizzante, il vino rosso, il conto, il coperto, allergico` · frases: `Per me, gli spaghetti alla carbonara.` `Prendo il pesce.` `Una bottiglia di acqua naturale.` `Sono allergico alle noci.` `Il conto, per favore.` `Possiamo pagare separatamente?` `Il servizio è incluso?` · gram.: `prendo` / `per me`; `alle` + alimento (`allergico alle noci`) · falsos amigos: `il coperto` (cargo fijo por persona, no "cubierto"); `la salsiccia` vs. `la salsa` · diálogo: pedir de entrada a postre y luego la cuenta; el mesero explica el *coperto*.
- **L7 *Numeri e prezzi*** — vocab: `venti, trenta, cinquanta, cento, mille, l'euro, i centesimi, la carta, i contanti, lo sconto` · frases: `Quanto costa?` `Quanto viene?` `Sono venti euro.` `Posso pagare con la carta?` `Accettate contanti?` `È troppo caro.` `C'è uno sconto?` · gram.: plural `-o→-i`, `-a→-e`, `-e→-i`; `euro` invariable · falsos amigos: `caro` = caro (igual) — usar `la carta` (tarjeta) frente a "carta" (lettera) y `costare` (igual)… usar `il resto` (cambio/vuelto) · diálogo: comprar recuerdos en un puesto y pagar con tarjeta.
- **L8 *Gelato e pizza*** — vocab: `il gusto, il cono, la coppetta, il cioccolato, la fragola, il pistacchio, la panna, la pizza al taglio, un pezzo, da asporto` · frases: `Un cono con due gusti, per favore.` `Che gusti avete?` `Posso assaggiare?` `Con panna, grazie.` `Un pezzo di margherita.` `Da portare via.` `Lo scaldo?` · gram.: `di` + sabor/ingrediente (`gelato al pistacchio` / `pizza ai funghi`: `al/alla/ai`) · falsos amigos: `la panna` (crema batida, no "pan"); `il peperoncino` vs. `il peperone` (pimiento) · diálogo: en una heladería, elegir sabores y tamaño.

**Task 6 — Semana 3** (`week3.js`, lecciones 9–12; `register: 'lei'`)
- **L9 *In stazione*** — vocab: `il treno, il biglietto, andata e ritorno, solo andata, il binario, la partenza, l'arrivo, il ritardo, convalidare, la biglietteria` · frases: `Un biglietto per Firenze, per favore.` `Andata e ritorno.` `Da che binario parte?` `A che ora parte il treno?` `Il treno è in ritardo.` `Devo convalidare il biglietto?` `È questo il treno per Napoli?` · gram.: `a che ora…?` / `alle` + hora · falsos amigos: `il binario` (andén, no "binario" informático) · diálogo: comprar en la taquilla y preguntar el andén.
- **L10 *L'ora e gli orari*** — vocab: `l'ora, il minuto, mezzogiorno, mezzanotte, la mattina, il pomeriggio, la sera, oggi, domani, aperto, chiuso` (ajustar a 12) y los días en `explain` · frases: `Che ore sono?` `Sono le tre e mezza.` `È l'una.` `A che ora apre?` `A che ora chiude?` `È aperto la domenica?` `Ci vediamo alle otto.` · gram.: `sono le…`/`è l'una`/`è mezzogiorno`; días de la semana con acento (`lunedì`…`venerdì`) · falsos amigos: `la sera` (tarde-noche) · diálogo: preguntar horario de una farmacia y quedar a una hora.
- **L11 *Indicazioni*** — vocab: `a destra, a sinistra, dritto, vicino, lontano, l'incrocio, il semaforo, la piazza, la strada, a piedi` · frases: `Scusi, dov'è il Colosseo?` `C'è una farmacia qui vicino?` `Vada sempre dritto.` `Giri a destra al semaforo.` `È lontano?` `Ci vogliono dieci minuti a piedi.` `Mi può mostrare sulla mappa?` · gram.: `c'è` / `ci sono`; imperativo formal de reconocimiento (`vada`, `giri`) · falsos amigos: `la strada` (calle) frente a "estrada"…; usar `guardare` (mirar, no "guardar") · diálogo: Cesar pregunta por la Fontana di Trevi.
- **L12 *Bus, metro e taxi*** — vocab: `l'autobus, la metro, la fermata, il tabaccaio, il taxi, l'aeroporto, la corsa, scendere, salire, timbrare` · frases: `Dove si compra il biglietto dell'autobus?` `Due biglietti, per favore.` `Questo autobus va al centro?` `A che fermata devo scendere?` `Mi porta all'aeroporto, per favore?` `Quanto costa la corsa?` `Si ferma qui, per favore.` · gram.: `andare` (vado, va, andiamo) · falsos amigos: `salire` (subir) y `scendere` (bajar), repaso · diálogo: comprar boletos en el *tabacchi* y tomar un taxi.

**Task 7 — Semana 4** (`week4.js`, lecciones 13–16; `register: 'lei'`)
- **L13 *In aeroporto*** — vocab: `il passaporto, il volo, la valigia, il bagaglio a mano, l'uscita, il controllo, la carta d'imbarco, perso, l'ufficio, il modulo` · frases: `Ecco il mio passaporto.` `Sono qui per turismo.` `Resto due settimane.` `La mia valigia non è arrivata.` `Dove si ritirano i bagagli?` `Devo compilare un modulo?` `Il volo è cancellato?` · gram.: verbos `-are` en presente (`arrivare, restare, parlare`) · falsos amigos: `l'uscita` (salida, puerta de embarque) frente a "suscitar" — usar `la valigia` vs. "valija" (igual) no; usar `il bagaglio` ≈ equipaje, y `la carta d'imbarco` · diálogo: denunciar una maleta perdida.
- **L14 *In albergo (1)*** — vocab: `la camera, la camera doppia, la chiave, il piano, l'ascensore, la colazione, il documento, la reception, il letto, la doccia` · frases: `Ho una prenotazione per tre notti.` `Ecco il mio documento.` `A che ora è la colazione?` `La colazione è inclusa?` `A che piano è la camera?` `C'è l'ascensore?` `Qual è la password del wifi?` · gram.: posesivos `il mio / la mia / il suo / la sua` · falsos amigos: `la camera` (habitación, no cámara: esa es `la macchina fotografica`) · diálogo: check-in completo.
- **L15 *In albergo (2)*** — vocab: `l'aria condizionata, il riscaldamento, l'asciugamano, il rumore, l'acqua calda, il check-out, il deposito bagagli, pulire, cambiare, rotto` · frases: `L'aria condizionata non funziona.` `Non c'è acqua calda.` `Potrebbe cambiarmi la camera?` `Mi servono altri asciugamani.` `Posso lasciare la valigia qui?` `A che ora è il check-out?` `C'è troppo rumore.` · gram.: `non funziona`, `potrebbe…?` (cortesía) · falsos amigos: `rumore` (ruido, no rumor) · diálogo: quejarse en recepción y dejar la maleta después del check-out.
- **L16 *Il tempo e i vestiti*** — vocab: `il sole, la pioggia, l'ombrello, il caldo, il freddo, la giacca, le scarpe, i pantaloncini, il cappello, il vento` · frases: `Che tempo fa?` `Fa caldo.` `Fa freddo.` `Piove.` `C'è il sole.` `Domani pioverà?` `Ho bisogno di un ombrello.` · gram.: `fa caldo/freddo`; verbos `-ere` (`prendere, vedere, mettere`) · falsos amigos: `caldo` (caliente, repaso) y `la tempesta`; usar `il tempo` (clima y tiempo) · diálogo: decidir qué ponerse para visitar Pompeya.

**Task 8 — Semana 5** (`week5.js`, lecciones 17–20; `register: 'lei'`)
- **L17 *Al mercato*** — vocab: `la frutta, la verdura, un chilo, un etto, mezzo chilo, le pesche, i pomodori, il formaggio, maturo, assaggiare` · frases: `Vorrei un chilo di pesche.` `Due etti di prosciutto, per favore.` `Posso assaggiare?` `Sono mature?` `Basta così, grazie.` `Quanto viene in tutto?` `Mi dà una busta?` · gram.: partitivo `del/della/dei/delle` · falsos amigos: `burro` (mantequilla, repaso), `l'aceto` (vinagre, no aceite: aceite es `l'olio`) · diálogo: comprar fruta y queso en el Mercato Centrale.
- **L18 *Nei negozi*** — vocab: `la taglia, il numero, il camerino, provare, la camicia, la borsa, rosso, blu, nero, bianco, i saldi` · frases: `Posso provarlo?` `Dov'è il camerino?` `Avete una taglia più grande?` `Che numero porta?` `Lo prendo.` `Solo guardo, grazie.` `Posso avere il tax free?` · gram.: `questo/quello`; concordancia de colores (`blu` invariable) · falsos amigos: `la borsa` (bolso/bolsa de valores) · diálogo: comprar una camisa y pedir el *tax free*.
- **L19 *Al museo*** — vocab: `il museo, la mostra, l'ingresso, il biglietto ridotto, la guida, l'audioguida, la fila, il guardaroba, le foto, il flash` · frases: `Due biglietti interi, per favore.` `C'è una riduzione per anziani?` `Si può fare foto?` `È vietato usare il flash.` `Dov'è l'ingresso?` `Quanto dura la visita?` `C'è un'audioguida in spagnolo?` · gram.: `si può…?` / `è vietato…` · falsos amigos: `la mostra` (exposición), `la fila` (cola) · diálogo: en la taquilla de los Museos Vaticanos.
- **L20 *In giro per la città*** — vocab: `la chiesa, il duomo, la piazza, la fontana, il ponte, le spalle, le ginocchia, coperto, la foto, il panorama` · frases: `Mi scusi, ci può fare una foto?` `Basta premere qui.` `Un'altra, per favore.` `Bisogna coprire le spalle.` `Si può entrare?` `Che bello!` `Grazie, è molto gentile.` · gram.: fórmulas de cortesía (`mi scusi`, `potrebbe`, `le dispiace…?`) · falsos amigos: `la piazza` vs. `la pizza` (pronunciación) y `il duomo` (catedral) · diálogo: pedir una foto frente al Duomo y la regla de vestimenta.

**Task 9 — Semana 6** (`week6.js`, lecciones 21–24; `register: 'lei'`)
- **L21 *In farmacia*** — vocab: `la farmacia, il mal di testa, il mal di stomaco, la febbre, il raffreddore, la tosse, la crema solare, le compresse, la ricetta, l'allergia` · frases: `Ho mal di testa.` `Mi fa male lo stomaco.` `Ha qualcosa per la tosse?` `Sono allergico alla penicillina.` `Quante volte al giorno?` `Serve la ricetta?` `Ho bisogno di crema solare.` · gram.: `ho mal di…` / `mi fa male…` · falsos amigos: `costipato` (resfriado, no estreñido), `la ricetta` (receta médica y de cocina) · diálogo: comprar algo para el dolor de cabeza.
- **L22 *Emergenze*** — vocab: `aiuto, la polizia, l'ambulanza, il pronto soccorso, rubato, perso, il portafoglio, la denuncia, l'ambasciata, urgente` · frases: `Aiuto!` `Chiami un'ambulanza!` `Ho perso il passaporto.` `Mi hanno rubato il portafoglio.` `Dov'è la questura?` `Devo fare una denuncia.` `Il numero di emergenza è 112.` · gram.: introducción al *passato prossimo* como fórmula (`ho perso`, `mi hanno rubato`) · falsos amigos: `la questura` (comisaría de policía) · diálogo: en la comisaría tras perder la cartera.
- **L23 *Dal medico*** — vocab: `la testa, la gola, la schiena, il braccio, la gamba, il piede, la pancia, il dente, il dottore, sentirsi` · frases: `Non mi sento bene.` `Ho la febbre da ieri.` `Mi fa male la gola.` `Ho una assicurazione di viaggio.` `Mi può fare una ricevuta?` `Prendo questo medicinale.` `Da quanto tempo?` · gram.: `ho la febbre` / `mi fa male` + parte del cuerpo; plurales irregulares (`il braccio → le braccia`) · falsos amigos: `la gamba` (pierna), `la pancia` (barriga) · diálogo: consulta en una guardia médica.
- **L24 *Risolvere problemi*** — vocab: `l'errore, il resto, il rimborso, il responsabile, il reclamo, la ricevuta, rifiutata, sbagliato, aspettare, controllare` · frases: `Scusi, c'è un errore nel conto.` `Non abbiamo ordinato questo.` `La carta è stata rifiutata.` `Posso parlare con il responsabile?` `Vorrei un rimborso.` `Mi può fare la ricevuta?` `Nessun problema, grazie lo stesso.` · gram.: `c'è un errore`, `non abbiamo…`; tono cortés (`mi scusi, ma…`) · falsos amigos: `il resto` (cambio, repaso), `sbagliato` (equivocado) · diálogo: cobro de más en un restaurante.

**Task 10 — Semana 7** (`week7.js`, lecciones 25–28; `register: 'tu'`)
- **L25 *Fare amicizia*** — vocab: `l'amico, l'amica, il calcio, la musica, viaggiare, cucinare, ballare, il fine settimana, anche, invece` · frases: `Mi piace viaggiare.` `Mi piacciono i cani.` `Ti piace il calcio?` `Anche a me!` `A me no.` `Che cosa fai nel tempo libero?` `Diamoci del tu!` · gram.: `mi piace` + singular/infinitivo, `mi piacciono` + plural; `ti` / `le` · falsos amigos: `l'esposizione`… usar `la fermata` vs. "firmada"…; usar `annoiato` (aburrido) y `noioso` · diálogo: charla con un italiano en un tren largo.
- **L26 *Famiglia e lavoro*** — vocab: `la famiglia, la moglie, i figli, il figlio, la figlia, il fratello, la sorella, l'ufficio, il cliente, l'azienda` · frases: `Sono sposato.` `Mia moglie si chiama Karla.` `Hai figli?` `Lavoro nelle assicurazioni.` `Ho un'agenzia in Florida.` `Aiuto le persone con l'assicurazione sanitaria.` `E tu, che lavoro fai?` · gram.: posesivos con familia (sin artículo en singular: `mia moglie`, con artículo en plural: `i miei figli`) · falsos amigos: `i parenti` (familiares, no solo padres), `la ditta`… usar `l'azienda` (empresa) · diálogo: cena con una familia italiana. (No se inventan datos de los hijos de Cesar: el diálogo usa solo a Karla y su trabajo.)
- **L27 *Com'è andata la giornata?*** — vocab: `ieri, stamattina, oggi pomeriggio, visitare, mangiare, comprare, camminare, vedere, fare, stanco` · frases: `Ho visitato il Colosseo.` `Abbiamo mangiato una pizza buonissima.` `Ho comprato dei regali.` `Abbiamo camminato tanto.` `Che cosa hai fatto oggi?` `Ho visto il Pantheon.` `Sono stanco morto!` · gram.: *passato prossimo* con `avere` (`ho + -ato/-uto/-ito`, irregulares `fatto`, `visto`) · falsos amigos: `stanco` (cansado, no "estanco") · diálogo: contar el día a un amigo por la noche.
- **L28 *Dove sei stato?*** — vocab: `andare, tornare, partire, arrivare, restare, l'anno scorso, la settimana scorsa, il viaggio, la prima volta, già` · frases: `Sono andato a Venezia.` `Siamo arrivati ieri.` `Sei mai stato in Sicilia?` `È la prima volta in Italia.` `Siamo rimasti tre giorni.` `Sono già stato a Roma.` `Torniamo a casa domenica.` · gram.: *passato prossimo* con `essere` y la concordancia (`sono andato`, `mia moglie è andata`, `siamo andati`) · falsos amigos: `restare` (quedarse, no restar) · diálogo: intercambiar experiencias de viaje.

**Task 11 — Semana 8** (`week8.js`, lecciones 29–32; `register: 'lei'`, salvo la 32 que mezcla)
- **L29 *Noleggiare un'auto*** — vocab: `la macchina, il noleggio, la patente, la benzina, il gasolio, il pieno, l'autostrada, il casello, il parcheggio, la ZTL` · frases: `Vorrei noleggiare una macchina.` `Ecco la mia patente.` `Il pieno, per favore.` `Devo pagare il pedaggio?` `Posso parcheggiare qui?` `Che cos'è la ZTL?` `L'assicurazione è inclusa?` · gram.: `dovere` / `potere` + infinitivo · falsos amigos: `la macchina` (coche), `il gasolio` (diésel, no gasolina) · diálogo: recoger el auto y preguntar por la ZTL.
- **L30 *Al telefono*** — vocab: `il telefono, chiamare, pronto, richiamare, il numero, la segreteria, lettera, la a, la b, doppia` (alfabeto en `explain`) · frases: `Pronto?` `Vorrei prenotare un tavolo per stasera.` `Come si scrive?` `Rincon: R come Roma, I come Imola…` `Può richiamare più tardi?` `Parlo con l'hotel Bellavista?` `La sento male.` · gram.: alfabeto italiano y deletreo con ciudades; `vorrei` + infinitivo · falsos amigos: `pronto` (¿bueno?/¿aló? al teléfono, además de rápido) · diálogo: reservar por teléfono y deletrear el apellido.
- **L31 *Programmi*** — vocab: `domani, dopodomani, la settimana prossima, l'escursione, la gita, prenotare, il tour, il porto, il traghetto, la costiera` · frases: `Domani andiamo a Capri.` `Vorrei prenotare un'escursione.` `A che ora parte il traghetto?` `Quanto dura la gita?` `Andrò a Firenze la settimana prossima.` `Che cosa facciamo stasera?` `Ci sentiamo domani!` · gram.: presente con valor de futuro y futuro básico (`andrò, faremo, sarà`) · falsos amigos: `la gita` (excursión), `la costiera` (costa) · diálogo: reservar una excursión a la Costiera Amalfitana.
- **L32 *L'ultimo giorno*** — vocab: `salutare, ringraziare, la recensione, il ricordo, indimenticabile, tornare, mancare, il volo di ritorno, il terminal, presto` · frases: `Grazie di tutto!` `È stato un viaggio indimenticabile.` `Ci mancherà l'Italia.` `Speriamo di tornare presto.` `Lascerò una bella recensione.` `A che ora devo essere in aeroporto?` `Arrivederci e grazie ancora!` · gram.: repaso general (`essere/avere`, `vorrei`, pasado y futuro básicos, en `explain` con un ejemplo de cada uno) · falsos amigos: `mancare` (`mi manca` = lo extraño) · diálogo: despedirse del hotel y pedir un taxi al aeropuerto.

*(Donde la tabla de un falso amigo dice "usar …", ese es el falso amigo que se incluye; las otras palabras de la misma línea son notas descartadas y no van a los datos.)*

---

### Task 12: Plan de 8 semanas completo y vista de lecciones

**Files:**
- Modify: `js/data/plan.js`, `js/views/lessons.js`, `js/views/home.js`

**Interfaces:**
- Consumes: `LESSONS` (32), `PLAN`.

- [ ] **Step 1: Prueba** — en `tests/logic.test.js`, el test del plan pasa a exigir 32 lecciones y 4 por semana:

```js
test('plan: 8 semanas con 4 lecciones cada una, todas existentes', () => {
  assert.equal(LESSONS.length, 32);
  assert.equal(PLAN.length, 8);
  PLAN.forEach((w, i) => {
    assert.equal(w.week, i + 1);
    assert.deepEqual(w.lessons, [1, 2, 3, 4].map((n) => i * 4 + n));
    assert.ok(w.title && w.level && w.canDo.length >= 3);
  });
  for (const l of LESSONS) assert.equal(l.week, Math.ceil(l.id / 4), `L${l.id} semana`);
});
```

- [ ] **Step 2: `npm test`** → FAIL si falta algo; **Step 3:** escribir `PLAN` con los títulos de semana del spec, `level` ("Principiante → A1" en las semanas 1–2, "A1" en las 3–6, "A1 → A2" en las 7–8) y `canDo` (3–4 frases "Puedes…" por semana, tomadas de los objetivos de sus lecciones). Quitar de `lessons.js`/`home.js` cualquier texto o rama de "semana planeada, sin lecciones" (en esta app no existe ese caso). **Step 4:** `npm test` → PASS. **Step 5:** Commit "Plan de 8 semanas con las 32 lecciones".

---

### Task 13: Pruebas E2E con el Chrome del sistema

**Files:**
- Create: `tests/e2e/cdp.mjs` (lanzar Chrome headless con `--remote-debugging-port=9334 --user-data-dir=<tmp> --use-fake-ui-for-media-stream --use-fake-device-for-media-stream --autoplay-policy=no-user-gesture-required`, conectar por WebSocket, `ev(expr)`, `send(method, params)`, `close()`), `tests/e2e/run.mjs`
- Modify: `package.json` → `"e2e": "node tests/e2e/run.mjs"`

**Interfaces:**
- Consumes: los selectores `data-act` existentes (`next`, `continue`, `dont-know`, `check`, `reveal`, `record`, `export`, `import-file`), `[data-test=false-friends]` y `[data-test=no-voice]`.

- [ ] **Step 1: Escribir `run.mjs`**, que levanta `python3 -m http.server 8766` en la raíz del proyecto, lanza Chrome y ejecuta:
  1. **Inicio** sin errores en la consola (`Runtime.exceptionThrown`, `console.error`).
  2. **Las 32 lecciones de principio a fin:** para cada id, `location.hash = '#/leccion/' + id`; repetir hasta ver "¡Lección terminada!" (máximo 400 iteraciones): si hay `.sheet [data-act=continue]` → click; si hay `.options .option` → click en la primera; si hay `.tile` → click en todas y luego `[data-act=check]`; si hay `[data-act=type-input]` → `[data-act=dont-know]`; si hay `[data-act=reveal]` → click; si no, `[data-act=next]`. Al final, `JSON.parse(localStorage['italiano-cesar-v1']).lessons[id].done === true`.
  3. **Respuestas correctas:** en la lección 1, para cada `type` buscar `ex.answer` con `import('/js/data/lessons.js')` según el texto `ex.es` mostrado, escribirlo sin acentos y comprobar que aparece "Revisa la ortografía" cuando la respuesta lleva acento.
  4. **Grabar:** en Vocabulario de la lección 1, `[data-act=record]` dos veces (iniciar/detener) con el micrófono simulado → aparece `[data-act=mine]`.
  5. **Persistencia:** recargar → el progreso sigue.
  6. **Copia de seguridad:** `Browser.setDownloadBehavior` a una carpeta temporal, `[data-act=export]` → el archivo descargado tiene `app: 'italiano-cesar'` y 32 lecciones `done`; luego `resetAll` en la página e importar ese archivo con `DOM.setFileInputFiles` en `[data-act=import-file]` → vuelve el progreso. Importar un JSON con `app:'ingles-karla'` → mensaje de error y el progreso no cambia.
  7. **Sin voz italiana:** nueva pestaña con `Page.addScriptToEvaluateOnNewDocument` que sobreescribe `speechSynthesis.getVoices = () => []` → `[data-test=no-voice]` visible; click en `[data-act=listen]` → `speechSynthesis.speaking === false`.
  8. **Capturas** (`Emulation.setDeviceMetricsOverride` a 390×844 y 1280×900) de Inicio, una lección (Gramática con falsos amigos) y un ejercicio, guardadas en la carpeta temporal para revisarlas a ojo.
- [ ] **Step 2: Ejecutar** `npm run e2e` → PASS. Revisar las capturas (que el texto no se desborde a 390 px, que se distinga el botón primario y que el aviso de voz se lea). Arreglar lo que aparezca y repetir.
- [ ] **Step 3: Commit** "Pruebas E2E: 32 lecciones, grabación, respaldo y voz ausente".

---

### Task 14: Publicación en GitHub Pages (con confirmación)

- [ ] **Step 1:** `npm test && npm run e2e` → PASS. Subir `VERSION` en `sw.js` si cambió algo desde la Task 3.
- [ ] **Step 2: Pedir confirmación a Cesar** para crear `cesarrinconcasas-bit/italiano` (público, porque es necesario para Pages gratis) y publicar. **Sin un "sí" explícito no se ejecuta el paso 3.**
- [ ] **Step 3:** `gh repo create cesarrinconcasas-bit/italiano --public --source . --push` y luego `gh api -X POST repos/cesarrinconcasas-bit/italiano/pages -f 'source[branch]=main' -f 'source[path]=/'`. Esperar a que `gh api repos/cesarrinconcasas-bit/italiano/pages` diga `"status":"built"`.
- [ ] **Step 4:** Abrir `https://cesarrinconcasas-bit.github.io/italiano/` en Chrome headless: carga sin errores, el service worker queda registrado y la lección 1 se abre. Comprobar que `https://cesarrinconcasas-bit.github.io/ingles-karla/` sigue cargando y que su `localStorage['ingles-karla-v1']` no cambió.
- [ ] **Step 5: Que la app de inglés no borre las cachés de italiano.** Hoy, al actualizarse, el `sw.js` de inglés borra **todas** las cachés que no son la suya, incluidas las de italiano (las cachés se comparten por dominio). Cambio mínimo en `/Volumes/storage/app/ingles/sw.js`, sin tocar nada más:

```js
const PREFIX = 'ingles-karla-';
const VERSION = PREFIX + 'v2-2026-10-05';
// …
caches.keys().then((keys) => Promise.all(keys
  .filter((k) => k !== VERSION && (k.startsWith(PREFIX) || /^v\d+-/.test(k))) // solo sus cachés (incluida la antigua 'v1-…')
  .map((k) => caches.delete(k))))
```

Run: `cd /Volumes/storage/app/ingles && npm test` → PASS. Prueba en el navegador: con ambas apps servidas en el mismo origen local (`python3 -m http.server` desde `/Volumes/storage/app`, rutas `/ingles/` e `/italiano/`), abrir italiano, luego inglés (se activa su SW v2) → `caches.keys()` sigue incluyendo `italiano-cesar-…`; y `localStorage` conserva por separado `ingles-karla-v1` e `italiano-cesar-v1`. Commit en el repo de inglés ("sw: solo borra sus propias cachés"). **Pedir confirmación antes de hacer push** a `ingles-karla` (ese push actualiza la app de Karla).
- [ ] **Step 6:** Actualizar la memoria del proyecto (`italiano-cesar-app.md` + índice) con la ruta, el enlace y las reglas.
