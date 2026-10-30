/**
 * MPS Studio — Spline 3D Scene Controller
 * Scene: https://prod.spline.design/r4mYHSDaeSf-A5DF/scene.splinecode
 *
 * Handles:
 *  - Spline watermark removal (aggressive multi-strategy)
 *  - MPSCharacter stub for backward compatibility
 */

(function (global) {
  'use strict';

  const SPLINE_SCENE_URL = 'https://prod.spline.design/r4mYHSDaeSf-A5DF/scene.splinecode';

  /* ─────────────────────────────────────────────────────────
     WATERMARK REMOVER
     Targets: #logo, a[href*="spline.design"], .logo inside
     the shadow DOM of every <spline-viewer> on the page.
  ───────────────────────────────────────────────────────── */
  const SELECTORS = [
    '#logo',
    'a[href*="spline.design"]',
    '.logo',
    '[class*="logo"]',
    '[id*="logo"]',
  ];

  function killWatermark(root) {
    SELECTORS.forEach(sel => {
      root.querySelectorAll(sel).forEach(el => {
        el.style.cssText += 'display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;';
      });
    });
  }

  function patchViewer(viewer) {
    // 1. Immediate attempt
    if (viewer.shadowRoot) killWatermark(viewer.shadowRoot);

    // 2. Watch shadow DOM for late-injected elements
    if (viewer.shadowRoot) {
      const mo = new MutationObserver(() => killWatermark(viewer.shadowRoot));
      mo.observe(viewer.shadowRoot, { childList: true, subtree: true });
    }

    // 3. Retry on the viewer's own load event
    viewer.addEventListener('load', () => {
      if (viewer.shadowRoot) {
        killWatermark(viewer.shadowRoot);
        // Watch again after load (Spline sometimes re-renders watermark)
        const mo = new MutationObserver(() => killWatermark(viewer.shadowRoot));
        mo.observe(viewer.shadowRoot, { childList: true, subtree: true, attributes: true });
      }
    });

    // 4. Timed retries as a safety net
    [500, 1000, 2000, 3500, 6000].forEach(ms =>
      setTimeout(() => { if (viewer.shadowRoot) killWatermark(viewer.shadowRoot); }, ms)
    );
  }

  function initWatermarkRemoval() {
    // Patch all existing viewers
    document.querySelectorAll('spline-viewer').forEach(patchViewer);

    // Watch for dynamically added viewers
    const bodyObserver = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'SPLINE-VIEWER') patchViewer(node);
          node.querySelectorAll && node.querySelectorAll('spline-viewer').forEach(patchViewer);
        });
      });
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Run as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWatermarkRemoval);
  } else {
    initWatermarkRemoval();
  }
  window.addEventListener('load', initWatermarkRemoval);


  /* ─────────────────────────────────────────────────────────
     MPSCharacter STUB — backward compatibility
  ───────────────────────────────────────────────────────── */
  class MPSCharacter {
    constructor(elementId, opts) {
      this.opts  = Object.assign({ sceneUrl: SPLINE_SCENE_URL }, opts || {});
      this.el    = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
      this.state = 'idle';
    }

    play(name) { this.state = name; }
    idle()  { this.play('idle'); }
    talk()  { this.play('talk'); }
    wave()  { this.play('wave'); }
    point() { this.play('point'); }
  }

  global.MPSCharacter       = MPSCharacter;
  global.MPSSplineCharacter = MPSCharacter;
  global.SPLINE_SCENE_URL   = SPLINE_SCENE_URL;

})(window);
