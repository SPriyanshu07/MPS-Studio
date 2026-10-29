/**
 * MPS Studio — Spline 3D Character & Interactive Scene Controller
 * Replaces procedural Three.js character with interactive Spline 3D scene:
 * https://prod.spline.design/r4mYHSDaeSf-A5DF/scene.splinecode
 */

(function (global) {
  'use strict';

  const SPLINE_SCENE_URL = 'https://prod.spline.design/r4mYHSDaeSf-A5DF/scene.splinecode';

  class MPSCharacter {
    constructor(elementId, opts) {
      this.opts = Object.assign({ sceneUrl: SPLINE_SCENE_URL }, opts || {});
      this.el = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
      this.state = 'idle';
      this.app = null;

      // Auto-hide Spline watermark logo inside shadow DOM if present
      this._removeWatermark();
    }

    _removeWatermark() {
      const cleanLogo = () => {
        document.querySelectorAll('spline-viewer').forEach(viewer => {
          try {
            if (viewer.shadowRoot) {
              const logo = viewer.shadowRoot.querySelector('#logo');
              if (logo) logo.style.display = 'none';
            }
          } catch (_) {}
        });
      };

      cleanLogo();
      window.addEventListener('load', cleanLogo);
      setTimeout(cleanLogo, 1000);
      setTimeout(cleanLogo, 3000);
    }

    // Interactive helper stubs for existing animation triggers
    play(name) { this.state = name; }
    idle()  { this.play('idle'); }
    talk()  { this.play('talk'); }
    wave()  { this.play('wave'); }
    point() { this.play('point'); }
  }

  global.MPSCharacter = MPSCharacter;
  global.MPSSplineCharacter = MPSCharacter;
  global.SPLINE_SCENE_URL = SPLINE_SCENE_URL;

  // Auto clean watermark on page load
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('spline-viewer').forEach(v => {
      v.addEventListener('load', () => {
        try {
          const logo = v.shadowRoot?.querySelector('#logo');
          if (logo) logo.style.display = 'none';
        } catch (_) {}
      });
    });
  });
})(window);
