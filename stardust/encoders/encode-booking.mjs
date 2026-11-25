#!/usr/bin/env node
// booking encoder — reservation pages (template `booking`, archetype reservations-2; siblings
// es-reservas, ca-reserves, da-reservations). Reads the hydrated capture
// stardust/current/pages/<slug>.html (+ <slug>.json) and writes the DA document for the page.
// Content-driven: walks the source's WPBakery rows in document order, so a sibling with one price
// column instead of two, or without the trailing empty row, encodes without code changes.
//
//   section 1  hero-slider (rows = slides: image / text layers; one slide → static, no bullets)
//   section 2  in source order:
//                text columns        → default content (first heading promoted to h1 — R-07)
//                Contact Form 7      → contact-form (row = label | field word [required];
//                                      one-cell row = note paragraph)
//                ICS Calendar        → availability-calendar (dynamic-features row 10: static
//                                      snapshot of the captured months). Rows:
//                                        label | <select label>      today | YYYY-MM-DD
//                                        weekdays | Mon…Sun names    all day | <indicator>
//                                        no events | <phone text>    day label | PHP date format
//                                        day names | Mon…Sun (l)     month names | Jan…Dec (F)
//                                        YYYY-MM | <month label>     (one per captured month)
//                                        YYYY-MM-DD [– YYYY-MM-DD] | <event title>
//                                      the text columns beside the calendar (prices) follow as
//                                      one-cell rows, one per source text column (moved by the
//                                      block into its side column). Reservation URLs, event
//                                      descriptions and guest phone fragments are NOT carried
//                                      (register R-01).
//                vc_empty_space      → nothing (the spacing lives in the block CSS)
//                empty row           → availability-calendar variant tail-1 when it follows the
//                                      calendar row (its columns' 1px min-height)
//   section 3  metadata (Title, Description, Image, header-veil, translations)
//
// usage: node stardust/encoders/encode-booking.mjs <slug> <out.html>
//          [--scope <media scope>] [--manifest <out.json>] [--veil amber|gold]
//          [--translations "en=/x, da=/da/x, …"]
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : dflt;
};
const [slug, outFile] = args
  .filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!slug || !outFile) {
  console.error('usage: encode-booking.mjs <slug> <out.html> [--scope s] [--manifest f] '
    + '[--veil v] [--translations t]');
  process.exit(2);
}
const scope = opt('scope', 'booking');
const manifestFile = opt('manifest', `stardust/.work/rollout/booking/media-${slug}.json`);
const veilOpt = opt('veil', null);
const translationsOpt = opt('translations', null);
const MEDIA = `https://content.da.live/aemcoder/ea32f12a/media/${scope}/`;
const ASSET_DIRS = ['stardust/migrated/assets', 'stardust/prototypes/assets'];

const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));

const browser = await chromium.launch();
const ctx = await browser.newContext({ javaScriptEnabled: false });
const page = await ctx.newPage();
await page.route('**/*', (r) => r.abort());
await page.setContent(cap, { waitUntil: 'domcontentloaded' });

