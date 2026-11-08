/* app.js – de schermen van Word Arena.
 * Vaste indeling: kop bovenin, inhoud in het midden, grote knop(pen) onderin. Alles staat altijd op dezelfde plek.
 */
import { setCharacters, portraitSVG, sceneSVG, pictureSVG, progressBeltSVG } from './figure.js';
import * as store from './store.js';
import { speak, stopSpeaking, speechSupported } from './speech.js';

const $app = document.getElementById('app');

let CH = {};          // worstelaarsters
let LESSONS = [];     // [{id, number, title, subtitle, words:[...]}]
let WORDS = [];       // alle woorden, plat
let round = null;     // de match die nu bezig is
let lastMain = '#/';  // waar "Terug" uit de instellingen heen gaat
let askReset = false;

/* ---------- opstarten ---------- */
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ': ' + r.status);
  return r.json();
}

async function boot() {
  try {
    const [chars, files] = await Promise.all([getJSON('data/characters.json'), getJSON('data/units.json')]);
    CH = chars.characters;
    setCharacters(CH);
    for (const f of files) {
      const unit = await getJSON('data/' + f);
      for (const l of unit.lessons) {
        const words = l.words.map(w => ({ ...w, key: `${l.id}/${w.id}`, lessonId: l.id }));
        LESSONS.push({ ...l, unit: unit.id, words });
        WORDS.push(...words);
      }
    }
  } catch (e) {
    $app.innerHTML = `<p class="loading">De woordjes konden niet geladen worden.<br><small>${esc(String(e.message || e))}</small></p>`;
    return;
  }
  applySettings();
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline-modus niet beschikbaar */ });
  }
}

function applySettings() {
  document.documentElement.classList.toggle('big', !!store.settings().bigText);
}

/* ---------- tekst ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const names = s => s.replace(/\{(\w+)\}/g, (m, id) => (CH[id] ? CH[id].name : m));
const rich = s => esc(names(s)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const plain = s => names(s).replace(/\*\*/g, '');
const en = t => `<span lang="en">${esc(t)}</span>`;
const pct = p => Math.round(p * 100);

const speakBtn = (text, label = 'Luister') => !speechSupported ? '' :
  `<button type="button" class="speak" data-act="speak" data-text="${esc(plain(text))}" aria-label="${label}: ${esc(plain(text))}">` +
  `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/>` +
  `<path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;

/* ---------- scherm-opbouw ---------- */
function screen({ title, back, gear = true, body, foot = '' }) {
  $app.innerHTML =
    `<header class="top">` +
    (back ? `<a class="nav" href="${back.href}"><span aria-hidden="true">←</span> ${back.label}</a>` : `<span class="nav ghost">.</span>`) +
    `<h1 class="top-title">${title}</h1>` +
    (gear ? `<a class="nav right" href="#/settings" aria-label="Instellingen"><span aria-hidden="true">⚙&#xFE0E;</span></a>` : `<span class="nav ghost">.</span>`) +
    `</header><main class="main" id="main">${body}</main><footer class="foot">${foot}</footer>`;
  const m = document.getElementById('main'); if (m) m.scrollTop = 0;
  wireImages();
}

