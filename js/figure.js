/* figure.js
 * Tekent de worstelaarsters, hun houdingen, gezichten, attributen en kleine scènes als SVG.
 * De gegevens (namen, kleuren, haar, kleding) komen uit data/characters.json.
 * Stijl: slanke, taps toelopende ledematen, schaduw en lichtvlakken (cel-shading), grote anime-ogen,
 * haar met glans en een arena met licht en publiek. Alles is zelf getekend; er zijn geen externe plaatjes
 * en geen logo's van echte organisaties.
 */

const OUT = '#16121f';        // rand van voorwerpen
const INK = '#26151f';        // rand van de figuren
const EMOJI_FONT = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';

let CHARS = {};
let _id = 0;
const uid = () => 'f' + (++_id);

export function setCharacters(c) { CHARS = c; }
export function getCharacters() { return CHARS; }

/* ---------- kleine hulpjes ---------- */
const r2 = n => Math.round(n * 100) / 100;
const lerp = (a, b, t) => a + (b - a) * t;
const along = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const shadeOf = c => mix(c, '#000000', 0.38);
const lightOf = c => mix(c, '#ffffff', 0.38);

const poly = (d, fill, sw = 1.5) =>
  `<path d="${d}" fill="${fill}" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const star = (cx, cy, R, ri) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : R;
    pts.push(`${r2(cx + r * Math.cos(a))},${r2(cy + r * Math.sin(a))}`);
  }
  return pts.join(' ');
};
function flowerHead(cx, cy, r, color, center = '#ffd84a') {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
    s += `<circle cx="${r2(cx + r * 0.62 * Math.cos(a))}" cy="${r2(cy + r * 0.62 * Math.sin(a))}" r="${r2(r * 0.52)}" fill="${color}" stroke="${OUT}" stroke-width="0.8"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${r2(r * 0.4)}" fill="${center}" stroke="${OUT}" stroke-width="0.8"/>`;
}

/* ---------- taps toelopende ledematen ---------- */
function widthAt(stops, t) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, w0] = stops[i], [t1, w1] = stops[i + 1];
    if (t <= t1) { const k = (t - t0) / (t1 - t0 || 1), s = k * k * (3 - 2 * k); return lerp(w0, w1, s); }
  }
  return stops[stops.length - 1][1];
}
/** Omtrek van een ledemaat (van a naar b) met wisselende dikte. flatStart/flatEnd = strakke rand (kleding), anders rond. */
function tube(pts, stops, o = {}) {
  const N = 14, [a, b] = pts, k = o.scale || 1;
  const dx0 = b[0] - a[0], dy0 = b[1] - a[1], len = Math.hypot(dx0, dy0) || 1;
  const nx = -dy0 / len, ny = dx0 / len;
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, px = a[0] + dx0 * t + (o.dx || 0), py = a[1] + dy0 * t + (o.dy || 0), w = widthAt(stops, t) * k / 2;
    L.push([px + nx * w, py + ny * w]);
    R.push([px - nx * w, py - ny * w]);
  }
  const P = p => `${r2(p[0])} ${r2(p[1])}`;
  const w1 = widthAt(stops, 1) * k / 2, w0 = widthAt(stops, 0) * k / 2;
  const endCap = o.flatEnd ? `L${P(R[N])}` : `A${r2(w1)} ${r2(w1)} 0 0 0 ${P(R[N])}`;
  const startCap = o.flatStart ? 'Z' : `A${r2(w0)} ${r2(w0)} 0 0 0 ${P(L[0])} Z`;
  return `M${L.map(P).join(' L')} ${endCap} L${R.slice(0, N).reverse().map(P).join(' L')} ${startCap}`;
}
/** Een lichaamsdeel met rand, schaduwkant en lichtkant. */
function part(pts, stops, base, shade, light, o = {}) {
  return `<path d="${tube(pts, stops, o)}" fill="${shade}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${tube(pts, stops, { ...o, dx: -1.7, dy: -0.8, scale: 0.7 })}" fill="${base}"/>` +
    `<path d="${tube(pts, stops, { ...o, dx: -3.4, dy: -1.6, scale: 0.26 })}" fill="${light}" opacity=".5"/>`;
}
const cloth = (pts, stops, c, o = {}) => part(pts, stops, c, shadeOf(c), lightOf(c), o);
/** Een arm of been uit twee delen: één doorlopende omtrek, zonder gewrichtsbolletjes. */
function chain(segs, base, shade, light) {
  const T2 = (q, extra = {}) => tube(q.pts, q.stops, { ...(q.o || {}), ...extra });
  let s = '';
  for (const q of segs) s += `<path d="${T2(q)}" fill="${INK}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
  for (const q of segs) s += `<path d="${T2(q)}" fill="${shade}"/>`;
  for (const q of segs) s += `<path d="${T2(q, { dx: -1.7, dy: -0.8, scale: 0.7 })}" fill="${base}"/>`;
  for (const q of segs) s += `<path d="${T2(q, { dx: -3.4, dy: -1.6, scale: 0.26 })}" fill="${light}" opacity=".5"/>`;
  return s;
}

/* ---------- bouw en houdingen (eenheden van een vak van 240 x 400, daarna verkleind) ---------- */
const CX = 120;
const BUILDS = {
  //          schouder   romp: schouder/taille/heup   heup   dikte arm/been   schaal in de scène
  strong: { sx: 41, a: 44, w: 33, h: 37, hx: 17, aw: 1.5, lw: 1.3, scale: 0.97 },
  lean:   { sx: 29, a: 33, w: 24, h: 31, hx: 13, aw: 1.2, lw: 1.12, scale: 0.97 },
  medium: { sx: 32, a: 36, w: 27, h: 34, hx: 14, aw: 1.3, lw: 1.2, scale: 1 },
  tall:   { sx: 30, a: 34, w: 25, h: 32, hx: 13, aw: 1.17, lw: 1.1, scale: 1.07 }
};
const UPPER = 58, FORE = 54, THIGH = 86, CALF = 82;

/* arm: [naar buiten, omlaag] van de schouder naar de hand. legs: [hoek dijbeen, hoek onderbeen] (graden, naar buiten) */
/* tilt = kanteling van het bovenlijf in graden (negatief = linker schouder omlaag); legsL/legsR = het gewicht staat op het ene been */
const POSES = {
  stand:   { arm: [8, 108], legsL: [2, 2], legsR: [9, 6], tilt: -2.5 },
  hips:    { hips: true, legsL: [3, 2], legsR: [10, 6], tilt: -3 },
  flex:    { arm: [54, -52], legsL: [8, 6], legsR: [12, 8], tilt: -1.5 },
  victory: { arm: [26, -104], legsL: [3, 2], legsR: [9, 5], tilt: -2 },
  jump:    { arm: [36, -86], legs: [32, 18], dy: -24, tilt: 3 },
  wave:    { L: [34, -62], R: [8, 108], legsL: [2, 2], legsR: [9, 6], tilt: -2 },
  think:   { think: true, legsL: [3, 2], legsR: [8, 5], tilt: -2 },
  present: { L: [8, 108], R: [64, 18], legsL: [2, 2], legsR: [9, 6], tilt: -2 },
  hold:    { arm: [14, 52], legs: [6, 4] },
  barbell: { arm: [16, -100], legs: [9, 6] }
};

/** Berekent waar de elleboog zit als schouder en hand vastliggen. */
function ik(S, H, side) {
  let dx = H[0] - S[0], dy = H[1] - S[1], d = Math.hypot(dx, dy);
  const maxD = (UPPER + FORE) * 0.996;
  if (d > maxD) { H = [S[0] + dx * maxD / d, S[1] + dy * maxD / d]; dx = H[0] - S[0]; dy = H[1] - S[1]; d = maxD; }
  const a = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d), h = Math.sqrt(Math.max(0, UPPER * UPPER - a * a));
  const px = S[0] + a * dx / d, py = S[1] + a * dy / d, nx = -dy / d, ny = dx / d;
  const c1 = [px + h * nx, py + h * ny], c2 = [px - h * nx, py - h * ny];
  const score = c => side * (c[0] - S[0]) + 0.5 * (c[1] - S[1]);      // liefst naar buiten en omlaag
  return { S, E: score(c1) >= score(c2) ? c1 : c2, H };
}

function armsFor(pose, b) {
  const res = {};
  for (const side of [-1, 1]) {
    const S = [CX + side * b.sx, 100];
    if (pose.think) {
      res[side] = side === 1 ? { S, E: [S[0] + 16, S[1] + 36], H: [CX + 17, 84] }
                             : { S, E: [S[0] + 4, S[1] + 52], H: [CX + 34, 164] };
    } else if (pose.hips) {
      res[side] = ik(S, [CX + side * (b.hx + 12), 192], side);
    } else {
      const [out, down] = (side === -1 ? pose.L : pose.R) || pose.arm;
      res[side] = ik(S, [S[0] + side * out, S[1] + down], side);
    }
  }
  return res;
}
function legsFor(pose, b) {
  const rad = x => x * Math.PI / 180, res = {};
  for (const side of [-1, 1]) {
    const [t, c] = (side === -1 ? pose.legsL : pose.legsR) || pose.legs || [5, 4];
    const hip = [CX + side * b.hx, 204];
    const knee = [hip[0] + side * Math.sin(rad(t)) * THIGH, hip[1] + Math.cos(rad(t)) * THIGH];
    const ankle = [knee[0] + side * Math.sin(rad(c)) * CALF, knee[1] + Math.cos(rad(c)) * CALF];
    res[side] = { hip, knee, ankle };
  }
  return res;
}

/* ---------- ogen en gezichten ---------- */
function eyeSVG(cx, cy, outer, kind, g, lid) {
  const o = outer;
  const flick = `<path d="M${r2(cx + o * 7.2)} ${r2(cy - 3)} l${o * 2.8} -1.8" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`;
  if (kind === 'closed') {
    return `<path d="M${r2(cx - 6.8)} ${r2(cy + 1.8)} Q${cx} ${r2(cy - 6.6)} ${r2(cx + 6.8)} ${r2(cy + 1.8)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` + flick;
  }
  const wide = kind === 'wide';
  const rx = wide ? 7.6 : 6.5, ry = wide ? 8.6 : 7.2, ix = wide ? 4.6 : 5.1, iy = wide ? 5.8 : 6.5;
  const px = kind === 'up' ? 1.8 : 0, py = kind === 'up' ? -2.2 : kind === 'half' ? 1.4 : 0.6;
  const iyy = kind === 'up' ? 5.6 : iy;
  let s = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${INK}" stroke-width=".7"/>` +
    `<ellipse cx="${r2(cx + px)}" cy="${r2(cy + py)}" rx="${ix}" ry="${iyy}" fill="url(#${g}i)"/>` +
    `<ellipse cx="${r2(cx + px)}" cy="${r2(cy + py + 0.3)}" rx="${r2(ix * 0.47)}" ry="${r2(iyy * 0.54)}" fill="#150d1a"/>` +
    `<circle cx="${r2(cx + px - 1.9)}" cy="${r2(cy + py - 2.4)}" r="1.9" fill="#fff"/>` +
    `<circle cx="${r2(cx + px + 2.1)}" cy="${r2(cy + py + 2.7)}" r=".9" fill="#fff" opacity=".85"/>`;
  if (kind === 'half') {
    s += `<path d="M${r2(cx - rx - 0.3)} ${r2(cy - 0.6)} A${rx + 0.3} ${ry + 0.6} 0 0 1 ${r2(cx + rx + 0.3)} ${r2(cy - 0.6)} Z" fill="${lid}"/>` +
      `<path d="M${r2(cx - rx - 0.6)} ${r2(cy - 0.6)} L${r2(cx + rx + 0.6)} ${r2(cy - 0.6)}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  } else {
    s += `<path d="M${r2(cx - o * 7.4)} ${r2(cy - 1.2)} Q${r2(cx - o * 1)} ${r2(cy - (wide ? 11 : 9.8))} ${r2(cx + o * 7.6)} ${r2(cy - 3)}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  const crease = kind === 'half' ? '' : `<path d="M${r2(cx - 6)} ${r2(cy - 7.4)} Q${cx} ${r2(cy - 12.6)} ${r2(cx + 6)} ${r2(cy - 7.4)}" fill="none" stroke="rgba(90,40,40,.38)" stroke-width="1.1" stroke-linecap="round"/>`;
  return s + flick + crease +
    `<path d="M${r2(cx - 5)} ${r2(cy + ry - 0.8)} Q${cx} ${r2(cy + ry + 1.4)} ${r2(cx + 5)} ${r2(cy + ry - 0.8)}" fill="none" stroke="rgba(90,40,40,.45)" stroke-width="1"/>`;
}

