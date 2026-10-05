// Plan de 8 semanas de italiano para viajar: de cero a A1, con lo útil de A2 (MCER).
// 4 lecciones por semana; todas las semanas tienen sus lecciones disponibles.

export const DAILY_ROUTINE = [
  'Repaso del día (5 min): primero lo que más te cuesta.',
  'Lección nueva o parte de una lección (10–15 min).',
  'Conversación: di tu parte en voz alta, grábate y compara (2–3 min).',
];

export const WEEK_SCHEDULE = [
  { day: 'Lunes', task: 'Lección nueva' },
  { day: 'Martes', task: 'Lección nueva' },
  { day: 'Miércoles', task: 'Repaso + repetir la conversación de una lección' },
  { day: 'Jueves', task: 'Lección nueva' },
  { day: 'Viernes', task: 'Lección nueva' },
  { day: 'Sábado', task: 'Repaso + "Mis audios" o repetir diálogos' },
  { day: 'Domingo', task: 'Descanso o repaso corto (5 min)' },
];

export const PLAN = [
  {
    week: 1,
    level: 'Principiante → A1',
    title: 'Primeros pasos',
    canDo: [
      'Saludar, dar las gracias y despedirte con educación.',
      'Decir que no entiendes y pedir que te hablen más despacio.',
      'Pedir un café en un bar italiano.',
      'Presentarte: de dónde eres y a qué te dedicas.',
    ],
    lessons: [1],
  },
  {
    week: 2,
    level: 'Principiante → A1',
    title: 'Comer y pagar',
    canDo: [
      'Reservar mesa y pedir en un restaurante.',
      'Entender precios y pagar con tarjeta o en efectivo.',
      'Pedir helado y pizza como un italiano.',
    ],
    lessons: [],
  },
  {
    week: 3,
    level: 'A1',
    title: 'Moverse',
    canDo: [
      'Comprar boletos de tren y encontrar el andén.',
      'Decir y entender la hora y los horarios.',
      'Pedir y entender direcciones.',
      'Usar el autobús, el metro y el taxi.',
    ],
    lessons: [],
  },
  {
    week: 4,
    level: 'A1',
    title: 'Llegar y dormir',
    canDo: [
      'Pasar por el aeropuerto y reportar una maleta perdida.',
      'Registrarte en el hotel y resolver problemas de la habitación.',
      'Hablar del clima y elegir qué ropa llevar.',
    ],
    lessons: [],
  },
  {
    week: 5,
    level: 'A1',
    title: 'Comprar y hacer turismo',
    canDo: [
      'Comprar en el mercado por kilos y etti.',
      'Comprar ropa: tallas, colores y tax free.',
      'Visitar museos e iglesias respetando las reglas.',
      'Pedir que te tomen una foto.',
    ],
    lessons: [],
  },
  {
    week: 6,
    level: 'A1',
    title: 'Salud y problemas',
    canDo: [
      'Explicar en la farmacia o al médico qué te duele.',
      'Pedir ayuda en una emergencia y denunciar una pérdida o robo.',
      'Reclamar con educación un error en la cuenta.',
    ],
    lessons: [],
  },
  {
    week: 7,
    level: 'A1 → A2',
    title: 'Conversar',
    canDo: [
      'Hablar de tus gustos, tu familia y tu trabajo.',
      'Contar qué hiciste hoy (pasado con avere).',
      'Contar adónde fuiste (pasado con essere).',
    ],
    lessons: [],
  },
  {
    week: 8,
    level: 'A1 → A2',
    title: 'Independencia',
    canDo: [
      'Alquilar un auto y entender la ZTL y los peajes.',
      'Reservar por teléfono y deletrear tu nombre.',
      'Planear excursiones con el futuro básico.',
      'Despedirte y agradecer al final del viaje.',
    ],
    lessons: [],
  },
];
