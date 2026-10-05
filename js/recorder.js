// Grabación de tu voz con el micrófono. Las grabaciones se quedan en el
// dispositivo (solo en memoria durante la sesión) y nunca se envían a ningún lado.

const MAX_SECONDS = 15;
let stream = null;
let recorder = null;
let stopTimer = null;
const recordings = new Map(); // clave (texto) → URL de la grabación

export const supported =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined';

export function unsupportedReason() {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'El micrófono solo funciona cuando la app se abre desde su enlace seguro (https).';
  }
  return 'Este navegador no permite grabar audio. En iPhone usa Safari con iOS 14.5 o más reciente.';
}

function pickMime() {
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
  return types.find((t) => window.MediaRecorder.isTypeSupported?.(t)) || '';
}

export function isRecording() {
  return !!recorder && recorder.state === 'recording';
}

// Empieza a grabar. Devuelve una promesa que se resuelve con la URL cuando termina.
export async function start(key) {
  if (!stream || !stream.active) {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  }
  const mime = pickMime();
  recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  recorder.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
  const finished = new Promise((resolve) => {
    recorder.onstop = () => {
      clearTimeout(stopTimer);
      const blob = new Blob(chunks, { type: recorder.mimeType || mime || 'audio/mp4' });
      const old = recordings.get(key);
      if (old) URL.revokeObjectURL(old);
      const url = URL.createObjectURL(blob);
      recordings.set(key, url);
      recorder = null;
      resolve(blob.size > 0 ? url : null);
    };
  });
  recorder.start();
  stopTimer = setTimeout(stop, MAX_SECONDS * 1000);
  return finished;
}

export function stop() {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

export function get(key) {
  return recordings.get(key) || null;
}

let player = null;
export function play(key) {
  const url = recordings.get(key);
  if (!url) return Promise.resolve(false);
  stopPlayback();
  player = new Audio(url);
  return new Promise((resolve) => {
    player.onended = () => resolve(true);
    player.onerror = () => resolve(false);
    player.play().catch(() => resolve(false));
  });
}

export function stopPlayback() {
  if (player) {
    player.pause();
    player = null;
  }
}

// Apaga el micrófono (se llama al salir de una pantalla).
export function release() {
  stop();
  stopPlayback();
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}
