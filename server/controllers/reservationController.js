const nodemailer = require('nodemailer');
const config = require('../config/nodemailer-config');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'siedliskokonradowka@gmail.com';
const FROM_EMAIL  = process.env.EMAIL_USER || 'siedliskokonradowka@gmail.com';

let transporter = null;
function getTransporter() {
  if (!transporter) transporter = nodemailer.createTransport(config);
  return transporter;
}

exports.handleReservation = async (req, res) => {
  const { name, email, phone, date, arrival, departure, guests, adults, children, message, roomType } = req.body;

  // Walidacja
  if (!name || !email || (!date && !arrival)) {
    return res.status(400).json({ message: 'Uzupełnij wymagane pola: imię, e-mail, data.' });
  }

  // Honeypot — jeżeli wypełnione, udajemy że przyjęliśmy ale nic nie wysyłamy
  if (req.body._hp) {
    return res.status(200).json({ message: 'OK' });
  }

  const subject = `Nowa rezerwacja — ${roomType || 'Siedlisko Konradówka'}`;
  const text = [
    'Nowa rezerwacja ze strony kukowo.pl',
    '────────────────────────────────────',
    `Obiekt:        ${roomType || '—'}`,
    `Imię i email:  ${name} <${email}>`,
    phone ? `Telefon:       ${phone}` : null,
    `Przyjazd:      ${arrival || date || '—'}`,
    departure ? `Wyjazd:        ${departure}` : null,
    `Goście:        ${guests || `${adults || '?'} dorosłych${children ? `, ${children} dzieci` : ''}`}`,
    '',
    'Wiadomość od gościa:',
    message || '(brak)',
    '',
    '────────────────────────────────────',
    `Wysłano: ${new Date().toLocaleString('pl-PL')}`
  ].filter(Boolean).join('\n');

  try {
    await getTransporter().sendMail({
      from: `"Siedlisko Konradówka" <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject,
      text
    });
    return res.status(200).json({ message: 'Rezerwacja wysłana pomyślnie.' });
  } catch (err) {
    console.error('Błąd wysyłki maila:', err);
    return res.status(500).json({ message: 'Wystąpił problem podczas wysyłki rezerwacji.' });
  }
};
