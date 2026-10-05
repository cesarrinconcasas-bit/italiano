// Pruebas de punta a punta en el Chrome del sistema. Uso: node tests/e2e/run.mjs [escenario…]
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { launch, serve } from './cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const scenarios = {};

// Pulsa "Siguiente" hasta llegar al paso indicado (Vocabulario y Frases avanzan de a una tarjeta).
async function untilStep(b, name) {
  for (let i = 0; i < 80; i++) {
    if ((await b.ev(`document.querySelector('.step-name')?.textContent`)) === name) return;
    await b.ev(`document.querySelector('[data-act=next]').click()`);
    await b.sleep(60);
  }
  throw new Error(`no se llegó al paso ${name}`);
}

// Llega al paso Gramática de la lección 1 y revisa los falsos amigos.
scenarios.falseFriends = async ({ url }) => {
  const b = await launch();
  try {
    await b.goto(`${url}/#/leccion/1`);
    await untilStep(b, 'Gramática');
    const txt = await b.ev(`document.querySelector('[data-test=false-friends]')?.innerText || ''`);
    assert.match(txt, /salire/, 'falsos amigos en Gramática');
    assert.deepEqual(b.errors, []);
  } finally { await b.close(); }
};

// Sin voces italianas: aviso visible y los botones de audio no hablan.
scenarios.noVoice = async ({ url }) => {
  const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `speechSynthesis.getVoices = () => [];` });
    await b.goto(`${url}/#/`);
    await b.sleep(2000);
    assert.ok(await b.ev(`!!document.querySelector('[data-test=no-voice]')`), 'aviso de voz en Inicio');
    await b.goto(`${url}/#/leccion/1`);
    await b.ev(`document.querySelector('[data-act=next]').click()`);
    await b.sleep(200);
    await b.ev(`document.querySelector('[data-act=listen]').click()`);
    await b.sleep(300);
    assert.equal(await b.ev(`speechSynthesis.speaking || speechSynthesis.pending`), false, 'no habla sin voz italiana');
    assert.deepEqual(b.errors, []);
  } finally { await b.close(); }
};

// Conduce una lección completa desde la página. `smart` responde bien los ejercicios
// de ordenar y escribir (escribiendo sin acentos); el resto se responde con la primera opción.
const DRIVE = `async (id, smart) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const { getLesson } = await import('/js/data/lessons.js');
  const lesson = getLesson(id);
  const strip = (t) => t.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  const q = (s) => document.querySelector(s);
  const seen = { typo: 0 };
  location.hash = '#/leccion/' + id;
  await sleep(250);
  for (let i = 0; i < 800; i++) {
    if (q('h1')?.textContent === '¡Lección terminada!') return { done: true, ...seen };
    const sheet = q('.sheet [data-act=continue]');
    if (sheet) {
      if (/Revisa la ortograf/.test(q('.sheet').innerText)) seen.typo++;
      sheet.click();
    } else if (q('.build-bank')) {
      const es = q('.ex-sentence')?.textContent.replace(/^"|"$/g, '');
      const ex = smart && lesson.exercises.find((e) => e.type === 'build' && e.es === es);
      if (ex && !q('.build-answer .tile')) {
        for (const w of ex.ita.split(/\\s+/)) [...document.querySelectorAll('.build-bank .tile')].find((t) => t.dataset.word === w).click();
      } else if (!q('.build-answer .tile')) q('.build-bank .tile').click();
      q('[data-act=check]').click();
    } else if (q('[data-act=type-input]') && !q('[data-act=type-input]').disabled) {
      const es = q('.ex-sentence')?.textContent.replace(/^"|"$/g, '');
      const ex = smart && lesson.exercises.find((e) => e.type === 'type' && e.es === es);
      if (ex) {
        const inp = q('[data-act=type-input]');
        inp.value = strip(ex.answer);
        q('[data-act=check]').click();
      } else q('[data-act=dont-know]').click();
    } else if (q('.options .option:not([disabled])')) {
      q('.options .option').click();
    } else if (q('[data-act=reveal]')) {
      q('[data-act=reveal]').click();
    } else if (q('[data-act=next]')) {
      q('[data-act=next]').click();
    }
    await sleep(25);
  }
  return { done: false, step: q('.step-name')?.textContent, html: q('main').innerText.slice(0, 300) };
}`;

scenarios.allLessons = async ({ url }) => {
  const b = await launch();
  try {
    await b.goto(`${url}/#/`);
    for (let id = 1; id <= 32; id++) {
      const r = await b.ev(`(${DRIVE})(${id}, false)`);
      assert.ok(r.done, `L${id} no terminó: ${JSON.stringify(r)}`);
      assert.equal(await b.ev(`JSON.parse(localStorage['italiano-cesar-v1']).lessons[${id}]?.done`), true, `L${id} guardada`);
    }
    await b.goto(`${url}/#/`);
    await b.sleep(300);
    const done = await b.ev(`Object.values(JSON.parse(localStorage['italiano-cesar-v1']).lessons).filter((l) => l.done).length`);
    assert.equal(done, 32, 'progreso tras recargar');
    assert.match(await b.ev(`document.querySelector('main').innerText`), /32\/32/);
    assert.equal(await b.ev(`localStorage.getItem('ingles-karla-v1')`), null, 'no toca el progreso de inglés');
    assert.deepEqual(b.errors, []);
  } finally { await b.close(); }
};

