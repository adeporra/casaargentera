/*
 * Footer — The7 #footer replica (stardust/prototypes/canon.css): solid amber, 3-up widgets.
 *
 * Authored footer document (/footer, /<locale>/footer), one section per widget, in order:
 *   contact   — p title, p address lines
 *   search    — p title, p label ("Search:"), p placeholder, p submit value (no links)
 *   follow    — p title, p assistive text ("Find us on:"), ul of social links
 *   rentals   — p title, p lines
 *   legal     — p title, p link + ©
 *   languages — p label ("Choose a language"), ul of the four languages (locale homes)
 * The language switcher links each page to its translations (`translations` metadata,
 * scripts/locale.js); a language without one keeps its locale home (Polylang).
 * The search widget searches /query-index.json (title, description, page text) and renders
 * results inside the widget.
 *
 * @ew-exempt search placeholder, submit value and the language-switcher aria-label are
 *   attributes read from authored text.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  getHtmlLang,
  getLocale,
  getLocalePrefix,
  getTranslations,
  normalizePath,
} from '../../scripts/locale.js';

const SEARCH_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.7,10.3c2.1-2.9,1.5-7'
  + '-1.4-9.1s-7-1.5-9.1,1.4s-1.5,7,1.4,9.1c2.3,1.7,5.4,1.7,7.7,0h0c0,0,0.1,0.1,0.1,0.1l3.8,3.8c0.'
  + '4,0.4,1,0.4,1.4,0s0.4-1,0-1.4l-3.8-3.9C11.8,10.4,11.8,10.4,11.7,10.3L11.7,10.3z M12,6.5c0,3-2'
  + '.5,5.5-5.5,5.5S1,9.5,1,6.5S3.5,1,6.5,1S12,3.5,12,6.5z"></path></svg>';
const NOTHING_FOUND = {
  en: 'Nothing found',
  da: 'Intet fundet',
  ca: 'No s’ha trobat res',
  es: 'No se ha encontrado nada',
};

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

function itemLink(li) {
  const p = li.querySelector(':scope > p');
  if (p) p.replaceWith(...p.childNodes);
  return li.querySelector(':scope > a');
}

function titled(widget, p) {
  if (!p) return;
  const title = el('div', 'widget-title');
  title.append(p);
  widget.prepend(title);
}

function buildSocial(wrapper) {
  const [titleP, assistP] = wrapper.querySelectorAll(':scope > p');
  const ul = wrapper.querySelector(':scope > ul');
  const soc = el('div', 'soc-ico');
  if (assistP) {
    assistP.className = 'assistive-text';
    soc.append(assistP);
  }
  [...(ul?.children || [])].forEach((li) => {
    const a = itemLink(li);
    if (!a) return;
    const net = /instagram/i.test(a.href) ? 'instagram' : 'facebook';
    const label = el('span', 'screen-reader-text');
    label.append(...a.childNodes);
    a.className = net;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = label.textContent.trim();
    a.append(el('span', `ca-icon ca-icon-${net}`, { 'aria-hidden': 'true' }), label);
    soc.append(a);
  });
  ul?.remove();
  const widget = el('section', 'widget');
  widget.append(soc);
  titled(widget, titleP);
  return widget;
}

function renderResults(form, items, locale) {
  let list = form.parentElement.querySelector('.search-results');
  if (!list) {
    list = el('ul', 'search-results', { 'aria-live': 'polite' });
    form.after(list);
  }
  list.textContent = '';
  if (!items.length) {
    const li = el('li', 'search-results__empty');
    li.textContent = NOTHING_FOUND[locale] || NOTHING_FOUND.en;
    list.append(li);
    return;
  }
  items.forEach((item) => {
    const li = el('li');
    const a = el('a', '', { href: item.path });
    // the source lists the page title without the site suffix
    a.textContent = (item.title || item.path).replace(/\s+-\s+Casa Argentera$/, '');
    li.append(a);
    list.append(li);
  });
}

async function search(form, query, locale) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return;
  let rows = [];
  try {
    const resp = await fetch('/query-index.json');
    if (resp.ok) rows = (await resp.json()).data || [];
  } catch (e) {
    rows = [];
  }
  const hits = rows.filter((row) => {
    if (!row.path || getLocale(row.path) !== locale) return false;
    const hay = `${row.title || ''} ${row.description || ''} ${row.text || ''}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  }).slice(0, 10);
  renderResults(form, hits, locale);
}

function buildSearch(wrapper, locale) {
  const [titleP, labelP, placeholderP, submitP] = wrapper.querySelectorAll(':scope > p');
  const form = el('form', 'searchform', {
    role: 'search',
    method: 'get',
    action: `${getLocalePrefix(locale)}/`,
  });
  const label = el('label', 'screen-reader-text', { for: 'the7-search' });
  if (labelP) label.append(...labelP.childNodes);
  const field = el('input', 'field', {
    type: 'text',
    id: 'the7-search',
    name: 's',
    value: '',
    placeholder: placeholderP ? placeholderP.textContent.trim() : '',
  });
  const go = el('input', 'assistive-text', {
    type: 'submit',
    value: submitP ? submitP.textContent.trim() : 'Go!',
  });
  const button = el('button', 'submit', { type: 'submit', 'aria-label': 'Search' });
  button.innerHTML = SEARCH_SVG;
  form.append(label, field, go, button);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search(form, field.value, locale);
  });
  [labelP, placeholderP, submitP].forEach((p) => p?.remove());
  const widget = el('section', 'widget');
  widget.append(form);
  titled(widget, titleP);
  // a source search URL (`?s=<term>`, the form's own GET) opens with its results
  const query = new URLSearchParams(window.location.search).get('s');
  if (query) {
    field.value = query;
    search(form, query, locale);
  }
  return widget;
}

function buildLanguages(wrapper, locale) {
  const labelP = wrapper.querySelector(':scope > p');
  const ul = wrapper.querySelector(':scope > ul');
  const translations = getTranslations();
  const nav = el('nav', 'lang-switcher');
  if (labelP) {
    // the source carries the label only as aria-label (no text node)
    nav.setAttribute('aria-label', labelP.textContent.trim());
    labelP.remove();
  }
  [...(ul?.children || [])].forEach((li) => {
    const a = itemLink(li);
    if (!a) return;
    const lang = getLocale(normalizePath(a.href));
    const span = el('span', 'pll-switcher-label');
    span.append(...a.childNodes);
    a.append(span);
    a.lang = getHtmlLang(lang);
    a.hreflang = getHtmlLang(lang);
    if (translations?.has(lang)) a.href = translations.get(lang);
    if (lang === locale) a.setAttribute('aria-current', 'true');
  });
  if (ul) nav.append(ul);
  const widget = el('section', 'widget');
  widget.append(nav);
  return widget;
}

function buildText(wrapper) {
  const widget = el('section', 'widget');
  widget.append(...wrapper.childNodes);
  titled(widget, widget.querySelector(':scope > p'));
  return widget;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const locale = getLocale();
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname
    : `${getLocalePrefix(locale)}/footer`;
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  const widgets = el('div', 'footer-widgets');
  fragment.querySelectorAll(':scope > .section > .default-content-wrapper').forEach((wrapper) => {
    const ul = wrapper.querySelector(':scope > ul');
    const links = ul ? [...ul.querySelectorAll('a')] : [];
    const isLang = new Set(links.map((a) => getLocale(new URL(a.href).pathname))).size >= 3;
    if (isLang) {
      widgets.append(buildLanguages(wrapper, locale));
    } else if (links.length) {
      widgets.append(buildSocial(wrapper));
    } else if (!wrapper.querySelector('a') && wrapper.querySelectorAll(':scope > p').length >= 3) {
      widgets.append(buildSearch(wrapper, locale));
    } else {
      widgets.append(buildText(wrapper));
    }
  });

  const wrap = el('div', 'wf-wrap');
  wrap.append(widgets);
  const site = el('div', 'site-footer');
  site.append(wrap);
  block.textContent = '';
  block.append(site);
}
