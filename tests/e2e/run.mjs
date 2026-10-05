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
