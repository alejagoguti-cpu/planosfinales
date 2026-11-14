// Visor As-Built · Hotel Estelar La Fontana (Piso 2)
// Disciplinas: 1. Eléctrico | 2. Agua Caliente y agua fría | 3. Desagües | 4. Red contraincendios
// Disposición solicitada: Plano de habitación a la DERECHA, interactivo con la planta a la izquierda.

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

export const DISCIPLINAS_ASBUILT = {
  electrico: {
    id: 'electrico',
    num: '1',
    numLabel: '1. Eléctrico',
    title: 'Red Eléctrica e Iluminación',
    code: 'ELE',
    color: '#eab308',
    norma: 'RETIE / RETILAP · NTC 2050',
    tagline: 'Distribución en baja tensión 208/120V, alumbrado LED 3000K, tomas con USB y tablero general TE-P2.',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    legend: [
      { label: 'Circuito 120/208V', color: '#eab308', type: 'line' },
      { label: 'Downlight LED 3000K', color: '#fef08a', type: 'circle' },
      { label: 'Luz Indirecta LED', color: '#fbbf24', type: 'dash' },
      { label: 'Toma Doble 110V + USB', color: '#f59e0b', type: 'square' },
      { label: 'Tablero TE-P2', color: '#ef4444', type: 'box' },
    ],
    specs: [
      { label: 'Carga Conectada', val: '18.4 kW' },
      { label: 'Tablero General', val: 'TE-P2 (24 ctos)' },
      { label: 'Láminas As-Built', val: '12 planos (1:50)' },
    ]
  },
  agua: {
    id: 'agua',
    num: '2',
    numLabel: '2. Agua Caliente y agua fría',
    title: 'Red Hidráulica (Agua Fría y Caliente)',
    code: 'HID',
    color: '#0284c7',
    norma: 'NTC 1500 · Código Fontanería',
    tagline: 'Suministro en PVC Presión (fría) y CPVC con recirculación forzada.',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7l5.6 5.6a8 8 0 1 1-11.3 0z"/><path d="M12 11v6m-3-3h6"/></svg>`,
    legend: [
      { label: 'Agua Fría (PVC-P)', color: '#0284c7', type: 'line' },
      { label: 'Agua Caliente (CPVC)', color: '#e11d48', type: 'line' },
      { label: 'Válvula de Corte', color: '#38bdf8', type: 'circle' },
      { label: 'Riser AF-AC', color: '#0ea5e9', type: 'box' },
    ],
    specs: [
      { label: 'Presión en Grifos', val: '38 - 45 PSI' },
      { label: 'Caudal de Diseño', val: '3.45 L/s' },
      { label: 'Recirculación', val: 'Bucle forzado CPVC' },
    ]
  },
  desagues: {
    id: 'desagues',
    num: '3',
    numLabel: '3. Desagües',
    title: 'Red Sanitaria y Desagües',
    code: 'SAN',
    color: '#10b981',
    norma: 'NTC 1500 · Desagües y Ventilación',
    tagline: 'Evacuación por gravedad en PVC Sanitario de 4" y 2" con pendientes del 2%.',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5a4 4 0 0 0 8 0V4"/><path d="M12 9a4 4 0 0 0 8 0V4"/><path d="M4 4h16"/><path d="M12 13v7"/><circle cx="12" cy="21" r="1"/></svg>`,
    legend: [
      { label: 'Aguas Negras PVC Ø4"', color: '#10b981', type: 'line' },
      { label: 'Desagüe Baño Ø2"', color: '#34d399', type: 'line' },
      { label: 'Bajante BAN Ø4"', color: '#059669', type: 'box' },
      { label: 'Sifón de Piso Ø3"', color: '#6ee7b7', type: 'circle' },
    ],
    specs: [
      { label: 'Pendiente Mínima', val: '2.0% hacia bajantes' },
      { label: 'Bajantes BAN', val: '3 registrables' },
      { label: 'Ventilación', val: 'Secundaria antiolores' },
    ]
  },
  contraincendios: {
    id: 'contraincendios',
    num: '4',
    numLabel: '4. Red contraincendios',
    title: 'Red Contra Incendios y Detección',
    code: 'RCI',
    color: '#ef4444',
    norma: 'NSR-10 Título J y K · NFPA 13/72',
    tagline: 'Rociadores automáticos QR 68°C cobertura 100% y detectores de humo.',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    legend: [
      { label: 'Rociador QR K=5.6 (68°C)', color: '#ef4444', type: 'circle' },
      { label: 'Red Matriz Ø2½"', color: '#dc2626', type: 'line' },
      { label: 'Detector Humo (DH)', color: '#fbbf24', type: 'square' },
      { label: 'Gabinete GCI', color: '#b91c1c', type: 'box' },
    ],
    specs: [
      { label: 'Rociadores QR', val: '28 unds K=5.6' },
      { label: 'Cobertura', val: 'Radio 3.0 m (100%)' },
      { label: 'Detectores', val: '18 direccionables' },
    ]
  }
};

