// Voz en italiano con la síntesis de voz del propio dispositivo (gratis). Sin voz italiana no se habla.
import { get } from './store.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];

// Voces "de juguete" de Apple que suenan mal para aprender.
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;
const FEMALE = ['Alice', 'Federica', 'Paola', 'Emma', 'Google italiano', 'Microsoft Elsa', 'Microsoft Isabella'];
const MALE = ['Luca', 'Microsoft Diego', 'Microsoft Cosimo', 'Microsoft Giuseppe'];

export const supported = !!synth && typeof window.SpeechSynthesisUtterance !== 'undefined';

function loadVoices() {
  if (!synth) return;
  voices = synth.getVoices();
}
if (synth) {
  loadVoices();
  synth.addEventListener?.('voiceschanged', loadVoices);
}

export function voicesReady() {
  return new Promise((resolve) => {
    if (!synth) return resolve([]);
    loadVoices();
    if (voices.length) return resolve(voices);
    const t = setTimeout(() => resolve((loadVoices(), voices)), 1500);
    synth.addEventListener?.('voiceschanged', () => {
      clearTimeout(t);
      loadVoices();
      resolve(voices);
    }, { once: true });
  });
}

export function itVoices() {
  return voices.filter((v) => /^it[-_]IT/i.test(v.lang) && !NOVELTY.test(v.name));
}

function rank(v, preferred) {
  const i = preferred.findIndex((p) => v.name.startsWith(p));
  const quality = /premium|enhanced|mejorada|natural/i.test(v.name) ? -100 : 0;
  return (i === -1 ? 50 : i) + quality;
}

function pick(preferred, avoid = []) {
  const list = itVoices().filter((v) => !avoid.includes(v.name));
  if (!list.length) return null;
  return [...list].sort((a, b) => rank(a, preferred) - rank(b, preferred))[0];
}

// kind: 'f' (narración) | 'f2' (otra mujer) | 'm' (hombre)
export function voiceFor(kind = 'f') {
  const s = get().settings;
  const byName = (n) => n && itVoices().find((v) => v.name === n);
  const f = byName(s.voiceF) || pick(FEMALE);
  if (kind === 'f') return f;
  if (kind === 'f2') return byName(s.voiceF2) || pick(FEMALE, f ? [f.name] : []) || f;
  return byName(s.voiceM) || pick(MALE) || f;
}

export function hasItVoice() {
  return itVoices().length > 0;
}

let token = 0;

export function stop() {
  token++;
  if (synth) synth.cancel();
}

// Reproduce un texto. Devuelve una promesa que termina al acabar (o al cancelarse).
export function speak(text, { slow = false, kind = 'f', rate } = {}) {
  if (!supported || !voiceFor(kind)) return Promise.resolve(false);
  const my = ++token;
  synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(kind);
    if (v) u.voice = v;
    u.lang = 'it-IT';
    u.rate = rate || (slow ? get().settings.slowRate : 1);
    // Si solo hay una voz, se distingue al hombre con un tono más grave.
    if (kind === 'm' && v && v === voiceFor('f')) u.pitch = 0.7;
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      resolve(ok && my === token);
    };
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    // Algunos navegadores no avisan cuando terminan: límite de seguridad.
    const guard = setTimeout(() => finish(true), 1500 + text.length * 160 / u.rate);
    synth.speak(u);
  });
}

export const isCurrent = (t) => t === token;
export const currentToken = () => token;

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
