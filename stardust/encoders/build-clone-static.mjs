#!/usr/bin/env node
// Path A' structural clone for the `static` template (archetype privacy-policy-and-cookies): fork
// stardust/prototypes/privacy-policy-and-cookies-proposed.html (canon chrome, head,
// privacy-policy-and-cookies.css) and rebuild #content from <slug>'s verbatim capture
// (stardust/current/pages/<slug>.{html,json}), walking the WPBakery rows → columns → modules in
// document order with the prototype's own vocabulary — the same walk as encode-static.mjs:
//   row holding text            → section.vc-row.legal-text (the archetype's section)
//   other rows                  → div.vc-row (an empty row keeps its 1px .vc-col, as the archetype)
//   column                      → .vc-col (+ width fraction when not full width)
//   wpb_text_column             → .text-column, children verbatim (h1–h6, p, ul, ol, blockquote),
//                                 empty lines (`<p>&nbsp;</p>`, empty h2s) KEPT — the archetype
//                                 prototype keeps them, they are the page's vertical rhythm
//   vc_empty_space              → div.space-<n> (canon class) or an inline height; source margin
//                                 measured 0 (ca-politica-de-privacidad-y-cookies, 1440 and 360:
//                                 64+64 → title at y 188 = 60 + 128)
//   bare text in a column       → the text node verbatim (raw `[ultimate_heading …]` on the
//                                 COVID-19 pages — R-02, replicated as captured)
// No heading is invented: the COVID-19 pages have none on the source (R-02 exception).
// Chrome: the archetype's (canon, verbatim); the masthead veil is set when it differs.
// Content verbatim; anything outside the template is written to <out>.deviations.json.
// usage: node stardust/encoders/build-clone-static.mjs <slug> <out.html>
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const [slug, outFile] = process.argv.slice(2);
if (!slug || !outFile || slug === '--help') {
  console.error('usage: build-clone-static.mjs <slug> <out.html>');
  process.exit(2);
}
const proto = readFileSync('stardust/prototypes/privacy-policy-and-cookies-proposed.html', 'utf8');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));

const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage();
await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const dropped = [];
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
    const inner = el.querySelector('.wpb_wrapper') || el;
    const html = [];
    [...inner.children].forEach((c) => {
      if (c.matches('style, script, noscript')) return;
      if (!c.matches('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote')) {
        dropped.push({ kind: 'drop-unknown', source: c.outerHTML.slice(0, 160), target: '(none)', reason: 'non-text node in a text column' });
        return;
      }
      html.push(strip(c));
    });
    return { kind: 'text', html };
  };
  const spacerH = (el) => parseInt((el.getAttribute('style') || '').match(/height:\s*(\d+)/)?.[1] || '0', 10);
  const rows = [...document.querySelectorAll('#content .vc_row')]
    .filter((r) => !r.parentElement.closest('.vc_row'))
    .map((row) => [...row.querySelectorAll('.wpb_column')].filter((c) => c.closest('.vc_row') === row)
      .map((col) => {
        const items = [];
        const walk = (node) => {
          [...node.childNodes].forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) {
              const t = n.textContent.trim();
              if (t) items.push({ kind: 'bare', text: t });
              return;
            }
            if (n.nodeType !== Node.ELEMENT_NODE || n.matches('style, script, noscript')) return;
            if (n.matches('.vc_empty_space')) items.push({ kind: 'space', h: spacerH(n) });
            else if (n.matches('.wpb_text_column')) items.push(textItems(n));
            else if (n.matches('.wpb_content_element, .wpb_single_image')) {
              dropped.push({ kind: 'drop-unknown', source: n.className.slice(0, 80), target: '(none)', reason: 'module outside the static template' });
            } else walk(n);
          });
        };
        walk(col);
        return { width: +((col.className.match(/vc_col-sm-(\d+)/) || [])[1] || 12), items };
      }));
  const banner = document.querySelector('.masthead[role=banner], header[role=banner]');
  const veil = banner ? (banner.getAttribute('style') || '').match(/background-color:\s*([^;]+)/)?.[1]?.trim() : null;
  return {
    lang: document.documentElement.lang, rows, dropped, veil,
  };
});

