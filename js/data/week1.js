// Semana 1 · Primeros pasos. Contenido original.
//
// Esquema de una lección (igual en todas las semanas):
//   vocab / phrases — { id, ita, es, say? }  (`say` = lo que se pronuncia si difiere de lo escrito)
//   grammar         — { title, explain: [...], examples: [{ ita, es }] }
//   falseFriends    — [{ ita, es, trap }]   (trap = la confusión típica de un hispanohablante)
//   dialogue        — { title, setting, people: { cesar: { name, voice: 'm' }, … }, lines: [{ who, ita, es }] }
//   exercises:
//     pick  — elegir una opción. `ita` puede tener ___ ; `audio` se reproduce; si `audioOnly`,
//             el texto no se muestra. `optionsLang` ('it' | 'es') = idioma de las opciones.
//     build — ordenar palabras para formar `ita`. `extra` son fichas que sobran.
//     type  — escribir de memoria la traducción de `es`. `alts` = respuestas también válidas.

export const WEEK1 = [
  {
    id: 1, week: 1, register: 'lei', minutes: 18,
    title: '¡Buenos días! Saludos y cortesía',
    titleIt: 'Buongiorno! Saluti e cortesia',
    goal: 'Saludar a cualquier hora, presentarte, dar las gracias, pedir disculpas y despedirte con educación.',
    vocab: [
      { id: 'buongiorno', ita: 'buongiorno', es: 'buenos días (hasta media tarde)' },
      { id: 'buonasera', ita: 'buonasera', es: 'buenas tardes / buenas noches (al llegar)' },
      { id: 'ciao', ita: 'ciao', es: 'hola / adiós (solo con amigos)' },
      { id: 'arrivederci', ita: 'arrivederci', es: 'adiós (formal)' },
      { id: 'per-favore', ita: 'per favore', es: 'por favor' },
      { id: 'grazie', ita: 'grazie', es: 'gracias' },
      { id: 'prego', ita: 'prego', es: 'de nada / adelante' },
      { id: 'scusi', ita: 'scusi', es: 'disculpe (a un desconocido)' },
      { id: 'si', ita: 'sì', es: 'sí' },
      { id: 'no', ita: 'no', es: 'no' },
    ],
    phrases: [
      { id: 'mi-chiamo', ita: 'Mi chiamo Cesar.', es: 'Me llamo Cesar.' },
      { id: 'come-si-chiama', ita: 'Come si chiama?', es: '¿Cómo se llama usted?' },
      { id: 'piacere', ita: 'Piacere!', es: '¡Mucho gusto!' },
      { id: 'come-sta', ita: 'Come sta?', es: '¿Cómo está usted?' },
      { id: 'bene-grazie', ita: 'Bene, grazie. E lei?', es: 'Bien, gracias. ¿Y usted?' },
      { id: 'grazie-mille', ita: 'Grazie mille!', es: '¡Muchas gracias!' },
      { id: 'buona-giornata', ita: 'Buona giornata!', es: '¡Que tenga un buen día!' },
    ],
    grammar: {
      title: '"Lei" para desconocidos, "tu" para amigos',
      explain: [
        'En Italia, a un desconocido (en el hotel, la tienda, el restaurante) se le habla de "lei", como nuestro "usted". Por eso se dice "Come sta?" y "Scusi".',
        'Con amigos o gente joven en ambiente informal se usa "tu": "Come stai?" y "Scusa". En esta app, en los lugares públicos siempre usamos "lei".',
        '"Sono" es "soy" y "è" (con acento) es "es / está": "Sono Cesar", "Lei è molto gentile". Sin acento, "e" significa "y".',
      ],
      examples: [
        { ita: 'Sono Cesar.', es: 'Soy Cesar.' },
        { ita: 'Come sta?', es: '¿Cómo está (usted)?' },
        { ita: 'Lei è molto gentile.', es: 'Usted es muy amable.' },
      ],
    },
    falseFriends: [
      { ita: 'prego', es: 'de nada / adelante / ¿dígame?', trap: 'No significa "ruego". Lo oirás todo el tiempo: al dar las gracias, al invitarte a pasar y cuando te van a atender.' },
      { ita: 'salire', es: 'subir', trap: 'Parece "salir", pero "salire" es subir. Salir es "uscire".' },
    ],
    dialogue: {
      title: 'Llegando al hotel',
      setting: 'Cesar entra a un pequeño hotel en Roma por la tarde.',
      people: { cesar: { name: 'Cesar', voice: 'm' }, giulia: { name: 'Giulia (recepción)', voice: 'f' } },
      lines: [
        { who: 'giulia', ita: 'Buonasera! Prego.', es: '¡Buenas tardes! Adelante.' },
        { who: 'cesar', ita: 'Buonasera. Mi chiamo Cesar Rincon.', es: 'Buenas tardes. Me llamo Cesar Rincon.' },
        { who: 'giulia', ita: 'Piacere, signor Rincon. Come sta?', es: 'Mucho gusto, señor Rincon. ¿Cómo está?' },
        { who: 'cesar', ita: 'Bene, grazie. E lei?', es: 'Bien, gracias. ¿Y usted?' },
        { who: 'giulia', ita: 'Molto bene, grazie. Ecco la chiave.', es: 'Muy bien, gracias. Aquí tiene la llave.' },
        { who: 'cesar', ita: 'Grazie mille! Lei è molto gentile.', es: '¡Muchas gracias! Usted es muy amable.' },
        { who: 'giulia', ita: 'Prego! Buona serata.', es: '¡De nada! Que tenga una buena noche.' },
        { who: 'cesar', ita: 'Grazie, arrivederci!', es: '¡Gracias, adiós!' },
      ],
    },
    exercises: [
      { type: 'pick', optionsLang: 'it', prompt: 'Son las 10 de la mañana. Entras a una tienda:', options: ['Buongiorno!', 'Buonasera!', 'Ciao!'], answer: 'Buongiorno!', why: '"Buongiorno" se usa en la mañana y hasta media tarde. "Ciao" es solo con amigos.' },
      { type: 'pick', optionsLang: 'it', prompt: 'Escucha. ¿Qué respondes?', audio: 'Come sta?', audioOnly: true, options: ['Bene, grazie. E lei?', 'Mi chiamo Cesar.', 'Arrivederci!'], answer: 'Bene, grazie. E lei?', why: 'Te preguntan "¿Cómo está?". Respondes "Bene, grazie. E lei?".' },
      { type: 'pick', optionsLang: 'it', prompt: 'Te dicen "Grazie!". ¿Qué respondes?', audio: 'Grazie!', options: ['Prego!', 'Scusi!', 'Piacere!'], answer: 'Prego!', why: '"Prego" = "De nada".' },
      { type: 'pick', optionsLang: 'es', prompt: '¿Qué significa "salire"?', options: ['subir', 'salir', 'saludar'], answer: 'subir', why: '"Salire" es subir. Salir se dice "uscire".' },
      { type: 'build', es: '¿Cómo se llama usted?', ita: 'Come si chiama?' },
      { type: 'build', es: 'Bien, gracias. ¿Y usted?', ita: 'Bene, grazie. E lei?', extra: ['tu'] },
      { type: 'type', es: 'gracias', answer: 'grazie' },
      { type: 'type', es: 'disculpe (a un desconocido)', answer: 'scusi' },
    ],
  },
];
