#!/usr/bin/env node
// Path A' structural clone for the `booking` template (archetype reservations-2): fork
// stardust/prototypes/reservations-2-proposed.html (canon chrome, head, hero shell,
// reservations-2.css/.js) and rebuild #content from <slug>'s verbatim capture
// (stardust/current/pages/<slug>.{html,json}), walking the WPBakery rows in document order with the
// prototype's own section vocabulary — the same walk as encode-booking.mjs:
//   row with the Contact Form 7      → section.vc-row.booking-enquiry > .vc-col (heading text column,
//                                      spacers .space-<n>, .cf7 — the prototype's clean form: hidden
//                                      fields, recaptcha token and screen-reader residue dropped;
//                                      labels, notes, names verbatim)
//   next full-width text row         → section.vc-row.booking-note (ca-reserves' extra paragraph
//                                      stays in its text column)
//   row with the ICS calendar        → section.vc-row.booking-availability: left .avail-calendar
//                                      (static snapshot of the captured months — dynamic-features
//                                      row 10; localized select label, weekday heads, day labels,
//                                      all-day / no-events strings verbatim; the event hover block
//                                      keeps date + title only: reservation URLs, descriptions and
//                                      guest phone fragments are NOT carried — register R-01),
//                                      right .price-column with one .text-column per source column
//   empty row                        → div.vc-row > .vc-col (the archetype's trailing 1px row; absent
//                                      on ca-reserves, so not emitted there)
// Hero: Revolution Slider slides (bg image + alt from the lazyload comment), active slide, duration;
// bullets only when the page rotates (2+ slides).
// Chrome: the archetype's (canon, verbatim); the reservations active trail (class act +
// aria-current) moves to the sibling's own nav item when the canon nav links to it; veil set when
// it differs from the archetype's amber.
// Content verbatim; dropped empty nodes are written to <out>.deviations.json.
// usage: node stardust/encoders/build-clone-booking.mjs <slug> <out.html>
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, existsSync, readdirSync,
} from 'node:fs';

const [slug, outFile] = process.argv.slice(2);
if (!slug || !outFile || slug === '--help') {
  console.error('usage: build-clone-booking.mjs <slug> <out.html>');
  process.exit(2);
}
const proto = readFileSync('stardust/prototypes/reservations-2-proposed.html', 'utf8');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));
const local = [...new Set(['stardust/prototypes/assets', 'stardust/migrated/assets']
  .filter(existsSync).flatMap((d) => readdirSync(d)))];

