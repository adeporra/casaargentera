/**
 * availability-calendar — the reservations availability calendar (ICS Calendar "month" layout)
 * beside its side column (prices). Prototype stardust/prototypes/reservations-2-proposed.html
 * .booking-availability. Static snapshot of the captured months (stardust/dynamic-features.md
 * row 10, booking-calendar, interim): no live feed is read; the month dropdown switches months.
 * Reservation URLs, event descriptions and guest details are never authored (register R-01).
 *
 * Authoring — one row per setting, month, booking or side column (any order; all optional):
 *   label | <text>             the month dropdown's accessible label
 *   today | YYYY-MM-DD         the snapshot day (past / today / future states); default: today
 *   weekdays | Mon, …, Sun     the column heads, Monday first, comma-separated
 *   all day | <text>           the indicator above a one-day booking
 *   no events | <text>         the line a month without bookings shows on phones
 *   day label | {l} {d}/{m}    the phone day label; letters (PHP date): l weekday, F month name,
 *                              d / j day (padded / not), m / n month (padded / not)
 *   day names | Mon, …, Sun    names for {l}, Monday first (default: the weekdays row)
 *   month names | Jan, …, Dec  names for {F}
 *   YYYY-MM | <label>          one row per month in the dropdown, in order
 *   YYYY-MM-DD [– YYYY-MM-DD] | <title>   a booking (one day, or a first – last day range)
 *   <one cell: headings, paragraphs>      a side column (moved, in order, beside the calendar)
 *
 * @ew-exempt metadata — setting rows are read and removed; month labels, weekday names and
 *   booking titles are generated into the calendar grid (a widget rendered from data, as the
 *   source's plugin renders its feed). Side-column cells are moved, never rebuilt (EW1).
 */

const pad = (n) => String(n).padStart(2, '0');
const text = (node) => (node ? node.textContent.replace(/\s+/g, ' ').trim() : '');
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const toDate = (s) => {
  const m = s.match(DATE);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
};
const key = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const dow = (d) => (d.getUTCDay() + 6) % 7; // Monday = 0

function el(tag, className, attrs = {}) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

function readRows(block) {
  const cfg = {
    months: [], events: [], side: [], settings: {},
  };
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) {
      if (cells[0] && cells[0].children.length) cfg.side.push(cells[0]);
      return;
    }
    const k = text(cells[0]);
    const v = text(cells[1]);
    const ym = k.match(/^(\d{4})-(\d{2})$/);
    const range = k.match(/^(\d{4}-\d{2}-\d{2})(?:\s*[–-]\s*(\d{4}-\d{2}-\d{2}))?$/);
    if (ym) cfg.months.push({ ym: `${ym[1]}${ym[2]}`, label: v });
    else if (range) {
      const start = toDate(range[1]);
      const end = toDate(range[2] || range[1]);
      if (start && end && v) cfg.events.push({ start, end, title: v });
    } else cfg.settings[k.toLowerCase()] = v;
  });
  return cfg;
}

function dayLabel(d, cfg) {
  const s = cfg.settings;
  const dayNames = list(s['day names'] || s.weekdays || '');
  const monthNames = list(s['month names'] || '');
  const values = {
    l: dayNames[dow(d)] || '',
    F: monthNames[d.getUTCMonth()] || '',
    d: pad(d.getUTCDate()),
    j: String(d.getUTCDate()),
    m: pad(d.getUTCMonth() + 1),
    n: String(d.getUTCMonth() + 1),
  };
  const frag = document.createDocumentFragment();
  (s['day label'] || '{l} {d}/{m}').split(/(\{[a-zA-Z]\})/).filter(Boolean).forEach((part) => {
    const tok = part.match(/^\{([a-zA-Z])\}$/);
    if (tok) {
      const span = el('span');
      span.textContent = values[tok[1]] ?? '';
      frag.append(span);
    } else frag.append(part);
  });
  return frag;
}

function eventItem(ev, d, cfg) {
  const multi = ev.end > ev.start;
  const li = el('li', 'event all-day');
  if (multi) {
    let pos = 'middle';
    if (+d === +ev.start) pos = 'first';
    else if (+d === +ev.end) pos = 'last';
    li.classList.add(`multiday-${pos}`);
  }
  const ind = el('span', 'all-day-indicator');
  ind.textContent = cfg.settings['all day'] || 'All Day';
  const title = el('span', multi ? 'title has-desc' : 'title', multi ? { tabindex: '0' } : {});
  title.textContent = ev.title;
  li.append(ind, ' ', title);
  if (multi) {
    // hover block: the booking's range (the source's description is not carried — R-01)
    const hover = el('div', 'hover-block');
    const date = el('div', 'hover-block-date');
    const a = el('span', 'multiday-start');
    a.append(dayLabel(ev.start, cfg));
    const sep = el('span', 'multiday-sep');
    sep.textContent = ' – ';
    const b = el('span', 'multiday-end');
    b.append(dayLabel(ev.end, cfg));
    date.append(a, sep, b);
    const ht = el('div', 'hover-block-title');
    ht.textContent = ev.title;
    hover.append(date, ht);
    li.append(hover);
  }
  return li;
}

