/**
 * media-feature — WPBakery image + text rows of the editorial (article) pages: an image column
 * beside a heading and its story (prototype stardust/prototypes/culture-proposed.html
 * .culture-feature, schema stardust/eds-schema/culture.json). Reconstructive: one row per
 * feature; authors add, remove and reorder rows, and add cells, freely.
 *
 * Authoring — one row per feature, one cell per column (two columns side by side above 768px,
 * stacked below, in authored order):
 *   image cell  a paragraph (or heading) holding the image — the image sits on the text line,
 *               as on the source
 *   text cell   a heading and its paragraphs / lists
 * A cell is the image cell when it holds a picture; any number of cells is laid out evenly.
 * Rows with no content are ignored; bare text in a cell becomes a paragraph (kept, EW1).
 *
 * @variants block: gap-<n> — px between rows (default 40, the source's vc_empty_space);
 *   top-<n> — px above the block (default 56; top-0 when the source has no spacer);
 *   intro-<n> — px under the section's intro h1 (default 10, its margin): the source's blank
 *   `&nbsp;` paragraph (dropped by the delivery pipeline) or spacer row under the heading
 *   intro-h3 — the intro h1 was a source h3: painted 200 30px/35px (R-07)
 * @variants block (listing teasers — a heading over its image in one cell):
 *   head-<n> — px between a cell's heading and what follows it (the source's spacer; default
 *   the heading's own margin); with head-<n> each row carries its trailing spacer: gap-<n> under
 *   every row, end-<n> under the last (default 0)
 */

function spacing(block, prefix) {
  const cls = [...block.classList].find((c) => new RegExp(`^${prefix}-\\d+$`).test(c));
  return cls ? `${parseInt(cls.slice(prefix.length + 1), 10)}px` : null;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .media-feature-row')) return; // EW9 re-entrant
  const gap = spacing(block, 'gap');
  const top = spacing(block, 'top');
  if (gap) block.style.setProperty('--media-feature-gap', gap);
  if (top) block.style.setProperty('--media-feature-top', top);
  const head = spacing(block, 'head');
  const end = spacing(block, 'end');
  if (head) block.style.setProperty('--media-feature-head', head);
  if (end) block.style.setProperty('--media-feature-end', end);
  const intro = spacing(block, 'intro');
  const section = block.closest('.section');
  if (intro && section) section.style.setProperty('--media-feature-intro', intro);

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      // leftovers: bare text directly in a cell becomes a paragraph so it is kept (EW1)
      [...cell.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
        .forEach((n) => {
          const p = document.createElement('p');
          n.replaceWith(p);
          p.append(n);
        });
    });
    const filled = cells.filter((c) => c.textContent.trim() || c.querySelector('picture, img'));
    if (!filled.length) {
      row.remove();
      return;
    }
    row.className = `media-feature-row media-feature-cols-${filled.length}`;
    cells.forEach((cell) => {
      if (!filled.includes(cell)) {
        cell.remove();
        return;
      }
      const isMedia = !!cell.querySelector('picture, img');
      cell.className = `media-feature-col ${isMedia ? 'media-feature-media' : 'media-feature-text'}`;
    });
  });
}
