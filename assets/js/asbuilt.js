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
  arquitectonico: {
    id: 'arquitectonico',
    num: '5',
    numLabel: '5. Arquitectónico',
    title: 'Planta Arquitectónica',
    code: 'ARQ',
    color: '#b59535',
    norma: 'NSR-10 · Título K',
    tagline: 'Planta arquitectónica As-Built del Piso 2.',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18"/><path d="M3 12h9v9M12 3v5"/></svg>`,
    legend: [],
    specs: []
  },
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

// Imagen del plano por especialidad (null = esquema dibujado)
const planImg = (discId, n) => discId === 'electrico'
  ? `assets/planos/electrico/plano-elec-${n}.jpg`
  : discId === 'arquitectonico' ? 'assets/planos/planta-general.webp' : null;

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
  container.closest('section')?.classList.add('ab2-on');

  const SHORT = {
    electrico: 'Eléctrico',
    agua: 'Agua caliente y agua fría',
    desagues: 'Desagües',
    contraincendios: 'Red contraincendios',
    arquitectonico: 'Arquitectónico',
  };
  const ICONS = {
    electrico: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    agua: '<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0L12 2.7Z"/><path d="M12 11v6M9 14h6"/>',
    desagues: '<path d="M4 4h16M6 4v4a6 6 0 0 0 12 0V4M12 14v6"/><circle cx="12" cy="21" r=".8"/>',
    contraincendios: '<path d="M12 22c4 0 7-2.7 7-6.8 0-3.6-2.4-5.6-4-8.2-.5 2-1.6 3.2-3 3.7.2-3.2-1.3-6.2-4-8.7.2 3.6-3 6-3 10.6C5 19.3 8 22 12 22Z"/><path d="M12 22c1.7 0 3-1.2 3-3 0-1.6-1-2.5-2-3.8-.4 1-1 1.4-1.6 1.6C11 15 10 14 9.5 13c-.4 1.4-.5 2.6-.5 3.4 0 1.6 1.3 5.6 3 5.6Z"/>',
    arquitectonico: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  };
  const svgI = (p, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const CHEV = svgI('<polyline points="9 18 15 12 9 6"/>', 18);

  let activeDisc = 'arquitectonico';
  let activeRoom = 'general';
  const sheetPages = { '214': 0, '215': 0, '216': 0, '217': 0, '218': 0, '219': 0, '220': 0, '221': 0, '222': 0 };
  const roomSheets = {
    '222': ['Planta arquitectónica y amoblamiento', 'Elevaciones generales'],
    '221': ['Planta arquitectónica y amoblamiento', 'Pisos, enchapes y cielos'],
    '220': ['Planta arquitectónica y amoblamiento', 'Pisos, enchapes y cielos', 'Elevaciones generales'],
    '219': ['Planta arquitectónica y amoblamiento', 'Pisos, enchapes y cielos', 'Elevaciones generales'],
    '218': ['Planta arquitectónica y amoblamiento', 'Pisos, enchapes y cielos', 'Elevaciones generales'],
    '217': ['Planta arquitectónica y amoblamiento', 'Pisos, enchapes y cielos', 'Elevaciones generales'],
    '216': ['Planta arquitectónica y amoblamiento', 'Pisos, enchapes y cielos', 'Elevaciones generales'],
    '214': ['Planta arquitectónica y amoblamiento', 'Pisos, enchapes y cielos', 'Elevaciones generales'],
    '215': ['Planta arquitectónica y amoblamiento', 'Pisos, enchapes y cielos', 'Elevaciones generales', 'Detalle de baño'],
  };
  let activeView = 'planta'; // planta | redes | detalles

  const roomsMap = new Map();
  rooms.forEach((r) => roomsMap.set(String(r.n), r));
  const GEN = 'general';
  const totalPriv = rooms.reduce((a, r) => a + (Number(r.priv) || 0), 0);
  const roomInfo = (n) => roomsMap.get(String(n)) || {
    n, cat: 'Habitación Doble', ala: 'Ala Recta Norte', priv: 26.42,
    camas: '2 Camas Dobles (1600 × 2000 mm) + Poltrona + Escritorio',
  };

  container.innerHTML = `
    <div class="ab2">
      <aside class="ab2-side">
        <span class="ab2-kicker">Ingeniería &amp; Planimetría Final</span>
        <h2 class="ab2-title">Planos <span>As Built</span></h2>
        <p class="ab2-lead">Selecciona una especialidad y recorre los planos de detalle de cada habitación.</p>
        <div class="ab2-discs" role="tablist" aria-label="Especialidades As-Built">
          ${Object.values(DISCIPLINAS_ASBUILT).map((d) => `
            <button type="button" class="ab2-disc" data-disc="${d.id}" role="tab" aria-selected="false">
              <span class="ab2-disc-ic">${svgI(ICONS[d.id] || '')}</span>
              <span class="ab2-disc-lb">${SHORT[d.id] || d.title}</span>
              <span class="ab2-disc-ch">${CHEV}</span>
            </button>`).join('')}
        </div>
        <span class="ab2-rooms-k">Habitaciones</span>
        <div class="ab2-rooms" role="group" aria-label="Seleccionar habitación">
          <button type="button" class="ab2-room ab2-room-gen" data-room="general">General</button>
          ${geo.rooms.map((r) => `<button type="button" class="ab2-room" data-room="${r.n}">${r.n}</button>`).join('')}
        </div>
      </aside>

      <div class="ab2-main">
        <header class="ab2-head">
          <div class="ab2-head-txt">
            <div class="ab2-tags"><span class="ab2-badge" data-ab2-badge></span><span class="ab2-code" data-ab2-code></span></div>
            <h3 class="ab2-h" data-ab2-h></h3>
            <p class="ab2-meta" data-ab2-meta></p>
          </div>
          <div class="ab2-tools">
            <button type="button" class="ab2-tool" data-ab2-full title="Pantalla completa" aria-label="Pantalla completa">${svgI('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>')}</button>
            <a class="ab2-tool" data-ab2-down title="Descargar plano" aria-label="Descargar plano" download>${svgI('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>')}</a>
          </div>
        </header>

        <div class="ab2-sheet-nav" data-sheet-nav hidden style="align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;border-bottom:1px solid #ddd">
          <button type="button" class="ab2-tool" data-sheet-prev aria-label="Lámina anterior">←</button>
          <span data-sheet-label aria-live="polite" style="text-align:center;font-size:13px"></span>
          <button type="button" class="ab2-tool" data-sheet-next aria-label="Lámina siguiente">→</button>
        </div>
        <div class="ab2-stage" data-ab2-stage>
          <div class="ab2-pan" data-ab2-pan></div>
          <div class="ab2-zoom" role="group" aria-label="Zoom">
            <button type="button" data-zoom="in" aria-label="Acercar">${svgI('<path d="M12 5v14M5 12h14"/>', 18)}</button>
            <button type="button" data-zoom="out" aria-label="Alejar">${svgI('<path d="M5 12h14"/>', 18)}</button>
            <button type="button" data-zoom="reset" aria-label="Centrar">${svgI('<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>', 18)}</button>
          </div>
          <div class="ab2-north" aria-hidden="true"><span>N</span><svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="17" cy="17" r="15"/><path d="M17 4v26"/><path d="M17 4l-3 7h6l-3-7Z" fill="currentColor"/></svg></div>
        </div>
      </div>
    </div>

    <div class="asb-modal" id="asb-modal" hidden role="dialog" aria-modal="true" aria-label="Plano ampliado">
      <div class="asb-modal-overlay" data-close-modal></div>
      <div class="asb-modal-dialog">
        <div class="asb-modal-bar">
          <div class="asb-modal-title-group">
            <span class="asb-modal-tag" id="asb-modal-tag"></span>
            <span class="asb-modal-code" id="asb-modal-code"></span>
            <span class="asb-modal-head-txt" id="asb-modal-title"></span>
          </div>
          <button type="button" class="asb-modal-close" data-close-modal aria-label="Cerrar">${svgI('<path d="M18 6 6 18M6 6l12 12"/>', 22)}</button>
        </div>
        <div class="asb-modal-stage" id="asb-modal-stage">
          <img src="" alt="Plano As-Built" class="asb-modal-img" id="asb-modal-img">
          <div id="asb-modal-schem" class="asb-modal-schem-wrap" hidden></div>
        </div>
      </div>
    </div>
  `;

  const $ = (s) => container.querySelector(s);
  const stage = $('[data-ab2-stage]');
  const pan = $('[data-ab2-pan]');
  const down = $('[data-ab2-down]');

  /* ---- qué se ve en el lienzo ---- */
  function currentSource() {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];
    const sheets = roomSheets[activeRoom];
    if (activeDisc === 'arquitectonico' && sheets) {
      const page = sheetPages[activeRoom];
      return {
        img: `assets/planos/arquitectonico/arq-${activeRoom}-${page + 1}.webp`,
        download: `assets/planos/arquitectonico/HLF-${activeRoom}-arquitectonico.pdf`,
        label: sheets[page], code: `INT-${activeRoom}${(activeRoom === '222' ? 'AC' : 'ABCD')[page]}`,
        sheet: true, page, count: sheets.length,
      };
    }
    if (activeRoom === GEN && activeDisc === 'electrico') return { mosaic: true, label: 'Láminas eléctricas por habitación', code: 'ELE' };
    if (activeRoom === GEN) return { img: 'assets/planos/planta-general.webp', download: 'assets/planos/HLF-planta-general.pdf', label: 'Planta general · Piso 2', code: 'ARQ', planta: true };
    if (activeView === 'planta') return { img: 'assets/planos/planta-general.webp', download: 'assets/planos/HLF-planta-general.pdf', label: 'Planta arquitectónica · Piso 2', code: 'ARQ' };
    if (activeView === 'detalles') return { img: 'assets/planos/p2-acabados.png', label: 'Planta de acabados · Piso 2', code: 'ACB' };
    if (activeDisc === 'arquitectonico') return { img: 'assets/planos/p2-mobiliario.png', label: 'Planta de mobiliario · Piso 2', code: 'ARQ' };
    if (activeDisc === 'electrico') return { img: `assets/planos/electrico/plano-elec-${activeRoom}.jpg`, label: disc.title, code: disc.code };
    return { img: null, label: disc.title, code: disc.code };
  }

  /* ---- zoom y desplazamiento ---- */
  let z = 1, tx = 0, ty = 0;
  const apply = () => { pan.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`; stage.classList.toggle('is-zoomed', z > 1.01); };
  const zoomTo = (nz) => { z = Math.min(5, Math.max(1, nz)); if (z === 1) { tx = 0; ty = 0; } apply(); };
  container.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.zoom;
    if (k === 'in') zoomTo(z * 1.35); else if (k === 'out') zoomTo(z / 1.35); else zoomTo(1);
  }));
  stage.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && z === 1 && e.deltaY > 0) return; // deja hacer scroll de la página
    e.preventDefault();
    zoomTo(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });
  let drag = null;
  pan.addEventListener('pointerdown', (e) => {
    if (z <= 1) return;
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    pan.setPointerCapture(e.pointerId);
  });
  pan.addEventListener('pointermove', (e) => { if (!drag) return; tx = e.clientX - drag.x; ty = e.clientY - drag.y; apply(); });
  pan.addEventListener('pointerup', () => { drag = null; });
  pan.addEventListener('dblclick', () => { if (!currentSource().mosaic) openModal(); });

  function render() {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];
    const r = roomInfo(activeRoom);
    const src = currentSource();
    const sheetNav = $('[data-sheet-nav]');
    sheetNav.hidden = !src.sheet;
    sheetNav.style.display = src.sheet ? 'flex' : 'none';
    $('[data-sheet-label]').textContent = src.sheet ? `${src.page + 1} / ${src.count} · ${src.label}` : '';
    stage.style.touchAction = src.sheet ? 'pan-y' : '';

    container.querySelectorAll('.ab2-disc').forEach((b) => {
      const on = b.dataset.disc === activeDisc;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    container.querySelectorAll('.ab2-room').forEach((b) => b.classList.toggle('active', b.dataset.room === activeRoom));
    container.querySelectorAll('[data-view]').forEach((b) => {
      const on = b.dataset.view === activeView;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });

    const gen = activeRoom === GEN;
    $('[data-ab2-badge]').textContent = gen ? 'Piso 2' : `Habitación ${r.n}`;
    $('[data-ab2-code]').textContent = src.sheet ? src.code : gen ? `Plano ${src.code}-P2` : `Plano ${src.code}-${r.n}`;
    $('[data-ab2-h]').textContent = gen ? (src.mosaic ? 'Láminas eléctricas' : 'Planta general') : src.sheet ? src.label : r.cat;
    $('[data-ab2-meta]').textContent = gen
      ? `${rooms.length} habitaciones · 3 alas · ${totalPriv.toFixed(2)} m² privados${src.mosaic ? ' · elige una lámina para abrirla' : ''}`
      : `${r.ala} · ${r.priv} m² privados · ${r.camas}`;
    $('[data-ab2-full]').toggleAttribute('disabled', !!src.mosaic);

    if (src.mosaic) {
      pan.innerHTML = `<div class="ab2-mosaic">${geo.rooms.map((rm) => `
        <button type="button" class="ab2-tile" data-go-room="${rm.n}">
          <img src="assets/planos/electrico/plano-elec-${rm.n}.jpg" alt="Lámina eléctrica habitación ${rm.n}" loading="lazy" draggable="false">
          <span>Hab. ${rm.n}</span>
        </button>`).join('')}</div>`;
      pan.querySelectorAll('[data-go-room]').forEach((b) => b.addEventListener('click', () => { activeRoom = b.dataset.goRoom; render(); }));
      down.removeAttribute('href');
      down.setAttribute('aria-disabled', 'true');
    } else if (src.img) {
      pan.innerHTML = `<img src="${src.img}" alt="${src.label} · Habitación ${r.n}" draggable="false">`;
      down.href = src.download || src.img;
      down.title = src.sheet ? `Descargar PDF completo · ${src.count} láminas` : 'Descargar plano';
      down.removeAttribute('aria-disabled');
    } else {
      pan.innerHTML = `<div class="ab2-schem">${renderRoomDetailDiagram(disc.id, r)}</div>`;
      down.removeAttribute('href');
      down.setAttribute('aria-disabled', 'true');
    }
    stage.classList.toggle('is-planta', !!src.planta || activeView !== 'redes' || activeDisc === 'arquitectonico');
    stage.classList.toggle('is-mosaic', !!src.mosaic);
    stage.classList.remove('swap'); void stage.offsetWidth; stage.classList.add('swap');
    zoomTo(1);
  }

  function moveSheet(delta) {
    if (!currentSource().sheet) return;
    const count = roomSheets[activeRoom].length;
    sheetPages[activeRoom] = (sheetPages[activeRoom] + delta + count) % count;
    render();
  }
  $('[data-sheet-prev]').addEventListener('click', () => moveSheet(-1));
  $('[data-sheet-next]').addEventListener('click', () => moveSheet(1));
  stage.tabIndex = 0;
  stage.addEventListener('keydown', (e) => {
    if (!currentSource().sheet || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault(); moveSheet(e.key === 'ArrowRight' ? 1 : -1);
  });
  let swipe = null;
  stage.addEventListener('pointerdown', (e) => {
    if (!currentSource().sheet || z > 1 || e.target.closest('button')) return;
    swipe = { x: e.clientX, y: e.clientY, id: e.pointerId };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointerup', (e) => {
    if (!swipe || swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) moveSheet(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { swipe = null; });

  function setDiscipline(k) {
    if (!DISCIPLINAS_ASBUILT[k]) return;
    activeDisc = k;
    activeView = k === 'arquitectonico' ? 'planta' : 'redes';
    render();
  }

  container.querySelectorAll('.ab2-disc').forEach((b) => b.addEventListener('click', () => setDiscipline(b.dataset.disc)));
  container.querySelectorAll('.ab2-room').forEach((b) => b.addEventListener('click', () => { activeRoom = b.dataset.room; render(); }));
  $('[data-ab2-full]').addEventListener('click', () => openModal());

  /* ---- pantalla completa ---- */
  const modalEl = document.getElementById('asb-modal');
  const modalImg = document.getElementById('asb-modal-img');
  const modalSchem = document.getElementById('asb-modal-schem');
  function openModal() {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];
    const r = roomInfo(activeRoom);
    const src = currentSource();
    if (src.mosaic) return;
    const gen = activeRoom === GEN;
    document.getElementById('asb-modal-tag').textContent = gen ? 'PISO 2' : `HABITACIÓN ${r.n}`;
    document.getElementById('asb-modal-code').textContent = src.sheet ? src.code : `PLANO ${src.code}-${gen ? 'P2' : r.n}`;
    document.getElementById('asb-modal-title').textContent = gen ? src.label : `${src.label} · ${r.cat} · ${r.priv} m²`;
    if (src.img) {
      modalImg.src = src.img; modalImg.hidden = false; modalSchem.hidden = true;
    } else {
      modalImg.hidden = true; modalSchem.hidden = false;
      modalSchem.innerHTML = renderRoomDetailDiagram(disc.id, r);
    }
    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() { modalEl.hidden = true; document.body.style.overflow = ''; }
  container.querySelectorAll('[data-close-modal]').forEach((b) => b.addEventListener('click', closeModal));
  window.addEventListener('keydown', (e) => { if (!modalEl.hidden && e.key === 'Escape') closeModal(); });

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


  setDiscipline('arquitectonico');
}