const pp = await ctx.newPage();
await pp.route('**/*', (r) => r.abort());
await pp.setContent(proto, { waitUntil: 'domcontentloaded' });
const html = await pp.evaluate(({ src, meta, url }) => {
  const d = document;
  const q = (s, r = d) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  d.documentElement.lang = src.lang;
  d.title = meta.title;
  const setMeta = (s, v) => { const m = q(s); if (m && v) m.setAttribute('content', v); };
  setMeta('meta[name="description"]', meta.description);
  setMeta('meta[property="og:description"]', meta.og?.description || meta.description);
  setMeta('meta[property="og:title"]', meta.og?.title || meta.title);
  setMeta('meta[property="og:image"]', meta.og?.image);

  // ---- chrome: active trail follows this page; per-page masthead veil
  d.querySelectorAll('li.act').forEach((li) => li.classList.remove('act'));
  const norm = (h) => { try { return new URL(h, 'https://www.casaargentera.com/').href.replace(/\/?$/, '/'); } catch { return h; } };
  d.querySelectorAll('nav:not(.lang-switcher) li > a').forEach((a) => {
    if (norm(a.getAttribute('href')) !== norm(url)) return;
    for (let li = a.parentElement; li; li = li.parentElement.closest('li')) li.classList.add('act');
  });
  const STATIC_VEIL = 'rgba(221,153,51,0.5)';
  if (src.veil && src.veil.replace(/\s+/g, '') !== STATIC_VEIL) q('.masthead').style.setProperty('--ca-header-veil', src.veil);

  // ---- #content
  const KNOWN = new Set([20, 30, 32, 50]);
  const space = (h) => `<div class="space-${h}"${KNOWN.has(h) ? '' : ` style="height: ${h}px"`}></div>`;
  const frac = (w) => (w === 6 ? ' vc-col--1-2' : w === 4 ? ' vc-col--1-3' : w === 12 ? '' : ` vc-col--${w}-12`);
  const item = (it) => {
    if (it.kind === 'space') return space(it.h);
    if (it.kind === 'bare') return esc(it.text);
    return `<div class="text-column">${it.html.join('\n')}</div>`;
  };
  const out = src.rows.map((cols) => {
    const hasText = cols.some((c) => c.items.some((i) => i.kind === 'text'));
    const inner = cols.map((c) => `<div class="vc-col${frac(c.width)}">\n${c.items.map(item).join('\n')}\n</div>`)
      .join('\n').replace(/>\n\n</g, '><');
    return hasText ? `<section class="vc-row legal-text">${inner}</section>` : `<div class="vc-row">${inner}</div>`;
  });
  q('#content').innerHTML = `\n${out.join('\n')}\n`;
  return `<!DOCTYPE html>\n${d.documentElement.outerHTML}\n`;
}, { src, meta, url: meta.url || '' });
writeFileSync(outFile, html);
writeFileSync(`${outFile.replace(/\.html$/, '')}.deviations.json`, `${JSON.stringify(src.dropped, null, 2)}\n`);
const all = src.rows.flat().flatMap((c) => c.items);
const n = (k) => all.filter((i) => i.kind === k).length;
const nodes = all.filter((i) => i.kind === 'text').reduce((s, i) => s + i.html.length, 0);
console.log(`clone ${slug} → ${outFile} (${html.length} bytes; rows ${src.rows.length}, text columns ${n('text')} / ${nodes} nodes, spaces ${n('space')} [${all.filter((i) => i.kind === 'space').map((i) => i.h).join('+')}], bare ${n('bare')}, veil ${src.veil}, dropped ${src.dropped.length})`);
await b.close();
