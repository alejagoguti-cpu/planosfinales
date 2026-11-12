// Contexto urbano fotorrealista (Google Photorealistic 3D Tiles) alrededor del ala modelada en Revit.
//  · La ciudad real (resto del hotel, edificios vecinos, vías, árboles, cerros) llega como malla con su foto.
//  · Donde está el modelo de Revit la malla se recorta con una máscara sacada de la huella del propio modelo.
//  · El suelo de la foto se calibra a y = 0 midiendo la malla alrededor del predio.
//  · La foto recibe las sombras del sol del visor.
// Mismo sistema local del proyecto: x = este, y = altura, z = -norte, origen del catastro del hotel.
import * as THREE from 'three';

const GKEY = 'AIzaSyCF2MXjc0DYRFrHk7j_BCyxVpWOdYqDIC4';
const LON0 = -74.043696, LAT0 = 4.704585, MLON = 110945, MLAT = 110574, DX = -13.47, DZ = 7.15;
const ORIGIN_LON = LON0 - DX / MLON, ORIGIN_LAT = LAT0 + DZ / MLAT;
const GROUND_H = 2575;   // altura elipsoidal aproximada del suelo; luego se calibra midiendo la malla

export class ContextoGoogle {
  /**
   * @param {object} o
   * @param {THREE.Object3D[]} o.footprint  objetos cuya huella en planta recorta la foto (el modelo)
   */
  constructor(scene, { renderer, camera, footprint = [], mobile = false, low = false, onReady } = {}) {
    this.scene = scene; this.renderer = renderer; this.camera = camera; this.onReady = onReady;
    this.group = new THREE.Group(); this.group.name = 'ContextoGoogle';
    scene.add(this.group);
    this.goal = mobile ? 16 : (low ? 10 : 6);
    this.dy = 0; this.t = 0; this.calib = 0; this.failed = false;
    this.uniforms = {
      uMask: { value: null }, uMaskBox: { value: new THREE.Vector3() },
      uLuz: { value: new THREE.Color(1, 1, 1) }, uSat: { value: 1.0 }, uShadow: { value: 1 },
    };
    this._mask(footprint);
    this._init().catch((e) => { console.warn('Malla de Google no disponible', e); this.failed = true; this.onFail?.(); });
  }

