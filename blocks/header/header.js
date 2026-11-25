/*
 * Header — The7 masthead replica (stardust/prototypes/canon.css + canon.js, header contract
 * stardust/chrome/header-contract.json): translucent masthead over the hero (top bar +
 * header bar), #phantom floating header on scroll, mobile header + 330px right drawer,
 * floating menu button and scroll-top.
 *
 * Authored nav document (/nav, /<locale>/nav), default content in sections:
 *   1 brand    — desktop logo, mobile logo, a link (text = site title), a p (description)
 *   2 top bar  — p phone, p email, ul of the four languages linking their locale homes
 *   3 menu     — ul of top links, nested ul for sub-menus
 *   4 social   — ul of links (text = "… page opens in new window")
 * Page metadata: `header-veil` (amber | gold | rgb(…)), `translations` (scripts/locale.js).
 *
 * @ew-exempt chrome document: presentational clones (#phantom, drawer, mobile mini-widgets)
 *   are copies of the moved authored nodes, stripped of instrumentation.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  getLocale,
  getLocalePrefix,
  getTranslations,
  normalizePath,
} from '../../scripts/locale.js';

const SCROLL_THRESHOLD = 250;
const VEILS = {
  amber: 'var(--ca-header-veil-amber)',
  gold: 'rgb(221 179 110 / 50%)',
};
const SKIP_LABEL = { es: 'Saltar al contenido' };
const SCROLL_TOP_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.7,6.3l-3-3C8.5,'
  + '3.1,8.3,3,8,3c0,0,0,0,0,0C7.7,3,7.5,3.1,7.3,3.3l-3,3c-0.4,0.4-0.4,1,0,1.4c0.4,0.4,1,0.4,1.4,'
  + '0L7,6.4V12c0,0.6,0.4,1,1,1s1-0.4,1-1V6.4l1.3,1.3c0.4,0.4,1,0.4,1.4,0C11.9,7.5,12,7.3,12,7S11.'
  + '9,6.5,11.7,6.3z"></path></svg>';

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

/** Removes Experience Workspace instrumentation and ids from a presentational clone. */
function stripInstrumentation(root) {
  [root, ...root.querySelectorAll('*')].forEach((node) => {
    [...node.attributes].forEach(({ name }) => {
      if (name.startsWith('data-') || name === 'id') node.removeAttribute(name);
    });
  });
  return root;
}

function clean(node) {
  return stripInstrumentation(node.cloneNode(true));
}

/** Unwraps the `<p>` the pipeline puts around a list item's link (#98). */
function itemLink(li) {
  const p = li.querySelector(':scope > p');
  if (p) p.replaceWith(...p.childNodes);
  [...li.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE && !n.textContent.trim()) n.remove();
  });
  return li.querySelector(':scope > a');
}

/** Moves a link's authored text into the The7 `.menu-text` span. */
function wrapMenuText(a, outer) {
  const span = el('span', 'menu-text');
  span.append(...a.childNodes);
  if (outer) {
    const wrap = el('span', outer);
    wrap.append(span);
    a.append(wrap);
  } else {
    a.append(span);
  }
}

function langOf(href) {
  return getLocale(normalizePath(href));
}

/* ---------- builders ---------- */

function buildMainNav(ul, current) {
  ul.className = 'main-nav';
  [...ul.children].forEach((li) => {
    const a = itemLink(li);
    const sub = li.querySelector(':scope > ul');
    if (a) {
      wrapMenuText(a);
      a.append(el('i', 'underline'));
      if (normalizePath(a.href) === current) {
        li.classList.add('act');
        a.setAttribute('aria-current', 'page');
      }
    }
    if (sub) {
      li.classList.add('has-children');
      sub.className = 'sub-nav';
      [...sub.children].forEach((sli) => {
        const sa = itemLink(sli);
        if (!sa) return;
        wrapMenuText(sa);
        if (normalizePath(sa.href) === current) {
          sli.classList.add('act');
          li.classList.add('act');
          sa.setAttribute('aria-current', 'page');
        }
      });
    }
  });
  return ul;
}

function buildSocial(ul) {
  const wrap = el('div', 'soc-ico');
  if (!ul) return wrap;
  [...ul.children].forEach((li) => {
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
    wrap.append(a);
  });
  return wrap;
}

