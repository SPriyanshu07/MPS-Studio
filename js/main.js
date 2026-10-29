/**
 * MPS Studio — Main JS
 * Navigation, scroll reveal, counters, speech bubble typing, tilt, scroll-top.
 */

/* ─── Navigation ─────────────────────────────────────────────── */
(function initNav() {
  const navbar   = document.querySelector('.navbar');
  const burger   = document.querySelector('.nav-burger');
  const navLinks = document.querySelector('.nav-links');

  if (!navbar) return;

  // Scroll → add .scrolled class
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile hamburger
  burger?.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks?.classList.toggle('open');
  });

  // Close on link click (mobile)
  navLinks?.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
    link.addEventListener('click', () => {
      burger?.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Highlight active page
  const page = location.pathname.split('/').pop() || 'index.html';
  navLinks?.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
})();

/* ─── Scroll Reveal ─────────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* ─── Counter Animation ─────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-num[data-target]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animate = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const dur = 2200;
    const start = performance.now();

    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor(easeOut(p) * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
})();

/* ─── Speech Bubble Typing ──────────────────────────────────── */
window.typeInBubble = function (textEl, text, speed) {
  speed = speed || 38;
  return new Promise(resolve => {
    textEl.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'bubble-cursor';
    textEl.appendChild(cursor);
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        cursor.insertAdjacentText('beforebegin', text[i++]);
        setTimeout(tick, speed + Math.random() * 20);
      } else {
        setTimeout(() => { cursor.remove(); resolve(); }, 400);
      }
    };
    tick();
  });
};

/* ─── Speech Bubble Controller ─────────────────────────────── */
window.SpeechBubble = function (bubbleEl, textEl) {
  let queue = [], busy = false;

  function next() {
    if (!queue.length) { busy = false; return; }
    busy = true;
    const msg = queue.shift();
    bubbleEl.classList.add('show');
    window.typeInBubble(textEl, msg).then(() => {
      setTimeout(next, 2400);
    });
  }

  return {
    say(msg) {
      queue = [msg]; // replace queue with new message
      if (!busy) next();
    },
    queue(msgs) {
      queue = [...msgs];
      if (!busy) next();
    },
    hide() {
      bubbleEl.classList.remove('show');
      queue = []; busy = false;
    },
  };
};

/* ─── Scroll-to-Top ─────────────────────────────────────────── */
(function initScrollTop() {
  const btn = document.querySelector('.scroll-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', () =>
    btn.classList.toggle('show', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ─── Card Tilt ─────────────────────────────────────────────── */
(function initTilt() {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 10;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 10;
      card.style.transform = `perspective(900px) rotateX(${-y}deg) rotateY(${x}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ─── Portfolio Filter ──────────────────────────────────────── */
(function initFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.portfolio-item');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      items.forEach(item => {
        const show = cat === 'all' || item.dataset.cat === cat;
        item.style.opacity = show ? '1' : '0.2';
        item.style.pointerEvents = show ? '' : 'none';
        item.style.transform = show ? '' : 'scale(0.96)';
      });
    });
  });
})();

/* ─── Form Validation ───────────────────────────────────────── */
window.validateForm = function (formEl) {
  let valid = true;
  formEl.querySelectorAll('[required]').forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = '#EF4444';
      valid = false;
    } else {
      input.style.borderColor = '';
    }
  });
  return valid;
};

/* ─── Contact Form ──────────────────────────────────────────── */
(function initContact() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!window.validateForm(form)) return;
    const btn = form.querySelector('[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '✓ Message Sent!';
      btn.style.background = '#5577B8';
      btn.style.color = '#171717';
      form.reset();
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 3000);
    }, 1600);
  });
})();

/* ─── Cursor Sparkle ────────────────────────────────────────── */
(function initSparkle() {
  if (window.innerWidth < 900) return;
  document.addEventListener('mousemove', e => {
    if (Math.random() > 0.82) {
      const d = document.createElement('div');
      d.style.cssText = `
        position:fixed; left:${e.clientX}px; top:${e.clientY}px;
        width:5px; height:5px; border-radius:50%;
        background:rgba(215,255,100,0.75);
        pointer-events:none; z-index:9997;
        transition: transform 0.7s ease, opacity 0.7s ease;
      `;
      document.body.appendChild(d);
      requestAnimationFrame(() => {
        d.style.transform = `translate(${(Math.random()-0.5)*30}px,${(Math.random()-0.5)*30}px) scale(0)`;
        d.style.opacity = '0';
      });
      setTimeout(() => d.remove(), 700);
    }
  });
})();
