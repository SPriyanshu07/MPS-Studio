/**
 * MPS Studio — 3D Character Engine
 * Builds a stylized human character using Three.js primitives.
 * No external model files required — runs entirely in-browser.
 *
 * Usage:
 *   const char = new MPSCharacter('canvas-id');
 *   char.play('wave');   // 'idle' | 'talk' | 'wave' | 'point'
 */

(function (global) {
  'use strict';

  class MPSCharacter {
    constructor(canvasId, opts) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas || typeof THREE === 'undefined') return;

      this.opts = Object.assign({ cameraY: 1.1, cameraZ: 4.2 }, opts || {});
      this.clock = new THREE.Clock();
      this.state = 'idle';
      this.t = 0;
      this.parts = {};

      this._init();
    }

    /* ─── Scene Setup ──────────────────────────────────────── */
    _init() {
      this._scene();
      this._camera();
      this._renderer();
      this._lights();
      this._character();
      this._particles();
      this._platform();
      this._resize();
      this._loop();
    }

    _scene() {
      this.scene = new THREE.Scene();
    }

    _camera() {
      const { clientWidth: w, clientHeight: h } = this.canvas;
      this.cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
      this.cam.position.set(0, this.opts.cameraY, this.opts.cameraZ);
      this.cam.lookAt(0, 1.1, 0);
    }

    _renderer() {
      this.rdr = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
      this.rdr.setPixelRatio(Math.min(devicePixelRatio, 2));
      this.rdr.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
      this.rdr.shadowMap.enabled = true;
      this.rdr.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    _lights() {
      // Ambient
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      // Key light — warm from top right
      const key = new THREE.DirectionalLight(0xF3F0E9, 1.4);
      key.position.set(3, 5, 3);
      key.castShadow = true;
      this.scene.add(key);

      // Lime accent fill — from left
      this.limeLight = new THREE.PointLight(0x5577B8, 2.2, 12);
      this.limeLight.position.set(-2.5, 2, 2);
      this.scene.add(this.limeLight);

      // Rim from behind
      this.rimLight = new THREE.PointLight(0xF3F0E9, 0.8, 8);
      this.rimLight.position.set(0, 3, -3);
      this.scene.add(this.rimLight);

      // Warm ground bounce
      const bounce = new THREE.PointLight(0xF59E0B, 0.4, 6);
      bounce.position.set(0, -1, 1);
      this.scene.add(bounce);
    }

    /* ─── Character Construction ───────────────────────────── */
    _mat(color, opts) {
      return new THREE.MeshPhysicalMaterial(Object.assign({ color }, opts || {}));
    }

    _mesh(geo, mat) {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      return m;
    }

    _character() {
      const p = this.parts;
      const mat = {
        suit:   this._mat(0x1a1a2e, { metalness: 0.25, roughness: 0.55 }),
        shirt:  this._mat(0xE8E8F0, { metalness: 0.0,  roughness: 0.85 }),
        skin:   this._mat(0xC0834A, { metalness: 0.0,  roughness: 0.88 }),
        hair:   this._mat(0x0D0705, { metalness: 0.0,  roughness: 0.9  }),
        eye:    this._mat(0x5577B8, { emissive: 0x5577B8, emissiveIntensity: 1.2, roughness: 0 }),
        shoe:   this._mat(0x0a0a0a, { metalness: 0.4, roughness: 0.4 }),
        lime:   this._mat(0x5577B8, { metalness: 0.1, roughness: 0.45 }),
        nose:   this._mat(0xA06030, { roughness: 0.9 }),
      };

      this.root = new THREE.Group();

      /* ── FEET & LEGS ── */
      const legGroup = new THREE.Group();

      const thighGeo = new THREE.CylinderGeometry(0.088, 0.078, 0.50, 18);
      const shinGeo  = new THREE.CylinderGeometry(0.068, 0.060, 0.44, 18);
      const shoeGeo  = new THREE.BoxGeometry(0.130, 0.065, 0.220);

      [[-0.115, 0.115]].flat().forEach((x, i) => {
        const side = i === 0 ? -1 : 1;
        const thigh = this._mesh(thighGeo, mat.suit);
        thigh.position.set(side * 0.115, 0.48, 0);
        const shin = this._mesh(shinGeo, mat.suit);
        shin.position.set(side * 0.115, 0.02, 0);
        const shoe = this._mesh(shoeGeo, mat.shoe);
        shoe.position.set(side * 0.115, -0.205, 0.04);
        legGroup.add(thigh, shin, shoe);
      });

      this.root.add(legGroup);

      /* ── TORSO ── */
      p.torso = new THREE.Group();
      p.torso.position.y = 0.74;

      const torsoBody = this._mesh(new THREE.BoxGeometry(0.46, 0.60, 0.225), mat.suit);
      torsoBody.position.y = 0.30;
      p.torso.add(torsoBody);

      // Shirt strip
      const shirtStrip = this._mesh(new THREE.BoxGeometry(0.115, 0.50, 0.228), mat.shirt);
      shirtStrip.position.set(0, 0.30, 0);
      p.torso.add(shirtStrip);

      // Lime tie (brand)
      const tie = this._mesh(new THREE.BoxGeometry(0.048, 0.34, 0.23), mat.lime);
      tie.position.set(0, 0.16, 0);
      p.torso.add(tie);

      // Belt
      const belt = this._mesh(new THREE.BoxGeometry(0.47, 0.055, 0.228), mat.shoe);
      belt.position.y = 0.02;
      p.torso.add(belt);

      // Jacket lapels
      [-1, 1].forEach(s => {
        const lapel = this._mesh(new THREE.BoxGeometry(0.11, 0.24, 0.232), mat.suit);
        lapel.position.set(s * 0.10, 0.30, 0);
        lapel.rotation.z = -s * 0.22;
        p.torso.add(lapel);
      });

      this.root.add(p.torso);

      /* ── ARMS ── */
      const upperArmGeo = new THREE.CylinderGeometry(0.068, 0.060, 0.34, 18);
      const forearmGeo  = new THREE.CylinderGeometry(0.054, 0.048, 0.30, 18);
      const handGeo     = new THREE.SphereGeometry(0.063, 18, 18);

      [-1, 1].forEach(s => {
        const armG = new THREE.Group();
        armG.position.set(s * 0.275, 1.36, 0);

        const upper = this._mesh(upperArmGeo, mat.suit); upper.position.y = -0.17;
        const fore  = this._mesh(forearmGeo,  mat.suit); fore.position.y  = -0.49;
        const hand  = this._mesh(handGeo,     mat.skin); hand.position.y  = -0.68;

        armG.add(upper, fore, hand);
        this.root.add(armG);

        if (s === -1) p.armL = armG;
        else          p.armR = armG;
      });

      /* ── NECK ── */
      const neck = this._mesh(new THREE.CylinderGeometry(0.058, 0.068, 0.115, 16), mat.skin);
      neck.position.set(0, 1.62, 0);
      this.root.add(neck);

      /* ── HEAD GROUP ── */
      p.head = new THREE.Group();
      p.head.position.set(0, 1.82, 0);

      const headMesh = this._mesh(new THREE.SphereGeometry(0.165, 32, 32), mat.skin);
      headMesh.scale.set(1, 1.08, 0.96);
      p.head.add(headMesh);

      // Hair cap
      const hairCap = this._mesh(new THREE.SphereGeometry(0.170, 32, 32), mat.hair);
      hairCap.scale.set(1, 0.62, 1.0);
      hairCap.position.y = 0.075;
      p.head.add(hairCap);

      // Hair back
      const hairBack = this._mesh(new THREE.SphereGeometry(0.160, 24, 24), mat.hair);
      hairBack.scale.set(0.9, 0.78, 0.72);
      hairBack.position.set(0, 0.02, -0.07);
      p.head.add(hairBack);

      // Eyes (lime glowing)
      [-1, 1].forEach(s => {
        const eye = this._mesh(new THREE.SphereGeometry(0.022, 16, 16), mat.eye);
        eye.position.set(s * 0.062, 0.022, 0.152);
        p.head.add(eye);
      });

      // Eye glow light
      const eyeGlow = new THREE.PointLight(0x5577B8, 0.4, 0.6);
      eyeGlow.position.set(0, 0.022, 0.16);
      p.head.add(eyeGlow);

      // Eyebrows
      const browGeo = new THREE.BoxGeometry(0.048, 0.008, 0.008);
      const browMat = this._mat(0x0D0705);
      [-1, 1].forEach(s => {
        const b = this._mesh(browGeo, browMat);
        b.position.set(s * 0.062, 0.068, 0.153);
        p.head.add(b);
      });

      // Nose
      const nose = this._mesh(new THREE.SphereGeometry(0.016, 10, 10), mat.nose);
      nose.position.set(0, -0.018, 0.163);
      p.head.add(nose);

      // Mouth
      const mouthGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 20, Math.PI);
      const mouth = this._mesh(mouthGeo, this._mat(0x7A3030));
      mouth.position.set(0, -0.068, 0.152);
      mouth.rotation.z = Math.PI;
      p.head.add(mouth);

      // Ears
      const earGeo = new THREE.SphereGeometry(0.038, 16, 16);
      const earMat = this._mat(0xA06030, { roughness: 0.9 });
      [-1, 1].forEach(s => {
        const ear = this._mesh(earGeo, earMat);
        ear.scale.set(0.48, 0.68, 0.4);
        ear.position.set(s * 0.168, 0, 0);
        p.head.add(ear);
      });

      this.root.add(p.head);

      this.scene.add(this.root);
    }

    /* ─── Floating Platform ─────────────────────────────────── */
    _platform() {
      const geo = new THREE.CircleGeometry(0.55, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x5577B8,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.26;
      this.scene.add(ring);

      // Glowing ring outline
      const torusGeo = new THREE.TorusGeometry(0.55, 0.01, 8, 64);
      const torusMat = new THREE.MeshBasicMaterial({ color: 0x5577B8, transparent: true, opacity: 0.3 });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.x = -Math.PI / 2;
      torus.position.y = -0.26;
      this.scene.add(torus);
    }

    /* ─── Particles ─────────────────────────────────────────── */
    _particles() {
      const count = 70;
      const pos   = new Float32Array(count * 3);
      const col   = new Float32Array(count * 3);
      this._pBase = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const r = 1.0 + Math.random() * 0.9;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.random() * Math.PI;
        const x = r * Math.sin(ph) * Math.cos(th);
        const y = r * Math.cos(ph) + 1.0;
        const z = r * Math.sin(ph) * Math.sin(th) * 0.55;

        pos[i*3]   = this._pBase[i*3]   = x;
        pos[i*3+1] = this._pBase[i*3+1] = y;
        pos[i*3+2] = this._pBase[i*3+2] = z;

        // Lime or off-white particles
        if (Math.random() > 0.4) {
          col[i*3]=0.843; col[i*3+1]=1.0; col[i*3+2]=0.392; // lime
        } else {
          col[i*3]=0.952; col[i*3+1]=0.941; col[i*3+2]=0.913; // off-white
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

      const mat = new THREE.PointsMaterial({
        size: 0.028,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      this.ptcl = new THREE.Points(geo, mat);
      this.scene.add(this.ptcl);
    }

    /* ─── Animation System ──────────────────────────────────── */
    play(state) {
      this.state = state;
      this.t = 0;
    }

    _animate(dt) {
      const { parts: p, state, t } = this;
      this.t += dt;
      const s = this.t;

      // Default resets (blend toward neutral)
      const lerp = (a, b, f) => a + (b - a) * f;
      const lf = 0.07;

      switch (state) {
        /* ── IDLE ── */
        case 'idle':
          this.root.position.y  = Math.sin(s * 0.85) * 0.045;
          p.torso.scale.y       = 1 + Math.sin(s * 1.6) * 0.012;
          p.head.rotation.y     = Math.sin(s * 0.7) * 0.09;
          p.head.rotation.z     = Math.sin(s * 0.5) * 0.03;
          p.head.rotation.x     = 0;
          p.armL.rotation.z     =  0.10 + Math.sin(s * 1.6) * 0.02;
          p.armR.rotation.z     = -0.10 + Math.sin(s * 1.6) * 0.02;
          p.armL.rotation.x     = 0;
          p.armR.rotation.x     = 0;
          p.armR.rotation.y     = 0;
          break;

        /* ── TALK ── */
        case 'talk':
          this.root.position.y  = Math.sin(s * 1.1) * 0.030;
          p.torso.scale.y       = 1 + Math.sin(s * 2.0) * 0.014;
          p.torso.rotation.y    = Math.sin(s * 0.8) * 0.05;
          p.head.rotation.x     = Math.sin(s * 3.0) * 0.07;
          p.head.rotation.y     = Math.sin(s * 1.6) * 0.11;
          p.head.rotation.z     = Math.sin(s * 1.1) * 0.04;
          p.armR.rotation.z     = -0.30 + Math.sin(s * 2.5) * 0.22;
          p.armR.rotation.x     = Math.sin(s * 2.0) * 0.14;
          p.armR.rotation.y     = 0;
          p.armL.rotation.z     =  0.18 + Math.sin(s * 1.8) * 0.09;
          p.armL.rotation.x     = 0;
          break;

        /* ── WAVE ── */
        case 'wave':
          this.root.position.y  = Math.sin(s * 1.0) * 0.04;
          p.torso.scale.y       = 1 + Math.sin(s * 1.5) * 0.011;
          p.head.rotation.y     = 0;
          p.head.rotation.x     = 0;
          p.head.rotation.z     = Math.sin(s * 1.8) * 0.05;
          p.armR.rotation.z     = -1.20 + Math.sin(s * 4.5) * 0.35;
          p.armR.rotation.x     = -0.25;
          p.armR.rotation.y     = 0;
          p.armL.rotation.z     =  0.12;
          p.armL.rotation.x     = 0;
          break;

        /* ── POINT ── */
        case 'point':
          this.root.position.y  = Math.sin(s * 0.85) * 0.035;
          p.torso.scale.y       = 1 + Math.sin(s * 1.5) * 0.010;
          p.torso.rotation.y    = -0.10;
          p.head.rotation.y     = -0.18;
          p.head.rotation.x     = 0;
          p.head.rotation.z     = 0;
          p.armR.rotation.z     = -1.42;
          p.armR.rotation.x     =  0.18;
          p.armR.rotation.y     = -0.35;
          p.armL.rotation.z     =  0.12;
          p.armL.rotation.x     = 0;
          break;
      }

      // Animate particles
      if (this.ptcl) {
        const posArr = this.ptcl.geometry.attributes.position.array;
        for (let i = 0; i < posArr.length / 3; i++) {
          posArr[i*3+1] = this._pBase[i*3+1] + Math.sin(s * 0.6 + i * 0.55) * 0.12;
        }
        this.ptcl.geometry.attributes.position.needsUpdate = true;
        this.ptcl.rotation.y += dt * 0.09;
      }

      // Pulse lights
      if (this.limeLight) this.limeLight.intensity = 2.2 + Math.sin(s * 2.0) * 0.35;
      if (this.rimLight)  this.rimLight.intensity  = 0.8 + Math.sin(s * 1.5 + 1) * 0.15;
    }

    /* ─── Render Loop ───────────────────────────────────────── */
    _loop() {
      const tick = () => {
        requestAnimationFrame(tick);
        const dt = this.clock.getDelta();
        this._animate(dt);
        this.rdr.render(this.scene, this.cam);
      };
      tick();
    }

    /* ─── Resize ─────────────────────────────────────────────── */
    _resize() {
      const parent = this.canvas.parentElement;
      if (!parent) return;
      const ro = new ResizeObserver(() => {
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        if (!w || !h) return;
        this.rdr.setSize(w, h, false);
        this.cam.aspect = w / h;
        this.cam.updateProjectionMatrix();
      });
      ro.observe(parent);
    }

    /* ─── Public helpers ─────────────────────────────────────── */
    idle()  { this.play('idle');  }
    talk()  { this.play('talk');  }
    wave()  { this.play('wave');  }
    point() { this.play('point'); }
  }

  global.MPSCharacter = MPSCharacter;
})(window);
