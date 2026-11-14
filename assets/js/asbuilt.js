// Visor As-Built · Hotel Estelar La Fontana (Piso 2)
// Disciplinas: 1. Eléctrico | 2. Agua Caliente y agua fría | 3. Desagües | 4. Red contraincendios
// Plena fidelidad técnica, visualización de planos reales por habitación, navegación y visor con zoom/arrastre.

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
    title: 'Red Eléctrica',
    code: 'ELE',
    color: '#eab308',
    norma: 'RETIE / RETILAP · NTC 2050',
    tagline: 'Iluminación LED 3000K, tomas 110V + USB, fuerza y tablero TE-P2',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    hasRoomDrawings: true,
    drawingPrefix: 'assets/planos/electrico/plano-elec-',
    legend: [
      { label: 'Circuito Alumbrado / Tomas (120V)', color: '#eab308', type: 'line' },
      { label: 'Luminaria LED Downlight (3000K)', color: '#fef08a', type: 'circle' },
      { label: 'Luz Indirecta LED (Cabecero / Espejo)', color: '#fbbf24', type: 'dash' },
      { label: 'Toma Doble 110V + USB / GFCI', color: '#f59e0b', type: 'square' },
      { label: 'Tablero Eléctrico TE-P2', color: '#ef4444', type: 'box' },
    ],
    specs: [
      { label: 'Carga Conectada', val: '18.4 kW' },
      { label: 'Tablero General', val: 'TE-P2 · 24 Circuitos' },
      { label: 'Iluminación', val: 'LED 3000K Dimerizable' },
      { label: 'Láminas As-Built', val: '12 planos de habitación (1:50)' },
    ]
  },
  agua: {
    id: 'agua',
    num: '2',
    numLabel: '2. Agua Caliente y agua fría',
    title: 'Agua Caliente y Agua Fría',
    code: 'HID',
    color: '#0284c7',
    norma: 'NTC 1500 · Código Colombiano de Fontanería',
    tagline: 'Suministro en PVC-P (fría) y CPVC (caliente con recirculación forzada)',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7l5.6 5.6a8 8 0 1 1-11.3 0z"/><path d="M12 11v6m-3-3h6"/></svg>`,
    hasRoomDrawings: false,
    legend: [
      { label: 'Red Agua Fría Potable (PVC-P Ø3/4" / Ø1/2")', color: '#0284c7', type: 'line' },
      { label: 'Red Agua Caliente Recirculada (CPVC Ø3/4" / Ø1/2")', color: '#e11d48', type: 'line' },
      { label: 'Válvula de Corte Esférica (V.C.)', color: '#38bdf8', type: 'circle' },
      { label: 'Montante Principal / Riser AF-AC', color: '#0ea5e9', type: 'box' },
    ],
    specs: [
      { label: 'Presión en Griferías', val: '38 - 45 PSI constante' },
      { label: 'Caudal de Diseño', val: '3.45 L/s (Piso 2)' },
      { label: 'Tubería Agua Fría', val: 'PVC Presión RDE 21' },
      { label: 'Tubería Agua Caliente', val: 'CPVC SCH 80 recirculada' },
    ]
  },
  desagues: {
    id: 'desagues',
    num: '3',
    numLabel: '3. Desagües',
    title: 'Desagües y Red Sanitaria',
    code: 'SAN',
    color: '#10b981',
    norma: 'NTC 1500 · Desagües y Ventilación Sanitaria',
    tagline: 'Evacuación por gravedad en PVC Sanitario 4" y 2" con bajantes BAN',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5a4 4 0 0 0 8 0V4"/><path d="M12 9a4 4 0 0 0 8 0V4"/><path d="M4 4h16"/><path d="M12 13v7"/><circle cx="12" cy="21" r="1"/></svg>`,
    hasRoomDrawings: false,
    legend: [
      { label: 'Desagüe Sanitario Aguas Negras (PVC Ø4")', color: '#10b981', type: 'line' },
      { label: 'Desagüe Baño y Duchas (PVC Ø2")', color: '#34d399', type: 'line' },
      { label: 'Bajante Sanitaria (BAN Ø4")', color: '#059669', type: 'box' },
      { label: 'Sifón de Piso con Rejilla Antiolores Ø3"', color: '#6ee7b7', type: 'circle' },
    ],
    specs: [
      { label: 'Pendiente Mínima', val: '2.0% hacia bajantes' },
      { label: 'Bajantes Sanitarias', val: '3 BAN registrables de piso' },
      { label: 'Ventilación', val: 'Ventilación secundaria de sifones' },
      { label: 'Sifones Registrables', val: '12 en duchas y zonas húmedas' },
    ]
  },
  contraincendios: {
    id: 'contraincendios',
    num: '4',
    numLabel: '4. Red contraincendios',
    title: 'Red Contra Incendios',
    code: 'RCI',
    color: '#ef4444',
    norma: 'NSR-10 Título J y K · NFPA 13 / NFPA 72',
    tagline: 'Rociadores automáticos QR 68°C con cobertura 100% y detectores de humo',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    hasRoomDrawings: false,
    legend: [
      { label: 'Rociador Automático QR K=5.6 (68°C)', color: '#ef4444', type: 'circle' },
      { label: 'Red Matriz Ranurada Ø2½" / Ramal Ø1"', color: '#dc2626', type: 'line' },
      { label: 'Detector Óptico de Humo Fotoeléctrico', color: '#fbbf24', type: 'square' },
      { label: 'Gabinete Contra Incendio Tipo III', color: '#b91c1c', type: 'box' },
    ],
    specs: [
      { label: 'Rociadores (Sprinklers)', val: '28 unds Quick Response (68°C)' },
      { label: 'Radio Cobertura Rociador', val: '3.0 m (100% de habitaciones)' },
      { label: 'Detectores Fotoeléctricos', val: '18 sensores direccionables' },
      { label: 'Gabinetes GCI', val: '2 gabinetes Clase III en pasillos' },
    ]
  }
};

