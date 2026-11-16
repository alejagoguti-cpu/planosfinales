// Animaciones de la página: telón de entrada, títulos que aparecen por líneas, imágenes que se descubren,
// cifras que cuentan, parallax suave y barras del carrusel con avance. No cambia ningún texto ni dato.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
document.documentElement.classList.add('js-anim');
if (reduce) document.documentElement.classList.add('no-motion');

/* ---------- intro: dos marcas grandes que se reducen hacia el encabezado ---------- */
const curtain = document.createElement('div');
curtain.className = 'curtain';
curtain.setAttribute('aria-hidden', 'true');
curtain.innerHTML = `
  <div class="curtain-marks">
    <img src="assets/logos/estelar.png" alt="">
    <span aria-hidden="true"></span>
    <img src="assets/logos/baco.png" alt="">
  </div>
  <span class="curtain-bar"><i></i></span>
`;
if (!reduce) {
  document.body.append(curtain);
  const hero = $('.hero > img');
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    curtain.classList.add('shrink');
    setTimeout(() => {
      curtain.classList.add('out');
      document.documentElement.classList.add('ready');
    }, 900);
    setTimeout(() => curtain.remove(), 1900);
  };
  const t0 = performance.now();
  const done = () => setTimeout(go, Math.max(0, 950 - (performance.now() - t0)));
  if (hero && !hero.complete) {
    hero.addEventListener('load', done, { once: true });
    hero.addEventListener('error', done, { once: true });
    setTimeout(go, 3200);
  } else done();
} else document.documentElement.classList.add('ready');

/* ---------- títulos por líneas: cada palabra sube desde una máscara ---------- */
function splitWords(el) {
  const walk = (node) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(w); return; }
          const outer = document.createElement('span'); outer.className = 'w';
          const inner = document.createElement('span'); inner.className = 'wi'; inner.textContent = w;
          outer.append(inner); frag.append(outer);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    }
  };
  walk(el);
  $$('.wi', el).forEach((w, i) => w.style.setProperty('--i', i));
  el.classList.add('split');
}
['.hero h1', '.welcome h2', '.types-l h2', '.statement h2', '.levels-h', '.detail h2', '.tours h2'].forEach((s) => { const el = $(s); if (el) splitWords(el); });

/* ---------- aparición al hacer scroll ---------- */
const revealSel = [
  '.intro-txt h3', '.intro-txt p', '.shadow-img', '.types-l p', '.types-c', '.pills', '.types-plan',
  '.statement img', '.cols article', '.facts > div', '.tours p', '.tours li', '.foot-logos', '.foot-cols > div',
];
revealSel.forEach((s) => $$(s).forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', `${(i % 4) * 90}ms`); }));
$$('.shadow-img, .cols article, .statement').forEach((el) => el.classList.add('wipe'));
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    if (e.target.dataset.count != null) countUp(e.target);
    io.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
document.querySelectorAll('.rv, .wipe, .split').forEach((el) => io.observe(el));

/* ---------- coreografía propia de cada sección (incluye contenido generado después de cargar) ---------- */
const motionGroups = [
  ['.slider', 'rv-scale'],
  ['.asbuilt-head', 'rv-left'],
  ['.asb-pills-bar', 'rv-up'],
  ['.asb-discipline-desc', 'rv-up'],
  ['.asb-floor-card', 'rv-left'],
  ['.asb-side-card', 'rv-right'],
  ['.levels table', 'rv-left'],
  ['.levels-panel', 'rv-right'],
  ['.panel-top', 'rv-focus'],
  ['.panel-links', 'rv-up'],
  ['.detail .cols', 'rv-up'],
  ['.tours ul', 'rv-right'],
  ['.foot-bottom', 'rv-up'],
];
function initSectionMotion(root = document) {
  for (const [selector, variant] of motionGroups) {
    root.querySelectorAll(selector).forEach((el, i) => {
      if (el.dataset.motionReady) return;
      el.dataset.motionReady = 'true';
      el.classList.add('rv', variant);
      el.style.setProperty('--d', `${Math.min(i, 4) * 80}ms`);
      io.observe(el);
    });
  }
  root.querySelectorAll('.levels tbody tr').forEach((row, i) => {
    if (row.dataset.motionReady) return;
    row.dataset.motionReady = 'true';
    row.classList.add('row-reveal');
    row.style.setProperty('--row', i);
    io.observe(row);
  });
  const asbuiltTitle = $('.asbuilt-head h2', root);
  if (asbuiltTitle && !asbuiltTitle.classList.contains('split')) {
    splitWords(asbuiltTitle);
    io.observe(asbuiltTitle);
  }
}
initSectionMotion();
document.documentElement.classList.add('motion-ready');
const dynamicMotion = new MutationObserver((records) => {
  if (records.some((r) => r.addedNodes.length)) initSectionMotion();
});
dynamicMotion.observe(document.querySelector('main'), { childList: true, subtree: true });

/* ---------- cifras que cuentan hasta su valor (el texto final es idéntico al original) ---------- */
function countUp(el) {
  const final = el.textContent.trim();
  const num = Number(final.replace(/\./g, '').replace(',', '.'));
  if (!isFinite(num) || reduce) return;
  const dec = (final.split(',')[1] || '').length;
  const fmt = (v) => v.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const t0 = performance.now(), dur = 1400;
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = k < 1 ? fmt(num * e) : final;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
$$('.facts dt').forEach((el) => { el.dataset.count = ''; io.observe(el); });
// las cifras del texto de introducción las escribe script.js al cargar los datos: se cuentan al verse
const introNums = $$('.intro-txt [data-fig]');
const ioNum = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { ioNum.unobserve(e.target); setTimeout(() => countUp(e.target), 150); }
}, { threshold: 0.6 });
introNums.forEach((el) => ioNum.observe(el));