/* ---------- eigen plaatjes, met een tekening als reserve ---------- */
const fallbacks = new Map();
let fbN = 0;
/** Een <img>. Ontbreekt het bestand, dan komt er een tekening voor in de plaats (fbCls = klasse, fbHtml = functie die de tekening geeft). */
function photo(src, cls, alt, fbCls, fbHtml) {
  const k = 'fb' + (++fbN);
  fallbacks.set(k, { cls: fbCls, html: fbHtml });
  return `<img class="${cls}" src="${src}" alt="${esc(alt)}" data-fb="${k}" decoding="async">`;
}
function wireImages() {
  document.querySelectorAll('img[data-fb]').forEach(img => {
    const swap = () => {
      const fb = fallbacks.get(img.dataset.fb);
      if (!fb || !img.isConnected) return;
      const div = document.createElement('div');
      div.className = fb.cls;
      div.innerHTML = fb.html();
      img.replaceWith(div);
    };
    img.addEventListener('error', swap, { once: true });
    if (img.complete && img.naturalWidth === 0) swap();
  });
}
const LINEUP = { cast: [
  { who: 'dahlia', pose: 'flex', face: 'proud' },
  { who: 'vera', pose: 'wave', face: 'happy' },
  { who: 'ivy', pose: 'stand', face: 'happy' },
  { who: 'nova', pose: 'stand', face: 'proud' }
] };
/** Pasfoto van een worstelaarster, met een rand in haar eigen kleur. */
const pas = id => !CH[id] ? '' :
  `<span class="pas-wrap" style="--c:${CH[id].color}">${photo(`images/pas-${id}.webp`, 'pas', CH[id].name, 'fbpas', () => portraitSVG(id, { view: 'bust', face: 'happy' }))}</span>`;

function scopeInfo(scope) {
  if (scope === 'all') return { id: 'all', title: 'Alle lessen', words: WORDS, lesson: null };
  const l = LESSONS.find(x => x.id === scope);
  return l ? { id: l.id, title: `Les ${l.number} · ${l.title}`, words: l.words, lesson: l } : null;
}

const beltBlock = words => {
  const p = store.beltProgress(words);
  return `<div class="belt">${progressBeltSVG(p, `Riem: ${pct(p)}% gevuld`)}</div>`;
};
const knownText = words => `${store.knownCount(words)} van ${words.length} woorden gekend`;

/* ---------- routes ---------- */
function route() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  stopSpeaking();
  if (!['learn', 'quiz', 'result'].includes(name)) round = null;
  if (name !== 'settings') { lastMain = location.hash || '#/'; askReset = false; }
  switch (name) {
    case 'lessons': return lessonsScreen();
    case 'lesson': return lessonScreen(arg);
    case 'learn': return roundScreen('learn', arg);
    case 'quiz': return roundScreen('quiz', arg);
    case 'result': return resultScreen();
    case 'settings': return settingsScreen();
    case 'wrestlers': return wrestlersScreen();
    default: return openingScreen();
  }
}
const go = h => { if (location.hash === h) route(); else location.hash = h; };

/* ---------- opening: wat is de bedoeling? ---------- */
function openingScreen() {
  const s = store.settings();
  screen({
    title: 'Word Arena',
    body: `${photo('images/groep.webp', 'hero-photo', 'Dahlia, Iron Ivy, Vera en Nova in de arena', 'hero pic', () => sceneSVG(LINEUP))}
      <h2 class="welcome">Welkom in de arena</h2>
      <p class="lead2">Hier leer je Engelse woordjes. Je leert ze samen met vier worstelaarsters.</p>
      <a class="meet" href="#/wrestlers">Ontmoet de worstelaarsters →</a>

      <h2 class="section-title">Zo werkt het</h2>
      <ol class="steps">
        <li><strong>Kies een les.</strong> Je ziet de woorden uit je schoolboek: Unit 1, Study box.</li>
        <li><strong>Leren.</strong> Je bekijkt een woord met een plaatje. Tik op het luidsprekertje om het te horen.</li>
        <li><strong>Oefenmatch.</strong> Je oefent in een match. Bij elk woord kies je het goede antwoord uit 4 mogelijkheden.</li>
        <li><strong>Klaar na ${s.roundSize} woorden.</strong> Dan zie je hoeveel je goed had en hoe vol je riem is.</li>
      </ol>

      <h2 class="section-title">Goed om te weten</h2>
      <ul class="notes">
        <li>Er is geen tijd. Je hoeft niet te haasten.</li>
        <li>Een fout antwoord is niet erg. Je ziet dan het goede antwoord.</li>
        <li>Woorden die je fout had, komen later terug. Zo leer je ze.</li>
        <li>Je kunt altijd stoppen. Je voortgang blijft bewaard.</li>
        <li>Het geluid staat uit. Jij kiest wanneer je een woord hoort.</li>
      </ul>

      <h2 class="section-title">Je riem</h2>
      <div class="belt" aria-hidden="true">${progressBeltSVG(0.6, '')}</div>
      <p>Elk woord dat je goed kent, vult je riem een stukje. Is je riem vol? Dan heb je de les gewonnen. Je riem gaat nooit omlaag.</p>`,
    foot: `<div class="foot-row one"><a class="btn primary" href="#/lessons">Kies je les</a></div>`
  });
}

