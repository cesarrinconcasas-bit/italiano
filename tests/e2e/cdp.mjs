// Control mínimo de Chrome por el protocolo DevTools (sin dependencias).
// Usa el Chrome del sistema: los navegadores de Playwright no funcionan en macOS 13.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9334;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ downloads } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'italiano-e2e-'));
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run',
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    '--autoplay-policy=no-user-gesture-required', '--window-size=1280,900', 'about:blank',
  ], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 60 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!page) await sleep(200);
  }
  if (!page) throw new Error('Chrome no arrancó');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map((a) => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send('Runtime.enable');
  await send('Page.enable');
  if (downloads) await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

  async function ev(expression) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || JSON.stringify(r.result.exceptionDetails));
    return r.result?.result?.value;
  }
  async function goto(url) {
    await send('Page.navigate', { url });
    await sleep(700);
  }
  async function close() {
    await Promise.race([send('Browser.close'), sleep(1500)]);
    ws.close();
    proc.kill();
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  return { send, ev, goto, close, errors, sleep };
}

// Servidor estático local (http://localhost:8766) con python3, servido desde `root`.
export async function serve(root, port = 8766) {
  const p = spawn('python3', ['-m', 'http.server', String(port)], { cwd: root, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try { await fetch(`http://localhost:${port}/`); return { url: `http://localhost:${port}`, stop: () => p.kill() }; } catch {}
    await sleep(150);
  }
  p.kill();
  throw new Error('El servidor local no arrancó');
}