  /** Máscara en planta: blanco donde está el modelo (con un borde de 1 m). */
  _mask(objs) {
    const box = new THREE.Box3();
    objs.forEach((o) => box.expandByObject(o));
    const pad = 4, size = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) + pad * 2;
    const x0 = (box.min.x + box.max.x) / 2 - size / 2, z0 = (box.min.z + box.max.z) / 2 - size / 2;
    const px = 1024, k = px / size;
    const raw = document.createElement('canvas'); raw.width = raw.height = px;
    const g = raw.getContext('2d');
    g.fillStyle = '#fff';
    const v = new THREE.Vector3();
    // solo el relleno de los triángulos (sin trazo: con cientos de miles de triángulos el trazo congela la página)
    for (const root of objs) root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const pos = o.geometry.attributes.position, idx = o.geometry.index;
      const n = idx ? idx.count : pos.count;
      o.updateWorldMatrix(true, false);
      const e = o.matrixWorld.elements;
      const X = (j) => { v.fromBufferAttribute(pos, j); return (e[0] * v.x + e[4] * v.y + e[8] * v.z + e[12] - x0) * k; };
      const Z = (j) => (e[2] * v.x + e[6] * v.y + e[10] * v.z + e[14] - z0) * k;
      g.beginPath();
      for (let i = 0; i + 2 < n; i += 3) {
        for (let t = 0; t < 3; t++) { const j = idx ? idx.getX(i + t) : i + t; const x = X(j), z = Z(j); if (t) g.lineTo(x, z); else g.moveTo(x, z); }
      }
      g.fill();
    });
    // margen de ~1 m alrededor del modelo con un desenfoque (en el shader se corta en un umbral bajo)
    const cv = document.createElement('canvas'); cv.width = cv.height = px;
    const g2 = cv.getContext('2d');
    g2.fillStyle = '#000'; g2.fillRect(0, 0, px, px);
    g2.filter = `blur(${Math.max(1, 0.8 * k)}px)`;
    g2.drawImage(raw, 0, 0); g2.drawImage(raw, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.flipY = false; tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    this.uniforms.uMask.value = tex;
    this.uniforms.uMaskBox.value.set(x0, z0, size);
    this.center = new THREE.Vector3((box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2);
    this.radius = size / 2;
  }

  async _init() {
    const [TR, PL, { DRACOLoader }] = await Promise.all([
      import('3d-tiles-renderer'), import('3d-tiles-renderer/plugins'), import('three/addons/loaders/DRACOLoader.js'),
    ]);
    const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
    const tiles = new TR.TilesRenderer();
    tiles.registerPlugin(new PL.GoogleCloudAuthPlugin({ apiToken: GKEY, autoRefreshToken: true }));
    tiles.registerPlugin(new PL.GLTFExtensionsPlugin({ dracoLoader: draco }));
    tiles.setCamera(this.camera); tiles.setResolutionFromRenderer(this.camera, this.renderer);
    tiles.errorTarget = 40;
    const D2R = Math.PI / 180, frame = new THREE.Matrix4();
    TR.WGS84_ELLIPSOID.getEastNorthUpFrame(ORIGIN_LAT * D2R, ORIGIN_LON * D2R, frame);
    frame.multiply(new THREE.Matrix4().makeTranslation(0, 0, GROUND_H));
    this.M = new THREE.Matrix4().makeRotationX(-Math.PI / 2).multiply(frame.invert());
    tiles.group.matrixAutoUpdate = false;
    tiles.group.visible = false;   // se muestra cuando ya está calibrada y nítida (sin bloques gruesos ni saltos de altura)
    this.tiles = tiles; this._place();

    const aniso = this.renderer.capabilities.getMaxAnisotropy(), U = this.uniforms;
    tiles.addEventListener('load-model', ({ scene: s }) => s.traverse((c) => {
      const old = c.isMesh && c.material; if (!old || !old.map) return;
      old.map.anisotropy = aniso;
      // material con luces para leer el mapa de sombras; la foto va como emisivo (no se re-ilumina)
      const m = c.material = new THREE.MeshStandardMaterial({ emissiveMap: old.map, emissive: 0xffffff, color: 0x000000, roughness: 1, metalness: 0, envMapIntensity: 0, flatShading: true });
      old.dispose();
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vCtxXZ;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvCtxXZ = (modelMatrix * vec4(transformed, 1.0)).xz;')
          // la malla no trae normales: sin una normal válida el sesgo de la sombra da NaN
          .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = vec3(0.0, 0.0, 1.0);');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec2 vCtxXZ; uniform sampler2D uMask; uniform vec3 uMaskBox; uniform vec3 uLuz; uniform float uSat; uniform float uShadow;')
          .replace('#include <shadowmap_pars_fragment>', '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>')
          .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
            { vec2 muv = (vCtxXZ - uMaskBox.xy) / uMaskBox.z;
              if (muv.x > 0.0 && muv.x < 1.0 && muv.y > 0.0 && muv.y < 1.0 && texture2D(uMask, muv).r > 0.12) discard; }`)
          .replace('#include <opaque_fragment>', `{ vec3 c = pow(max(outgoingLight, 0.0), vec3(0.86));
              float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
              c = max(mix(vec3(l), c, uSat), 0.0);
              float sh = 1.0 - getShadowMask();
              c *= mix(vec3(1.0), vec3(0.45, 0.48, 0.56), sh * uShadow);
              outgoingLight = c * uLuz; }
            #include <opaque_fragment>`);
      };
      m.customProgramCacheKey = () => 'ctxGoogle';
      c.castShadow = false; c.receiveShadow = true;
    }));
    let errs = 0;
    tiles.addEventListener('load-error', (e) => { if (++errs === 1) console.warn('tesela de Google', e?.error?.message || e); });
    this.group.add(tiles.group);
  }

  _place() {
    const g = this.tiles.group;
    g.matrix.makeTranslation(0, this.dy, 0).multiply(this.M);
    g.matrixWorldNeedsUpdate = true; g.updateMatrixWorld(true);
  }

  /** Suelo de la foto a y = 0: mide la malla en un anillo alrededor del predio (percentil bajo: calle, no techos). */
  _calibrate() {
    const st = this.tiles.stats;
    if (st.downloading + st.parsing > 4 || this.tiles.errorTarget > 16) return false;
    const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), hits = [];
    for (let a = 0; a < 48; a++) for (const r of [this.radius + 12, this.radius + 30]) {
      const x = this.center.x + Math.cos(a / 48 * Math.PI * 2) * r, z = this.center.z + Math.sin(a / 48 * Math.PI * 2) * r;
      rc.set(new THREE.Vector3(x, 600, z), down);
      const h = rc.intersectObject(this.tiles.group, true)[0];
      if (h && Math.abs(h.point.y) < 80) hits.push(h.point.y);
    }
    if (hits.length < 20) return false;
    hits.sort((a, b) => a - b);
    this.dy -= hits[Math.floor(hits.length * 0.15)];
    this._place();
    return true;
  }

  /** Brillo de la foto según la intensidad del sol del visor (0..1). */
  setDaylight(k) {
    const b = 0.2 + 0.9 * k;
    this.uniforms.uLuz.value.setRGB(b * 1.02, b, b * 0.97);
    this.uniforms.uShadow.value = k;
  }

  update(dt) {
    const tl = this.tiles; if (!tl || this.failed) return;
    try {
      tl.setResolutionFromRenderer(this.camera, this.renderer);
      this.camera.updateMatrixWorld(); tl.update();
      const st = tl.stats;
      if (tl.errorTarget > this.goal && st.downloading === 0 && st.parsing === 0 && st.visible > 3) tl.errorTarget = Math.max(this.goal, Math.round(tl.errorTarget * 0.62));
      this.t += dt;
      if (this.calib < 2 && this.t > [2.5, 10][this.calib]) {
        if (this._calibrate()) { this.calib++; if (this.calib === 1) { tl.group.visible = true; this.onReady?.(); } } else this.t -= 1;
      }
      if ((this._at = (this._at || 0) - dt) <= 0) {
        this._at = 2;
        const t = tl.getAttributions().filter((a) => a.type === 'string').map((a) => a.value).join(' · ');
        this.attribution = /^google/i.test(t) ? t : 'Google' + (t ? ' · ' + t : '');
        this.onAttribution?.(this.attribution);
      }
    } catch (e) { if (!this._warned) { this._warned = true; console.warn('malla de Google', e); } }
  }
}
