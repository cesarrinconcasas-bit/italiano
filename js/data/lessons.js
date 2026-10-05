// Todas las lecciones del curso, una semana por archivo.
import { WEEK1 } from './week1.js';
import { WEEK2 } from './week2.js';
import { WEEK3 } from './week3.js';
import { WEEK4 } from './week4.js';
import { WEEK5 } from './week5.js';

export const LESSONS = [...WEEK1, ...WEEK2, ...WEEK3, ...WEEK4, ...WEEK5].sort((a, b) => a.id - b.id);

export function getLesson(id) {
  return LESSONS.find((l) => l.id === Number(id)) || null;
}
