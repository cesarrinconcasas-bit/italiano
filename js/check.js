// Comparación tolerante de respuestas escritas en italiano: ignora mayúsculas, puntuación y
// apóstrofos (rectos o curvos). Si solo faltan acentos (perche, e'), es correcta con aviso.

export function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[.,!?¿¡";:()\-–—«»]/g, ' ')
    .replace(/'/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

// Devuelve { ok, exact }. ok=true y exact=false significa "correcto, pero revisa la ortografía".
export function checkTyped(given, answer, alts = []) {
  const g = normalize(given);
  if (!g) return { ok: false, exact: false };
  const targets = [answer, ...alts].map(normalize);
  if (targets.includes(g)) return { ok: true, exact: true };
  const gs = stripAccents(g);
  for (const t of targets) {
    if (stripAccents(t) === gs) return { ok: true, exact: false };
    const allowed = t.length >= 10 ? 2 : t.length >= 5 ? 1 : 0;
    if (allowed && levenshtein(gs, stripAccents(t)) <= allowed) return { ok: true, exact: false };
  }
  return { ok: false, exact: false };
}

// Para "ordenar palabras": divide la frase en fichas conservando la puntuación pegada.
export function tokenize(sentence) {
  return sentence.split(/\s+/).filter(Boolean);
}
