// Visor 3D del Hotel La Fontana: el ala del modelo Revit HLF_P2-P6 (exportada piso por piso) sobre su
// contexto inmediato (alas del hotel con cubierta de teja, edificios del catastro, calzadas, andenes y
// arbolado con árboles escaneados).
//
// Transición: al llegar, los pisos caen uno sobre otro; al abrir el Piso 2 los pisos de arriba suben en
// abanico y desaparecen mientras la cámara vuela hasta él; al volver, bajan a su sitio. Al elegir una
// habitación solo esa se colorea (azul con contorno dorado).
//
// Unidades: metros. x = este, y = altura, z = -norte (sistema local del proyecto).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const NAVY = 0x0e3064;
const GOLD = 0xb59535;
const BG = 0xdcdedb;                 // tono del horizonte (niebla y fondo de respaldo)
const MOBILE = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const P2_Y = 3.0;                    // cota del Piso 2
const ROOM_H = 2.6;
const OPEN_FLOOR = 'PISO 2';
const BANDS = ['PISO 1', 'PISO 2', 'PISO 3', 'PISO 4', 'PISO 5', 'PISO 6', 'CUBIERTA'];
const gsap = window.gsap;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ------------------------------------------------------------------ texturas reales
const texLoader = new THREE.TextureLoader();
const texCache = new Map();
function tex(name, metres = 1, rx = null, ry = null) {
  const key = `${name}|${metres}|${rx}|${ry}`;
  if (texCache.has(key)) return texCache.get(key);
  const t = texLoader.load(`assets/tex/${name}`, undefined, undefined, () => {});
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx ?? 1 / metres, ry ?? 1 / metres);
  t.anisotropy = 8;
  texCache.set(key, t);
  return t;
}

// La geometría es la del modelo de Revit tal cual. Cada material de Revit (por su nombre) recibe su
// textura real del catálogo de acabados; el que no tiene regla conserva su color de Revit.
// Las texturas se proyectan en triplanar (coordenadas del mundo, en metros): no dependen de las UV del modelo.
const RULES = [
  [/LADRILLO|MAMPOSTER/i, { map: ['ladrillo.webp', 1.2], roughness: 0.92, tint: 0xf0e2d8, macro: 0.32 }],
  [/TEJA|Default Roof/i, { map: ['teja.webp', 2.0], roughness: 0.88, tint: 0xe6d2c6, macro: 0.4 }],
  [/VINIL|VETA/i, { map: ['piso-madera.webp', 1.6], roughness: 0.55 }],
  [/SANTORINI/i, { map: ['santorini.webp', 1.2], roughness: 0.35 }],
  [/MOS THE DREAM/i, { map: ['mosaico.webp', 0.6], roughness: 0.4 }],
  [/ALFOMBRA/i, { map: ['alfombra-hall.webp', 2.0], roughness: 1 }],
  [/MARMOL|PHANTOM|Amazonico|SINTERIZADA/i, { map: ['piedra-phantom.webp', 1.2], roughness: 0.25 }],
  [/SIKUANI|Sikuani|MELAMINA|FORMICA|ALERO|CABECERO/i, { map: ['nogal.webp', 1.2], roughness: 0.55 }],
  [/PAPEL TAPIZ TEJIDO OLIVA/i, { map: ['tejido-oliva.webp', 0.8], roughness: 0.95 }],
  [/PAPEL|Lismore/i, { map: ['papel-tessera.webp', 1.0], roughness: 0.9 }],
  [/TEJIDO TERRACOTA/i, { map: ['tejido-terracota.webp', 0.5], roughness: 1 }],
  [/TA-01|Carpet/i, { map: ['tapete-lana.webp', 2.0], roughness: 1 }],
  [/TAPETE|TA-04/i, { map: ['tapete-puntos.webp', 2.0], roughness: 1 }],
  [/PLAZA ABANICO/i, { map: ['plaza-abanico.webp', 4.0], roughness: 0.85, macro: 0.25 }],
  [/ANDEN ADOQUIN/i, { map: ['adoquin-arcilla.webp', 1.5], roughness: 0.9, tint: 0xe4d6cf, macro: 0.25 }],
  [/ASFALTO/i, { map: ['asfalto.webp', 4.0], roughness: 0.95, macro: 0.3 }],
  [/LOSETA CONCRETO|CONCRETO EXISTENTE|JARDINERA CONCRETO|Cast-in-Place/i, { map: ['loseta-concreto.webp', 2.0], roughness: 0.92, macro: 0.25 }],
  [/PODOTACTIL/i, { map: ['podotactil.webp', 1.0], roughness: 0.9 }],
  [/hlf_adoquin/i, { map: ['adoquin-vehicular.webp', 2.0], roughness: 0.9, macro: 0.25 }],
  [/HIEDRA/i, { map: ['seto-verde.webp', 1.5], roughness: 1 }],
  [/VIDRIO LUZ CALIDA/i, { color: 0xffe2a8, emissive: 0xffc870, emissiveIntensity: 1.2, roughness: 0.2 }],
  // vidrio: oscuro y reflectivo (refleja el cielo), como se ve una ventana real desde afuera
  [/VIDRIO|Glass/i, { color: 0x24323a, roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.78, envMapIntensity: 2.2 }],
  [/Mirror|Aluminum|Stainless/i, { color: 0xd8dadc, roughness: 0.15, metalness: 0.9 }],
  [/Sthal|ACERO|MARCO NEGRO/i, { color: 0x2b2c2e, roughness: 0.38, metalness: 0.75 }],
  [/DORADO|BRONCE|LATON/i, { color: 0xb59535, roughness: 0.3, metalness: 0.85 }],
  [/PINTURA BLANCA|HLF-BLANCO|HLF-WHITE|SOBRE LAS NUBES|BALAUSTRE/i, { color: 0xeeebe4, roughness: 0.85 }],
  [/LED|Luz/i, { color: 0xfff1d8, emissive: 0xffe2b0, emissiveIntensity: 1 }],
];

/** Proyección triplanar en coordenadas del mundo + variación grande para que no se note la repetición. */
function triplanar(m, metres, macro = 0) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTri = { value: 1 / metres };
    sh.uniforms.uMacro = { value: macro };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvTriP = (modelMatrix * vec4(transformed, 1.0)).xyz; vTriN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN; uniform float uTri; uniform float uMacro;')
      .replace('#include <map_fragment>', `
        vec3 tw = pow(abs(normalize(vTriN)), vec3(4.0)); tw /= (tw.x + tw.y + tw.z + 1e-5);
        vec3 tp = vTriP * uTri;
        vec4 tc = texture2D(map, tp.zy) * tw.x + texture2D(map, tp.xz) * tw.y + texture2D(map, tp.xy) * tw.z;
        if (uMacro > 0.0) {   // manchas y desgaste a escala de fachada
          vec3 tq = vTriP * uTri * 0.071;
          float mac = dot(texture2D(map, tq.zy).rgb * tw.x + texture2D(map, tq.xz).rgb * tw.y + texture2D(map, tq.xy).rgb * tw.z, vec3(0.333));
          tc.rgb *= mix(1.0 - uMacro, 1.0 + uMacro * 0.5, smoothstep(0.15, 0.7, mac));
        }
        diffuseColor *= tc;`);
  };
  m.customProgramCacheKey = () => `tri${metres}_${macro}`;
}