// Respuesta escrita sin acento ("gia" por "già"): correcta con aviso de ortografía.
scenarios.accents = async ({ url }) => {
  const b = await launch();
  try {
    await b.goto(`${url}/#/`);
    const r = await b.ev(`(${DRIVE})(28, true)`);
    assert.ok(r.done, JSON.stringify(r));
    assert.ok(r.typo >= 1, 'aviso "Revisa la ortografía" al escribir sin acento');
    assert.deepEqual(b.errors, []);
  } finally { await b.close(); }
};

// Grabar con el micrófono simulado: aparece "Mi voz" y se cuenta la grabación.
scenarios.record = async ({ url }) => {
  const b = await launch();
  try {
    await b.goto(`${url}/#/leccion/1`);
    await untilStep(b, 'Vocabulario');
    await b.ev(`document.querySelector('[data-act=record]').click()`);
    await b.sleep(1200);
    await b.ev(`document.querySelector('[data-act=record]').click()`);
    await b.sleep(800);
    assert.equal(await b.ev(`document.querySelector('.audio-row.mine')?.hidden`), false, '"Mi voz" visible');
    const recs = await b.ev(`Object.values(JSON.parse(localStorage['italiano-cesar-v1']).days).reduce((a, d) => a + d.recordings, 0)`);
    assert.equal(recs, 1);
    assert.deepEqual(b.errors, []);
  } finally { await b.close(); }
};

// Copia de seguridad: exportar, borrar, importar; y rechazar la copia de la app de inglés.
scenarios.backup = async ({ url }) => {
  const { mkdtempSync, readdirSync, readFileSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'italiano-dl-'));
  const b = await launch({ downloads: dir });
  try {
    await b.goto(`${url}/#/`);
    await b.ev(`(${DRIVE})(1, false)`);
    await b.goto(`${url}/#/respaldo`);
    await b.ev(`document.querySelector('[data-act=export]').click()`);
    let file;
    for (let i = 0; i < 30 && !file; i++) { await b.sleep(200); file = readdirSync(dir).find((f) => f.endsWith('.json')); }
    assert.ok(file, 'se descargó la copia');
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    assert.equal(data.app, 'italiano-cesar');
    assert.equal(data.state.lessons[1].done, true);

    const setFile = async (path) => {
      const { result: { root } } = await b.send('DOM.getDocument');
      const { result: { nodeId } } = await b.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-act=import-file]' });
      await b.send('DOM.setFileInputFiles', { nodeId, files: [path] });
      await b.sleep(400);
      await b.ev(`document.querySelector('.overlay [data-act=ok]')?.click()`);
      await b.sleep(400);
    };
    // Copia de la app de inglés: se rechaza y el progreso no cambia.
    const foreign = join(dir, 'ingles.json');
    writeFileSync(foreign, JSON.stringify({ app: 'ingles-karla', state: { cards: {}, lessons: {} } }));
    await setFile(foreign);
    assert.match(await b.ev(`document.body.innerText`), /no es una copia/i, 'mensaje de rechazo');
    assert.equal(await b.ev(`JSON.parse(localStorage['italiano-cesar-v1']).lessons[1].done`), true);
    // Borrar y recuperar desde la copia.
    await b.ev(`localStorage.removeItem('italiano-cesar-v1')`);
    await b.goto(`${url}/#/respaldo`);
    await setFile(join(dir, file));
    assert.equal(await b.ev(`JSON.parse(localStorage['italiano-cesar-v1']).lessons[1].done`), true, 'progreso recuperado');
    assert.deepEqual(b.errors, []);
  } finally { await b.close(); }
};

// Capturas en ancho de iPhone y de escritorio para revisarlas a ojo.
scenarios.screens = async ({ url }) => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = process.env.SHOTS || mkdtempSync(join(tmpdir(), 'italiano-shots-'));
  const b = await launch();
  try {
    for (const [w, h, tag] of [[390, 844, 'iphone'], [1280, 900, 'desk']]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 });
      const shot = async (name) => {
        const r = await b.send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(dir, `${tag}-${name}.png`), Buffer.from(r.result.data, 'base64'));
      };
      await b.goto(`${url}/#/`); await b.ev(`localStorage.clear()`); await b.send('Page.reload'); await b.sleep(700); await b.sleep(1800); await shot('inicio');
      await b.goto(`${url}/#/lecciones`); await b.sleep(400); await shot('lecciones');
      await b.goto(`${url}/#/leccion/6`); await untilStep(b, 'Gramática'); await b.ev(`document.querySelector('[data-test=false-friends]').scrollIntoView()`); await shot('falsos-amigos');
      await untilStep(b, 'Ejercicios'); await shot('ejercicio');
    }
    console.log(`  capturas en ${dir}`);
    assert.deepEqual(b.errors, []);
  } finally { await b.close(); }
};

const pick = process.argv.slice(2);
const srv = await serve(ROOT);
let failed = 0;
try {
  for (const [name, fn] of Object.entries(scenarios)) {
    if (pick.length && !pick.includes(name)) continue;
    try { await fn({ url: srv.url }); console.log(`ok - ${name}`); }
    catch (e) { failed++; console.log(`not ok - ${name}\n  ${e.message}`); }
  }
} finally { srv.stop(); }
process.exitCode = failed ? 1 : 0;
