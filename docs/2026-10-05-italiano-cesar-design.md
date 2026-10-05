# Italiano per Cesar: diseño (aprobado en conversación el 2026-10-05)

## Objetivo
App gratuita para que Cesar, hispanohablante adulto que parte de cero, aprenda **italiano práctico
para viajar a Italia**. El viaje será dentro de 3 a 6 meses. La meta es un A1 completo según el
MCER, más lo del A2 que sirve para viajar (pasado, futuro básico, resolver problemas).

Éxito = Cesar la usa a diario en su iPhone y en la computadora, 15–20 minutos, y el audio, la
grabación, los ejercicios y el progreso funcionan de verdad. **Las 32 lecciones de las 8 semanas
están completas y se pueden usar.** No hay botones de adorno ni calificaciones inventadas.

## Decisiones
- **Base:** se copia el motor de "Inglés con Karla" (`/Volumes/storage/app/ingles`, commit
  `f1302ad`) a `/Volumes/storage/app/italiano` y se adapta. **La app de Karla no se modifica.**
  No hay motor compartido entre las dos apps.
- **Tecnología:** igual que la app de inglés. Es una app web estática (HTML/CSS/JS con módulos
  ES), sin paso de compilación ni dependencias en ejecución. Usa PWA (manifest + service worker)
  y se publica en GitHub Pages, en un repositorio nuevo `italiano` de la cuenta
  `cesarrinconcasas-bit`. **Antes de crear el repositorio y publicar se pide confirmación a
  Cesar.**
- **Audio:** Web Speech API con las voces `it-IT` del dispositivo (en Apple: Alice, Federica y
  Luca; se prefieren las versiones "mejorada/premium"). Hay velocidad normal y lenta y
  "Repetir ×3". Si el dispositivo no tiene voz italiana, la app lo dice claramente y explica
  cómo descargarla; nunca lee el italiano con una voz de otro idioma.
- **Grabación, repaso espaciado (Leitner 0/1/2/4/8/16/32/64 días), "Mis audios", progreso,
  racha y copia de seguridad:** se mantienen igual que en la app de inglés. Las claves de
  almacenamiento son propias de esta app, para que no choquen con la de inglés si algún día se
  sirven desde el mismo dominio.
- **Comparar respuestas escritas:** ignora mayúsculas, signos de puntuación y espacios extra.
  Si a la respuesta solo le faltan acentos (`perche` en lugar de `perché`), se acepta y se
  muestra la forma correcta con un aviso suave. Los apóstrofos (`l'ora`, `un'auto`) se
  normalizan, para aceptar tanto `'` como `’`.
- **Interfaz:** en español, con trato de "tú" y en masculino ("sé honesto"). El protagonista de
  los diálogos es Cesar. El nombre de la app es "Italiano per Cesar" y en la pantalla de inicio
  aparece como "Italiano". Tiene paleta e ícono propios (verde, blanco y rojo sobrios, sin
  banderas como ícono principal).
- **Sin:** pagos, cuentas, APIs externas, audios ajenos ni cursos copiados. La app no califica
  la pronunciación: Cesar compara su grabación con el modelo.

## Contenido: 32 lecciones (4 por semana)
Cada lección trae: objetivo, vocabulario (8–12 elementos), frases con traducción, gramática
breve, **falsos amigos para hispanohablantes**, diálogo con dos voces, ejercicios (escuchar y
elegir, elegir la opción, ordenar palabras, escribir de memoria) y conversación guiada (Cesar
dice su parte, se graba y compara).

Se usa italiano estándar. En los lugares públicos se trata de *lei* y en la sección social de
*tu*. Cada lección indica cuál usa.

