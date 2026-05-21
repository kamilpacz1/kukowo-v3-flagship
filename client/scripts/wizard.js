/* wizard.js — v4 EVENT DELEGATION
   Klikanie obsługiwane na poziomie modala (delegation)
   — działa nawet jeśli i18n.refresh() przebuduje DOM */

window.initWizard = function (offerName) {
  const modal = document.getElementById('reservationModal');
  if (!modal) { console.error('[wizard] BRAK #reservationModal'); return; }

  // State w atrybucie data — nie w closure (przeżywa rebuilds DOM)
  modal.dataset.step = '0';
  modal.dataset.offerName = offerName || '';

  // Pre-fill oferta
  const roomDisplay = modal.querySelector('#selectedRoomType');
  const roomHidden  = modal.querySelector('#roomTypeField');
  if (offerName) {
    if (roomDisplay) roomDisplay.value = offerName;
    if (roomHidden)  roomHidden.value  = offerName;
  }

  // Daty min = dzisiaj
  const today = new Date().toISOString().slice(0, 10);
  const arrEl = modal.querySelector('#modalArrival');
  const depEl = modal.querySelector('#modalDeparture');
  if (arrEl) arrEl.min = today;
  if (depEl) depEl.min = today;

  // Initial render
  renderStep(modal, 0);

  // ── EVENT DELEGATION ──
  // Jedno listener na cały modal. Obsługuje WSZYSTKIE kliki w środku.
  // Jeśli i18n.refresh() przebuduje DOM, ten handler dalej działa
  // bo jest zarejestrowany na #reservationModal (który nie jest zmieniany).
  if (!modal.dataset.handlerBound) {
    modal.addEventListener('click', function (e) {
      const t = e.target;

      // Zamknięcie
      if (t.closest('#closeModal') || t.closest('#wizBackdrop') ||
          (t.matches && t.matches('#wizBackdrop'))) {
        e.preventDefault();
        modal.style.display = 'none';
        document.body.style.overflow = '';
        console.log('[wizard] closed');
        return;
      }

      // Dalej
      if (t.closest('#nextBtn')) {
        e.preventDefault();
        const current = parseInt(modal.dataset.step) || 0;
        const panels  = modal.querySelectorAll('.wiz-panel');
        console.log('[wizard] Dalej clicked. current=' + current + ' panels=' + panels.length);
        if (current < panels.length - 1) {
          const next = current + 1;
          modal.dataset.step = String(next);
          renderStep(modal, next);
          console.log('[wizard] → step ' + next);
        } else {
          console.warn('[wizard] cannot go further — at last step');
        }
        return;
      }

      // Wstecz
      if (t.closest('#prevBtn')) {
        e.preventDefault();
        const current = parseInt(modal.dataset.step) || 0;
        if (current > 0) {
          const prev = current - 1;
          modal.dataset.step = String(prev);
          renderStep(modal, prev);
          console.log('[wizard] ← step ' + prev);
        }
        return;
      }
    });
    modal.dataset.handlerBound = 'true';
    console.log('[wizard] click delegation bound to modal');
  }

  // Submit
  const form = modal.querySelector('#wizardForm');
  if (form && !form.dataset.submitBound) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(modal, form);
    });
    form.dataset.submitBound = 'true';
  }

  console.log('[wizard] initialized. panels=' +
    modal.querySelectorAll('.wiz-panel').length + ' offerName=' + offerName);
};

function renderStep(modal, n) {
  const panels   = modal.querySelectorAll('.wiz-panel');
  const stepDots = modal.querySelectorAll('.wiz-step');
  const prevBtn  = modal.querySelector('#prevBtn');
  const nextBtn  = modal.querySelector('#nextBtn');
  const submitBtn= modal.querySelector('#submitBtn');

  panels.forEach((p, i) => {
    p.style.display = i === n ? 'block' : 'none';
  });
  stepDots.forEach((d, i) => {
    d.classList.toggle('active', i === n);
    d.classList.toggle('done',   i < n);
  });

  if (prevBtn) prevBtn.disabled = n === 0;
  if (nextBtn) nextBtn.style.display = n < panels.length - 1 ? 'inline-flex' : 'none';
  if (submitBtn) submitBtn.style.display = n === panels.length - 1 ? 'inline-flex' : 'none';

  if (n === panels.length - 1) buildSummary(modal);
}

function buildSummary(modal) {
  const box = modal.querySelector('#wizSummary');
  if (!box) return;
  const v = id => (modal.querySelector('#' + id) || {}).value || '—';
  box.innerHTML =
    '<p><strong>Oferta:</strong> ' + (modal.querySelector('#selectedRoomType')?.value || '—') + '</p>' +
    '<p><strong>Pobyt:</strong> ' + v('modalArrival') + ' → ' + v('modalDeparture') + '</p>' +
    '<p><strong>Goście:</strong> ' + v('modalAdults') + ' dorosłych, ' + v('modalChildren') + ' dzieci, zwierzęta: ' + v('modalAnimals') + '</p>' +
    '<hr style="border:none;border-top:1px solid var(--clr-sand);margin:.75rem 0">' +
    '<p><strong>' + v('firstName') + ' ' + v('lastName') + '</strong></p>' +
    '<p>' + v('phone') + ' · ' + v('email') + '</p>';
}

function handleSubmit(modal, form) {
  const v = id => (modal.querySelector('#' + id) || {}).value || '';
  const response = modal.querySelector('.wiz-response');
  const submitBtn = modal.querySelector('#submitBtn');

  if (!v('modalArrival') || !v('modalDeparture') || !v('firstName') || !v('email')) {
    if (response) { response.textContent = 'Uzupełnij datę, imię i e-mail.'; response.style.color = '#B33A3A'; }
    return;
  }
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⌛ Wysyłam…'; }

  const params = {
    from_name: v('firstName') + ' ' + v('lastName'),
    reply_to:  v('email'),
    offer:     modal.querySelector('#selectedRoomType')?.value || '—',
    arrival:   v('modalArrival'),
    departure: v('modalDeparture'),
    adults:    v('modalAdults'),
    children:  v('modalChildren'),
    animals:   v('modalAnimals'),
    phone:     v('phone'),
    email:     v('email'),
    message:   v('message') || '—',
  };

  if (window.emailjs) {
    emailjs.send('service_g6tanel', 'template_991rdou', params)
      .then(() => {
        if (response) { response.textContent = '✓ Wysłano!'; response.style.color = 'var(--clr-sage)'; }
        setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = ''; }, 2500);
      })
      .catch(() => {
        if (response) { response.textContent = '✗ Błąd. Zadzwoń: +48 604 083 659'; response.style.color = '#B33A3A'; }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Wyślij zapytanie'; }
      });
  } else {
    if (response) response.textContent = '✓ Dziękujemy!';
    setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = ''; }, 2000);
  }
}