/**
 * Genera el trazado vectorial SVG de la ingeniería MEP correspondiente a cada disciplina.
 */
function generateMepSvg(discKey, geo, rooms) {
  const roomCenters = new Map();
  geo.rooms.forEach((r) => {
    roomCenters.set(r.n, centroid(r.main));
  });

  if (discKey === 'electrico') {
    // Red eléctrica: tablero TE-P2, alimentadores y puntos de iluminación/tomas
    let s = `<g class="mep-layer mep-elec">`;
    // Tablero en hall
    s += `<rect x="2520" y="-890" width="70" height="40" fill="#ef4444" stroke="#fff" stroke-width="2" rx="3"/>`;
    s += `<text x="2555" y="-865" fill="#fff" font-family="var(--head)" font-size="22" font-weight="700" text-anchor="middle">TE-P2</text>`;

    // Circuito matriz corredor
    s += `<path d="M 2555 -850 L 2555 -600 L 3300 -600 L 3300 200 L 3700 800" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="10,6" opacity="0.85"/>`;
    s += `<path d="M 2555 -600 L 100 -600 L -700 -600 L -700 -400" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="10,6" opacity="0.85"/>`;

    // Puntos en cada habitación
    geo.rooms.forEach((r) => {
      const [cx, cy] = roomCenters.get(r.n) || [0, 0];
      // Acometida desde pasillo
      s += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy > -600 ? cy - 120 : cy + 120}" stroke="#eab308" stroke-width="3" opacity="0.75"/>`;
      // Luminaria downlight principal
      s += `<circle cx="${cx}" cy="${cy}" r="18" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="6" fill="#ca8a04"/>`;
      // Luz indirecta cabecero
      s += `<line x1="${cx - 60}" y1="${cy - 40}" x2="${cx + 60}" y2="${cy - 40}" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/>`;
      // Tomas en muros
      s += `<rect x="${cx - 75}" y="${cy - 45}" width="14" height="14" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>`;
      s += `<rect x="${cx + 61}" y="${cy - 45}" width="14" height="14" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>`;

      // Baño si existe
      if (r.bath && r.bath[0]) {
        const [bcx, bcy] = centroid(r.bath[0]);
        s += `<circle cx="${bcx}" cy="${bcy}" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>`;
        s += `<line x1="${cx}" y1="${cy}" x2="${bcx}" y2="${bcy}" stroke="#eab308" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>`;
        s += `<rect x="${bcx - 20}" y="${bcy - 20}" width="12" height="12" fill="#ef4444" stroke="#fff" stroke-width="1.5" title="GFCI"/>`;
      }
    });
    s += `</g>`;
    return s;
  }

  if (discKey === 'agua') {
    // Red hidráulica: agua fría (azul) y caliente (magenta/rojo)
    let s = `<g class="mep-layer mep-agua">`;
    // Montante vertical en pasillo
    s += `<rect x="2490" y="-830" width="45" height="45" fill="#0284c7" stroke="#fff" stroke-width="2" rx="4"/>`;
    s += `<text x="2512" y="-800" fill="#fff" font-family="var(--head)" font-size="18" font-weight="700" text-anchor="middle">AF/AC</text>`;

    // Líneas matrices pasillo
    s += `<path d="M 2512 -785 L 2512 -580 L 3280 -580 L 3280 220 L 3680 820" fill="none" stroke="#0284c7" stroke-width="5" opacity="0.9"/>`;
    s += `<path d="M 2500 -785 L 2500 -590 L 3270 -590 L 3270 210 L 3670 810" fill="none" stroke="#e11d48" stroke-width="4" opacity="0.9"/>`;
    s += `<path d="M 2512 -580 L 80 -580 L -720 -580 L -720 -380" fill="none" stroke="#0284c7" stroke-width="5" opacity="0.9"/>`;
    s += `<path d="M 2500 -590 L 70 -590 L -730 -590 L -730 -390" fill="none" stroke="#e11d48" stroke-width="4" opacity="0.9"/>`;

    // Conexión a baños
    geo.rooms.forEach((r) => {
      const bathLoop = r.bath && r.bath[0] ? r.bath[0] : r.main;
      const [bx, by] = centroid(bathLoop);
      // Ramal frío
      s += `<line x1="${bx}" y1="${by}" x2="${bx}" y2="${by > -580 ? by - 80 : by + 80}" stroke="#0284c7" stroke-width="3"/>`;
      // Ramal caliente
      s += `<line x1="${bx - 12}" y1="${by}" x2="${bx - 12}" y2="${by > -580 ? by - 80 : by + 80}" stroke="#e11d48" stroke-width="3"/>`;
      // Válvulas de corte
      s += `<polygon points="${bx-6},${by-40} ${bx+6},${by-40} ${bx},${by-46}" fill="#38bdf8"/>`;
      s += `<polygon points="${bx-18},${by-40} ${bx-6},${by-40} ${bx-12},${by-46}" fill="#f43f5e"/>`;
      // Puntos terminales ducha y lavamanos
      s += `<circle cx="${bx + 20}" cy="${by + 10}" r="8" fill="#0284c7" stroke="#fff" stroke-width="1.5"/>`;
      s += `<circle cx="${bx + 35}" cy="${by + 10}" r="8" fill="#e11d48" stroke="#fff" stroke-width="1.5"/>`;
    });
    s += `</g>`;
    return s;
  }

  if (discKey === 'desagues') {
    // Red sanitaria: bajantes BAN, tubería PVC sanitaria 4" y 2", sifones de piso
    let s = `<g class="mep-layer mep-desagues">`;
    // 3 Bajantes de aguas negras (BAN)
    const bans = [
      { x: -740, y: -450, n: 'BAN-1' },
      { x: 1020, y: -450, n: 'BAN-2' },
      { x: 3420, y: 150, n: 'BAN-3' }
    ];
    bans.forEach((b) => {
      s += `<circle cx="${b.x}" cy="${b.y}" r="22" fill="#059669" stroke="#fff" stroke-width="2.5"/>`;
      s += `<text x="${b.x}" y="${b.y + 7}" fill="#fff" font-family="var(--head)" font-size="16" font-weight="700" text-anchor="middle">BAN</text>`;
    });

    // Conexiones de desagüe en baños
    geo.rooms.forEach((r) => {
      const bathLoop = r.bath && r.bath[0] ? r.bath[0] : r.main;
      const [bx, by] = centroid(bathLoop);
      // Trazado sanitario
      s += `<path d="M ${bx - 20} ${by + 20} L ${bx} ${by} L ${bx + 30} ${by - 30}" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>`;
      // Sifón de piso
      s += `<circle cx="${bx}" cy="${by}" r="12" fill="#10b981" stroke="#047857" stroke-width="3"/>`;
      s += `<circle cx="${bx}" cy="${by}" r="4" fill="#fff"/>`;
      // Descarga inodoro Ø4"
      s += `<rect x="${bx - 28}" y="${by + 12}" width="16" height="16" rx="3" fill="#059669" stroke="#fff" stroke-width="1.5"/>`;
      // Ramal hacia bajante más cercana
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
    // Red contra incendios: rociadores automáticos QR con cobertura y detectores
    let s = `<g class="mep-layer mep-rci">`;
    // Red matriz corredor
    s += `<path d="M -750 -550 L 2550 -550 L 3320 -550 L 3320 250 L 3720 850" fill="none" stroke="#dc2626" stroke-width="6" opacity="0.9"/>`;

    // Gabinetes contra incendio en pasillo
    s += `<rect x="500" y="-575" width="40" height="25" fill="#dc2626" stroke="#fff" stroke-width="2" rx="3"/>`;
    s += `<text x="520" y="-558" fill="#fff" font-family="var(--head)" font-size="14" font-weight="700" text-anchor="middle">GCI</text>`;
    s += `<rect x="3300" y="300" width="25" height="40" fill="#dc2626" stroke="#fff" stroke-width="2" rx="3"/>`;
    s += `<text x="3312" y="325" fill="#fff" font-family="var(--head)" font-size="14" font-weight="700" text-anchor="middle">GCI</text>`;

    // Rociadores y detectores en cada habitación
    geo.rooms.forEach((r) => {
      const [cx, cy] = roomCenters.get(r.n) || [0, 0];
      // Círculo de cobertura del rociador (radio 3m escalado)
      s += `<circle cx="${cx}" cy="${cy}" r="110" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="6,4"/>`;
      // Rociador (cruz + círculo central)
      s += `<circle cx="${cx}" cy="${cy}" r="11" fill="#ef4444" stroke="#7f1d1d" stroke-width="2.5"/>`;
      s += `<line x1="${cx - 16}" y1="${cy}" x2="${cx + 16}" y2="${cy}" stroke="#ef4444" stroke-width="2.5"/>`;
      s += `<line x1="${cx}" y1="${cy - 16}" x2="${cx}" y2="${cy + 16}" stroke="#ef4444" stroke-width="2.5"/>`;

      // Detector óptico de humo
      s += `<polygon points="${cx+45},${cy-30} ${cx+60},${cy-15} ${cx+45},${cy} ${cx+30},${cy-15}" fill="#fbbf24" stroke="#b45309" stroke-width="1.5"/>`;
    });
    s += `</g>`;
    return s;
  }

  return '';
}

/**
 * Inicializador del componente interactivo de Planos As-Built.
 */
export function initAsBuilt({ rooms, geo }) {
  const container = document.getElementById('asbuilt-container');
  if (!container) return;

  let activeDisc = 'electrico';
  let activeRoom = '215'; // habitación seleccionada por defecto

  // Bounding box del plano del Piso 2
  const xs = geo.walls.flatMap((w) => [w[0], w[2]]);
  const ys = geo.walls.flatMap((w) => [-w[1], -w[3]]);
  const pad = 90;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const vbWidth = Math.max(...xs) - minX + pad;
  const vbHeight = Math.max(...ys) - minY + pad;

  // Mapa de habitaciones por número
  const roomsMap = new Map();
  rooms.forEach((r) => roomsMap.set(String(r.n), r));

  // Render inicial del contenedor As-Built
  container.innerHTML = `
    <!-- Barra superior de las 4 disciplinas técnicas (SIN EMOJIS, SOLO FLAT ICONS) -->
    <div class="asb-disciplines-bar" role="tablist" aria-label="Especialidades As-Built">
      ${Object.values(DISCIPLINAS_ASBUILT).map((d) => `
        <button type="button" class="asb-disc-btn ${d.id === activeDisc ? 'active' : ''}" data-disc="${d.id}" role="tab" aria-selected="${d.id === activeDisc}">
          <span class="asb-disc-num-badge">${d.num}</span>
          <span class="asb-disc-icon-wrap" style="color: ${d.color};">${d.iconSvg}</span>
          <div class="asb-disc-text-wrap">
            <span class="asb-disc-title">${d.numLabel}</span>
            <span class="asb-disc-sub">${d.tagline.split(',')[0]}</span>
          </div>
        </button>
      `).join('')}
    </div>

    <!-- Banner con especificaciones de la disciplina seleccionada -->
    <div class="asb-info-banner" id="asb-info-banner"></div>

    <!-- Área principal: Planta general interactiva + Visor del plano de la habitación -->
    <div class="asb-main-grid">
      <!-- Columna 1: Planta interactiva del Piso 2 -->
      <div class="asb-plan-col">
        <div class="asb-col-header">
          <div>
            <h3>Planta General · Piso 2</h3>
            <p class="asb-col-sub">Haz clic en cualquier habitación en la planta o usa los botones para abrir su plano conforme a obra.</p>
          </div>
          <span class="asb-live-badge">Interactivo</span>
        </div>

        <!-- Barra de selector rápido de habitaciones -->
        <div class="asb-room-selector-strip" role="group" aria-label="Elegir habitación">
          <span class="asb-strip-lbl">Habitaciones:</span>
          <div class="asb-strip-buttons">
            ${geo.rooms.map((r) => `
              <button type="button" class="asb-strip-btn ${r.n === activeRoom ? 'active' : ''}" data-select-room="${r.n}">
                ${r.n}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Contenedor del SVG interactivo de la planta -->
        <div class="asb-svg-wrapper">
          <svg class="asb-floor-svg" id="asb-floor-svg" viewBox="${minX} ${minY} ${vbWidth} ${vbHeight}" role="img" aria-label="Planta técnica interactiva del Piso 2">
            <!-- La losa, corredores, muros y habitaciones se inyectan dinámicamente -->
          </svg>
          <div class="asb-plan-tooltip" id="asb-plan-tooltip" hidden></div>
        </div>

        <!-- Leyenda técnica flat de la disciplina activa -->
        <div class="asb-legend-strip" id="asb-legend-strip"></div>
      </div>

      <!-- Columna 2: Visor del plano de la habitación seleccionada -->
      <div class="asb-room-viewer-col" id="asb-room-viewer-col">
        <!-- Contenido inyectado dinámicamente por renderRoomViewer() -->
      </div>
    </div>

    <!-- Modal Lightbox de Pantalla Completa para inspeccionar el plano en alta resolución -->
    <div class="asb-modal" id="asb-modal" hidden role="dialog" aria-modal="true" aria-label="Visor ampliado de plano técnico">
      <div class="asb-modal-overlay" data-close-modal></div>
      <div class="asb-modal-content">
        <div class="asb-modal-header">
          <div class="asb-modal-title-group">
            <span class="asb-modal-badge" id="asb-modal-badge">PLANO ELE-215</span>
            <h3 id="asb-modal-title">Habitación 215 · Planta y Red Eléctrica</h3>
          </div>
          <div class="asb-modal-actions">
            <button type="button" class="asb-icon-btn" id="asb-modal-zin" title="Acercar plano">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button type="button" class="asb-icon-btn" id="asb-modal-zout" title="Alejar plano">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button type="button" class="asb-icon-btn" id="asb-modal-zreset" title="Restablecer vista">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <a href="#" target="_blank" rel="noopener" class="asb-icon-btn" id="asb-modal-open-raw" title="Abrir imagen original">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <button type="button" class="asb-close-btn" data-close-modal aria-label="Cerrar modal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="asb-modal-body" id="asb-modal-viewport">
          <img src="" alt="Plano As-Built" class="asb-modal-img" id="asb-modal-img">
        </div>
        <div class="asb-modal-footer">
          <button type="button" class="asb-nav-pill-btn prev" id="asb-modal-prev">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Habitación anterior
          </button>
          <span class="asb-modal-hint">Arrastra para moverte · Rueda para hacer zoom · Teclas ← / → para cambiar de habitación</span>
          <button type="button" class="asb-nav-pill-btn next" id="asb-modal-next">
            Habitación siguiente <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  const svgEl = document.getElementById('asb-floor-svg');
  const tooltipEl = document.getElementById('asb-plan-tooltip');
  const bannerEl = document.getElementById('asb-info-banner');
  const legendEl = document.getElementById('asb-legend-strip');
  const roomViewerCol = document.getElementById('asb-room-viewer-col');

  // Modal elements
  const modalEl = document.getElementById('asb-modal');
  const modalImg = document.getElementById('asb-modal-img');
  const modalBadge = document.getElementById('asb-modal-badge');
  const modalTitle = document.getElementById('asb-modal-title');
  const modalRawLink = document.getElementById('asb-modal-open-raw');
  const modalViewport = document.getElementById('asb-modal-viewport');

  let modalScale = 1;
  let modalPan = { x: 0, y: 0 };
  let isModalPanning = false;
  let modalStartPan = { x: 0, y: 0 };

  function updateModalTransform() {
    modalImg.style.transform = `translate(${modalPan.x}px, ${modalPan.y}px) scale(${modalScale})`;
  }

  function resetModalZoom() {
    modalScale = 1;
    modalPan = { x: 0, y: 0 };
    updateModalTransform();
  }

  // Eventos de zoom y pan en el modal
  document.getElementById('asb-modal-zin')?.addEventListener('click', () => {
    modalScale = Math.min(modalScale * 1.3, 5);
    updateModalTransform();
  });
  document.getElementById('asb-modal-zout')?.addEventListener('click', () => {
    modalScale = Math.max(modalScale / 1.3, 0.6);
    updateModalTransform();
  });
  document.getElementById('asb-modal-zreset')?.addEventListener('click', resetModalZoom);

  modalViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    modalScale = Math.min(Math.max(modalScale * factor, 0.6), 5);
    updateModalTransform();
  }, { passive: false });

  modalViewport.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isModalPanning = true;
    modalStartPan = { x: e.clientX - modalPan.x, y: e.clientY - modalPan.y };
    modalViewport.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!isModalPanning) return;
    modalPan = { x: e.clientX - modalStartPan.x, y: e.clientY - modalStartPan.y };
    updateModalTransform();
  });
  window.addEventListener('mouseup', () => {
    if (isModalPanning) {
      isModalPanning = false;
      modalViewport.style.cursor = 'grab';
    }
  });

  // Touch pan & zoom
  let touchStartDist = 0;
  let touchStartScale = 1;
  modalViewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isModalPanning = true;
      modalStartPan = { x: e.touches[0].clientX - modalPan.x, y: e.touches[0].clientY - modalPan.y };
    } else if (e.touches.length === 2) {
      isModalPanning = false;
      touchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      touchStartScale = modalScale;
    }
  }, { passive: true });
  modalViewport.addEventListener('touchmove', (e) => {
    if (isModalPanning && e.touches.length === 1) {
      modalPan = { x: e.touches[0].clientX - modalStartPan.x, y: e.touches[0].clientY - modalStartPan.y };
      updateModalTransform();
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (touchStartDist > 0) {
        modalScale = Math.min(Math.max(touchStartScale * (dist / touchStartDist), 0.6), 5);
        updateModalTransform();
      }
    }
  }, { passive: true });
  modalViewport.addEventListener('touchend', () => {
    isModalPanning = false;
  });

  function openModalForRoom(roomNum) {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];
    const rInfo = roomsMap.get(roomNum) || { n: roomNum, cat: 'Habitación', tipo: 'Estándar' };
    const imgSrc = `assets/planos/electrico/plano-elec-${roomNum}.jpg`;

    modalBadge.textContent = `PLANO ELE-${roomNum}`;
    modalBadge.style.background = disc.color;
    modalTitle.textContent = `Habitación ${roomNum} · ${rInfo.cat} (${rInfo.tipo})`;
    modalImg.src = imgSrc;
    modalRawLink.href = imgSrc;
    resetModalZoom();

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

  // Teclado en modal
  window.addEventListener('keydown', (e) => {
    if (modalEl.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigateRoom(-1, true);
    if (e.key === 'ArrowRight') navigateRoom(1, true);
  });

  function navigateRoom(delta, updateModal = false) {
    const roomKeys = geo.rooms.map((r) => r.n);
    const idx = roomKeys.indexOf(activeRoom);
    if (idx === -1) return;
    const nextIdx = (idx + delta + roomKeys.length) % roomKeys.length;
    selectRoom(roomKeys[nextIdx]);
    if (updateModal && !modalEl.hidden) {
      openModalForRoom(roomKeys[nextIdx]);
    }
  }

  document.getElementById('asb-modal-prev')?.addEventListener('click', () => navigateRoom(-1, true));
  document.getElementById('asb-modal-next')?.addEventListener('click', () => navigateRoom(1, true));

  /**
   * Actualiza el banner superior de la disciplina activa
   */
  function renderBanner() {
    const d = DISCIPLINAS_ASBUILT[activeDisc];
    bannerEl.innerHTML = `
      <div class="asb-banner-left">
        <span class="asb-disc-tag" style="background: ${d.color}22; color: ${d.color}; border: 1px solid ${d.color}55;">
          ${d.code} · As-Built
        </span>
        <h4 class="asb-banner-title">${d.title}</h4>
        <p class="asb-banner-desc">${d.tagline}. Norma técnica de referencia: <b>${d.norma}</b>.</p>
      </div>
      <div class="asb-banner-specs">
        ${d.specs.map((s) => `
          <div class="asb-spec-chip">
            <span class="asb-spec-val">${s.val}</span>
            <span class="asb-spec-lbl">${s.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Actualiza la leyenda flat en la columna del plano
   */
  function renderLegend() {
    const d = DISCIPLINAS_ASBUILT[activeDisc];
    legendEl.innerHTML = `
      <span class="asb-leg-title">Convenciones:</span>
      <div class="asb-leg-items">
        ${d.legend.map((l) => `
          <div class="asb-leg-item">
            <span class="asb-leg-swatch ${l.type}" style="--c: ${l.color}; background-color: ${l.type === 'line' ? 'transparent' : l.color}; border-color: ${l.color};"></span>
            <span class="asb-leg-text">${l.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Dibuja la planta del Piso 2 con el fondo arquitectónico y la capa MEP activa
   */
  function renderFloorSvg() {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];

    // Capa base arquitectónica
    let svgHtml = `
      <!-- Losa y circulaciones -->
      ${geo.slab.map((l) => `<path class="asb-slab" d="${pathOf(l)}" fill="#121824" stroke="#253047" stroke-width="4"/>`).join('')}
      ${geo.corridor.map((l) => `<path class="asb-circ" d="${pathOf(l)}" fill="#172033" stroke="#334155" stroke-width="3"/>`).join('')}

      <!-- Habitaciones interactivas -->
      <g class="asb-rooms-group">
        ${geo.rooms.map((r) => {
          const isSelected = r.n === activeRoom;
          return `
            <g class="asb-room-polygon-g ${isSelected ? 'selected' : ''}" data-room-n="${r.n}">
              <path class="asb-room-bg" d="${pathOf(r.main)}" fill="${isSelected ? disc.color + '25' : '#0c111c'}" stroke="${isSelected ? disc.color : '#334155'}" stroke-width="${isSelected ? 4 : 2}"/>
              ${r.bath.map((b) => `<path class="asb-bath-bg" d="${pathOf(b)}" fill="${isSelected ? disc.color + '33' : '#0f1624'}" stroke="${isSelected ? disc.color : '#334155'}" stroke-width="2"/>`).join('')}
            </g>
          `;
        }).join('')}
      </g>

      <!-- Núcleos de escaleras y columnas estructurales -->
      ${geo.stairs.map(([a, b, c, d]) => `<rect class="asb-stair" x="${a}" y="${-d}" width="${c - a}" height="${d - b}" fill="#1e293b" stroke="#475569" stroke-width="2" stroke-dasharray="6,4"/>`).join('')}
      ${geo.walls.map(([a, b, c, d, t]) => `<line class="asb-wall" x1="${a}" y1="${-b}" x2="${c}" y2="${-d}" stroke="#64748b" stroke-width="${Math.max(t, 6)}" stroke-linecap="round"/>`).join('')}
      ${geo.columns.map(([a, b, c, d]) => `<rect class="asb-col" x="${a}" y="${-d}" width="${c - a}" height="${d - b}" fill="#475569" stroke="#94a3b8" stroke-width="1.5"/>`).join('')}

      <!-- Capa de ingeniería MEP de la disciplina activa -->
      ${generateMepSvg(activeDisc, geo, rooms)}

      <!-- Rótulos de número de habitación -->
      <g class="asb-room-labels">
        ${geo.rooms.map((r) => {
          const [cx, cy] = centroid(r.main);
          const isSelected = r.n === activeRoom;
          return `
            <g class="asb-label-group" data-label-n="${r.n}">
              <rect x="${cx - 36}" y="${cy - 20}" width="72" height="40" rx="8" fill="${isSelected ? disc.color : '#0f172a'}" stroke="${isSelected ? '#fff' : disc.color}" stroke-width="${isSelected ? 3 : 2}" opacity="0.95"/>
              <text class="asb-label-txt" x="${cx}" y="${cy + 7}" fill="${isSelected ? '#000' : '#fff'}" font-family="var(--head)" font-size="24" font-weight="700" text-anchor="middle">${r.n}</text>
            </g>
          `;
        }).join('')}
      </g>
    `;

    svgEl.innerHTML = svgHtml;

    // Vincular interactividad de clic y hover en las habitaciones
    attachRoomEvents();
  }

  /**
   * Eventos sobre los polígonos de habitación en el SVG
   */
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
        tooltipEl.innerHTML = `<b>Habitación ${rInfo.n}</b> · ${rInfo.tipo}<br><small>${rInfo.cat} · ${rInfo.priv} m² · <i>Clic para ver plano</i></small>`;
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
   * Renderiza la columna derecha con el plano de detalle de la habitación
   */
  function renderRoomViewer() {
    const disc = DISCIPLINAS_ASBUILT[activeDisc];
    const r = roomsMap.get(activeRoom) || {
      n: activeRoom,
      tipo: 'Habitación',
      cat: 'Estándar',
      ala: 'Ala Piso 2',
      priv: 26.4,
      cons: 30.1,
      camas: 'Dotación hotelera'
    };

    const hasRealDrawing = disc.id === 'electrico';
    const planImgSrc = `assets/planos/electrico/plano-elec-${r.n}.jpg`;

    roomViewerCol.innerHTML = `
      <!-- Encabezado de la habitación seleccionada -->
      <div class="asb-viewer-card">
        <div class="asb-viewer-top">
          <div class="asb-v-title-wrap">
            <span class="asb-room-badge" style="background: ${disc.color}; color: #000;">
              HABITACIÓN ${r.n}
            </span>
            <h4>${r.cat} · <span class="asb-room-type">${r.tipo}</span></h4>
            <p class="asb-room-meta">${r.ala} · <b>${r.priv} m²</b> privados (${r.cons} m² const.)</p>
          </div>
          <div class="asb-v-disc-tag" style="border-color: ${disc.color}; color: ${disc.color};">
            Plano As-Built ${disc.code}-${r.n}
          </div>
        </div>

        <p class="asb-room-bedding"><b>Dotación:</b> ${r.camas}</p>

        <!-- Contenedor del plano -->
        <div class="asb-plan-frame">
          ${hasRealDrawing ? `
            <!-- Visor del plano eléctrico real (ELE-214 a ELE-225) -->
            <div class="asb-img-canvas-wrap" id="asb-preview-wrap" title="Haz clic para abrir pantalla completa">
              <img src="${planImgSrc}" alt="Plano As-Built Eléctrico Habitación ${r.n}" class="asb-sheet-img" id="asb-sheet-img">
              <div class="asb-frame-controls">
                <button type="button" class="asb-f-btn" id="asb-f-expand" title="Ver en Pantalla Completa">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg> Pantalla completa
                </button>
                <a href="${planImgSrc}" target="_blank" rel="noopener" class="asb-f-btn" title="Descargar / Abrir original">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
              <span class="asb-click-hint">Haz clic sobre el plano para ampliar con zoom</span>
            </div>
            <!-- Resumen de contenido de la lámina -->
            <div class="asb-sheet-footer-info">
              <span class="asb-sheet-views-badge">4 Vistas Técnicas:</span>
              <p><b>1.</b> Planta Eléctrica (1:50) · <b>2.</b> Axonometría 3D de Red · <b>3.</b> Detalle Eléctrico Habitación · <b>4.</b> Detalle Baño</p>
              <div class="asb-sheet-meta-row">
                <span>Escala: <b>1:50</b></span>
                <span>Dibujo: <b>Autodesk Revit / As-Built</b></span>
                <span>Firma: <b>BACO Studio / Estelar</b></span>
              </div>
            </div>
          ` : `
            <!-- Esquema de detalle técnico para disciplinas 2, 3 y 4 -->
            <div class="asb-schematic-wrap">
              <div class="asb-schem-badge-line">
                <span class="asb-schem-tag" style="background: ${disc.color}22; color: ${disc.color}; border: 1px solid ${disc.color};">
                  ${disc.title} · Habitación ${r.n}
                </span>
                <span class="asb-schem-scale">Conforme a Obra · Escala 1:50</span>
              </div>
              <div class="asb-schem-diagram">
                ${renderRoomDetailDiagram(disc.id, r)}
              </div>
              <div class="asb-schem-specs-table">
                <table>
                  <tbody>
                    ${disc.specs.map((sp) => `
                      <tr>
                        <td>${sp.label}</td>
                        <td><b>${sp.val}</b></td>
                      </tr>
                    `).join('')}
                    <tr>
                      <td>Inspección de Obra</td>
                      <td><b>Verificado conforme a normativa ${disc.norma}</b></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `}
        </div>

        <!-- Barra inferior para cambiar rápidamente de habitación -->
        <div class="asb-viewer-nav-bar">
          <button type="button" class="asb-v-nav-btn prev" id="asb-v-prev">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Habitación anterior
          </button>
          <div class="asb-v-room-pills">
            ${geo.rooms.map((rm) => `
              <button type="button" class="asb-v-pill ${rm.n === activeRoom ? 'active' : ''}" data-nav-room="${rm.n}">
                ${rm.n}
              </button>
            `).join('')}
          </div>
          <button type="button" class="asb-v-nav-btn next" id="asb-v-next">
            Habitación siguiente <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    `;

    // Vincular clic para abrir pantalla completa
    if (hasRealDrawing) {
      document.getElementById('asb-preview-wrap')?.addEventListener('click', () => {
        openModalForRoom(activeRoom);
      });
      document.getElementById('asb-f-expand')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openModalForRoom(activeRoom);
      });
    }

    // Vincular botones anterior / siguiente
    document.getElementById('asb-v-prev')?.addEventListener('click', () => navigateRoom(-1));
    document.getElementById('asb-v-next')?.addEventListener('click', () => navigateRoom(1));

    // Píldoras de habitación
    roomViewerCol.querySelectorAll('[data-nav-room]').forEach((b) => {
      b.addEventListener('click', () => selectRoom(b.dataset.navRoom));
    });
  }

  /**
   * Genera diagrama vectorial esquemático para disciplinas hidráulica, sanitaria o contra incendios
   */
  function renderRoomDetailDiagram(discKey, room) {
    if (discKey === 'agua') {
      return `
        <svg viewBox="0 0 500 240" class="asb-detail-svg">
          <rect x="10" y="10" width="480" height="220" rx="8" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
          <text x="30" y="40" fill="#94a3b8" font-size="13" font-family="var(--head)" font-weight="600">ISOMÉTRICA DE DISTRIBUCIÓN HIDRÁULICA · HABITACIÓN ${room.n}</text>
          <!-- Riser principal -->
          <line x1="60" y1="50" x2="60" y2="200" stroke="#0284c7" stroke-width="6"/>
          <line x1="80" y1="50" x2="80" y2="200" stroke="#e11d48" stroke-width="5"/>
          <text x="50" y="215" fill="#0284c7" font-size="11" font-family="var(--head)">AF Ø3/4"</text>
          <text x="90" y="215" fill="#e11d48" font-size="11" font-family="var(--head)">AC Ø3/4"</text>
          <!-- Ramal a lavamanos -->
          <path d="M 60 90 L 220 90 L 220 140" fill="none" stroke="#0284c7" stroke-width="4"/>
          <path d="M 80 105 L 235 105 L 235 140" fill="none" stroke="#e11d48" stroke-width="3"/>
          <rect x="205" y="140" width="45" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="227" y="160" fill="#fff" font-size="11" text-anchor="middle">Lavamanos</text>
          <!-- Ramal a ducha -->
          <path d="M 60 90 L 370 90 L 370 140" fill="none" stroke="#0284c7" stroke-width="4"/>
          <path d="M 80 105 L 385 105 L 385 140" fill="none" stroke="#e11d48" stroke-width="3"/>
          <rect x="355" y="140" width="45" height="30" rx="4" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
          <text x="377" y="160" fill="#fff" font-size="11" text-anchor="middle">Ducha</text>
          <!-- Ramal a inodoro (solo agua fría) -->
          <path d="M 60 170 L 460 170 L 460 185" fill="none" stroke="#0284c7" stroke-width="4"/>
          <rect x="440" y="185" width="40" height="25" rx="4" fill="#1e293b" stroke="#0284c7" stroke-width="1.5"/>
          <text x="460" y="202" fill="#fff" font-size="10" text-anchor="middle">WC 4.8L</text>
          <!-- Válvulas de corte -->
          <circle cx="120" cy="90" r="6" fill="#38bdf8"/>
          <circle cx="120" cy="105" r="6" fill="#f43f5e"/>
          <text x="120" y="78" fill="#94a3b8" font-size="10" text-anchor="middle">V.C. Ø1/2"</text>
        </svg>
      `;
    }

    if (discKey === 'desagues') {
      return `
        <svg viewBox="0 0 500 240" class="asb-detail-svg">
          <rect x="10" y="10" width="480" height="220" rx="8" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
          <text x="30" y="40" fill="#94a3b8" font-size="13" font-family="var(--head)" font-weight="600">ISOMÉTRICA DE RED SANITARIA Y DESAGÜES · HABITACIÓN ${room.n}</text>
          <!-- Bajante BAN -->
          <circle cx="70" cy="110" r="26" fill="#059669" stroke="#fff" stroke-width="2.5"/>
          <text x="70" y="116" fill="#fff" font-size="14" font-weight="700" text-anchor="middle">BAN</text>
          <text x="70" y="152" fill="#34d399" font-size="11" text-anchor="middle">PVC Ø4"</text>
          <!-- Tubería principal hacia WC -->
          <path d="M 96 110 L 260 110 L 260 150" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round"/>
          <rect x="240" y="150" width="40" height="30" rx="4" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
          <text x="260" y="170" fill="#fff" font-size="11" text-anchor="middle">Inodoro Ø4"</text>
          <!-- Ramal a sifón de ducha Ø2" -->
          <path d="M 180 110 L 180 60 L 370 60" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round"/>
          <circle cx="370" cy="60" r="14" fill="#10b981" stroke="#047857" stroke-width="2.5"/>
          <circle cx="370" cy="60" r="4" fill="#fff"/>
          <text x="370" y="92" fill="#6ee7b7" font-size="11" text-anchor="middle">Sifón Ducha Ø2"</text>
          <!-- Ramal a lavamanos con trampa P -->
          <path d="M 230 110 L 230 80 L 450 80 L 450 110" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round"/>
          <path d="M 450 110 Q 450 125 440 125 Q 430 125 430 110" fill="none" stroke="#34d399" stroke-width="3"/>
          <text x="440" y="148" fill="#6ee7b7" font-size="11" text-anchor="middle">Trampa P Lavamanos</text>
          <!-- Pendiente -->
          <text x="200" y="130" fill="#94a3b8" font-size="11">S = 2.0%</text>
        </svg>
      `;
    }

    if (discKey === 'contraincendios') {
      return `
        <svg viewBox="0 0 500 240" class="asb-detail-svg">
          <rect x="10" y="10" width="480" height="220" rx="8" fill="#080e1a" stroke="#1e293b" stroke-width="2"/>
          <text x="30" y="40" fill="#94a3b8" font-size="13" font-family="var(--head)" font-weight="600">DISTRIBUCIÓN DE ROCIADORES Y DETECCIÓN · HABITACIÓN ${room.n}</text>
          <!-- Red matriz en pasillo -->
          <line x1="40" y1="80" x2="460" y2="80" stroke="#dc2626" stroke-width="7"/>
          <text x="60" y="70" fill="#ef4444" font-size="12" font-weight="600">Tubería Matriz Acero Ranurado Ø2½"</text>
          <!-- Ramal a habitación -->
          <line x1="250" y1="80" x2="250" y2="150" stroke="#ef4444" stroke-width="4"/>
          <!-- Rociador automático con cobertura -->
          <circle cx="250" cy="150" r="55" fill="rgba(239, 68, 68, 0.12)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,3"/>
          <circle cx="250" cy="150" r="14" fill="#ef4444" stroke="#7f1d1d" stroke-width="3"/>
          <line x1="230" y1="150" x2="270" y2="150" stroke="#ef4444" stroke-width="3"/>
          <line x1="250" y1="130" x2="250" y2="170" stroke="#ef4444" stroke-width="3"/>
          <text x="250" y="218" fill="#fca5a5" font-size="11" font-weight="600" text-anchor="middle">Rociador QR K=5.6 (68°C) · Cobertura Radio 3.0m</text>
          <!-- Detector de humo -->
          <polygon points="380,135 395,150 380,165 365,150" fill="#fbbf24" stroke="#b45309" stroke-width="2"/>
          <text x="380" y="185" fill="#fef08a" font-size="11" text-anchor="middle">Detector Fotoeléctrico (DH)</text>
        </svg>
      `;
    }

    return '';
  }

  /**
   * Cambia la disciplina activa (1. Eléctrico, 2. Agua, 3. Desagües, 4. Incendios)
   */
  function setDiscipline(discKey) {
    if (!DISCIPLINAS_ASBUILT[discKey]) return;
    activeDisc = discKey;

    // Actualizar botones de disciplina
    container.querySelectorAll('.asb-disc-btn').forEach((btn) => {
      const isCur = btn.dataset.disc === activeDisc;
      btn.classList.toggle('active', isCur);
      btn.setAttribute('aria-selected', String(isCur));
    });

    renderBanner();
    renderLegend();
    renderFloorSvg();
    renderRoomViewer();
  }

  /**
   * Selecciona una habitación
   */
  function selectRoom(roomNum) {
    activeRoom = String(roomNum);

    // Actualizar botones de selector rápido
    container.querySelectorAll('.asb-strip-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.selectRoom === activeRoom);
    });

    // Actualizar estados visuales en el SVG
    svgEl.querySelectorAll('.asb-room-polygon-g').forEach((g) => {
      const isCur = g.dataset.roomN === activeRoom;
      g.classList.toggle('selected', isCur);
      const disc = DISCIPLINAS_ASBUILT[activeDisc];
      const bg = g.querySelector('.asb-room-bg');
      if (bg) {
        bg.setAttribute('fill', isCur ? disc.color + '25' : '#0c111c');
        bg.setAttribute('stroke', isCur ? disc.color : '#334155');
        bg.setAttribute('stroke-width', isCur ? '4' : '2');
      }
    });

    svgEl.querySelectorAll('.asb-label-group').forEach((g) => {
      const isCur = g.dataset.labelN === activeRoom;
      const rect = g.querySelector('rect');
      const txt = g.querySelector('text');
      const disc = DISCIPLINAS_ASBUILT[activeDisc];
      if (rect) {
        rect.setAttribute('fill', isCur ? disc.color : '#0f172a');
        rect.setAttribute('stroke', isCur ? '#fff' : disc.color);
        rect.setAttribute('stroke-width', isCur ? '3' : '2');
      }
      if (txt) {
        txt.setAttribute('fill', isCur ? '#000' : '#fff');
      }
    });

    // Renderizar panel de plano de la habitación
    renderRoomViewer();
  }

  // Eventos de botones de disciplina
  container.querySelectorAll('.asb-disc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setDiscipline(btn.dataset.disc);
    });
  });

  // Eventos de botones de la tira de habitaciones
  container.querySelectorAll('.asb-strip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectRoom(btn.dataset.selectRoom);
    });
  });

  // Inicializar estado inicial
  setDiscipline('electrico');
  selectRoom('215');
}
