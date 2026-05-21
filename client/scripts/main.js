/* ============================================================
   SIEDLISKO KONRADÓWKA — main.js v2.0
   Core JS: lightbox, FAQ, smooth scroll, lazy video,
   protection, AOS init
   ============================================================ */

'use strict';

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* AOS init */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }
});

/* Smooth scroll for in-page anchors */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href === '#' || href.length < 2) return;
  const target = document.querySelector(href);
  if (!target) return;
  e.preventDefault();
  const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
  const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
});

/* FAQ accordion */
document.addEventListener('DOMContentLoaded', () => {
  const buttons = $$('.faq-item__q');
  buttons.forEach(btn => {
    const answerId = btn.getAttribute('aria-controls');
    const answer = answerId ? document.getElementById(answerId) : null;
    if (!answer) return;
    answer.removeAttribute('hidden');
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      buttons.forEach(b => {
        if (b !== btn) {
          b.setAttribute('aria-expanded', 'false');
          const a = document.getElementById(b.getAttribute('aria-controls'));
          if (a) a.classList.remove('is-open');
        }
      });
      btn.setAttribute('aria-expanded', String(!expanded));
      answer.classList.toggle('is-open', !expanded);
    });
  });
});

/* Custom Gallery Lightbox (works with .gallery-item[data-src]) */
document.addEventListener('DOMContentLoaded', () => {
  const items = $$('.gallery-item[data-src]');
  if (items.length === 0) return;

  // Inject lightbox if not present
  let lb = document.getElementById('lightbox-custom');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox-custom';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Zamknij">&times;</button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Poprzednie">&#10094;</button>
      <img class="lightbox__img" src="" alt="">
      <button class="lightbox__nav lightbox__nav--next" aria-label="Następne">&#10095;</button>
      <div class="lightbox__counter"></div>
    `;
    document.body.appendChild(lb);
  }

  const img = lb.querySelector('.lightbox__img');
  const counter = lb.querySelector('.lightbox__counter');
  const closeBtn = lb.querySelector('.lightbox__close');
  const prevBtn = lb.querySelector('.lightbox__nav--prev');
  const nextBtn = lb.querySelector('.lightbox__nav--next');
  let idx = 0;
  const sources = items.map(el => ({
    src: el.dataset.src,
    alt: el.querySelector('img')?.alt || ''
  }));

  function show(i) {
    idx = i;
    img.src = sources[i].src;
    img.alt = sources[i].alt;
    counter.textContent = `${i + 1} / ${sources.length}`;
    prevBtn.style.visibility = i === 0 ? 'hidden' : 'visible';
    nextBtn.style.visibility = i === sources.length - 1 ? 'hidden' : 'visible';
  }

  function open(i) {
    show(i);
    lb.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('show');
    document.body.style.overflow = '';
  }
  function move(dir) {
    const ni = idx + dir;
    if (ni >= 0 && ni < sources.length) show(ni);
  }

  items.forEach((el, i) => {
    el.style.cursor = 'pointer';
    el.setAttribute('tabindex', '0');
    el.addEventListener('click', () => open(i));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') open(i); });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => move(-1));
  nextBtn.addEventListener('click', () => move(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('show')) return;
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'Escape') close();
  });

  // Touch swipe
  let tX = 0;
  lb.addEventListener('touchstart', e => { tX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const diff = tX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) move(diff > 0 ? 1 : -1);
  }, { passive: true });
});

/* Legacy lightbox support (gallery.html, subpages with #lightbox) */
let _legacyImages = [];
let _legacyIdx = 0;
function _initLegacyLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img') || document.getElementById('lightboxImg');
  if (!lightbox || !lbImg) return;
  const galleryImgs = $$('.gallery-img, .gallery img, .gallery-grid img');
  if (galleryImgs.length === 0) return;

  _legacyImages = galleryImgs.map(i => i.src);
  galleryImgs.forEach((img, i) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      _legacyIdx = i;
      lbImg.src = img.src;
      lightbox.classList.add('show');
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
}
window.closeLightbox = function () {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.classList.remove('show');
    lb.classList.remove('active');
  }
  document.body.style.overflow = '';
};
window.changeImage = function (dir) {
  const lbImg = document.getElementById('lightbox-img') || document.getElementById('lightboxImg');
  if (!lbImg || _legacyImages.length === 0) return;
  _legacyIdx = (_legacyIdx + dir + _legacyImages.length) % _legacyImages.length;
  lbImg.src = _legacyImages[_legacyIdx];
};
document.addEventListener('DOMContentLoaded', _initLegacyLightbox);

/* Show all (for property featured-images) */
document.addEventListener('click', e => {
  const btn = e.target.closest('#showAllBtn, .show-all-btn');
  if (!btn) return;
  const extras = $$('#extraImages img[data-extra], #extraImages img');
  if (extras.length === 0) return;
  // Open first extra in lightbox
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img') || document.getElementById('lightboxImg');
  if (lightbox && lbImg) {
    _legacyImages = extras.map(i => i.src);
    _legacyIdx = 0;
    lbImg.src = _legacyImages[0];
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
});

/* Video lazy load on hero */
document.addEventListener('DOMContentLoaded', () => {
  const videos = $$('.hero__video, .hero-video, .form-video-bg');
  videos.forEach(v => {
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          if (v.dataset.src) v.src = v.dataset.src;
          v.load && v.load();
          obs.disconnect();
        }
      }, { rootMargin: '200px' });
      obs.observe(v);
    }
  });
});

/* Image protection (drag/contextmenu) */
document.addEventListener('contextmenu', e => {
  const tag = e.target.tagName?.toLowerCase();
  if (tag === 'img' || tag === 'video' || e.target.closest?.('iframe')) {
    e.preventDefault();
  }
});
document.addEventListener('DOMContentLoaded', () => {
  $$('img, video').forEach(el => {
    el.addEventListener('dragstart', e => e.preventDefault());
  });
});

/* Legacy: scroll to top */
window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


/* ═══════════════════════════════════════════════════════
   Offer card gallery — kliknięcie otwiera lightbox oferty
   ═══════════════════════════════════════════════════════ */
(function initOfferGalleries() {
  // Global lightbox state for offer galleries
  let offerImages = [];
  let offerIdx = 0;

  function createOfferLightbox() {
    if (document.getElementById('offer-lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'offer-lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="close" id="offer-lb-close" aria-label="Zamknij">&times;</button>
      <img id="offer-lb-img" class="lightbox-content" src="" alt="">
      <button class="prev" id="offer-lb-prev" aria-label="Poprzednie">&#10094;</button>
      <button class="next" id="offer-lb-next" aria-label="Następne">&#10095;</button>
      <div class="offer-lb-counter" id="offer-lb-counter"></div>
    `;
    document.body.appendChild(lb);

    lb.addEventListener('click', e => { if (e.target === lb) closeOfferLightbox(); });
    document.getElementById('offer-lb-close').addEventListener('click', closeOfferLightbox);
    document.getElementById('offer-lb-prev').addEventListener('click', () => changeOfferImg(-1));
    document.getElementById('offer-lb-next').addEventListener('click', () => changeOfferImg(1));
    document.addEventListener('keydown', e => {
      const lb = document.getElementById('offer-lightbox');
      if (!lb || lb.style.display === 'none' || !lb.style.display) return;
      if (e.key === 'ArrowLeft')  changeOfferImg(-1);
      if (e.key === 'ArrowRight') changeOfferImg(1);
      if (e.key === 'Escape')     closeOfferLightbox();
    });
  }

  function openOfferLightbox(images, startIdx) {
    createOfferLightbox();
    offerImages = images;
    offerIdx = startIdx || 0;
    showOfferImg();
    const lb = document.getElementById('offer-lightbox');
    if (lb) { lb.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  }

  function closeOfferLightbox() {
    const lb = document.getElementById('offer-lightbox');
    if (lb) { lb.style.display = 'none'; document.body.style.overflow = ''; }
  }

  function changeOfferImg(dir) {
    offerIdx = (offerIdx + dir + offerImages.length) % offerImages.length;
    showOfferImg();
  }

  function showOfferImg() {
    const img = document.getElementById('offer-lb-img');
    const counter = document.getElementById('offer-lb-counter');
    if (img) { img.src = offerImages[offerIdx]; img.alt = ''; }
    if (counter) counter.textContent = `${offerIdx + 1} / ${offerImages.length}`;
    // Hide prev/next if only 1 image
    const prev = document.getElementById('offer-lb-prev');
    const next = document.getElementById('offer-lb-next');
    const single = offerImages.length <= 1;
    if (prev) prev.style.display = single ? 'none' : '';
    if (next) next.style.display = single ? 'none' : '';
  }

  function bindOfferGalleries() {
    document.querySelectorAll('.offer-card__img-wrap--gallery').forEach(wrap => {
      if (wrap.dataset.galleryBound) return;
      wrap.dataset.galleryBound = '1';
      wrap.addEventListener('click', () => {
        try {
          const imgs = JSON.parse(wrap.dataset.gallery || '[]');
          if (imgs.length) openOfferLightbox(imgs, 0);
        } catch (e) { console.warn('[Gallery]', e); }
      });
      wrap.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wrap.click(); }
      });
    });
  }

  // Bind on load + after any dynamic content
  document.addEventListener('DOMContentLoaded', bindOfferGalleries);
  // Re-bind after 1s in case content loads async
  setTimeout(bindOfferGalleries, 1000);
  window.bindOfferGalleries = bindOfferGalleries;
})();
