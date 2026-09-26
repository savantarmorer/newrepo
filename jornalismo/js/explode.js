/**
 * Scroll-driven exploded view for the course landing.
 * Phase 1 (assembled) → Phase 2 (explode) → Phase 3 (lock into Entrar / Assistir / Ferramentas).
 */
(function initExplode() {
  const root = document.querySelector('[data-jip-explode]');
  if (!root) return;

  const track = root.querySelector('.jip-explode-track');
  const stage = root.querySelector('.jip-explode-stage');
  const pieces = Array.from(root.querySelectorAll('[data-x]'));
  const phaseLabel = root.querySelector('[data-jip-explode-phase]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const PHASE_COPY = [
    'Curso montado',
    'Peças abertas',
    'Caminho do aluno'
  ];

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpState(a, b, t) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      r: lerp(a.r, b.r, t),
      s: lerp(a.s, b.s, t)
    };
  }

  function offsets() {
    const wide = window.matchMedia('(min-width: 860px)').matches;
    const vw = Math.min(window.innerWidth, 1440);
    const explode = wide ? Math.min(240, vw * 0.2) : Math.min(120, vw * 0.24);
    const col = wide ? Math.max(318, Math.min(340, vw * 0.22)) : 0;
    const stackY = wide ? 40 : 36;
    const finalY = wide ? -8 : 0;

    return {
      frame: {
        s: { x: 0, y: 0, r: 0, s: 1 },
        e: { x: 0, y: wide ? -24 : -14, r: 0, s: 0.96 },
        f: { x: 0, y: wide ? -140 : -110, r: 0, s: 0.7 }
      },
      login: {
        s: { x: 0, y: stackY * 0.1, r: 0, s: 1 },
        e: { x: wide ? -explode * 1.2 : -explode * 0.45, y: -explode * 0.5, r: wide ? -6 : -3, s: 1.03 },
        f: { x: -col, y: wide ? finalY : explode * 0.05, r: 0, s: 1 }
      },
      lesson: {
        s: { x: 0, y: stackY, r: 0, s: 1 },
        e: { x: wide ? explode * 1.15 : explode * 0.45, y: -explode * 0.3, r: wide ? 5 : 3, s: 1.03 },
        f: { x: 0, y: wide ? finalY : explode * 0.95, r: 0, s: 1 }
      },
      tools: {
        s: { x: 0, y: stackY * 1.9, r: 0, s: 1 },
        e: { x: wide ? explode * 0.1 : 0, y: explode * (wide ? 0.95 : 0.7), r: 3, s: 1.03 },
        f: { x: col, y: wide ? finalY : explode * 1.85, r: 0, s: 1 }
      }
    };
  }

  function blend(p) {
    if (p <= 0.18) return { a: 's', b: 's', t: 0, phase: 1 };
    if (p <= 0.5) return { a: 's', b: 'e', t: easeInOut((p - 0.18) / 0.32), phase: 2 };
    if (p <= 0.82) return { a: 'e', b: 'f', t: easeInOut((p - 0.5) / 0.32), phase: 3 };
    return { a: 'f', b: 'f', t: 1, phase: 3 };
  }

  function progress() {
    const rect = track.getBoundingClientRect();
    const travel = Math.max(1, track.offsetHeight - window.innerHeight);
    const raw = -rect.top / travel;
    return Math.min(1, Math.max(0, raw));
  }

  function applyReduced() {
    root.classList.add('is-reduced', 'is-locked');
    root.dataset.phase = '3';
    if (phaseLabel) phaseLabel.textContent = PHASE_COPY[2];
    pieces.forEach((piece) => {
      piece.style.transform = '';
      piece.style.opacity = '';
    });
    if (stage) stage.style.setProperty('--frame-fade', '0');
  }

  function applyMotion(p) {
    const map = offsets();
    const { a, b, t, phase } = blend(p);
    root.dataset.phase = String(phase);
    root.classList.toggle('is-locked', phase === 3 && t > 0.85);
    root.classList.toggle('is-exploded', phase === 2 || (phase === 3 && t < 0.4));
    if (phaseLabel) phaseLabel.textContent = PHASE_COPY[phase - 1];

    const frameFade = phase === 3 ? Math.max(0, 1 - t * 1.35) : 1;
    if (stage) stage.style.setProperty('--frame-fade', String(frameFade));

    pieces.forEach((piece) => {
      const key = piece.getAttribute('data-x');
      const states = map[key];
      if (!states) return;
      const pose = lerpState(states[a], states[b], t);
      piece.style.transform =
        `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.r}deg) scale(${pose.s})`;
      if (key === 'frame') {
        piece.style.opacity = String(frameFade);
        piece.setAttribute('aria-hidden', frameFade < 0.2 ? 'true' : 'false');
      }
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (reduced.matches) return;
      applyMotion(progress());
    });
  }

  function syncMode() {
    if (reduced.matches) {
      applyReduced();
      return;
    }
    root.classList.remove('is-reduced');
    applyMotion(progress());
  }

  syncMode();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncMode, { passive: true });
  if (typeof reduced.addEventListener === 'function') {
    reduced.addEventListener('change', syncMode);
  } else if (typeof reduced.addListener === 'function') {
    reduced.addListener(syncMode);
  }
})();