| Sem. | # | Lección | Gramática / foco |
|---|---|---|---|
| 1 Primeros pasos | 1 | Buongiorno! Saludos, cortesía, lei/tu | *essere* (sono, è) |
| | 2 | Non capisco: repetir, más despacio, números 0–20 | negación *non* |
| | 3 | Al bar: caffè, cornetto, banco/tavolo, scontrino | *un/una*, *vorrei* |
| | 4 | Piacere, sono Cesar: origen, profesión, de vacaciones | género de adjetivos |
| 2 Comer y pagar | 5 | Al ristorante (1): reservar, mesa, menú | *avere* |
| | 6 | Al ristorante (2): platos, agua, vino, alergias, conto, coperto | *prendo / per me* |
| | 7 | Numeri e prezzi: 20–1000, euros, tarjeta/efectivo | plural |
| | 8 | Gelato e pizza: sabores, cono/coppetta, al taglio, da asporto | *di* + sabor |
| 3 Moverse | 9 | In stazione: biglietto, andata e ritorno, binario, convalidare, ritardo | *a che ora…?* |
| | 10 | L'ora e gli orari: hora, días, horarios | *sono le… / è l'una* |
| | 11 | Indicazioni: dov'è, destra/sinistra, dritto, vicino/lontano | *c'è / ci sono* |
| | 12 | Bus, metro e taxi: fermata, tabacchi, taxi al aeropuerto | *andare* |
| 4 Llegar y dormir | 13 | In aeroporto: pasaporte, equipaje, maleta perdida | verbos *-are* |
| | 14 | In albergo (1): check-in, prenotazione, documento, colazione | posesivos |
| | 15 | In albergo (2): *non funziona*, wifi, check-out, dejar equipaje | *potrebbe…?* |
| | 16 | Il tempo e i vestiti: clima y ropa | *fa caldo*, verbos *-ere* |
| 5 Comprar y turismo | 17 | Al mercato: chilo, etto, assaggiare | *del/della* |
| | 18 | Nei negozi: tallas, colores, probador, tax free | *questo/quello* |
| | 19 | Al museo: entradas, ridotto, guía, fotos | *si può? / è vietato* |
| | 20 | In giro per la città: iglesias, vestimenta, pedir una foto | formas de cortesía |
| 6 Salud y problemas | 21 | In farmacia: dolores, alergias | *mi fa male / ho mal di* |
| | 22 | Emergenze: aiuto, polizia, ambulanza, ho perso il passaporto | introducción al *passato prossimo* |
| | 23 | Dal medico: el cuerpo, síntomas | *ho la febbre* |
| | 24 | Risolvere problemi: error en la cuenta, tarjeta rechazada, quejarse | *c'è un errore* |
| 7 Conversar | 25 | Fare amicizia: gustos | *mi piace / mi piacciono* |
| | 26 | Famiglia e lavoro: mia moglie Karla, agente di assicurazioni | posesivos con familia |
| | 27 | Com'è andata la giornata? | *passato prossimo* con *avere* |
| | 28 | Dove sei stato? | *passato prossimo* con *essere* |
| 8 Independencia | 29 | Noleggiare un'auto: gasolina, ZTL, autostrada, parcheggio | *dovere / potere* |
| | 30 | Al telefono: reservar, deletrear | alfabeto, *vorrei* + infinitivo |
| | 31 | Programmi: excursiones, domani, la settimana prossima | futuro básico |
| | 32 | L'ultimo giorno: despedirse, agradecer, aeropuerto de vuelta | repaso general |

El plan semanal (rutina diaria y calendario de la semana) se adapta del de inglés. Todas las
semanas tienen botones a sus lecciones; no quedan semanas "solo planeadas".

## Calidad del italiano
- Todo el contenido es original y está escrito para este curso.
- Validación automática (`node --test`): cada lección tiene todos sus campos; los IDs son únicos
  en todo el curso; cada ejercicio `pick` incluye su respuesta entre las opciones; cada `build`
  se puede formar con sus fichas; los diálogos solo usan personas declaradas; no hay texto
  italiano vacío.
- Revisión de ortografía con una lista de errores típicos de hispanohablantes (acentos de
  `è`/`e`, `perché`, `più`, `città`, `caffè`, apóstrofos `l'`/`un'`, dobles consonantes en el
  vocabulario de la lección) y una segunda lectura completa por lección antes de darla por
  terminada.
- La app no promete pronunciación perfecta: la calidad de la voz depende del dispositivo.

## Pruebas
- Lógica (`node --test`): repaso espaciado, comparación de respuestas (incluidos acentos y
  apóstrofos) y validación de datos de las 32 lecciones.
- E2E con el Chrome del sistema (los navegadores de Playwright no funcionan en macOS 13):
  navegación; abrir cada una de las 32 lecciones y completar sus ejercicios; grabar con
  micrófono simulado; que el progreso se mantenga al recargar; exportar e importar la copia de
  seguridad.
- Comprobación visual en el ancho de un iPhone (390 px) y en escritorio.

## Publicación
1. Repositorio local `/Volumes/storage/app/italiano` (rama `main`), con commits por etapa.
2. Al terminar y pasar las pruebas, se **pide confirmación** y se crea el repositorio
   `cesarrinconcasas-bit/italiano` en GitHub con Pages activado.
3. El README explica cómo instalarla en el iPhone (Safari → Compartir → Agregar a pantalla de
   inicio) y cómo descargar las voces italianas mejoradas.
