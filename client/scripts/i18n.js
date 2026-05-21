/* ============================================================
   i18n.js — wielojęzyczność PL / EN / DE
   
   Rozwiązuje race condition: header i footer ładowane są async.
   applyTranslations() jest wywoływane:
   1. Natychmiast po załadowaniu JSON (dla statycznej treści strony)
   2. Ponownie przez load-header.js i load-footer.js po inject
   3. Ponownie przy zmianie języka
   ============================================================ */

(function () {
  'use strict';

  const SUPPORTED  = ['pl', 'en', 'de'];
  const DEFAULT    = 'pl';
  const STORE_KEY  = 'kukowo_lang';

  let cache = {};          // { 'pl': {...}, 'en': {...} }
  let currentLang = DEFAULT;

  /* ── Determine language ─────────────────────────────────── */
  function detectLang() {
    const url  = new URLSearchParams(location.search).get('lang');
    if (url  && SUPPORTED.includes(url))  return url;
    const stored = localStorage.getItem(STORE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const browser = (navigator.language || DEFAULT).slice(0, 2).toLowerCase();
    return SUPPORTED.includes(browser) ? browser : DEFAULT;
  }

  /* ── Load JSON (cached) ─────────────────────────────────── */
  async function loadJSON(lang) {
    if (cache[lang]) return cache[lang];
    try {
      const r = await fetch(`i18n/${lang}.json`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      cache[lang] = await r.json();
      return cache[lang];
    } catch (err) {
      console.warn(`[i18n] Failed to load ${lang}.json:`, err.message);
      if (lang !== DEFAULT) return loadJSON(DEFAULT);
      return {};
    }
  }

  /* ── Apply translations to DOM ──────────────────────────── */
  function apply(t) {
    if (!t || !Object.keys(t).length) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t[el.dataset.i18n];
      if (v !== undefined) el.textContent = v;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const v = t[el.dataset.i18nHtml];
      if (v !== undefined) el.innerHTML = v;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const v = t[el.dataset.i18nPlaceholder];
      if (v !== undefined) el.placeholder = v;
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const v = t[el.dataset.i18nTitle];
      if (v !== undefined) el.title = v;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const v = t[el.dataset.i18nAria];
      if (v !== undefined) el.setAttribute('aria-label', v);
    });

    document.documentElement.lang = currentLang;
  }

  /* ── Public API ─────────────────────────────────────────── */
  window.i18n = {
    t(key) {
      return (cache[currentLang] && cache[currentLang][key]) ?? key;
    },

    async set(lang) {
      if (!SUPPORTED.includes(lang)) return;
      currentLang = lang;
      localStorage.setItem(STORE_KEY, lang);
      const t = await loadJSON(lang);
      apply(t);
      document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
    },

    // Called by load-header.js and load-footer.js after DOM injection
    async refresh() {
      const t = await loadJSON(currentLang);
      apply(t);
    },

    get current() { return currentLang; },
    get supported() { return [...SUPPORTED]; }
  };

  /* ── Init ───────────────────────────────────────────────── */
  async function init() {
    currentLang = detectLang();
    const t = await loadJSON(currentLang);
    apply(t);
    document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: currentLang } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
