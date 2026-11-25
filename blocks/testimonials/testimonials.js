/**
 * testimonials — guest-review carousel, 3 / 2 / 1 cards per view, arrow paging with a 600 ms
 * slide (stardust/eds-schema/index.json section 3; prototype index-proposed.html
 * .testimonials[data-carousel]). Reconstructive: one row per testimonial.
 *
 * Authoring rows — one per testimonial (authors add, remove and reorder rows):
 *   cell 1  the quote (one or more paragraphs)
 *   cell 2  the author line ("Emma, Vilassar de Dalt 1/11/16 *****"); a second paragraph,
 *           when present, is the author's position / subtitle
 * A one-cell row is read as quote only; a row with no text is ignored.
 * The speech-bubble avatar and the arrows are decorative chrome (no authored text).
 */

const AVATAR = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" '
  + 'width="80" height="80" viewBox="0 0 60 60"><path d="M30,1.5c-16.542,0-30,12.112-30,27'
  + 'c0,5.204,1.646,10.245,4.768,14.604c-0.591,6.537-2.175,11.39-4.475,13.689c-0.304,0.304-0.38,'
  + '0.769-0.188,1.153C0.275,58.289,0.625,58.5,1,58.5c0.046,0,0.092-0.003,0.139-0.01c0.405-0.057,'
  + '9.813-1.411,16.618-5.339C21.621,54.71,25.737,55.5,30,55.5c16.542,0,30-12.112,30-27S46.542,'
  + '1.5,30,1.5z M16,32.5c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S18.206,32.5,16,32.5z '
  + 'M30,32.5c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S32.206,32.5,30,32.5z M44,32.5'
  + 'c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S46.206,32.5,44,32.5z"></path></svg>';

const GAP = 30;

function el(tag, className) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}

// move the cell's authored children (bare text wrapped first, so nothing is dropped — EW1)
function blocksOf(cell) {
  if (!cell) return [];
  [...cell.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    .forEach((n) => {
      const p = document.createElement('p');
      n.replaceWith(p);
      p.append(n);
    });
  return [...cell.children];
}

function buildItem(row) {
  const cells = [...row.children].filter((c) => c.textContent.trim() || c.children.length);
  if (!cells.length) return null;
  const quote = blocksOf(cells[0]);
  const author = cells.slice(1).flatMap(blocksOf);
  const item = el('article', 'testimonial-item');
  const content = el('div', 'testimonial-content');
  content.append(...quote);
  item.append(content);

  const who = el('div', 'testimonial-author');
  const avatar = el('div', 'testimonial-avatar');
  const bubble = el('span', 'testim-no-avatar');
  bubble.innerHTML = AVATAR;
  avatar.append(bubble);
  const vcard = el('div', 'testimonial-vcard');
  const name = el('div', 'testimonial-name');
  const position = el('div', 'testimonial-position');
  if (author[0]) name.append(author[0]);
  position.append(...author.slice(1));
  vcard.append(name, position);
  who.append(avatar, vcard);
  item.append(who);
  return item;
}

function arrow(dir, label) {
  const b = el('button', `carousel-arrow carousel-arrow-${dir}`);
  b.type = 'button';
  b.setAttribute('aria-label', label);
  const icon = el('i', `ca-icon ca-icon-arrow-${dir === 'prev' ? 'l' : 'r'}`);
  icon.setAttribute('aria-hidden', 'true');
  b.append(icon);
  return b;
}

export default function decorate(block) {
  if (block.querySelector(':scope > .testimonials-viewport')) return; // EW9 re-entrant
  const items = [...block.children].map(buildItem).filter(Boolean);
  const viewport = el('div', 'testimonials-viewport');
  const track = el('div', 'testimonials-track');
  track.append(...items);
  viewport.append(track);
  block.replaceChildren(viewport);
  if (!items.length) return;

  const prev = arrow('prev', 'Previous');
  const next = arrow('next', 'Next');
  block.append(prev, next);

  let idx = 0;
  const pitch = () => items[0].getBoundingClientRect().width + GAP;
  const perView = () => Math.max(1, Math.round((viewport.clientWidth + GAP) / pitch()));
  const move = (d) => {
    const pv = perView();
    const max = Math.max(0, items.length - pv);
    idx += d;
    if (idx > max) idx = 0;
    if (idx < 0) idx = max;
    track.style.transform = `translate3d(${-idx * pitch()}px, 0, 0)`;
    items.forEach((it, k) => it.classList.toggle('active', k >= idx && k < idx + pv));
  };
  move(0);
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  window.addEventListener('resize', () => move(0));
}
