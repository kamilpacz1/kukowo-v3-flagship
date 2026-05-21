/**
 * Konfiguracja Nodemailer (fallback / kanał B)
 *
 * UWAGA: aktualnie formularze rezerwacyjne (wizard.html, wizard-kamper.html)
 * wysyłają zgłoszenia przez frontendowy EmailJS:
 *   - Service ID:  service_g6tanel
 *   - Template ID: template_991rdou
 *   - Public Key:  WU6nK13OCtPUDJJad
 * (patrz: client/scripts/email.js)
 *
 * Backend Nodemailer to opcjonalny kanał awaryjny — używany przez
 * endpoint POST /api/reservation. Aby go aktywować:
 *
 * 1. Skopiuj .env.example do .env i uzupełnij dane:
 *      EMAIL_USER=siedliskokonradowka@gmail.com
 *      EMAIL_PASS=xxxxxxxxxxxxxxxx        # hasło aplikacji Gmail
 *
 * 2. Dla Gmaila: wygeneruj "hasło aplikacji" w ustawieniach konta:
 *    https://myaccount.google.com/apppasswords
 *    (wymaga włączonej weryfikacji dwuetapowej)
 *
 * 3. Restart serwera: npm start
 */

require('dotenv').config();

module.exports = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'siedliskokonradowka@gmail.com',
    pass: process.env.EMAIL_PASS || ''
  }
};
