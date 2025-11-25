// appContent.js — render Case/Illustrations/Other + hydrate case-study rail from ./Data/content.json
const JSON_PATH = "./Data/content.json";

// Section targets in your HTML
const SECTIONS = [
  { key: "case", toc: '#projects-caseStudies .projectsTOCLists.res-caseStudy', tiles: '#projects-caseStudies .projectRowWorks' },
  { key: "illustration", toc: '#projects-illustrations .projectsTOCLists.res-illustration', tiles: '#projects-illustrations .projectRowWorks' },
  { key: "other", toc: '#projects-other .projectsTOCLists.res-other', tiles: '#projects-other .projectRowWorks' }
];

init();

async function init() {
  // Run if (a) project sections exist OR (b) a case-study rail exists
  const anyTarget = SECTIONS.some(s => document.querySelector(s.toc) || document.querySelector(s.tiles));
  const hasRail = !!document.querySelector('.rail');
  if (!anyTarget && !hasRail) return;

  try {
    // cache-bust to ensure latest JSON
    const res = await fetch(`${JSON_PATH}?cb=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    const all = Array.isArray(data.items) ? data.items : [];

    // (1) Render sections where present
    SECTIONS.forEach(({ key, toc, tiles }) => {
      const tocEl = document.querySelector(toc);
      const tilesEl = document.querySelector(tiles);
      const items = all.filter(it => (it.section || "").toLowerCase() === key);

      if (tocEl) tocEl.innerHTML = items.map((it, i) => tocHTML(it, i + 1)).join("");
      if (tilesEl) tilesEl.innerHTML = items.map(tileHTML).join("");
    });

    // If your home overlay needs to rescan after injection:
    if (typeof window.rebuildSlides === "function") window.rebuildSlides();
    if (typeof window.rebindRowLinking === "function") window.rebindRowLinking();

    // (2) Hydrate PREVIOUS/NEXT rail on case-study pages (if present)
    hydrateCaseStudyRail(all);

  } catch (err) {
    console.error("content.json load failed", err);
    // Light error output to visible sections (if present)
    SECTIONS.forEach(({ tiles }) => {
      const tilesEl = document.querySelector(tiles);
      if (tilesEl) tilesEl.innerHTML = `<li role="alert">Couldn’t load content.</li>`;
    });
  }
}

/* ---------- templating ---------- */
function tocHTML(item, num) {
  const title = esc(item.title || "Untitled");
  const subtitle = esc(item.subtitle || "");
  const n = String(num).padStart(2, "0");
  return `
    <li>
      <p class="projectsTOCLists--number"><span>${n}</span></p>
      <div>
        <p class="projectsTOCLists--title">${title}</p>
        <p class="projectsTOCLists--subtitle">${subtitle}</p>
      </div>
    </li>
  `;
}

function tileHTML(item) {
  const img = attr(item.image || "");
  const title = esc(item.title || "Untitled");
  const visual = attr(item.visual || item.image || "");

  const hasLink = !!item.caseUrl;
  const isExternal = /^https?:\/\//i.test(item.caseUrl || "");
  const label = item.linkLabel || (isExternal ? "View Website" : "View Case Study");
  const openNew = !!item.openNewTab || isExternal;

  const href = hasLink ? attr(item.caseUrl) : "#";
  const target = openNew ? "_blank" : "_self";
  const relAttr = openNew ? ' rel="noopener"' : "";
  const dataOpen = openNew ? ' data-open="blank"' : '';
  const dataLabel = ` data-label="${attr(label)}"`;

  // ✅ carry the overview text so the overlay can read it
  const dataOverview = item.overview ? ` data-overview="${attr(item.overview)}"` : "";

  const start = hasLink
    ? `<a href="${href}" class="projectGalleryOpen" data-visual="${visual}" data-case="${href}"${dataOpen}${dataLabel}${dataOverview} target="${target}"${relAttr}>`
    : `<div class="projectGalleryOpen" data-visual="${visual}"${dataLabel}${dataOverview}>`;
  const end = hasLink ? `</a>` : `</div>`;

  return `
    <li>
      <div class="link-a">
        ${start}
          <div class="projectRowWorksThumbnail" style="background-image:url(${img})">
            <img loading="lazy" alt="${title} thumbnail" src="${img}">
          </div>
        ${end}
      </div>
    </li>
  `;
}

/* ---------- case-study rail hydration ---------- */
function hydrateCaseStudyRail(all) {
  const rail = document.querySelector('.rail');
  if (!rail) return;

  const body = document.body;
  const currentSlug = (body.dataset.currentSlug || "").trim();
  const currentType = (body.dataset.currentType || "").toLowerCase();
  if (!currentSlug || currentType !== 'case-study') return;

  const cases = all
    .filter(it => (it.section || '').toLowerCase() === 'case')
    .map((it, i) => ({
      title: it.title || 'Untitled',
      href: it.caseUrl || '',
      slug: (it.slug || '').trim() || slugFromUrl(it.caseUrl),
      cover: it.cover || it.image || '',
      order: it.order ?? (i + 1)
    }))
    .filter(it => it.slug)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (!cases.length) return;

  const idx = cases.findIndex(x => x.slug === currentSlug);
  if (idx === -1) return;

  const prev = cases[(idx - 1 + cases.length) % cases.length];
  const next = cases[(idx + 1) % cases.length];

  hydrateRailLink(rail, 'prev', prev);
  hydrateRailLink(rail, 'next', next);
}

function hydrateRailLink(rail, side, item) {
  const link = rail.querySelector(`.railLink.is-${side}`);
  if (!link || !item) return;

  const label = side === 'prev' ? 'Previous' : 'Next';
  const href = item.href || (item.slug ? `${item.slug}.html` : '#');
  link.href = href;
  link.setAttribute('aria-label', `${label} project: ${item.title}`);

  const text = link.querySelector('.railText');
  if (text) text.innerHTML = `<em>${label}</em> project`;

  const img = link.querySelector('.railImg');
  if (img) {
    img.src = item.cover || '';
    img.alt = `${item.title} cover`;
  }
}

/* ---------- utils ---------- */
function slugFromUrl(u) {
  if (!u) return '';
  try {
    const p = new URL(u, location.href).pathname;
    const base = p.substring(p.lastIndexOf('/') + 1);
    return base.replace(/\.html?$/i, '');
  } catch {
    const b = String(u).split('/').pop() || u;
    return b.replace(/\.html?$/i, '');
  }
}

function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function attr(str) {
  return esc(str).replaceAll("'", "&#39;");
}