function faceSVG(expr, o) {
  const { g, brow, lid, braces } = o;
  const kind = { proud: 'closed', surprised: 'wide', thinking: 'up', bored: 'half' }[expr] || 'open';
  let s = eyeSVG(110.5, 52, -1, kind, g, lid) + eyeSVG(129.5, 52, 1, kind, g, lid);
  const BR = {
    neutral:   ['M101 42 Q109 37 118 40.5', 'M122 40.5 Q131 37 139 42'],
    happy:     ['M101 41 Q109 34 118 38', 'M122 38 Q131 34 139 41'],
    proud:     ['M101 40 Q109 35 118 41', 'M122 41 Q131 35 139 40'],
    surprised: ['M101 38 Q109 31 118 35', 'M122 35 Q131 31 139 38'],
    thinking:  ['M101 39 Q109 33 118 37', 'M122 41 L139 38.5'],
    bored:     ['M101 43 L118 44.5', 'M122 44.5 L139 43']
  }[expr] || ['M101 42 Q109 37 118 40.5', 'M122 40.5 Q131 37 139 42'];
  s += BR.map(d => `<path d="${d}" fill="none" stroke="${brow}" stroke-width="2.2" stroke-linecap="round"/>`).join('');
  s += `<ellipse cx="120.4" cy="62.6" rx="3.2" ry="1.1" fill="#7a3a2a" opacity=".28"/>` +
    `<path d="M120 58.6 Q122.4 61.6 119.2 62.2" fill="none" stroke="rgba(120,60,40,.7)" stroke-width="1.3" stroke-linecap="round"/>`;
  const ms = `fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"`;
  if (expr === 'happy') {
    s += `<path d="M112.5 64.6 Q120 66.8 127.5 64.6 Q125.6 72.8 120 72.8 Q114.4 72.8 112.5 64.6 Z" fill="#7a1d33" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M114 65.4 Q120 67.4 126 65.4 Q120 69.2 114 65.4 Z" fill="#fff"/><ellipse cx="120" cy="70.8" rx="3" ry="1.5" fill="#e8707f"/>`;
    if (braces) {
      s += `<path d="M113 65.8 Q120 68.6 127 65.8" fill="none" stroke="#8a93a6" stroke-width="1.2"/>`;
      for (const x of [115, 117.8, 120.6, 123.4, 125.6]) s += `<circle cx="${x}" cy="${r2(66.8 + (x - 120) * (x - 120) * 0.012)}" r="1.1" fill="#d6dcea" stroke="#6a7386" stroke-width=".5"/>`;
    }
  } else if (expr === 'proud') {
    s += `<path d="M112 65 Q120 73.4 128 65" ${ms}/>`;
  } else if (expr === 'surprised') {
    s += `<ellipse cx="120" cy="68" rx="3.6" ry="4.8" fill="#5b1226" stroke="${INK}" stroke-width="1.4"/>`;
  } else if (expr === 'thinking') {
    s += `<path d="M113 69 Q118 65.4 127 67.2" ${ms}/>`;
  } else if (expr === 'bored') {
    s += `<path d="M114 68 L126 68" ${ms}/>`;
  } else {
    s += `<path d="M113 67 Q120 70 127 67" ${ms}/>`;
  }
  if (expr === 'happy' || expr === 'proud') {
    s += `<ellipse cx="104" cy="62" rx="5.2" ry="3.2" fill="#ff6f86" opacity=".24"/><ellipse cx="136" cy="62" rx="5.2" ry="3.2" fill="#ff6f86" opacity=".24"/>`;
  }
  return s;
}

