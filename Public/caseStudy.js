// mappaCS.js
document.addEventListener('DOMContentLoaded', () => {
    /* ================================
       UTILS
    ================================== */
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const raf = (fn) => requestAnimationFrame(fn);
    const getHeaderH = () => ($('header')?.offsetHeight || 0) + 8;

    // Mark JS-enabled for reveal CSS gates
    document.documentElement.classList.add('js');

    /* ================================
       THEME TOGGLE (persist + system)
    ================================== */
    (function themeToggleInit() {
        const btn = $('#themeToggle');
        if (!btn) return;

        const root = document.documentElement;
        const STORAGE_KEY = 'theme';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (mode) => {
            // mode: 'dark' | 'light' | null (follow system)
            if (mode === 'light') root.setAttribute('data-theme', 'light');
            else if (mode === 'dark') root.removeAttribute('data-theme'); // dark is default tokens
            else {
                // follow system
                if (prefersDark.matches) root.removeAttribute('data-theme');
                else root.setAttribute('data-theme', 'light');
            }
            btn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'light' ? true : false));
        };

        // Start with saved or system
        const saved = localStorage.getItem(STORAGE_KEY); // 'light' | 'dark' | null
        applyTheme(saved);

        // React to system changes only if user hasn't explicitly chosen
        prefersDark.addEventListener?.('change', () => {
            if (!localStorage.getItem(STORAGE_KEY)) applyTheme(null);
        });

        // Click → toggle between light/dark (explicit choice)
        btn.addEventListener('click', () => {
            const isLight = root.getAttribute('data-theme') === 'light';
            const next = isLight ? 'dark' : 'light';
            localStorage.setItem(STORAGE_KEY, next);
            applyTheme(next);
        });
    })();

    /* ================================
       MOBILE MENU
    ================================== */
    (function mobileMenu() {
        const menuBtn = $('.menuBtn');
        const mobileMenu = $('#mobileMenu');
        if (!menuBtn || !mobileMenu) return;

        const open = () => {
            mobileMenu.hidden = false;
            raf(() => mobileMenu.classList.add('is-open'));
            menuBtn.setAttribute('aria-expanded', 'true');
        };
        const close = () => {
            mobileMenu.classList.remove('is-open');
            menuBtn.setAttribute('aria-expanded', 'false');
            setTimeout(() => { if (!mobileMenu.classList.contains('is-open')) mobileMenu.hidden = true; }, 200);
        };
        const toggle = () => (menuBtn.getAttribute('aria-expanded') === 'true' ? close() : open());

        menuBtn.addEventListener('click', toggle);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
        mobileMenu.addEventListener('click', (e) => { if (e.target.tagName === 'A') close(); });
    })();

    /* ================================
       TOC HIGHLIGHT + SMOOTH SCROLL
    ================================== */
    (function tocTracker() {
        const toc = $('.toc');
        if (!toc) return;

        const allSections = $$('section[id]');
        const linkFor = (id) => $(`.toc .contents[data-target="${id}"]`);
        const setCurrent = (id) => {
            $$('.toc .current').forEach((el) => el.classList.remove('current'));
            const l = linkFor(id);
            if (l) l.classList.add('current');
        };

        // Create top sentinels (assist IO)
        const sentinels = [];
        allSections.forEach((sec) => {
            const sent = document.createElement('div');
            sent.style.cssText = 'position:relative;height:1px;margin-top:-1px;';
            sec.prepend(sent);
            sentinels.push(sent);
        });

        let tocObserver;
        const buildObserver = () => {
            const headerH = getHeaderH();
            if (tocObserver) tocObserver.disconnect();
            tocObserver = new IntersectionObserver((entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) setCurrent(e.target.parentElement.id);
                });
            }, { root: null, rootMargin: `${-headerH}px 0px -60% 0px`, threshold: 0 });
            sentinels.forEach((s) => tocObserver.observe(s));
        };
        buildObserver();

        // Rebuild on resize (header height changes)
        let resizeRAF;
        window.addEventListener('resize', () => {
            cancelAnimationFrame(resizeRAF);
            resizeRAF = raf(buildObserver);
        });

        // Smooth scroll + hash update
        $$('.toc .contents').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.getAttribute('data-target');
                const target = document.getElementById(id);
                if (!target) return;
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `#${id}`);
                setCurrent(id);
            });
        });

        // Initial highlight
        const initial = location.hash?.slice(1);
        setCurrent(allSections.some((s) => s.id === initial) ? initial : allSections[0]?.id);

        // If user scrolls to absolute bottom, ensure last section is highlighted
        window.addEventListener('scroll', () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
                const last = allSections[allSections.length - 1];
                if (last) setCurrent(last.id);
            }
        }, { passive: true });

        // Respond to manual hash changes (e.g., back/forward)
        window.addEventListener('hashchange', () => {
            const id = location.hash.slice(1);
            if (document.getElementById(id)) setCurrent(id);
        });
    })();

    /* ================================
       REVEAL ON SCROLL (matches CSS)
    ================================== */
    (function reveal() {
        const headerOffset = () => `-${getHeaderH()}px 0px -12% 0px`;
        const inView = (el) => {
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            return r.top < (vh - getHeaderH()) && r.bottom > 0;
        };

        const tag = (el, idx = 0) => {
            if (!el || el.matches('[data-reveal="off"]') || el.classList.contains('reveal')) return;
            el.classList.add('reveal');
            if (idx) el.style.setProperty('--reveal-index', idx);
            if (inView(el)) el.classList.add('is-visible');
            io.observe(el);
        };

        let io = new IntersectionObserver((entries) => {
            entries.forEach(({ target, isIntersecting }) => {
                target.classList.toggle('is-visible', isIntersecting);
            });
        }, { threshold: 0.1, rootMargin: headerOffset() });

        // Recreate observer on resize (header height)
        let rebuildRAF;
        window.addEventListener('resize', () => {
            cancelAnimationFrame(rebuildRAF);
            rebuildRAF = raf(() => {
                const old = io;
                io = new IntersectionObserver((entries) => {
                    entries.forEach(({ target, isIntersecting }) => {
                        target.classList.toggle('is-visible', isIntersecting);
                    });
                }, { threshold: 0.1, rootMargin: headerOffset() });
                // Re-observe existing reveal nodes
                $$('.reveal').forEach((n) => { old.unobserve(n); io.observe(n); });
            });
        });

        // Scope and elements to reveal (stagger some)
        const scope = $('main') || document.body;

        // TOC reveal
        const toc = $('.toc');
        if (toc) {
            tag(toc);
            const tocHeader = $('.tocHeader', toc);
            if (tocHeader) tag(tocHeader, 0);
            $$('.toc .contents').forEach((item, i) => tag(item, i));
        }

        // Content
        scope.querySelectorAll(`
      section p,
      section h2, section h3, section h4,
      section ul, section ol,
      section figure, section img, section picture, section video,
      .tableContainer, table,
      .russelsModelContainer,
      .doubleSpread, .doubleSpread > *,
      .threeColumnContainer, .threeColumnContainer .column,
      .accordionContainer, .accordionPanel,
      .personaContainer, .persona
    `).forEach((el) => tag(el));

        $$('.rightContainer section').forEach((sec) => {
            Array.from(sec.children)
                .filter((c) => c.tagName === 'P')
                .forEach((p, i) => tag(p, i));
        });
        $$('ul, ol', scope).forEach((list) => { [...list.children].forEach((li, i) => tag(li, i)); });
        $$('.heroCS-head, .heroMediaBox, .finalHero-head, .finalMediaBox').forEach((el) => tag(el));
        $$('[data-reveal]:not([data-reveal="off"])').forEach((el) => tag(el));
    })();

    /* ================================
       ACCORDION (single-open, ARIA)
    ================================== */
    (function accordionInit() {
        document.querySelectorAll('.accordionContainer').forEach((root) => {
            root.addEventListener('click', (e) => {
                const btn = e.target.closest('.accordionButton');
                if (!btn || !root.contains(btn)) return;

                const panel = btn.closest('.accordionPanel');
                const content = panel.querySelector('.accordionContent');
                const isOpen = btn.getAttribute('aria-expanded') === 'true';

                // Close all
                root.querySelectorAll('.accordionPanel').forEach((p) => {
                    const b = p.querySelector('.accordionButton');
                    const c = p.querySelector('.accordionContent');
                    b.setAttribute('aria-expanded', 'false');
                    c.setAttribute('aria-hidden', 'true');
                });

                // Open target
                if (!isOpen) {
                    btn.setAttribute('aria-expanded', 'true');
                    content.setAttribute('aria-hidden', 'false');

                    // After expand transition, keep panel in view
                    const onEnd = (ev) => {
                        if (ev.propertyName !== 'grid-template-rows') return;
                        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        content.removeEventListener('transitionend', onEnd);
                    };
                    content.addEventListener('transitionend', onEnd);
                }
            });

            // Keyboard support (Enter/Space)
            root.querySelectorAll('.accordionButton').forEach((b) => {
                b.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        b.click();
                    }
                });
            });
        });
    })();

    /* ================================
       SMART VIDEO (autoplay in view)
    ================================== */
    (function smartVideo() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const videos = $$('video.smartVideo');
        if (!videos.length) return;

        const vIO = new IntersectionObserver((entries) => {
            entries.forEach(({ target: v, isIntersecting }) => {
                if (prefersReducedMotion.matches) return;
                if (isIntersecting) v.play?.().catch(() => v.setAttribute('controls', ''));
                else v.pause?.();
            });
        }, { threshold: 0.5, rootMargin: '0px 0px -20% 0px' });

        videos.forEach((v) => {
            v.setAttribute('playsinline', '');
            v.muted = true;
            v.setAttribute('preload', v.getAttribute('preload') || 'metadata');

            if (prefersReducedMotion.matches) {
                v.removeAttribute('autoplay');
                v.pause?.();
                v.setAttribute('controls', '');
                return;
            }

            v.play?.().catch(() => v.setAttribute('controls', ''));
            vIO.observe(v);
        });

        prefersReducedMotion.addEventListener?.('change', (e) => {
            videos.forEach((v) => {
                if (e.matches) {
                    v.removeAttribute('autoplay'); v.pause?.(); v.setAttribute('controls', ''); vIO.unobserve(v);
                } else {
                    v.removeAttribute('controls'); vIO.observe(v); v.play?.().catch(() => v.setAttribute('controls', ''));
                }
            });
        });
    })();

    /* ================================
       LAZY TWEAKS
    ================================== */
    // Add lazy loading to rail images if not already present
    $$('.railImg').forEach((img) => img.loading = img.loading || 'lazy');
});

