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

const NAVY = 0x0e3064;
const GOLD = 0xb59535;
const BG = 0xd1d2d2;
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

// el edificio se muestra tal cual viene de Revit (sin reemplazar materiales)
const USE_RULES = false;
// material del modelo según su nombre en Revit → textura real y tamaño en metros que cubre
const RULES = [
  [/LADRILLO|MAMPOSTER/i, { map: ['ladrillo.webp', 1.2], roughness: 0.9 }],
  [/TEJA|Default Roof/i, { map: ['teja.webp', 2.0], roughness: 0.8 }],
  [/VINIL|VETA/i, { map: ['piso-madera.webp', 1.6], roughness: 0.6 }],
  [/SANTORINI/i, { map: ['santorini.webp', 1.2], roughness: 0.35 }],
  [/MOS THE DREAM/i, { map: ['mosaico.webp', 0.6], roughness: 0.4 }],
  [/ALFOMBRA/i, { map: ['alfombra-hall.webp', 2.0], roughness: 1 }],
  [/MARMOL|PHANTOM|Amazonico|SINTERIZADA/i, { map: ['piedra-phantom.webp', 1.2], roughness: 0.25 }],
  [/SIKUANI|Sikuani|MELAMINA|FORMICA|ALERO|Madera Negra|CABECERO/i, { map: ['nogal.webp', 1.2], roughness: 0.55 }],
  [/PAPEL|Lismore/i, { map: ['papel-tessera.webp', 1.0], roughness: 0.9 }],
  [/TEJIDO OLIVA/i, { map: ['tejido-oliva.webp', 0.5], roughness: 1 }],
  [/TEJIDO TERRACOTA/i, { map: ['tejido-terracota.webp', 0.5], roughness: 1 }],
  [/TA-01|Carpet/i, { map: ['tapete-lana.webp', 2.0], roughness: 1 }],
  [/TAPETE|TA-04/i, { map: ['tapete-puntos.webp', 2.0], roughness: 1 }],
  [/PLAZA ABANICO/i, { map: ['plaza-abanico.webp', 4.0], roughness: 0.85 }],
  [/ANDEN ADOQUIN/i, { map: ['adoquin-arcilla.webp', 1.5], roughness: 0.9 }],
  [/ASFALTO/i, { map: ['asfalto.webp', 4.0], roughness: 0.95 }],
  [/LOSETA CONCRETO/i, { map: ['loseta-concreto.webp', 2.0], roughness: 0.9 }],
  [/PODOTACTIL/i, { map: ['podotactil.webp', 1.0], roughness: 0.9 }],
  [/hlf_adoquin/i, { map: ['adoquin-vehicular.webp', 2.0], roughness: 0.9 }],
  [/HIEDRA/i, { map: ['seto-verde.webp', 1.5], roughness: 1 }],
  [/VIDRIO LUZ CALIDA/i, { color: 0xffe2a8, emissive: 0xffc870, emissiveIntensity: 0.9, roughness: 0.2 }],
  [/VIDRIO|Glass/i, { color: 0x9fb8c2, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, envMapIntensity: 1.4 }],
  [/Mirror|Aluminum|Stainless|Acero|Sthal/i, { color: 0xd8dadc, roughness: 0.15, metalness: 0.9 }],
  [/DORADO|BRONCE|LATON/i, { color: 0xb59535, roughness: 0.3, metalness: 0.85 }],
  [/LED|Luz/i, { color: 0xfff1d8, emissive: 0xffe2b0, emissiveIntensity: 1 }],
];
function materialFor(src) {
  const name = src.name || '';
  for (const [re, def] of (USE_RULES ? RULES : [])) {
    if (!re.test(name)) continue;
    const m = new THREE.MeshStandardMaterial({ name, roughness: def.roughness ?? 0.85, metalness: def.metalness ?? 0 });
    if (def.map) { m.map = tex(def.map[0], def.map[1]); m.color.set(0xffffff); } else m.color.set(def.color ?? src.color);
    if (def.emissive) { m.emissive.set(def.emissive); m.emissiveIntensity = def.emissiveIntensity; }
    if (def.transparent) { m.transparent = true; m.opacity = def.opacity; m.depthWrite = false; }
    if (def.envMapIntensity) m.envMapIntensity = def.envMapIntensity;
    return m;
  }
  const m = src.clone();   // sin regla: conserva el color del material de Revit
  m.roughness = 0.85; m.metalness = 0;
  if (src.color.r + src.color.g + src.color.b < 0.02) m.color.set(0x3a3a3a);
  return m;
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
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setClearColor(BG);
    container.append(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(BG, 220, 520);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.5, 2000);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 420;

    this._lights();
    this.center = new THREE.Vector3(18, 0, 0);
    this.size = 70;
    this._home();
    this._bindPointer();
    new ResizeObserver(() => this._resize()).observe(container);
    this._resize();

    // solo dibuja cuando el visor está en pantalla; la primera vez el edificio se arma piso por piso
    r.setAnimationLoop(() => {
      const b = container.getBoundingClientRect();
      this.visible = b.bottom > 0 && b.top < innerHeight && b.width > 0;
      if (!this.visible) return;
      if (this.ready && !this._assembled && b.top < innerHeight * 0.6) { this._assembled = true; this.assemble(); }
      this.controls.update();
      r.render(this.scene, this.camera);
    });

    this._load().catch((e) => console.error('No se pudo cargar el modelo 3D', e));
  }

  _lights() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    this.hemi = new THREE.HemisphereLight(0xf4f1ea, 0x9c9a92, 0.9);
    this.scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
    sun.position.set(-70, 110, 60);
    sun.target.position.set(18, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 20, far: 380 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
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
          const key = o.material.name;
          if (!mats.has(key)) mats.set(key, materialFor(o.material));
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

    this._context(ctx);
    this._rooms();
    await this._trees(ctx.arboles);

    this._home(true);
    this.ready = true;
    if (this.cut != null) this._applyCut(this.cut, true);
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

    // edificios del barrio: volumen claro, como una maqueta
    const city = new THREE.MeshStandardMaterial({ color: 0xece9e2, roughness: 0.95 });
    for (const b of ctx.edificios) grp.add(prism(b.p, Math.max(3, b.h), city));

    this.scene.add(grp);
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
  /** Llegada: cada piso cae desde arriba sobre el anterior y al final la cubierta. */
  assemble() {
    if (!gsap || reduced) return;
    const layers = this.layers.filter((l) => l.userData.band !== 'PISO 1');
    this._assembling = true;
    layers.forEach((l) => { l.visible = false; l.position.y = 0; });
    const step = 0.5;
    const tl = gsap.timeline({ delay: 0.2, onComplete: () => { this._assembling = false; this._applyCut(this.cut, true); } });
    layers.forEach((l, i) => {
      tl.call(() => { l.visible = true; }, null, i * step)
        .fromTo(l.position, { y: 14 }, { y: 0, duration: 1.5, ease: 'power3.out' }, i * step);
    });
  }

  _applyCut(band, instant = false) {
    const order = BANDS.indexOf(band);
    const shows = (l) => band == null || BANDS.indexOf(l.userData.band) <= order;
    if (instant || !gsap || reduced) {
      this.layers.forEach((l) => { l.visible = shows(l); l.position.y = 0; });
    } else {
      // los pisos que se van se levantan en abanico y desaparecen; los que vuelven bajan a su sitio
      const leaving = this.layers.filter((l) => l.visible && !shows(l));
      const coming = this.layers.filter((l) => !l.visible && shows(l));
      gsap.killTweensOf(this.layers.map((l) => l.position));
      leaving.forEach((l, k) => gsap.to(l.position, {
        y: 7 + k * 2.2, duration: 0.55, delay: (leaving.length - 1 - k) * 0.05, ease: 'power2.in',
        onComplete: () => { l.visible = false; l.position.y = 0; },
      }));
      coming.forEach((l, k) => {
        l.visible = true;
        gsap.fromTo(l.position, { y: 6 + k * 1.6 }, { y: 0, duration: 0.7, delay: 0.08 * k, ease: 'power3.out' });
      });
      this.layers.forEach((l) => { if (shows(l) && !coming.includes(l)) { l.visible = true; l.position.y = 0; } });
    }
    // con un piso abierto entra más luz al interior
    this.hemi.intensity = band ? 1.5 : 0.9;
  }

  /** Abre el Piso 2 (2) o vuelve al edificio completo (null). */
  setFloor(floor) {
    const band = floor == null ? null : OPEN_FLOOR;
    if (band == null) this.selectRoom(null, false);
    if (floor === this.cut) return;
    this.cut = floor;
    if (this.ready && !this._assembling) this._applyCut(band);
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
