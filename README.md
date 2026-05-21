# Siedlisko Konradówka — kukowo.pl

> **v3.0 — Flagship** · pełen redesign strony siedliska na Mazurach w Kukowie.
> Frontend statyczny + backend Node.js/Express + EmailJS + i18n (PL/EN/DE).

Wszystko co potrzeba do prowadzenia premium-noclegów online: **transparentny cennik**, **kalendarz dostępności** (koniec z overbookingiem), **przełącznik języków**, **prawdziwe opinie z Google** (Elfsight), **tabela porównawcza**, **sekcja "Jak dojechać"**, **SEO + rich snippets**, **pływający WhatsApp**.

---

## 🎯 Co nowego w v3 (vs v2)

| Funkcja | v2 | v3 |
|---|---|---|
| Ceny widoczne | ❌ | ✅ widełki sezonowe + pełny cennik (edycja w JSON) |
| Kalendarz dostępności | ❌ | ✅ 4 mc w przód, klikalny, edycja w JSON |
| Język | tylko PL | ✅ PL / EN / DE z przełącznikiem |
| Opinie | fake (text) | ✅ prawdziwe z Google przez Elfsight |
| Tabela porównawcza ofert | ❌ | ✅ |
| Sekcja "Jak dojechać" | ❌ | ✅ z czasami dojazdu |
| FAQ Schema (Google) | ❌ | ✅ rich snippets |
| Floating WhatsApp | ❌ | ✅ z pre-filled message |
| Sekcja cennikowa z zasadami | ❌ | ✅ co wliczone, co dodatkowo |

---

## 📁 Struktura projektu

```
siedlisko-konradowka/
├── client/                           # Frontend
│   ├── index.html                    # Strona główna
│   ├── konradowe-chaty.html          # Domki + cennik + kalendarz
│   ├── studia-stara-stajnia.html
│   ├── kamperowisko.html
│   ├── gallery.html
│   ├── atrakcje-w-siedlisku.html
│   ├── okoliczne-atrakcje.html
│   ├── header.html / footer.html     # Komponenty (lang switcher, WhatsApp)
│   ├── wizard.html / wizard-kamper.html
│   ├── data/
│   │   ├── pricing.json              # ⭐ CENNIK — edytuj wartości
│   │   ├── availability.json         # ⭐ DOSTĘPNOŚĆ — wpisuj zajęte daty
│   │   ├── news.json
│   │   └── upcoming.json
│   ├── i18n/
│   │   ├── pl.json                   # ⭐ TŁUMACZENIA polskie
│   │   ├── en.json                   # ⭐ angielskie
│   │   └── de.json                   # ⭐ niemieckie
│   ├── styles/main.css               # 2400+ linii, design system
│   ├── scripts/
│   │   ├── i18n.js                   # ⭐ wielojęzyczność
│   │   ├── pricing.js                # ⭐ widżet cennika
│   │   ├── availability.js           # ⭐ kalendarz dostępności
│   │   ├── main.js / load-*.js / wizard*.js / email.js / news.js / upcoming.js
│   ├── img/ + videos/
│
├── server/                           # Backend (Express + Nodemailer)
├── package.json + .env.example + .gitignore
└── README.md
```

---

## 🚀 Szybki start

```bash
npm install
npm run dev              # → http://localhost:3000
```

Wymagania: **Node.js 18+**.

---

## ✏️ Edycja treści (codzienna obsługa)

### 💰 Zmiana cen — `client/data/pricing.json`

```json
{
  "showPrices": true,                   // false → ukrywa ceny ("Wycena indywidualna")
  "konradowe-chaty": {
    "lowSeason":  { "from": 450, "to": 650 },     // niski sezon
    "highSeason": { "from": 700, "to": 950 },     // wysoki sezon
    "minNights": 2,
    "minNightsHighSeason": 3,
    "extras": [
      { "name": "Pies", "price": 30, "unit": "doba" }
    ],
    "included": ["Pościel", "Wi-Fi", ...]
  }
}
```

Po zapisaniu pliku — strona od razu pokazuje nowe ceny. Nie trzeba kompilować.

**Chcesz ukryć ceny?** Ustaw `"showPrices": false` i strona pokaże "Wycena indywidualna" we wszystkich miejscach.

### 📅 Zarządzanie dostępnością — `client/data/availability.json`

