import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../js/data/lessons.js';

// Formas sin acento o mal escritas que un hispanohablante suele producir.
const WRONG = [
  [/\bperche\b/i, 'perché'], [/\bpiu\b/i, 'più'], [/\bcitta\b/i, 'città'], [/\bcaffe\b/i, 'caffè'],
  [/\bpuo\b/i, 'può'], [/\bgia\b/i, 'già'], [/\bcosi\b/i, 'così'], [/\bpero\b/i, 'però'],
  [/\b(lunedi|martedi|mercoledi|giovedi|venerdi)\b/i, 'lunedì…venerdì'], [/\bsi,/i, 'sì,'],
  [/\be'/i, 'è'], [/\bqual'è\b/i, 'qual è'], [/\bun'(?=[bcdfghlmnpqrstvz])/i, 'un (masc.)'],
  [/\bquì\b|\bquà\b/i, 'qui / qua sin acento'], [/’/, "usar ' recto"],
  [/\bperfavore\b/i, 'per favore'], [/\bbuon giorno\b/i, 'buongiorno'], [/\bbuona sera\b/i, 'buonasera'],
];

function italianTexts(l) {
  const out = [l.titleIt];
  for (const it of [...l.vocab, ...l.phrases]) out.push(it.ita);
  for (const g of l.grammar.examples) out.push(g.ita);
  for (const f of l.falseFriends) out.push(f.ita);
  for (const ln of l.dialogue.lines) out.push(ln.ita);
  for (const ex of l.exercises) {
    if (ex.ita) out.push(ex.ita);
    if (ex.type === 'type') out.push(ex.answer);
    if (ex.type === 'pick' && ex.optionsLang === 'it') out.push(...ex.options);
  }
  return out.filter(Boolean);
}

test('ortografía italiana: sin acentos olvidados ni formas típicas erróneas', () => {
  const problems = [];
  for (const l of LESSONS) for (const t of italianTexts(l)) for (const [re, fix] of WRONG)
    if (re.test(t)) problems.push(`L${l.id}: "${t}" → ${fix}`);
  assert.deepEqual(problems, []);
});

test('nada de "en" heredado del inglés en los datos', () => {
  for (const l of LESSONS) assert.ok(!JSON.stringify(l).includes('"en":'), `L${l.id} usa "en"`);
});
