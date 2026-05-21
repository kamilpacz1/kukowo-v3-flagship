/* ============================================================
   availability.js — interaktywny kalendarz dostępności
   - Wczytuje data/availability.json
   - Renderuje 4 najbliższe miesiące
   - Tabletka właściciela: edycja JSON → koniec overbookingu
   - Klik na wolną datę → otwiera formularz z prefill
   ============================================================ */

(function () {
  'use strict';

  const MONTHS_AHEAD = 4;
  const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const DAYS_PL = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
  const DAYS_EN = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  const DAYS_DE = ['Mo','Di','Mi','Do','Fr','Sa','So'];

  let availability = null;
  let currentOffer = null;

  function getMonthNames() {
    const lang = (window.i18n && window.i18n.current) || 'pl';
    return lang === 'en' ? MONTHS_EN : lang === 'de' ? MONTHS_DE : MONTHS_PL;
  }
  function getDayNames() {
    const lang = (window.i18n && window.i18n.current) || 'pl';
    return lang === 'en' ? DAYS_EN : lang === 'de' ? DAYS_DE : DAYS_PL;
  }
  function t(key, fb) {
    return (window.i18n && window.i18n.t(key) !== key) ? window.i18n.t(key) : (fb || key);
  }

  async function load() {
    if (availability) return availability;
    try {
      const res = await fetch('data/availability.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      availability = await res.json();
      return availability;
    } catch (err) {
      console.error('Błąd ładowania dostępności:', err);
      return null;
    }
  }

  function ymd(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function isBooked(dateStr, offerKey, data) {
    const offer = data && data[offerKey];
    if (!offer || !offer.booked) return false;
    return offer.booked.some(range => {
      const start = range[0], end = range[1] || range[0];
      return dateStr >= start && dateStr <= end;
    });
  }

  function buildMonth(year, month, offerKey, data) {
    const monthNames = getMonthNames();
    const dayNames = getDayNames();
    const today = new Date(); today.setHours(0,0,0,0);

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const dim = last.getDate();

    let firstWeekday = first.getDay() - 1;
    if (firstWeekday < 0) firstWeekday = 6;

    let html = `
      <div class="cal-month">
        <h4 class="cal-month__title">${monthNames[month]} <span>${year}</span></h4>
        <div class="cal-grid">
          ${dayNames.map(d => `<div class="cal-grid__dow">${d}</div>`).join('')}
    `;
    for (let i = 0; i < firstWeekday; i++) html += '<div class="cal-grid__empty"></div>';
    for (let d = 1; d <= dim; d++) {
      const dt = new Date(year, month, d);
      const dateStr = ymd(dt);
      const past = dt < today;
      const booked = isBooked(dateStr, offerKey, data);
      let cls = 'cal-day';
      if (past) cls += ' cal-day--past';
      else if (booked) cls += ' cal-day--booked';
      else cls += ' cal-day--free';
      html += `<button class="${cls}" data-date="${dateStr}" ${past || booked ? 'disabled' : ''}>${d}</button>`;
    }
    html += '</div></div>';
    return html;
  }

  function render(offerKey) {
    const root = document.getElementById('availability-calendar');
    if (!root || !availability) return;

    currentOffer = offerKey || Object.keys(availability).filter(k => !k.startsWith('_'))[0];
    const today = new Date();
    let html = '';
    for (let i = 0; i < MONTHS_AHEAD; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      html += buildMonth(d.getFullYear(), d.getMonth(), currentOffer, availability);
    }
    root.querySelector('.cal-months').innerHTML = html;

    /* Update selector active state */
    root.querySelectorAll('[data-offer-select]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.offerSelect === currentOffer);
    });

    /* Last updated */
    const lu = root.querySelector('.cal-last-updated');
    if (lu && availability._lastUpdated) {
      lu.textContent = t('availability.lastUpdated', 'Aktualizacja') + ': ' + availability._lastUpdated;
    }

    /* Click handler */
    root.querySelectorAll('.cal-day--free').forEach(btn => {
      btn.addEventListener('click', () => {
        const date = btn.dataset.date;
        const arrival = document.querySelector('input[name="arrival"]');
        if (arrival) {
          arrival.value = date;
          arrival.dispatchEvent(new Event('change'));
          arrival.scrollIntoView({ behavior: 'smooth', block: 'center' });
          arrival.focus();
        } else {
          // Fallback: open reservation modal if any
          const ask = document.getElementById('askForReservationBtn');
          if (ask) ask.click();
        }
      });
    });
  }

  async function init() {
    const root = document.getElementById('availability-calendar');
    if (!root) return;
    const data = await load();
    if (!data) {
      root.innerHTML = '<p class="cal-error">' + t('availability.error', 'Błąd ładowania dostępności') + '</p>';
      return;
    }

    /* Build skeleton */
    const offers = Object.keys(data).filter(k => !k.startsWith('_'));
    if (offers.length === 0) return;

    const presetOffer = root.dataset.offer || offers[0];

    root.innerHTML = `
      ${offers.length > 1 ? `
        <div class="cal-selector">
          <span class="cal-selector__label" data-i18n="availability.choose">Wybierz obiekt:</span>
          <div class="cal-selector__buttons">
            ${offers.map(k => `
              <button class="cal-selector__btn" data-offer-select="${k}">
                ${data[k].name}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="cal-legend">
        <span class="cal-legend__item"><span class="cal-legend__dot cal-legend__dot--free"></span><span data-i18n="availability.legend.free">Wolne</span></span>
        <span class="cal-legend__item"><span class="cal-legend__dot cal-legend__dot--booked"></span><span data-i18n="availability.legend.booked">Zajęte</span></span>
        <span class="cal-legend__item"><span class="cal-legend__dot cal-legend__dot--past"></span><span data-i18n="availability.legend.past">Minione</span></span>
      </div>

      <div class="cal-months"></div>

      <p class="cal-last-updated"></p>
    `;

    /* Selector handlers */
    root.querySelectorAll('[data-offer-select]').forEach(b => {
      b.addEventListener('click', () => render(b.dataset.offerSelect));
    });

    render(presetOffer);
    if (window.i18n && window.i18n.refresh) window.i18n.refresh();
  }

  // Expose globally so site-manager.js can trigger render after injecting #availability-calendar
  window.availabilityRender = function (offerKey) {
    render(offerKey || currentOffer || 'konradowe-chaty');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('i18n:changed', () => render(currentOffer));
})();
