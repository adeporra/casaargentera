#!/usr/bin/env node
// landing encoder for siblings: content/index.html (the archetype's proven authored shape) as the
// template; this page's verbatim slots from the hydrated capture stardust/current/pages/<slug>.html.
// usage: encode-landing.mjs <slug> <out.html>
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const [slug, outFile] = process.argv.slice(2);
const MEDIA = 'https://content.da.live/aemcoder/ea32f12a/media/home/';
const tpl = readFileSync('content/index.html', 'utf8');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));
const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage(); await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  // inline <span lang> wrappers carry no content; DA drops spans — unwrap, text unchanged
  const unspan = (html) => html; // inline <span lang> kept verbatim (content-diff pairs them)
  const rows = [...document.querySelectorAll('#content .vc_row')].filter((r) => !r.parentElement.closest('.vc_row'));
  const heads = (r) => [...r.querySelectorAll('h2,h3')].filter((h) => t(h)).map((h) => ({ html: unspan((h.querySelector('a') || h).innerHTML.trim()), href: h.querySelector('a')?.getAttribute('href') || null }));
  const imgs = (r) => [...r.querySelectorAll('.wpb_single_image img')].map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt') }));
  const layout4 = !!document.querySelector('.testimonials-carousel-shortcode.layout-4');
  return { layout4, rows: rows.map((r) => ({
    heads: heads(r), imgs: imgs(r),
    paras: [...r.querySelectorAll('.wpb_text_column p')].map((p) => unspan(p.innerHTML.trim())).filter((h) => h.replace(/&nbsp;|\s/g, '') !== '' && !/^<span id="more-\d+"><\/span>$/.test(h)),
    testi: [...r.querySelectorAll('.testimonial-item')].filter((x) => !x.closest('.cloned')).map((x) => ({
      content: [...x.querySelectorAll('.testimonial-content p')].map((p) => p.innerHTML.trim()),
      name: x.querySelector('.testimonial-name span')?.innerHTML.trim() || t(x.querySelector('.testimonial-name')),
    })),
  })) };
});
const pp = await ctx.newPage(); await pp.route('**/*', (r) => r.abort());
await pp.setContent(`<html><head></head>${tpl}</html>`, { waitUntil: 'domcontentloaded' });
const out = await pp.evaluate(({ rows, layout4, meta, MEDIA }) => {
  const d = document; const q = (s, r = d) => r.querySelector(s); const qa = (s, r = d) => [...r.querySelectorAll(s)];
  const fail = (m) => { throw new Error(m); };
  if (rows.length !== 7) fail(`capture rows ${rows.length}`);
  const [s0, s1, s2, s3, s4, s5, s6] = rows;
  const setHead = (h, s) => { const a = q('a', h); if (a && s.href) { a.innerHTML = s.html; a.setAttribute('href', s.href); } else h.innerHTML = s.html; };
  const sec = qa('main > div')[1];
  // intro: h1 + paragraphs (R-07 promotion inherited from the archetype)
  const h1 = q('h1', sec); h1.innerHTML = s0.heads[0].html;
  let p = h1.nextElementSibling; while (p && p.tagName === 'P') { const n = p.nextElementSibling; p.remove(); p = n; }
  let anchor = h1; s0.paras.forEach((html) => { const np = d.createElement('p'); np.innerHTML = html; anchor.after(np); anchor = np; });
  const sectionHeads = qa(':scope > h3', sec); if (sectionHeads.length !== 4) fail('section heads');
  setHead(sectionHeads[0], s1.heads[0]); setHead(sectionHeads[1], s3.heads[0]); setHead(sectionHeads[2], s4.heads[0]); setHead(sectionHeads[3], s6.heads[0]);
  // house grid
  const linked = q('.image-grid.linked', sec); const lh = qa('h3', linked); const li = qa('img', linked);
  if (lh.length !== s2.heads.length || li.length !== s2.imgs.length) fail('house grid');
  lh.forEach((h, i) => setHead(h, s2.heads[i]));
  li.forEach((img, i) => {
    const base = s2.imgs[i].src.split('/').pop().replace(/\.jpg$/, '');
    if (!img.getAttribute('src').split('/').pop().startsWith(base)) img.setAttribute('src', `${MEDIA}${base}-1536x864.jpg`);
    img.setAttribute('alt', s2.imgs[i].alt);
  });
  // testimonials: rows = quote / author
  const tb = q('.testimonials', sec); if (layout4) tb.classList.add('author-top'); /* source The7 layout-4 */ const trows = qa(':scope > div', tb); const tplRow = trows[0];
  trows.forEach((r) => r.remove());
  s3.testi.forEach((x) => {
    const r = tplRow.cloneNode(true); const [qc, ac] = qa(':scope > div', r);
    qc.innerHTML = x.content.map((h) => `<p>${h}</p>`).join(''); q('p', ac).innerHTML = x.name; tb.append(r);
  });
  // experience grid
  const st = q('.image-grid.stacked', sec); const sh = qa('h3', st); if (sh.length !== s5.heads.length) fail('exp');
  sh.forEach((h, i) => setHead(h, s5.heads[i]));
  const si = qa('img', st); if (si.length !== s5.imgs.length) fail('exp imgs');
  si.forEach((img, i) => { const base = s5.imgs[i].src.split('/').pop().replace(/\.jpg$/, ''); if (!img.getAttribute('src').includes(base)) fail(`exp img ${i}`); img.setAttribute('alt', s5.imgs[i].alt); });
  // metadata
  const md = q('.metadata'); const cell = (k) => qa(':scope > div', md).find((r) => r.firstElementChild.textContent.trim() === k)?.lastElementChild;
  cell('Title').textContent = meta.title; cell('Description').textContent = meta.description;
  return d.body.outerHTML;
}, { rows: src.rows, layout4: src.layout4, meta, MEDIA });
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${out}\n`);
console.log(`encoded ${slug} → ${outFile}`);
await b.close();