function buildTopMenu(ul, locale, translations) {
  ul.className = 'top-menu';
  [...ul.children].forEach((li) => {
    const a = itemLink(li);
    const lang = a ? langOf(a.href) : null;
    // Polylang top menu: the other languages, hidden when the page has no translation
    if (!a || lang === locale || (translations && !translations.has(lang))) {
      li.remove();
      return;
    }
    wrapMenuText(a, 'menu-item-text');
  });
  const nav = el('nav', 'mini-nav', { 'aria-label': 'Languages' });
  nav.append(ul);
  return nav;
}

function buildContacts(section) {
  const left = el('div', 'top-bar-left');
  section.querySelectorAll(':scope p').forEach((p) => {
    const kind = p.textContent.includes('@') ? 'email' : 'phone';
    const span = el('span', `mini-contacts ${kind}`);
    span.append(el('i', `ca-icon ca-icon-${kind === 'email' ? 'mail' : 'phone'}`, {
      'aria-hidden': 'true',
    }));
    span.append(...p.childNodes);
    p.remove();
    left.append(span);
  });
  return left;
}

function menuButton(floating) {
  const a = el('a', `dt-mobile-menu-icon${floating ? ' floating-btn' : ''}`, {
    href: '#',
    'aria-label': 'Mobile menu icon',
    'aria-controls': 'mobile-drawer',
    'aria-expanded': 'false',
  });
  const lines = el('span', 'lines-button');
  lines.append(el('span', 'menu-line'), el('span', 'menu-line'), el('span', 'menu-line'));
  a.append(lines);
  return a;
}

function buildDrawerNav(mainNav) {
  const ul = clean(mainNav);
  ul.className = 'mobile-main-nav';
  ul.querySelectorAll('.underline').forEach((u) => u.remove());
  ul.querySelectorAll(':scope > li.has-children > a').forEach((a) => {
    a.after(el('span', 'next-level-button', { 'aria-hidden': 'true' }));
    a.nextElementSibling.textContent = '+';
  });
  const nav = el('nav', '', { 'aria-label': 'Mobile' });
  nav.append(ul);
  return nav;
}

/* ---------- behaviour (canon.js state machine) ---------- */

function wireScroll(masthead, phantom, toTop) {
  const html = document.documentElement;
  let shown = false;
  const onScroll = () => {
    const y = window.scrollY || html.scrollTop;
    const past = y > SCROLL_THRESHOLD;
    if (past !== shown) {
      shown = past;
      phantom.classList.toggle('show-phantom', past);
      phantom.classList.toggle('hide-phantom', !past);
      phantom.inert = !past;
      masthead.classList.toggle('show-floating-icon', past);
      html.classList.toggle('show-floating-icon', past);
    }
    toTop.classList.toggle('on', past);
    toTop.classList.toggle('off', !past);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function wireDrawer(block, drawer, overlay) {
  const html = document.documentElement;
  const triggers = block.querySelectorAll('.dt-mobile-menu-icon');
  let opener = null;
  const setDrawer = (open, trigger) => {
    if (open === html.classList.contains('mobile-drawer-open')) return;
    html.classList.toggle('mobile-drawer-open', open);
    drawer.inert = !open;
    if (open) {
      drawer.setAttribute('tabindex', '-1');
      // the drawer is visibility:hidden until its transition starts — focus a frame later
      const focusDrawer = () => drawer.focus({ preventScroll: true });
      requestAnimationFrame(() => requestAnimationFrame(focusDrawer));
    }
    triggers.forEach((b) => b.setAttribute('aria-expanded', String(open)));
    if (open) {
      opener = trigger || null;
    } else if (opener) {
      opener.focus({ preventScroll: true });
      opener = null;
    }
  };
  triggers.forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    setDrawer(!html.classList.contains('mobile-drawer-open'), b);
  }));
  drawer.querySelector('.mobile-drawer-close').addEventListener('click', () => setDrawer(false));
  overlay.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setDrawer(false);
  });
}

function wireHover(root) {
  root.querySelectorAll('.main-nav > li').forEach((li) => {
    li.addEventListener('mouseenter', () => li.classList.add('dt-hovered'));
    li.addEventListener('mouseleave', () => li.classList.remove('dt-hovered'));
  });
}

