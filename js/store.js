/* store.js
 * Voortgang en instellingen, lokaal bewaard op de telefoon (localStorage).
 * Slim herhalen met het Leitner-systeem:
 *   box 0 = nieuw of net fout, box 1..3 = steeds langer wachten voor de volgende keer.
 * De riem (voortgang) gaat nooit omlaag: we bewaren per woord de hoogste box die ze ooit haalde.
 */

const KEY = 'word-arena:v1';
export const INTERVALS = [0, 1, 3, 7];   // dagen wachten per box
export const MAX_BOX = INTERVALS.length - 1;

export const DEFAULTS = {
  direction: 'book',      // book | en-nl | nl-en | mixed
  roundSize: 10,          // aantal woorden per match
  autoSpeak: false,       // woorden automatisch voorlezen (standaard uit)
  bigText: false          // grotere letters
};

let data = load();

function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY));
    if (j && j.v === 1) return { v: 1, settings: { ...DEFAULTS, ...j.settings }, words: j.words || {} };
  } catch (e) { /* geen opslag beschikbaar: dan werkt de app zonder bewaren */ }
  return { v: 1, settings: { ...DEFAULTS }, words: {} };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* negeren */ }
}

/** Dagnummer in de tijdzone van de telefoon. */
export function today() {
  return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
}

/* ---------- instellingen ---------- */
export const settings = () => data.settings;
export function setSetting(k, v) { data.settings[k] = v; save(); }

/* ---------- per woord ---------- */
const blank = () => ({ box: 0, due: 0, seen: false, tries: 0, right: 0, wrong: 0, best: 0 });
export function rec(key) { return data.words[key] || blank(); }
function put(key, r) { data.words[key] = r; save(); }

/** Een woord is bekeken in "Leren". */
export function markSeen(key) {
  const r = rec(key);
  if (!r.seen) { r.seen = true; put(key, r); }
}

/** Een antwoord in "Kiezen". Geeft de nieuwe gegevens terug. */
export function recordAnswer(key, correct) {
  const r = rec(key), t = today();
  r.seen = true; r.tries++;
  if (correct) {
    r.right++;
    if (r.due <= t) {                       // alleen vooruit als het woord aan de beurt was
      r.box = Math.min(MAX_BOX, r.box + 1);
      r.due = t + INTERVALS[r.box];
    }
    r.best = Math.max(r.best, r.box);
  } else {
    r.wrong++;
    r.box = 0;
    r.due = t;                              // komt gauw terug
  }
  put(key, r);
  return r;
}

/* ---------- voortgang voor de riem ---------- */
/** 0..1: hoever de riem gevuld is voor deze woorden. */
export function beltProgress(words) {
  if (!words.length) return 0;
  const sum = words.reduce((a, w) => a + rec(w.key).best / MAX_BOX, 0);
  return sum / words.length;
}
export const knownCount = words => words.filter(w => rec(w.key).best >= MAX_BOX).length;
export const seenCount = words => words.filter(w => rec(w.key).seen).length;

export function resetProgress() { data.words = {}; save(); }

/* ---------- woorden kiezen voor een match ---------- */
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const byBox = (a, b) => a.r.box - b.r.box || a.r.due - b.r.due;

/**
 * Kiezen (oefenen): eerst woorden die fout gingen, dan woorden die aan de beurt zijn,
 * dan woorden die ze alleen bekeken heeft, dan nieuwe woorden, en tot slot de rest.
 */
export function pickQuiz(words, n) {
  const t = today();
  const all = words.map(w => ({ w, r: rec(w.key) }));
  const wrong = all.filter(x => x.r.tries > 0 && x.r.box === 0);
  const due = all.filter(x => x.r.box > 0 && x.r.due <= t).sort(byBox);
  const intro = all.filter(x => x.r.tries === 0 && x.r.seen);
  const fresh = all.filter(x => x.r.tries === 0 && !x.r.seen);
  const rest = all.filter(x => x.r.box > 0 && x.r.due > t).sort(byBox);
  const picked = [...shuffle(wrong), ...due, ...intro, ...fresh, ...shuffle(rest)].slice(0, n).map(x => x.w);
  return shuffle(picked);
}

/** Leren (kaartjes): eerst nieuwe woorden in de volgorde van het boek, dan woorden die fout gingen. */
export function pickLearn(words, n) {
  const all = words.map(w => ({ w, r: rec(w.key) }));
  const fresh = all.filter(x => !x.r.seen);
  const wrong = all.filter(x => x.r.seen && x.r.box === 0 && x.r.tries > 0);
  const rest = all.filter(x => x.r.seen && !(x.r.box === 0 && x.r.tries > 0)).sort(byBox);
  return [...fresh, ...wrong, ...rest].slice(0, n).map(x => x.w);
}
