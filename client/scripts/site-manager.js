/* ============================================================
   site-manager.js v4 — FIXED

   Kluczowe naprawki:
   1. HTML używa data-i18n atrybutów — i18n.js sam tłumaczy
      po zmianie języka, bez przebudowy DOM
   2. init() czeka na i18n:ready + config jednocześnie
   3. window.availabilityRender() już działa (naprawione w
      availability.js)
   ============================================================ */
(function () {
  'use strict';

  let CFG = null;
  let initialized = false;

  /* ── Promise helpers ──────────────────────────────────────── */
  function waitForI18n() {
    return new Promise(resolve => {
      // i18n.js fires i18n:ready once translations load
      // If it already fired, we check via a small delay
      const check = () => window.i18n?.current ? resolve() : null;
      document.addEventListener('i18n:ready', () => resolve(), { once: true });
      // Fallback: check every 50ms up to 3s
      let tries = 0;
      const poll = setInterval(() => {
        if (window.i18n?.t && window.i18n.t('nav.start') !== 'nav.start') {
          clearInterval(poll); resolve();
        }
        if (++tries > 60) { clearInterval(poll); resolve(); }
      }, 50);
    });
  }

  async function loadConfig() {
    try {
      const r = await fetch('data/site-config.json');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch {
      return { showFullBookingInfo: false,
        contact: { phone: '+48 604 083 659', whatsapp: '48604083659',
          email: 'siedliskokonradowka@gmail.com', responseHours: 2,
          workingHours: 'pn–nd 8:00–22:00' },
        emailjs: { serviceId: 'service_g6tanel',
          templateId: 'template_991rdou', publicKey: 'WU6nK13OCtPUDJJad' } };
    }
  }

  async function init() {
    // Wait for BOTH config and i18n translations to be ready
    [CFG] = await Promise.all([loadConfig(), waitForI18n()]);
    applyAnalytics();
    applyModes();
    // Re-apply on language change (data-i18n handles text, but
    // we need to rebuild offer opts and re-wire buttons)
    document.addEventListener('i18n:changed', applyModes);
  }

  /* ── Apply modes ─────────────────────────────────────────── */
  function applyModes() {
    if (!CFG) return;

    // Always hide price badges
    document.querySelectorAll('[data-pricing]').forEach(el => {
      el.innerHTML = ''; el.style.display = 'none';
    });

    // Homepage #booking section
    const bk = document.getElementById('booking');
    if (bk) {
      const wrap = document.getElementById('booking-container') || bk;
      if (CFG.showFullBookingInfo) {
        // Only rebuild if empty (avoid flickering on lang change)
        if (!wrap.querySelector('#availability-calendar')) {
          wrap.innerHTML = calendarHTML();
        }
        // Always trigger render in case calendar needs refresh
        setTimeout(() => { if (window.availabilityRender) window.availabilityRender(); }, 50);
      } else {
        wrap.innerHTML = inquiryHTML();
        if (window.i18n?.refresh) window.i18n.refresh();
        wireForm();
      }
    }

    // Subpages: hide pricing always, show/hide availability
    const sp = document.getElementById('section-pricing');
    if (sp) sp.style.display = 'none';
    const sa = document.getElementById('section-availability');
    if (sa) sa.style.display = CFG.showFullBookingInfo ? '' : 'none';

    initialized = true;
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  const ph  = () => CFG?.contact?.phone || '+48 604 083 659';
  const em  = () => CFG?.contact?.email || 'siedliskokonradowka@gmail.com';
  const wa  = () => CFG?.contact?.whatsapp || '48604083659';
  const hrs = () => CFG?.contact?.responseHours || 2;
  const wh  = () => CFG?.contact?.workingHours || 'pn–nd 8:00–22:00';
  const waHref = msg => `https://wa.me/${wa()}?text=${encodeURIComponent(msg)}`;

  function offerOpts() {
    const page = location.pathname.split('/').pop();
    let pre = '';
    if (page.includes('konradowe'))  pre = 'konradowe';
    if (page.includes('stajnia'))    pre = 'stajnia';
    if (page.includes('kamperowi'))  pre = 'kamper';
    return [
      { v: '', k: 'inquiry.offer.choose', fb: '— wybierz ofertę —', sel: false },
      { v: 'konradowe', k: 'nav.chaty', fb: 'Konradowe Chaty', sel: pre==='konradowe' },
      { v: 'stajnia',   k: 'nav.stajnia', fb: 'Stara Stajnia',    sel: pre==='stajnia' },
      { v: 'kamper',    k: 'nav.kamper',  fb: 'Kamperowisko',     sel: pre==='kamper' },
      { v: 'unknown',   k: 'inquiry.offer.notSure', fb: 'Nie wiem jeszcze', sel: false },
    ].map(o => `<option value="${o.v}"${o.sel?' selected':''}
      data-i18n="${o.k}">${o.fb}</option>`).join('');
  }

  function buildMsg() {
    const form = document.getElementById('booking-form');
    const g = n => form?.querySelector(`[name="${n}"]`)?.value || '';
    const lang = window.i18n?.current || 'pl';
    return ({
      pl: `Dzień dobry! Pytam o pobyt w Siedlisku Konradówka:\n📍 Oferta: ${g('offer')}\n📅 Przyjazd: ${g('arrival')}\n📅 Wyjazd: ${g('departure')}\n👥 Goście: ${g('guests')}\n👤 ${g('name')}\n📱 ${g('contact')}`,
      en: `Hello! Inquiry about Siedlisko Konradówka:\n📍 Option: ${g('offer')}\n📅 Arrival: ${g('arrival')}\n📅 Departure: ${g('departure')}\n👥 Guests: ${g('guests')}\n👤 ${g('name')}\n📱 ${g('contact')}`,
      de: `Guten Tag! Anfrage für Siedlisko Konradówka:\n📍 Angebot: ${g('offer')}\n📅 Anreise: ${g('arrival')}\n📅 Abreise: ${g('departure')}\n👥 Gäste: ${g('guests')}\n👤 ${g('name')}\n📱 ${g('contact')}`,
    })[lang] || '';
  }

  function wireForm() {
    document.getElementById('bk-email')?.addEventListener('click', () =>
      sendEmail(document.getElementById('booking-form'), document.getElementById('bk-email')));
    document.getElementById('bk-wa')?.addEventListener('click', () =>
      window.open(waHref(buildMsg()), '_blank', 'noopener'));
  }

  function sendEmail(form, btn) {
    if (!window.emailjs || !CFG?.emailjs?.serviceId) {
      window.open(waHref(buildMsg()), '_blank', 'noopener'); return;
    }
    const g = n => form?.querySelector(`[name="${n}"]`)?.value || '';
    const orig = btn.innerHTML;
    btn.textContent = '⌛'; btn.disabled = true;
    const { serviceId, templateId, publicKey } = CFG.emailjs;
    emailjs.send(serviceId, templateId, {
      from_name: g('name'), reply_to: g('contact'),
      offer: g('offer'), arrival: g('arrival'), departure: g('departure'), guests: g('guests'),
      message: `kukowo.pl | ${g('offer')} | ${g('arrival')}–${g('departure')} | ${g('guests')} os. | ${g('contact')}`,
    }, publicKey)
    .then(() => { btn.textContent = '✓ Wysłano!'; btn.style.background='var(--clr-sage)'; form?.reset();
      setTimeout(()=>{btn.innerHTML=orig;btn.disabled=false;btn.style.removeProperty('background');},5000); })
    .catch(() => { btn.textContent = '✗ Błąd'; btn.style.background='#B33A3A';
      setTimeout(()=>{btn.innerHTML=orig;btn.disabled=false;btn.style.removeProperty('background');},4000); });
  }

  function applyAnalytics() {
    const id = CFG?.analytics?.gaId;
    if (!id || id.includes('XXXX')) return;
    const s = document.createElement('script');
    s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', id);
  }

  /* ════════════════════════════════════════════════════════════
     HTML: PRESTIGE — formularz kontaktowy z data-i18n
     ════════════════════════════════════════════════════════════ */
  function inquiryHTML() {
    return `
<div class="section-header section-header--center">
  <p class="section-label" data-i18n="kontakt.label">Rezerwacja bezpośrednia</p>
  <h2 class="section-title">
    <span data-i18n="inquiry.unified.title1">Napisz do nas</span>
    <em data-i18n="inquiry.unified.title2">o pobyt</em>
  </h2>
  <p class="section-desc" data-i18n="inquiry.unified.desc">
    Podaj termin i liczbę gości — odpiszemy w ciągu ${hrs()} godzin z indywidualną propozycją.
  </p>
</div>

<div class="inquiry-pills">
  <span class="inquiry-pill" data-i18n="inquiry.pill1">Odpowiadamy w ciągu 2 godzin</span>
  <span class="inquiry-pill" data-i18n="inquiry.pill2">Rezerwacja bezpośrednia — bez prowizji</span>
  <span class="inquiry-pill" data-i18n="inquiry.pill3">Indywidualne warunki pobytu</span>
</div>

<div class="inquiry-card">
  <div class="inquiry-card__main">
    <form id="booking-form" novalidate autocomplete="on">
      <div class="inquiry-form__row">
        <div class="inquiry-field">
          <label for="bk-arrival" data-i18n="inquiry.field.arrival">Przyjazd</label>
          <input type="date" id="bk-arrival" name="arrival">
        </div>
        <div class="inquiry-field">
          <label for="bk-departure" data-i18n="inquiry.field.departure">Wyjazd</label>
          <input type="date" id="bk-departure" name="departure">
        </div>
      </div>
      <div class="inquiry-form__row">
        <div class="inquiry-field">
          <label for="bk-guests" data-i18n="inquiry.field.guests">Liczba gości</label>
          <select id="bk-guests" name="guests">
            <option>1</option><option>2</option><option>3</option>
            <option selected>4</option><option>5</option><option>6+</option>
          </select>
        </div>
        <div class="inquiry-field">
          <label for="bk-offer" data-i18n="inquiry.field.offer">Oferta</label>
          <select id="bk-offer" name="offer">${offerOpts()}</select>
        </div>
      </div>
      <div class="inquiry-form__row">
        <div class="inquiry-field">
          <label for="bk-name" data-i18n="inquiry.field.name">Twoje imię</label>
          <input type="text" id="bk-name" name="name" autocomplete="given-name"
            data-i18n-placeholder="inquiry.placeholder.name">
        </div>
        <div class="inquiry-field">
          <label for="bk-contact" data-i18n="inquiry.field.contact">Telefon lub e-mail</label>
          <input type="text" id="bk-contact" name="contact" autocomplete="email"
            data-i18n-placeholder="inquiry.placeholder.contact">
        </div>
      </div>
    </form>

    <div class="inquiry-actions">
      <button class="inquiry-btn inquiry-btn--email" id="bk-email" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span data-i18n="inquiry.cta.email">Napisz do nas</span>
        <span class="inquiry-btn__tag" data-i18n="inquiry.fastest">zalecane</span>
      </button>
      <button class="inquiry-btn inquiry-btn--wa" id="bk-wa" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </button>
    </div>
  </div>

  <div class="inquiry-card__trust">
    <div class="inquiry-trust-item">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <div>
        <strong data-i18n="inquiry.trust1.title">Odpowiadamy w ${hrs()}h</strong>
        <span>${wh()}</span>
      </div>
    </div>
    <div class="inquiry-trust-item">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      <div>
        <strong>${em()}</strong>
        <span data-i18n="inquiry.trust2.sub">Preferowany kanał kontaktu</span>
      </div>
    </div>
    <div class="inquiry-trust-item">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 012 1.18 2 2 0 014 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
      <div>
        <strong data-i18n="inquiry.trust4.title">Lub zadzwoń</strong>
        <a href="tel:${ph().replace(/\s/g,'')}" class="inquiry-trust-phone">${ph()}</a>
      </div>
    </div>
    <div class="inquiry-trust-item">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <div>
        <strong data-i18n="inquiry.trust2.title">Rezerwacja bezpośrednia</strong>
        <span data-i18n="inquiry.trust3.sub">Długi pobyt, duża grupa — zapytaj.</span>
      </div>
    </div>
  </div>
</div>`;
  }

  /* ════════════════════════════════════════════════════════════
     HTML: TRANSPARENT — tylko kalendarz
     ════════════════════════════════════════════════════════════ */
  function calendarHTML() {
    return `
<div class="section-header section-header--center">
  <p class="section-label" data-i18n="availability.label">Dostępność</p>
  <h2 class="section-title">
    <span data-i18n="availability.title1">Sprawdź wolne</span>
    <em data-i18n="availability.title2">terminy</em>
  </h2>
  <p class="section-desc" data-i18n="availability.desc">
    Wybierz termin i skontaktuj się z nami — rezerwacja bezpośrednia.
  </p>
</div>
<div id="availability-calendar"></div>`;
  }

  /* ── Start ───────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
