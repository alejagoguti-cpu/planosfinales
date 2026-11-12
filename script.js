const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const m2 = (n) => `${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;

/* ---------- menú ---------- */
const burger = $('[data-burger]');
const menu = $('[data-menu]');
function setMenu(open) {
  menu.hidden = !open;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  document.body.style.overflow = open ? 'hidden' : '';
}
burger.addEventListener('click', () => setMenu(menu.hidden));
$$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

// hamburguesa blanca sobre fotos y zonas oscuras, roja sobre fondos claros
const darkZones = $$('.hero, .slider, .levels, .foot');
const tintBurger = () => {
  const y = 40;
  const onDark = darkZones.some((z) => { const r = z.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
  burger.classList.toggle('on-dark', onDark);
};
addEventListener('scroll', tintBurger, { passive: true });
tintBurger();

/* ---------- carrusel con barras ---------- */
const slider = $('[data-slider]');
const slides = $$('figure', slider);
const bars = $('[data-bars]');
let cur = 0;
let timer;
slides.forEach((_, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-label', `Imagen ${i + 1}`);
  b.setAttribute('aria-selected', String(i === 0));
  b.addEventListener('click', () => { show(i); restart(); });
  bars.append(b);
});
function show(i) {
  cur = (i + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle('on', k === cur));
  $$('button', bars).forEach((b, k) => b.setAttribute('aria-selected', String(k === cur)));
}
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => show(cur + 1), 5000); }
restart();

/* ---------- plano vectorial del Piso 2 ---------- */
const NS = 'http://www.w3.org/2000/svg';
const pathOf = (loop) => `M${loop.map(([x, y]) => `${x} ${-y}`).join('L')}Z`;
const centroid = (loop) => {
  let a = 0, cx = 0, cy = 0;
  loop.forEach(([x0, y0], i) => {
    const [x1, y1] = loop[(i + 1) % loop.length];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  });
  return [cx / (3 * a), -cy / (3 * a)];
};

function drawPlan(svg, geo) {
  const xs = geo.walls.flatMap((w) => [w[0], w[2]]);
  const ys = geo.walls.flatMap((w) => [-w[1], -w[3]]);
  const m = 60;
  const x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m;
  svg.setAttribute('viewBox', `${x0} ${y0} ${Math.max(...xs) - x0 + m} ${Math.max(...ys) - y0 + m}`);
  let html = geo.slab.map((l) => `<path class="slab" d="${pathOf(l)}"/>`).join('');
  html += geo.corridor.map((l) => `<path class="circ" d="${pathOf(l)}"/>`).join('');
  html += geo.rooms.map((r) => `<g data-room="${r.n}"><path class="room" d="${pathOf(r.main)}"/>${r.bath.map((b) => `<path class="bath" d="${pathOf(b)}"/>`).join('')}</g>`).join('');
  html += geo.stairs.map(([a, b, c, d]) => `<rect class="stair" x="${a}" y="${-d}" width="${c - a}" height="${d - b}"/>`).join('');
  html += geo.walls.map(([a, b, c, d, t]) => `<line class="wall" x1="${a}" y1="${-b}" x2="${c}" y2="${-d}" stroke-width="${t}"/>`).join('');
  html += geo.columns.map(([a, b, c, d]) => `<rect class="col" x="${a}" y="${-d}" width="${c - a}" height="${d - b}"/>`).join('');
  html += geo.rooms.map((r) => { const [cx, cy] = centroid(r.main); return `<text class="num" data-num="${r.n}" x="${cx}" y="${cy}">${r.n}</text>`; }).join('');
  svg.innerHTML = html;
}
function highlight(svg, nums) {
  $$('[data-room]', svg).forEach((g) => $$('path', g).forEach((p) => p.classList.toggle('hl', nums.includes(g.dataset.room))));
  $$('[data-num]', svg).forEach((t) => t.classList.toggle('hl', nums.includes(t.dataset.num)));
}

/* ---------- datos ---------- */
const [rooms, geo] = await Promise.all([
  fetch('assets/habitaciones-p2.json').then((r) => r.json()),
  fetch('assets/p2-plano.json').then((r) => r.json()),
]);

$('[data-fig="rooms"]').textContent = rooms.length;
$('[data-fig="area"]').textContent = Math.round(rooms.reduce((a, r) => a + r.priv, 0));

/* ---------- tipologías: cifras + píldoras ---------- */
const typesPlan = $('[data-plan-types]');
drawPlan(typesPlan, geo);
const CATS = ['Suite Ejecutiva', 'Junior Suite', 'Habitación Doble'];
const pills = $('[data-pills]');
pills.innerHTML = CATS.map((c, i) => `<button type="button" data-cat="${c}" aria-pressed="${i === 0}">${c.replace('Habitación ', '')}</button>`).join('');
function showCat(cat) {
  const list = rooms.filter((r) => r.cat === cat);
  const areas = list.map((r) => r.priv);
  $('[data-t-min]').textContent = m2(Math.min(...areas));
  $('[data-t-max]').textContent = m2(Math.max(...areas));
  $('[data-t-cap]').textContent = `${list.length} ${list.length === 1 ? 'habitación' : 'habitaciones'} en el Piso 2: ${list.map((r) => r.n).join(', ')}`;
  $$('button', pills).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  highlight(typesPlan, list.map((r) => r.n));
}
pills.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showCat(b.dataset.cat); });
showCat(CATS[0]);

/* ---------- modelo 3D por pisos + lista de niveles y habitaciones ---------- */
const { Edificio3D } = await import('./assets/js/edificio3d.js');
const tbody = $('[data-levels]');
const total = rooms.reduce((a, r) => a + r.priv, 0);
const p2 = `<tr class="lvl" data-lvl="2" tabindex="0" aria-selected="false"><td>Piso 2</td><td>${m2(total)}</td><td>12 habitaciones</td><td>3 alas</td></tr>`;
const roomRows = rooms.map((r) => `<tr class="room" data-n="${r.n}" tabindex="0" aria-selected="false"><td>Hab. ${r.n}</td><td>${m2(r.priv)}</td><td>${r.tipo}</td><td>${r.ala}</td></tr>`).join('');
tbody.innerHTML = p2 + roomRows;

const pTitle = $('[data-p-title]'), pArea = $('[data-p-area]'), pSub = $('[data-p-sub]'), pEmpty = $('[data-p-empty]'), reset = $('[data-reset]');
const mark = (sel) => $$('tr', tbody).forEach((t) => t.setAttribute('aria-selected', String(t.matches(sel))));

const viewer = new Edificio3D($('[data-viewer]'), geo, {
  onPickFloor: () => openFloor(2), // solo el Piso 2 es parte del proyecto
  onPickRoom: (n) => openRoom(n),
});

function openFloor(f) {
  viewer.setFloor(f);
  reset.hidden = f == null;
  if (pEmpty) pEmpty.hidden = f == null || f === 2;
  if (f == null) {
    mark('none');
    pTitle.textContent = 'Edificio completo';
    pArea.textContent = 'Remodelación del Piso 2';
    pSub.textContent = 'Haz clic en el edificio o en el Piso 2 para abrirlo.';
    return;
  }
  mark(`[data-lvl="${f}"]`);
  pTitle.textContent = `Piso ${f}`;
  if (f === 2) {
    pArea.textContent = `${m2(total)} · 12 habitaciones`;
    pSub.textContent = 'Elige una habitación en la lista o haz clic sobre ella en el modelo.';
  } else {
    pArea.textContent = 'En modelado';
    pSub.textContent = '';
  }
}
function openRoom(n) {
  const r = rooms.find((x) => x.n === n);
  viewer.selectRoom(n);
  reset.hidden = false;
  if (pEmpty) pEmpty.hidden = true;
  mark(`[data-n="${n}"]`);
  pTitle.textContent = `Habitación ${r.n} · ${r.tipo}`;
  pArea.textContent = `${m2(r.priv)} privados · ${m2(r.cons)} construidos`;
  pSub.textContent = `${r.ubic}. ${r.camas}.`;
}
const choose = (tr) => (tr.dataset.n ? openRoom(tr.dataset.n) : openFloor(+tr.dataset.lvl));
tbody.addEventListener('click', (e) => { const tr = e.target.closest('tr'); if (tr) choose(tr); });
tbody.addEventListener('keydown', (e) => {
  const tr = e.target.closest('tr');
  if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(tr); }
});
reset.addEventListener('click', () => openFloor(null));