const src = await page.evaluate(() => {
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|\s/g, '') === '';
  const clean = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('a').forEach((a) => {
      a.removeAttribute('target');
      a.removeAttribute('rel');
    });
    return c.innerHTML.trim();
  };

  // ---- hero (Revolution Slider)
  const mod = document.querySelector('rs-module');
  const hero = { slides: [], active: 1, duration: null };
  if (mod) {
    [...mod.querySelectorAll('rs-slide')].forEach((s, i) => {
      const bg = s.querySelector('rs-sbg');
      const url = bg && (bg.getAttribute('data-lazyload') || bg.getAttribute('data-src-rs-ref'));
      const comment = [...s.querySelector('rs-sbg-wrap')?.childNodes || []]
        .find((n) => n.nodeType === Node.COMMENT_NODE);
      const alt = comment ? (comment.textContent.match(/alt="([^"]*)"/) || [])[1] || '' : '';
      const layers = [...s.querySelectorAll('rs-layer')].map((l) => t(l)).filter(Boolean);
      const abs = url ? new URL(url, 'https://www.casaargentera.com/').href : null;
      hero.slides.push({ url: abs, alt, layers });
      if (s.getAttribute('data-key') === mod.getAttribute('data-slideactive')) hero.active = i + 1;
      if (!hero.duration) hero.duration = s.getAttribute('data-duration');
    });
  }

  // ---- ICS Calendar (r34ics) → calendar data
  const calendar = (root) => {
    const cal = { months: [], events: [], names: {} };
    cal.label = t(root.querySelector('label'));
    const select = root.querySelector('select');
    cal.thisMonth = select ? select.getAttribute('data-this-month') : null;
    cal.months = [...root.querySelectorAll('select option')].map((o) => [o.value, t(o)]);
    cal.weekdays = [...root.querySelector('thead tr').children].map((th) => t(th));
    const ymd = (id) => (id.match(/(\d{8})$/) || [])[1];
    const todayTd = root.querySelector('td.today');
    const todaySpan = todayTd && todayTd.querySelector('.phone_only[id]');
    cal.today = todaySpan ? ymd(todaySpan.id) : null;
    cal.allDay = t(root.querySelector('.all-day-indicator'));
    cal.noEvents = t(root.querySelector('.no_events'));
    // the phone day label: a run of date-format spans and literal separators (PHP date letters)
    const label = root.querySelector('td:not(.off) .phone_only');
    cal.format = label ? [...label.childNodes].map((n) => (n.nodeType === 1
      ? `{${n.getAttribute('data-date-format')}}` : n.textContent)).join('') : '{l} {d}/{m}';
    // names behind the l (weekday) and F (month) letters, read off every captured day label
    const dayNames = new Array(7).fill('');
    const monthNames = new Array(12).fill('');
    root.querySelectorAll('td:not(.off) .phone_only[id]').forEach((s) => {
      const d = ymd(s.id);
      if (!d) return;
      const date = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8)));
      const l = s.querySelector('[data-date-format="l"]');
      const F = s.querySelector('[data-date-format="F"]');
      if (l) dayNames[(date.getUTCDay() + 6) % 7] = t(l);
      if (F) monthNames[date.getUTCMonth()] = t(F);
    });
    if (dayNames.some(Boolean)) cal.names.l = dayNames;
    if (monthNames.some(Boolean)) cal.names.F = monthNames;
    // events: one per (range, title); the class dYYYYMMDD_YYYYMMDD carries the exclusive end
    const seen = new Set();
    root.querySelectorAll('li.event').forEach((li) => {
      const m = li.className.match(/\bd(\d{8})_(\d{8})\b/);
      const title = t(li.querySelector('.title'));
      if (!m || !title) return;
      const key = `${m[1]}|${m[2]}|${title}`;
      if (seen.has(key)) return;
      seen.add(key);
      cal.events.push({ start: m[1], endExcl: m[2], title });
    });
    return cal;
  };

  // ---- body: every module of #content in document order
  const items = [];
  const rows = [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'));
  const sel = '.wpb_text_column, .wpcf7, .ics-calendar, .wpb_single_image';
  const spacerH = (el) => parseInt(
    (el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0',
    10,
  );
  rows.forEach((row, ri) => {
    const cols = [...row.querySelectorAll('.wpb_column')]
      .filter((c) => c.closest('.vc_row') === row);
    const hasCalendar = !!row.querySelector('.ics-calendar');
    // an empty WPBakery row still paints its columns' min-height (1px) — kept as a block variant
    if (!row.querySelector(sel) && !row.textContent.trim()) {
      items.push({ kind: 'empty', row: ri });
      return;
    }
    cols.forEach((col, ci) => {
      const found = [];
      const collect = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE) {
            if (n.matches(`${sel}, .vc_empty_space`)) found.push(n);
            else if (!n.matches('style, script')) collect(n);
          }
        });
      };
      collect(col);
      const last = () => items[items.length - 1];
      found.forEach((el) => {
        if (el.matches('.vc_empty_space')) {
          const it = last();
          if (it && it.row === ri && it.col === ci) {
            it.spaceAfter = (it.spaceAfter || 0) + spacerH(el);
          }
        } else if (el.matches('.ics-calendar')) {
          items.push({
            kind: 'calendar', row: ri, col: ci, cal: calendar(el), side: [],
          });
        } else if (el.matches('.wpb_text_column')) {
          const inner = el.querySelector('.wpb_wrapper') || el;
          const parts = [];
          [...inner.children].forEach((c) => {
            if (!c.matches('h1, h2, h3, h4, h5, h6, p, ul, ol')) return;
            const html = clean(c);
            if (isBlank(html) || /^<span id="more-\d+"><\/span>$/.test(html)) return;
            parts.push({ tag: c.tagName.toLowerCase(), html });
          });
          if (!parts.length) return;
          // a text column in a calendar row is the calendar's side column (prices)
          const calItem = hasCalendar
            && items.find((it) => it.kind === 'calendar' && it.row === ri);
          if (calItem) calItem.side.push(parts);
          else {
            parts.forEach((p) => items.push({
              kind: 'text', ...p, row: ri, col: ci,
            }));
          }
        } else if (el.matches('.wpb_single_image')) {
          const img = el.querySelector('img');
          if (img) {
            items.push({
              kind: 'image',
              row: ri,
              col: ci,
              src: img.getAttribute('src'),
              alt: img.getAttribute('alt') || '',
            });
          }
        } else if (el.matches('.wpcf7')) {
          const form = el.querySelector('form');
          const fields = [];
          [...form.children].filter((c) => c.tagName === 'P').forEach((p) => {
            const controls = [...p.querySelectorAll('input:not([type=hidden]), textarea, select')];
            if (!controls.length) {
              if (!isBlank(p.innerHTML)) fields.push({ note: clean(p) });
              return;
            }
            controls.forEach((ctl) => {
              const type = ctl.tagName === 'TEXTAREA' ? 'textarea' : ctl.type;
              const name = ctl.name || '';
              const req = ctl.getAttribute('aria-required') === 'true';
              if (type === 'submit') {
                fields.push({ label: ctl.value, word: 'submit' });
              } else if (type === 'checkbox') {
                const lab = ctl.closest('label')?.querySelector('.wpcf7-list-item-label');
                fields.push({
                  label: lab ? clean(lab) : '',
                  word: `acceptance${req ? ' required' : ''}`,
                });
              } else {
                const label = ctl.closest('label');
                let text = '';
                if (label) {
                  const n = [...label.childNodes];
                  const stop = n.findIndex((x) => x.nodeType === 1
                    && (x.matches('br') || x.contains(ctl)));
                  text = n.slice(0, stop < 0 ? n.length : stop)
                    .map((x) => x.textContent)
                    .join('')
                    .replace(/\s+/g, ' ')
                    .trim();
                }
                let word = 'text';
                if (type === 'textarea') word = 'message';
                else if (type === 'email' || type === 'tel') word = type;
                else if (/name/.test(name)) word = 'name';
                else if (/subject/.test(name)) word = 'subject';
                fields.push({ label: text, word: `${word}${req ? ' required' : ''}` });
              }
            });
          });
          items.push({
            kind: 'form', fields, row: ri, col: ci,
          });
        }
      });
    });
  });
  const banner = document.querySelector('header[role=banner], .masthead[role=banner]');
  const veilBg = banner
    ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim()
    : null;
  const alternates = [...document.querySelectorAll('link[rel=alternate][hreflang]')]
    .map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')])
    .filter(([h]) => /^[a-z]{2}$/.test(h));
  return {
    hero, items, veilBg, alternates,
  };
});
await browser.close();

