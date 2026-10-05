# Italiano per Cesar

App gratuita para aprender italiano de viaje desde cero (español → italiano).
Funciona en iPhone y en computadora. No usa pagos, cuentas ni servicios externos.

Enlace: https://cesarrinconcasas-bit.github.io/italiano/

## Cómo abrirla

**En el iPhone**
1. Abre el enlace en **Safari**.
2. Toca **Compartir** (cuadrito con flecha) → **Agregar a pantalla de inicio** → **Agregar**.
3. Ábrela siempre desde el ícono "Italiano". La primera vez que grabes, toca **Permitir** para el micrófono.

**En la computadora:** abre el mismo enlace en Chrome, Safari o Edge.

**Voz italiana (importante):** la app habla con la voz italiana del dispositivo.
- iPhone: Ajustes › Accesibilidad › Contenido leído › Voces › Italiano → descarga Alice, Federica o Luca
  (mejor la versión "mejorada").
- Mac: Ajustes del Sistema › Accesibilidad › Contenido leído › Voz del sistema › Gestionar voces › Italiano.

Si no hay voz italiana, la app lo avisa en Inicio y los botones de audio no suenan (nunca lee el italiano
con una voz de otro idioma).

## Cómo usarla cada día (15–20 min)
1. **Repaso de hoy** (botón en Inicio): intenta decir la respuesta antes de verla y sé honesto con
   "No lo sabía / Más o menos / Lo sabía".
2. **Lección**: vocabulario → frases → gramática y falsos amigos → diálogo → ejercicios → conversación.
3. **Grábate** y toca **Comparar** para oír el modelo y tu voz.

## Qué hay
- 32 lecciones completas en 8 semanas: saludos, bar y restaurante, precios, tren, hotel, aeropuerto,
  compras, museos, farmacia, emergencias, conversar, pasado, auto, teléfono y planes.
- En cada lección, **falsos amigos** para hispanohablantes (por ejemplo, *burro* = mantequilla, *caldo* = caliente).
- Audio a velocidad normal y lenta, "Repetir ×3".
- Repetición espaciada: lo que fallas vuelve pronto; lo que sabes, en días cada vez más separados.
- Progreso, errores, palabras difíciles, metas pequeñas y racha de días.
- "Mis audios": sube audios propios, escúchalos lento, pega su transcripción y compárate.
- Copia de seguridad descargable (Más › Copia de seguridad).

## Limitaciones honestas
- La voz es la que trae el dispositivo; su calidad varía.
- La app **no califica la pronunciación**. Tú comparas tu grabación con el modelo.
- El micrófono solo funciona desde el enlace seguro (https) o `localhost`, no abriendo el archivo directamente.
- El progreso vive en cada dispositivo (iPhone y computadora no se sincronizan).

## Convivencia con "Inglés con Karla"
Las dos apps viven en el mismo dominio, pero no se cruzan: cada una tiene su propio progreso
(`italiano-cesar-v1`), sus audios (IndexedDB `italiano-cesar`), su copia de seguridad y sus cachés
(prefijo `italiano-cesar-`, y solo borra las suyas).

## Para desarrollo
- Probar la lógica y el contenido: `npm test` (Node 18+).
- Pruebas de punta a punta con el Chrome del sistema: `npm run e2e`.
- Servir localmente: `python3 -m http.server 8766` y abrir http://localhost:8766
- Al publicar cambios, sube `VERSION` en `sw.js` para que el iPhone reciba la versión nueva.
- Contenido: `js/data/week1.js` … `week8.js` (reunidos en `js/data/lessons.js`); plan: `js/data/plan.js`.
- Íconos: `python3 tools/make_icons.py` (Pillow).