function materialFor(src) {
  const name = src.name || '';
  for (const [re, def] of RULES) {
    if (!re.test(name)) continue;
    const m = new THREE.MeshStandardMaterial({ name, roughness: def.roughness ?? 0.85, metalness: def.metalness ?? 0 });
    if (def.map) { m.map = tex(def.map[0], 1); m.color.set(def.tint ?? 0xffffff); triplanar(m, def.map[1], def.macro ?? 0); }
    else m.color.set(def.color ?? src.color);
    if (def.emissive) { m.emissive.set(def.emissive); m.emissiveIntensity = def.emissiveIntensity; }
    if (def.transparent) { m.transparent = true; m.opacity = def.opacity; m.depthWrite = false; }
    if (def.envMapIntensity) m.envMapIntensity = def.envMapIntensity;
    return m;
  }
  const m = src.clone();   // sin regla: conserva el color del material de Revit
  m.roughness = 0.85; m.metalness = 0;
  if (src.color.r + src.color.g + src.color.b < 0.02) m.color.set(0x3a3a3a);
  if (/Sin material|Default Wall/i.test(name)) m.color.set(0xd6d0c6);   // muros sin material: revoque claro, no gris de Revit
  return m;
}

// ------------------------------------------------------------------ polígonos en planta [x, z]
const openRing = (pts) => { const p = pts.slice(); const a = p[0], b = p[p.length - 1]; if (p.length > 2 && a[0] === b[0] && a[1] === b[1]) p.pop(); return p; };
function signedArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x0, z0] = p[i], [x1, z1] = p[(i + 1) % p.length]; a += x0 * z1 - x1 * z0; } return a / 2; }
/** Desplaza un polígono d metros hacia afuera (d < 0: hacia adentro), con inglete limitado en esquinas agudas. */
function offsetPoly(pts, d) {
  const p = openRing(pts), n = p.length, s = Math.sign(signedArea(p)) || 1, out = [];
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n];
    const e1 = [b[0] - a[0], b[1] - a[1]], e2 = [c[0] - b[0], c[1] - b[1]];
    const l1 = Math.hypot(e1[0], e1[1]) || 1, l2 = Math.hypot(e2[0], e2[1]) || 1;
    const n1 = [s * e1[1] / l1, -s * e1[0] / l1], n2 = [s * e2[1] / l2, -s * e2[0] / l2];
    const dot = n1[0] * n2[0] + n1[1] * n2[1], k = d / Math.max(0.35, 1 + dot);
    out.push([b[0] + (n1[0] + n2[0]) * k, b[1] + (n1[1] + n2[1]) * k]);
  }
  return out;
}
function inPoly(x, z, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { if (((p[i][1] > z) !== (p[j][1] > z)) && (x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) c = !c; } return c; }
function distToPoly(x, z, p) {
  let d = Infinity;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [ax, az] = p[j], [bx, bz] = p[i], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    d = Math.min(d, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return d;
}

/** Fachada urbana procedimental: 12 × 12 m (4 pisos de 3 m, 4 vanos de 3 m), ventanas con vidrio, marco y antepecho. */
function facadeTexture({ wall, brick = false, glass = ['#9fb2bf', '#2b3944'], frame = '#ece8e1', seed = 1 }) {
  const S = 512, px = S / 12, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  let r = seed * 9973 % 2147483647 || 7; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  g.fillStyle = wall; g.fillRect(0, 0, S, S);
  if (brick) {   // hiladas de ladrillo con juntas y variación de tono por pieza
    const bh = 0.075 * px, bw = 0.25 * px;
    for (let y = 0, row = 0; y < S; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < S; x += bw) {
      g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,235,220'},${(rnd() * 0.12).toFixed(3)})`; g.fillRect(x, y, bw - 1, bh - 1);
    }
    g.fillStyle = 'rgba(225,210,195,.18)';
    for (let y = 0; y < S; y += bh) g.fillRect(0, y + bh - 1, S, 1);
  } else {       // revoque: grano fino y manchas suaves
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${(rnd() * 0.05).toFixed(3)})`; g.fillRect(rnd() * S, rnd() * S, 2, 2); }
  }
  for (let f = 0; f < 4; f++) {
    const yb = S - f * 3 * px;                         // borde inferior del piso f
    g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(0, yb - 3 * px, S, 0.12 * px);   // filo de placa
    for (let b = 0; b < 4; b++) {
      const w = 1.8 * px, h = 1.5 * px, x = b * 3 * px + (3 * px - w) / 2, y = yb - 0.9 * px - h;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - 3, y - 3, w + 6, h + 6);       // vano en sombra
      const gr = g.createLinearGradient(0, y, 0, y + h);
      const lit = rnd();
      gr.addColorStop(0, lit > 0.85 ? '#d8c9a8' : glass[0]); gr.addColorStop(1, lit > 0.85 ? '#8a7a60' : glass[1]);
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      if (lit > 0.55 && lit <= 0.85) { g.fillStyle = 'rgba(235,228,215,.55)'; g.fillRect(x + w * (rnd() < 0.5 ? 0 : 0.55), y, w * 0.45, h); }   // cortina
      g.strokeStyle = frame; g.lineWidth = 3; g.strokeRect(x, y, w, h);
      g.fillStyle = frame; g.fillRect(x + w / 2 - 1.5, y, 3, h);                       // parteluz
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 4, y + h + 2, w + 8, 4); // alféizar
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 12, 1 / 12); t.anisotropy = 8;
  return t;
}

/** Adoquín de granito en hilada trabada (4 × 4 m): piezas de 20 × 10 cm con tonos gris-café, desgaste y juntas.
 *  Devuelve color y relieve (la misma imagen en grises sirve de bumpMap). */
function settsTexture(seed = 5) {
  const S = 1024, px = S / 4, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  let r = seed * 7919 % 2147483647 || 3; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#3b3833'; g.fillRect(0, 0, S, S);                 // junta de arena oscura
  const bw = 0.2 * px, bh = 0.1 * px, gap = 2.2;
  for (let y = 0, row = 0; y < S; y += bh, row++) {
    for (let x = -(row % 2) * bw / 2 - rnd() * 3; x < S; x += bw) {
      const tone = rnd(), warm = rnd();
      const l = 104 + tone * 50, rr = l + warm * 16, gg = l + warm * 6, bb = l - warm * 6 - 4;
      g.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`;
      const w = bw - gap - rnd() * 1.5, h = bh - gap - rnd() * 1.2;
      g.beginPath(); g.roundRect ? g.roundRect(x + gap / 2, y + gap / 2, w, h, 3) : g.rect(x + gap / 2, y + gap / 2, w, h); g.fill();
      // cara de la piedra: luz arriba, sombra abajo y algo de grano
      const gr = g.createLinearGradient(0, y, 0, y + bh);
      gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(0,0,0,.16)');
      g.fillStyle = gr; g.fillRect(x + gap / 2, y + gap / 2, w, h);
      for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},${(rnd() * 0.08).toFixed(3)})`; g.fillRect(x + rnd() * w, y + rnd() * h, 2, 2); }
    }
  }
  // manchas grandes de uso y humedad
  for (let i = 0; i < 40; i++) {
    const x = rnd() * S, y = rnd() * S, rad = 40 + rnd() * 160, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${rnd() < 0.35 ? '20,18,15' : '235,225,210'},${(0.04 + rnd() * 0.05).toFixed(3)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  const bump = new THREE.CanvasTexture(c);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(1 / 4, 1 / 4); bump.anisotropy = 8;
  return { map, bump };
}

/** Cielo de tarde en degradé (fondo y reflejos). */
function skyTexture() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#5f86b3'); gr.addColorStop(0.42, '#9cb8d2'); gr.addColorStop(0.5, '#d9dee0');
  gr.addColorStop(0.53, '#e9dccb'); gr.addColorStop(1, '#8c8478');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

// ------------------------------------------------------------------ utilidades de geometría
const shape2 = (pts) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
function flat(pts, y, mat) {
  const g = new THREE.ShapeGeometry(shape2(pts));
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));   // UV en metros
  const m = new THREE.Mesh(g, mat);
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}
function prism(pts, h, mat, y0 = 0) {
  const g = new THREE.ExtrudeGeometry(shape2(pts), { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.y = y0;
  m.castShadow = m.receiveShadow = true;
  return m;
}

export class Edificio3D {
  constructor(container, geo, { onPickFloor, onPickRoom } = {}) {
    this.el = container;
    this.geo = geo;
    this.onPickFloor = onPickFloor;
    this.onPickRoom = onPickRoom;
    this.cut = null;
    this.room = null;
    this.layers = [];
    this.rooms = new Map();
    this.ready = false;

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.shadowMap.autoUpdate = false;   // se marcan para actualizar solo cuando el edificio se mueve (_busy)
    this._busyUntil = 0;
    r.setClearColor(BG);
    container.append(r.domElement);

    // perfil de calidad: GPU integrada o celular → sin oclusión ambiental y sombras más livianas
    let gpu = '';
    try { const gl = r.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''; } catch { /* sin datos */ }
    this.low = MOBILE || /Intel|UHD|HD Graphics|Iris|Mali|Adreno|PowerVR|SwiftShader|llvmpipe|Microsoft Basic/i.test(gpu);

    this.scene = new THREE.Scene();
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(BG, 380, 1350);   // la ciudad se funde con el horizonte antes del borde del suelo
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.5, 3000);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 520;
    this.controls.autoRotateSpeed = -0.35;
    this.controls.addEventListener('start', () => { this._dragging = true; });
    this.controls.addEventListener('end', () => { this._dragging = false; });   // giro lento cuando nadie toca el visor
    const stopIdle = () => { this.controls.autoRotate = false; clearTimeout(this._idleT); this._idleT = setTimeout(() => { if (this.cut == null && !reduced) this.controls.autoRotate = true; }, 7000); };
    r.domElement.addEventListener('pointerdown', stopIdle);
    r.domElement.addEventListener('wheel', stopIdle, { passive: true });

    this._lights();
    this.center = new THREE.Vector3(18, 0, 0);
    this.size = 70;
    this._home();
    this._bindPointer();

    new ResizeObserver(() => this._resize()).observe(container);
    this._resize();

    // solo dibuja cuando el visor está en pantalla; la primera vez el edificio se arma piso por piso
    const clock = new THREE.Clock();
    r.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const b = container.getBoundingClientRect();
      this.visible = b.bottom > 0 && b.top < innerHeight && b.width > 0;
      if (!this.visible) return;
      if (this.ready && !this._assembled && b.top < innerHeight * 0.6) { this._assembled = true; this.assemble(); }
      this.controls.update();
      // las sombras se recalculan solo mientras algo se mueve; la oclusión ambiental solo con la escena quieta
      const busy = performance.now() < this._busyUntil || this.layers.some((l) => gsap?.isTweening(l.position));
      if (busy) r.shadowMap.needsUpdate = true;
      r.render(this.scene, this.camera);
    });

    this._load().catch((e) => console.error('No se pudo cargar el modelo 3D', e));
  }

  _lights() {
    // reflejos: el cielo del visor (azul arriba, horizonte cálido) en vez de un estudio gris
    const pm = new THREE.PMREMGenerator(this.renderer);
    const env = new THREE.Scene();
    env.background = skyTexture();
    this.scene.environment = pm.fromScene(env, 0.02).texture;
    this.scene.environmentIntensity = 0.55;
    this.hemi = new THREE.HemisphereLight(0xe4ecf4, 0x9a9282, 0.95);
    this.scene.add(this.hemi);
    // sol de media tarde desde el occidente: sombras largas sobre la plaza y la ciudad
    const sun = this.sun = new THREE.DirectionalLight(0xfff0dc, 3.2);
    sun.position.set(-110, 150, 85);
    sun.target.position.set(18, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.low ? 2048 : 4096, this.low ? 2048 : 4096);
    Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 20, far: 520 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.05;
    sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);
  }

  async _load() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const [gltf, ctx] = await Promise.all([
      loader.loadAsync('assets/modelo/hlf.glb'),
      fetch('assets/modelo/contexto.json').then((r) => r.json()),
    ]);

    // ---------- el ala del modelo Revit, un grupo por piso
    const mats = new Map();
    for (const band of BANDS) {
      const node = gltf.scene.getObjectByName(band) || gltf.scene.getObjectByName(band.replace(/ /g, '_'));
      const g = new THREE.Group();
      g.name = band;
      g.userData.band = band;
      if (node) {
        node.traverse((o) => {
          if (!o.isMesh) return;
          const key = `${band}|${o.material.name}`;   // materiales propios de cada piso: así cada uno se desvanece por separado
          if (!mats.has(key)) {
            const m = materialFor(o.material);
            m.userData.baseOpacity = m.transparent ? m.opacity : 1; m.userData.baseTransparent = m.transparent;
            // desvanecido por tramado (alphaHash): el material sigue opaco y no se recompila al animar la opacidad
            if (!m.transparent) m.alphaHash = true;
            mats.set(key, m);
          }
          o.material = mats.get(key);
          o.castShadow = !o.material.transparent;
          o.receiveShadow = true;
          o.userData.band = band;
        });
        g.add(node);
      }
      this.scene.add(g);
      this.layers.push(g);
    }
    const p2 = this.scene.getObjectByName(OPEN_FLOOR);
    const bb = new THREE.Box3().setFromObject(p2);
    bb.getCenter(this.center); this.center.y = 0;
    this.size = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
    this._outlines(mats);

    // contexto inmediato modelado: vías, andenes, separadores y manzanas del barrio en 3D
    this._context(ctx);
    this._rooms();
    await this._trees([...ctx.arboles, ...(this._extraTrees || [])]);

    this._home(true);
    await this._warmUp();
    this.ready = true;
    if (this.cut != null) { this._assembled = true; this._applyCut(this._band(), true); }   // ya eligió un piso: sin animación de llegada
    else if (gsap && !reduced) this.layers.forEach((l) => { l.visible = false; });   // esperan la animación de llegada
    if (this.room) this.selectRoom(this.room, false);
    this._busy(600);
  }

  // ------------------------------------------------------------------ contexto inmediato
  /** Suelo modelado (sin fotos aéreas): calzadas en asfalto, andenes en adoquín con bordillo de concreto,
   *  separadores con césped y bordillo, ciclorrutas y una base de concreto. Texturas fotogramétricas con
   *  relieve (mapa normal) y variación grande para que no se note la repetición. Todo fusionado por material. */
  _context(ctx) {
    const grp = new THREE.Group();
    grp.name = 'Contexto';
    const A = this.renderer.capabilities.getMaxAnisotropy();
    const pbrTex = (id, kind, srgb, metres) => {
      const t = texLoader.load(`assets/tex/pbr/${id}_${kind}.webp`);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.setScalar(1 / metres); t.anisotropy = A;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const pbr = (id, metres, { tint = 0xffffff, rough = 0.95, ns = 1, macro = 0.3 } = {}) => {
      const m = new THREE.MeshStandardMaterial({ color: tint, roughness: rough, metalness: 0, envMapIntensity: 0.35 });
      m.map = pbrTex(id, 'diff', true, metres);
      m.normalMap = pbrTex(id, 'nor_gl', false, metres); m.normalScale.setScalar(ns);
      triplanar(m, metres, macro);
      return m;
    };
    const asphalt = pbr('asphalt_02', 6, { tint: 0xf2f2f2, ns: 0.9, macro: 0.3 });
    const plaza = pbr('concrete_pavement', 3.2, { ns: 0.8, macro: 0.18 });
    plaza.color.setRGB(1.25, 1.24, 1.26);
    const curb = pbr('concrete_floor_worn_001', 1.2, { tint: 0xe6e1d9, ns: 0.6, macro: 0 });
    const grass = pbr('leafy_grass', 2.5, { tint: 0xbfc9a6, ns: 1.1, macro: 0.4 });
    const lawn = pbr('leafy_grass', 3.2, { tint: 0xa9b98c, ns: 1.0, macro: 0.45 });   // jardines y patios
    // andenes en loseta de concreto gris (no adoquín rojo)
    const pavers = pbr('concrete_pavement', 1.8, { ns: 0.9, macro: 0.2 });
    pavers.color.setRGB(1.08, 1.1, 1.14);
    const bike = pbr('asphalt_02', 4, { tint: 0x9a5546, ns: 0.7, macro: 0.15 });

    // ExtrudeGeometry: grupo 0 = tapas (superficie), grupo 1 = costados (bordillo)
    const part = (g, idx) => {
      const { start, count } = g.groups[idx], out = new THREE.BufferGeometry();
      for (const k of ['position', 'normal', 'uv']) {
        const a = g.attributes[k];
        out.setAttribute(k, new THREE.BufferAttribute(a.array.slice(start * a.itemSize, (start + count) * a.itemSize), a.itemSize));
      }
      return out;
    };
    const slab = (pts, h, y0 = 0) => { const g = new THREE.ExtrudeGeometry(shape2(pts), { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g; };
    const plane = (pts, y) => { const g = new THREE.ShapeGeometry(shape2(pts)); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g; };
    const add = (geos, mat) => {
      if (!geos.length) return;
      const m = new THREE.Mesh(mergeGeometries(geos, false), mat);
      m.receiveShadow = true;
      grp.add(m);
    };

    // ---------- suelo: jardín en las manzanas, asfalto, andenes con bordillo y separadores con césped
    add([plane([[-1400, -1400], [1400, -1400], [1400, 1400], [-1400, 1400]], -0.03)], lawn);
    add(ctx.calzadas.map((p) => plane(p, 0.0)), asphalt);
    const andTop = [], andSide = [], sepTop = [], sepSide = [];
    for (const p of ctx.andenes) { const g = slab(p, 0.15); andTop.push(part(g, 0)); andSide.push(part(g, 1)); g.dispose(); }
    for (const p of ctx.separadores) { const g = slab(p, 0.2); sepTop.push(part(g, 0)); sepSide.push(part(g, 1)); g.dispose(); }
    add(andTop, pavers); add(andSide, curb);
    add(sepTop, grass); add(sepSide, curb);
    const bk = new THREE.Mesh(mergeGeometries(ctx.ciclorrutas.map((p) => plane(p, 0.152)), false), bike);
    bike.polygonOffset = true; bike.polygonOffsetFactor = -2; bk.receiveShadow = true;
    if (ctx.ciclorrutas.length) grp.add(bk);

    // ---------- el resto del hotel, completo pero transparente: así resalta solo el ala del proyecto
    const mb = new THREE.Box3(); this.layers.forEach((l) => mb.expandByObject(l)); mb.expandByScalar(0.5);
    const onModel = (pts) => { const c = pts.reduce((s, [x, z]) => [s[0] + x / pts.length, s[1] + z / pts.length], [0, 0]); return c[0] > mb.min.x && c[0] < mb.max.x && c[1] > mb.min.z && c[1] < mb.max.z; };
    // material real del hotel (ladrillo con ventanas de marco blanco, teja de barro), con opacidad reducida
    const walls = [], roofs = [], lots = [], hotelFeet = [];
    for (const b of ctx.hotelBloques || []) {
      lots.push(plane(b.p, 0.012)); hotelFeet.push(openRing(b.p));
      if (!onModel(b.p)) walls.push(slab(b.p, Math.max(3, b.h)));
    }
    for (const a of ctx.hotelAlas || []) {
      hotelFeet.push(openRing(a.footprint));
      if (onModel(a.footprint)) continue;
      walls.push(slab(a.footprint, Math.max(3, a.wallTop)));
      roofs.push(this._eaveRoof(a, 0.75));
      if (a.flat) { const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(a.flat.p, 3)); fg.setIndex(a.flat.i); roofs.push(fg.toNonIndexed()); }
    }
    add(lots, plaza);
    const OP = 0.58;
    const semi = (m) => { m.transparent = true; m.opacity = OP; m.depthWrite = true; return m; };
    const hotelFacade = semi(new THREE.MeshStandardMaterial({ map: facadeTexture({ wall: '#8f4e3b', brick: true, seed: 31, frame: '#f4f2ee', glass: ['#a7b7c2', '#24303a'] }), roughness: 0.88, envMapIntensity: 0.4 }));
    hotelFacade.map.repeat.set(1 / 12, 1 / 12.4);   // pisos del hotel de ~3,1 m
    const hotelTeja = semi(new THREE.MeshStandardMaterial({ color: 0xe8d4c8, roughness: 0.86, envMapIntensity: 0.35 }));
    hotelTeja.map = tex('teja.webp', 1); triplanar(hotelTeja, 2.0, 0.4); hotelTeja.side = THREE.DoubleSide;
    const hotelFlat = semi(new THREE.MeshStandardMaterial({ map: tex('loseta-concreto.webp', 3), color: 0xbdb5aa, roughness: 0.95 }));
    const wallSides = [], wallCaps = [];
    const splitExtrude = (g) => { wallCaps.push(part(g, 0)); wallSides.push(part(g, 1)); g.dispose(); };
    walls.forEach(splitExtrude);
    const solid = (geos, mat, keepUV = true) => {
      if (!geos.length) return;
      const list = geos.map((g) => { const x = g.index ? g.toNonIndexed() : g; if (!keepUV) for (const k of Object.keys(x.attributes)) if (k !== 'position') x.deleteAttribute(k); return x; });
      const geo = mergeGeometries(list, false);
      if (!keepUV) geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.renderOrder = 2; grp.add(m);
    };
    solid(wallSides, hotelFacade); solid(wallCaps, hotelFlat); solid(roofs, hotelTeja, false);

    // ---------- reja: la de Revit va recta en X pero el lindero real (borde del andén) va inclinado ~6°;
    // se oculta la de Revit y se construye una reja recta sobre el lindero, con portón vehicular, seto y faroles
    this._fence(grp);

    // ---------- árboles en los patios del hotel
    this._extraTrees = this._courtyardTrees(ctx, hotelFeet, mb);

    this.scene.add(grp);
    this._buildings(ctx.edificios);
    return grp;
  }

  /** Cubierta de teja del ala con alero: los vértices del borde inferior salen `d` m hacia afuera y bajan un poco. */
  _eaveRoof(a, d) {
    const pos = a.roof.p.slice(), foot = openRing(a.footprint), off = offsetPoly(foot, d);
    let minY = Infinity; for (let i = 1; i < pos.length; i += 3) minY = Math.min(minY, pos[i]);
    const cx = foot.reduce((s, p) => s + p[0], 0) / foot.length, cz = foot.reduce((s, p) => s + p[1], 0) / foot.length;
    for (let i = 0; i < pos.length; i += 3) {
      if (Math.abs(pos[i + 1] - minY) > 0.06) continue;
      let best = -1, bd = 2.2;
      foot.forEach(([x, z], j) => { const dd = Math.hypot(x - pos[i], z - pos[i + 2]); if (dd < bd) { bd = dd; best = j; } });
      if (best >= 0) { pos[i] = off[best][0] + (pos[i] - foot[best][0]); pos[i + 2] = off[best][1] + (pos[i + 2] - foot[best][1]); }
      else { const dx = pos[i] - cx, dz = pos[i + 2] - cz, l = Math.hypot(dx, dz) || 1; pos[i] += dx / l * d; pos[i + 2] += dz / l * d; }
      pos[i + 1] -= 0.22;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(a.roof.i);
    return g.toNonIndexed();
  }

  /** Reja de lanzas negra sobre el lindero real, con portón abierto, seto por dentro y faroles. */
  _fence(grp) {
    // oculta la reja, el seto y los faroles de Revit (van paralelos al eje X, no al andén)
    const p1 = this.layers.find((l) => l.userData.band === 'PISO 1');
    const bb = new THREE.Box3();
    let plazaMat = null, plazaTop = 0.02;
    p1?.traverse((o) => {
      if (!o.isMesh) return;
      bb.setFromObject(o);
      const n = o.material.name || '';
      if (/PLAZA ABANICO/i.test(n)) { plazaMat = o.material; plazaTop = bb.max.y; }
      const band = bb.min.z > 22.6 && bb.max.z < 24.4 && bb.max.y < 3.2;
      if (/HIEDRA SUELO REJA/i.test(n) || (band && /MARCO NEGRO|VIDRIO LUZ CALIDA/i.test(n))) o.visible = false;
    });
    const A = new THREE.Vector2(-24.0, 23.28), B = new THREE.Vector2(54.72, 31.39);
    const u = B.clone().sub(A), L = u.length(); u.normalize();
    const nIn = new THREE.Vector2(u.y, -u.x);                 // hacia la plaza (z menor)
    const gate = [(23.5 - A.x) / u.x, (32.5 - A.x) / u.x];   // tramo libre del portón (en metros sobre la línea)
    const at = (s, off = 0) => new THREE.Vector3(A.x + u.x * s + nIn.x * off, 0, A.y + u.y * s + nIn.y * off);
    const yaw = -Math.atan2(u.y, u.x);

    // relleno de la cuña entre el borde recto de la plaza de Revit (z = 23.5) y el lindero inclinado
    const zAt = (x) => A.y + (x - A.x) * (u.y / u.x);
    // plaza de acceso en adoquín (en el modelo de Revit la plaza queda a -1 m, bajo el suelo del contexto): de la fachada a la reja
    const wedge = [[A.x, A.y], [B.x, B.y], [B.x, -5], [A.x, -5]];
    const wg = new THREE.ShapeGeometry(new THREE.Shape(wedge.map(([x, z]) => new THREE.Vector2(x, -z))));
    wg.rotateX(-Math.PI / 2); wg.translate(0, 0.02, 0);
    const setts = settsTexture(5);   // adoquín de granito gris-café, como la plaza real
    const wedgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, envMapIntensity: 0.45, bumpMap: setts.bump, bumpScale: 2.2 });
    wedgeMat.map = setts.map; triplanar(wedgeMat, 4, 0.18);
    const wm = new THREE.Mesh(wg, wedgeMat); wm.receiveShadow = true; grp.add(wm);

    const metal = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.42, metalness: 0.65 });
    const H = 1.8, inGate = (s) => s > gate[0] && s < gate[1];
    const segs = [[0, gate[0]], [gate[1], L]];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), one = new THREE.Vector3(1, 1, 1);
    const inst = (geo, list) => {
      const im = new THREE.InstancedMesh(geo, metal, list.length);
      list.forEach((p, i) => im.setMatrixAt(i, m4.compose(p, q, one)));
      im.castShadow = true; im.receiveShadow = true; grp.add(im);
    };
    // barrotes, postes y lanzas
    const pick = [], posts = [], tips = [];
    for (let s = 0.07; s < L; s += 0.13) if (!inGate(s)) { pick.push(at(s).setY(H / 2)); tips.push(at(s).setY(H + 0.05)); }
    for (let s = 0; s <= L + 0.01; s += 2.6) if (!inGate(s)) posts.push(at(s).setY((H + 0.2) / 2));
    for (const g of gate) posts.push(at(g).setY((H + 0.4) / 2));
    inst(new THREE.BoxGeometry(0.022, H, 0.022), pick);
    inst(new THREE.ConeGeometry(0.028, 0.1, 4), tips);
    inst(new THREE.BoxGeometry(0.1, H + 0.2, 0.1), posts);
    // pasamanos superior e inferior por tramo
    for (const [s0, s1] of segs) for (const y of [0.12, H - 0.12]) {
      const len = s1 - s0, rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.045, 0.035), metal);
      rail.position.copy(at((s0 + s1) / 2)).setY(y); rail.rotation.y = yaw; rail.castShadow = true; grp.add(rail);
    }
    // seto por dentro de la reja
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x9fb07f, roughness: 1 });
    hedgeMat.map = tex('seto-verde.webp', 1); triplanar(hedgeMat, 1.4, 0.3);
    for (const [s0, s1] of segs) {
      const len = s1 - s0 - 0.6; if (len < 1) continue;
      const h = new THREE.Mesh(new THREE.BoxGeometry(len, 0.95, 0.55), hedgeMat);
      h.position.copy(at((s0 + s1) / 2, 0.55)).setY(0.475); h.rotation.y = yaw; h.castShadow = h.receiveShadow = true; grp.add(h);
    }
    // faroles sobre los postes, cada ~13 m
    const glow = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 0.9, roughness: 0.3 });
    for (let s = 2.6; s < L; s += 13) {
      if (inGate(s) || inGate(s + 1)) continue;
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), glow);
      lamp.position.copy(at(s)).setY(H + 0.38); lamp.rotation.y = yaw; grp.add(lamp);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.16, 4), metal);
      cap.position.copy(at(s)).setY(H + 0.62); cap.rotation.y = yaw + Math.PI / 4; grp.add(cap);
    }
  }

  /** Árboles en los patios y jardines del hotel (dentro del conjunto, lejos de muros, vías y del ala modelada). */
  _courtyardTrees(ctx, feet, mb) {
    const all = feet.flat(), xs = all.map((p) => p[0]), zs = all.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    // envolvente convexa del conjunto (monotone chain)
    const pts = all.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const hull = offsetPoly(lo.slice(0, -1).concat(hi.slice(0, -1)), -3);
    const blocked = [...ctx.calzadas, ...ctx.andenes, ...ctx.separadores, ...ctx.edificios.map((b) => b.p)];
    const hash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const out = [];
    for (let x = x0; x <= x1; x += 7.5) for (let z = z0; z <= z1; z += 7.5) {
      const px = x + (hash(x, z) - 0.5) * 4, pz = z + (hash(z, x) - 0.5) * 4;
      if (!inPoly(px, pz, hull)) continue;
      if (px > mb.min.x - 2 && px < mb.max.x + 2 && pz > mb.min.z - 2 && pz < mb.max.z + 2) continue;
      if (feet.some((f) => inPoly(px, pz, f) || distToPoly(px, pz, f) < 3.2)) continue;
      if (blocked.some((p) => inPoly(px, pz, p))) continue;
      if (ctx.arboles.some(([ax, az]) => Math.hypot(ax - px, az - pz) < 5)) continue;
      if (hash(px * 0.7, pz * 1.3) < 0.18) continue;   // claros: no todo el patio lleno
      out.push([px, pz]);
    }
    return out;
  }

  /** Manzanas del catastro en 3D: fachadas variadas (ladrillo, revoque blanco, beige, gris) con ventanas por piso,
   *  antepecho en la cubierta. Se fusionan en pocas mallas (una por fachada) para que el visor siga fluido. */
  _buildings(list) {
    const grp = new THREE.Group();
    grp.name = 'Barrio3D';
    const facades = [
      facadeTexture({ wall: '#8e4f3c', brick: true, seed: 3 }),
      facadeTexture({ wall: '#a35c45', brick: true, seed: 7, frame: '#f2efe9' }),
      facadeTexture({ wall: '#e6e2da', seed: 11, glass: ['#a9bccb', '#33424e'] }),
      facadeTexture({ wall: '#d9cbb5', seed: 17, frame: '#faf7f1' }),
      facadeTexture({ wall: '#bdbab4', seed: 23, glass: ['#b6c4cf', '#2c3640'], frame: '#f3f3f3' }),
    ].map((map) => new THREE.MeshStandardMaterial({ map, roughness: 0.88, envMapIntensity: 0.4 }));
    const roof = new THREE.MeshStandardMaterial({ map: tex('loseta-concreto.webp', 3), color: 0xb4ada3, roughness: 0.95 });
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0xd7d2c9, roughness: 0.9 });
    const sides = facades.map(() => []), caps = [], parapets = [];
    const part = (g, grpIdx) => {
      const { start, count } = g.groups[grpIdx], out = new THREE.BufferGeometry();
      for (const k of ['position', 'normal', 'uv']) {
        const a = g.attributes[k];
        out.setAttribute(k, new THREE.BufferAttribute(a.array.slice(start * a.itemSize, (start + count) * a.itemSize), a.itemSize));
      }
      return out;
    };
    const hash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    for (const b of list) {
      const h = Math.max(3, b.h);
      const g = new THREE.ExtrudeGeometry(shape2(b.p), { depth: h, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      caps.push(part(g, 0));
      sides[Math.floor(hash(b.p[0][0], b.p[0][1]) * facades.length) % facades.length].push(part(g, 1));
      g.dispose();
      // antepecho de 0,9 m alrededor de la cubierta (solo edificios de más de un piso)
      if (h > 4.5) try {
        const outer = openRing(b.p), inner = offsetPoly(outer, -0.25);
        const s = shape2(outer); s.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x, -z))));
        const pg = new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: false });
        pg.rotateX(-Math.PI / 2); pg.translate(0, h, 0);
        parapets.push(pg);
      } catch { /* polígono raro: sin antepecho */ }
    }
    const add = (geos, mat) => {
      if (!geos.length) return;
      const m = new THREE.Mesh(mergeGeometries(geos, false), mat);
      m.castShadow = m.receiveShadow = true;
      grp.add(m);
    };
    sides.forEach((geos, i) => add(geos, facades[i]));
    add(caps, roof);
    add(parapets.map((g) => { for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); return g; }), parapetMat);
    this.scene.add(grp);
    return grp;
  }

  // ------------------------------------------------------------------ árboles escaneados (instanciados)
  async _trees(all) {
    // solo el contexto inmediato: los árboles a menos de 170 m del hotel
    const points = all.filter(([x, z]) => Math.hypot(x - this.center.x, z - this.center.z) < 170);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const species = [
      { name: 'jacaranda', h: 12 }, { name: 'island_tree_01', h: 10 }, { name: 'island_tree_02', h: 9 },
    ];
    const parts = await Promise.all(species.flatMap((s) => ['hojas', 'madera'].map((k) =>
      loader.loadAsync(`assets/modelo/arboles/${s.name}_L1_${k}.glb`).then((g) => ({ s, k, scene: g.scene })).catch(() => null))));
    // altura y base de cada especie a partir de su madera + hojas
    const bySp = new Map();
    for (const p of parts.filter(Boolean)) {
      p.scene.updateMatrixWorld(true);
      const e = bySp.get(p.s.name) || { s: p.s, meshes: [], box: new THREE.Box3() };
      p.scene.traverse((o) => { if (o.isMesh) { e.meshes.push(o); e.box.expandByObject(o); } });
      bySp.set(p.s.name, e);
    }
    const sp = [...bySp.values()];
    if (!sp.length) return;
    // reparto estable por posición
    const hash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const buckets = sp.map(() => []);
    for (const [x, z] of points) buckets[Math.floor(hash(x, z) * sp.length) % sp.length].push([x, z]);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    sp.forEach((e, i) => {
      const pts = buckets[i];
      if (!pts.length) return;
      const hNat = e.box.max.y - e.box.min.y || 1;
      for (const mesh of e.meshes) {
        const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, pts.length);
        pts.forEach(([x, z], k) => {
          const r = hash(z, x);
          const k2 = (e.s.h / hNat) * (0.8 + 0.45 * r);
          q.setFromAxisAngle(up, r * Math.PI * 2);
          s.setScalar(k2);
          p.set(x, -e.box.min.y * k2, z);
          m.compose(p, q, s).multiply(mesh.matrixWorld);
          inst.setMatrixAt(k, m);
        });
        inst.castShadow = true;
        inst.receiveShadow = true;
        if (mesh.material) { mesh.material.side = THREE.DoubleSide; mesh.material.alphaTest = Math.max(mesh.material.alphaTest || 0, 0.4); }
        this.scene.add(inst);
      }
    });
  }

  // ------------------------------------------------------------------ habitaciones del Piso 2
  _rooms() {
    const p2 = this.layers.find((l) => l.userData.band === OPEN_FLOOR);
    const shapeOf = (loop) => new THREE.Shape(loop.map(([x, y]) => new THREE.Vector2(x / 100, y / 100)));
    const fillMat = new THREE.MeshBasicMaterial({ color: NAVY, transparent: true, opacity: 0.55, depthWrite: false });
    const volMat = new THREE.MeshBasicMaterial({ color: NAVY, transparent: true, opacity: 0.18, depthWrite: false });
    const goldMat = new THREE.MeshBasicMaterial({ color: GOLD });
    const edgeGeo = new THREE.BoxGeometry(1, 0.1, 0.08);
    for (const r of this.geo.rooms) {
      const fill = new THREE.Group();
      for (const l of [r.main, ...r.bath]) {
        const sg = new THREE.ShapeGeometry(shapeOf(l)); sg.rotateX(-Math.PI / 2);
        const f = new THREE.Mesh(sg, fillMat); f.position.y = P2_Y + 0.05; fill.add(f);
        const vg = new THREE.ExtrudeGeometry(shapeOf(l), { depth: ROOM_H, bevelEnabled: false }); vg.rotateX(-Math.PI / 2);
        const v = new THREE.Mesh(vg, volMat); v.position.y = P2_Y + 0.04; fill.add(v);
        // contorno dorado grueso abajo y arriba (las líneas de WebGL miden 1 px)
        for (let i = 0; i < l.length; i++) {
          const a = l[i], b = l[(i + 1) % l.length];
          const ax = a[0] / 100, az = -a[1] / 100, bx = b[0] / 100, bz = -b[1] / 100;
          const len = Math.hypot(bx - ax, bz - az);
          if (len < 0.05) continue;
          for (const y of [P2_Y + 0.08, P2_Y + ROOM_H]) {
            const e = new THREE.Mesh(edgeGeo, goldMat);
            e.scale.x = len + 0.08;
            e.position.set((ax + bx) / 2, y, (az + bz) / 2);
            e.rotation.y = -Math.atan2(bz - az, bx - ax);
            fill.add(e);
          }
        }
      }
      fill.visible = false;
      p2.add(fill);
      const pg = new THREE.ExtrudeGeometry(shapeOf(r.main), { depth: ROOM_H, bevelEnabled: false }); pg.rotateX(-Math.PI / 2);
      const pick = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ visible: false }));
      pick.position.y = P2_Y;
      pick.userData.room = r.n;
      p2.add(pick);
      const c = new THREE.Box3().setFromObject(pick).getCenter(new THREE.Vector3());
      this.rooms.set(r.n, { fill, pick, center: c });
    }
  }

  // ------------------------------------------------------------------ cámara
  _fit(k = 1) {
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return (this.size * 0.62 * k) / t / Math.min(1, this.camera.aspect);
  }

  _home(apply = false) {
    const c = this.center.clone().setY(8);
    this.homeTarget = c;
    this.homePos = c.clone().add(new THREE.Vector3(-0.62, 0.5, 0.6).normalize().multiplyScalar(this._fit(1.15)));
    if (apply || !this._moved) { this.camera.position.copy(this.homePos); this.controls.target.copy(c); }
  }

  flyTo(pos, target, dur = 1.4, ease = 'power2.inOut') {
    this._moved = true;
    if (!gsap || reduced) { this.camera.position.copy(pos); this.controls.target.copy(target); return; }
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);
    gsap.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: dur, ease });
    gsap.to(this.controls.target, { x: target.x, y: target.y, z: target.z, duration: dur, ease });
  }

  _back() {
    const b = this.camera.position.clone().sub(this.controls.target).setY(0).normalize();
    return b.lengthSq() < 0.1 ? new THREE.Vector3(-0.7, 0, 0.7) : b;
  }

  // ------------------------------------------------------------------ transición
  /** Contorno dorado de cada piso (la losa del Piso 2 a la altura de cada nivel): se ve en la vista explotada. */
  _outlines(mats) {
    this.layerMats = new Map(this.layers.map((l) => [l, [...mats].filter(([k]) => k.startsWith(l.userData.band + '|')).map(([, m]) => m)]));
    const lineMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false });
    this.outlineMat = lineMat;
    for (const l of this.layers) {
      const b = new THREE.Box3().setFromObject(l);
      if (b.isEmpty()) continue;
      const y = b.min.y + 0.06;
      for (const loop of this.geo.slab) {
        const pts = loop.map(([x, z]) => new THREE.Vector3(x / 100, y, -z / 100));
        const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
        line.renderOrder = 5;
        l.add(line);
      }
    }
  }

  /** Precarga en la tarjeta gráfica (texturas, geometría, sombreadores, sombras y posproceso) mientras la página
   *  carga, para que al llegar al visor o al abrir el Piso 2 no haya ningún congelamiento. */
  async _warmUp() {
    const r = this.renderer;
    this.layers.forEach((l) => { l.visible = true; });
    // espera a que terminen de descargarse todas las texturas
    const texs = new Set();
    this.scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) for (const k of ['map', 'normalMap', 'bumpMap', 'roughnessMap', 'emissiveMap', 'alphaMap']) if (m?.[k]) texs.add(m[k]);
    });
    await Promise.all([...texs].map((t) => (t.image ? null : new Promise((res) => {
      const iv = setInterval(() => { if (t.image) { clearInterval(iv); res(); } }, 50);
      setTimeout(() => { clearInterval(iv); res(); }, 8000);
    }))));
    try { await r.compileAsync?.(this.scene, this.camera); } catch { /* sin compilación previa */ }
    const idle = () => new Promise((res) => (window.requestIdleCallback ? requestIdleCallback(res, { timeout: 600 }) : setTimeout(res, 30)));
    for (const t of texs) { await idle(); r.initTexture?.(t); }
    // un cuadro completo (todos los pisos, con sombras y oclusión ambiental) y otro con el Piso 2 abierto
    await idle();
    r.shadowMap.needsUpdate = true;
    r.render(this.scene, this.camera);
    this.layers.forEach((l, i) => { if (i > BANDS.indexOf(OPEN_FLOOR)) l.visible = false; });
    await idle();
    r.shadowMap.needsUpdate = true;
    r.render(this.scene, this.camera);
    this.layers.forEach((l) => { l.visible = true; });
    r.shadowMap.needsUpdate = true;
  }

  _busy(ms = 250) { this._busyUntil = Math.max(this._busyUntil, performance.now() + ms); }

  /** Opacidad de un piso entero (0..1) respetando la transparencia propia del vidrio. */
  _fade(layer, a) {
    // solo cambia la opacidad (alphaHash en los opacos, transparencia normal en el vidrio): sin recompilar nada
    for (const m of this.layerMats?.get(layer) || []) m.opacity = (m.userData.baseOpacity ?? 1) * a;
    layer.userData.alpha = a;
    this._busy();
  }

  /** Llegada: el edificio aparece explotado (cada piso flotando con su contorno dorado), se sostiene
   *  y se cierra piso sobre piso mientras la cámara se acerca. */
  assemble() {
    if (!gsap || reduced) return;
    this._assembling = true;
    const GAP = 5.2;
    const n = this.layers.length;
    const state = this.layers.map(() => ({ a: 0 }));
    this.layers.forEach((l, i) => { l.visible = true; l.position.y = i * GAP + 10; this._fade(l, 0); });
    this.outlineMat.opacity = 0;
    // la cámara arranca más lejos y alta, y se acerca durante el cierre
    const from = this.homeTarget.clone().add(this.homePos.clone().sub(this.homeTarget).multiplyScalar(1.35));
    from.y = this.homePos.y * 1.5;
    this.camera.position.copy(from); this.controls.target.copy(this.homeTarget);
    const tl = this._tl = gsap.timeline({ delay: 0.15, onComplete: () => {
      this._assembling = false; this._applyCut(this._band(), true);
      if (this.cut == null && !this._moved) this.controls.autoRotate = true;   // terminado de armar: giro lento
    } });
    // 1 · los pisos entran desde arriba, uno tras otro, y quedan flotando separados
    this.layers.forEach((l, i) => {
      tl.to(l.position, { y: i * GAP, duration: 1.1, ease: 'power3.out' }, i * 0.14)
        .to(state[i], { a: 1, duration: 0.8, ease: 'power1.out', onUpdate: () => this._fade(l, state[i].a) }, i * 0.14);
    });
    tl.to(this.outlineMat, { opacity: 0.95, duration: 0.6 }, 0.3);
    // 2 · pausa en vista explotada; 3 · se cierran de arriba hacia abajo
    const close = 0.14 * n + 1.3;
    this.layers.forEach((l, i) => {
      tl.to(l.position, { y: 0, duration: 1.5, ease: 'power3.inOut' }, close + (n - 1 - i) * 0.07);
    });
    tl.to(this.outlineMat, { opacity: 0, duration: 0.8 }, close + 1.0);
    tl.to(this.camera.position, { x: this.homePos.x, y: this.homePos.y, z: this.homePos.z, duration: close + 1.6, ease: 'power2.inOut' }, 0);
  }

  _band() { return this.cut == null ? null : OPEN_FLOOR; }

  _applyCut(band, instant = false) {
    const order = BANDS.indexOf(band);
    const shows = (l) => band == null || BANDS.indexOf(l.userData.band) <= order;
    if (instant || !gsap || reduced) {
      this.layers.forEach((l) => { l.visible = shows(l); l.position.y = 0; this._fade(l, 1); });
    } else {
      // los pisos que se van se separan en abanico hacia arriba (con su contorno dorado) y se desvanecen;
      // los que vuelven bajan flotando desde arriba y se posan en su sitio
      const leaving = this.layers.filter((l) => l.visible && !shows(l));
      const coming = this.layers.filter((l) => !l.visible && shows(l));
      gsap.killTweensOf(this.layers.map((l) => l.position));
      gsap.killTweensOf(this.outlineMat);
      if (leaving.length || coming.length) gsap.timeline()
        .to(this.outlineMat, { opacity: 0.95, duration: 0.35 })
        .to(this.outlineMat, { opacity: 0, duration: 0.6 }, 1.05);
      leaving.forEach((l, k) => {
        const st = { a: l.userData.alpha ?? 1 };
        gsap.to(l.position, { y: 5 + k * 3.4, duration: 1.0, delay: k * 0.06, ease: 'power3.out' });
        gsap.to(st, { a: 0, duration: 0.55, delay: 0.45 + k * 0.06, ease: 'power1.in', onUpdate: () => this._fade(l, st.a),
          onComplete: () => { l.visible = false; l.position.y = 0; this._fade(l, 1); } });
      });
      coming.forEach((l, k) => {
        const st = { a: 0 };
        l.visible = true; this._fade(l, 0);
        gsap.fromTo(l.position, { y: 5 + k * 3.4 }, { y: 0, duration: 1.0, delay: 0.07 * k, ease: 'power3.inOut' });
        gsap.to(st, { a: 1, duration: 0.6, delay: 0.07 * k, onUpdate: () => this._fade(l, st.a) });
      });
      this.layers.forEach((l) => { if (shows(l) && !coming.includes(l)) { l.visible = true; l.position.y = 0; this._fade(l, 1); } });
    }
    // con un piso abierto entra más luz al interior
    this.hemi.intensity = band ? 1.35 : 0.95;
  }

  /** Abre el Piso 2 (2) o vuelve al edificio completo (null). */
  setFloor(floor) {
    const band = floor == null ? null : OPEN_FLOOR;
    if (band == null) this.selectRoom(null, false);
    if (floor === this.cut) return;
    this.cut = floor;
    if (this._assembling) { this._tl?.kill(); this._assembling = false; }   // elegir un piso corta la animación de llegada
    if (this.ready) { this._assembled = true; this._applyCut(band); }
    this.controls.autoRotate = false;
    if (band == null) { this.flyTo(this.homePos, this.homeTarget, 1.6); return; }
    const c = this.center.clone().setY(P2_Y);
    const d = this._fit(0.85);
    this.flyTo(c.clone().addScaledVector(this._back(), d * 0.5).setY(P2_Y + d * 0.86), c, 1.4);
  }

  /** Colorea solo la habitación elegida y acerca la cámara. */
  selectRoom(n, fly = true) {
    if (this.room && this.rooms.has(this.room)) this.rooms.get(this.room).fill.visible = false;
    this.room = n;
    if (!n) return;
    if (this.cut !== 2) this.setFloor(2);
    if (!this.rooms.has(n)) return;              // aún cargando: se aplica al terminar
    const r = this.rooms.get(n);
    r.fill.visible = true;
    if (fly) {
      const c = r.center.clone().setY(P2_Y);
      const d = 22 / Math.min(1, this.camera.aspect);
      this.flyTo(c.clone().addScaledVector(this._back(), d * 0.55).setY(P2_Y + d * 0.8), c, 1.3);
    }
  }

  // ------------------------------------------------------------------ interacción
  _bindPointer() {
    const el = this.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down = null;
    const pick = (e) => {
      if (!this.ready) return null;
      const b = el.getBoundingClientRect();
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      if (this.cut === 2) {
        const hit = ray.intersectObjects([...this.rooms.values()].map((r) => r.pick), false)[0];
        if (hit) return { room: hit.object.userData.room };
      }
      const hit = ray.intersectObjects(this.layers.filter((l) => l.visible), true)[0];
      return hit ? { floor: 2 } : null;
    };
    el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const p = pick(e);
      if (!p) return;
      if (p.room) this.onPickRoom?.(p.room);
      else if (this.cut !== 2) this.onPickFloor?.(2);
    });
    let last = 0;
    el.addEventListener('pointermove', (e) => {
      if (e.buttons || performance.now() - last < 80) return;
      last = performance.now();
      el.style.cursor = pick(e) ? 'pointer' : 'grab';
    });
  }

  _resize() {
    const { clientWidth: w, clientHeight: h } = this.el;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.cut == null && !this._moved) this._home(true);
  }
}