```json
{
  "konradowe-chaty": {
    "name": "Konradowe Chaty",
    "booked": [
      ["2025-07-15", "2025-07-22"],     // zakres: od → do (włącznie)
      ["2025-08-01", "2025-08-15"]
    ]
  }
}
```

**Workflow przeciw overbookingowi:**
1. Klient pyta o termin → sprawdzasz kalendarz fizyczny / Booking.com
2. Potwierdzasz rezerwację → otwierasz `availability.json`
3. Dodajesz zakres do `"booked"`, zapisujesz
4. Strona automatycznie blokuje te daty (pokazuje na szaro, nieklikalne)

### 🌐 Tłumaczenia — `client/i18n/{pl,en,de}.json`

Każdy klucz w jednym pliku ma odpowiednik w pozostałych. Zmieniasz tekst — strona od razu się aktualizuje (po odświeżeniu).

---

## 📨 Rezerwacje — dwa kanały

### Kanał A: EmailJS (frontend, domyślny)
Formularze w wizardach wysyłają zgłoszenia bezpośrednio przez [EmailJS](https://www.emailjs.com/) — bez backendu.

Konfiguracja w `client/scripts/email.js`:
- Service: `service_g6tanel`
- Template: `template_991rdou`
- Public Key: `WU6nK13OCtPUDJJad`

### Kanał B: Nodemailer (backend, fallback)
Endpoint `POST /api/reservation` przez Gmail SMTP.

```bash
cp .env.example .env
# Uzupełnij EMAIL_USER + EMAIL_PASS (Gmail App Password)
npm start
```

---

## 🎨 Design system (skrót)

**Kolory:**
- `--clr-forest #1E3528` · `--clr-sage #4A7C59` · `--clr-gold #C49A3C`
- `--clr-cream #FDFAF5` · `--clr-beige #F2EBE0` · `--clr-earth #2C2418`

**Typografia:**
- **Cormorant Garamond** — nagłówki + italic akcenty
- **DM Sans** — body + UI

**Breakpointy:** 1024px / 768px / 480px.

---

## ✅ Lista kontrolna przed publikacją

- [ ] Uzupełnij `.env` (jeśli używasz Nodemailer)
- [ ] Test EmailJS — wyślij testową rezerwację
- [ ] Sprawdź na mobile + tablet + desktop
- [ ] **Skompresuj `videos/hero-video.mp4`** z 26 MB do ≤5 MB (HandBrake)
- [ ] Konwertuj zdjęcia do **WebP** (oszczędność 30-50%)
- [ ] Wpisz prawdziwe zajęte daty w `data/availability.json`
- [ ] Zaktualizuj `data/pricing.json` aktualnymi cenami sezonowymi
- [ ] Dodaj politykę prywatności (RODO) — link w stopce
- [ ] Sprawdź indeksowanie: [Google Search Console](https://search.google.com/search-console)
- [ ] PageSpeed: [pagespeed.web.dev](https://pagespeed.web.dev/)
- [ ] Test rich snippets: [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Dodaj favicon w `client/favicon.ico`

---

## 🔧 Wdrożenie produkcyjne

### Hosting statyczny (Netlify / Vercel / GitHub Pages)
Sam folder `client/` — backend opcjonalny (EmailJS wystarcza).

### VPS (DigitalOcean / OVH / Hetzner)

```bash
git clone <repo>
cd siedlisko-konradowka
npm install --production
cp .env.example .env

# PM2 (zalecane):
npm install -g pm2
pm2 start server/server.js --name kukowo
pm2 save && pm2 startup
```

### Nginx reverse proxy

```nginx
server {
  listen 443 ssl http2;
  server_name kukowo.pl www.kukowo.pl;
  ssl_certificate     /etc/letsencrypt/live/kukowo.pl/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/kukowo.pl/privkey.pem;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## 📞 Dane kontaktowe

- **Tel:** +48 604 083 659
- **E-mail:** siedliskokonradowka@gmail.com
- **Adres:** Kukowo 33A, 19-400 Olecko
- **FB:** [konrad.radzewicz](https://www.facebook.com/konrad.radzewicz)
- **IG:** [@siedlisko_konradowka](https://www.instagram.com/siedlisko_konradowka)
- **WhatsApp:** [+48 604 083 659](https://wa.me/48604083659)

---

## 📜 Licencja

ISC — własny projekt Siedliska Konradówka.

---

**Mazury bez pośpiechu.** 🌲