/* ---------- haar ---------- */
const hairShine = (c, d) => `<path d="${d}" fill="none" stroke="${mix(c, '#ffffff', 0.6)}" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>`;
const hairPoly = (d, g, sw = 1.8) => `<path d="${d}" fill="url(#${g}h)" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;

const HAIR = {
  mohawk: {
    back: () => '',
    front: (g, c, a) => {
      let s = `<path d="M98 47 C93 24 106 14 120 14 C134 14 147 24 142 47 C139 38 132 33 120 33 C108 33 101 38 98 47 Z" fill="${c}" fill-opacity=".6" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
      s += `<path d="M107 34 L133 34 L131 18 L109 18 Z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
      for (const [x, tip] of [[104, 8], [112, -4], [120, -14], [128, -4], [136, 8]]) {
        s += `<path d="M${x - 7.5} 26 L${x} ${tip} L${x + 7.5} 26 Z" fill="${c}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
        const my = tip + (26 - tip) * 0.4, hw = 7.5 * 0.4;
        s += `<path d="M${r2(x - hw)} ${r2(my)} L${x} ${tip + 0.6} L${r2(x + hw)} ${r2(my)} Z" fill="${a}"/>`;
      }
      return s + `<path d="M110 30 L130 30" stroke="${mix(c, '#fff', 0.5)}" stroke-width="2.2" stroke-linecap="round" opacity=".4"/>`;
    }
  },
  ponytail: {
    back: (g, c, a) =>
      hairPoly('M136 30 C162 4 202 18 205 64 C208 106 192 142 166 176 C176 138 176 112 167 92 C161 76 150 64 138 60 Z', g, 1.8) +
      `<path d="M182 38 C196 66 192 104 176 140 M170 44 C184 64 182 96 170 126" fill="none" stroke="${mix(c, '#000', 0.4)}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>` +
      hairShine(c, 'M160 22 C184 22 198 42 198 62'),
    front: (g, c, a) =>
      hairPoly('M98 47 C93 22 110 11 125 13 C142 15 150 31 142 49 C140 41 134 34 126 32 C118 31 108 37 98 47 Z', g) +
      hairPoly('M112 32 C113 38 111 43 108 46 C115 43 120 38 122 32 Z', g, 1.4) +
      hairPoly('M101 38 C97 52 98 64 101 76 C105 66 106 54 106 42 Z', g, 1.5) +
      hairPoly('M139 40 C143 52 142 64 139 74 C135 64 134 52 134 42 Z', g, 1.5) +
      hairShine(c, 'M104 24 C112 15 126 14 136 22') +
      `<ellipse cx="139" cy="35" rx="3.8" ry="6.8" transform="rotate(-25 139 35)" fill="${a}" stroke="${INK}" stroke-width="1.3"/>`
  },
  straight: {
    back: (g, c) => hairPoly('M96 40 C91 14 106 8 120 8 C134 8 149 14 144 40 L153 152 C140 160 100 160 87 152 Z', g, 1.8),
    front: (g, c) =>
      hairPoly('M99 48 C93 22 108 12 120 12 C134 12 147 22 141 48 L141 43 C130 37 110 37 99 43 Z', g) +
      hairPoly('M99 36 L88 142 L103 144 L105 52 Z', g, 1.6) + hairPoly('M141 36 L152 142 L137 144 L135 52 Z', g, 1.6) +
      hairShine(c, 'M104 22 C112 15 128 15 136 22') +
      `<path d="M96 70 L92 130 M144 70 L148 130" fill="none" stroke="${mix(c, '#fff', 0.5)}" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>`
  },
  wavy: {
    back: (g, c) => hairPoly('M96 40 C90 14 106 8 120 8 C134 8 150 14 144 40 C154 62 146 80 150 100 C158 124 146 144 150 164 C156 184 146 198 138 206 L102 206 C94 198 84 184 90 164 C94 144 82 124 90 100 C94 80 86 62 96 40 Z', g, 1.8),
    front: (g, c, a) =>
      hairPoly('M98 47 C93 22 108 12 120 12 C134 12 147 22 142 47 C136 36 126 30 114 32 C106 34 101 40 98 47 Z', g) +
      hairPoly('M99 40 C88 62 100 80 92 104 C88 124 98 136 94 158 L106 158 C110 136 100 124 104 104 C110 80 98 62 106 44 Z', g, 1.6) +
      hairPoly('M141 40 C152 62 140 80 148 104 C152 124 142 136 146 158 L134 158 C130 136 140 124 136 104 C130 80 142 62 134 44 Z', g, 1.6) +
      hairShine(c, 'M104 22 C112 15 128 15 136 22') +
      `<path d="M94 104 C90 120 98 130 96 146 M146 104 C150 120 142 130 144 146" fill="none" stroke="${a}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`
  }
};

/* ---------- kleine attribuutjes ---------- */
export function beltSVG(w, variant = 'gold') {
  const h = w * 0.27, x0 = -w / 2, y0 = -h / 2;
  const fake = variant === 'fake';
  const strap = fake ? '#c9a06a' : '#2b1d18';
  let s = `<rect x="${r2(x0)}" y="${r2(y0)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(h * 0.2)}" fill="${strap}" stroke="${OUT}" stroke-width="1.6"/>`;
  s += `<path d="M${r2(x0 + 4)} ${r2(y0 + h * 0.2)} H${r2(-w * 0.26)} M${r2(w * 0.26)} ${r2(y0 + h * 0.2)} H${r2(-x0 - 4)} M${r2(x0 + 4)} ${r2(-y0 - h * 0.2)} H${r2(-w * 0.26)} M${r2(w * 0.26)} ${r2(-y0 - h * 0.2)} H${r2(-x0 - 4)}" stroke="${fake ? '#8d6a3c' : '#8a6b4a'}" stroke-width="1" stroke-dasharray="3 3" fill="none"/>`;
  const plate = fake ? ['#cfd4dc', '#eef1f6', '#8f97a6'] : ['#d79b12', '#f7d55a', '#b07a0c'];
  for (const sx of [-1, 1]) {
    s += `<rect x="${r2(sx * w * 0.33 - w * 0.06)}" y="${r2(-h * 0.33)}" width="${r2(w * 0.12)}" height="${r2(h * 0.66)}" rx="${r2(h * 0.1)}" fill="${plate[1]}" stroke="${OUT}" stroke-width="1.3"/>`;
  }
  s += `<ellipse cx="0" cy="0" rx="${r2(w * 0.19)}" ry="${r2(h * 0.74)}" fill="${plate[0]}" stroke="${OUT}" stroke-width="1.6"/>`;
  s += `<ellipse cx="0" cy="0" rx="${r2(w * 0.15)}" ry="${r2(h * 0.58)}" fill="${plate[1]}" stroke="${plate[2]}" stroke-width="1"/>`;
  s += `<polygon points="${star(0, 0, h * 0.42, h * 0.18)}" fill="${plate[2]}"/>`;
  if (fake) {
    s += `<path d="M${r2(-w * 0.2)} ${r2(-h * 0.5)} L${r2(w * 0.2)} ${r2(h * 0.5)}" stroke="#f6f3e6" stroke-opacity=".85" stroke-width="${r2(h * 0.28)}"/>`;
    s += `<path d="M${r2(-w * 0.12)} ${r2(h * 0.25)} l4 -5 l4 5 l4 -5" fill="none" stroke="#9a7a4a" stroke-width="1"/>`;
  }
  return s;
}

