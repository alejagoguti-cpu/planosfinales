const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const m2 = (n) => n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- header + menú ---------- */
const hdr = $('[data-hdr]');
const menu = $('[data-menu]');
const menuBtn = $('[data-menu-btn]');
const onScroll = () => hdr.classList.toggle('solid', scrollY > innerHeight * 0.6 || !menu.hidden);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

function setMenu(open) {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.querySelector('span').textContent = open ? 'Cerrar' : 'Menú';
  document.body.style.overflow = open ? 'hidden' : '';
  onScroll();
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
$$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

/* ---------- aparición al hacer scroll ---------- */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));
} else {
  document.documentElement.classList.add('no-js');
}

/* ---------- parallax suave del panorama ---------- */
const panoImg = $('.pano img');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (panoImg && !reduce) {
  const pano = panoImg.parentElement;
  const tick = () => {
    const r = pano.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const p = (innerHeight - r.top) / (innerHeight + r.height); // 0..1
      panoImg.style.transform = `translateY(${(p - 0.5) * -12}%)`;
    }
  };
  addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });
  tick();
}

/* ---------- selector de plantas ---------- */
const FLOORS = {
  6: { use: 'Planta tipo', state: 'En modelado', units: '—' },
  5: { use: 'Planta tipo', state: 'En modelado', units: '—' },
  4: { use: 'Planta tipo', state: 'En modelado', units: '—' },
  3: { use: 'Planta tipo', state: 'En modelado', units: '—' },
  2: { use: 'Habitaciones', state: 'Remodelación', units: '12', plan: true },
};
const order = [6, 5, 4, 3, 2];
const svg = $('[data-stack]');
const list = $('[data-stack-list]');
const NS = 'http://www.w3.org/2000/svg';

// losas en proyección oblicua (se dibujan de abajo hacia arriba para que no se tapen)
[...order].reverse().forEach((f) => {
  const i = f - 2;
  const y = 290 - i * 55, h = 26, x0 = 50, w = 190, dx = 60, dy = 40;
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'slab');
  g.setAttribute('tabindex', '0');
  g.setAttribute('role', 'button');
  g.setAttribute('aria-label', `Piso ${f}`);
  g.dataset.floor = f;
  g.innerHTML = `
    <path class="side" d="M${x0 + w} ${y}L${x0 + w + dx} ${y - dy}V${y - dy + h}L${x0 + w} ${y + h}Z"/>
    <path class="front" d="M${x0} ${y}H${x0 + w}V${y + h}H${x0}Z"/>
    <path class="top" d="M${x0} ${y}H${x0 + w}L${x0 + w + dx} ${y - dy}H${x0 + dx}Z"/>
    <text x="${x0 + 14}" y="${y + 17}">PISO 0${f}</text>`;
  svg.append(g);
});
order.forEach((f) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" data-floor="${f}" aria-pressed="false"><b>0${f}</b><span>${FLOORS[f].use}</span><small>${FLOORS[f].state}</small></button>`;
  list.append(li);
});

const roomsBox = $('[data-rooms]');
function selectFloor(f) {
  const d = FLOORS[f];
  $$('.slab', svg).forEach((s) => s.classList.toggle('on', s.dataset.floor == f));
  $$('button', list).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.floor == f)));
  $('[data-floor-num]').textContent = String(f).padStart(2, '0');
  $('[data-floor-use]').textContent = d.use;
  $('[data-floor-state]').textContent = d.state;
  $('[data-floor-units]').textContent = d.units;
  $('[data-plan]').hidden = !d.plan;
  $('[data-plan-empty]').hidden = !!d.plan;
  roomsBox.hidden = !d.plan;
}
svg.addEventListener('click', (e) => { const s = e.target.closest('.slab'); if (s) selectFloor(+s.dataset.floor); });
svg.addEventListener('keydown', (e) => {
  const s = e.target.closest('.slab');
  if (s && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectFloor(+s.dataset.floor); }
});
list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) selectFloor(+b.dataset.floor); });
selectFloor(2);

// pestañas de plano
const planImg = $('[data-plan-img]');
const planLink = $('[data-plan-link]');
$$('[data-plan-src]').forEach((tab) => tab.addEventListener('click', () => {
  $$('[data-plan-src]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
  planImg.src = tab.dataset.planSrc;
  planLink.href = tab.dataset.planSrc;
  planImg.alt = `Planta del Piso 2 · ${tab.textContent}`;
}));

/* ---------- inventario de habitaciones ---------- */
const body = $('[data-rooms-body]');
const chips = $('[data-chips]');
const totalEl = $('[data-total]');
const selected = new Set();
let rooms = [];
let filter = 'Todas';

function renderRooms() {
  body.innerHTML = rooms
    .filter((r) => filter === 'Todas' || r.cat === filter)
    .map((r) => `
      <tr class="${selected.has(r.n) ? 'sel' : ''}">
        <th scope="row">${r.n}</th>
        <td>${r.tipo}<small>${r.cat}</small></td>
        <td>${r.ala}<small>${r.ubic}</small></td>
        <td>${r.camas}</td>
        <td class="num">${m2(r.priv)}</td>
        <td class="num">${m2(r.cons)}</td>
        <td><button type="button" class="check" data-n="${r.n}" aria-pressed="${selected.has(r.n)}" aria-label="Seleccionar habitación ${r.n}">${selected.has(r.n) ? '✓' : '+'}</button></td>
      </tr>`).join('');
  const sel = rooms.filter((r) => selected.has(r.n));
  const area = sel.reduce((a, r) => a + r.priv, 0);
  totalEl.textContent = `${sel.length} hab. · ${m2(area)} m²`;
}

body.addEventListener('click', (e) => {
  const b = e.target.closest('.check');
  if (!b) return;
  selected.has(b.dataset.n) ? selected.delete(b.dataset.n) : selected.add(b.dataset.n);
  renderRooms();
});
$('[data-clear]').addEventListener('click', () => { selected.clear(); renderRooms(); });
chips.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  filter = b.dataset.cat;
  $$('button', chips).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  renderRooms();
});

fetch('assets/habitaciones-p2.json')
  .then((r) => r.json())
  .then((data) => {
    rooms = data;
    const cats = ['Todas', ...new Set(rooms.map((r) => r.cat))];
    chips.innerHTML = cats.map((c, i) => `<button type="button" data-cat="${c}" aria-pressed="${i === 0}">${c}</button>`).join('');
    renderRooms();
    // cifras de la intro
    $('[data-fig="rooms"]').textContent = rooms.length;
    $('[data-fig="types"]').textContent = new Set(rooms.map((r) => r.tipo)).size;
    $('[data-fig="area"]').textContent = Math.round(rooms.reduce((a, r) => a + r.priv, 0));
  })
  .catch(() => { body.innerHTML = '<tr><td colspan="7">No se pudo cargar el inventario.</td></tr>'; });
