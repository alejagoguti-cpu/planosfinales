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
const CATS = ['Suite Ejecutiva', 'Junior Suite', 'Habitación Doble', 'Habitación Sencilla King'];
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

/* ---------- pantalla dividida: niveles y habitaciones ---------- */
const levelsPlan = $('[data-plan-levels]');
drawPlan(levelsPlan, geo);
const tbody = $('[data-levels]');
const upper = [6, 5, 4, 3].map((f) => `<tr class="lvl muted" data-lvl="${f}" tabindex="0" aria-selected="false"><td>Piso ${f}</td><td>—</td><td>En modelado</td><td></td></tr>`).join('');
const total = rooms.reduce((a, r) => a + r.priv, 0);
const p2 = `<tr class="lvl" data-lvl="2" tabindex="0" aria-selected="false"><td>Piso 2</td><td>${m2(total)}</td><td>12 habitaciones</td><td>3 alas</td></tr>`;
const roomRows = rooms.map((r) => `<tr class="room" data-n="${r.n}" tabindex="0" aria-selected="false"><td>Hab. ${r.n}</td><td>${m2(r.priv)}</td><td>${r.tipo}</td><td>${r.ala}</td></tr>`).join('');
tbody.innerHTML = upper + p2 + roomRows;

function selectRow(tr) {
  $$('tr', tbody).forEach((t) => t.setAttribute('aria-selected', String(t === tr)));
  const empty = tr.dataset.lvl && tr.dataset.lvl !== '2';
  levelsPlan.hidden = empty;
  $('[data-p-empty]').hidden = !empty;
  if (empty) {
    $('[data-p-title]').textContent = `Piso ${tr.dataset.lvl}`;
    $('[data-p-area]').textContent = 'En modelado';
    $('[data-p-sub]').textContent = '';
    return;
  }
  if (tr.dataset.lvl === '2') {
    $('[data-p-title]').textContent = 'Piso 2';
    $('[data-p-area]').textContent = m2(total);
    $('[data-p-sub]').textContent = 'Ala Recta Norte, Ala Diagonal y Sector Suites Fondo.';
    highlight(levelsPlan, rooms.map((r) => r.n));
    return;
  }
  const r = rooms.find((x) => x.n === tr.dataset.n);
  $('[data-p-title]').textContent = `Habitación ${r.n} · ${r.tipo}`;
  $('[data-p-area]').textContent = `${m2(r.priv)} privados · ${m2(r.cons)} construidos`;
  $('[data-p-sub]').textContent = `${r.ubic}. ${r.camas}.`;
  highlight(levelsPlan, [r.n]);
}
tbody.addEventListener('click', (e) => { const tr = e.target.closest('tr'); if (tr) selectRow(tr); });
tbody.addEventListener('keydown', (e) => {
  const tr = e.target.closest('tr');
  if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectRow(tr); }
});
selectRow($('tr[data-lvl="2"]', tbody));

// clic en una habitación del plano rojo → selecciona su fila
levelsPlan.addEventListener('click', (e) => {
  const g = e.target.closest('[data-room]');
  if (g) selectRow($(`tr[data-n="${g.dataset.room}"]`, tbody));
});
