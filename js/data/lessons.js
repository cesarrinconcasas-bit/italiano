// Todas las lecciones del curso, una semana por archivo.
import { WEEK1 } from './week1.js';
import { WEEK2 } from './week2.js';

export const LESSONS = [...WEEK1, ...WEEK2].sort((a, b) => a.id - b.id);

export function getLesson(id) {
  return LESSONS.find((l) => l.id === Number(id)) || null;
}
