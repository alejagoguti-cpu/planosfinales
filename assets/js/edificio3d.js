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
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ContextoGoogle } from './contexto-google.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const NAVY = 0x0e3064;
const GOLD = 0xb59535;
const BG = 0xc9d3db;                 // tono del horizonte (niebla y fondo de respaldo)
const MOBILE = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const USE_GOOGLE = new URLSearchParams(location.search).get('google') !== '0';
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
  const t = texLoader.load(`assets/tex/${name}`);
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
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setClearColor(BG);
    container.append(r.domElement);

    // perfil de calidad: GPU integrada o celular → sin oclusión ambiental y sombras más livianas
    let gpu = '';
    try { const gl = r.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''; } catch { /* sin datos */ }
    this.low = MOBILE || /Intel|UHD|HD Graphics|Iris|Mali|Adreno|PowerVR|SwiftShader|llvmpipe|Microsoft Basic/i.test(gpu);

    this.scene = new THREE.Scene();
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(BG, 900, 4200);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.5, 9000);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 520;
    this.controls.autoRotateSpeed = -0.35;   // giro lento cuando nadie toca el visor
    const stopIdle = () => { this.controls.autoRotate = false; clearTimeout(this._idleT); this._idleT = setTimeout(() => { if (this.cut == null && !reduced) this.controls.autoRotate = true; }, 7000); };
    r.domElement.addEventListener('pointerdown', stopIdle);
    r.domElement.addEventListener('wheel', stopIdle, { passive: true });

    this._lights();
    this.center = new THREE.Vector3(18, 0, 0);
    this.size = 70;
    this._home();
    this._bindPointer();

    if (!this.low) {
      const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
      this.composer = new EffectComposer(r, rt);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const ao = this.ao = new GTAOPass(this.scene, this.camera, 1, 1);
      ao.blendIntensity = 0.9;
      ao.updateGtaoMaterial({ radius: 1.4, distanceExponent: 1.4, thickness: 1.6, scale: 1.0, samples: 12, distanceFallOff: 1.0 });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      this.composer.addPass(ao);
      this.composer.addPass(new OutputPass());
    }
    new ResizeObserver(() => this._resize()).observe(container);
    this._resize();

    // solo dibuja cuando el visor está en pantalla; la primera vez el edificio se arma piso por piso
    const clock = new THREE.Clock();
    r.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const b = container.getBoundingClientRect();
      this.visible = b.bottom > 0 && b.top < innerHeight && b.width > 0;
      // la ciudad de Google se precarga cuando el visor está a menos de dos pantallas
      if (!this.visible) { if (b.width > 0 && b.top < innerHeight * 2.5 && b.bottom > -innerHeight) this.city?.update(dt); return; }
      if (this.ready && !this._assembled && b.top < innerHeight * 0.6) { this._assembled = true; this.assemble(); }
      this.controls.update();
      this.city?.update(dt);
      if (this.composer) this.composer.render(dt); else r.render(this.scene, this.camera);
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
    this.hemi = new THREE.HemisphereLight(0xdfe8f2, 0x8a8174, 0.75);
    this.scene.add(this.hemi);
    // sol de media tarde desde el occidente: sombras largas sobre la plaza y la ciudad
    const sun = this.sun = new THREE.DirectionalLight(0xffe6c8, 3.1);
    sun.position.set(-120, 95, 70);
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
          if (!mats.has(key)) { const m = materialFor(o.material); m.userData.baseOpacity = m.transparent ? m.opacity : 1; m.userData.baseTransparent = m.transparent; mats.set(key, m); }
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

    // contexto: la ciudad real de Google recortada donde está el modelo; la maqueta solo si Google falla
    const massing = this._context(ctx);
    if (USE_GOOGLE) {
      try {
        this.city = new ContextoGoogle(this.scene, {
          renderer: this.renderer, camera: this.camera, footprint: this.layers.filter((l) => /PISO 1|CUBIERTA/.test(l.userData.band)), mobile: MOBILE, low: this.low,
          onReady: () => { massing.visible = false; this.renderer.shadowMap.needsUpdate = true; },   // la maqueta del suelo cubre mientras llega la foto
        });
        this.city.onFail = () => { massing.visible = true; };
        this.city.onAttribution = (t) => { (this._attrib ||= this._makeAttrib()).textContent = t; };
        this.city.setDaylight(1);
      } catch (e) { console.warn('Malla de Google no disponible', e); massing.visible = true; }
    }
    this._rooms();
    await this._trees(ctx.arboles);

    this._home(true);
    this.ready = true;
    if (this.cut != null) { this._assembled = true; this._applyCut(this._band(), true); }   // ya eligió un piso: sin animación de llegada
    else if (gsap && !reduced) this.layers.forEach((l) => { l.visible = false; });   // esperan la animación de llegada
    if (this.room) this.selectRoom(this.room, false);
  }

  // ------------------------------------------------------------------ contexto inmediato
  _context(ctx) {
    const grp = new THREE.Group();
    grp.name = 'Contexto';
    const ground = flat([[-600, -600], [600, -600], [600, 600], [-600, 600]], -0.05,
      new THREE.MeshStandardMaterial({ map: tex('loseta-concreto.webp', 3), color: 0xc9c6bf, roughness: 1 }));
    grp.add(ground);
    const asf = new THREE.MeshStandardMaterial({ map: tex('asfalto.webp', 5), roughness: 0.95 });
    const and = new THREE.MeshStandardMaterial({ map: tex('adoquin-arcilla.webp', 1.5), roughness: 0.9 });
    const sep = new THREE.MeshStandardMaterial({ map: tex('seto-verde.webp', 2), color: 0xb9c7a0, roughness: 1 });
    const cic = new THREE.MeshStandardMaterial({ color: 0x8c3a2c, roughness: 0.9 });
    ctx.calzadas.forEach((p) => grp.add(flat(p, 0.0, asf)));
    ctx.ciclorrutas.forEach((p) => grp.add(flat(p, 0.03, cic)));
    ctx.andenes.forEach((p) => grp.add(flat(p, 0.06, and)));
    ctx.separadores.forEach((p) => grp.add(flat(p, 0.08, sep)));

    this.scene.add(grp);
    this._buildings(ctx.edificios);
    return grp;
  }

  /** Manzanas del catastro en 3D: fachada de ladrillo con ventanas por piso y cubierta de concreto.
   *  Se fusionan en pocas mallas (una por tono) para que el visor siga fluido. */
  _buildings(list) {
    const grp = new THREE.Group();
    grp.name = 'Barrio3D';
    const facadeTex = tex('fachada-ladrillo.jpg', 1, 1 / 15, 1 / 3.1);   // una baldosa = 15 m de frente × un piso
    const tints = [0xffffff, 0xe9d6c8, 0xd2b9a8, 0xf3ece4];
    const facades = tints.map((c) => new THREE.MeshStandardMaterial({ map: facadeTex, color: c, roughness: 0.9 }));
    const roof = new THREE.MeshStandardMaterial({ map: tex('loseta-concreto.webp', 3), color: 0xb7b0a6, roughness: 0.95 });
    const sides = tints.map(() => []), caps = [];
    // separa los grupos de ExtrudeGeometry (0 = tapas, 1 = muros) en geometrías propias
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
      sides[Math.floor(hash(b.p[0][0], b.p[0][1]) * tints.length) % tints.length].push(part(g, 1));
      g.dispose();
    }
    const add = (geos, mat) => {
      if (!geos.length) return;
      const m = new THREE.Mesh(mergeGeometries(geos, false), mat);
      m.castShadow = m.receiveShadow = true;
      grp.add(m);
    };
    sides.forEach((geos, i) => add(geos, facades[i]));
    add(caps, roof);
    this.scene.add(grp);
    return grp;
  }

  _makeAttrib() {
    const el = document.createElement('p');
    el.className = 'viewer-attrib';
    this.el.parentElement.append(el);
    return el;
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

  /** Opacidad de un piso entero (0..1) respetando la transparencia propia del vidrio. */
  _fade(layer, a) {
    for (const m of this.layerMats?.get(layer) || []) {
      const base = m.userData.baseOpacity ?? 1;
      const t = a < 0.999 || !!m.userData.baseTransparent;
      if (m.transparent !== t) { m.transparent = t; m.needsUpdate = true; }
      m.opacity = base * a;
      m.depthWrite = !t;
    }
    layer.userData.alpha = a;
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
    this.hemi.intensity = band ? 1.3 : 0.75;
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
    if (this.composer) {
      const pr = this.renderer.getPixelRatio();
      this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.cut == null && !this._moved) this._home(true);
  }
}
