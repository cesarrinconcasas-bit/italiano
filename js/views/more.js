import { h, btn, icon, confirmModal, toast, put } from '../ui.js';
import * as speech from '../speech.js';
import * as rec from '../recorder.js';
import { get, update, exportJSON, importJSON, resetAll } from '../store.js';
import { todayStr } from '../srs.js';

export function renderMenu(main) {
  const link = (href, ic, title, sub, act) =>
    h('a', { class: 'menu-link', href, 'data-act': act }, icon(ic), h('span', null, h('strong', null, title), h('span', { class: 'muted small' }, sub)), icon('right'));
  put(main, 
    h('h1', null, 'Más'),
    link('#/audios', 'ear', 'Mis audios', 'Tus propios audios: escuchar lento, transcribir, comparar', 'menu-audios'),
    link('#/ajustes', 'more', 'Ajustes', 'Voz, velocidad lenta, tu nombre', 'menu-settings'),
    link('#/respaldo', 'download', 'Copia de seguridad', 'Guardar o recuperar tu progreso', 'menu-backup'),
    link('#/ayuda', 'info', 'Ayuda', 'Instalar en el iPhone, micrófono y limitaciones', 'menu-help'),
  );
}

export async function renderSettings(main) {
  const s = get();
  put(main, h('h1', null, 'Ajustes'));

  const name = h('input', { type: 'text', class: 'type-input', value: s.name, 'aria-label': 'Tu nombre', 'data-act': 'name' });
  name.addEventListener('change', () => update((st) => (st.name = name.value.trim() || 'Cesar')));
  put(main, h('section', { class: 'card' }, h('label', { class: 'label' }, 'Tu nombre', name)));

  const voiceCard = h('section', { class: 'card' }, h('h2', null, 'Voces en italiano'), h('p', { class: 'muted' }, 'Cargando voces…'));
  put(main, voiceCard);

  // Velocidad lenta
  const rate = h('input', { type: 'range', min: '0.4', max: '0.9', step: '0.05', value: String(s.settings.slowRate), class: 'range', 'aria-label': 'Velocidad lenta', 'data-act': 'slow-rate' });
  const rateLabel = h('span', { class: 'pill' }, `${Math.round(s.settings.slowRate * 100)}%`);
  rate.addEventListener('input', () => (rateLabel.textContent = `${Math.round(rate.value * 100)}%`));
  rate.addEventListener('change', () => update((st) => (st.settings.slowRate = Number(rate.value))));
  put(main, 
    h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, 'Velocidad del botón "Lento"'), rateLabel),
      rate,
      btn('Probar', () => speech.speak('Can you speak more slowly, please?', { slow: true }), { cls: 'btn-secondary', ic: 'play' }),
    ),
  );

  await speech.voicesReady();
  const voices = speech.itVoices();
  voiceCard.replaceChildren(h('h2', null, 'Voces en italiano'));
  if (!speech.supported) {
    put(voiceCard, h('p', { class: 'warn' }, 'Este navegador no puede leer texto en voz alta. Usa Safari en iPhone o Chrome/Safari/Edge en la computadora.'));
    return;
  }
  if (!voices.length) {
    put(voiceCard, h('p', { class: 'warn' }, 'No se encontró ninguna voz en italiano en este equipo, así que los botones de audio no sonarán. iPhone: Ajustes › Accesibilidad › Contenido leído › Voces › Italiano → descarga Alice, Federica o Luca (mejor la versión "mejorada"). Mac: Ajustes del Sistema › Accesibilidad › Contenido leído › Voz del sistema › Gestionar voces › Italiano.'));
    return;
  }
  const field = (label, key, kind, sample) => {
    const sel = h('select', { class: 'select', 'aria-label': label, 'data-act': `voice-${kind}` },
      h('option', { value: '' }, 'Automática'),
      voices.map((v) => h('option', { value: v.name, selected: get().settings[key] === v.name }, v.name)),
    );
    sel.addEventListener('change', () => update((st) => (st.settings[key] = sel.value)));
    return h('div', { class: 'voice-field' },
      h('label', { class: 'label' }, label, sel),
      btn('Probar', () => speech.speak(sample, { kind }), { cls: 'btn-secondary', ic: 'play' }),
    );
  };
  put(voiceCard, 
    field('Voz principal (narración y vocabulario)', 'voiceF', 'f', 'Buongiorno! Benvenuto in Italia.'),
    field('Otra voz de mujer', 'voiceF2', 'f2', 'Buonasera, ha una prenotazione?'),
    field('Voz de hombre (tu papel)', 'voiceM', 'm', 'Buongiorno, mi chiamo Cesar. Piacere!'),
    h('p', { class: 'muted small' }, `${voices.length} ${voices.length === 1 ? 'voz disponible' : 'voces disponibles'}. Consejo para iPhone: en Ajustes › Accesibilidad › Contenido leído › Voces › Italiano, descarga las versiones "mejoradas" o "premium": suenan mucho más naturales. Luego elígelas aquí.`),
  );
}

