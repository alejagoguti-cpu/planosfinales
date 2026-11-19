// Tour VR 360° Hiperrealista (Panoramas Equirectangulares 2:1 renderizados en Arnold)
// Estilo Bear Studios VR: giro suave 360°, hotspots interactivos en el piso, navegación con flechas y transición fluida.
import * as THREE from 'three';

const NODES = {
  camas: {
    id: 'camas',
    label: 'Zona Camas',
    pano: 'assets/vr/vr_hab_camas.jpg',
    fallback: 'assets/vr/vr_hab_camas.png',
    initialYaw: 0,
    hotspots: [
      { target: 'ventana', label: 'Ir a Ventana & Poltronas', yaw: -32, pitch: -24 },
      { target: 'bano', label: 'Entrar al Baño', yaw: 148, pitch: -22 },
    ],
  },
  ventana: {
    id: 'ventana',
    label: 'Ventana & TV',
    pano: 'assets/vr/vr_hab_ventana.jpg',
    fallback: 'assets/vr/vr_hab_ventana.png',
    initialYaw: 180,
    hotspots: [
      { target: 'camas', label: 'Volver a Camas', yaw: 165, pitch: -24 },
      { target: 'bano', label: 'Entrar al Baño', yaw: 205, pitch: -20 },
    ],
  },
  bano: {
    id: 'bano',
    label: 'Baño Privado',
    pano: 'assets/vr/vr_bano.jpg',
    fallback: 'assets/vr/vr_bano.png',
    initialYaw: 0,
    hotspots: [
      { target: 'camas', label: 'Salir a la Habitación', yaw: 180, pitch: -24 },
    ],
  },
};

export class TourVR360 {
  constructor() {
    this.open = false;
    this.currentId = 'camas';
    this.roomInfo = null;
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.fov = 68;
    this.targetFov = 68;
    this.keys = new Set();
    this.texCache = new Map();
    this.hotspotEls = [];
    this.history = [];
    this._buildDOM();
    this._initThree();
    this._bindEvents();
  }

  _buildDOM() {
    const root = this.root = document.createElement('div');
    root.className = 'vr360-overlay';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Recorrido Virtual 360°');
    root.innerHTML = `
      <div class="vr360-canvas-wrap" data-vr-canvas></div>
      <div class="vr360-hotspots" data-vr-hotspots></div>
      <div class="vr360-fade" data-vr-fade></div>
      <div class="vr360-header">
        <div class="vr360-badge">
          <span class="vr360-dot"></span>
          <div>
            <div class="vr360-title" data-vr-title>Habitación 216 · Tour VR 360°</div>
            <div class="vr360-sub" data-vr-sub>Zona Camas · Render Arnold PBR</div>
          </div>
        </div>
        <div class="vr360-top-actions">
          <button type="button" class="vr360-btn" data-vr-fs title="Pantalla completa">⛶</button>
          <button type="button" class="vr360-btn vr360-close" data-vr-close>✕ Volver al Piso 2</button>
        </div>
      </div>
      <div class="vr360-bar">
        <div class="vr360-nav" data-vr-nav>
          <button type="button" data-vr-goto="camas">Zona Camas</button>
          <button type="button" data-vr-goto="ventana">Ventana &amp; TV</button>
          <button type="button" data-vr-goto="bano">Baño</button>
        </div>
        <div class="vr360-hint">Arrastra para girar 360° · ↑ ↓ ← → para caminar · Esc salir</div>
      </div>
    `;
    document.body.append(root);
    this.canvasWrap = root.querySelector('[data-vr-canvas]');
    this.hotspotsEl = root.querySelector('[data-vr-hotspots]');
    this.fadeEl = root.querySelector('[data-vr-fade]');
    this.titleEl = root.querySelector('[data-vr-title]');
    this.subEl = root.querySelector('[data-vr-sub]');
    this.navEl = root.querySelector('[data-vr-nav]');
  }

  _initThree() {
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping; // Los panoramas Arnold ya traen ACES Tonemap horneado
    this.canvasWrap.append(r.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fov, 16 / 9, 0.1, 200);
    this.camera.rotation.order = 'YXZ';

    const geo = new THREE.SphereGeometry(50, 72, 48);
    geo.scale(-1, 1, 1);
    this.mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.sphere = new THREE.Mesh(geo, this.mat);
    this.scene.add(this.sphere);

    this.loader = new THREE.TextureLoader();

    const loop = () => {
      requestAnimationFrame(loop);
      if (!this.open) return;
      this._tick();
      r.render(this.scene, this.camera);
      this._updateHotspots();
    };
    requestAnimationFrame(loop);
  }

  _loadPano(node) {
    if (this.texCache.has(node.id)) return Promise.resolve(this.texCache.get(node.id));
    return new Promise((resolve) => {
      const finish = (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        this.texCache.set(node.id, tex);
        resolve(tex);
      };
      this.loader.load(node.pano, finish, undefined, () => {
        this.loader.load(node.fallback, finish, undefined, () => resolve(null));
      });
    });
  }

