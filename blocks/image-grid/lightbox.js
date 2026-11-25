/**
 * image-grid gallery lightbox — the source's prettyPhoto behaviour (WPBakery media grid, theme
 * pp_default), loaded on the first click of a gallery image: a 70 % black overlay, the image
 * fitted to the window (at most 1024px wide, the source's file width) in a white frame, a
 * thumbnail strip when the frame is wide enough, and a bar with play / previous / next, the
 * position (n/N), the caption and close. Escape closes; the arrow keys step; the overlay closes.
 * Probed on https://www.casaargentera.com/the-ground-floor/ (1440 and 360).
 */

const SLIDESHOW_MS = 5000;
const MAX_W = 1024;
const THUMBS_MIN_W = 560;

const ICONS = {
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z"/></svg>',
  pause: '<svg viewBox="0 0 16 16" aria-hidden="true">'
    + '<path d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z"/></svg>',
  prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 3.5v9L4 8z"/></svg>',
  next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9L12 8z"/></svg>',
  close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.4 3.3 8 6.9l3.6-3.6 1.1 1.1L9.1 '
    + '8l3.6 3.6-1.1 1.1L8 9.1l-3.6 3.6-1.1-1.1L6.9 8 3.3 4.4z"/></svg>',
};

function el(tag, className, attrs = {}) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

function button(name, label) {
  const b = el('button', `image-grid-lightbox-${name}`, { type: 'button', 'aria-label': label });
  b.innerHTML = ICONS[name] || '';
  return b;
}

/* the largest rendition of the grid image: EDS media URLs take a width parameter */
function fullSrc(img) {
  const raw = img.currentSrc || img.src;
  try {
    const u = new URL(raw, window.location.href);
    if (/\/media_[0-9a-f]+/.test(u.pathname)) {
      u.searchParams.set('width', '2000');
      u.searchParams.set('format', 'webply');
      u.searchParams.set('optimize', 'medium');
    }
    return u.href;
  } catch {
    return raw;
  }
}

function itemOf(zoom) {
  const img = (zoom.closest('figure') || zoom).querySelector('img');
  const caption = zoom.querySelector('.image-grid-caption');
  return {
    zoom,
    img,
    src: img ? fullSrc(img) : zoom.href,
    alt: img ? img.getAttribute('alt') || '' : '',
    caption: caption ? caption.textContent.trim() : zoom.title || '',
    ratio: img && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 576 / 1024,
  };
}

export function openLightbox(zooms, start = 0) {
  const block = zooms[0].closest('.image-grid');
  const items = zooms.map(itemOf);
  let index = Math.max(0, start);
  let timer = null;

  const root = el('div', 'image-grid-lightbox', { role: 'dialog', 'aria-modal': 'true' });
  const overlay = el('div', 'image-grid-lightbox-overlay');
  const box = el('div', 'image-grid-lightbox-box');
  const stage = el('div', 'image-grid-lightbox-stage');
  const image = el('img', 'image-grid-lightbox-image');
  const hoverAttrs = { href: '#', 'aria-hidden': 'true', tabindex: '-1' };
  const hoverPrev = el('a', 'image-grid-lightbox-hover-prev', hoverAttrs);
  const hoverNext = el('a', 'image-grid-lightbox-hover-next', hoverAttrs);
  const thumbs = el('div', 'image-grid-lightbox-thumbs');
  const bar = el('div', 'image-grid-lightbox-bar');
  const play = button('play', 'Play slideshow');
  const prev = button('prev', 'Previous');
  const next = button('next', 'Next');
  const counter = el('span', 'image-grid-lightbox-counter');
  const caption = el('p', 'image-grid-lightbox-caption');
  const close = button('close', 'Close');

  items.forEach((it, i) => {
    const t = el('button', 'image-grid-lightbox-thumb', {
      type: 'button',
      'aria-label': `${i + 1}`,
    });
    const ti = el('img', '', { src: it.img ? it.img.currentSrc || it.img.src : it.src, alt: '' });
    t.append(ti);
    t.addEventListener('click', () => {
      index = i;
      show(); // eslint-disable-line no-use-before-define
    });
    thumbs.append(t);
  });

  stage.append(image, hoverPrev, hoverNext, thumbs);
  bar.append(play, prev, next, counter, caption, close);
  box.append(stage, bar);
  root.append(overlay, box);

  function fit() {
    const it = items[index];
    const w = Math.min(MAX_W, window.innerWidth - 80);
    const h = Math.min(w * it.ratio, window.innerHeight - 150);
    const width = Math.max(120, Math.round(h / it.ratio));
    image.style.width = `${width}px`;
    image.style.height = `${Math.round(width * it.ratio)}px`;
    box.style.width = `${width + 26}px`; // the frame hugs the image; the bar wraps inside it
    root.classList.toggle('has-thumbs', width >= THUMBS_MIN_W && items.length > 1);
  }

  function show() {
    const it = items[index];
    image.src = it.src;
    image.alt = it.alt;
    counter.textContent = `${index + 1}/${items.length}`;
    caption.textContent = it.caption;
    root.setAttribute('aria-label', it.caption || it.alt);
    [...thumbs.children].forEach((t, i) => t.classList.toggle('is-active', i === index));
    fit();
  }

  const step = (d) => {
    index = (index + d + items.length) % items.length;
    show();
  };

  function stopShow() {
    clearInterval(timer);
    timer = null;
    play.innerHTML = ICONS.play;
    play.setAttribute('aria-label', 'Play slideshow');
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      // eslint-disable-next-line no-use-before-define
      closeBox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    }
  }

  function closeBox() {
    stopShow();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', fit);
    root.remove();
    zooms[index].focus({ preventScroll: true });
  }

  play.addEventListener('click', () => {
    if (timer) {
      stopShow();
      return;
    }
    timer = setInterval(() => step(1), SLIDESHOW_MS);
    play.innerHTML = ICONS.pause;
    play.setAttribute('aria-label', 'Pause slideshow');
  });
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  hoverPrev.addEventListener('click', (e) => { e.preventDefault(); step(-1); });
  hoverNext.addEventListener('click', (e) => { e.preventDefault(); step(1); });
  close.addEventListener('click', closeBox);
  overlay.addEventListener('click', closeBox);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', fit);

  block.append(root);
  show();
  close.focus({ preventScroll: true });
  return closeBox;
}

export default openLightbox;
