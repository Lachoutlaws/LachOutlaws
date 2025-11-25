document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     00) THEME (dark default)
     ========================= */
  (() => {
    const root = document.documentElement;
    const btn = document.getElementById('themeToggle');

    const isMobile = () =>
      window.matchMedia('(max-width: 720px)').matches ||
      window.matchMedia('(pointer: coarse)').matches;

    const sysPrefersDark = () =>
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const apply = (mode) => {
      if (mode === 'light') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
      if (btn) {
        const isLight = mode === 'light';
        btn.setAttribute('aria-pressed', String(isLight));
        btn.classList.toggle('is-light', isLight);
        btn.classList.toggle('is-dark', !isLight);
      }
      if (!isMobile()) localStorage.setItem('theme', mode);

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        const bg = getComputedStyle(root).getPropertyValue('--bg').trim() || '#0e0e11';
        meta.setAttribute('content', bg);
      }
    };

    const chooseInitial = () => {
      if (isMobile()) {
        apply('dark');
        if (btn) { btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }
        return;
      }
      const saved = localStorage.getItem('theme');
      const initial = saved || (sysPrefersDark() ? 'dark' : 'light');
      apply(initial);
      if (btn) { btn.disabled = false; btn.removeAttribute('aria-disabled'); }
    };

    chooseInitial();

    const mqDark = window.matchMedia?.('(prefers-color-scheme: dark)');
    mqDark?.addEventListener?.('change', (e) => {
      if (isMobile()) return;
      if (!localStorage.getItem('theme')) apply(e.matches ? 'dark' : 'light');
    });

    btn?.addEventListener('click', () => {
      if (btn.disabled) return;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      apply(isLight ? 'dark' : 'light');
    });

    let timer;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(chooseInitial, 120); });
  })();

  /* ============== HELPERS ============== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const hdr = $('header');

  const getHeaderH = () => (hdr?.offsetHeight || 0);
  const setVH = () =>
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

  const extractUrl = (raw) => {
    if (!raw) return '';
    const m = String(raw).match(/url\((['"]?)(.*?)\1\)/i);
    return m && m[2] ? m[2].trim() : String(raw).trim();
  };

  const normUrl = (u) => {
    if (!u || u === 'none') return '';
    try { return new URL(u, location.href).href; } catch { return String(u); }
  };

  const getVisualFromThumb = (thumbEl) => {
    if (!thumbEl) return '';
    const inline = thumbEl.getAttribute('style') || '';
    const mm = inline.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i);
    if (mm && mm[2]) return mm[2].trim();

    const cs = getComputedStyle(thumbEl).backgroundImage;
    const url = extractUrl(cs);
    if (url && url !== 'none') return url;

    const img = thumbEl.querySelector('img');
    return img?.src || '';
  };

  const getVisualFromAnchor = (a) => {
    if (!a) return '';
    const dv = a.getAttribute('data-visual');
    if (dv) {
      const parsed = extractUrl(dv);
      if (parsed && parsed !== 'none') return parsed;
    }
    const thumb = a.querySelector('.projectRowWorksThumbnail, .yWorksLists__thumb')
      || a.closest('li')?.querySelector('.projectRowWorksThumbnail, .yWorksLists__thumb');
    const thumbUrl = getVisualFromThumb(thumb);
    if (thumbUrl) return thumbUrl;

    const img = a.querySelector('img') || a.closest('li')?.querySelector('img');
    return img?.src || '';
  };

  const isExternal = (url) => {
    if (!url) return false;
    try {
      const u = new URL(url, location.href);
      return /^https?:/i.test(u.protocol) && u.origin !== location.origin;
    } catch { return false; }
  };

  /* ==============================
     01) NUMBER LEFT TOC LISTS
     ============================== */
  $$('.yWorks__titleLists').forEach(ul => {
    [...ul.children].forEach((li, i) => {
      const num = li.querySelector('.yWorks__titleLists--num span');
      if (num) num.textContent = String(i + 1).padStart(2, '0');
    });
  });
  $$('.projectsTOCLists').forEach(ul => {
    [...ul.children].forEach((li, i) => {
      const num = li.querySelector('.projectsTOCLists--number span');
      if (num) num.textContent = String(i + 1).padStart(2, '0');
    });
  });

  /* ==================================
     02) SMOOTH ANCHOR SCROLL
     ================================== */
  $$('a.wanchor[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - (getHeaderH() + 12);
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - (getHeaderH() + 12);
      window.scrollTo({ top, behavior: 'instant' });
    }
  }

  /* ==========================
     03) MOBILE MENU + 100vh
     ========================== */
  setVH();
  window.addEventListener('resize', setVH);

  const menuBtn = $('.menuBtn');
  const mobileMenu = $('#mobileMenu');

  const openMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.hidden = false;
    requestAnimationFrame(() => mobileMenu.classList.add('is-open'));
    menuBtn?.setAttribute('aria-expanded', 'true');
    hdr?.classList.remove('header--hidden');
  };
  const closeMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!mobileMenu.classList.contains('is-open')) mobileMenu.hidden = true; }, 200);
  };
  const toggleMenu = () =>
    (menuBtn?.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu());

  menuBtn?.addEventListener('click', toggleMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  mobileMenu?.addEventListener('click', (e) => { if (e.target.tagName === 'A') closeMenu(); });

  /* ===============================================
     05) THEME-COLOR META TAG SYNC
     =============================================== */
  (function syncThemeColor() {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    const apply = () => {
      const bg = getComputedStyle(root).getPropertyValue('--bg').trim() || '#0e0e11';
      meta?.setAttribute('content', bg);
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('resize', apply);
  })();

  /* ===================================================
     06) BUILD SLIDES FROM DOCUMENT
     =================================================== */
  // NEW structure helpers
  const getNewRows = () => $$('.projectsRow');
  const getNewTOCList = (row) => row?.querySelector('.projectsTOCLists');
  const getNewTilesList = (row) => row?.querySelector('.projectRowWorks');
  const getNewAnchors = () => $$('.projectsRow .projectRowWorks li .projectGalleryOpen');

  // LEGACY structure helpers
  const getOldRows = () => $$('.yRow[id^="w-"]');
  const getOldTOCList = (row) => row?.querySelector('.yWorks__titleLists');
  const getOldTilesList = (row) => row?.querySelector('.yWorksLists');
  const getOldAnchors = () => $$('.yCol-right .yWorksLists li[id^="w"] a.js-worksDetailOpen');

  const slides = [];

  const slideFromAnchor = (a, inferMetaFn) => {
    const li = a.closest('li');
    const meta = inferMetaFn?.(li) || {};
    const src = getVisualFromAnchor(a);
    const caseUrl = a.dataset.case || '';
    const openMode = (a.dataset.open || '').toLowerCase();  // 'blank' | 'self' | ''
    const label = a.dataset.label || '';
    const overview = a.dataset.overview || '';              // expects data-overview on the anchor

    return {
      id: meta.id || li?.id || '',
      section: meta.section || '',
      sectionLabel: meta.sectionLabel || '',
      title: meta.title || 'Untitled',
      subtitle: meta.subtitle || '',
      poster: src,
      hero: src,
      caseUrl,
      openMode,
      linkLabel: label,
      overview
    };
  };

  const inferNewMeta = (li) => {
    if (!li) return {};
    const row = li.closest('.projectsRow');
    const toc = getNewTOCList(row);
    const tiles = getNewTilesList(row);
    const index = [...(tiles?.children || [])].indexOf(li);
    const tocItem = toc?.children?.[index];

    const sectionLabel =
      row?.getAttribute('data-section-label')?.trim() ||
      row?.querySelector('.projectsTOCTitle')?.textContent?.trim() ||
      row?.id?.replace(/^projects?-/, '')?.replace(/[-_]+/g, ' ') || '';

    return {
      id: li.id || '',
      section: row?.id || '',
      sectionLabel,
      title: tocItem?.querySelector('.projectsTOCLists--title')?.textContent?.trim() || '',
      subtitle: tocItem?.querySelector('.projectsTOCLists--subtitle')?.textContent?.trim() || ''
    };
  };

  const inferOldMeta = (li) => {
    if (!li) return {};
    const workId = li?.id?.replace(/^w/, '');
    const row = li.closest('.yRow[id^="w-"]');
    const headerItem = row?.querySelector(`.yWorks__titleLists .l-works-${workId}`);
    const year = row?.id?.replace('w-', '');

    const sectionLabel =
      row?.getAttribute('data-section-label')?.trim() ||
      row?.querySelector('.yWorks__title')?.textContent?.trim() ||
      year || '';

    return {
      id: workId || li?.id || '',
      section: year || '',
      sectionLabel,
      title: headerItem?.querySelector('.yWorks__titleLists--title')?.textContent?.trim() || '',
      subtitle: headerItem?.querySelector('.yWorks__titleLists--date')?.textContent?.trim() || ''
    };
  };

  function slidesFromDocument() {
    slides.length = 0;
    const anchorsNew = getNewAnchors();
    const anchorsOld = getOldAnchors();
    const allAnchors = [...anchorsNew, ...anchorsOld];

    allAnchors.forEach((a, i) => {
      const metaFn = anchorsNew.includes(a) ? inferNewMeta : inferOldMeta;
      const s = slideFromAnchor(a, metaFn);
      slides.push(s);
      try { a.dataset.slideIndex = String(i); } catch { /* noop */ }
    });
  }

  slidesFromDocument();

  // exposed hooks so appContent.js can trigger a rebuild after JSON injection
  window.rebuildSlides = function rebuildSlides() { slidesFromDocument(); };

  /* ======================================
     07) OVERLAY GALLERY ELEMENTS
     ====================================== */
  const gal = $('#gallery');

  const leftImg = gal?.querySelector('.left-img, .gallerySectionPreview.is-prev');
  const rightImg = gal?.querySelector('.right-img, .gallerySectionPreview.is-next');

  const btnPrev = gal ? gal.querySelectorAll('.arrow-left, .gallerySectionArrow.is-prev') : [];
  const btnNext = gal ? gal.querySelectorAll('.arrow-right, .gallerySectionArrow.is-next') : [];

  const posterEl = gal?.querySelector('#casePoster');
  const titleEl = gal?.querySelector('.caseTitle, .projectCardTitle');
  const kickerEl = gal?.querySelector('.kicker, .projectCardSubtitle');
  const cta = gal?.querySelector('.actions .btn, .projectCardButtonsContainer .projectCardButton');

  // Overview node in your markup
  const overviewEl = gal?.querySelector('.overview, .projectCardOverview, .projectCardInfo');

  const wrap = (n, m) => ((n % m) + m) % m;
  let index = 0;

  /* ======= STABLE, PINNED SECTION LABEL ======= */
  // Create it on the overlay (not on a scaled card), give it fixed sizing inline
  function ensureGalleryTopLabel() {
    const overlay = gal?.querySelector('.galleryOverlay') || gal;
    if (!overlay) return null;

    let label = overlay.querySelector(':scope > .galleryTopLabel');
    if (!label) {
      label = document.createElement('div');
      label.className = 'galleryTopLabel';
      // minimal fixed styling in case CSS isn’t updated yet
      label.style.cssText = [
        'position:absolute', 'z-index:50', 'pointer-events:none', 'white-space:nowrap',
        'font-weight:700', 'font-size:12px', 'line-height:1.1', 'letter-spacing:.02em',
        'padding:6px 10px', 'border-radius:999px',
        'background:rgba(120,160,180,.15)', 'border:1px solid rgba(120,160,180,.35)',
        'backdrop-filter:blur(6px)'
      ].join(';');
      overlay.prepend(label);
    }
    return label;
  }

  // Place it relative to the center card’s top-left corner
  function positionGalleryTopLabel() {
    if (!gal) return;
    const overlay = gal.querySelector('.galleryOverlay');
    const centerCard = gal.querySelector('.gallerySection.is-center .projectCard');
    const label = overlay?.querySelector('.galleryTopLabel');
    if (!overlay || !centerCard || !label) return;

    const overlayRect = overlay.getBoundingClientRect();
    const cardRect = centerCard.getBoundingClientRect();

    const left = Math.max(12, cardRect.left - overlayRect.left + 12); // inset from card edge
    const top = Math.max(12, cardRect.top - overlayRect.top - 10); // slightly above corner

    label.style.left = `${left}px`;
    label.style.top = `${top}px`;
  }
  /* =========================================== */

  // CTA click: open external links in new tab unless forced self
  cta?.addEventListener('click', (e) => {
    const url = cta.getAttribute('data-href') || cta.getAttribute('href');
    const mode = (cta.dataset.open || '').toLowerCase();
    if (!url) { e.preventDefault(); return; }
    const external = isExternal(url);
    const openBlank = mode === 'blank' || (mode !== 'self' && external);
    if (openBlank) { e.preventDefault(); window.open(url, '_blank', 'noopener'); }
  });

  const setCTAFromSlide = (s) => {
    if (!cta) return;
    const actionsWrap = cta.closest('.actions') || cta.parentElement || null;

    const isIllustration = (() => {
      const tag = (s.sectionLabel || s.section || '').toLowerCase();
      return tag.includes('illustration');
    })();

    const hasHref = !!s.caseUrl;

    if (isIllustration || !hasHref) {
      if (actionsWrap) actionsWrap.hidden = true;
      cta.hidden = true;
      cta.setAttribute('aria-disabled', 'true');
      cta.classList.add('is-disabled');
      cta.removeAttribute('href');
      cta.removeAttribute('target');
      cta.removeAttribute('rel');
      return;
    }

    if (actionsWrap) actionsWrap.hidden = false;
    cta.hidden = false;

    const href = s.caseUrl;
    cta.setAttribute('data-href', href);
    cta.href = href;

    const openMode = (s.openMode || '').toLowerCase();
    if (openMode) cta.dataset.open = openMode; else cta.removeAttribute('data-open');

    const external = (() => {
      try { const u = new URL(href, location.href); return /^https?:/i.test(u.protocol) && u.origin !== location.origin; }
      catch { return false; }
    })();
    const label = (s.linkLabel && s.linkLabel.trim())
      ? s.linkLabel.trim()
      : (external ? 'View Website' : 'View Case Study');
    cta.textContent = label;

    const forceBlank = openMode === 'blank' || (openMode !== 'self' && external);
    if (forceBlank) { cta.target = '_blank'; cta.rel = 'noopener'; }
    else { cta.removeAttribute('target'); cta.removeAttribute('rel'); }

    cta.removeAttribute('aria-disabled');
    cta.classList.remove('is-disabled');
    cta.tabIndex = 0;
  };

  const setCaseContent = (s) => {
    if (!posterEl || !titleEl || !kickerEl) return;

    const labelEl = ensureGalleryTopLabel();
    if (labelEl) {
      const nice = (s.sectionLabel || s.section || '').trim();
      labelEl.textContent = nice || '';
      labelEl.hidden = !nice;
    }

    titleEl.textContent = s.title || 'Untitled';
    kickerEl.textContent = s.subtitle || '';
    posterEl.src = s.poster || '';
    posterEl.alt = `Poster image for ${s.title || 'work'}`;

    // Overview text (show/hide if empty)
    if (overviewEl) {
      const txt = (s.overview || '').trim();
      overviewEl.textContent = txt;
      overviewEl.hidden = !txt;
    }

    const isIllustration = /illustration/i.test((s.sectionLabel || s.section || ''));
    const hasLink = !!s.caseUrl && !isIllustration;
    gal?.classList.toggle('has-cta', hasLink);

    setCTAFromSlide(s);
    // place the label after measurements are known
    positionGalleryTopLabel();
  };

  const preloadAround = (i) => {
    if (!slides.length) return;
    const n = slides[wrap(i + 1, slides.length)];
    const p = slides[wrap(i - 1, slides.length)];
    if (n?.hero) { const im = new Image(); im.src = n.hero; }
    if (p?.hero) { const im = new Image(); im.src = p.hero; }
  };

  const render = () => {
    const s = slides[index]; if (!s) return;
    setCaseContent(s);
    const prev = slides[wrap(index - 1, slides.length)];
    const next = slides[wrap(index + 1, slides.length)];
    if (leftImg) leftImg.src = prev?.hero || prev?.poster || '';
    if (rightImg) rightImg.src = next?.hero || next?.poster || '';
    preloadAround(index);
    positionGalleryTopLabel();
  };

  const wrapIndex = (n) => ((n % slides.length) + slides.length) % slides.length;
  const goPrev = () => { if (!slides.length) return; index = wrapIndex(index - 1); render(); };
  const goNext = () => { if (!slides.length) return; index = wrapIndex(index + 1); render(); };

  btnPrev.forEach(b => b.addEventListener('click', goPrev));
  btnNext.forEach(b => b.addEventListener('click', goNext));

  gal?.querySelector('.edge-left, .gallerySectionGlow.is-left')?.addEventListener('click', goPrev);
  gal?.querySelector('.edge-right, .gallerySectionGlow.is-right')?.addEventListener('click', goNext);

  posterEl?.addEventListener('error', () => { posterEl.style.opacity = .6; });

  const openGallery = () => {
    if (!gal) return;
    gal.classList.add('is-open');
    gal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    hdr?.classList.remove('header--hidden');
    positionGalleryTopLabel();
  };

  const openGalleryFromAnchor = (a) => {
    if (!gal) return;

    const caseUrl = a.dataset.case || '';
    const mode = (a.dataset.open || '').toLowerCase();
    const external = isExternal(caseUrl);
    const wantsBlank = mode === 'blank' || (mode !== 'self' && external);
    if (wantsBlank && caseUrl) { window.open(caseUrl, '_blank', 'noopener'); return; }

    // Prefer data-slide-index
    const ds = a?.dataset?.slideIndex;
    if (ds !== undefined) {
      const i = Number(ds);
      if (!Number.isNaN(i) && slides[i]) { index = i; render(); openGallery(); return; }
    }

    // Fallback: LI id
    const li = a.closest('li');
    const liId = li?.id || '';
    let by = slides.findIndex(s => s.id === liId || s.id === liId.replace(/^w/, ''));
    if (by >= 0) { index = by; render(); openGallery(); return; }

    // Fallback: normalized image URL match
    const clickedSrc = normUrl(getVisualFromAnchor(a));
    by = slides.findIndex(s => normUrl(s.poster) === clickedSrc || normUrl(s.hero) === clickedSrc);
    index = by >= 0 ? by : 0;
    render(); openGallery();
  };

  const openGalleryById = (idOrWorkId) => {
    if (!gal) return;
    const i = slides.findIndex(s => s.id === String(idOrWorkId) || s.id === String(idOrWorkId).replace(/^w/, ''));
    if (i < 0) return;
    index = i; render(); openGallery();
  };
  window.openGalleryById = openGalleryById;

  const closeGallery = () => {
    if (!gal) return;
    gal.classList.remove('is-open');
    gal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  gal?.querySelector('.gClose, .galleryClose')?.addEventListener('click', closeGallery);
  gal?.addEventListener('click', (e) => {
    const inside = e.target.closest('.gallerySection, .gallerySectionBottomBar, .gClose, .galleryClose');
    if (!inside) closeGallery();
  });

  document.addEventListener('keydown', (e) => {
    if (!gal?.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // Swipe on mobile for center pane
  (function attachSwipe() {
    if (!gal) return;
    const isMob = () => matchMedia('(pointer: coarse)').matches || window.innerWidth <= 720;
    if (!isMob()) return;

    const el = gal.querySelector('.gallerySection.is-center');
    if (!el) return;

    let startX = 0, startY = 0, dx = 0, dy = 0, touching = false;
    const THRESH_X = 40, THRESH_Y = 60;

    el.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY; dx = dy = 0; touching = true;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!touching) return;
      const t = e.changedTouches[0];
      dx = t.clientX - startX; dy = t.clientY - startY;
    }, { passive: true });

    el.addEventListener('touchend', () => {
      if (!touching) return; touching = false;
      if (Math.abs(dy) > THRESH_Y) return;
      if (dx <= -THRESH_X) { goNext(); return; }
      if (dx >= THRESH_X) { goPrev(); return; }
    }, { passive: true });
  })();

  /* ============================================
     08) MOBILE RAIL LABELS
     ============================================ */
  (function buildMobileRail() {
    const isMobile = () => window.matchMedia('(max-width: 720px)').matches;
    if (!isMobile()) return;

    const rows = getNewRows().length ? getNewRows() : getOldRows();

    rows.forEach((row, idx) => {
      const fallback = row.id?.replace(/^w-/, '') || row.id || `section-${idx + 1}`;
      const titleEl =
        row.querySelector('.projectsTOCTitle') ||
        row.querySelector('.yWorks__title');
      const label = (titleEl?.textContent || fallback).trim().replace(/\s+/g, ' ');

      if (row.querySelector('.mobileYear')) return;

      const rail = document.createElement('div');
      rail.className = 'mobileYear';
      rail.innerHTML = `
        <button class="chev chev-up" aria-label="Previous section" title="Previous">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7l-6 6h12z" fill="currentColor"/></svg>
        </button>
        <div class="yearText" aria-hidden="true">${label}</div>
        <button class="chev chev-down" aria-label="Next section" title="Next">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(180deg)"><path d="M12 7l-6 6h12z" fill="currentColor"/></svg>
        </button>
      `;
      row.prepend(rail);

      rail.querySelector('.chev-up')?.addEventListener('click', (e) => {
        e.preventDefault();
        const prev = rows[idx - 1];
        if (prev) prev.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      rail.querySelector('.chev-down')?.addEventListener('click', (e) => {
        e.preventDefault();
        const next = rows[idx + 1];
        if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    const headerH = getHeaderH();
    const rowObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const label = en.target.querySelector('.mobileYear .yearText');
        if (!label) return;
        label.style.opacity = en.isIntersecting ? '1' : '.35';
        label.style.filter = en.isIntersecting ? 'none' : 'grayscale(20%)';
      });
    }, {
      root: null,
      rootMargin: `${-(headerH + 8)}px 0px -60% 0px`,
      threshold: 0
    });

    rows.forEach(r => rowObserver.observe(r));
  })();

  /* ==========================================
     09) LINK LEFT LIST ITEMS TO RIGHT TILES
     ========================================== */
  function bindRowLinking() {
    const rows = getNewRows().length ? getNewRows() : getOldRows();
    rows.forEach((row) => {
      if (row.dataset.bound === '1') return;
      row.dataset.bound = '1';

      const toc = getNewTOCList(row) || getOldTOCList(row);
      const tiles = getNewTilesList(row) || getOldTilesList(row);
      if (!toc || !tiles) return;

      const textItems = Array.from(toc.children);
      const posterItems = Array.from(tiles.children);

      const link = (i, on) => {
        textItems[i]?.classList.toggle('is-linked', on);
        posterItems[i]?.classList.toggle('is-linked', on);
      };

      // TOC → Tiles
      textItems.forEach((li, i) => {
        li.addEventListener('mouseenter', () => link(i, true));
        li.addEventListener('mouseleave', () => link(i, false));
        li.addEventListener('focusin', () => link(i, true));
        li.addEventListener('focusout', () => link(i, false));
        li.style.cursor = 'pointer';
        li.tabIndex = 0;
        li.addEventListener('click', (e) => {
          e.preventDefault();
          const opener = posterItems[i]?.querySelector('a.projectGalleryOpen, .projectGalleryOpen');
          if (opener) openGalleryFromAnchor(opener);
        });
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const opener = posterItems[i]?.querySelector('a.projectGalleryOpen, .projectGalleryOpen');
            if (opener) openGalleryFromAnchor(opener);
          }
        });
      });

      // Tiles → TOC hover states
      posterItems.forEach((li, i) => {
        li.addEventListener('mouseenter', () => link(i, true));
        li.addEventListener('mouseleave', () => link(i, false));
        li.addEventListener('focusin', () => link(i, true));
        li.addEventListener('focusout', () => link(i, false));
      });
    });
  }
  window.rebindRowLinking = function rebindRowLinking() {
    document.querySelectorAll('.projectsRow[data-bound="1"], .yRow[data-bound="1"]')
      .forEach(r => r.removeAttribute('data-bound'));
    bindRowLinking();
  };
  bindRowLinking();

  /* ======================================================
     10) DELEGATED CLICK: OPEN OVERLAY
     ====================================================== */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.projectGalleryOpen, .projectGalleryOpen, .js-worksDetailOpen');
    if (!a) return;
    e.preventDefault();
    openGalleryFromAnchor(a);
  });

  /* ===========================================================
     11) DOM CHANGES → REBUILD & REBIND (DEBOUNCED)
     =========================================================== */
  const moRoot = document.body;
  let moTimer = null;
  const onDomChanged = () => {
    window.rebuildSlides?.();
    window.rebindRowLinking?.();
    positionGalleryTopLabel();
  };
  const observer = new MutationObserver(() => {
    clearTimeout(moTimer);
    moTimer = setTimeout(onDomChanged, 60);
  });
  observer.observe(moRoot, { subtree: true, childList: true });

  /* ================================
     12) OPTIONAL: CASE LINK HELPERS
     ================================ */
  window.syncCaseLink = function syncCaseLink(cardEl) {
    if (!cardEl) return;
    const btn = cardEl.querySelector('.caseLink');
    if (!btn) return;
    const v = (cardEl.dataset.case || '').trim();
    const label = (cardEl.dataset.label || '').trim();

    if (v) {
      btn.hidden = false;
      btn.setAttribute('aria-disabled', 'false');
      if (btn.tagName === 'A') {
        btn.href = v;
        if (/^https?:\/\//i.test(v)) { btn.target = '_blank'; btn.rel = 'noopener'; }
        else { btn.removeAttribute('target'); btn.removeAttribute('rel'); }
      }
      if (label) btn.textContent = label;
    } else {
      btn.hidden = true;
      btn.setAttribute('aria-disabled', 'true');
      if (btn.tagName === 'A') btn.removeAttribute('href');
    }
  };

  window.syncCaseLinkForCenter = function syncCaseLinkForCenter() {
    const gal = document.getElementById('gallery');
    if (!gal) return;
    const centerCard =
      gal.querySelector('.gallerySection.is-center .projectCard') ||
      gal.querySelector('.projectCard');
    window.syncCaseLink(centerCard);
  };

  // keep label pinned on resize/scroll
  window.addEventListener('resize', positionGalleryTopLabel);
  window.addEventListener('scroll', positionGalleryTopLabel, { passive: true });
});