  async show(room, startNode = 'camas') {
    this.roomInfo = room;
    this.open = true;
    this.root.hidden = false;
    document.body.style.overflow = 'hidden';
    this._resize();
    this.titleEl.textContent = `Habitación ${room?.n ?? '216'} · ${room?.tipo ?? 'Doble'} — Tour VR 360°`;
    this.history = [];
    await this.goTo(startNode, true);
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.root.hidden = true;
    document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  async goTo(id, instant = false) {
    const node = NODES[id];
    if (!node) return;
    if (!instant && id !== this.currentId) this.history.push(this.currentId);

    if (!instant) {
      // Animación suave tipo Bear Studios: zoom hacia adelante + crossfade
      this.targetFov = Math.max(46, this.fov - 16);
      this.fadeEl.classList.add('is-fading');
      await new Promise((r) => setTimeout(r, 240));
    }

    const tex = await this._loadPano(node);
    if (tex) {
      this.mat.map = tex;
      this.mat.needsUpdate = true;
    }

    this.currentId = id;
    this.targetYaw = THREE.MathUtils.degToRad(node.initialYaw || 0);
    this.targetPitch = 0;
    if (instant) {
      this.yaw = this.targetYaw;
      this.pitch = 0;
    }
    this.fov = 76;
    this.targetFov = 68;
    this.subEl.textContent = `${node.label} · Render Arnold 360° PBR`;

    this.navEl.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.vrGoto === id);
    });
    this._renderHotspots(node);

    // Precargar destinos conectados
    for (const h of node.hotspots) {
      if (NODES[h.target]) this._loadPano(NODES[h.target]);
    }

    requestAnimationFrame(() => this.fadeEl.classList.remove('is-fading'));
  }

  _renderHotspots(node) {
    this.hotspotsEl.innerHTML = '';
    this.hotspotEls = node.hotspots.map((h) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vr360-hotspot';
      btn.innerHTML = `<span class="vr360-ring"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></span><span class="vr360-hs-label">${h.label}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goTo(h.target);
      });
      this.hotspotsEl.append(btn);
      const yawR = THREE.MathUtils.degToRad(h.yaw);
      const pitchR = THREE.MathUtils.degToRad(h.pitch);
      const pos = new THREE.Vector3(
        -Math.sin(yawR) * Math.cos(pitchR) * 18,
        Math.sin(pitchR) * 18,
        -Math.cos(yawR) * Math.cos(pitchR) * 18,
      );
      return { btn, pos, data: h };
    });
  }

  _updateHotspots() {
    const w = this.canvasWrap.clientWidth;
    const h = this.canvasWrap.clientHeight;
    if (!w || !h) return;
    const v = new THREE.Vector3();
    for (const item of this.hotspotEls) {
      v.copy(item.pos).project(this.camera);
      const behind = v.z > 1;
      if (behind) {
        item.btn.style.display = 'none';
      } else {
        const x = (v.x * 0.5 + 0.5) * w;
        const y = (-v.y * 0.5 + 0.5) * h;
        item.btn.style.display = 'flex';
        item.btn.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
    }
  }

  _walkForward() {
    const node = NODES[this.currentId];
    if (!node || !node.hotspots.length) return;
    // Elegir el hotspot más alineado con la dirección actual de la cámara
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).setY(0).normalize();
    let best = node.hotspots[0];
    let bestDot = -2;
    for (const item of this.hotspotEls) {
      const d = item.pos.clone().setY(0).normalize().dot(fwd);
      if (d > bestDot) { bestDot = d; best = item.data; }
    }
    if (best) this.goTo(best.target);
  }

  _tick() {
    const turnSpeed = 0.032;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) this.targetYaw += turnSpeed;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) this.targetYaw -= turnSpeed;

    this.yaw += (this.targetYaw - this.yaw) * 0.14;
    this.pitch += (this.targetPitch - this.pitch) * 0.14;
    this.fov += (this.targetFov - this.fov) * 0.12;

    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    if (Math.abs(this.camera.fov - this.fov) > 0.05) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  _resize() {
    const w = this.canvasWrap.clientWidth || innerWidth;
    const h = this.canvasWrap.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _bindEvents() {
    addEventListener('resize', () => { if (this.open) this._resize(); });

    this.root.querySelector('[data-vr-close]').addEventListener('click', () => this.hide());
    this.root.querySelector('[data-vr-fs]').addEventListener('click', () => {
      if (!document.fullscreenElement) this.root.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.().catch(() => {});
    });
    this.navEl.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-vr-goto]');
      if (b) this.goTo(b.dataset.vrGoto);
    });

    // Giro 360° con mouse / táctil
    let dragging = false, lx = 0, ly = 0;
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      dragging = true; lx = e.clientX; ly = e.clientY;
      dom.setPointerCapture?.(e.pointerId);
    });
    dom.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      this.targetYaw += dx * 0.0042;
      this.targetPitch = Math.max(-1.05, Math.min(1.05, this.targetPitch + dy * 0.0036));
    });
    const endDrag = () => { dragging = false; };
    dom.addEventListener('pointerup', endDrag);
    dom.addEventListener('pointercancel', endDrag);

    // Zoom suave con rueda
    dom.addEventListener('wheel', (e) => {
      if (!this.open) return;
      e.preventDefault();
      this.targetFov = Math.max(42, Math.min(82, this.targetFov + e.deltaY * 0.04));
    }, { passive: false });

    // Flechas del teclado + WASD + Esc
    addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.key === 'Escape') { e.preventDefault(); this.hide(); return; }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); this._walkForward(); return; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        const prev = this.history.pop();
        if (prev) this.goTo(prev);
        else this._walkForward();
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        this.keys.add(e.code);
      }
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
  }
}
