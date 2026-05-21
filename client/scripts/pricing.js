/* ============================================================
   pricing.js — system cennika
   - Wczytuje data/pricing.json
   - Renderuje widget "od X zł" w kartach ofert (data-pricing="key")
   - Renderuje pełną sekcję cennikową (data-pricing-full="key" lub #pricing-section)
   - Reaguje na zmianę języka (i18n:changed)
   ============================================================ */

(function () {
  'use strict';

  let pricingData = null;

  async function load() {
    if (pricingData) return pricingData;
    try {
      const res = await fetch('data/pricing.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      pricingData = await res.json();
      return pricingData;
    } catch (err) {
      console.error('Błąd ładowania cennika:', err);
      return null;
    }
  }

  function fmt(n, currency) {
    return n.toLocaleString('pl-PL') + ' ' + (currency || 'zł');
  }

  function t(key, fallback) {
    return (window.i18n && window.i18n.t(key) !== key) ? window.i18n.t(key) : (fallback || key);
  }

  /* "od X zł" badge in offer cards */
  function renderInlineBadges(data) {
    document.querySelectorAll('[data-pricing]').forEach(el => {
      const key = el.dataset.pricing;
      const offer = data[key];
      if (!offer) return;

      if (data.showPrices === false) {
        el.innerHTML = `<span class="price-badge price-badge--inquire">${t('pricing.askForQuote', 'Wycena indywidualna')}</span>`;
        return;
      }
      const from = offer.lowSeason && offer.lowSeason.from;
      if (!from) return;
      el.innerHTML = `
        <span class="price-badge">
          <span class="price-badge__from">od</span>
          <span class="price-badge__amount">${fmt(from, data.currencySymbol)}</span>
          <span class="price-badge__per">${t('pricing.perNight', '/ noc')}</span>
        </span>
      `;
    });
  }

  /* Full pricing card per offer */
  function renderFullCard(offer, data) {
    if (data.showPrices === false) {
      return `
        <div class="pricing-card pricing-card--inquire">
          <h3>${offer.title}</h3>
          <p class="pricing-card__inquire">${t('pricing.note', 'Wycena indywidualna — skontaktuj się z nami.')}</p>
          <a href="#kontakt" class="btn btn--primary">${t('pricing.askForQuote', 'Zapytaj o wycenę')}</a>
        </div>
      `;
    }

    const sym = data.currencySymbol || 'zł';
    const incl = (offer.included || []).map(i => `<li>${i}</li>`).join('');
    const ex = (offer.extras || []).map(e => {
      const price = e.price === 0 ? '<em>w cenie</em>' : `${fmt(e.price, sym)} <span class="muted">/ ${e.unit}</span>`;
      return `<li><span>${e.name}</span><span>${price}</span></li>`;
    }).join('');

    return `
      <article class="pricing-card">
        <h3>${offer.title}</h3>

        <div class="pricing-card__seasons">
          <div class="pricing-card__season">
            <p class="pricing-card__season-label">${t('pricing.lowSeason', 'Niski sezon')}</p>
            <p class="pricing-card__season-period">${offer.lowSeasonLabel || ''}</p>
            <p class="pricing-card__season-price">
              ${fmt(offer.lowSeason.from, sym)}–${fmt(offer.lowSeason.to, sym)}
              <span class="pricing-card__season-unit">${t('pricing.perNight', '/ noc')}</span>
            </p>
          </div>
          <div class="pricing-card__season pricing-card__season--high">
            <p class="pricing-card__season-label">${t('pricing.highSeason', 'Wysoki sezon')}</p>
            <p class="pricing-card__season-period">${offer.highSeasonLabel || ''}</p>
            <p class="pricing-card__season-price">
              ${fmt(offer.highSeason.from, sym)}–${fmt(offer.highSeason.to, sym)}
              <span class="pricing-card__season-unit">${t('pricing.perNight', '/ noc')}</span>
            </p>
          </div>
        </div>

        <dl class="pricing-card__terms">
          <div><dt>${t('pricing.minNights', 'Min. nocy')}</dt><dd>${offer.minNights} / ${offer.minNightsHighSeason}</dd></div>
          <div><dt>${t('pricing.deposit', 'Zaliczka')}</dt><dd>${offer.deposit}${offer.depositUnit}</dd></div>
        </dl>

        ${incl ? `
          <div class="pricing-card__list">
            <h4>${t('pricing.included', 'W cenie')}</h4>
            <ul class="pricing-card__check">${incl}</ul>
          </div>
        ` : ''}

        ${ex ? `
          <div class="pricing-card__list">
            <h4>${t('pricing.extras', 'Dodatkowo')}</h4>
            <ul class="pricing-card__extras">${ex}</ul>
          </div>
        ` : ''}
      </article>
    `;
  }

  function renderFullSections(data) {
    document.querySelectorAll('[data-pricing-full]').forEach(el => {
      const key = el.dataset.pricingFull;
      if (data[key]) el.innerHTML = renderFullCard(data[key], data);
    });

    // Whole pricing section (homepage, all 3 offers)
    const whole = document.getElementById('pricing-grid');
    if (whole) {
      const offers = ['konradowe-chaty', 'studia-stara-stajnia', 'kamperowisko'];
      whole.innerHTML = offers
        .filter(k => data[k])
        .map(k => renderFullCard(data[k], data))
        .join('');
    }
  }

  /* Expose for subpages that render single offer */
  window.pricingRenderCard = renderFullCard;

  async function render() {
    const data = await load();
    if (!data) return;
    renderInlineBadges(data);
    renderFullSections(data);
  }

  /* Init */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  /* Re-render on language change */
  document.addEventListener('i18n:changed', render);
  document.addEventListener('i18n:ready', render);
})();
