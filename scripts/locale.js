/*
 * Locale helpers shared by the header and footer blocks (Polylang replacement).
 * Locales: en (root), da (/da/), ca (/ca/), es (/es/).
 * Page metadata contract (stardust/runtime-contract.json):
 *   translations: "en=/the-garden, da=/da/the-garden, ca=/ca/el-jardi, es=/es/el-jardin"
 *     — the page's translations (Polylang hreflang alternates); absent = none declared.
 */
import { getMetadata } from './aem.js';

export const LOCALES = ['en', 'da', 'ca', 'es'];

const HTML_LANG = {
  en: 'en-GB',
  da: 'da-DK',
  ca: 'ca',
  es: 'es-ES',
};

/**
 * Locale of a path: the first segment when it is da / ca / es, else en.
 * @param {string} [path] defaults to the current page path
 * @returns {string}
 */
export function getLocale(path = window.location.pathname) {
  const m = path.match(/^\/(da|ca|es)(\/|$)/);
  return m ? m[1] : 'en';
}

/**
 * The html lang attribute value the source used for a locale.
 * @param {string} [locale]
 * @returns {string}
 */
export function getHtmlLang(locale = getLocale()) {
  return HTML_LANG[locale] || 'en-GB';
}

/**
 * Prefix of a locale's chrome documents ('' for en, '/es' for es).
 * @param {string} [locale]
 * @returns {string}
 */
export function getLocalePrefix(locale = getLocale()) {
  return locale === 'en' ? '' : `/${locale}`;
}

/**
 * Normalises a path or URL for comparison: pathname only, no .html, no trailing slash.
 * @param {string} href
 * @returns {string}
 */
export function normalizePath(href) {
  let path = href;
  try {
    path = new URL(href, window.location.href).pathname;
  } catch (e) {
    // keep as authored
  }
  path = path.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

/**
 * The page's declared translations, from the `translations` metadata.
 * @returns {Map<string, string>|null} locale → path, or null when none are declared
 */
export function getTranslations() {
  const raw = getMetadata('translations');
  if (!raw) return null;
  const map = new Map();
  raw.split(/[,\n]/).forEach((entry) => {
    const m = entry.trim().match(/^([a-z]{2})(?:-[a-z]{2})?\s*[=:]\s*(\S+)$/i);
    if (m) map.set(m[1].toLowerCase(), normalizePath(m[2]));
  });
  return map.size ? map : null;
}
