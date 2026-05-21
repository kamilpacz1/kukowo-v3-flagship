/* Loads footer.html and inits sticky CTA + back-to-top */
document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) {
    initFooterFeatures();
    return;
  }

  fetch('footer.html?v=' + Date.now())
    .then(r => r.text())
    .then(html => {
      placeholder.innerHTML = html;
      initFooterFeatures();
      // Re-apply translations to newly injected footer elements
      if (window.i18n?.refresh) window.i18n.refresh();
    })
    .catch(err => console.error('Błąd ładowania stopki:', err));
});

function initFooterFeatures() {
  /* Back to top */
  const btn = document.getElementById('backToTop');
  if (btn) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          btn.classList.toggle('is-visible', window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* Sticky CTA — hide near contact section */
  const cta = document.getElementById('stickyCta');
  if (cta) {
    const contactSection = document.getElementById('kontakt') ||
                           document.querySelector('.property-right') ||
                           document.querySelector('form#quickReservationForm');
    if (contactSection && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        cta.style.transform = entries[0].isIntersecting ? 'translateY(100%)' : '';
      }, { threshold: 0.1 });
      obs.observe(contactSection);
    }
  }
}