/** Een riem die zich vult (voor de voortgang). p = 0..1 */
export function progressBeltSVG(p, label = '') {
  const id = uid();
  const full = p >= 0.999;
  const x = 12, y = 30, w = 276, h = 34;
  const fillW = Math.max(0, Math.min(1, p)) * w;
  let s = `<svg viewBox="0 0 300 94" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/></clipPath></defs>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#2a2c4c" stroke="#8f93c4" stroke-width="2"/>`;
  s += `<g clip-path="url(#${id}c)"><rect x="${x}" y="${y}" width="${r2(fillW)}" height="${h}" fill="#c9951a"/>`;
  s += `<rect x="${x}" y="${y + 5}" width="${r2(fillW)}" height="4" fill="#f3cf5b" opacity=".6"/></g>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="none" stroke="${OUT}" stroke-width="2"/>`;
  s += `<path d="M${x + 12} ${y + 8} H122 M178 ${y + 8} H${x + w - 12} M${x + 12} ${y + h - 8} H122 M178 ${y + h - 8} H${x + w - 12}" stroke="#000" stroke-opacity=".28" stroke-width="1" stroke-dasharray="4 4"/>`;
  const pf = full ? ['#d79b12', '#f7d55a', '#b07a0c'] : ['#3a3d66', '#4a4e7e', '#8f93c4'];
  s += `<ellipse cx="150" cy="47" rx="38" ry="30" fill="${pf[0]}" stroke="${OUT}" stroke-width="2.5"/>`;
  s += `<ellipse cx="150" cy="47" rx="31" ry="24" fill="${pf[1]}" stroke="${pf[2]}" stroke-width="1.5"/>`;
  s += `<polygon points="${star(150, 47, 17, 7.5)}" fill="${pf[2]}"/>`;
  s += `</svg>`;
  return s;
}

function bouquet(h, k) {
  const flowers = [[-10, -36, '#ff77b4'], [0, -43, '#ffd84a'], [10, -35, '#ffffff']];
  let s = `<g transform="translate(${r2(h[0])} ${r2(h[1])}) scale(${k})">`;
  for (const [fx, fy] of flowers) s += `<path d="M0 -4 L${fx} ${fy}" stroke="#2f9a55" stroke-width="2" stroke-linecap="round"/>`;
  for (const [fx, fy, c] of flowers) s += flowerHead(fx, fy, 7, c);
  s += poly('M0 4 L-11 -22 Q0 -17 11 -22 Z', '#f3e9d2', 1.2);
  return s + '</g>';
}

/* ---------- de figuur zelf ---------- */
/**
 * Tekent één worstelaarster in een vak van 120 x 200 (voeten rond y = 190).
 * opties: pose, face, mods[], holds{item}, hairColor, hairAccent, skin, wearsBelt
 */
