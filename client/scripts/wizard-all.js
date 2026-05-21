/* wizard-all.js — kompletny wizard w jednym pliku
   Wstrzykuje własny HTML i obsługuje wszystko.
   Wywołanie z podstrony:
     Wizard.open({ offerName: 'Konradowe Chaty', kamper: false });
*/

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────
  // HTML jako string — gwarantowane spójne z JS
  // ────────────────────────────────────────────────────────────
  const HTML_STAY = `
<div id="wizModal" class="wiz-modal" style="display:none">
  <div class="wiz-backdrop" data-close="1"></div>
  <div class="wiz-dialog">

    <div class="wiz-header">
      <div class="wiz-header__top">
        <div>
          <p class="wiz-header__label">REZERWACJA BEZPOŚREDNIA</p>
          <h2 class="wiz-header__title" id="wizTitle">Zapytanie o pobyt</h2>
        </div>
        <button type="button" class="wiz-close" data-close="1" aria-label="Zamknij">✕</button>
      </div>
      <a href="tel:+48604083659" class="wiz-phone">☎ Lub zadzwoń: +48 604 083 659</a>
    </div>

    <div class="wiz-steps">
      <div class="wiz-step active" data-idx="0"><span class="wiz-step__dot">1</span><span class="wiz-step__lbl">Pobyt</span></div>
      <div class="wiz-step__line"></div>
      <div class="wiz-step" data-idx="1"><span class="wiz-step__dot">2</span><span class="wiz-step__lbl">Kontakt</span></div>
      <div class="wiz-step__line"></div>
      <div class="wiz-step" data-idx="2"><span class="wiz-step__dot">3</span><span class="wiz-step__lbl">Wyślij</span></div>
    </div>

    <form id="wizForm" class="wiz-form" novalidate>
        <!-- Honeypot anti-spam -->
        <input type="text" name="hp_field" id="hp_field" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;opacity:0;pointer-events:none" aria-hidden="true">

      <div class="wiz-body">

        <!-- PANEL 0 -->
        <div class="wiz-panel" data-panel="0">
          <div class="wiz-field">
            <label class="wiz-label">WYBRANA OFERTA</label>
            <input id="wOffer" name="roomType" class="wiz-input wiz-input--ro" readonly value="">
          </div>
          <div class="wiz-row">
            <div class="wiz-field">
              <label class="wiz-label">DOROŚLI</label>
              <input id="wAdults" name="modalAdults" class="wiz-input" type="number" min="1" value="2">
            </div>
            <div class="wiz-field">
              <label class="wiz-label">DZIECI</label>
              <input id="wChildren" name="modalChildren" class="wiz-input" type="number" min="0" value="0">
            </div>
          </div>
          <div class="wiz-field">
            <label class="wiz-check">
              <input type="checkbox" id="wAnimalsToggle">
              <span class="wiz-check__box"></span>
              <span class="wiz-check__lbl">Podróżuję ze zwierzęciem</span>
            </label>
            <div class="wiz-animals" id="wAnimalsDetail" hidden>
              <p class="wiz-animals__note">
                Pobyt ze zwierzęciem ustalamy zawsze indywidualnie — napisz nam parę słów o swoim pupilu, a ustalimy szczegóły.
              </p>
              <div class="wiz-row">
                <div class="wiz-field">
                  <label class="wiz-label">JAKIE I ILE?</label>
                  <input id="wAnimals" name="modalAnimals" class="wiz-input" type="text" placeholder="np. 1 mały pies" value="">
                </div>
              </div>
            </div>
          </div>
          <div class="wiz-row">
            <div class="wiz-field">
              <label class="wiz-label">DATA PRZYJAZDU</label>
              <input id="wArrival" name="modalArrival" class="wiz-input" type="date">
            </div>
            <div class="wiz-field">
              <label class="wiz-label">DATA WYJAZDU</label>
              <input id="wDeparture" name="modalDeparture" class="wiz-input" type="date">
            </div>
          </div>
        </div>

        <!-- PANEL 1 -->
        <div class="wiz-panel" data-panel="1" style="display:none">
          <div class="wiz-row">
            <div class="wiz-field">
              <label class="wiz-label">IMIĘ</label>
              <input id="wFirst" name="firstName" class="wiz-input" type="text" autocomplete="given-name">
            </div>
            <div class="wiz-field">
              <label class="wiz-label">NAZWISKO</label>
              <input id="wLast" name="lastName" class="wiz-input" type="text" autocomplete="family-name">
            </div>
          </div>
          <div class="wiz-field">
            <label class="wiz-label">TELEFON</label>
            <input id="wPhone" name="phone" class="wiz-input" type="tel" placeholder="+48 600 000 000" autocomplete="tel">
          </div>
          <div class="wiz-field">
            <label class="wiz-label">E-MAIL</label>
            <input id="wEmail" name="email" class="wiz-input" type="email" autocomplete="email">
          </div>
        </div>

        <!-- PANEL 2 -->
        <div class="wiz-panel" data-panel="2" style="display:none">
          <div class="wiz-field">
            <label class="wiz-label">DODATKOWE PYTANIA LUB UWAGI</label>
            <textarea id="wMessage" name="message" class="wiz-input wiz-ta" rows="3"></textarea>
          </div>
          <div id="wSummary" class="wiz-summary"></div>

          <label class="wiz-check wiz-check--privacy">
            <input type="checkbox" id="wPrivacy">
            <span class="wiz-check__box"></span>
            <span class="wiz-check__lbl">Akceptuję <a href="polityka-prywatnosci.html" target="_blank">politykę prywatności</a> i wyrażam zgodę na przetwarzanie podanych danych w celu odpowiedzi na zapytanie.</span>
          </label>
        </div>

        <p id="wResponse" class="wiz-response"></p>
      </div>

      <div class="wiz-nav">
        <button type="button" id="wPrev" class="wiz-btn wiz-btn--ghost" disabled>
          ← Wstecz
        </button>
        <div class="wiz-nav-r">
          <button type="button" id="wNext" class="wiz-btn wiz-btn--primary">
            Dalej →
          </button>
          <button type="submit" id="wSubmit" class="wiz-btn wiz-btn--primary" style="display:none">
            ✉ Wyślij zapytanie
          </button>
        </div>
      </div>

    </form>
  </div>
</div>`;

  // ────────────────────────────────────────────────────────────
  // CSS jako string — wstrzykiwane do <head>
  // ────────────────────────────────────────────────────────────
  const CSS = `
.wiz-modal{position:fixed;inset:0;z-index:99999;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:2rem 1rem;display:none}
.wiz-modal.open{display:flex !important;align-items:flex-start;justify-content:center}
.wiz-backdrop{position:fixed;inset:0;background:rgba(15,28,18,.72);backdrop-filter:blur(4px);cursor:pointer}
.wiz-dialog{position:relative;z-index:1;background:#FDFAF5;border-radius:16px;width:100%;max-width:520px;box-shadow:0 24px 64px rgba(15,28,18,.35);overflow:hidden;margin:auto 0;font-family:system-ui,-apple-system,sans-serif}
.wiz-header{background:#1E3528;padding:1.5rem 1.75rem 1.25rem;color:#FDFAF5}
.wiz-header__top{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:.75rem}
.wiz-header__label{font-size:.7rem;letter-spacing:.12em;color:rgba(196,154,60,.7);margin:0 0 4px}
.wiz-header__title{font-family:Georgia,serif;font-size:1.5rem;font-weight:500;margin:0;line-height:1.2}
.wiz-close{background:rgba(255,255,255,.1);border:none;color:rgba(255,255,255,.7);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;flex-shrink:0}
.wiz-close:hover{background:rgba(255,255,255,.2);color:#fff}
.wiz-phone{display:inline-block;font-size:.875rem;color:rgba(253,250,245,.65);text-decoration:none}
.wiz-phone:hover{color:#E0BE6A}
.wiz-steps{display:flex;align-items:center;padding:1.25rem 1.75rem;background:#F2EBE0;border-bottom:1px solid #E4D9CA;gap:8px}
.wiz-step{display:flex;align-items:center;gap:6px;flex-shrink:0}
.wiz-step__dot{width:26px;height:26px;border-radius:50%;background:#E4D9CA;color:#6B7670;font-size:.7rem;font-weight:600;display:flex;align-items:center;justify-content:center}
.wiz-step__lbl{font-size:.8rem;font-weight:500;color:#6B7670}
.wiz-step.active .wiz-step__dot{background:#4A7C59;color:#fff}
.wiz-step.active .wiz-step__lbl{color:#1E3528}
.wiz-step.done .wiz-step__dot{background:#4A7C59;color:#fff}
.wiz-step__line{flex:1;height:1px;background:#E4D9CA}
.wiz-form{width:100%}
.wiz-body{padding:1.5rem 1.75rem;display:flex;flex-direction:column;gap:.875rem}
.wiz-panel{display:flex;flex-direction:column;gap:.875rem}
.wiz-row{display:grid;grid-template-columns:1fr 1fr;gap:.875rem}
.wiz-field{display:flex;flex-direction:column;gap:.3rem}
.wiz-label{font-size:.7rem;font-weight:600;letter-spacing:.07em;color:#6B7670;text-transform:uppercase}
.wiz-input{width:100%;padding:.65rem .875rem;background:#FDFAF5;border:1.5px solid #E4D9CA;border-radius:8px;font:inherit;font-size:.95rem;color:#2B2B2B;box-sizing:border-box}
.wiz-input:focus{outline:none;border-color:#4A7C59;box-shadow:0 0 0 3px rgba(74,124,89,.12)}
.wiz-input--ro{background:#F2EBE0;color:#1E3528;font-weight:500}
.wiz-ta{resize:vertical;min-height:90px;line-height:1.6}
.wiz-hint{font-size:.7rem;color:#6B7670;font-style:italic;margin:0}
.wiz-summary{background:#F2EBE0;border-radius:10px;padding:1rem;font-size:.875rem;line-height:1.7;color:#2B2B2B;border:1px solid #E4D9CA}
.wiz-summary p{margin:0 0 4px}
.wiz-nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.75rem 1.25rem;background:#FDFAF5;border-top:1px solid #E4D9CA}
.wiz-nav-r{display:flex;gap:.5rem}
.wiz-btn{display:inline-flex;align-items:center;gap:6px;padding:.65rem 1.25rem;border-radius:8px;font:inherit;font-size:.875rem;font-weight:600;cursor:pointer;border:none}
.wiz-btn--ghost{background:transparent;color:#6B7670;border:1.5px solid #E4D9CA}
.wiz-btn--ghost:hover:not(:disabled){border-color:#5C4A3A;color:#2B2B2B}
.wiz-btn--ghost:disabled{opacity:.4;cursor:not-allowed}
.wiz-btn--primary{background:#4A7C59;color:#fff}
.wiz-btn--primary:hover{background:#3D6749}
.wiz-response{font-size:.875rem;text-align:center;margin:.5rem 0 0;min-height:1.2em;color:#4A7C59}
.wiz-check{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:.875rem;color:#2B2B2B;padding:6px 0;user-select:none}
.wiz-check input{position:absolute;opacity:0;pointer-events:none}
.wiz-check__box{width:20px;height:20px;border:1.5px solid #E4D9CA;border-radius:5px;background:#FDFAF5;flex-shrink:0;position:relative;transition:all .15s}
.wiz-check:hover .wiz-check__box{border-color:#4A7C59}
.wiz-check input:checked+.wiz-check__box{background:#4A7C59;border-color:#4A7C59}
.wiz-check input:checked+.wiz-check__box::after{content:"";position:absolute;left:6px;top:2px;width:5px;height:10px;border:solid white;border-width:0 2px 2px 0;transform:rotate(45deg)}
.wiz-check__lbl{font-weight:500}
.wiz-check--privacy{align-items:flex-start;gap:10px;margin-top:1rem;padding:.75rem;background:#F2EBE0;border-radius:8px}
.wiz-check--privacy .wiz-check__lbl{font-weight:400;font-size:.85rem;line-height:1.55}
.wiz-check--privacy a{color:#4A7C59;text-decoration:underline;text-underline-offset:2px}
.wiz-check--privacy a:hover{color:#3D6749}
.wiz-animals{background:#F2EBE0;border-left:3px solid #C49A3C;padding:.875rem 1rem;border-radius:6px;margin-top:.5rem;animation:wiz-slide .25s ease-out}
@keyframes wiz-slide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.wiz-animals__note{font-size:.85rem;line-height:1.65;color:#5C4A3A;margin:0 0 .75rem}
.wiz-animals__note strong{color:#1E3528;font-weight:600}
@media (max-width:560px){
  .wiz-modal{padding:1rem .5rem}
  .wiz-dialog{border-radius:12px}
  .wiz-header,.wiz-body,.wiz-steps,.wiz-nav{padding-left:1.25rem;padding-right:1.25rem}
  .wiz-row{grid-template-columns:1fr}
  .wiz-step__lbl{display:none}
}
`;

  // ────────────────────────────────────────────────────────────
  // Build & inject — runs once on first open
  // ────────────────────────────────────────────────────────────
  let built = false;
  let currentStep = 0;
  let currentOffer = '';

  function build() {
    if (built) return;
    // Inject CSS
    const style = document.createElement('style');
    style.id = 'wiz-style';
    style.textContent = CSS;
    document.head.appendChild(style);
    // Inject HTML
    const wrap = document.createElement('div');
    wrap.innerHTML = HTML_STAY;
    document.body.appendChild(wrap.firstElementChild);

    bindHandlers();
    built = true;
    console.log('[Wizard] built and ready');
  }

  function bindHandlers() {
    const modal = document.getElementById('wizModal');
    if (!modal) { console.error('[Wizard] modal not found after build'); return; }

    // ONE delegated click handler on modal
    modal.addEventListener('click', function (e) {
      const t = e.target;

      // Close
      if (t.dataset.close === '1' || t.classList.contains('wiz-close')) {
        close();
        return;
      }

      // Next
      if (t.id === 'wNext' || t.closest('#wNext')) {
        e.preventDefault();
        nextStep();
        return;
      }

      // Prev
      if (t.id === 'wPrev' || t.closest('#wPrev')) {
        e.preventDefault();
        prevStep();
        return;
      }
    });

    // Submit
    document.getElementById('wForm')?.addEventListener('submit', submit);
    // Old id maybe different — try both
    document.getElementById('wizForm')?.addEventListener('submit', submit);

    // Date min = today
    const today = new Date().toISOString().slice(0, 10);
    const arr = document.getElementById('wArrival');
    const dep = document.getElementById('wDeparture');
    if (arr) arr.min = today;
    if (dep) dep.min = today;
    if (arr && dep) {
      arr.addEventListener('change', () => {
        dep.min = arr.value || today;
        if (dep.value && dep.value < arr.value) dep.value = '';
      });
    }

    // Animals toggle — show/hide detail
    const toggleEl = document.getElementById('wAnimalsToggle');
    const detailEl = document.getElementById('wAnimalsDetail');
    if (toggleEl && detailEl) {
      toggleEl.addEventListener('change', () => {
        detailEl.hidden = !toggleEl.checked;
        const inp = document.getElementById('wAnimals');
        if (inp && !toggleEl.checked) inp.value = '';
      });
    }

    // ESC close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    // Swipe gestures for step navigation (mobile only)
    let touchStartX = null, touchStartY = null;
    modal.addEventListener('touchstart', e => {
      // Ignore if touching form fields
      if (e.target.matches('input, textarea, select, button, a')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    modal.addEventListener('touchend', e => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      // Only horizontal swipes (ignore scrolling)
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
        if (dx < 0) nextStep();  // swipe left → next
        else        prevStep();  // swipe right → prev
      }
      touchStartX = touchStartY = null;
    }, { passive: true });

  }

  function open(opts) {
    build();
    opts = opts || {};
    currentOffer = opts.offerName || '';
    currentStep = 0;

    const offerInput = document.getElementById('wOffer');
    if (offerInput) offerInput.value = currentOffer;

    if (opts.preArrival) {
      const a = document.getElementById('wArrival');
      if (a) a.value = opts.preArrival;
    }

    showStep(0);
    const modal = document.getElementById('wizModal');
    if (modal) {
      modal.classList.add('open');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      console.log('[Wizard] opened. offer=' + currentOffer);
    }
  }

  function close() {
    const modal = document.getElementById('wizModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function showStep(n) {
    currentStep = n;
    const panels = document.querySelectorAll('#wizModal .wiz-panel');
    const dots   = document.querySelectorAll('#wizModal .wiz-step');
    panels.forEach((p, i) => { p.style.display = i === n ? 'block' : 'none'; });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === n);
      d.classList.toggle('done',   i < n);
    });
    const prev = document.getElementById('wPrev');
    const next = document.getElementById('wNext');
    const sub  = document.getElementById('wSubmit');
    if (prev) prev.disabled = n === 0;
    if (next) next.style.display = n < panels.length - 1 ? 'inline-flex' : 'none';
    if (sub)  sub.style.display  = n === panels.length - 1 ? 'inline-flex' : 'none';
    if (n === panels.length - 1) buildSummary();
    console.log('[Wizard] showStep(' + n + ') panels=' + panels.length);
  }

  function nextStep() {
    const panels = document.querySelectorAll('#wizModal .wiz-panel');
    console.log('[Wizard] nextStep clicked. current=' + currentStep + ' max=' + (panels.length - 1));
    if (currentStep < panels.length - 1) {
      showStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) showStep(currentStep - 1);
  }

  function buildSummary() {
    const box = document.getElementById('wSummary');
    if (!box) return;
    const v = id => (document.getElementById(id) || {}).value || '—';
    box.innerHTML =
      '<p><strong>Oferta:</strong> ' + currentOffer + '</p>' +
      '<p><strong>Pobyt:</strong> ' + v('wArrival') + ' → ' + v('wDeparture') + '</p>' +
      '<p><strong>Goście:</strong> ' + v('wAdults') + ' dorosłych, ' + v('wChildren') + ' dzieci</p>' +
      (v('wAnimals') ? '<p><strong>Zwierzęta:</strong> ' + v('wAnimals') + ' <em>(do uzgodnienia)</em></p>' : '') +
      '<hr style="border:none;border-top:1px solid #E4D9CA;margin:.75rem 0">' +
      '<p><strong>' + v('wFirst') + ' ' + v('wLast') + '</strong></p>' +
      '<p>' + v('wPhone') + ' · ' + v('wEmail') + '</p>';
  }

  function submit(e) {
    e.preventDefault();
    const v = id => (document.getElementById(id) || {}).value || '';
    const resp = document.getElementById('wResponse');
    const btn  = document.getElementById('wSubmit');

    if (!v('wArrival') || !v('wDeparture') || !v('wFirst') || !v('wEmail')) {
      if (resp) { resp.textContent = '✗ Uzupełnij datę, imię i e-mail.'; resp.style.color = '#B33A3A'; }
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = '⌛ Wysyłam…'; }

    // ── reCAPTCHA v3 ──
    // Aby aktywować, zarejestruj klucz na https://www.google.com/recaptcha/admin
    // i podmień RECAPTCHA_SITE_KEY na rzeczywisty klucz publiczny
    const RECAPTCHA_SITE_KEY = window.RECAPTCHA_SITE_KEY || null;
    const sendWithCaptcha = (token) => {
      if (token) {
        const form = document.getElementById('wizForm');
        // Inject g-recaptcha-response hidden input
        let captchaField = form.querySelector('[name="g-recaptcha-response"]');
        if (!captchaField) {
          captchaField = document.createElement('input');
          captchaField.type = 'hidden';
          captchaField.name = 'g-recaptcha-response';
          form.appendChild(captchaField);
        }
        captchaField.value = token;
      }
      doSendEmail();
    };
    if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
      grecaptcha.ready(() => {
        grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' })
          .then(sendWithCaptcha)
          .catch(() => sendWithCaptcha(null));  // proceed even on captcha fail
      });
    } else {
      sendWithCaptcha(null);
    }
    return;
  }

  function doSendEmail() {
    const v = id => (document.getElementById(id) || {}).value || '';
    const resp = document.getElementById('wResponse');
    const btn  = document.getElementById('wSubmit');

    // Honeypot — bot wypełnił ukryte pole, udajemy sukces (nie wysyłamy)
    const hp = document.getElementById('hp_field');
    if (hp && hp.value) {
      if (resp) { resp.textContent = '✓ Wysłano! Odezwiemy się wkrótce.'; resp.style.color = '#4A7C59'; }
      setTimeout(close, 2500);
      return;
    }

    // Client-side throttle — max 1 wysłanie / 30 sekund
    const lastSent = sessionStorage.getItem('lastSubmit_kk');
    if (lastSent && Date.now() - parseInt(lastSent) < 30000) {
      const wait = Math.ceil((30000 - (Date.now() - parseInt(lastSent))) / 1000);
      if (resp) { resp.textContent = '⏱ Poczekaj ' + wait + 's przed kolejnym wysłaniem.'; resp.style.color = '#B33A3A'; }
      if (btn) { btn.disabled = false; btn.textContent = '✉ Wyślij zapytanie'; }
      return;
    }
    sessionStorage.setItem('lastSubmit_kk', Date.now().toString());

    // RODO — sprawdź akceptację polityki
    const privacyCheckbox = document.getElementById('wPrivacy');
    if (privacyCheckbox && !privacyCheckbox.checked) {
      if (resp) { resp.textContent = '✗ Zaakceptuj politykę prywatności'; resp.style.color = '#B33A3A'; }
      if (btn) { btn.disabled = false; btn.textContent = '✉ Wyślij zapytanie'; }
      return;
    }

    const params = {
      from_name: v('wFirst') + ' ' + v('wLast'),
      reply_to:  v('wEmail'),
      offer:     currentOffer,
      arrival:   v('wArrival'),
      departure: v('wDeparture'),
      adults:    v('wAdults'),
      children:  v('wChildren'),
      animals:   v('wAnimals'),
      phone:     v('wPhone'),
      email:     v('wEmail'),
      message:   v('wMessage') || '—',
    };

    // Use sendForm — reads name="" attributes from inputs
    // matches EmailJS template variables: modalAdults, modalChildren, modalAnimals,
    // modalArrival, modalDeparture, firstName, lastName, email, phone, message, roomType
    const form = document.getElementById('wizForm');
    if (window.emailjs && form) {
      emailjs.sendForm('service_g6tanel', 'template_991rdou', form)
        .then(() => {
          if (resp) { resp.textContent = '✓ Wysłano! Odpiszemy wkrótce.'; resp.style.color = '#4A7C59'; }
          // AUTO-REPLY do gościa — aktywuj po stworzeniu template w EmailJS:
          // emailjs.sendForm('service_g6tanel', 'template_autoreply', form).catch(() => {});
          setTimeout(close, 2500);
        })
        .catch((err) => {
          console.error('[Wizard] EmailJS error:', err);
          if (resp) { resp.textContent = '✗ Błąd. Zadzwoń: +48 604 083 659'; resp.style.color = '#B33A3A'; }
          if (btn) { btn.disabled = false; btn.textContent = '✉ Wyślij zapytanie'; }
        });
    } else {
      if (resp) resp.textContent = '✓ Dziękujemy! Skontaktujemy się.';
      setTimeout(close, 2000);
    }
  }

  // Public API
  window.Wizard = { open: open, close: close };
})();