function monthArticle(month, cfg, today, uid) {
  const y = +month.ym.slice(0, 4);
  const mo = +month.ym.slice(4, 6) - 1;
  const thisYm = key(today).slice(0, 6);
  const art = el('article', 'availability-calendar-month', { 'data-year-month': month.ym });
  if (month.ym < thisYm) art.classList.add('past');
  if (month.ym === thisYm) art.dataset.isThisMonth = '1';
  const h = el('h3', 'availability-calendar-label', { id: `${uid}-${month.ym}` });
  h.textContent = month.label;
  const table = el('table', 'availability-calendar-grid', { 'aria-labelledby': h.id });
  const thead = el('thead');
  const htr = el('tr');
  list(cfg.settings.weekdays || '').forEach((w) => {
    const th = el('th');
    th.textContent = w;
    htr.append(th);
  });
  thead.append(htr);
  const tbody = el('tbody');
  const first = new Date(Date.UTC(y, mo, 1));
  const days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  let tr = el('tr');
  for (let i = 0; i < dow(first); i += 1) tr.append(el('td', 'off'));
  let monthEvents = 0;
  for (let n = 1; n <= days; n += 1) {
    const d = new Date(Date.UTC(y, mo, n));
    const evs = cfg.events.filter((e) => d >= e.start && d <= e.end);
    monthEvents += evs.length;
    let state = 'future';
    if (+d === +today) state = 'today';
    else if (d < today) state = 'past';
    const td = el('td', `${state} ${evs.length ? 'has-events' : 'empty'} d-${pad(n)}`);
    const day = el('div', 'day');
    const phone = el('span', 'phone-only', { id: `${uid}-${key(d)}` });
    phone.append(dayLabel(d, cfg));
    const num = el('span', 'no-phone', { 'aria-hidden': 'true' });
    num.textContent = String(n);
    day.append(phone, ' ', num);
    td.append(day);
    if (evs.length) {
      const ul = el('ul', 'events', { 'aria-labelledby': phone.id });
      evs.forEach((e) => ul.append(eventItem(e, d, cfg)));
      td.append(ul);
    }
    tr.append(td);
    if (dow(d) === 6) {
      tbody.append(tr);
      tr = el('tr');
    }
  }
  if (tr.children.length) {
    while (tr.children.length < 7) tr.append(el('td', 'off'));
    tbody.append(tr);
  }
  table.append(thead, tbody);
  art.append(h, table);
  if (!monthEvents && cfg.settings['no events']) {
    const p = el('p', 'phone-only no-events');
    p.textContent = cfg.settings['no events'];
    art.append(p);
  }
  return art;
}

let counter = 0;

export default function decorate(block) {
  if (block.querySelector(':scope > .availability-calendar-main')) return; // EW9 re-entrant
  const cfg = readRows(block);
  counter += 1;
  const uid = `avail-${counter}`;
  const today = toDate(cfg.settings.today || '') || (() => {
    const n = new Date();
    return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  })();
  const thisYm = key(today).slice(0, 6);

  const main = el('div', 'availability-calendar-main');
  const widget = el('div', 'availability-calendar-widget');
  const lab = el('label', 'screen-reader-text', { for: `${uid}-select` });
  lab.textContent = cfg.settings.label || 'Month selection';
  const select = el('select', 'availability-calendar-select', {
    id: `${uid}-select`,
    'aria-label': lab.textContent,
    autocomplete: 'off',
    'data-this-month': thisYm,
  });
  const shown = cfg.months.some((m) => m.ym === thisYm) ? thisYm : (cfg.months[0] || {}).ym;
  cfg.months.forEach((m) => {
    const o = el('option', '', { value: m.ym });
    o.textContent = m.label;
    if (m.ym === shown) o.selected = true;
    select.append(o);
  });
  widget.append(lab, select);
  const articles = cfg.months.map((m) => {
    const art = monthArticle(m, cfg, today, uid);
    art.hidden = m.ym !== shown;
    widget.append(art);
    return art;
  });
  select.addEventListener('change', () => {
    articles.forEach((a) => { a.hidden = a.dataset.yearMonth !== select.value; });
  });
  main.append(widget);

  const side = el('div', 'availability-calendar-side');
  cfg.side.forEach((cell) => {
    const col = el('div', 'availability-calendar-text');
    col.append(...cell.childNodes);
    side.append(col);
  });
  block.replaceChildren(main);
  if (cfg.side.length) block.append(side);
}
