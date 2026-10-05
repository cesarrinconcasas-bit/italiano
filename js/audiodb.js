// "Mis audios": archivos de audio propios guardados en el dispositivo (IndexedDB).

const DB = 'italiano-cesar';
const STORE = 'audios';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    Promise.resolve(fn(store)).then((r) => (result = r));
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const reqP = (r) => new Promise((res, rej) => ((r.onsuccess = () => res(r.result)), (r.onerror = () => rej(r.error))));

export async function list() {
  const all = await tx('readonly', (s) => reqP(s.getAll()));
  return (all || []).sort((a, b) => b.added - a.added);
}

export async function getOne(id) {
  return tx('readonly', (s) => reqP(s.get(id)));
}

export async function add(file) {
  // Se guarda como ArrayBuffer: es lo más compatible con Safari.
  const data = await file.arrayBuffer();
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name || 'audio',
    type: file.type || 'audio/mpeg',
    size: file.size,
    data,
    added: Date.now(),
    transcript: '',
    notes: '',
  };
  await tx('readwrite', (s) => reqP(s.put(item)));
  return item;
}

export async function patch(id, changes) {
  const item = await getOne(id);
  if (!item) return null;
  Object.assign(item, changes);
  await tx('readwrite', (s) => reqP(s.put(item)));
  return item;
}

export async function remove(id) {
  await tx('readwrite', (s) => reqP(s.delete(id)));
}

export function toURL(item) {
  return URL.createObjectURL(new Blob([item.data], { type: item.type }));
}