/* ---------- les kiezen ---------- */
function lessonsScreen() {
  const card = (href, pasHtml, title, sub, words) => `
    <li><a class="lesson-card" href="${href}">
      <div class="lc-row">${pasHtml}<div><div class="lc-title">${title}</div><div class="lc-sub">${sub}</div></div></div>
      ${beltBlock(words)}
      <div class="meta">${knownText(words)}</div>
    </a></li>`;
  const cards = LESSONS.map(l => card(`#/lesson/${l.id}`, pas(l.host), `Les ${l.number}`,
    `${esc(l.title)}${l.subtitle ? ' · ' + esc(l.subtitle) : ''}`, l.words)).join('');
  const groupPas = `<span class="pas-wrap">${photo('images/groep.webp', 'pas', 'Alle worstelaarsters', 'fbpas', () => sceneSVG(LINEUP))}</span>`;
  const all = LESSONS.length > 1 ? card('#/lesson/all', groupPas, 'Alles samen', 'Alle lessen door elkaar', WORDS) : '';
  screen({
    title: 'Kies je les', back: { href: '#/', label: 'Terug' },
    body: `<ul class="lessons">${cards}${all}</ul>`
  });
}

/* ---------- les-menu ---------- */
const DIRS = [['book', 'Zoals in het boek'], ['en-nl', 'Engels → Nederlands'], ['nl-en', 'Nederlands → Engels'], ['mixed', 'Door elkaar']];

function lessonScreen(scope) {
  const info = scopeInfo(scope);
  if (!info) return go('#/lessons');
  const w = info.words, s = store.settings();
  const face = id => pas(id);
  const sub = info.lesson ? `<h2 class="lesson-name">${esc(info.lesson.title)} <span>· ${esc(info.lesson.subtitle || '')}</span></h2>` : '';
  screen({
    title: info.lesson ? `Les ${info.lesson.number}` : 'Alle lessen', back: { href: '#/lessons', label: 'Terug' },
    body: `${sub}${beltBlock(w)}
      <p class="meta">${knownText(w)}. Riem ${pct(store.beltProgress(w))}% gevuld.</p>
      <a class="mode" href="#/learn/${scope}">${face('ivy')}<div><strong>Leren</strong><span>Bekijk de woorden met een plaatje en luister naar het woord.</span></div></a>
      <a class="mode" href="#/quiz/${scope}">${face('vera')}<div><strong>Oefenmatch</strong><span>Een match van ${s.roundSize} woorden. Kies steeds het goede antwoord uit 4. Fout? Dan zie je het juiste antwoord.</span></div></a>
      <h2 class="section-title">Welke kant op?</h2>
      <div class="chips" role="group" aria-label="Richting">
        ${DIRS.map(([v, t]) => `<button type="button" class="chip" data-act="dir" data-v="${v}" aria-pressed="${s.direction === v}">${t}</button>`).join('')}
      </div>`
  });
}

/* ---------- een match opbouwen ---------- */
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function dirFor(w) {
  const d = store.settings().direction;
  if (d === 'book') return w.dir || 'en-nl';
  if (d === 'mixed') return Math.random() < 0.5 ? 'en-nl' : 'nl-en';
  return d;
}

