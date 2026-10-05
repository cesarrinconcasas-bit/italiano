// Utilidades de interfaz: creación de elementos, íconos, controles de audio,
// hojas de corrección y ventanas de confirmación (sin alert/confirm del navegador).
import * as speech from './speech.js';
import * as rec from './recorder.js';
import { countRecording } from './store.js';

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

// Agrega hijos ignorando null/false y aplanando listas.
export function put(el, ...children) {
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

const P = {
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  slow: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l-4-5"/><circle cx="12" cy="18" r="1.2" fill="currentColor"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 12V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v3a3 3 0 0 1-3 3H3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  ear: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>',
  compare: '<path d="M7 4L3 8l4 4"/><path d="M3 8h14"/><path d="M17 12l4 4-4 4"/><path d="M21 16H7"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
  cards: '<rect x="3" y="7" width="13" height="14" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/>',
  chart: '<path d="M5 20V11"/><path d="M12 20V4"/><path d="M19 20v-6"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  upload: '<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 2 2s-.5-3.5 1-7z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  back5: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none"/>',
};

export function icon(name, size = 24) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
  return span;
}

export function btn(label, onClick, { cls = '', ic = null, attrs = {} } = {}) {
  return h('button', { type: 'button', class: `btn ${cls}`.trim(), onClick, ...attrs }, ic ? icon(ic) : null, h('span', null, label));
}

// Fila de controles de audio para un texto en italiano.
export function audioControls(text, { kind = 'f', record = true, repeat = true, key = text } = {}) {
  const wrap = h('div', { class: 'audio-controls' });
  const status = h('p', { class: 'audio-status', 'aria-live': 'polite' });
  const mine = h('div', { class: 'audio-row mine', hidden: true });
  let repeating = false;

  const setStatus = (t) => (status.textContent = t || '');

  const listen = btn('Escuchar', () => {
    repeating = false;
    speech.speak(text, { kind });
  }, { cls: 'btn-audio', ic: 'play', attrs: { 'data-act': 'listen' } });

  const slow = btn('Lento', () => {
    repeating = false;
    speech.speak(text, { kind, slow: true });
  }, { cls: 'btn-audio', ic: 'slow', attrs: { 'data-act': 'slow' } });

  const rep = btn('Repetir ×3', async () => {
    if (repeating) {
      repeating = false;
      speech.stop();
      setStatus('');
      return;
    }
    repeating = true;
    const pause = 1200 + text.length * 70;
    for (let i = 1; i <= 3 && repeating; i++) {
      setStatus(`Escucha y repite en voz alta (${i} de 3)`);
      const ok = await speech.speak(text, { kind, slow: i === 2 });
      if (!ok || !repeating) break;
      await speech.wait(pause);
    }
    if (repeating) setStatus('¡Bien! Ahora intenta grabarte.');
    repeating = false;
  }, { cls: 'btn-audio', ic: 'repeat', attrs: { 'data-act': 'repeat' } });

  const row = h('div', { class: 'audio-row' }, listen, slow, repeat ? rep : null);
  wrap.append(row);

  if (record) {
    const recBtn = btn('Grabar mi voz', null, { cls: 'btn-rec', ic: 'mic', attrs: { 'data-act': 'record' } });
    const playMine = btn('Mi voz', () => rec.play(key), { cls: 'btn-audio', ic: 'ear', attrs: { 'data-act': 'mine' } });
    const compare = btn('Comparar', async () => {
      setStatus('Primero el modelo…');
      await speech.speak(text, { kind });
      await speech.wait(400);
      setStatus('…ahora tu voz.');
      await rec.play(key);
      setStatus('¿Suenan parecido? Si no, escucha en lento y vuelve a grabar.');
    }, { cls: 'btn-audio', ic: 'compare', attrs: { 'data-act': 'compare' } });
    mine.append(playMine, compare);

    const label = recBtn.querySelector('span');
    recBtn.addEventListener('click', async () => {
      if (!rec.supported) {
        setStatus(rec.unsupportedReason());
        return;
      }
      if (rec.isRecording()) {
        rec.stop();
        return;
      }
      speech.stop();
      try {
        recBtn.classList.add('recording');
        label.textContent = 'Detener';
        recBtn.querySelector('.icon').replaceWith(icon('stop'));
        setStatus('Grabando… di la frase y toca "Detener".');
        const url = await rec.start(key);
        if (url) {
          mine.hidden = false;
          countRecording();
          setStatus('Listo. Toca "Comparar" para oír el modelo y tu voz.');
        } else {
          setStatus('No se grabó sonido. Intenta otra vez.');
        }
      } catch (e) {
        setStatus(micErrorText(e));
      } finally {
        recBtn.classList.remove('recording');
        label.textContent = 'Grabar mi voz';
        recBtn.querySelector('.icon').replaceWith(icon('mic'));
      }
    });
    if (rec.get(key)) mine.hidden = false;
    wrap.append(h('div', { class: 'audio-row' }, recBtn), mine);
  }
  wrap.append(status);
  return wrap;
}

export function micErrorText(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') {
    return 'No hay permiso para el micrófono. En iPhone: Ajustes › Safari › Micrófono › Permitir (o toca "aA" en la barra de Safari). Luego intenta otra vez.';
  }
  if (n === 'NotFoundError') return 'No se encontró un micrófono en este equipo.';
  return 'No se pudo usar el micrófono. ' + (e && e.message ? e.message : '');
}

// Hoja inferior con la corrección. Devuelve una promesa al tocar "Continuar".
export function feedback({ ok, title, lines = [], speakText = null }) {
  return new Promise((resolve) => {
    const sheet = h('div', { class: `sheet ${ok ? 'sheet-ok' : 'sheet-try'}`, role: 'status', 'aria-live': 'assertive' },
      h('div', { class: 'sheet-inner' },
        h('p', { class: 'sheet-title' }, icon(ok ? 'check' : 'info', 28), title),
        lines.map((l) => (l instanceof Node ? l : h('p', null, l))),
        speakText ? h('div', { class: 'audio-row' }, btn('Escuchar', () => speech.speak(speakText), { cls: 'btn-audio', ic: 'play' })) : null,
        btn('Continuar', () => {
          sheet.remove();
          resolve();
        }, { cls: 'btn-primary btn-block', attrs: { 'data-act': 'continue' } }),
      ),
    );
    document.body.append(sheet);
    sheet.querySelector('[data-act="continue"]').focus({ preventScroll: true });
  });
}

export function confirmModal(text, okLabel = 'Sí', cancelLabel = 'Cancelar') {
  return new Promise((resolve) => {
    const close = (v) => {
      overlay.remove();
      resolve(v);
    };
    const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'modal' },
        h('p', null, text),
        h('div', { class: 'modal-actions' },
          btn(cancelLabel, () => close(false), { cls: 'btn-secondary', attrs: { 'data-act': 'cancel' } }),
          btn(okLabel, () => close(true), { cls: 'btn-danger', attrs: { 'data-act': 'ok' } }),
        ),
      ),
    );
    document.body.append(overlay);
  });
}

export function toast(text) {
  const t = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 3200);
}

export const PRAISE = ['¡Muy bien!', '¡Correcto!', '¡Excelente!', '¡Eso es!', '¡Perfecto!'];
export const ENCOURAGE = ['Casi. Así se dice:', 'No pasa nada, así se aprende.', 'Buen intento. Fíjate en esto:'];
export const randomOf = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function clear(el) {
  el.replaceChildren();
  return true;
}