const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage();
await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const isBlank = (html) => html.replace(/&nbsp;| |<br\s*\/?>|<!--[\s\S]*?-->|\s/g, '') === '';
  const abs = (u) => (u ? new URL(u, 'https://www.casaargentera.com/').href : u);
  const dropped = [];
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  // verbatim text node: source tag + inner HTML; presentation attributes dropped, inline markup kept
  const strip = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('noscript, script, style').forEach((n) => n.remove());
    [c, ...c.querySelectorAll('*')].forEach((n) => {
      if (n.tagName === 'A') { n.removeAttribute('target'); n.removeAttribute('rel'); }
      [...n.attributes].filter((a) => /^(class|style|id|dir|data-.*|decoding)$/.test(a.name))
        .forEach((a) => n.removeAttribute(a.name));
    });
    return c.outerHTML;
  };
  const textItems = (el) => {
    const out = [];
    const inner = el.querySelector('.wpb_wrapper') || el;
    [...inner.children].forEach((c) => {
      if (!c.matches('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote')) {
        if (!c.matches('style, script, noscript')) dropped.push({ kind: 'drop-unknown', source: c.outerHTML.slice(0, 160), target: '(none)', reason: 'non-text node in a text column' });
        return;
      }
      const h = c.innerHTML;
      if (isBlank(h) || /^<span id="more-\d+"><\/span>$/.test(h.trim())) {
        dropped.push({ kind: 'drop-empty', source: c.outerHTML.slice(0, 160), target: '(none)', reason: 'empty node (no text, no image)' });
        return;
      }
      out.push(strip(c));
    });
    return out.length ? [{ kind: 'text', parts: out }] : [];
  };
  // day label / hover date: the data-date-format spans become plain spans, separators verbatim
  const dateSpans = (el) => [...el.childNodes].map((n) => (n.nodeType === 1
    ? `<span>${esc(n.textContent)}</span>` : esc(n.textContent))).join('');
  // ICS Calendar (r34ics) → the prototype's .avail-calendar (static snapshot)
  const calendarItem = (root) => {
    const ymd = (id) => (id.match(/(\d{8})$/) || [])[1];
    const sel = root.querySelector('select');
    const label = t(root.querySelector('label'));
    const opts = [...sel.querySelectorAll('option')].map((o) => `<option value="${o.value}"${o.selected || o.hasAttribute('selected') ? ' selected' : ''}>${esc(t(o))}</option>`).join('');
    let html = `<div class="avail-calendar"><label class="screen-reader-text" for="avail-month">${esc(label)}</label><select class="avail-calendar__select" id="avail-month" aria-label="${esc(sel.getAttribute('aria-label') || label)}" autocomplete="off" data-this-month="${sel.getAttribute('data-this-month')}">${opts}</select>\n`;
    let events = 0;
    root.querySelectorAll('article.ics-calendar-month-wrapper').forEach((art) => {
      const ym = art.getAttribute('data-year-month');
      const past = art.classList.contains('past');
      const thisM = art.getAttribute('data-is-this-month') === '1';
      const hidden = /display:\s*none/.test(art.getAttribute('style') || '');
      const heads = [...art.querySelectorAll('thead th')].map((th) => `<th>${esc(t(th))}</th>`).join('');
      const rows = [...art.querySelectorAll('tbody tr')].map((tr) => `<tr>${[...tr.children].map((td) => {
        if (td.classList.contains('off')) return '<td class="off"></td>';
        const cls = [...td.classList].filter((c) => !/^dow_/.test(c))
          .map((c) => c.replace(/_/g, '-')).join(' ');
        const ph = td.querySelector('.phone_only[id]');
        const d = ymd(ph.id);
        const np = t(td.querySelector('.no_phone'));
        let cell = `<td class="${cls}"><div class="day"><span class="phone-only" id="avail-${d}">${dateSpans(ph)}</span> <span class="no-phone" aria-hidden="true">${esc(np)}</span></div>`;
        const lis = [...td.querySelectorAll('ul.events > li.event')];
        if (lis.length) {
          cell += `<ul class="events" aria-labelledby="avail-${d}">${lis.map((li) => {
            events += 1;
            const lc = ['event', ...[...li.classList].filter((c) => c !== 'event' && !/^d\d{8}_\d{8}$/.test(c))
              .map((c) => c.replace(/_/g, '-'))].join(' ');
            const ti = li.querySelector(':scope > .title');
            const desc = ti && ti.classList.contains('has_desc');
            let h = '';
            const ad = li.querySelector('.all-day-indicator');
            if (ad) h += `<span class="all-day-indicator">${esc(t(ad))}</span> `;
            h += `<span class="title${desc ? ' has-desc" tabindex="0' : ''}">${esc(t(ti))}</span>`;
            const hb = li.querySelector('.hover_block');
            if (hb) {
              const dh = hb.querySelector('.date_in_hover_block');
              const date = dh ? [...dh.children].map((s) => `<span class="${s.className}">${s.classList.contains('multiday-sep') ? esc(s.textContent) : dateSpans(s)}</span>`).join('') : '';
              h += `<div class="hover-block">${dh ? `<div class="hover-block__date">${date}</div>` : ''}<div class="hover-block__title">${esc(t(hb.querySelector('.title_in_hover_block')))}</div></div>`;
              if (hb.querySelector('.eventdesc')) dropped.push({ kind: 'drop-guest-data', source: `event ${d} description`, target: '(none)', reason: 'R-01: reservation URL / guest phone fragment not carried' });
            }
            return `<li class="${lc}">${h}</li>`;
          }).join('')}</ul>`;
        }
        return `${cell}</td>`;
      }).join('')}</tr>`).join('\n');
      const ne = art.querySelector('.no_events');
      html += `<article class="avail-calendar__month${past ? ' past' : ''}" data-year-month="${ym}"${thisM ? ' data-is-this-month="1"' : ''}${hidden ? ' hidden' : ''}><h3 class="avail-calendar__label" id="avail-${ym}">${esc(t(art.querySelector('.ics-calendar-label')))}</h3><table class="avail-calendar__grid" aria-labelledby="avail-${ym}"><thead><tr>${heads}</tr></thead><tbody>\n${rows}\n</tbody></table>${ne ? `<p class="phone-only no-events">${esc(t(ne))}</p>` : ''}</article>\n`;
    });
    html += '</div>';
    return { kind: 'calendar', html, events, months: sel.querySelectorAll('option').length };
  };
  // Contact Form 7 → the prototype's clean form (classes mapped, WP residue dropped)
  const CLS = {
    'wpcf7-form-control-wrap': 'cf7-wrap',
    'wpcf7-acceptance': 'cf7-acceptance',
    'wpcf7-list-item': 'cf7-list-item',
    'wpcf7-list-item-label': 'cf7-list-item-label',
    'wpcf7-spinner': 'cf7-spinner',
    'wpcf7-response-output': 'cf7-response',
  };
  const AUTO = { 'your-name': 'name', 'your-email': 'email' };
  const formItem = (el) => {
    const f = el.querySelector('form');
    const c = f.cloneNode(true);
    c.querySelectorAll('fieldset.hidden-fields-container, input[type=hidden], .screen-reader-response, noscript, script, style')
      .forEach((n) => n.remove());
    c.querySelectorAll('*').forEach((n) => {
      const cls = [...n.classList];
      const keepAttrs = {};
      if (n.matches('input, textarea, select')) {
        const type = n.tagName === 'TEXTAREA' ? 'textarea' : n.getAttribute('type');
        keepAttrs.class = type === 'submit' ? 'cf7-submit' : type === 'textarea' ? 'cf7-field cf7-textarea' : type === 'checkbox' ? null : 'cf7-field';
        ['name', 'type', 'value', 'size', 'rows', 'cols'].forEach((a) => { if (n.hasAttribute(a)) keepAttrs[a] = n.getAttribute(a); });
        if (type === 'checkbox') delete keepAttrs.size;
        const name = n.getAttribute('name') || '';
        const auto = AUTO[name] || (type === 'tel' ? 'tel' : type === 'email' ? 'email' : null);
        if (auto) keepAttrs.autocomplete = auto;
        if (n.getAttribute('aria-required')) keepAttrs['aria-required'] = n.getAttribute('aria-required');
      } else if (n.tagName === 'A') {
        keepAttrs.href = abs(n.getAttribute('href'));
        if (n.getAttribute('target')) keepAttrs.target = n.getAttribute('target');
      } else {
        const mapped = cls.map((x) => CLS[x]).filter(Boolean);
        if (mapped.length) keepAttrs.class = mapped[0];
        if (mapped[0] === 'cf7-spinner') keepAttrs['aria-hidden'] = 'true';
        if (mapped[0] === 'cf7-response') keepAttrs['aria-live'] = 'polite';
      }
      [...n.attributes].forEach((a) => n.removeAttribute(a.name));
      Object.entries(keepAttrs).forEach(([k, v]) => { if (v != null) n.setAttribute(k, v); });
    });
    // the acceptance control wrapper: span.cf7-wrap > span.cf7-acceptance (the wpcf7-form-control
    // span carried both classes; the first mapped one wins above — fix the inner span)
    c.querySelectorAll('.cf7-wrap > span:not([class])').forEach((s) => {
      if (s.querySelector('.cf7-list-item')) s.setAttribute('class', 'cf7-acceptance');
    });
    return {
      kind: 'form',
      id: el.getAttribute('id') || '',
      label: f.getAttribute('aria-label') || 'Contact form',
      action: abs(f.getAttribute('action') || ''),
      html: c.innerHTML,
    };
  };

  const sel = '.wpb_text_column, .wpcf7, .ics-calendar, .vc_empty_space';
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  const rows = [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'))
    .map((row) => [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row)
      .map((col) => {
        const items = [];
        const found = [];
        const collect = (node) => {
          [...node.children].forEach((n) => {
            if (n.matches(sel)) found.push(n);
            else if (n.matches('.wpb_content_element, .wpb_single_image') && !n.querySelector(sel)) {
              dropped.push({ kind: 'drop-unknown', source: n.className.slice(0, 80), target: '(none)', reason: 'module outside the booking template' });
            } else if (!n.matches('style, script')) collect(n);
          });
        };
        collect(col);
        found.forEach((el) => {
          if (el.matches('.vc_empty_space')) items.push({ kind: 'space', h: spacerH(el) });
          else if (el.matches('.wpb_text_column')) items.push(...textItems(el));
          else if (el.matches('.ics-calendar')) items.push(calendarItem(el));
          else if (el.matches('.wpcf7')) items.push(formItem(el));
        });
        return { width: +((col.className.match(/vc_col-sm-(\d+)/) || [])[1] || 12), items };
      }));

  const mod = document.querySelector('rs-module');
  const hero = { slides: [], active: 1, duration: null };
  if (mod) {
    [...mod.querySelectorAll('rs-slide')].forEach((s, i) => {
      const bg = s.querySelector('rs-sbg');
      const url = bg && (bg.getAttribute('data-lazyload') || bg.getAttribute('data-src-rs-ref'));
      const comment = [...(s.querySelector('rs-sbg-wrap')?.childNodes || [])]
        .find((n) => n.nodeType === Node.COMMENT_NODE);
      const alt = comment ? (comment.textContent.match(/alt="([^"]*)"/) || [])[1] || '' : '';
      const dim = (k) => bg?.getAttribute(`data-o${k}`)
        || (comment ? (comment.textContent.match(new RegExp(`${k}="(\\d+)"`)) || [])[1] : null);
      hero.slides.push({
        key: s.getAttribute('data-key'), url: abs(url), alt, w: dim('width'), h: dim('height'),
      });
      if (s.getAttribute('data-key') === mod.getAttribute('data-slideactive')) hero.active = i + 1;
      if (!hero.duration) hero.duration = s.getAttribute('data-duration');
    });
  }
  const banner = document.querySelector('.masthead[role=banner], header[role=banner]');
  const veil = banner ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim() : null;
  return {
    lang: document.documentElement.lang, hero, rows, dropped, veil,
  };
});