function makeQuestion(w, dir, pool) {
  const key = dir === 'en-nl' ? 'nl' : 'en';
  const answer = w[key];
  const isVerb = s => /^to /.test(s);
  const askKey = dir === 'en-nl' ? 'en' : 'nl';
  // geen woorden met dezelfde vraag (bijv. "pad" = trail én path), anders zijn er twee goede antwoorden
  const others = pool.filter(x => x.key !== w.key && x[key] !== answer && x[askKey] !== w[askKey]);
  const same = others.filter(x => isVerb(x.en) === isVerb(w.en));
  const order = [...shuffle(same), ...shuffle(others.filter(x => !same.includes(x)))];
  const used = new Set([answer]), wrong = [];
  for (const x of order) { if (wrong.length >= 3) break; if (!used.has(x[key])) { used.add(x[key]); wrong.push(x[key]); } }
  return { word: w, dir, answer, options: shuffle([answer, ...wrong]) };
}

function startRound(mode, scope) {
  const info = scopeInfo(scope);
  const n = Math.min(store.settings().roundSize, info.words.length);
  const picked = mode === 'learn' ? store.pickLearn(info.words, n) : store.pickQuiz(info.words, n);
  round = {
    mode, scope, info, i: 0, results: [], done: false,
    items: picked.map(w => mode === 'quiz' ? makeQuestion(w, dirFor(w), info.words) : { word: w, dir: dirFor(w) }),
    flipped: false, answered: null, showNl: false,
    beltBefore: store.beltProgress(info.words)
  };
}

function roundScreen(mode, scope) {
  if (!scopeInfo(scope)) return go('#/lessons');
  if (!round || round.mode !== mode || round.scope !== scope || round.done) startRound(mode, scope);
  if (!round.items.length) return go('#/lesson/' + scope);
  mode === 'learn' ? learnCard() : quizQuestion();
}

const progressBlock = () => `
  <div class="prog">
    <p class="prog-text" aria-live="polite">Woord ${round.i + 1} van ${round.items.length}</p>
    <div class="segs" aria-hidden="true">${round.items.map((_, k) => `<span class="seg ${k < round.i ? 'done' : k === round.i ? 'now' : ''}"></span>`).join('')}</div>
  </div>`;

const stopLink = () => ({ href: '#/lesson/' + round.scope, label: 'Stoppen' });

function maybeAutoSpeak(text) { if (store.settings().autoSpeak) speak(text); }

/* ---------- Leren (kaartjes) ---------- */
function learnCard() {
  const it = round.items[round.i], w = it.word, last = round.i === round.items.length - 1;
  const fromEn = it.dir === 'en-nl';
  const prompt = fromEn ? w.en : w.nl;
  let content;
  if (!round.flipped) {
    content = `<div class="word-block">
        <p class="small-label">${fromEn ? 'Engels' : 'Nederlands'}</p>
        <p class="big-word" ${fromEn ? 'lang="en"' : ''}>${esc(prompt)}${fromEn ? speakBtn(w.en) : ''}</p>
        <p class="hint">${fromEn ? 'Weet je wat dit betekent?' : 'Weet je hoe je dit in het Engels zegt?'} Tik op ‘Draai om’.</p>
      </div>`;
  } else {
    content = `<div class="word-block">
        <p class="small-label">Engels</p>
        <p class="big-word" lang="en">${esc(w.en)}${speakBtn(w.en)}</p>
        <p class="small-label">Nederlands</p>
        <p class="answer-word">${esc(w.nl)}</p>
      </div>
      <div class="sentence"><p class="s-en" lang="en">${rich(w.sentence)}${speakBtn(w.sentence)}</p>${w.sentenceNl ? `<p class="s-nl">${rich(w.sentenceNl)}</p>` : ''}</div>`;
  }
  screen({
    title: 'Leren', back: stopLink(), gear: false,
    body: `${progressBlock()}<div class="pic">${pictureSVG(w)}</div>${content}`,
    foot: `<div class="foot-row">
      <button type="button" class="btn" data-act="prev" ${round.i === 0 ? 'disabled' : ''}>‹ Vorige</button>
      <button type="button" class="btn primary" data-act="${round.flipped ? 'next' : 'flip'}">${round.flipped ? (last ? 'Klaar' : 'Volgende ›') : 'Draai om'}</button>
    </div>`
  });
  if (fromEn && !round.flipped) maybeAutoSpeak(w.en);
}

