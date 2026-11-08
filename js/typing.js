/* typing.js
 * Logica voor de Typmatch: is wat ze typde goed, "bijna" goed of fout, en wat is er dan anders?
 * Alles hier is gewone functies zonder scherm, zodat het los te testen is.
 */

/** Maakt tekst vergelijkbaar: kleine letters, streepjes en leestekens weg, spaties netjes. */
export function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[-–—_]/g, ' ')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Alle manieren waarop het goede antwoord geschreven mag worden.
 * "to describe" mag ook "describe" zijn, "wavy (hair)" mag "wavy" of "wavy hair" zijn.
 */
export function forms(en) {
  const out = [];
  const add = f => { f = f.replace(/\s+/g, ' ').trim(); if (f && !out.includes(f)) out.push(f); };
  const withoutParen = en.replace(/\s*\([^)]*\)/g, '');      // "wavy"
  const withParen = en.replace(/[()]/g, '');                 // "wavy hair"
  for (const base of [en.includes('(') ? withoutParen : en, withParen]) {
    add(base);
    add(base.replace(/^(to|a|an)\s+/i, ''));                // zonder "to" of "a"
  }
  return out;
}

/** Aantal letters per woord, als hulpje onder het invoerveld: "5 letters" of "2 + 8 letters". */
export function letterHint(en) {
  const main = en.replace(/\s*\([^)]*\)/g, '').trim();
  const counts = main.split(/\s+/).map(w => w.replace(/[^a-z]/gi, '').length).filter(Boolean);
  return counts.join(' + ') + ' letters';
}

/** Afstand tussen twee teksten: elke ontbrekende, extra of andere letter telt 1, twee letters omwisselen ook 1. */
export function distance(a, b) {
  const n = a.length, m = b.length;
  const d = Array.from({ length: n + 1 }, (_, i) => [i, ...Array(m).fill(0)]);
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[n][m];
}

/** Hoeveel fout mag er nog "bijna" heten? Korte woorden: geen enkele ruimte. */
const allowed = len => (len <= 3 ? 0 : len <= 7 ? 1 : 2);

/**
 * Beoordeelt wat ze typte.
 * Geeft { result: 'exact' | 'near' | 'wrong', form, note } terug.
 *  - exact: goed
 *  - near: bijna (kleine typfout, of een hoofdletter vergeten). form is het goede woord, note legt uit wat er mis is.
 *  - wrong: fout
 */
export function judge(typed, en) {
  const t = norm(typed);
  let best = null;
  for (const form of forms(en)) {
    const nf = norm(form), d = distance(t, nf);
    if (!best || d < best.d) best = { form, nf, d };
  }
  if (best.d === 0) {
    // Woorden als "American" en "Italian" krijgen een hoofdletter.
    if (/[A-Z]/.test(best.form) && !/[A-Z]/.test(typed)) return { result: 'near', form: best.form, note: 'case' };
    return { result: 'exact', form: best.form };
  }
  if (t && best.d <= allowed(best.nf.replace(/ /g, '').length)) return { result: 'near', form: best.form, note: 'letters' };
  return { result: 'wrong', form: best.form };
}

/**
 * Laat zien wat er anders is: geeft twee stukjes tekst terug waarin de afwijkende letters gemarkeerd zijn.
 * Gebruikt de langste gemeenschappelijke reeks letters, zodat een vergeten letter maar één plekje markeert.
 */
export function diffMarks(typed, correct) {
  const a = typed.trim().replace(/\s+/g, ' '), b = correct;
  const A = a.toLowerCase(), B = b.toLowerCase();
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const okA = Array(n).fill(false), okB = Array(m).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { okA[i] = okB[j] = true; i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  const esc = c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c);
  const render = (s, ok) => {
    let out = '', open = false;
    for (let k = 0; k < s.length; k++) {
      const bad = !ok[k] && s[k] !== ' ';
      if (bad && !open) { out += '<mark>'; open = true; }
      if (!bad && open) { out += '</mark>'; open = false; }
      out += esc(s[k]);
    }
    return out + (open ? '</mark>' : '');
  };
  return { typedHtml: render(a, okA), correctHtml: render(b, okB) };
}
