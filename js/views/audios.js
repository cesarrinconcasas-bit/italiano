// "Mis audios": material propio de apoyo (no se adivina su contenido).
import { h, btn, icon, confirmModal, toast, micErrorText, put, clear } from '../ui.js';
import * as speech from '../speech.js';
import * as rec from '../recorder.js';
import * as db from '../audiodb.js';

const urls = [];

export function cleanup() {
  urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
}

export function render(main) {
  const listEl = h('div', { class: 'audio-list' });
  const input = h('input', { type: 'file', accept: 'audio/*,.mp3,.m4a,.wav,.aac,.ogg', multiple: true, hidden: true, 'data-act': 'file-input' });
  input.addEventListener('change', async () => {
    const files = [...input.files];
    input.value = '';
    for (const f of files) {
      try {
        await db.add(f);
      } catch (e) {
        toast(`No se pudo guardar "${f.name}". ${e.message || ''}`);
      }
    }
    if (files.length) toast(files.length === 1 ? 'Audio agregado.' : `${files.length} audios agregados.`);
    refresh();
  });

  put(main, 
    h('h1', null, 'Mis audios'),
    h('p', { class: 'muted' }, 'Agrega audios en italiano que te den (clases, mensajes, grabaciones). Puedes escucharlos más lento, escribir lo que dicen y grabarte para comparar.'),
    btn('Agregar audio', () => input.click(), { cls: 'btn-primary btn-block', ic: 'upload', attrs: { 'data-act': 'add-audio' } }),
    input,
    h('details', { class: 'card' },
      h('summary', null, '¿Cómo obtener la transcripción gratis?'),
      h('p', null, 'La app no puede saber qué dice un audio por sí sola, y no lo inventa. Opciones gratuitas:'),
      h('ol', null,
        h('li', null, 'Pídele a Cesar que te pase el archivo a la computadora: se puede transcribir gratis y sin internet con Whisper (programa libre). Luego pega aquí el texto.'),
        h('li', null, 'En el iPhone, en la app Notas de voz, las versiones recientes de iOS muestran una transcripción (toca la grabación y busca el ícono de comillas). Copia y pega ese texto aquí. Revisa que esté bien: puede tener errores.'),
        h('li', null, 'Si alguien te dio el texto del audio (por ejemplo, tu maestra), pégalo tal cual.'),
      ),
    ),
    listEl,
  );

  async function refresh() {
    cleanup();
    let items = [];
    try {
      items = await db.list();
    } catch (e) {
      clear(listEl) && put(listEl, h('p', { class: 'muted' }, 'Este navegador no permite guardar audios (modo privado o almacenamiento bloqueado).'));
      return;
    }
    clear(listEl) && put(listEl, 
      items.length ? h('h2', null, `Tus audios (${items.length})`) : h('p', { class: 'muted center' }, 'Todavía no has agregado audios.'),
      ...items.map(itemView),
    );
  }

  function itemView(item) {
    const url = db.toURL(item);
    urls.push(url);
    const audio = h('audio', { src: url, controls: true, preload: 'metadata', class: 'native-audio' });
    if ('preservesPitch' in audio) audio.preservesPitch = true;
    const speeds = [1, 0.75, 0.5];
    const speedRow = h('div', { class: 'audio-row compact' },
      btn('Atrás 5 s', () => (audio.currentTime = Math.max(0, audio.currentTime - 5)), { cls: 'btn-audio', ic: 'back5', attrs: { 'data-act': 'back5' } }),
      ...speeds.map((sp) => {
        const b = btn(sp === 1 ? 'Normal' : `${sp}×`, () => {
          audio.playbackRate = sp;
          speedRow.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('active', Number(x.dataset.speed) === sp));
          audio.play();
        }, { cls: `btn-audio ${sp === 1 ? 'active' : ''}`, attrs: { 'data-speed': sp } });
        return b;
      }),
    );
    const transcript = h('textarea', { class: 'textarea', rows: 4, lang: 'it', placeholder: 'Pega aquí lo que dice el audio (en italiano).', 'data-act': 'transcript' });
    transcript.value = item.transcript || '';
    const notes = h('textarea', { class: 'textarea', rows: 2, placeholder: 'Notas o traducción (opcional).', 'data-act': 'notes' });
    notes.value = item.notes || '';
    const saveBtn = btn('Guardar texto', async () => {
      await db.patch(item.id, { transcript: transcript.value, notes: notes.value });
      item.transcript = transcript.value;
      toast('Guardado.');
      readBtn.hidden = !transcript.value.trim();
    }, { cls: 'btn-secondary', attrs: { 'data-act': 'save-text' } });
    const readBtn = btn('Leer el texto en voz alta', () => speech.speak(transcript.value, { slow: true }), { cls: 'btn-audio', ic: 'play', attrs: { hidden: !(item.transcript || '').trim() } });

    // Grabar mi voz para comparar con el audio
    const recKey = `audio:${item.id}`;
    const recStatus = h('p', { class: 'audio-status', 'aria-live': 'polite' });
    const mineBtn = btn('Mi voz', () => rec.play(recKey), { cls: 'btn-audio', ic: 'ear', attrs: { hidden: !rec.get(recKey) } });
    const recBtn = btn('Grabar mi voz', async () => {
      if (!rec.supported) return (recStatus.textContent = rec.unsupportedReason());
      if (rec.isRecording()) return rec.stop();
      audio.pause();
      recBtn.classList.add('recording');
      recBtn.querySelector('span:last-child').textContent = 'Detener';
      recStatus.textContent = 'Grabando… repite una parte del audio y toca "Detener".';
      try {
        const u = await rec.start(recKey);
        mineBtn.hidden = !u;
        recStatus.textContent = u ? 'Listo. Escucha el audio y luego tu voz.' : 'No se grabó sonido.';
      } catch (e) {
        recStatus.textContent = micErrorText(e);
      } finally {
        recBtn.classList.remove('recording');
        recBtn.querySelector('span:last-child').textContent = 'Grabar mi voz';
      }
    }, { cls: 'btn-rec', ic: 'mic' });

    const del = btn('Borrar', async () => {
      if (await confirmModal(`¿Borrar "${item.name}"? No se puede deshacer.`, 'Borrar')) {
        await db.remove(item.id);
        refresh();
      }
    }, { cls: 'btn-link danger', ic: 'trash', attrs: { 'data-act': 'delete-audio' } });

    return h('details', { class: 'card audio-item', 'data-audio': item.id },
      h('summary', null, icon('ear'), ' ', item.name, h('span', { class: 'muted small' }, ` · ${new Date(item.added).toLocaleDateString('es-US')}`)),
      audio,
      speedRow,
      h('div', { class: 'audio-row' }, recBtn, mineBtn),
      recStatus,
      h('label', { class: 'label' }, 'Transcripción', transcript),
      readBtn,
      h('label', { class: 'label' }, 'Notas', notes),
      h('div', { class: 'button-row' }, saveBtn, del),
    );
  }

  refresh();
}