/* ---------- Oefenmatch (meerkeuze) ---------- */
function quizQuestion() {
  const q = round.items[round.i], w = q.word, fromEn = q.dir === 'en-nl';
  const prompt = fromEn ? w.en : w.nl;
  screen({
    title: 'Oefenmatch', back: stopLink(), gear: false,
    body: `${progressBlock()}<div class="pic">${pictureSVG(w)}</div>
      <div class="word-block">
        <p class="small-label">${fromEn ? 'Kies de Nederlandse betekenis.' : 'Kies het Engelse woord.'}</p>
        <p class="big-word" ${fromEn ? 'lang="en"' : ''}>${esc(prompt)}${fromEn ? speakBtn(w.en) : ''}</p>
      </div>
      <div class="options" role="group" aria-label="Antwoorden">
        ${q.options.map((o, k) => `<button type="button" class="opt" data-act="opt" data-i="${k}" ${fromEn ? '' : 'lang="en"'}><span>${esc(o)}</span></button>`).join('')}
      </div>
      <div id="feedback" aria-live="polite"></div>`,
    foot: `<div class="foot-row one"><button type="button" class="btn primary" id="nextBtn" data-act="next" disabled>Kies een antwoord</button></div>`
  });
  if (fromEn) maybeAutoSpeak(w.en);
}

function sentenceBlock(w, showNl) {
  return `<div class="sentence" id="sentence"><p class="s-en" lang="en">${rich(w.sentence)}${speakBtn(w.sentence)}</p>` +
    (w.sentenceNl ? (showNl ? `<p class="s-nl">${rich(w.sentenceNl)}</p>` : `<button type="button" class="link" data-act="toggle-nl">Toon in het Nederlands</button>`) : '') + `</div>`;
}

function answer(k) {
  if (round.answered !== null) return;
  const q = round.items[round.i], w = q.word;
  const chosen = q.options[k], ok = chosen === q.answer;
  round.answered = k;
  round.results.push({ word: w, ok });
  store.recordAnswer(w.key, ok);

  const buttons = [...document.querySelectorAll('.opt')];
  buttons.forEach((b, i) => {
    b.disabled = true;
    const isRight = q.options[i] === q.answer;
    if (isRight) { b.classList.add('ok'); b.insertAdjacentHTML('beforeend', '<span class="mark" aria-hidden="true">✓</span>'); }
    else if (i === k) b.classList.add('miss');
    else b.classList.add('dim');
  });
  const pair = `<span class="pair">${en(w.en)} = ${esc(w.nl)} ${speakBtn(w.en)}</span>`;
  document.getElementById('feedback').innerHTML =
    `<div class="fb ${ok ? 'ok' : 'miss'}">${ok ? 'Goed!' : 'Het juiste antwoord is:'}${pair}</div>${sentenceBlock(w, round.showNl)}`;
  const nb = document.getElementById('nextBtn');
  nb.disabled = false;
  nb.textContent = round.i === round.items.length - 1 ? 'Klaar' : 'Volgende ›';
  document.getElementById('feedback').scrollIntoView({ block: 'nearest' });
  if (q.dir === 'nl-en') maybeAutoSpeak(w.en);
}