function generateMepSvg(discKey, geo, rooms) {
  const roomCenters = new Map();
  geo.rooms.forEach((r) => {
    roomCenters.set(r.n, centroid(r.main));
  });

  if (discKey === 'electrico') {
    let s = `<g class="asb-mep-layer">`;
    s += `<rect x="2520" y="-890" width="70" height="40" fill="#ef4444" stroke="#fff" stroke-width="2" rx="3"/>`;
    s += `<text x="2555" y="-865" fill="#fff" font-family="var(--head)" font-size="20" font-weight="700" text-anchor="middle">TE-P2</text>`;
    s += `<path d="M 2555 -850 L 2555 -600 L 3300 -600 L 3300 200 L 3700 800" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="10,6" opacity="0.9"/>`;
    s += `<path d="M 2555 -600 L 100 -600 L -700 -600 L -700 -400" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="10,6" opacity="0.9"/>`;

    geo.rooms.forEach((r) => {
      const [cx, cy] = roomCenters.get(r.n) || [0, 0];
      s += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy > -600 ? cy - 120 : cy + 120}" stroke="#eab308" stroke-width="3" opacity="0.75"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="18" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="6" fill="#ca8a04"/>`;
      s += `<line x1="${cx - 60}" y1="${cy - 40}" x2="${cx + 60}" y2="${cy - 40}" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/>`;
      s += `<rect x="${cx - 75}" y="${cy - 45}" width="14" height="14" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>`;
      s += `<rect x="${cx + 61}" y="${cy - 45}" width="14" height="14" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>`;

      if (r.bath && r.bath[0]) {
        const [bcx, bcy] = centroid(r.bath[0]);
        s += `<circle cx="${bcx}" cy="${bcy}" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>`;
        s += `<line x1="${cx}" y1="${cy}" x2="${bcx}" y2="${bcy}" stroke="#eab308" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>`;
        s += `<rect x="${bcx - 20}" y="${bcy - 20}" width="12" height="12" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>`;
      }
    });
    s += `</g>`;
    return s;
  }

  if (discKey === 'agua') {
    let s = `<g class="asb-mep-layer">`;
    s += `<rect x="2490" y="-830" width="50" height="45" fill="#0284c7" stroke="#fff" stroke-width="2" rx="4"/>`;
    s += `<text x="2515" y="-800" fill="#fff" font-family="var(--head)" font-size="16" font-weight="700" text-anchor="middle">AF/AC</text>`;
    s += `<path d="M 2515 -785 L 2515 -580 L 3280 -580 L 3280 220 L 3680 820" fill="none" stroke="#0284c7" stroke-width="5" opacity="0.9"/>`;
    s += `<path d="M 2500 -785 L 2500 -590 L 3270 -590 L 3270 210 L 3670 810" fill="none" stroke="#e11d48" stroke-width="4" opacity="0.9"/>`;
    s += `<path d="M 2515 -580 L 80 -580 L -720 -580 L -720 -380" fill="none" stroke="#0284c7" stroke-width="5" opacity="0.9"/>`;
    s += `<path d="M 2500 -590 L 70 -590 L -730 -590 L -730 -390" fill="none" stroke="#e11d48" stroke-width="4" opacity="0.9"/>`;

    geo.rooms.forEach((r) => {
      const bathLoop = r.bath && r.bath[0] ? r.bath[0] : r.main;
      const [bx, by] = centroid(bathLoop);
      s += `<line x1="${bx}" y1="${by}" x2="${bx}" y2="${by > -580 ? by - 80 : by + 80}" stroke="#0284c7" stroke-width="3"/>`;
      s += `<line x1="${bx - 12}" y1="${by}" x2="${bx - 12}" y2="${by > -580 ? by - 80 : by + 80}" stroke="#e11d48" stroke-width="3"/>`;
      s += `<polygon points="${bx-6},${by-40} ${bx+6},${by-40} ${bx},${by-46}" fill="#38bdf8"/>`;
      s += `<polygon points="${bx-18},${by-40} ${bx-6},${by-40} ${bx-12},${by-46}" fill="#f43f5e"/>`;
      s += `<circle cx="${bx + 20}" cy="${by + 10}" r="8" fill="#0284c7" stroke="#fff" stroke-width="1.5"/>`;
      s += `<circle cx="${bx + 35}" cy="${by + 10}" r="8" fill="#e11d48" stroke="#fff" stroke-width="1.5"/>`;
    });
    s += `</g>`;
    return s;
  }

  if (discKey === 'desagues') {
    let s = `<g class="asb-mep-layer">`;
    const bans = [
      { x: -740, y: -450 },
      { x: 1020, y: -450 },
      { x: 3420, y: 150 }
    ];
    bans.forEach((b) => {
      s += `<circle cx="${b.x}" cy="${b.y}" r="22" fill="#059669" stroke="#fff" stroke-width="2.5"/>`;
      s += `<text x="${b.x}" y="${b.y + 7}" fill="#fff" font-family="var(--head)" font-size="16" font-weight="700" text-anchor="middle">BAN</text>`;
    });

    geo.rooms.forEach((r) => {
      const bathLoop = r.bath && r.bath[0] ? r.bath[0] : r.main;
      const [bx, by] = centroid(bathLoop);
      s += `<path d="M ${bx - 20} ${by + 20} L ${bx} ${by} L ${bx + 30} ${by - 30}" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>`;
      s += `<circle cx="${bx}" cy="${by}" r="12" fill="#10b981" stroke="#047857" stroke-width="3"/>`;
      s += `<circle cx="${bx}" cy="${by}" r="4" fill="#fff"/>`;
      s += `<rect x="${bx - 28}" y="${by + 12}" width="16" height="16" rx="3" fill="#059669" stroke="#fff" stroke-width="1.5"/>`;

      let closest = bans[0];
      let minD = Infinity;
      bans.forEach((bn) => {
        const d = Math.hypot(bn.x - bx, bn.y - by);
        if (d < minD) { minD = d; closest = bn; }
      });
      s += `<line x1="${bx}" y1="${by}" x2="${closest.x}" y2="${closest.y}" stroke="#10b981" stroke-width="3" stroke-dasharray="10,6" opacity="0.5"/>`;
    });
    s += `</g>`;
    return s;
  }

  if (discKey === 'contraincendios') {
    let s = `<g class="asb-mep-layer">`;
    s += `<path d="M -750 -550 L 2550 -550 L 3320 -550 L 3320 250 L 3720 850" fill="none" stroke="#dc2626" stroke-width="6" opacity="0.9"/>`;
    s += `<rect x="500" y="-575" width="40" height="25" fill="#dc2626" stroke="#fff" stroke-width="2" rx="3"/>`;
    s += `<text x="520" y="-558" fill="#fff" font-family="var(--head)" font-size="14" font-weight="700" text-anchor="middle">GCI</text>`;
    s += `<rect x="3300" y="300" width="25" height="40" fill="#dc2626" stroke="#fff" stroke-width="2" rx="3"/>`;
    s += `<text x="3312" y="325" fill="#fff" font-family="var(--head)" font-size="14" font-weight="700" text-anchor="middle">GCI</text>`;

    geo.rooms.forEach((r) => {
      const [cx, cy] = roomCenters.get(r.n) || [0, 0];
      s += `<circle cx="${cx}" cy="${cy}" r="110" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="6,4"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="11" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>`;
      s += `<line x1="${cx - 16}" y1="${cy}" x2="${cx + 16}" y2="${cy}" stroke="#ef4444" stroke-width="2.5"/>`;
      s += `<line x1="${cx}" y1="${cy - 16}" x2="${cx}" y2="${cy + 16}" stroke="#ef4444" stroke-width="2.5"/>`;
      s += `<polygon points="${cx+45},${cy-30} ${cx+60},${cy-15} ${cx+45},${cy} ${cx+30},${cy-15}" fill="#fbbf24" stroke="#b45309" stroke-width="1.5"/>`;
    });
    s += `</g>`;
    return s;
  }

  return '';
}

