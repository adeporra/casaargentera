/**
 * icon-features — The7 icon-with-text list (layout-1): a round 60px icon cell beside a heading
 * and a description (prototype stardust/prototypes/the-garden-proposed.html .garden-features,
 * schema stardust/eds-schema/the-garden.json). Reconstructive: one row per feature; authors add,
 * remove and reorder rows freely.
 *
 * Authoring — one row per feature:
 *   cell 1  icon word (optional) — a Font Awesome 5 solid name without `fa-` (swimmer, bed, bath,
 *           fire-alt …), a The7 icomoon name (the7-home-021) or the brands `hotjar` (the list is
 *           in the block CSS), or an EDS `:icon:`; an unknown word keeps the empty icon cell
 *   cell 2  the feature: a heading (any level — painted the same) and its description
 *           (paragraphs, lists). A one-cell row is a feature without an icon word.
 * Rows with no text are ignored.
 *
 * @ew-exempt metadata — the icon word (cell 1) is never displayed; it picks the glyph
 */

const ICON_WORD = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function iconName(cell) {
  if (!cell) return null;
  const span = cell.querySelector('span.icon[class*="icon-"]');
  if (span) {
    const cls = [...span.classList].find((c) => c.startsWith('icon-'));
    return cls ? cls.slice(5) : null;
  }
  if (cell.querySelector('h1, h2, h3, h4, h5, h6, picture, img')) return null;
  const word = cell.textContent.trim().toLowerCase().replace(/^fa-/, '');
  return ICON_WORD.test(word) ? word : null;
}

function wrap(className, nodes) {
  const w = document.createElement('div');
  w.className = className;
  w.append(...nodes);
  return w;
}

function buildItem(row) {
  const cells = [...row.children];
  let icon = null;
  let iconCell = null;
  if (cells.length > 1) {
    iconCell = cells.find((c) => iconName(c));
    icon = iconCell ? iconName(iconCell) : null;
  }
  const content = cells.filter((c) => c !== iconCell);
  // leftovers: bare text directly in a content cell becomes a paragraph so it is kept (EW1)
  content.forEach((cell) => {
    [...cell.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
      .forEach((n) => {
        const p = document.createElement('p');
        n.replaceWith(p);
        p.append(n);
      });
  });
  const nodes = content.flatMap((c) => [...c.children]);
  if (!nodes.length || !nodes.some((n) => n.textContent.trim() || n.querySelector('img'))) return null;

  const item = document.createElement('div');
  item.className = 'icon-features-item';
  const badge = document.createElement('span');
  badge.className = 'icon-features-icon';
  badge.setAttribute('aria-hidden', 'true');
  const inner = document.createElement('span');
  inner.className = 'icon-features-inner';
  const glyph = document.createElement('i');
  glyph.className = 'icon-features-glyph';
  if (icon) glyph.classList.add(`icon-features-glyph-${icon}`);
  inner.append(glyph);
  badge.append(inner);
  item.append(badge);

  const heading = nodes.find((n) => n.matches('h1, h2, h3, h4, h5, h6'));
  const before = heading ? nodes.slice(0, nodes.indexOf(heading)) : [];
  const after = heading ? nodes.slice(nodes.indexOf(heading) + 1) : nodes;
  if (heading) item.append(wrap('icon-features-title', [...before, heading]));
  if (after.length) item.append(wrap('icon-features-desc', after));
  return item;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .icon-features-item')) return; // EW9 re-entrant
  const items = [...block.children].map(buildItem).filter(Boolean);
  block.replaceChildren(...items);
}