export function figureGroup(id, o = {}) {
  const ch = CHARS[id];
  if (!ch) return '';
  const g = uid();
  const b = BUILDS[ch.build] || BUILDS.medium;
  const mods = new Set(o.mods || []);
  const ex = ch.extras || {};
  let out = { ...ch.outfit };
  let glasses = ex.glasses, headband = ex.headband;
  if (mods.has('plain')) {
    out = { bottom: ch.outfit.bottom === 'tights' ? 'tights' : 'shorts', main: '#f3f3f8', second: '#a3a9bd', trim: '#d6d9e6', waist: '#d6d9e6',
            boots: '#6e7388', bootTrim: '#6e7388', bootTall: false, emblem: 'none' };
    headband = null;
  }
  if (mods.has('noGlasses')) glasses = null;

  let skin = o.skin || ch.skin;
  if (mods.has('tanned')) skin = mix(skin, '#6b3414', 0.42);
  const skinSh = mix(skin, '#7a3a2a', 0.3), skinHi = mix(skin, '#ffffff', 0.5);
  const hairC = o.hairColor || ch.hair.color;
  const hairA = o.hairAccent || o.hairColor || ch.hair.accent || hairC;
  const style = ch.hair.style;
  const hairEnd = style === 'ponytail' ? mix(hairC, '#ffd29a', 0.5) : style === 'wavy' ? mix(hairC, hairA, 0.7) : mix(hairC, '#ffffff', 0.28);
  const item = o.holds && o.holds.item;
  const poseName = item === 'belt' ? 'hold' : item === 'barbell' ? 'barbell' : (o.pose || 'stand');
  const pose = POSES[poseName] || POSES.stand;
  let face = o.face || 'neutral';
  if (mods.has('braces')) face = 'happy';
  const maskColor = ex.mask || null;
  const arms = armsFor(pose, b), legs = legsFor(pose, b);
  const aw = b.aw, lw = b.lw;
  const mainC = out.main, darkC = out.second;
  const darkMid = mix(darkC, '#ffffff', 0.1);

  const defs = `<defs>
    <linearGradient id="${g}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(hairC, '#000', 0.4)}"/><stop offset=".5" stop-color="${hairC}"/><stop offset="1" stop-color="${hairEnd}"/></linearGradient>
    <linearGradient id="${g}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lightOf(mainC)}"/><stop offset=".55" stop-color="${mainC}"/><stop offset="1" stop-color="${shadeOf(mainC)}"/></linearGradient>
    <linearGradient id="${g}k" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${skinHi}"/><stop offset=".45" stop-color="${skin}"/><stop offset="1" stop-color="${skinSh}"/></linearGradient>
    <linearGradient id="${g}i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(ch.eyes, '#000', 0.6)}"/><stop offset=".55" stop-color="${ch.eyes}"/><stop offset="1" stop-color="${mix(ch.eyes, '#fff', 0.5)}"/></linearGradient>
    ${ex.cape ? `<linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ex.cape.inner}"/><stop offset="1" stop-color="${ex.cape.color}"/></linearGradient>` : ''}
    <filter id="${g}r" x="-15%" y="-8%" width="130%" height="116%">
      <feOffset in="SourceAlpha" dx="-3.2" dy="0" result="oL"/><feComposite in="SourceAlpha" in2="oL" operator="out" result="edgeR"/>
      <feFlood flood-color="#8fb4ff" flood-opacity=".6" result="fR"/><feComposite in="fR" in2="edgeR" operator="in" result="rimR"/>
      <feOffset in="SourceAlpha" dx="3.2" dy="0" result="oR"/><feComposite in="SourceAlpha" in2="oR" operator="out" result="edgeL"/>
      <feFlood flood-color="#ff8ad8" flood-opacity=".4" result="fL"/><feComposite in="fL" in2="edgeL" operator="in" result="rimL"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="rimR"/><feMergeNode in="rimL"/></feMerge>
    </filter>
  </defs>`;
  // Het bovenlijf (romp, hoofd, armen) kantelt een klein beetje; benen en heupen blijven staan. Daarom bouwen we in lagen.
  let s = '';
  const parts = [];
  const tilt = pose.tilt || 0, rot = tilt ? `rotate(${tilt} ${CX} 170)` : '';
  const flush = turn => { parts.push(turn && rot ? `<g transform="${rot}">${s}</g>` : s); s = ''; };

  /* 1. cape en haar achter het lichaam */
  if (ex.cape) {
    const a = b.a;
    s += `<path d="M${CX - a + 4} 96 C${CX - a - 24} 180 ${CX - a - 36} 290 ${CX - a - 28} 346 Q${CX} 366 ${CX + a + 28} 346 C${CX + a + 36} 290 ${CX + a + 24} 180 ${CX + a - 4} 96 Z" fill="url(#${g}c)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<path d="M${CX - a + 14} 110 C${CX - a - 8} 190 ${CX - a - 10} 280 ${CX - a - 4} 336 M${CX + a - 14} 110 C${CX + a + 8} 190 ${CX + a + 10} 280 ${CX + a + 4} 336" fill="none" stroke="#000" stroke-width="3" opacity=".18"/>`;
  }
  // het hoofd is iets groter getekend, zodat je het gezicht ook op een klein scherm ziet (draaipunt = de kin)
  const HEAD = 'translate(120 76) scale(1.24) translate(-120 -76)';
  s += `<g transform="${HEAD}">${HAIR[style].back(g, hairC, hairA)}</g>`;
  flush(true);

  /* 2. benen, kniebeschermers en laarzen */
  const thighW = [[0, 36 * lw], [0.5, 29 * lw], [1, 22 * lw]], calfW = [[0, 21.5 * lw], [0.28, 23 * lw], [1, 11 * lw]];
  for (const side of [-1, 1]) {
    const { hip, knee, ankle } = legs[side];
    s += chain([{ pts: [hip, knee], stops: thighW }, { pts: [knee, ankle], stops: calfW }], skin, skinSh, skinHi);
    if (out.bottom === 'tights') {
      s += chain([{ pts: [hip, knee], stops: thighW.map(([t, w]) => [t, w + 2.4]) }, { pts: [knee, ankle], stops: calfW.map(([t, w]) => [t, w + 2.4]) }], darkC, shadeOf(darkC), lightOf(darkC));
    }
    if (out.pads === 'knee') {
      s += `<ellipse cx="${r2(knee[0])}" cy="${r2(knee[1])}" rx="${r2(14 * lw)}" ry="${r2(17 * lw)}" fill="${out.padColor}" stroke="${INK}" stroke-width="2"/>` +
        `<ellipse cx="${r2(knee[0] - 3)}" cy="${r2(knee[1] - 4)}" rx="${r2(6 * lw)}" ry="${r2(8 * lw)}" fill="#fff" opacity=".4"/>`;
    }
    // laars
    const tall = !!out.bootTall, fr = tall ? 0.36 : 0.72;
    const top = along(knee, ankle, fr);
    const bw = tall ? [[0, 24 * lw], [1, 15 * lw]] : [[0, 17 * lw], [1, 14.5 * lw]];
    s += cloth([top, ankle], bw, out.boots, { flatStart: true });
    s += cloth([top, along(top, ankle, tall ? 0.085 : 0.14)], [[0, bw[0][1] + 1.5], [1, bw[0][1] + 1.5]], out.bootTrim, { flatStart: true, flatEnd: true });
    const dx = ankle[0] - knee[0], dy = ankle[1] - knee[1], dl = Math.hypot(dx, dy), nx = -dy / dl, ny = dx / dl;
    const steps = tall ? 6 : 2, f0 = tall ? 0.24 : 0.3, f1 = tall ? 0.12 : 0.22;
    for (let i = 0; i < steps; i++) {
      const A = along(top, ankle, f0 + i * f1), B2 = along(top, ankle, f0 + (i + 1) * f1), hw = lerp(8, 5, f0 + i * f1) * lw;
      s += `<path d="M${r2(A[0] - nx * hw)} ${r2(A[1] - ny * hw)} L${r2(B2[0] + nx * hw)} ${r2(B2[1] + ny * hw)} M${r2(A[0] + nx * hw)} ${r2(A[1] + ny * hw)} L${r2(B2[0] - nx * hw)} ${r2(B2[1] - ny * hw)}" stroke="${out.bootTrim}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    const X = v => r2(ankle[0] + v * -side), fy = ankle[1];
    s += `<path d="M${X(8)} ${fy - 5} C${X(11)} ${fy + 4} ${X(10)} ${fy + 12} ${X(4)} ${fy + 17} L${X(-14)} ${fy + 17} C${X(-23)} ${fy + 15} ${X(-23)} ${fy + 6} ${X(-10)} ${fy - 5} Z" fill="${out.boots}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<path d="M${X(-23)} ${fy + 14} C${X(-23)} ${fy + 6} ${X(-17)} ${fy + 1} ${X(-10)} ${fy - 5}" fill="none" stroke="#fff" stroke-width="3" opacity=".18"/>`;
    s += `<path d="M${X(5)} ${fy + 17.5} L${X(-15)} ${fy + 17.5}" stroke="${shadeOf(out.boots)}" stroke-width="3.6" stroke-linecap="round"/>`;
  }

  flush(false);

  /* 3. romp */
  const { a, w, h } = b;
  const torso = `M${CX - a} 98 C${CX - a + 2} 88 ${CX - 18} 84 ${CX} 84 C${CX + 18} 84 ${CX + a - 2} 88 ${CX + a} 98 ` +
    `C${CX + a} 114 ${CX + w + 4} 124 ${CX + w + 2} 136 C${CX + w} 150 ${CX + w - 1} 160 ${CX + h - 4} 174 C${CX + h} 188 ${CX + h + 2} 198 ${CX + h - 1} 210 ` +
    `C${CX + h - 8} 218 ${CX - h + 8} 218 ${CX - h + 1} 210 C${CX - h - 2} 198 ${CX - h} 188 ${CX - h + 4} 174 C${CX - w + 1} 160 ${CX - w} 150 ${CX - w - 2} 136 ` +
    `C${CX - w - 4} 124 ${CX - a} 114 ${CX - a} 98 Z`;
  s += `<path d="${torso}" fill="url(#${g}k)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  s += part([[CX, 64], [CX, 96]], [[0, 15], [1, 19]], skin, skinSh, skinHi);
  s += `<path d="M110 76 Q120 86 130 76 Q120 92 110 76 Z" fill="${skinSh}" opacity=".4"/>`;
  flush(true);
  // broekband en heupen
  s += `<path d="M${CX - w - 3} 166 C${CX - 12} 172 ${CX + 12} 172 ${CX + w + 3} 166 C${CX + h + 1} 180 ${CX + h + 3} 194 ${CX + h} 206 C${CX + h - 8} 216 ${CX - h + 8} 216 ${CX - h} 206 C${CX - h - 3} 194 ${CX - h - 1} 180 ${CX - w - 3} 166 Z" fill="${darkMid}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<path d="M${CX - w - 3} 166 C${CX - 12} 172 ${CX + 12} 172 ${CX + w + 3} 166 L${CX + w + 4.5} 174 C${CX + 12} 180 ${CX - 12} 180 ${CX - w - 4.5} 174 Z" fill="${out.waist}" stroke="${INK}" stroke-width="1.4"/>`;
  // korte broek of sportbroekje: de pijpen komen over de heupen heen
  if (out.bottom !== 'tights') {
    const frac = out.bottom === 'shorts' ? 0.5 : 0.32;
    for (const side of [-1, 1]) {
      const { hip, knee } = legs[side];
      s += cloth([[hip[0], 196], along(hip, knee, frac)], [[0, 38 * lw], [1, 32 * lw]], darkMid, { flatEnd: true });
      if (out.bottom === 'shorts' || out.panels) {
        const e = along(hip, knee, frac * 0.9);
        s += `<path d="M${r2(hip[0] + side * 15 * lw)} 212 Q${r2((hip[0] + e[0]) / 2 + side * 16 * lw)} ${r2((212 + e[1]) / 2)} ${r2(e[0] + side * 14 * lw)} ${r2(e[1])}" fill="none" stroke="${out.panels ? mainC : mainC}" stroke-width="3" stroke-linecap="round"/>`;
      }
    }
  }
  flush(false);
  // top
  const topP =`M${CX - a + 2} 102 L${CX - a + 8} 92 C${CX - a + 16} 86 ${CX - 11} 88 ${CX - 8} 94 C${CX - 6} 108 ${CX + 6} 108 ${CX + 8} 94 C${CX + 11} 88 ${CX + a - 16} 86 ${CX + a - 8} 92 L${CX + a - 2} 102 ` +
    `C${CX + a + 1} 120 ${CX + w + 4} 130 ${CX + w + 2} 146 C${CX + w + 1} 156 ${CX + w + 1} 164 ${CX + w + 5} 174 C${CX + w - 10} 182 ${CX - w + 10} 182 ${CX - w - 5} 174 ` +
    `C${CX - w - 1} 164 ${CX - w - 1} 156 ${CX - w - 2} 146 C${CX - w - 4} 130 ${CX - a - 1} 120 ${CX - a + 2} 102 Z`;
  s += `<path d="${topP}" fill="url(#${g}t)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  if (out.panels) {
    s += `<path d="M${CX - a + 2} 102 L${CX - a + 10} 108 C${CX - w - 2} 134 ${CX - w - 2} 154 ${CX - w - 4} 176 L${CX - w - 5} 174 C${CX - w - 1} 164 ${CX - w - 1} 156 ${CX - w - 2} 146 C${CX - w - 4} 130 ${CX - a - 1} 120 ${CX - a + 2} 102 Z" fill="${darkC}"/>`;
    s += `<path d="M${CX + a - 2} 102 L${CX + a - 10} 108 C${CX + w + 2} 134 ${CX + w + 2} 154 ${CX + w + 4} 176 L${CX + w + 5} 174 C${CX + w + 1} 164 ${CX + w + 1} 156 ${CX + w + 2} 146 C${CX + w + 4} 130 ${CX + a + 1} 120 ${CX + a - 2} 102 Z" fill="${darkC}"/>`;
  }
  s += `<path d="M${CX + w - 2} 112 C${CX + w + 2} 130 ${CX + w - 2} 150 ${CX + w + 2} 172" fill="none" stroke="#000" stroke-width="5" opacity=".12"/>`;
  const em = out.emblemColor || out.trim;
  if (out.emblem === 'flower') s += flowerHead(CX, 130, 15, em, darkC);
  else if (out.emblem === 'bolt') s += `<polygon points="${CX + 6},112 ${CX - 9},134 ${CX},134 ${CX - 6},152 ${CX + 11},128 ${CX + 2},128" fill="${em}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  else if (out.emblem === 'star') s += `<polygon points="${star(CX, 130, 17, 7.2)}" fill="${em}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  else if (out.emblem === 'leaf') s += `<path d="M${CX - 15} 144 C${CX - 19} 118 ${CX + 5} 108 ${CX + 21} 110 C${CX + 23} 136 ${CX + 6} 148 ${CX - 15} 144 Z M${CX - 15} 144 L${CX + 8} 121" fill="${em}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
  s += `<path d="M${CX - 16} 154 Q${CX - 8} 160 ${CX} 158 M${CX + 8} 160 Q${CX + 14} 164 ${CX + 18} 162" fill="none" stroke="${shadeOf(mainC)}" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>`;
  if (o.wearsBelt) s += `<g transform="translate(${CX} 170) scale(2)">${beltSVG(w + 9)}</g>`;

  /* 4. hoofd */
  s += `<g transform="${HEAD}">`;
  s += `<ellipse cx="99.5" cy="52" rx="3.4" ry="5.6" fill="${skin}" stroke="${INK}" stroke-width="1.5"/><ellipse cx="140.5" cy="52" rx="3.4" ry="5.6" fill="${skin}" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<path d="M100 44 C100 30 109 23 120 23 C131 23 140 30 140 44 C140 58 133 69 120 76 C107 69 100 58 100 44 Z" fill="url(#${g}k)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<path d="M101 44 C104 35 114 31 120 31 C128 31 137 35 139 44 C132 39 124 37 120 37 C112 37 106 39 101 44 Z" fill="${skinSh}" opacity=".4"/>`;
  if (maskColor) {
    s += `<path d="M99.5 43 Q120 34 140.5 43 Q143 63 127 63 Q122 62 120 58 Q118 62 113 63 Q97 63 99.5 43 Z" fill="${maskColor}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M102 46 Q120 39 138 46" fill="none" stroke="#fff" stroke-width="1.6" opacity=".35"/>`;
  }
  const browC = maskColor ? '#e4dcff' : mix(hairC, '#000', 0.3);
  s += faceSVG(face, { g, brow: browC, lid: maskColor || skin, braces: mods.has('braces') });
  if (glasses) {
    s += `<g fill="#fff" fill-opacity=".14" stroke="${glasses}" stroke-width="2.2"><circle cx="110.5" cy="52" r="10.5"/><circle cx="129.5" cy="52" r="10.5"/></g>`;
    s += `<path d="M120 50 Q120 47.6 120 50 M99 49 L94 47 M141 49 L146 47" fill="none" stroke="${glasses}" stroke-width="2" stroke-linecap="round"/>`;
    s += `<path d="M104 45 Q108 42 113 43" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`;
  }
  // kleine kenmerken
  if (mods.has('freckles')) {
    for (const [x, y] of [[104, 60], [108, 63], [112, 59.5], [128, 59.5], [132, 63], [136, 60], [107, 57], [133, 57]])
      s += `<circle cx="${x}" cy="${y}" r="1.4" fill="#9b5530" opacity=".85"/>`;
  }
  if (mods.has('birthmark')) s += `<path d="M126 60 q4 -3 8 .4 q2.2 4.4 -1.4 7 q-4.8 1.6 -7 -1.9 q-1.3 -2.5 .4 -5.5 Z" fill="#5c2f1a" opacity=".92"/>`;
  if (mods.has('scar')) {
    s += `<path d="M127 55 L134 70" stroke="#e7b3a1" stroke-width="2.8" stroke-linecap="round"/><path d="M125 58.4 l5 -2.6 M128 63.6 l5 -2.6 M131 68 l4.6 -2.4" stroke="#e7b3a1" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  if (mods.has('spot')) s += `<circle cx="124.5" cy="70" r="3.2" fill="#e0605a" stroke="#b2403f" stroke-width=".9"/><circle cx="123.6" cy="69" r="1" fill="#ffd1c9"/>`;

  s += HAIR[style].front(g, hairC, hairA);
  if (headband) {
    s += `<path d="M99 41 Q120 31 141 41" fill="none" stroke="${INK}" stroke-width="8.6" stroke-linecap="round"/><path d="M99 41 Q120 31 141 41" fill="none" stroke="${headband}" stroke-width="5.8" stroke-linecap="round"/>`;
  }
  s += `</g>`;

  /* 5. armen */
  const wristFr = [0.7, 0.94];
  for (const side of [-1, 1]) {
    const { S, E, H } = arms[side];
    const upW = [[0, 22 * aw], [0.4, 19.5 * aw], [1, 15 * aw]], foW = [[0, 15 * aw], [0.3, 16 * aw], [1, 10.5 * aw]];
    const long = out.sleeves === 'long';
    s += chain([{ pts: [S, E], stops: upW }, { pts: [E, H], stops: foW }], skin, skinSh, skinHi);
    if (long) {
      s += chain([{ pts: [S, E], stops: upW.map(([t, v]) => [t, v + 2.4]) }, { pts: [E, along(E, H, 0.9)], stops: foW.map(([t, v]) => [t, v + 2.4]) }], mainC, shadeOf(mainC), lightOf(mainC));
    }
    if (out.gloves) s += cloth([along(E, H, 0.42), along(E, H, 0.98)], [[0, 17 * aw], [1, 12 * aw]], out.gloves, { flatStart: true });
    if (out.wraps) s += cloth([along(E, H, wristFr[0]), along(E, H, wristFr[1])], [[0, 14.5 * aw], [1, 13 * aw]], out.wraps, { flatStart: true, flatEnd: true });
    if (mods.has('tattoo') && side === -1) {
      const m = along(S, E, 0.5);
      s += `<g transform="translate(${r2(m[0])} ${r2(m[1])}) scale(1.5)"><path d="M1.6 -6 L-3 0.6 L.4 0.6 L-1.6 6 L3.4 -1.2 L.6 -1.2 Z" fill="#2a2a44" stroke="#2a2a44" stroke-width=".6" stroke-linejoin="round" opacity=".9"/></g>`;
    }
  }
  /* voorwerpen tussen de handen */
  const HL = arms[-1].H, HR = arms[1].H;
  if (item === 'belt') {
    const mid = [(HL[0] + HR[0]) / 2, (HL[1] + HR[1]) / 2];
    s += `<g transform="translate(${r2(mid[0])} ${r2(mid[1])}) scale(2)">${beltSVG(Math.abs(HR[0] - HL[0]) / 2 + 11, o.holds.variant)}</g>`;
  } else if (item === 'barbell') {
    const y = HL[1] - 2, x1 = HL[0], x2 = HR[0];
    s += `<path d="M${r2(x1 - 60)} ${r2(y)} H${r2(x2 + 60)}" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M${r2(x1 - 60)} ${r2(y)} H${r2(x2 + 60)}" stroke="#b9bcc9" stroke-width="6" stroke-linecap="round"/>`;
    for (const [px, ww, hh] of [[x1 - 36, 16, 72], [x1 - 52, 12, 52], [x2 + 20, 16, 72], [x2 + 40, 12, 52]]) {
      s += `<rect x="${r2(px)}" y="${r2(y - hh / 2)}" width="${ww}" height="${hh}" rx="4" fill="#2a2838" stroke="${INK}" stroke-width="2.4"/><rect x="${r2(px + 3)}" y="${r2(y - hh / 2 + 6)}" width="3.2" height="${hh - 12}" fill="#fff" opacity=".22"/>`;
    }
  }
  for (const side of [-1, 1]) {
    const H = arms[side].H, hc = out.gloves || skin, hs = out.gloves ? shadeOf(out.gloves) : skinSh;
    const tx = r2(H[0] - side * 6.5 * aw), ty = r2(H[1] - 1);
    s += `<ellipse cx="${tx}" cy="${ty}" rx="${r2(3.4 * aw)}" ry="${r2(5.2 * aw)}" transform="rotate(${-side * 28} ${tx} ${ty})" fill="${hc}" stroke="${INK}" stroke-width="1.8"/>`;
    s += `<ellipse cx="${r2(H[0])}" cy="${r2(H[1] + 3)}" rx="${r2(8 * aw)}" ry="${r2(7.5 * aw)}" fill="${hc}" stroke="${INK}" stroke-width="2"/>`;
    s += `<path d="M${r2(H[0] - 4)} ${r2(H[1] + 1)} v6 M${r2(H[0])} ${r2(H[1] + 1)} v7 M${r2(H[0] + 4)} ${r2(H[1] + 1)} v6" stroke="${hs}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`;
  }
  if (item === 'flowers') s += bouquet(HR, 2.1);

  flush(true);
  const k = 0.49;
  return `<g transform="translate(60 0) scale(${k}) translate(-${CX} ${pose.dy || 0})"><g filter="url(#${g}r)">${defs}${parts.join('')}</g></g>`;
}