export function renderBackup(main) {
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, 'data-act': 'import-file' });
  file.addEventListener('change', async () => {
    const f = file.files[0];
    file.value = '';
    if (!f) return;
    try {
      const text = await f.text();
      if (!(await confirmModal('Esto reemplaza tu progreso actual con el de la copia. ¿Continuar?', 'Reemplazar'))) return;
      importJSON(text);
      toast('Progreso recuperado.');
    } catch (e) {
      toast(e.message || 'No se pudo leer el archivo.');
    }
  });
  put(main, 
    h('h1', null, 'Copia de seguridad'),
    h('div', { class: 'card' },
      h('p', null, 'Tu progreso se guarda solo en este dispositivo. Si borras los datos de Safari o cambias de teléfono, se pierde. Descarga una copia de vez en cuando (por ejemplo, cada semana).'),
      btn('Descargar copia', () => {
        const blob = new Blob([exportJSON()], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `italiano-cesar-respaldo-${todayStr()}.json` });
        document.body.append(a);
        a.click();
        setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 1000);
      }, { cls: 'btn-primary btn-block', ic: 'download', attrs: { 'data-act': 'export' } }),
      btn('Recuperar desde una copia', () => file.click(), { cls: 'btn-secondary btn-block', ic: 'upload', attrs: { 'data-act': 'import' } }),
      file,
      h('p', { class: 'muted small' }, 'Los audios de "Mis audios" no se incluyen en la copia (pueden ser muy grandes).'),
    ),
    h('div', { class: 'card' },
      h('h2', null, 'Empezar de cero'),
      h('p', { class: 'muted' }, 'Borra todo el progreso, las palabras y los errores de este dispositivo.'),
      btn('Borrar mi progreso', async () => {
        if (await confirmModal('¿Seguro que quieres borrar todo tu progreso? No se puede deshacer.', 'Borrar todo')) {
          resetAll();
          toast('Progreso borrado.');
          location.hash = '#/';
        }
      }, { cls: 'btn-link danger', ic: 'trash', attrs: { 'data-act': 'reset' } }),
    ),
  );
}

export function renderHelp(main) {
  const secure = window.isSecureContext;
  put(main, 
    h('h1', null, 'Ayuda'),
    h('section', { class: 'card' },
      h('h2', null, 'Instalar en el iPhone'),
      h('ol', null,
        h('li', null, 'Abre el enlace de la app en Safari.'),
        h('li', null, 'Toca el botón Compartir (el cuadrito con la flecha hacia arriba).'),
        h('li', null, 'Elige "Agregar a pantalla de inicio" y toca "Agregar".'),
        h('li', null, 'Desde ahora ábrela con el ícono. Así se ve en pantalla completa y tu progreso queda mejor protegido.'),
      ),
    ),
    h('section', { class: 'card' },
      h('h2', null, 'Audio y micrófono'),
      h('ul', null,
        h('li', null, 'La voz en italiano es la que trae tu teléfono o computadora. La calidad depende del equipo. En iPhone puedes descargar voces "mejoradas" (ver Ajustes de la app).'),
        h('li', null, 'Si no oyes nada en el iPhone: sube el volumen y revisa que el interruptor de silencio (a un lado del teléfono) no esté activado.'),
        h('li', null, 'Para grabar tu voz, el teléfono te pedirá permiso para el micrófono la primera vez. Toca "Permitir".'),
        h('li', null, 'Tus grabaciones no se envían a ningún lado y se borran al cerrar la app. Son solo para que te escuches y compares.'),
        h('li', null, 'La app no califica tu pronunciación: no hay una forma gratuita y confiable de hacerlo. Por eso tú comparas tu voz con el modelo.'),
        h('li', null, 'Funciona sin internet una vez abierta por primera vez. (En computadora, algunas voces de Chrome sí necesitan internet.)'),
      ),
      h('p', { class: secure ? 'ok-text' : 'warn' },
        secure ? 'Esta página se abrió de forma segura: el micrófono puede funcionar.' : 'Esta página no se abrió de forma segura (https): el micrófono no funcionará aquí.'),
      h('p', { class: rec.supported ? 'ok-text' : 'warn' }, rec.supported ? 'Este navegador permite grabar audio.' : 'Este navegador no permite grabar audio.'),
      h('p', { class: speech.supported ? 'ok-text' : 'warn' }, speech.supported ? 'Este navegador puede leer en voz alta.' : 'Este navegador no puede leer en voz alta.'),
    ),
    h('section', { class: 'card' },
      h('h2', null, 'Tu progreso'),
      h('ul', null,
        h('li', null, 'Se guarda en este dispositivo, no en internet. El iPhone y la computadora no comparten progreso.'),
        h('li', null, 'Safari puede borrar los datos de páginas que no se usan en 7 días. Si la agregas a la pantalla de inicio, eso no pasa. Aun así, descarga una copia de seguridad de vez en cuando.'),
      ),
    ),
    h('section', { class: 'card' },
      h('h2', null, 'Cómo aprende esta app'),
      h('ul', null,
        h('li', null, 'Repaso espaciado: lo que sabes vuelve en días cada vez más separados; lo que fallas vuelve pronto.'),
        h('li', null, 'Recordar sin mirar: tratar de acordarte antes de ver la respuesta fija mejor la memoria que solo leer.'),
        h('li', null, 'Escuchar y repetir en voz alta (imitar el audio) ayuda a entender y a hablar.'),
        h('li', null, 'Gramática breve con ejemplos útiles, y mucho uso en situaciones reales.'),
      ),
    ),
  );
}
