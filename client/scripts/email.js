// scripts/email.js

// ← podmień na swoje ID:
const SERVICE_ID  = 'service_g6tanel';
const TEMPLATE_ID = 'template_991rdou';

// Mapa kodów pokoi na polskie nazwy (używana tylko na stronie Studia)
const ROOM_LABELS = {
  studio34: 'Studio 3–4 os.',
  studio4:  'Studio 4 os.',
  double:   'Pokój dwuosobowy'
};

/**
 * Właściwa obsługa submitu formularza .email-form
 */
async function handleEmailFormSubmit(form) {
  const resp          = form.querySelector('.form-response');
  const btn           = form.querySelector('button[type="submit"]');
  const arrival       = form.querySelector('[name="modalArrival"]');
  const depart        = form.querySelector('[name="modalDeparture"]');
  const roomTypeInput = form.querySelector('[name="roomType"]');
  resp.classList.remove('success','error');
  resp.textContent = '';

  // honeypot
  if (form.querySelector('[name="_hp"]').value) {
    console.warn('Honeypot wypełniony — odrzucone.');
    return;
  }

  // HTML5‐owa walidacja
  if (!form.checkValidity()) {
    resp.classList.add('error');
    resp.textContent = 'Proszę wypełnić wszystkie wymagane pola.';
    form.reportValidity();
    return;
  }

  // Sprawdzenie dat
  if (arrival && depart) {
    const a = new Date(arrival.value), d = new Date(depart.value);
    if (a > d) {
      resp.classList.add('error');
      resp.textContent = 'Data przyjazdu musi być przed datą wyjazdu.';
      return;
    }
  }

  // Jeżeli to Studia: zamapuj key→label
  if (roomTypeInput) {
    const raw = roomTypeInput.value;
    if (ROOM_LABELS[raw]) {
      roomTypeInput.value = ROOM_LABELS[raw];
    }
  }

  // disable button
  btn.disabled    = true;
  btn.textContent = 'Wysyłanie…';

  try {
    await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form);
    resp.classList.add('success');
    resp.textContent = 'Wysłano pomyślnie!';
    form.reset();
    // usuń ograniczenia dat
    if (depart)  depart.min  = '';
    if (arrival) arrival.max = '';
  } catch(err) {
    console.error('EmailJS error:', err);
    resp.classList.add('error');
    resp.textContent = 'Błąd wysyłki, spróbuj ponownie.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Wyślij zapytanie';
  }
}

// Delegujemy submit dla wszystkich formularzy .email-form (również tych wstrzykniętych później)
document.body.addEventListener('submit', e => {
  const form = e.target;
  if (form.classList.contains('email-form')) {
    e.preventDefault();
    handleEmailFormSubmit(form);
  }
});

// Ustawianie min/max dat także dynamcznie
document.body.addEventListener('change', e => {
  const fld = e.target;
  if (fld.name === 'modalArrival' || fld.name === 'modalDeparture') {
    const form = fld.form;
    const arrival = form.querySelector('[name="modalArrival"]');
    const depart  = form.querySelector('[name="modalDeparture"]');
    if (arrival && depart) {
      depart.min  = arrival.value;
      arrival.max = depart.value;
    }
  }
});
