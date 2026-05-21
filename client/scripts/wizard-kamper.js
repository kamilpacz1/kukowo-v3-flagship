/* wizard-kamper.js — v4 EVENT DELEGATION */

window.initWizardKamper = function () {
  const modal = document.getElementById('reservationModal');
  if (!modal) { console.error('[wizardK] BRAK #reservationModal'); return; }

  modal.dataset.step = '0';

  const today = new Date().toISOString().slice(0, 10);
  const arrEl = modal.querySelector('#w-arrival');
  const depEl = modal.querySelector('#w-departure');
  if (arrEl) arrEl.min = today;
  if (depEl) depEl.min = today;

  renderStepK(modal, 0);

  if (!modal.dataset.handlerBound) {
    modal.addEventListener('click', function (e) {
      const t = e.target;
      if (t.closest('#closeModal') || t.closest('#wizBackdrop') ||
          (t.matches && t.matches('#wizBackdrop'))) {
        e.preventDefault();
        modal.style.display = 'none';
        document.body.style.overflow = '';
        return;
      }
      if (t.closest('#nextBtn')) {
        e.preventDefault();
        const current = parseInt(modal.dataset.step) || 0;
        const panels = modal.querySelectorAll('.wiz-panel');
        console.log('[wizardK] Dalej. current=' + current + ' panels=' + panels.length);
        if (current < panels.length - 1) {
          modal.dataset.step = String(current + 1);
          renderStepK(modal, current + 1);
        }
        return;
      }
      if (t.closest('#prevBtn')) {
        e.preventDefault();
        const current = parseInt(modal.dataset.step) || 0;
        if (current > 0) {
          modal.dataset.step = String(current - 1);
          renderStepK(modal, current - 1);
        }
        return;
      }
    });
    modal.dataset.handlerBound = 'true';
  }

  const form = modal.querySelector('#wizardForm');
  if (form && !form.dataset.submitBound) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmitK(modal, form);
    });
    form.dataset.submitBound = 'true';
  }

  console.log('[wizardK] initialized. panels=' +
    modal.querySelectorAll('.wiz-panel').length);
};

function renderStepK(modal, n) {
  const panels   = modal.querySelectorAll('.wiz-panel');
  const stepDots = modal.querySelectorAll('.wiz-step');
  const prevBtn  = modal.querySelector('#prevBtn');
  const nextBtn  = modal.querySelector('#nextBtn');
  const submitBtn= modal.querySelector('#submitBtn');

  panels.forEach((p, i) => { p.style.display = i === n ? 'block' : 'none'; });
  stepDots.forEach((d, i) => {
    d.classList.toggle('active', i === n);
    d.classList.toggle('done',   i < n);
  });
  if (prevBtn) prevBtn.disabled = n === 0;
  if (nextBtn) nextBtn.style.display = n < panels.length - 1 ? 'inline-flex' : 'none';
  if (submitBtn) submitBtn.style.display = n === panels.length - 1 ? 'inline-flex' : 'none';

  if (n === panels.length - 1) buildSummaryK(modal);
}

function buildSummaryK(modal) {
  const box = modal.querySelector('#kamperSummary');
  if (!box) return;
  const v  = id => (modal.querySelector('#' + id) || {}).value || '—';
  const vn = nm => (modal.querySelector('[name="' + nm + '"]') || {}).value || '—';
  box.innerHTML =
    '<p><strong>Przyjazd:</strong> ' + v('w-arrival') + ' → ' + v('w-departure') + '</p>' +
    '<p><strong>Osoby:</strong> ' + v('w-adults') + ' dorosłych, ' + v('w-children') + ' dzieci</p>' +
    '<p><strong>Pojazd:</strong> ' + vn('vehicle') + '</p>' +
    '<hr style="border:none;border-top:1px solid var(--clr-sand);margin:.75rem 0">' +
    '<p><strong>' + v('w-name') + '</strong></p>' +
    '<p>' + v('w-email') + ' · ' + v('w-phone') + '</p>';
}

function handleSubmitK(modal, form) {
  const v = id => (modal.querySelector('#' + id) || {}).value || '';
  const vn= nm => (modal.querySelector('[name="' + nm + '"]') || {}).value || '';
  const response = modal.querySelector('.wiz-response');
  const submitBtn = modal.querySelector('#submitBtn');

  if (!v('w-arrival') || !v('w-name') || !v('w-email')) {
    if (response) { response.textContent = 'Uzupełnij datę, imię i e-mail.'; response.style.color = '#B33A3A'; }
    return;
  }
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⌛'; }

  const params = {
    from_name: v('w-name'), reply_to: v('w-email'),
    offer: 'Kamperowisko · ' + vn('vehicle'),
    arrival: v('w-arrival'), departure: v('w-departure'),
    adults: v('w-adults'), children: v('w-children'),
    phone: v('w-phone'), email: v('w-email'),
    message: v('w-message') || '—',
  };

  if (window.emailjs) {
    emailjs.send('service_g6tanel', 'template_991rdou', params)
      .then(() => {
        if (response) { response.textContent = '✓ Wysłano!'; response.style.color = 'var(--clr-sage)'; }
        setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = ''; }, 2500);
      })
      .catch(() => {
        if (response) { response.textContent = '✗ Zadzwoń: +48 604 083 659'; response.style.color = '#B33A3A'; }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Wyślij'; }
      });
  } else {
    if (response) response.textContent = '✓ Dziękujemy!';
    setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = ''; }, 2000);
  }
}
