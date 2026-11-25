/**
 * hero-slider — full-bleed Revolution-Slider hero: crossfading slides, centred text layers,
 * bullets, autoplay (stardust/eds-schema/index.json; prototype
 * stardust/prototypes/index-proposed.html #main-slideshow). Template-slotted per slide.
 *
 * Authoring rows — one row per slide (authors add / remove rows freely):
 *   cell 1  image (the slide background; editorial, required for a visible slide)
 *   cell 2  text layers, in order: the first heading or paragraph is the large title layer,
 *           every following one a sub layer (both optional — image-only slides are fine)
 *   cell 3  layout word (optional) — where the layers sit over the image; or placements, one
 *           per layer in layer order separated by `;` (the Revolution Slider data-xy):
 *             `x:<px> y:<px>`        top-left offset on the 1240×868 grid
 *             `x:c+<px> y:c-<px>`    offset of the layer's centre from the grid's centre
 *           each optionally followed by a colour (`#e09500`) and a line height (`lh:<px>`),
 *           e.g. `x:95 y:232; x:162 y:304 #ea9800` (events pages)
 * A row whose cells are all empty is ignored. A single-slide hero gets no bullets and no timer.
 *
 * @variants cell 3: center | low | left | low-left (default center) — mapped to
 *   .hero-slide-<word>; the exact layer offsets and sub-layer colour live in the block CSS (#134)
 * @variants block: start-<n> (default start-1) — the slide shown first (the source's rotation
 *   phase at capture); autoplay then loops over every slide
 * @variants block: title-60 — title layers 60/50 instead of 80/70 (events pages)
 * @ew-exempt metadata — the layout word / placements (cell 3) are never displayed
 *
 * Section metadata `duration` (→ section data-duration, ms) sets the autoplay interval
 * (default 2500, stardust/runtime-contract.json heroSlider); the crossfade is 600 ms (CSS).
 */

const LAYOUTS = ['center', 'low', 'left', 'low-left'];
const DEFAULT_DURATION = 2500;

function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

const text = (el) => (el ? el.textContent.trim() : '');

function layoutWord(cell) {
  const word = text(cell).toLowerCase().replace(/\s+/g, '-');
  return LAYOUTS.includes(word) ? word : 'center';
}

/* placements (cell 3): `x:95 y:232 #ea9800 lh:25; …` → one { x, y, centred, color, lh } per layer;
   null when the cell holds no placement (a layout word or nothing) */
function placements(cell) {
  const raw = text(cell);
  if (!/\bx:\s*c?[+-]?\d/i.test(raw)) return null;
  return raw.split(/;|\n/).map((part) => {
    const x = part.match(/\bx:\s*(c)?\s*([+-]?\d+(?:\.\d+)?)/i);
    const y = part.match(/\by:\s*(c)?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (!x || !y) return null;
    const color = part.match(/#[0-9a-f]{3,8}\b/i);
    const lh = part.match(/\blh:\s*(\d+(?:\.\d+)?)/i);
    return {
      centred: !!(x[1] || y[1]),
      x: parseFloat(x[2]),
      y: parseFloat(y[2]),
      color: color ? color[0] : null,
      lh: lh ? parseFloat(lh[1]) : null,
    };
  });
}

function place(layer, p) {
  if (!p) return;
  if (p.centred) {
    layer.style.setProperty('--xo', p.x);
    layer.style.setProperty('--yo', p.y);
  } else {
    layer.classList.add('hero-layer-at');
    layer.style.setProperty('--x', p.x);
    layer.style.setProperty('--y', p.y);
  }
  if (p.color) layer.style.color = p.color;
  if (p.lh) layer.style.lineHeight = `calc(${p.lh} * var(--s))`;
}

function startIndex(block, count) {
  const cls = [...block.classList].find((c) => /^start-\d+$/.test(c));
  const n = cls ? parseInt(cls.slice(6), 10) : 1;
  return Math.min(Math.max(n, 1), count) - 1;
}

function buildSlide(row) {
  const cells = [...row.children];
  const media = row.querySelector('picture') || row.querySelector('img');
  const layoutCell = cells.length > 2 ? cells[cells.length - 1] : null;
  const layers = [...row.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
    .filter((el) => !layoutCell || !layoutCell.contains(el))
    .filter((el) => !el.querySelector('picture, img') && text(el));
  if (!media && !layers.length) return null;

  const placed = layoutCell ? placements(layoutCell) : null;
  const slide = document.createElement('div');
  slide.className = placed ? 'hero-slide hero-slide-placed'
    : `hero-slide hero-slide-${layoutWord(layoutCell)}`;
  if (media) {
    const holder = media.closest('p') && !text(media.closest('p')) ? media.closest('p') : media;
    slide.append(wrapNode(holder, 'hero-slide-media'));
  }
  layers.forEach((el, i) => {
    const layer = wrapNode(el, i === 0 ? 'hero-layer hero-layer-title' : 'hero-layer hero-layer-sub');
    if (placed) place(layer, placed[i]);
    slide.append(layer);
  });
  return slide;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .hero-slider-slides')) return; // EW9 re-entrant
  const slides = [...block.children].map(buildSlide).filter(Boolean);
  const track = document.createElement('div');
  track.className = 'hero-slider-slides';
  track.append(...slides);
  block.replaceChildren(track);
  if (!slides.length) return;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', text(slides[0].querySelector('.hero-layer')) || 'Slideshow');

  let cur = startIndex(block, slides.length);
  slides.forEach((s, i) => {
    const img = s.querySelector('img');
    if (!img) return;
    if (i === cur) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
  });
  slides[cur].classList.add('is-active');
  if (slides.length < 2) return;

  const bullets = document.createElement('div');
  bullets.className = 'hero-slider-bullets';
  const dots = slides.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hero-bullet';
    b.setAttribute('aria-label', `Slide ${i + 1}`);
    bullets.append(b);
    return b;
  });
  dots[cur].classList.add('selected');
  block.append(bullets);

  const section = block.closest('.section');
  const ms = parseInt(section && section.dataset.duration, 10) || DEFAULT_DURATION;
  let timer = null;

  const go = (n) => {
    slides[cur].classList.remove('is-active');
    dots[cur].classList.remove('selected');
    cur = (n + slides.length) % slides.length;
    const img = slides[cur].querySelector('img');
    if (img) img.loading = 'eager';
    slides[cur].classList.add('is-active');
    dots[cur].classList.add('selected');
  };
  const schedule = () => {
    clearInterval(timer);
    // a plain interval (not rAF / timeout chain): the gate's timer hold freezes it in one state
    timer = setInterval(() => go(cur + 1), ms);
  };
  dots.forEach((b, i) => b.addEventListener('click', () => {
    if (i === cur) return;
    go(i);
    schedule();
  }));
  schedule();

  // warm the other slides once the page has settled, so a crossfade never shows a blank frame
  const warm = () => slides.forEach((s) => {
    const img = s.querySelector('img');
    if (img) img.loading = 'eager';
  });
  if (document.readyState === 'complete') warm();
  else window.addEventListener('load', warm, { once: true });
}
