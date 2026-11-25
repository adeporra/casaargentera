#!/usr/bin/env node
// Path A' structural clone: fork stardust/prototypes/index-proposed.html, inject <slug>'s verbatim
// content from stardust/current/pages/<slug>.{html,json}. usage: build-clone.mjs <slug> <out.html>
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const [slug, outFile] = process.argv.slice(2);
const proto = readFileSync('stardust/prototypes/index-proposed.html', 'utf8')
  .replace('href="canon.css"', 'href="../../../../prototypes/canon.css"')
  .replace('href="index.css"', 'href="../../../../prototypes/index.css"')
  .replace('src="canon.js"', 'src="../../../../prototypes/canon.js"');
const cap = readFileSync(`stardust/current/pages/${slug}.html`, 'utf8');
const meta = JSON.parse(readFileSync(`stardust/current/pages/${slug}.json`, 'utf8'));
const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
const cp = await ctx.newPage(); await cp.route('**/*', (r) => r.abort());
await cp.setContent(cap, { waitUntil: 'domcontentloaded' });
const src = await cp.evaluate(() => {
  const t = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const rows = [...document.querySelectorAll('#content .vc_row')].filter((r) => !r.parentElement.closest('.vc_row'));
  const heads = (r) => [...r.querySelectorAll('h2,h3')].filter((h) => t(h)).map((h) => ({ text: t(h), html: (h.querySelector('a') || h).innerHTML.trim(), href: h.querySelector('a')?.getAttribute('href') || null }));
  const imgs = (r) => [...r.querySelectorAll('.wpb_single_image img')].map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), href: i.closest('a')?.getAttribute('href') || null }));
  return {
    lang: document.documentElement.lang,
    rows: rows.map((r) => ({
      heads: heads(r), imgs: imgs(r),
      paras: [...r.querySelectorAll('.wpb_text_column p')].map((p) => p.innerHTML.trim()).filter((h) => h.replace(/&nbsp;|\s/g, '') !== ''),
      testi: [...r.querySelectorAll('.testimonial-item')].filter((x) => !x.closest('.cloned')).map((x) => ({
        content: x.querySelector('.testimonial-content').innerHTML.trim(),
        name: x.querySelector('.testimonial-name span')?.innerHTML.trim() || t(x.querySelector('.testimonial-name')),
      })),
    })),
  };
});
const pp = await ctx.newPage(); await pp.route('**/*', (r) => r.abort());
await pp.setContent(proto, { waitUntil: 'domcontentloaded' });
const html = await pp.evaluate(({ src, meta }) => {
  const d = document; const q = (s, r = d) => r.querySelector(s); const qa = (s, r = d) => [...r.querySelectorAll(s)];
  const fail = (m) => { throw new Error(m); };
  d.documentElement.lang = src.lang;
  d.title = meta.title;
  const setMeta = (sel, v) => { const m = q(sel); if (m && v) m.setAttribute('content', v); };
  setMeta('meta[name="description"]', meta.description); setMeta('meta[property="og:description"]', meta.og?.description || meta.description);
  setMeta('meta[property="og:title"]', meta.og?.title || meta.title); setMeta('meta[property="og:image"]', meta.og?.image);
  const setHead = (h, s) => { const a = q('a', h); if (a && s.href) { a.innerHTML = s.html; a.setAttribute('href', s.href); } else h.innerHTML = s.html; };
  const main = q('#content'); const rows = [...main.children];
  if (rows.length !== 7 || src.rows.length !== 7) fail(`row count proto ${rows.length} src ${src.rows.length}`);
  // 0 intro
  const [intro, gkHead, house, testi, expHead, exp, loc] = rows; const [s0, s1, s2, s3, s4, s5, s6] = src.rows;
  q('h2', intro).textContent = s0.heads[0].text;
  const ip = qa('p', intro); const anchor = q('p.more-anchor', intro);
  ip.filter((p) => p !== anchor).forEach((p) => p.remove());
  const paras = s0.paras.filter((h) => !/^<span id="more-\d+"><\/span>$/.test(h));
  const keepAnchor = s0.paras.length !== paras.length;
  paras.forEach((h) => { const p = d.createElement('p'); p.innerHTML = h; anchor.before(p); });
  if (!keepAnchor) anchor.remove();
  // 1, 4 section headings
  setHead(q('h3', gkHead), s1.heads[0]); setHead(q('h3', expHead), s4.heads[0]);
  // 2 house grid: 4 cards
  const hh = qa('h3', house); const hf = qa('figure', house);
  if (hh.length !== s2.heads.length || hf.length !== s2.imgs.length) fail('house grid shape');
  hh.forEach((h, i) => setHead(h, s2.heads[i]));
  hf.forEach((f, i) => {
    const im = s2.imgs[i]; const img = q('img', f); const base = im.src.split('/').pop().replace(/\.jpg$/, '');
    const cur = img.getAttribute('src').split('/').pop();
    if (!cur.startsWith(base)) {
      img.setAttribute('src', `assets/${base}-1536x864.jpg`);
      img.setAttribute('srcset', `assets/${base}-1536x864.jpg 1536w, assets/${base}-768x432.jpg 768w`);
      img.setAttribute('sizes', '(max-width: 1920px) 100vw, 1920px'); img.setAttribute('width', '1536'); img.setAttribute('height', '864');
    }
    img.setAttribute('alt', im.alt); if (im.href) q('a', f).setAttribute('href', im.href);
  });
  // 3 testimonials
  setHead(q('h3', testi), s3.heads[0]);
  const arts = qa('article.testimonial-item', testi); const tpl = arts[0];
  arts.forEach((a) => a.remove());
  const track = q('.testimonials__track', testi);
  s3.testi.forEach((x) => { const a = tpl.cloneNode(true); q('.testimonial-content', a).innerHTML = x.content; q('.testimonial-name span', a).innerHTML = x.name; track.append(a); });
  // 5 experience grid
  const eh = qa('h3', exp); if (eh.length !== s5.heads.length) fail('exp shape');
  eh.forEach((h, i) => setHead(h, s5.heads[i]));
  const ef = qa('img', exp); if (ef.length !== s5.imgs.length) fail('exp imgs');
  ef.forEach((img, i) => { const base = s5.imgs[i].src.split('/').pop().replace(/\.jpg$/, ''); if (!img.getAttribute('src').includes(base)) fail(`exp img ${i} differs`); img.setAttribute('alt', s5.imgs[i].alt); });
  // 6 location
  setHead(q('h3', loc), s6.heads[0]);
  return '<!DOCTYPE html>\n' + d.documentElement.outerHTML + '\n';
}, { src, meta });
writeFileSync(outFile, html);
console.log(`clone ${slug} → ${outFile} (${html.length} bytes)`);
await b.close();
