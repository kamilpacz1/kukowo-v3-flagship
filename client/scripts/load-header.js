/* ============================================================
   load-header.js — prosta i niezawodna wersja
   Język: window.changeLang() wywoływane przez onclick w HTML.
   Brak dropdown, brak CSS tricks, brak event delegation issues.
   ============================================================ */

/* ── Expose changeLang IMMEDIATELY (before anything else) ── */
window.changeLang = function (lang) {
  localStorage.setItem('kukowo_lang', lang);
  if (window.i18n) {
    window.i18n.set(lang);
    updateLangBtns(lang);
  } else {
    // i18n not ready yet — reload with lang in URL
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    location.href = url.toString();
  }
};

/* ── Inject header ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const ph = document.getElementById('header-placeholder');
  if (!ph) { afterLoad(); return; }

  fetch('header.html?v=' + Date.now())
    .then(r => r.ok ? r.text() : Promise.reject(r.status))
    .then(html => {
      // Strip scripts before innerHTML injection
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      tmp.querySelectorAll('script').forEach(s => s.remove());
      ph.innerHTML = tmp.innerHTML;
      afterLoad();
    })
    .catch(err => {
      console.warn('[Header] fetch failed:', err);
      afterLoad();
    });
});

function afterLoad() {
  initStickyHeader();
  highlightActiveNav();
  const cur = localStorage.getItem('kukowo_lang') ||
    (navigator.language || 'pl').slice(0, 2).toLowerCase();
  updateLangBtns(cur);

  // CRITICAL: Re-apply translations to header elements now that they're in DOM
  // i18n.js may have already run applyTranslations() before header was injected
  if (window.i18n?.refresh) {
    window.i18n.refresh();
  }

  document.addEventListener('i18n:ready',   e => { updateLangBtns(e.detail?.lang || cur); });
  document.addEventListener('i18n:changed', e => { updateLangBtns(e.detail?.lang); });
}

/* ── Mark active lang button ────────────────────────────── */
function updateLangBtns(lang) {
  document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });
}

/* ── Sticky header ──────────────────────────────────────── */
function initStickyHeader() {
  const h = document.getElementById('mainHeader');
  if (!h) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      h.classList.toggle('header--scrolled', window.scrollY > 60);
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
  h.classList.toggle('header--scrolled', window.scrollY > 60);
}

/* ── Highlight active nav ───────────────────────────────── */
function highlightActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__nav a, .mobile-menu__nav a').forEach(a => {
    const active = a.getAttribute('href') === page;
    a.style.color = active ? 'var(--clr-gold)' : '';
    if (a.closest('.header__nav')) {
      a.style.borderBottomColor = active ? 'var(--clr-gold)' : '';
    }
  });
}

/* ── Mobile menu ────────────────────────────────────────── */
window.openMobileMenu = () => {
  document.getElementById('mobileMenu')?.classList.add('is-open');
  document.getElementById('menuOverlay')?.classList.add('is-visible');
  document.body.style.overflow = 'hidden';
  document.getElementById('hamburgerBtn')?.setAttribute('aria-expanded', 'true');
};
window.closeMobileMenu = () => {
  document.getElementById('mobileMenu')?.classList.remove('is-open');
  document.getElementById('menuOverlay')?.classList.remove('is-visible');
  document.body.style.overflow = '';
  document.getElementById('hamburgerBtn')?.setAttribute('aria-expanded', 'false');
};
window.openNav   = window.openMobileMenu;
window.closeNav  = window.closeMobileMenu;
window.toggleNav = () => {
  document.getElementById('mobileMenu')?.classList.contains('is-open')
    ? window.closeMobileMenu() : window.openMobileMenu();
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') window.closeMobileMenu();
});