const pp = await ctx.newPage();
await pp.route('**/*', (r) => r.abort());
await pp.setContent(proto, { waitUntil: 'domcontentloaded' });
const html = await pp.evaluate(({
  src, meta, local, url,
}) => {
  const d = document;
  const q = (s, r = d) => r.querySelector(s);
  const fail = (m) => { throw new Error(m); };
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const loc = (u) => {
    const f = decodeURIComponent(new URL(u).pathname.split('/').pop());
    return local.includes(f) ? `assets/${f}` : u;
  };
  d.documentElement.lang = src.lang;
  d.title = meta.title;
  const setMeta = (s, v) => { const m = q(s); if (m && v) m.setAttribute('content', v); };
  setMeta('meta[name="description"]', meta.description);
  setMeta('meta[property="og:description"]', meta.og?.description || meta.description);
  setMeta('meta[property="og:title"]', meta.og?.title || meta.title);
  setMeta('meta[property="og:image"]', meta.og?.image);

  // ---- chrome: active trail (class + aria-current) follows this page; per-page masthead veil
  d.querySelectorAll('li.act').forEach((li) => li.classList.remove('act'));
  d.querySelectorAll('nav:not(.lang-switcher) a[aria-current="page"]').forEach((a) => a.removeAttribute('aria-current'));
  const norm = (h) => { try { return new URL(h, 'https://www.casaargentera.com/').href.replace(/\/?$/, '/'); } catch { return h; } };
  d.querySelectorAll('nav:not(.lang-switcher) li > a').forEach((a) => {
    if (norm(a.getAttribute('href')) !== norm(url)) return;
    a.setAttribute('aria-current', 'page');
    for (let li = a.parentElement; li; li = li.parentElement.closest('li')) li.classList.add('act');
  });
  const BOOKING_VEIL = 'rgba(221,153,51,0.5)';
  if (src.veil && src.veil.replace(/\s+/g, '') !== BOOKING_VEIL) q('.masthead').style.setProperty('--ca-header-veil', src.veil);

  // ---- hero
  const hs = q('#main-slideshow');
  if (!hs) fail('prototype hero missing');
  const slides = src.hero.slides.filter((s) => s.url);
  if (!slides.length) fail('capture has no hero slides');
  q('.hero-slider__slides', hs).innerHTML = `\n${slides.map((s, i) => {
    const on = i + 1 === src.hero.active;
    return `<div class="hero-slide${on ? ' is-active' : ''}" data-key="${esc(s.key)}">\n<img class="hero-slide__bg" src="${esc(loc(s.url))}"${s.w ? ` width="${esc(s.w)}"` : ''}${s.h ? ` height="${esc(s.h)}"` : ''} alt="${esc(s.alt)}"${on ? ' fetchpriority="high"' : ' loading="lazy"'}>\n</div>`;
  }).join('\n')}\n`;
  q('.hero-slider__bullets', hs)?.remove();
  if (slides.length > 1) {
    hs.setAttribute('aria-roledescription', 'carousel');
    hs.setAttribute('data-duration', src.hero.duration || '3000');
    hs.insertAdjacentHTML('beforeend', `<div class="hero-slider__bullets">${slides.map((s, i) => `<button type="button" class="hero-bullet${i + 1 === src.hero.active ? ' selected' : ''}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>`);
  }

  // ---- #content
  const KNOWN = new Set([20, 25, 30, 32, 50]);
  const space = (h) => `<div class="space-${h}"${KNOWN.has(h) ? '' : ` style="height: ${h}px"`}></div>`;
  const frac = (w) => (w === 6 ? ' vc-col--1-2' : w === 4 ? ' vc-col--1-3' : w === 12 ? '' : ` vc-col--${w}-12`);
  const formHtml = (it) => `<div class="cf7" id="${esc(it.id)}"><form class="cf7-form" aria-label="${esc(it.label)}" action="${esc(it.action)}" method="post" novalidate>${it.html}</form></div>`;
  const items = (list) => list.map((it) => {
    if (it.kind === 'text') return `<div class="text-column">${it.parts.join('')}</div>`;
    if (it.kind === 'space') return space(it.h);
    if (it.kind === 'calendar') return it.html;
    if (it.kind === 'form') return formHtml(it);
    return '';
  }).join('');
  let noteDone = false;
  const out = src.rows.map((cols) => {
    const kinds = new Set(cols.flatMap((c) => c.items.map((i) => i.kind)));
    const col = (c, extra = '') => `<div class="vc-col${frac(c.width)}${extra}">${items(c.items)}</div>`;
    if (kinds.has('form')) return `<section class="vc-row booking-enquiry">${cols.map((c) => col(c)).join('')}</section>`;
    if (kinds.has('calendar')) {
      return `<section class="vc-row booking-availability">${cols.map((c) => col(c, c.items.some((i) => i.kind === 'calendar') ? '' : ' price-column')).join('')}</section>`;
    }
    if (cols.length === 1 && !noteDone && kinds.has('text')) {
      noteDone = true;
      return `<section class="vc-row booking-note">${col(cols[0])}</section>`;
    }
    return `<div class="vc-row">${cols.map((c) => col(c)).join('')}</div>`;
  });
  q('#content').innerHTML = `\n${out.join('\n')}\n`;
  return `<!DOCTYPE html>\n${d.documentElement.outerHTML}\n`;
}, {
  src, meta, local, url: meta.url || '',
});
// boolean attributes as the prototype writes them (outerHTML serialises them as `x=""`)
const out = html.replace(/^(<html[^>]*>)<head>/m, '$1\n<head>')
  .replace(/\n*<\/body><\/html>\n$/, '\n</body>\n</html>\n')
  .replace(/ (inert|novalidate|selected|hidden|defer|async|disabled|checked|required|readonly|multiple|open)=""/g, ' $1');
writeFileSync(outFile, out);
writeFileSync(`${outFile.replace(/\.html$/, '')}.deviations.json`, `${JSON.stringify(src.dropped, null, 2)}\n`);
const all = src.rows.flat().flatMap((c) => c.items);
const n = (k) => all.filter((i) => i.kind === k).length;
const cal = all.find((i) => i.kind === 'calendar');
console.log(`clone ${slug} → ${outFile} (${out.length} bytes; rows ${src.rows.length}, slides ${src.hero.slides.length}, text ${n('text')}, forms ${n('form')}, calendars ${n('calendar')}${cal ? ` (${cal.months} months, ${cal.events} event items)` : ''}, spaces ${n('space')}, veil ${src.veil}, dropped ${src.dropped.length})`);
await b.close();