/* ---------- losse figuren (portretten) ---------- */
const VIEWS = {
  full: '-10 -20 140 218',
  half: '0 -16 120 128',
  bust: '20 -14 80 76'
};

export function portraitSVG(id, o = {}) {
  const view = o.view || 'full';
  const shadow = view === 'full' ? `<ellipse cx="60" cy="191" rx="${o.pose === 'jump' ? 22 : 34}" ry="4" fill="#000" opacity="${o.pose === 'jump' ? 0.18 : 0.3}"/>` : '';
  const label = (CHARS[id] && CHARS[id].name) || '';
  return `<svg viewBox="${VIEWS[view]}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">${shadow}${figureGroup(id, o)}</svg>`;
}

/* ---------- scènes ---------- */
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const BOKEH = [[20, 18, 9, '#4f7bff'], [95, 10, 7, '#ffffff'], [180, 8, 8, '#ff7ad9'], [262, 14, 7, '#ffffff'], [338, 20, 10, '#6fa0ff'], [48, 52, 6, '#ffd27a']];
function bokeh(id) {
  return BOKEH.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".6" filter="url(#${id}d)"/>`).join('');
}
const arenaDefs = id => `<defs>
  <linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080a24"/><stop offset=".55" stop-color="#1a1f5e"/><stop offset="1" stop-color="#2c2a6a"/></linearGradient>
  <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d93c4"/><stop offset="1" stop-color="#5d6396"/></linearGradient>
  <filter id="${id}c" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.8"/></filter>
  <filter id="${id}d" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>`;

/** De ring met licht, publiek, touwen en hoekpalen (360 x 220). */
function bgRing(id) {
  const R = rng(7);
  let s = arenaDefs(id) + `<rect width="360" height="220" fill="url(#${id}a)"/>`;
  for (const [x0, x1, x2, x3] of [[40, 70, -10, 110], [150, 180, 110, 230], [270, 300, 250, 350]])
    s += `<polygon points="${x0},0 ${x1},0 ${x3},150 ${x2},150" fill="url(#${id}b)" opacity=".4"/>`;
  s += bokeh(id);
  s += `<g filter="url(#${id}c)">`;
  for (let row = 0; row < 7; row++) {
    const y = 34 + row * 19, size = 4.6 + row * 1.1, step = size * 1.9;
    for (let i = -1; i < 360 / step + 1; i++) {
      const x = i * step + (row % 2) * size * 0.9 + (R() - 0.5) * 4, yy = y + (R() - 0.5) * 4;
      const hue = [225, 250, 275, 320, 20][Math.floor(R() * 5)], l = 14 + row * 3 + R() * 10;
      s += `<ellipse cx="${r2(x)}" cy="${r2(yy + size * 1.7)}" rx="${r2(size * 1.55)}" ry="${r2(size * 1.1)}" fill="hsl(${hue} 32% ${r2(l - 3)}%)"/>`;
      s += `<ellipse cx="${r2(x)}" cy="${r2(yy)}" rx="${r2(size)}" ry="${r2(size * 1.1)}" fill="hsl(${hue} 34% ${r2(l)}%)"/>`;
      if (R() < 0.06) s += `<circle cx="${r2(x + size)}" cy="${r2(yy - size * 0.2)}" r="1.6" fill="#ffe7b0" opacity=".9"/>`;
    }
  }
  s += `</g>`;
  for (const y of [98, 130, 162])
    s += `<path d="M10 ${y + 3} H350" stroke="#2a2e5c" stroke-width="7" stroke-linecap="round" opacity=".5"/>` +
      `<path d="M10 ${y} H350" stroke="#c9cde6" stroke-width="5.4" stroke-linecap="round"/>` +
      `<path d="M10 ${y - 1.6} H350" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".9"/>` +
      `<path d="M10 ${y + 2.2} H350" stroke="#7d83b0" stroke-width="1.4" stroke-linecap="round"/>`;
  s += `<rect x="4" y="84" width="14" height="116" rx="4" fill="#1b1d3a" stroke="#0a0b1c" stroke-width="1.5"/><rect x="342" y="84" width="14" height="116" rx="4" fill="#1b1d3a" stroke="#0a0b1c" stroke-width="1.5"/>`;
  s += `<rect x="0" y="199" width="360" height="21" fill="url(#${id}f)"/><path d="M0 199.5 H360" stroke="#d6d9f2" stroke-width="1.6" opacity=".8"/>`;
  return s;
}
function bgPlain(id) {
  return arenaDefs(id) + `<rect width="360" height="220" fill="url(#${id}a)"/>` +
    `<polygon points="150,0 210,0 270,220 90,220" fill="url(#${id}b)" opacity=".28"/>` + bokeh(id);
}

const T = (x, y, text, size, color = '#fff', extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-weight="700" ${extra}>${text}</text>`;

function propSVG(p) {
  switch (p.t) {
    case 'emoji':
      return `<text x="${p.x}" y="${p.y}" font-size="${p.s || 64}" text-anchor="middle" dominant-baseline="central" font-family='${EMOJI_FONT}'>${p.c}</text>`;
    case 'text':
      return T(p.x, p.y, p.c, p.s || 40, p.color || '#f5c542');
    case 'belt':
      return `<g transform="translate(${p.x} ${p.y}) rotate(${p.rot || 0})">${beltSVG(p.w || 140, p.v)}</g>`;
    case 'bubble': {
      const w = p.w || 100, h = p.h || 46, x0 = p.x - w / 2, y0 = p.y - h / 2;
      const tx = p.tx ?? p.x - 30, ty = p.ty ?? p.y + h / 2 + 18;
      return `<path d="M${r2(p.x - 12)} ${r2(y0 + h - 1)} L${tx} ${ty} L${r2(p.x + 12)} ${r2(y0 + h - 1)} Z" fill="#f4f1ff" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
        `<rect x="${r2(x0)}" y="${r2(y0)}" width="${w}" height="${h}" rx="16" fill="#f4f1ff" stroke="${OUT}" stroke-width="2"/>` +
        `<path d="M${r2(p.x - 11)} ${r2(y0 + h)} L${r2(p.x + 11)} ${r2(y0 + h)}" stroke="#f4f1ff" stroke-width="3"/>` +
        T(p.x, p.y + 1, p.c || '…', p.s || 30, '#241f3d');
    }
    case 'gauge': {
      const w = p.w || 130, h = 20, x0 = p.x - w / 2;
      let s = `<rect x="${x0}" y="${p.y - h / 2}" width="${w}" height="${h}" rx="10" fill="#22244a" stroke="#aeb3ec" stroke-width="2"/>`;
      s += `<rect x="${x0 + 2}" y="${p.y - h / 2 + 2}" width="${r2((w - 4) * p.p)}" height="${h - 4}" rx="8" fill="#f5c542"/>`;
      for (const f of [0.25, 0.5, 0.75]) s += `<path d="M${r2(x0 + w * f)} ${p.y - h / 2 - 5} v5" stroke="#aeb3ec" stroke-width="2"/>`;
      return s;
    }
    case 'harrow': {
      const c = p.color || '#f5c542', ah = p.ah || 11;
      return `<g stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">` +
        `<path d="M${p.x} ${p.y1} V${p.y2}"/><path d="M${p.x - ah * 0.65} ${p.y1 + ah} L${p.x} ${p.y1} L${p.x + ah * 0.65} ${p.y1 + ah}"/><path d="M${p.x - ah * 0.65} ${p.y2 - ah} L${p.x} ${p.y2} L${p.x + ah * 0.65} ${p.y2 - ah}"/>` +
        `<path d="M${p.x - 12} ${p.y1} H${p.x + 12} M${p.x - 12} ${p.y2} H${p.x + 12}"/></g>`;
    }
    case 'hline':
      return `<path d="M${p.x1} ${p.y} H${p.x2}" stroke="${p.color || '#f5c542'}" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round"/>`;
    case 'ticks': {
      let s = `<rect x="${p.x - 7}" y="${p.y1}" width="14" height="${p.y2 - p.y1}" rx="3" fill="#d9c28a" stroke="${OUT}" stroke-width="1.5"/>`;
      for (let y = p.y2 - 8, i = 0; y > p.y1 + 4; y -= 9, i++) s += `<path d="M${p.x - 7} ${y} h${i % 5 === 0 ? 10 : 6}" stroke="#4b3b1c" stroke-width="1.4"/>`;
      return s;
    }
    case 'book': {
      const w = p.w, h = p.h;
      let s = `<rect x="${p.x - w / 2}" y="${p.y - h}" width="${w}" height="${h}" rx="3" fill="${p.color}" stroke="${p.hl ? '#f5c542' : OUT}" stroke-width="${p.hl ? 3 : 1.6}"/>`;
      s += `<path d="M${p.x - w / 2 + 2} ${p.y - h + 9} h${w - 4} M${p.x - w / 2 + 2} ${p.y - 9} h${w - 4}" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
      return s;
    }
    case 'garlic': {
      const k = p.s || 1.4;
      return `<g transform="translate(${p.x} ${p.y}) scale(${k})">` +
        `<path d="M0 -40 Q4 -30 12 -22 Q40 -8 36 22 Q30 42 0 44 Q-30 42 -36 22 Q-40 -8 -12 -22 Q-4 -30 0 -40 Z" fill="#f6efe0" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M0 -24 Q-12 4 0 42 M-14 -14 Q-30 8 -20 36 M14 -14 Q30 8 20 36" fill="none" stroke="#c9b894" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M0 -40 Q-2 -48 3 -54 M-8 44 l-3 7 M0 44 v8 M8 44 l3 7" fill="none" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/></g>`;
    }
    case 'compass': {
      const r = p.r || 54, cx = p.x, cy = p.y;
      let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#252850" stroke="#aeb3ec" stroke-width="4"/>`;
      for (const [k, a] of Object.entries({ N: -90, E: 0, S: 90, W: 180 })) {
        const rad = a * Math.PI / 180, ux = Math.cos(rad), uy = Math.sin(rad), vx = -uy, vy = ux;
        const hi = p.dir === k, col = hi ? '#f5c542' : '#6c71b3';
        const tip = [cx + ux * r * 0.86, cy + uy * r * 0.86];
        const b0 = [cx + ux * r * 0.18 + vx * r * 0.17, cy + uy * r * 0.18 + vy * r * 0.17];
        const b1 = [cx + ux * r * 0.18 - vx * r * 0.17, cy + uy * r * 0.18 - vy * r * 0.17];
        s += `<polygon points="${r2(tip[0])},${r2(tip[1])} ${r2(b0[0])},${r2(b0[1])} ${r2(b1[0])},${r2(b1[1])}" fill="${col}" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>`;
        s += T(r2(cx + ux * (r + 16)), r2(cy + uy * (r + 16)), k, 20, hi ? '#f5c542' : '#b9bde9');
      }
      return s + `<circle cx="${cx}" cy="${cy}" r="5" fill="#f4f1ff" stroke="${OUT}" stroke-width="1.5"/>`;
    }
    case 'polygon':
      return `<polygon points="${p.pts}" fill="${p.fill || '#3b6b4f'}" stroke="${p.stroke || OUT}" stroke-width="${p.sw ?? 2}" stroke-linejoin="round"/>`;
    case 'path':
      return `<path d="${p.d}" fill="none" stroke="${p.stroke || '#d9c28a'}" stroke-width="${p.w || 8}" stroke-linecap="round" ${p.dash ? `stroke-dasharray="${p.dash}"` : ''}/>`;
    default: return '';
  }
}

const VIEW_SCALE = { full: null, half: 1.75, bust: 2.5 };
const VIEW_TOP = { half: 14, bust: 8 };       // waar de bovenkant van het hoofd op het scherm komt

/**
 * scene = { cast:[{who,pose,face,x,view,mods,flip,scale,hairColor,hairAccent,holds}], props:[...], bg }
 */
export function sceneSVG(scene) {
  const id = uid();
  const cast = scene.cast || [];
  const n = cast.length;
  let s = scene.bg === 'plain' ? bgPlain(id) : bgRing(id);
  cast.forEach((c, i) => {
    const ch = CHARS[c.who]; if (!ch) return;
    const b = BUILDS[ch.build] || BUILDS.medium;
    const view = c.view || 'full';
    const dx = n === 1 ? 180 : n === 2 ? (i ? 255 : 105) : n === 3 ? [70, 180, 290][i] : 60 + i * 80;
    const x = c.x ?? dx;
    let tf;
    if (view === 'full') {
      const base = n >= 4 ? 0.64 : n === 3 ? 0.76 : n === 2 ? 0.88 : 0.95;
      const sc = (c.scale ?? 1) * base * b.scale;
      const shadowRx = (c.pose === 'jump' ? 22 : 34) * sc;
      s += `<ellipse cx="${x}" cy="199" rx="${r2(shadowRx)}" ry="${r2(4 * sc)}" fill="#000" opacity=".3"/>`;
      tf = c.flip ? `translate(${x} 200) scale(${-sc} ${sc}) translate(-60 -192)` : `translate(${x} 200) scale(${sc}) translate(-60 -192)`;
    } else {
      const sc = (c.scale ?? 1) * VIEW_SCALE[view];
      const topY = ch.hair.style === 'mohawk' ? -11 : -2;               // bovenkant van het haar
      const ty = VIEW_TOP[view] - topY * sc;
      tf = c.flip ? `translate(${x} ${r2(ty)}) scale(${-sc} ${sc}) translate(-60 0)` : `translate(${x} ${r2(ty)}) scale(${sc}) translate(-60 0)`;
    }
    s += `<g transform="${tf}">${figureGroup(c.who, c)}</g>`;
  });
  (scene.props || []).forEach(p => { s += propSVG(p); });
  return `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
}

/** Plaatje voor een concreet woord: één emoji (of een paar) op een rustige achtergrond. */
export function iconSVG(emoji, size = 118) {
  const id = uid();
  return `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${bgPlain(id)}` +
    `<text x="180" y="116" font-size="${size}" text-anchor="middle" dominant-baseline="central" font-family='${EMOJI_FONT}'>${emoji}</text></svg>`;
}

/** Het plaatje bij een woord: een scène met de worstelaarsters, of een emoji-icoon. */
export function pictureSVG(word) {
  const p = word.picture || {};
  if (p.scene) return sceneSVG(p.scene);
  if (p.emoji) return iconSVG(p.emoji, p.size);
  return iconSVG('❔');
}