function next() {
  const last = round.i === round.items.length - 1;
  if (round.mode === 'learn') {
    store.markSeen(round.items[round.i].word.key);
    round.results.push({ word: round.items[round.i].word, ok: true });
  }
  if (last) { round.done = true; return go('#/result'); }
  round.i++; round.flipped = false; round.answered = null; round.showNl = false;
  round.mode === 'learn' ? learnCard() : quizQuestion();
}

/* ---------- resultaat ---------- */
function resultScreen() {
  if (!round || !round.done) return go('#/lessons');
  const { mode, scope, info, results } = round;
  const words = info.words;
  const after = store.beltProgress(words);
  const total = mode === 'learn' ? round.items.length : results.length;
  const lessonBack = { href: '#/lesson/' + scope, label: 'Terug' };
  let figure, heading, sub, extra = '';

  if (mode === 'learn') {
    figure = portraitSVG('ivy', { pose: 'present', face: 'happy' });
    heading = 'Goed gedaan!';
    sub = `Je hebt ${total} woorden bekeken.`;
    extra = `<p class="meta" style="margin-top:.8rem">Wil je het nu oefenen? Dan kun je een oefenmatch doen.</p>`;
  } else {
    const good = results.filter(r => r.ok).length, miss = results.filter(r => !r.ok);
    const champion = round.beltBefore < 0.999 && after >= 0.999;
    if (good === total) {
      figure = portraitSVG('dahlia', { pose: 'victory', face: 'proud', wearsBelt: true });
      heading = 'Pinfall!';
      sub = 'Alles goed. Mooi gedaan.';
    } else {
      figure = portraitSVG('ivy', { pose: 'stand', face: 'happy' });
      heading = 'Match klaar';
      sub = `${good} van ${total} goed.`;
    }
    if (champion) sub = `Kampioen! Je hebt de riem van ${esc(info.title)} gewonnen.`;
    extra = `${beltBlock(words)}<p class="meta">Je riem is ${pct(after)}% gevuld.</p>`;
    if (miss.length) {
      extra += `<h3 class="section-title" style="text-align:left">Deze woorden komen straks terug:</h3><ul class="review">` +
        miss.map(r => `<li><span><span class="w" lang="en">${esc(r.word.en)}</span><br><span class="t">${esc(r.word.nl)}</span></span>${speakBtn(r.word.en)}</li>`).join('') + `</ul>`;
    }
  }
  const again = mode === 'learn'
    ? `<a class="btn primary" href="#/quiz/${scope}">Nu oefenen</a>`
    : `<button type="button" class="btn primary" data-act="again">Nog een match</button>`;
  screen({
    title: 'Klaar', back: lessonBack,
    body: `<div class="result"><div class="fig">${figure}</div><h2>${heading}</h2><p class="sub">${sub}</p>${extra}</div>`,
    foot: `<div class="foot-row"><a class="btn" href="#/lesson/${scope}">Naar de les</a>${again}</div>`
  });
}

/* ---------- instellingen ---------- */
function settingsScreen() {
  const s = store.settings();
  const sw = (key, title, help, on) => `<div class="set-row"><div><strong>${title}</strong><p>${help}</p></div>
    <button type="button" class="switch" role="switch" aria-checked="${on}" aria-label="${title}" data-act="toggle" data-k="${key}"></button></div>`;
  screen({
    title: 'Instellingen', back: { href: lastMain, label: 'Terug' }, gear: false,
    body: `
      ${sw('autoSpeak', 'Woorden zelf voorlezen', speechSupported ? 'Staat standaard uit. Je kunt altijd zelf op het luidsprekertje tikken.' : 'Voorlezen werkt niet op dit apparaat.', !!s.autoSpeak)}
      ${sw('bigText', 'Grotere letters', 'Maakt alle tekst iets groter.', !!s.bigText)}
      <h2 class="section-title">Woorden per match</h2>
      <div class="chips three" role="group" aria-label="Woorden per match">
        ${[5, 10, 15].map(n => `<button type="button" class="chip" data-act="round" data-v="${n}" aria-pressed="${s.roundSize === n}">${n}</button>`).join('')}
      </div>
      <h2 class="section-title">Voortgang</h2>
      ${askReset
        ? `<div class="confirm"><strong>Weet je het zeker?</strong><p>Alle voortgang en alle riemen worden gewist.</p>
            <div class="chips"><button type="button" class="btn" data-act="reset-no">Nee, bewaren</button><button type="button" class="btn" data-act="reset-yes">Ja, wissen</button></div></div>`
        : `<button type="button" class="btn" data-act="reset-ask">Voortgang wissen</button>`}
      <p class="note">Word Arena · versie 0.1. Alle worstelaarsters zijn verzonnen. Je voortgang blijft alleen op deze telefoon.</p>`
  });
}