// ---- media
const manifest = [];
const localFiles = ASSET_DIRS.filter(existsSync).map((d) => [d, readdirSync(d)]);
const storedName = (file) => {
  const dot = file.lastIndexOf('.');
  const base = file.slice(0, dot).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '-');
  return `${base}${file.slice(dot)}`;
};
function media(url) {
  const { pathname } = new URL(url, 'https://www.casaargentera.com/');
  const file = decodeURIComponent(pathname.split('/').pop());
  const dir = localFiles.find(([, fs]) => fs.includes(file));
  const name = storedName(file);
  if (!manifest.some((e) => e.name === name)) {
    const local = dir ? join(dir[0], file) : `stardust/.work/rollout/booking/fetched/${file}`;
    const entry = { file: local, name };
    if (!dir) entry.source = new URL(url, 'https://www.casaargentera.com/').href;
    manifest.push(entry);
  }
  return `${MEDIA}${name}`;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const img = (url, alt) => `<p><img src="${media(url)}" alt="${esc(alt)}"></p>`;
const row = (...cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`;

const VEIL_WORDS = { 'rgba(221,153,51,0.5)': 'amber', 'rgba(221,179,110,0.5)': 'gold' };
const veilKey = src.veilBg ? src.veilBg.replace(/\s+/g, '') : null;
const veil = veilOpt || (veilKey ? VEIL_WORDS[veilKey] || veilKey : 'amber');
const leaf = (href) => new URL(href, 'https://www.casaargentera.com/').pathname
  .replace(/\/+$/, '') || '/';
const translations = translationsOpt || (src.alternates.length
  ? src.alternates.map(([h, href]) => `${h}=${leaf(href)}`).join(', ') : null);

// ---- section 1: hero
const { hero, items } = src;
const slides = hero.slides.filter((s) => s.url);
let s1 = '';
if (slides.length) {
  const rows = slides.map((s) => {
    const cells = [img(s.url, s.alt)];
    if (s.layers.length) cells.push(s.layers.map((l) => `<p>${esc(l)}</p>`).join(''));
    return row(...cells);
  }).join('');
  const start = Math.min(hero.active, slides.length);
  const dur = slides.length > 1 && hero.duration
    ? `<div class="section-metadata">${row('duration', hero.duration)}</div>` : '';
  const variant = start > 1 ? ` start-${start}` : '';
  s1 = `<div><div class="hero-slider${variant}">${rows}</div>${dur}</div>`;
}

// ---- calendar block rows
const iso = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
const minusDay = (d) => {
  const x = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8) - 1));
  return x.toISOString().slice(0, 10);
};
function calendarBlock(it) {
  const c = it.cal;
  const rows = [];
  if (c.label) rows.push(row('label', esc(c.label)));
  if (c.today) rows.push(row('today', iso(c.today)));
  rows.push(row('weekdays', esc(c.weekdays.join(', '))));
  if (c.allDay) rows.push(row('all day', esc(c.allDay)));
  if (c.noEvents) rows.push(row('no events', esc(c.noEvents)));
  rows.push(row('day label', esc(c.format)));
  if (c.names.l) rows.push(row('day names', esc(c.names.l.join(', '))));
  if (c.names.F) {
    if (c.names.F.some((n) => !n)) {
      console.warn(`warn: month names incomplete (${c.names.F.join(', ')})`);
    }
    rows.push(row('month names', esc(c.names.F.join(', '))));
  }
  c.months.forEach(([ym, label]) => {
    rows.push(row(`${ym.slice(0, 4)}-${ym.slice(4, 6)}`, esc(label)));
  });
  c.events.forEach((e) => {
    const end = minusDay(e.endExcl);
    const range = end === iso(e.start) ? end : `${iso(e.start)} – ${end}`;
    rows.push(row(range, esc(e.title)));
  });
  it.side.forEach((parts) => {
    rows.push(row(parts.map((p) => `<${p.tag}>${p.html}</${p.tag}>`).join('')));
  });
  // tail-1: the source's empty row after the calendar row (1px column min-height)
  const tail = items[items.indexOf(it) + 1];
  const cls = tail && tail.kind === 'empty'
    ? 'availability-calendar tail-1' : 'availability-calendar';
  return `<div class="${cls}">${rows.join('')}</div>`;
}

// ---- section 2: body modules in source order
let h1Done = items.some((i) => i.kind === 'text' && i.tag === 'h1');
const out = [];
items.forEach((g) => {
  if (g.kind === 'text') {
    let { tag } = g;
    if (!h1Done && /^h[2-6]$/.test(tag)) {
      tag = 'h1'; // R-07: the page's first heading is its h1, painted as the source heading
      h1Done = true;
    }
    out.push(`<${tag}>${g.html}</${tag}>`);
  } else if (g.kind === 'image') {
    out.push(img(g.src, g.alt));
  } else if (g.kind === 'form') {
    const rows = g.fields.map((f) => (f.note
      ? row(`<p>${f.note}</p>`)
      : row(
        `<p>${f.word === 'submit' ? esc(f.label) : f.label}</p>`,
        `<p>${f.word}</p>`,
      ))).join('');
    out.push(`<div class="contact-form">${rows}</div>`);
  } else if (g.kind === 'calendar') {
    out.push(calendarBlock(g));
  }
});
const s2 = `<div>${out.join('')}</div>`;

// ---- section 3: metadata
const ogImage = meta.og && meta.og.image;
const mrows = [
  row('Title', esc(meta.title)),
  row('Description', esc(meta.description || '')),
];
if (ogImage) mrows.push(row('Image', img(ogImage, '')));
if (veil) mrows.push(row('header-veil', veil));
if (translations) mrows.push(row('translations', esc(translations)));
const s3 = `<div><div class="metadata">${mrows.join('')}</div></div>`;

const html = `<body><header></header><main>${s1}${s2}${s3}</main><footer></footer></body>\n`;
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html);
mkdirSync(dirname(manifestFile), { recursive: true });
writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 1)}\n`);
const counts = items.reduce((a, it) => ({ ...a, [it.kind]: (a[it.kind] || 0) + 1 }), {});
const cal = items.find((i) => i.kind === 'calendar');
const spacers = items.filter((i) => i.kind !== 'empty')
  .map((i) => `${i.kind}:${i.spaceAfter || 0}`).join(' ');
console.log(`encoded ${slug} → ${outFile}  (hero ${slides.length} slides, `
  + `${JSON.stringify(counts)}`
  + `${cal ? `, calendar ${cal.cal.months.length} months ${cal.cal.events.length} events`
    + ` side ${cal.side.length}` : ''}`
  + `; spacers ${spacers}; media ${manifest.length} → ${manifestFile})`);