/* ---------- cifras de tipologías: transición al cambiar de categoría ---------- */
$$('[data-t-min], [data-t-max], [data-t-cap]').forEach((el) => {
  new MutationObserver(() => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }).observe(el, { childList: true, characterData: true, subtree: true });
});

/* ---------- carrusel: la barra activa se llena durante los 5 s de cada imagen ---------- */
const bars = $('[data-bars]');
if (bars) new MutationObserver(() => {
  $$('button', bars).forEach((b) => { if (b.getAttribute('aria-selected') === 'true') { b.classList.remove('run'); void b.offsetWidth; b.classList.add('run'); } else b.classList.remove('run'); });
}).observe(bars, { attributes: true, subtree: true, attributeFilter: ['aria-selected'], childList: true });

/* ---------- línea de progreso de lectura ---------- */
const progress = document.createElement('div');
progress.className = 'progress';
progress.setAttribute('aria-hidden', 'true');
document.body.append(progress);

/* ---------- parallax suave (portada, franja de bienvenida y titular con imagen) ---------- */
{
  const heroImg = $('.hero > img'), ghost = $('.ghost'), stImg = $('.statement img'), welcome = $('.welcome'), statement = $('.statement');
  let pending = false;
  const onScroll = () => {
    if (pending) return; pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const y = scrollY, h = innerHeight;
      progress.style.setProperty('--p', (y / Math.max(1, document.documentElement.scrollHeight - h)).toFixed(4));
      // la foto del titular se abre de un marco a pantalla completa mientras entra
      if (stImg) { const r = stImg.getBoundingClientRect(); const k = Math.min(1, Math.max(0, (h - r.top) / (h * 0.85))); stImg.style.setProperty('--inset', `${((1 - k) * 8).toFixed(2)}%`); }
      if (reduce) return;
      if (heroImg && y < h * 1.2) heroImg.style.translate = `0 ${y * 0.28}px`;
      if (ghost && welcome) { const r = welcome.getBoundingClientRect(); if (r.bottom > 0 && r.top < h) ghost.style.translate = `-50% calc(-50% + ${(r.top - h / 2) * -0.12}px)`; }
      if (stImg && statement) { const r = statement.getBoundingClientRect(); if (r.bottom > 0 && r.top < h) stImg.style.setProperty('--py', `${(r.top + r.height - h) * -0.12}px`); }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- menú: los enlaces entran escalonados ---------- */
$$('.menu li').forEach((li, i) => li.style.setProperty('--i', i));
