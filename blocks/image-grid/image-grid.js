/**
 * image-grid — WPBakery row of equal columns, each a stack of (linked) headings and single
 * images (stardust/eds-schema/index.json sections 2 and 4; prototype index-proposed.html
 * .house-grid / .experience-grid). Reconstructive: authors add or remove columns and items.
 *
 * Authoring: one row per grid row; one cell per column (2 → halves, 3 → thirds, 4 → quarters;
 * stacked to one column at 768px and below). A cell holds, in any order, headings and images
 * (one per paragraph, or bare). Any other authored element (text, lists) is kept in place.
 *
 * @variants block: linked | stacked | plain | gallery (default: none); plain modifiers
 *           intro-50 | intro-42 | stack-70 | end-0; gallery modifier events
 *   linked   — each image links to the destination of the heading above it (house grid)
 *   stacked  — heading → image gap 30px instead of 20px (experience grid)
 *   plain    — image rows of the accommodation pages (prototype the-garden-proposed.html
 *              .garden-images): no entrance fade, 46px below every image, 32px below the text
 *   intro-50 — (plain) 50px below the text above instead of 32px (source spacer)
 *   intro-42 — (plain) 42px below the text above: its last paragraph keeps its 10px margin
 *              over the 32px spacer (article pages)
 *   end-0    — (plain) no spacer under the images (article who-we-are pages)
 *   stack-70 — (plain) images stacked in one column sit 70px apart, no spacer under the column
 *   gallery  — WPBakery media grid of the ground-floor pages: 20px gutters, two columns above
 *              768px; a cell is an image followed by a paragraph holding one link — its href is
 *              the zoom target and its text the caption; a click opens the block's images in a
 *              lightbox (the source's prettyPhoto: caption, n/N, prev/next, play, close, Esc and
 *              arrow keys)
 *   events   — (gallery) the events pages' media grid (3 per row): straight under the text above,
 *              the last row flush, 50px spacer under the grid
 *
 * @ew-exempt metadata — gallery: the caption is also written to the zoom link's title (the
 * source's link title); the visible lightbox caption is a presentational clone
 */

function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

const isImage = (el) => el.matches('picture, img')
  || (el.matches('p') && el.querySelector('picture, img') && !el.textContent.trim());

function decorateColumn(cell, linked) {
  const col = document.createElement('div');
  col.className = 'image-grid-col';
  let href = null;
  const images = [];
  // leftovers: bare text directly in the cell becomes a paragraph so it is kept (EW1)
  [...cell.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    .forEach((n) => {
      const p = document.createElement('p');
      n.replaceWith(p);
      p.append(n);
    });
  let node = cell.firstElementChild;
  while (node) {
    const next = node.nextElementSibling; // capture before moving (EW1)
    if (node.matches('h1, h2, h3, h4, h5, h6')) {
      const a = node.querySelector('a[href]');
      href = a ? a.getAttribute('href') : null;
      col.append(wrapNode(node, 'image-grid-heading'));
    } else if (isImage(node)) {
      const figure = document.createElement('figure');
      figure.className = 'image-grid-image';
      if (linked && href) {
        const link = document.createElement('a');
        link.href = href;
        link.tabIndex = -1;
        link.setAttribute('aria-hidden', 'true');
        link.append(node);
        figure.append(link);
      } else {
        figure.append(node);
      }
      images.push(figure);
      col.append(figure);
    } else {
      col.append(wrapNode(node, 'image-grid-text'));
    }
    node = next;
  }
  return { col, images };
}

const isLinkPara = (el) => el.matches('p') && el.querySelector('a[href]')
  && !el.querySelector('picture, img')
  && el.textContent.trim() === el.querySelector('a[href]').textContent.trim();

/* gallery cell: the image, and over it the zoom link (the source's empty prettyPhoto anchor over
   the media-grid zone, named by its title): href from the authored link paragraph after the
   image; that paragraph's anchor is unwrapped (EW6) and the paragraph moved into the zoom link
   as its visually hidden lightbox caption */
function decorateGalleryColumn(cell) {
  const col = document.createElement('div');
  col.className = 'image-grid-col';
  [...cell.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    .forEach((n) => {
      const p = document.createElement('p');
      n.replaceWith(p);
      p.append(n);
    });
  let zoom = null;
  let node = cell.firstElementChild;
  while (node) {
    const next = node.nextElementSibling; // capture before moving (EW1)
    if (isImage(node)) {
      const figure = document.createElement('figure');
      figure.className = 'image-grid-image';
      zoom = document.createElement('a');
      zoom.className = 'image-grid-zoom';
      figure.append(node, zoom);
      col.append(figure);
    } else if (zoom && !zoom.getAttribute('href') && isLinkPara(node)) {
      const a = node.querySelector('a[href]');
      zoom.href = a.getAttribute('href');
      a.replaceWith(...a.childNodes);
      const caption = wrapNode(node, 'image-grid-caption');
      zoom.title = caption.textContent.trim();
      zoom.append(caption);
    } else {
      col.append(wrapNode(node, 'image-grid-text'));
    }
    node = next;
  }
  return col;
}

function decorateGallery(block) {
  const rows = [...block.children].map((row) => {
    const cells = [...row.children].filter((c) => c.children.length || c.textContent.trim());
    const out = document.createElement('div');
    out.className = `image-grid-row image-grid-cols-${Math.min(Math.max(cells.length, 1), 4)}`;
    cells.forEach((cell) => out.append(decorateGalleryColumn(cell)));
    return out;
  }).filter((r) => r.children.length);
  block.replaceChildren(...rows);
  block.addEventListener('click', async (e) => {
    const zoom = e.target.closest('.image-grid-zoom');
    if (!zoom || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const zooms = [...block.querySelectorAll('.image-grid-zoom')];
    try {
      const { openLightbox } = await import('./lightbox.js');
      openLightbox(zooms, zooms.indexOf(zoom));
    } catch {
      window.location.href = zoom.href; // no lightbox: the link's own target, as without JS
    }
  });
}

export default async function decorate(block) {
  if (block.querySelector(':scope > .image-grid-row')) return; // EW9 re-entrant
  if (block.classList.contains('gallery')) {
    decorateGallery(block);
    return;
  }
  const linked = block.classList.contains('linked');
  const stacked = block.classList.contains('stacked');
  const plain = block.classList.contains('plain');
  const faded = [];
  const rows = [...block.children].map((row) => {
    const cells = [...row.children].filter((c) => c.children.length || c.textContent.trim());
    const out = document.createElement('div');
    out.className = `image-grid-row image-grid-cols-${Math.min(Math.max(cells.length, 1), 4)}`;
    cells.forEach((cell) => {
      const { col, images } = decorateColumn(cell, linked);
      out.append(col);
      if (!stacked && !plain) faded.push(...images);
    });
    return out;
  }).filter((r) => r.children.length);
  block.replaceChildren(...rows);
  if (!faded.length) return;
  try {
    // the WPBakery fadeIn (foundation helper); a failed load leaves the images plainly visible
    const { fadeInOnView } = await import('../../scripts/canon-motion.js');
    fadeInOnView(faded);
  } catch { /* no entrance animation */ }
}
