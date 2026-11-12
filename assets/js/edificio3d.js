// Visor 3D del edificio por pisos: el edificio se arma piso por piso al aparecer; al abrir un piso los de
// arriba suben en abanico y desaparecen, y la cámara vuela hasta él; al elegir una habitación solo esa se
// colorea. Unidades en metros: x = x del modelo, z = -y del modelo, y = altura.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const FLOOR_H = 3.0;
const FLOORS = [2, 3, 4, 5, 6];
const RED = 0x0e3064;
const GOLD = 0xb59535;
const gsap = window.gsap;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const v2 = ([x, y]) => new THREE.Vector2(x / 100, y / 100);
const shapeOf = (loop) => new THREE.Shape(loop.map(v2));

function facadeTexture() {
  // ladrillo con ventanas y jardineras verdes, como la fachada del hotel
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#9b4a32'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) for (let x = (y / 8) % 2 ? -12 : 0; x < 256; x += 24) {
    g.fillStyle = `hsl(${12 + Math.random() * 8},${42 + Math.random() * 10}%,${30 + Math.random() * 8}%)`;
    g.fillRect(x + 1, y + 1, 22, 6);
  }
  g.fillStyle = '#20302a'; g.fillRect(78, 40, 100, 150);           // vidrio
  g.fillStyle = '#e9e4d8'; g.fillRect(74, 36, 108, 6); g.fillRect(74, 36, 6, 158); g.fillRect(176, 36, 6, 158); g.fillRect(126, 40, 4, 150);
  g.fillStyle = '#2f4a2c'; g.fillRect(70, 190, 116, 18);           // jardinera
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export class Edificio3D {
  constructor(container, geo, { onPickFloor, onPickRoom } = {}) {
    this.el = container;
    this.geo = geo;
    this.onPickFloor = onPickFloor;
    this.onPickRoom = onPickRoom;
    this.cut = null;
    this.room = null;
    this.hover = null;

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(r.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 1, 2000);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 420;

    this._lights();
    this._build();
    this._home();
    this._bindPointer();

    new ResizeObserver(() => this._resize()).observe(container);
    this._resize();
    // solo dibuja cuando el visor está en pantalla; la primera vez el edificio se arma piso por piso
    r.setAnimationLoop(() => {
      const b = container.getBoundingClientRect();
      this.visible = b.bottom > 0 && b.top < innerHeight && b.width > 0;
      if (!this.visible) return;
      if (!this._assembled && b.top < innerHeight * 0.6) { this._assembled = true; this.assemble(); }
      this.controls.update();
      r.render(this.scene, this.camera);
    });
  }

  _lights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a6, 1.6));
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
    sun.position.set(-40, 70, 45);
    sun.target.position.set(16, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 45, bottom: -45, near: 10, far: 200 });
    sun.shadow.bias = -0.0005;
    this.scene.add(sun, sun.target);
  }

  _build() {
    const geo = this.geo;
    const foot = shapeOf(geo.footprint);
    const pts = geo.footprint.map(v2);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    this.center = new THREE.Vector3((minX + maxX) / 2, 0, -(minY + maxY) / 2);
    this.size = Math.max(maxX - minX, maxY - minY);

    // suelo
    const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.MeshStandardMaterial({ color: 0xe4e3df, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(this.center.x, -0.02, this.center.z);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const slabMat = new THREE.MeshStandardMaterial({ color: 0xd8d6d0, roughness: 0.9 });
    const facadeMat = new THREE.MeshStandardMaterial({ map: facadeTexture(), roughness: 0.85 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.8 });
    const emptyMat = new THREE.MeshStandardMaterial({ color: 0xc9c7c1, roughness: 1 });

    const tex = new THREE.TextureLoader().load(geo.planImage.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const planMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
    this.planMat = planMat;

    const slabGeo = new THREE.ExtrudeGeometry(foot, { depth: 0.22, bevelEnabled: false });
    slabGeo.rotateX(-Math.PI / 2);

    // cara superior con la planta: UV según la extensión de la imagen alineada (en cm del modelo)
    const pi = geo.planImage;
    const topGeo = new THREE.ShapeGeometry(foot);
    const uv = topGeo.attributes.uv, pos = topGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) * 100 - pi.xMin) / (pi.xMax - pi.xMin), (pos.getY(i) * 100 - pi.yMin) / (pi.yMax - pi.yMin));
    }
    topGeo.rotateX(-Math.PI / 2);

    // fachada: un muro por cada arista del contorno
    const facade = (group) => {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const len = a.distanceTo(b);
        if (len < 0.3) continue;
        const g = new THREE.BoxGeometry(len, FLOOR_H - 0.22, 0.28);
        const u = g.attributes.uv;
        for (let k = 0; k < u.count; k++) u.setX(k, u.getX(k) * Math.max(1, Math.round(len / 2.2)));
        const m = new THREE.Mesh(g, facadeMat);
        m.position.set((a.x + b.x) / 2, 0.22 + (FLOOR_H - 0.22) / 2, -(a.y + b.y) / 2);
        m.rotation.y = Math.atan2(b.y - a.y, b.x - a.x);
        m.castShadow = m.receiveShadow = true;
        m.userData.facade = true;
        group.add(m);
      }
    };

    this.layers = [];
    for (const f of FLOORS) {
      const g = new THREE.Group();
      g.userData = { floor: f, base: (f - 2) * FLOOR_H };
      g.position.y = g.userData.base;
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.castShadow = slab.receiveShadow = true;
      g.add(slab);
      const top = new THREE.Mesh(topGeo, f === 2 ? planMat : emptyMat);
      top.position.y = 0.225;
      top.receiveShadow = true;
      g.add(top);
      facade(g);
      if (f === 2) this._interior(g, wallMat);
      g.traverse((o) => { o.userData.floor = f; });
      this.scene.add(g);
      this.layers.push(g);
    }

    // cubierta de teja (a dos aguas aproximada con bisel)
    const roof = new THREE.Group();
    roof.userData = { floor: 'roof', base: FLOORS.length * FLOOR_H };
    roof.position.y = roof.userData.base;
    const rg = new THREE.ExtrudeGeometry(foot, { depth: 0.05, bevelEnabled: true, bevelThickness: 2.2, bevelSize: 3.2, bevelOffset: -3.2, bevelSegments: 1 });
    rg.rotateX(-Math.PI / 2);
    const roofMesh = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: 0xa8492f, roughness: 0.8 }));
    roofMesh.position.y = 2.2;
    roofMesh.castShadow = true;
    roof.add(new THREE.Mesh(slabGeo, slabMat), roofMesh);
    roof.traverse((o) => { o.userData.floor = 'roof'; });
    this.scene.add(roof);
    this.layers.push(roof);
  }

  _interior(group, wallMat) {
    const H = 2.6;
    const walls = this.geo.walls;
    const box = new THREE.BoxGeometry(1, 1, 1);
    const inst = new THREE.InstancedMesh(box, wallMat, walls.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    walls.forEach(([x1, y1, x2, y2, t], i) => {
      const a = v2([x1, y1]), b = v2([x2, y2]);
      const len = Math.max(0.05, a.distanceTo(b));
      p.set((a.x + b.x) / 2, 0.22 + H / 2, -(a.y + b.y) / 2);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(b.y - a.y, b.x - a.x));
      s.set(len + t / 100, H, Math.max(0.05, t / 100));
      inst.setMatrixAt(i, m.compose(p, q, s));
    });
    inst.castShadow = inst.receiveShadow = true;
    group.add(inst);

    // habitaciones: piso coloreado + volumen + contorno (ocultos hasta elegirlas) y un volumen invisible para el clic
    this.rooms = new Map();
    const edgeGeo = new THREE.BoxGeometry(1, 0.12, 0.09);
    const goldMat = new THREE.MeshBasicMaterial({ color: GOLD });
    const fillMat = () => new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.55, depthWrite: false });
    for (const r of this.geo.rooms) {
      const loops = [r.main, ...r.bath];
      const fill = new THREE.Group();
      for (const l of loops) {
        const sg = new THREE.ShapeGeometry(shapeOf(l));
        sg.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(sg, fillMat());
        mesh.position.y = 0.235;
        fill.add(mesh);
        const vol = new THREE.ExtrudeGeometry(shapeOf(l), { depth: H, bevelEnabled: false });
        vol.rotateX(-Math.PI / 2);
        const vm = new THREE.Mesh(vol, new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.22, depthWrite: false }));
        vm.position.y = 0.23;
        fill.add(vm);
        // contorno dorado grueso (abajo y arriba del volumen): las líneas de WebGL miden 1 px
        for (let i = 0; i < l.length; i++) {
          const a = v2(l[i]), b = v2(l[(i + 1) % l.length]);
          const len = a.distanceTo(b);
          if (len < 0.05) continue;
          for (const y of [0.3, 0.23 + H]) {
            const e = new THREE.Mesh(edgeGeo, goldMat);
            e.scale.set(len + 0.09, 1, 1);
            e.position.set((a.x + b.x) / 2, y, -(a.y + b.y) / 2);
            e.rotation.y = Math.atan2(b.y - a.y, b.x - a.x);
            fill.add(e);
          }
        }
      }
      fill.visible = false;
      group.add(fill);
      const pickGeo = new THREE.ExtrudeGeometry(shapeOf(r.main), { depth: H, bevelEnabled: false });
      pickGeo.rotateX(-Math.PI / 2);
      const pick = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ visible: false }));
      pick.position.y = 0.23;
      pick.userData.room = r.n;
      group.add(pick);
      const c = new THREE.Box3().setFromObject(pick).getCenter(new THREE.Vector3());
      this.rooms.set(r.n, { fill, pick, center: c });
    }
  }

  // ------------------------------------------------------------------ cámara
  /** Distancia para que el edificio quepa en el visor según su tamaño y el ancho del lienzo. */
  _fit(k = 1) {
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return (this.size * 0.55 * k) / t / Math.min(1, this.camera.aspect);
  }

  _home() {
    const c = this.center.clone().setY(7);
    this.homeTarget = c;
    this.homePos = c.clone().add(new THREE.Vector3(-0.55, 0.52, 0.65).normalize().multiplyScalar(this._fit(1)));
    this.camera.position.copy(this.homePos);
    this.controls.target.copy(c);
  }

  flyTo(pos, target, dur = 1.5, ease = 'power2.inOut') {
    if (!gsap || reduced) { this.camera.position.copy(pos); this.controls.target.copy(target); return; }
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);
    gsap.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: dur, ease });
    gsap.to(this.controls.target, { x: target.x, y: target.y, z: target.z, duration: dur, ease });
  }

  _back() {
    const b = this.camera.position.clone().sub(this.controls.target).setY(0).normalize();
    return b.lengthSq() < 0.1 ? new THREE.Vector3(-0.6, 0, 0.8) : b;
  }

  // ------------------------------------------------------------------ transición
  /** El edificio se arma piso por piso: cada uno cae desde arriba sobre el anterior. */
  assemble() {
    if (!gsap || reduced) return;
    this._assembling = true;
    this.layers.forEach((l) => { l.visible = false; });
    const tl = gsap.timeline({ onComplete: () => { this._assembling = false; this._applyCut(this.cut, true); } });
    this.layers.forEach((l, i) => {
      tl.call(() => { l.visible = true; }, null, i * 0.42)
        .fromTo(l.position, { y: l.userData.base + 16 }, { y: l.userData.base, duration: 1.4, ease: 'power3.out' }, i * 0.42);
    });
  }

  _applyCut(floor, instant = false) {
    const shows = (l) => floor == null || (l.userData.floor !== 'roof' && l.userData.floor <= floor);
    if (instant || !gsap || reduced) {
      this.layers.forEach((l) => { l.visible = shows(l); l.position.y = l.userData.base; });
    } else {
      // los pisos que se van suben en abanico y desaparecen; los que vuelven bajan a su sitio
      const leaving = this.layers.filter((l) => l.visible && !shows(l));
      const coming = this.layers.filter((l) => !l.visible && shows(l));
      gsap.killTweensOf(this.layers.map((l) => l.position));
      leaving.forEach((l, k) => gsap.to(l.position, {
        y: l.userData.base + 9 + k * 3, duration: 0.6, delay: (leaving.length - 1 - k) * 0.06, ease: 'power2.in',
        onComplete: () => { l.visible = false; l.position.y = l.userData.base; },
      }));
      coming.forEach((l, k) => {
        l.visible = true;
        gsap.fromTo(l.position, { y: l.userData.base + 8 + k * 2 }, { y: l.userData.base, duration: 0.75, delay: 0.08 * k, ease: 'power3.out' });
      });
      this.layers.forEach((l) => { if (shows(l) && !coming.includes(l)) { l.visible = true; l.position.y = l.userData.base; } });
    }
    // con el piso abierto la fachada de ese piso baja a media altura para ver adentro
    this.layers.forEach((l) => l.children.forEach((o) => {
      if (o.userData.facade) { o.scale.y = floor === l.userData.floor ? 0.35 : 1; o.position.y = 0.22 + (FLOOR_H - 0.22) * o.scale.y / 2; }
    }));
  }

  /** Abre un piso (o el edificio completo con null). */
  setFloor(floor) {
    if (floor !== 2) this.selectRoom(null, false);
    if (floor === this.cut) return;
    this.cut = floor;
    if (!this._assembling) this._applyCut(floor);
    if (floor == null) { this.flyTo(this.homePos, this.homeTarget, 1.6); return; }
    const y = (floor - 2) * FLOOR_H;
    const c = this.center.clone().setY(y);
    const d = this._fit(0.9);
    this.flyTo(c.clone().addScaledVector(this._back(), d * 0.55).setY(y + d * 0.83), c, 1.5);
  }

  /** Colorea solo la habitación elegida y acerca la cámara. */
  selectRoom(n, fly = true) {
    if (this.room) this.rooms?.get(this.room)?.fill && (this.rooms.get(this.room).fill.visible = false);
    this.room = n;
    if (!n || !this.rooms?.has(n)) return;
    if (this.cut !== 2) this.setFloor(2);
    const r = this.rooms.get(n);
    r.fill.visible = true;
    if (fly) {
      const c = r.center.clone().setY(0.2);
      const d = 20 / Math.min(1, this.camera.aspect);
      this.flyTo(c.clone().addScaledVector(this._back(), d * 0.6).setY(c.y + d * 0.8), c, 1.3);
    }
  }

  // ------------------------------------------------------------------ interacción
  _bindPointer() {
    const el = this.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down = null;
    const pick = (e) => {
      const b = el.getBoundingClientRect();
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      if (this.cut === 2) {
        const picks = [...this.rooms.values()].map((r) => r.pick);
        const hit = ray.intersectObjects(picks, false)[0];
        if (hit) return { room: hit.object.userData.room };
      }
      const hit = ray.intersectObjects(this.layers.filter((l) => l.visible), true)[0];
      if (!hit) return null;
      const f = hit.object.userData.floor;
      return { floor: f === 'roof' ? 6 : f };
    };
    el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const p = pick(e);
      if (!p) return;
      if (p.room) this.onPickRoom?.(p.room);
      else if (p.floor !== this.cut) this.onPickFloor?.(p.floor);
    });
    el.addEventListener('pointermove', (e) => {
      const p = e.buttons ? null : pick(e);
      el.style.cursor = p ? 'pointer' : 'grab';
    });
  }

  _resize() {
    const { clientWidth: w, clientHeight: h } = this.el;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // el encuadre inicial depende del ancho real del lienzo
    const first = !this._sized;
    this._sized = true;
    const pos = this.camera.position.clone(), tgt = this.controls.target.clone();
    this._home();
    if (!first || this.cut != null) { this.camera.position.copy(pos); this.controls.target.copy(tgt); }
  }
}