/**
 * Inicializador del componente interactivo de Planos As-Built
 */
export function initAsBuilt({ rooms, geo }) {
  const container = document.getElementById('asbuilt-container');
  if (!container) return;

  let activeDisc = 'electrico';
  let activeRoom = '215';

  const xs = geo.walls.flatMap((w) => [w[0], w[2]]);
  const ys = geo.walls.flatMap((w) => [-w[1], -w[3]]);
  const pad = 90;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const vbWidth = Math.max(...xs) - minX + pad;
  const vbHeight = Math.max(...ys) - minY + pad;

  const roomsMap = new Map();
  rooms.forEach((r) => roomsMap.set(String(r.n), r));

  // Layout solicitado: A LA IZQUIERDA la planta y opciones; A LA DERECHA el plano de la habitación
  container.innerHTML = `
    <div class="asb-split-container">
      <!-- COLUMNA IZQUIERDA: Encabezado + Especialidades + Planta interactiva del Piso 2 -->
      <div class="asb-left-column">
        <div class="asbuilt-head">
          <span class="asbuilt-badge-sup">Ingeniería & Planimetría Final Conforme a Obra</span>
          <h2>Planos <span class="asb-title-gold">As Built</span></h2>
          <p>Selecciona una especialidad técnica (1. Eléctrico, 2. Agua Caliente y agua fría, 3. Desagües, 4. Red contraincendios) para ver la planta del Piso 2 y haz clic en cualquier habitación para inspeccionar su plano de detalle a la derecha.</p>
        </div>

        <!-- 4 Pestañas de especialidades -->
        <div class="asb-pills-bar" role="tablist" aria-label="Especialidades As-Built">
          ${Object.values(DISCIPLINAS_ASBUILT).map((d) => `
            <button type="button" class="asb-pill-btn ${d.id === activeDisc ? 'active' : ''}" data-disc="${d.id}" role="tab" aria-selected="${d.id === activeDisc}">
              <span class="asb-pill-num">${d.num}</span>
              <span class="asb-pill-icon" style="color: ${d.color};">${d.iconSvg}</span>
              <span class="asb-pill-label">${d.numLabel}</span>
            </button>
          `).join('')}
        </div>

        <!-- Banner descriptivo con especificaciones -->
        <div class="asb-discipline-desc" id="asb-disc-desc"></div>

        <!-- Tarjeta de la Planta Interactiva del Piso 2 -->
        <div class="asb-floor-card">
          <div class="asb-floor-card-top">
            <div class="asb-floor-card-title">
              <span class="asb-kicker">Planta General · Piso 2</span>
              <h3>Haz clic en una habitación para ver su plano a la derecha</h3>
            </div>
            <!-- Selector horizontal de habitaciones -->
            <div class="asb-rooms-nav" role="group" aria-label="Seleccionar habitación">
              ${geo.rooms.map((r) => `
                <button type="button" class="asb-room-chip ${r.n === activeRoom ? 'active' : ''}" data-select-room="${r.n}">
                  Hab ${r.n}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Lienzo SVG del piso 2 -->
          <div class="asb-svg-box">
            <svg class="asb-floor-svg" id="asb-floor-svg" viewBox="${minX} ${minY} ${vbWidth} ${vbHeight}" role="img" aria-label="Planta interactiva del Piso 2">
            </svg>
            <div class="asb-plan-tooltip" id="asb-plan-tooltip" hidden></div>
          </div>

          <!-- Leyenda de convenciones flat -->
          <div class="asb-legend-box" id="asb-legend-box"></div>
        </div>
      </div>

      <!-- COLUMNA DERECHA (EL RECUADRO ROJO SOLICITADO): Plano de detalle de la habitación -->
      <div class="asb-right-column" id="asb-right-column">
        <div class="asb-side-inspector" id="asb-side-inspector">
          <!-- Inyectado por renderSideInspector() -->
        </div>
      </div>
    </div>

    <!-- Modal Lightbox de Pantalla Completa opcional para ampliar a tope -->
    <div class="asb-modal" id="asb-modal" hidden role="dialog" aria-modal="true" aria-label="Plano ampliado">
      <div class="asb-modal-overlay" data-close-modal></div>
      <div class="asb-modal-dialog">
        <div class="asb-modal-bar">
          <div class="asb-modal-title-group">
            <span class="asb-modal-tag" id="asb-modal-tag">HABITACIÓN 215</span>
            <span class="asb-modal-head-txt" id="asb-modal-title">Habitación 215</span>
          </div>
          <div class="asb-modal-tools">
            <button type="button" class="asb-modal-close" data-close-modal aria-label="Cerrar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="asb-modal-stage" id="asb-modal-stage">
          <img src="" alt="Plano As-Built" class="asb-modal-img" id="asb-modal-img">
        </div>
      </div>
    </div>
  `;

  const svgEl = document.getElementById('asb-floor-svg');
  const tooltipEl = document.getElementById('asb-plan-tooltip');
  const descEl = document.getElementById('asb-disc-desc');
  const legendEl = document.getElementById('asb-legend-box');
  const inspectorEl = document.getElementById('asb-side-inspector');

  // Modal Lightbox
  const modalEl = document.getElementById('asb-modal');
  const modalImg = document.getElementById('asb-modal-img');
  const modalTag = document.getElementById('asb-modal-tag');
  const modalTitle = document.getElementById('asb-modal-title');

  function openModal(roomNum) {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];
    const rInfo = roomsMap.get(roomNum) || { n: roomNum, cat: 'Habitación' };
    const imgSrc = `assets/planos/electrico/plano-elec-${roomNum}.jpg`;

    modalTag.textContent = `HABITACIÓN ${roomNum}`;
    modalTag.style.background = disc.color;
    modalTitle.textContent = `Habitación ${roomNum} · ${rInfo.cat}`;
    modalImg.src = imgSrc;
    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalEl.hidden = true;
    document.body.style.overflow = '';
  }

  container.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  window.addEventListener('keydown', (e) => {
    if (modalEl.hidden) return;
    if (e.key === 'Escape') closeModal();
  });

  function renderDisciplineHeader() {
    const d = DISCIPLINAS_ASBUILT[activeDisc];
    descEl.innerHTML = `
      <div class="asb-desc-main">
        <span class="asb-tag-pill" style="border-color: ${d.color}; color: ${d.color};">
          ${d.code} · As-Built
        </span>
        <h4>${d.title}</h4>
        <p>${d.tagline} Norma técnica: <b>${d.norma}</b>.</p>
      </div>
      <div class="asb-desc-specs">
        ${d.specs.map((s) => `
          <div class="asb-spec-item">
            <span class="asb-sp-v">${s.val}</span>
            <span class="asb-sp-l">${s.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderLegend() {
    const d = DISCIPLINAS_ASBUILT[activeDisc];
    legendEl.innerHTML = `
      <span class="asb-leg-head">Convenciones:</span>
      <div class="asb-leg-list">
        ${d.legend.map((l) => `
          <div class="asb-leg-entry">
            <span class="asb-leg-bullet ${l.type}" style="--c: ${l.color}; background-color: ${l.type === 'line' ? 'transparent' : l.color}; border-color: ${l.color};"></span>
            <span>${l.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderFloorSvg() {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];

    let svgHtml = `
      <!-- Losa y circulaciones -->
      ${geo.slab.map((l) => `<path class="asb-slab" d="${pathOf(l)}" fill="#141822" stroke="#252d3d" stroke-width="4"/>`).join('')}
      ${geo.corridor.map((l) => `<path class="asb-circ" d="${pathOf(l)}" fill="#19202e" stroke="#2f3b50" stroke-width="3"/>`).join('')}

      <!-- Habitaciones -->
      <g class="asb-rooms-g">
        ${geo.rooms.map((r) => {
          const isSelected = r.n === activeRoom;
          return `
            <g class="asb-room-polygon-g ${isSelected ? 'selected' : ''}" data-room-n="${r.n}">
              <path class="asb-room-bg" d="${pathOf(r.main)}" fill="${isSelected ? disc.color + '25' : '#0c1018'}" stroke="${isSelected ? disc.color : '#2d3748'}" stroke-width="${isSelected ? 4 : 2}"/>
              ${r.bath.map((b) => `<path class="asb-bath-bg" d="${pathOf(b)}" fill="${isSelected ? disc.color + '33' : '#0f1420'}" stroke="${isSelected ? disc.color : '#2d3748'}" stroke-width="2"/>`).join('')}
            </g>
          `;
        }).join('')}
      </g>

      <!-- Núcleos estructurales -->
      ${geo.stairs.map(([a, b, c, d]) => `<rect class="asb-stair" x="${a}" y="${-d}" width="${c - a}" height="${d - b}" fill="#1e2533" stroke="#475569" stroke-width="2" stroke-dasharray="6,4"/>`).join('')}
      ${geo.walls.map(([a, b, c, d, t]) => `<line class="asb-wall" x1="${a}" y1="${-b}" x2="${c}" y2="${-d}" stroke="#64748b" stroke-width="${Math.max(t, 6)}" stroke-linecap="round"/>`).join('')}
      ${geo.columns.map(([a, b, c, d]) => `<rect class="asb-col" x="${a}" y="${-d}" width="${c - a}" height="${d - b}" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>`).join('')}

      <!-- Capa de ingeniería MEP -->
      ${generateMepSvg(activeDisc, geo, rooms)}

      <!-- Etiquetas interactivas con número de habitación -->
      <g class="asb-labels-g">
        ${geo.rooms.map((r) => {
          const [cx, cy] = centroid(r.main);
          const isSelected = r.n === activeRoom;
          return `
            <g class="asb-room-lbl-g" data-label-n="${r.n}">
              <rect x="${cx - 36}" y="${cy - 20}" width="72" height="40" rx="6" fill="${isSelected ? disc.color : '#0f1622'}" stroke="${isSelected ? '#fff' : disc.color}" stroke-width="${isSelected ? 3 : 1.5}" opacity="0.95"/>
              <text x="${cx}" y="${cy + 7}" fill="${isSelected ? '#000' : '#fff'}" font-family="var(--head)" font-size="24" font-weight="700" text-anchor="middle">${r.n}</text>
            </g>
          `;
        }).join('')}
      </g>
    `;

    svgEl.innerHTML = svgHtml;
    attachRoomEvents();
  }

  function attachRoomEvents() {
    svgEl.querySelectorAll('[data-room-n], [data-label-n]').forEach((el) => {
      const roomNum = el.dataset.roomN || el.dataset.labelN;

      el.addEventListener('click', () => {
        selectRoom(roomNum);
      });

      el.addEventListener('mouseenter', (e) => {
        const rInfo = roomsMap.get(roomNum);
        if (!rInfo) return;
        tooltipEl.hidden = false;
        tooltipEl.innerHTML = `<b>Habitación ${rInfo.n}</b><br><small>${rInfo.cat} · ${rInfo.priv} m² · <i>Clic para ver plano a la derecha</i></small>`;
      });

      el.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        tooltipEl.style.left = `${e.clientX - rect.left + 15}px`;
        tooltipEl.style.top = `${e.clientY - rect.top + 15}px`;
      });

      el.addEventListener('mouseleave', () => {
        tooltipEl.hidden = true;
      });
    });
  }

  /**
   * Renderiza el plano de la habitación en la COLUMNA DERECHA (EL RECUADRO ROJO)
   */
  function renderSideInspector() {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];
    const r = roomsMap.get(activeRoom) || {
      n: activeRoom,
      tipo: 'Habitación Doble',
      cat: 'Habitación Doble',
      ala: 'Ala Recta Norte',
      priv: 26.42,
      cons: 30.12,
      camas: 'Dotación hotelera estándar'
    };

    const isElectrico = disc.id === 'electrico';
    const planImgSrc = `assets/planos/electrico/plano-elec-${r.n}.jpg`;

    inspectorEl.innerHTML = `
      <div class="asb-side-card">
        <!-- Cabecera del plano derecho -->
        <div class="asb-side-header">
          <div class="asb-side-tag-row">
            <span class="asb-side-badge" style="background: ${disc.color}; color: #000;">
              HABITACIÓN ${r.n}
            </span>
            <span class="asb-side-code">
              PLANO ${disc.code}-${r.n}
            </span>
          </div>
          <h3 class="asb-side-title">${r.cat}</h3>
          <p class="asb-side-meta">${r.ala} · <b>${r.priv} m²</b> privados · ${r.camas}</p>
        </div>

        <!-- Contenedor del plano de la habitación sin recortes -->
        <div class="asb-side-drawing-box">
          ${isElectrico ? `
            <div class="asb-side-img-stage" id="asb-side-img-stage" title="Clic para ampliar en pantalla completa">
              <img src="${planImgSrc}" alt="Plano As-Built Eléctrico Habitación ${r.n}" class="asb-side-cad-img" id="asb-side-cad-img">
              <div class="asb-side-zoom-cue">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                <span>Clic para pantalla completa</span>
              </div>
            </div>
          ` : `
            <div class="asb-side-schem-stage">
              <div class="asb-side-schem-top">
                <span style="color: ${disc.color}; font-weight: 700; font-size: 0.85rem;">${disc.title}</span>
                <span style="font-size: 0.8rem; color: #94a3b8;">Escala 1:50</span>
              </div>
              ${renderRoomDetailDiagram(disc.id, r)}
            </div>
          `}
        </div>

        <!-- Barra inferior del plano: Contenido y Navegación entre habitaciones -->
        <div class="asb-side-footer">
          <div class="asb-side-info-line">
            <span><b>Lámina:</b> 1. Planta (1:50) · 2. Axonometría 3D · 3. Habitación · 4. Baño</span>
            <span class="asb-side-scale-tag">Escala 1:50</span>
          </div>

          <div class="asb-side-nav-bar">
            <button type="button" class="asb-side-nav-btn prev" id="asb-side-prev">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Anterior
            </button>
            <div class="asb-side-pills">
              ${geo.rooms.map((rm) => `
                <button type="button" class="asb-side-pill ${rm.n === activeRoom ? 'active' : ''}" data-side-pill="${rm.n}">
                  ${rm.n}
                </button>
              `).join('')}
            </div>
            <button type="button" class="asb-side-nav-btn next" id="asb-side-next">
              Siguiente <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    if (isElectrico) {
      document.getElementById('asb-side-img-stage')?.addEventListener('click', () => {
        openModal(activeRoom);
      });
    }

    document.getElementById('asb-side-prev')?.addEventListener('click', () => navigateRoom(-1));
    document.getElementById('asb-side-next')?.addEventListener('click', () => navigateRoom(1));

    inspectorEl.querySelectorAll('[data-side-pill]').forEach((b) => {
      b.addEventListener('click', () => selectRoom(b.dataset.sidePill));
    });
  }

  function renderRoomDetailDiagram(discKey, room) {
    if (discKey === 'agua') {
      return `
        <svg viewBox="0 0 500 260" class="asb-side-svg">
          <rect x="5" y="5" width="490" height="250" rx="8" fill="#0b101a" stroke="#1f2937" stroke-width="1.5"/>
          <text x="20" y="30" fill="#94a3b8" font-size="12" font-family="var(--head)" font-weight="600">ISOMÉTRICA HIDRÁULICA · HABITACIÓN ${room.n}</text>
          <line x1="50" y1="45" x2="50" y2="210" stroke="#0284c7" stroke-width="6"/>
          <line x1="70" y1="45" x2="70" y2="210" stroke="#e11d48" stroke-width="5"/>
          <text x="35" y="235" fill="#0284c7" font-size="11" font-family="var(--head)">AF Ø3/4"</text>
          <text x="75" y="235" fill="#e11d48" font-size="11" font-family="var(--head)">AC Ø3/4"</text>
          <circle cx="120" cy="85" r="6" fill="#38bdf8"/>
          <circle cx="120" cy="100" r="6" fill="#f43f5e"/>
          <text x="120" y="72" fill="#94a3b8" font-size="10" text-anchor="middle">V.C. Ø1/2"</text>
          <path d="M 50 85 L 220 85 L 220 140" fill="none" stroke="#0284c7" stroke-width="3"/>
          <path d="M 70 100 L 235 100 L 235 140" fill="none" stroke="#e11d48" stroke-width="2.5"/>
          <rect x="205" y="140" width="45" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="227" y="160" fill="#fff" font-size="11" text-anchor="middle">Lavamanos</text>
          <path d="M 50 85 L 360 85 L 360 140" fill="none" stroke="#0284c7" stroke-width="3"/>
          <path d="M 70 100 L 375 100 L 375 140" fill="none" stroke="#e11d48" stroke-width="2.5"/>
          <rect x="345" y="140" width="45" height="30" rx="4" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
          <text x="367" y="160" fill="#fff" font-size="11" text-anchor="middle">Ducha</text>
          <path d="M 50 180 L 450 180 L 450 195" fill="none" stroke="#0284c7" stroke-width="3"/>
          <rect x="430" y="195" width="40" height="25" rx="4" fill="#1e293b" stroke="#0284c7" stroke-width="1.5"/>
          <text x="450" y="212" fill="#fff" font-size="10" text-anchor="middle">WC 4.8L</text>
        </svg>
      `;
    }

    if (discKey === 'desagues') {
      return `
        <svg viewBox="0 0 500 260" class="asb-side-svg">
          <rect x="5" y="5" width="490" height="250" rx="8" fill="#0b101a" stroke="#1f2937" stroke-width="1.5"/>
          <text x="20" y="30" fill="#94a3b8" font-size="12" font-family="var(--head)" font-weight="600">RED SANITARIA Y DESAGÜES · HABITACIÓN ${room.n}</text>
          <circle cx="65" cy="120" r="24" fill="#059669" stroke="#fff" stroke-width="2.5"/>
          <text x="65" y="126" fill="#fff" font-size="13" font-weight="700" text-anchor="middle">BAN</text>
          <text x="65" y="165" fill="#34d399" font-size="11" text-anchor="middle">PVC Ø4"</text>
          <path d="M 89 120 L 260 120 L 260 160" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round"/>
          <rect x="240" y="160" width="40" height="30" rx="4" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
          <text x="260" y="180" fill="#fff" font-size="11" text-anchor="middle">Inodoro Ø4"</text>
          <path d="M 170 120 L 170 70 L 370 70" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round"/>
          <circle cx="370" cy="70" r="14" fill="#10b981" stroke="#047857" stroke-width="2"/>
          <circle cx="370" cy="70" r="4" fill="#fff"/>
          <text x="370" y="105" fill="#6ee7b7" font-size="11" text-anchor="middle">Sifón Ducha Ø2"</text>
          <path d="M 220 120 L 220 85 L 450 85 L 450 115" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round"/>
          <text x="450" y="145" fill="#6ee7b7" font-size="11" text-anchor="middle">Trampa P</text>
          <text x="180" y="140" fill="#94a3b8" font-size="10">S = 2.0%</text>
        </svg>
      `;
    }

    if (discKey === 'contraincendios') {
      return `
        <svg viewBox="0 0 500 260" class="asb-side-svg">
          <rect x="5" y="5" width="490" height="250" rx="8" fill="#0b101a" stroke="#1f2937" stroke-width="1.5"/>
          <text x="20" y="30" fill="#94a3b8" font-size="12" font-family="var(--head)" font-weight="600">RED ROCIADORES Y DETECCIÓN · HABITACIÓN ${room.n}</text>
          <line x1="30" y1="75" x2="470" y2="75" stroke="#dc2626" stroke-width="6"/>
          <text x="50" y="65" fill="#ef4444" font-size="11" font-weight="600">Red Matriz Acero Ranurado Ø2½"</text>
          <line x1="250" y1="75" x2="250" y2="150" stroke="#ef4444" stroke-width="4"/>
          <circle cx="250" cy="150" r="60" fill="rgba(239, 68, 68, 0.12)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,3"/>
          <circle cx="250" cy="150" r="14" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>
          <line x1="230" y1="150" x2="270" y2="150" stroke="#ef4444" stroke-width="2.5"/>
          <line x1="250" y1="130" x2="250" y2="170" stroke="#ef4444" stroke-width="2.5"/>
          <text x="250" y="235" fill="#fca5a5" font-size="11" font-weight="600" text-anchor="middle">Rociador QR K=5.6 (68°C) · Radio 3.0 m</text>
          <polygon points="380,135 395,150 380,165 365,150" fill="#fbbf24" stroke="#b45309" stroke-width="2"/>
          <text x="380" y="185" fill="#fef08a" font-size="10" text-anchor="middle">Detector Humo (DH)</text>
        </svg>
      `;
    }

    return '';
  }

  function navigateRoom(delta) {
    const roomKeys = geo.rooms.map((r) => r.n);
    const idx = roomKeys.indexOf(activeRoom);
    if (idx === -1) return;
    const nextIdx = (idx + delta + roomKeys.length) % roomKeys.length;
    selectRoom(roomKeys[nextIdx]);
  }

  function selectRoom(roomNum) {
    activeRoom = String(roomNum);

    container.querySelectorAll('.asb-room-chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.selectRoom === activeRoom);
    });

    const disc = DISCIPLINAS_ASBUILT[activeDisc];
    svgEl.querySelectorAll('.asb-room-polygon-g').forEach((g) => {
      const isCur = g.dataset.roomN === activeRoom;
      g.classList.toggle('selected', isCur);
      const bg = g.querySelector('.asb-room-bg');
      if (bg) {
        bg.setAttribute('fill', isCur ? disc.color + '25' : '#0c1018');
        bg.setAttribute('stroke', isCur ? disc.color : '#2d3748');
        bg.setAttribute('stroke-width', isCur ? '4' : '2');
      }
    });

    svgEl.querySelectorAll('.asb-room-lbl-g').forEach((g) => {
      const isCur = g.dataset.labelN === activeRoom;
      const rect = g.querySelector('rect');
      const txt = g.querySelector('text');
      if (rect) {
        rect.setAttribute('fill', isCur ? disc.color : '#0f1622');
        rect.setAttribute('stroke', isCur ? '#fff' : disc.color);
        rect.setAttribute('stroke-width', isCur ? '3' : '1.5');
      }
      if (txt) {
        txt.setAttribute('fill', isCur ? '#000' : '#fff');
      }
    });

    // Actualiza el plano en la COLUMNA DERECHA
    renderSideInspector();
  }

  function setDiscipline(discKey) {
    if (!DISCIPLINAS_ASBUILT[discKey]) return;
    activeDisc = discKey;

    container.querySelectorAll('.asb-pill-btn').forEach((btn) => {
      const isCur = btn.dataset.disc === activeDisc;
      btn.classList.toggle('active', isCur);
      btn.setAttribute('aria-selected', String(isCur));
    });

    renderDisciplineHeader();
    renderLegend();
    renderFloorSvg();
    renderSideInspector();
  }

  container.querySelectorAll('.asb-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setDiscipline(btn.dataset.disc);
    });
  });

  container.querySelectorAll('.asb-room-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectRoom(btn.dataset.selectRoom);
    });
  });

  setDiscipline('electrico');
  selectRoom('215');
}