function applyVeil(block) {
  const veil = (getMetadata('header-veil') || '').trim().toLowerCase();
  let value = VEILS[veil];
  if (!value && /^rgba?\([\d\s.,/%]+\)$/.test(veil)) value = veil;
  if (value) (block.closest('header') || block).style.setProperty('--ca-header-veil', value);
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const locale = getLocale();
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname
    : `${getLocalePrefix(locale)}/nav`;
  const fragment = await loadFragment(navPath);
  if (!fragment) return;
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const [brandSec, topSec, menuSec, socialSec] = sections;
  const current = normalizePath(window.location.pathname);
  const translations = getTranslations();

  // brand: logos + site title / description
  const pictures = brandSec ? [...brandSec.querySelectorAll('picture')] : [];
  const brandLink = brandSec?.querySelector('a') || el('a', '', { href: '/' });
  const title = el('div', 'screen-reader-text', { id: 'site-title' });
  title.append(...brandLink.childNodes);
  const desc = el('div', 'screen-reader-text', { id: 'site-description' });
  const descP = brandSec?.querySelector('p:not(:has(a, picture))');
  if (descP) desc.append(...descP.childNodes);
  [[pictures[0], 172, 136], [pictures[1], 75, 58]].forEach(([pic, w, h]) => {
    const img = pic?.querySelector('img');
    if (!img) return;
    // the logo ships in its own format (png / jpg), as on the source — no webp re-encode
    pic.querySelectorAll('source[type="image/webp"]').forEach((s) => s.remove());
    img.width = w;
    img.height = h;
    img.loading = 'eager';
  });
  const mobileLink = brandLink.cloneNode(false);
  if (pictures[0]) brandLink.append(pictures[0]);
  if (pictures[1]) mobileLink.append(pictures[1]);
  const branding = el('div', 'branding');
  branding.append(title, desc, brandLink);

  // top bar
  const topBar = el('div', 'top-bar');
  const contacts = topSec ? buildContacts(topSec) : el('div', 'top-bar-left');
  const langList = topSec?.querySelector('ul');
  topBar.append(contacts);
  if (langList) topBar.append(buildTopMenu(langList, locale, translations));

  // header bar
  const mainNav = buildMainNav(menuSec?.querySelector('ul') || el('ul'), current);
  const primary = el('nav', 'primary-nav', { 'aria-label': 'Main' });
  primary.append(mainNav);
  const social = buildSocial(socialSec?.querySelector('ul'));
  const headerBar = el('div', 'header-bar');
  headerBar.append(branding, primary, social);

  // mobile header bar
  const mobileBar = el('div', 'mobile-header-bar');
  const mobileBranding = el('div', 'mobile-branding');
  mobileBranding.append(mobileLink);
  const mobileNav = el('div', 'mobile-navigation');
  mobileNav.append(menuButton(true), menuButton(false));
  const mini = el('div', 'mobile-mini-widgets');
  mini.append(...[...contacts.children].map(clean));
  const miniMenu = topBar.querySelector('.top-menu');
  if (miniMenu) mini.append(clean(miniMenu));
  mini.append(clean(social));
  mobileBar.append(mobileBranding, mobileNav, mini);

  const masthead = el('div', 'masthead', { role: 'banner' });
  masthead.append(topBar, headerBar, mobileBar);

  // phantom (floating) header — a separate fixed clone of the header bar
  const phantom = el('div', '', { id: 'phantom' });
  phantom.inert = true;
  const phWrap = clean(headerBar);
  phWrap.className = 'ph-wrap header-bar';
  phWrap.querySelectorAll('.screen-reader-text:not(a *)').forEach((n) => n.remove());
  phWrap.querySelector('.primary-nav')?.setAttribute('aria-label', 'Main (floating)');
  phantom.append(phWrap);

  // mobile drawer
  const overlay = el('div', 'drawer-overlay');
  const drawer = el('div', 'mobile-drawer', { id: 'mobile-drawer' });
  drawer.inert = true;
  const close = el('button', 'mobile-drawer-close', { type: 'button', 'aria-label': 'Close' });
  close.append(el('span'));
  drawer.append(close, buildDrawerNav(mainNav), clean(social));

  const skip = el('a', 'skip-link screen-reader-text', { href: '#main' });
  skip.textContent = SKIP_LABEL[locale] || 'Skip to content';
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';

  const toTop = el('a', 'scroll-top off', { href: '#' });
  toTop.innerHTML = SCROLL_TOP_SVG;
  const toTopLabel = el('span', 'screen-reader-text');
  toTopLabel.textContent = 'Go to Top';
  toTop.append(toTopLabel);

  block.textContent = '';
  block.append(skip, masthead, phantom, overlay, drawer, toTop);
  applyVeil(block);
  wireHover(block);
  wireDrawer(block, drawer, overlay);
  wireScroll(masthead, phantom, toTop);
}
