// reveal.js
(() => {
  // Add a "js" class to <html> once
  document.documentElement.classList.add('js');

  /* ========= tiny utils ========= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const px = (n) => (Number.isFinite(n) ? `${n}px` : String(n));

  // Header offset helper (sticky header height + a small buffer)
  const getHeaderH = () => ($('header')?.offsetHeight || 0) + 8;

  // Motion preference
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ========= configurable defaults ========= */
  const state = {
    threshold: 0.12,
    enterThreshold: 0.20, // show when ≥ 20%
    exitThreshold: 0.06,
    // top is negative to avoid revealing under sticky header
    rootMarginTop: () => -getHeaderH() - 8,     // a little extra
    rootMarginBottom: -0.2 * (window.innerHeight || 1), // more negative
    observeOnceDefault: true,
    selectors: [
      'section p',
      'section h1, section h2, section h3, section h4',
      'section ul, section ol',
      'section figure, section img, section picture, section video',
      '.tableContainer, table',
      '.russelsModelContainer',
      '.doubleSpread, .doubleSpread > *',
      '.threeColumnContainer, .threeColumnContainer .column',
      '.accordionContainer, .accordionPanel',
      '.personaContainer, .persona'
    ],
    staggerParagraphs: true,
    staggerLists: true
  };

  /* ========= core: IntersectionObserver with dynamic rootMargin ========= */
  let io = null;

  const buildObserver = () => {
    if (io) io.disconnect();

    // If reduced motion, skip observing; everything is visible immediately.
    if (REDUCED) {
      $$('.reveal').forEach(instantReveal);
      io = null;
      return;
    }

    io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
        if (target.dataset.reveal === 'off') return;

        // ENTER when we pass the higher threshold
        if (intersectionRatio >= state.enterThreshold) {
          reveal(target);
          return;
        }

        // EXIT only if we drop below the lower threshold and it's not "once"
        if (!shouldRevealOnce(target) && intersectionRatio <= state.exitThreshold) {
          target.classList.remove('is-visible');
        }
      });
    }, {
      // Use a thresholds array to get callbacks across a range
      threshold: Array.from({ length: 21 }, (_, i) => i / 100), // 0.00, 0.01, ... 0.20
      root: null,
      rootMargin: `${px(state.rootMarginTop())} 0px ${px(state.rootMarginBottom)} 0px`,
    });
  };

  const shouldRevealOnce = (el) => {
    if (el.hasAttribute('data-reveal-once')) {
      const v = (el.getAttribute('data-reveal-once') || '').toLowerCase();
      return v === '' || v === 'true' || v === '1';
    }
    return state.observeOnceDefault;
  };

  const instantReveal = (el) => {
    el.classList.add('reveal');
    el.classList.add('is-visible');
    el.classList.add('is-revealed'); // sticky flag (even for reduced motion)
  };

  const reveal = (el) => {
    // Optional per-element delay via CSS var
    if (el.hasAttribute('data-reveal-delay')) {
      el.style.setProperty('--reveal-delay', `${parseInt(el.getAttribute('data-reveal-delay'), 10) || 0}ms`);
    }
    el.classList.add('is-visible');

    if (shouldRevealOnce(el)) {
      el.classList.add('is-revealed');
      io && io.unobserve(el);
    }
  };

  /* ========= tagging ========= */
  const tag = (el, idx = 0) => {
    if (!el || el.dataset.reveal === 'off' || el.classList.contains('reveal')) return;
    el.classList.add('reveal');
    if (idx) el.style.setProperty('--reveal-index', idx);

    if (REDUCED) {
      instantReveal(el);
      return;
    }

    // If already in view at load, reveal immediately; IO will keep it toggled
    const r = el.getBoundingClientRect();
    const topGate = (window.innerHeight - getHeaderH());
    const inView = r.top < topGate && r.bottom > 0;
    if (inView) el.classList.add('is-visible');

    io && io.observe(el);
  };

  /* ========= apply to a container ========= */
  const applyReveals = (container = document, opts = {}) => {
    const {
      selectors = state.selectors,
      staggerParagraphs = state.staggerParagraphs,
      staggerLists = state.staggerLists
    } = opts;

    selectors.forEach(sel => $$(sel, container).forEach((el) => tag(el)));

    if (staggerParagraphs) {
      $$('section', container).forEach(sec => {
        Array.from(sec.children)
          .filter(c => c.tagName === 'P')
          .forEach((p, i) => tag(p, i));
      });
    }

    if (staggerLists) {
      $$('ul, ol', container).forEach(list => {
        [...list.children].forEach((li, i) => tag(li, i));
      });
    }
  };

  /* ========= API: refresh / setOptions ========= */
  const refresh = () => {
    buildObserver();
    // Re-observe any reveal elements we may have
    if (!REDUCED && io) {
      $$('.reveal').forEach(el => {
        if (!el.classList.contains('is-revealed')) {
          io.observe(el);
        }
      });
    }
  };

  const setOptions = (overrides = {}) => {
    Object.assign(state, overrides || {});
    refresh();
  };

  /* ========= boot ========= */
  const boot = () => {
    buildObserver();
    applyReveals(document);

    // Rebuild observer when header height likely changes:
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 120);
    });

    // In case fonts load and shift header height, run a late refresh
    window.addEventListener('load', () => {
      setTimeout(refresh, 150);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // Expose a small API for dynamic content
  window.RevealOnScroll = {
    applyReveals, // (container, options?)
    tag,          // (element, optionalIndex)
    refresh,      // rebuild observer & rebind
    setOptions    // (overrides)
  };
})();