/* ---------- de worstelaarsters ---------- */
function wrestlersScreen() {
  const show = {
    dahlia: { pose: 'present', face: 'happy', holds: { item: 'flowers' } },
    vera: { pose: 'jump', face: 'proud' },
    ivy: { pose: 'think', face: 'thinking' },
    nova: { pose: 'stand', face: 'proud' }
  };
  screen({
    title: 'Worstelaarsters', back: { href: '#/', label: 'Terug' },
    body: Object.entries(CH).map(([id, c]) => `
      <div class="wcard" data-id="${id}"><div class="fig">${portraitSVG(id, show[id] || {})}</div>
        <div><h2><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</h2><p class="t">${esc(c.title)}</p><p>${esc(c.blurb)}</p></div></div>`).join('')
  });
  // Eigen plaatjes (bijvoorbeeld gemaakt met een AI-tool): images/<naam>.webp, .png of .jpg.
  // Lukt het laden niet, dan blijft gewoon de tekening staan.
  document.querySelectorAll('.wcard').forEach(card => tryImage(card, card.dataset.id, ['webp', 'png', 'jpg']));
}

function tryImage(card, id, exts) {
  const [ext, ...rest] = exts;
  if (!ext) return;
  const img = new Image();
  img.alt = '';
  img.className = 'wimg';
  img.decoding = 'async';
  img.onload = () => {
    if (!card.isConnected) return;
    const fig = card.querySelector('.fig');
    fig.innerHTML = '';
    fig.appendChild(img);
    card.classList.add('big');
  };
  img.onerror = () => tryImage(card, id, rest);
  img.src = `images/${id}.${ext}`;
}

/* ---------- knoppen ---------- */
$app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act;
  switch (a) {
    case 'speak': speak(el.dataset.text); break;
    case 'flip': round.flipped = true; store.markSeen(round.items[round.i].word.key); learnCard(); break;
    case 'prev':
      if (round.i > 0) { round.i--; round.flipped = false; learnCard(); }
      break;
    case 'next': next(); break;
    case 'opt': answer(Number(el.dataset.i)); break;
    case 'toggle-nl': {
      round.showNl = true;
      const q = round.items[round.i];
      const old = document.getElementById('sentence');
      if (old) old.outerHTML = sentenceBlock(q.word, true);
      break;
    }
    case 'dir': store.setSetting('direction', el.dataset.v); lessonScreen(scopeFromHash()); break;
    case 'round': store.setSetting('roundSize', Number(el.dataset.v)); settingsScreen(); break;
    case 'toggle': store.setSetting(el.dataset.k, !store.settings()[el.dataset.k]); applySettings(); settingsScreen(); break;
    case 'reset-ask': askReset = true; settingsScreen(); break;
    case 'reset-no': askReset = false; settingsScreen(); break;
    case 'reset-yes': store.resetProgress(); askReset = false; settingsScreen(); break;
    case 'again': { const sc = round.scope; round = null; go('#/quiz/' + sc); break; }
  }
});
const scopeFromHash = () => location.hash.split('/')[2] || 'all';

boot();
