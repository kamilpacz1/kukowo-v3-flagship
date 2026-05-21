#!/bin/bash
# generate-sri.sh — wygeneruj SRI hashes dla zewnętrznych skryptów
# Uruchom raz: bash generate-sri.sh
# Skopiuj wynik do <script> tagów w HTML

set -e

urls=(
  "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"
  "https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"
  "https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css"
)

echo "=== SRI hashes dla skryptów ==="
for url in "${urls[@]}"; do
  hash=$(curl -fsSL "$url" | openssl dgst -sha384 -binary | openssl base64 -A)
  echo ""
  echo "URL: $url"
  echo "Atrybuty:"
  echo "  integrity=\"sha384-$hash\""
  echo "  crossorigin=\"anonymous\""
done

echo ""
echo "=== INSTRUKCJA ==="
echo "Dla każdego <script src=\"URL\">"
echo "Dodaj atrybuty integrity= i crossorigin=, np:"
echo '<script src="https://..." integrity="sha384-..." crossorigin="anonymous"></script>'
