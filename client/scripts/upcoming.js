/* Loads upcoming events into #upcoming-events grid */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('upcoming-events');
  if (!grid) return;

  fetch('data/upcoming.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(events => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = (events || [])
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 12);

      if (upcoming.length === 0) {
        grid.innerHTML = '<div class="events-loading"><p>Brak nadchodzących wydarzeń. Wróć za jakiś czas!</p></div>';
        return;
      }

      grid.innerHTML = upcoming.map(e => {
        const date = new Date(e.date);
        const dateStr = date.toLocaleDateString('pl-PL', {
          day: 'numeric', month: 'long', year: 'numeric'
        });
        const cat = (e.category || 'Inne').toLowerCase();
        const catClass = cat.includes('sport') ? 'sport'
                       : cat.includes('kultur') ? 'kultura'
                       : cat.includes('muzy') || cat.includes('music') ? 'muzyka'
                       : cat.includes('motor') ? 'motorsport'
                       : 'kultura';

        return `
          <article class="event-card">
            <span class="event-card__cat event-card__cat--${catClass}">${escapeHtml(e.category || 'Wydarzenie')}</span>
            <p class="event-card__date">${dateStr}</p>
            <h3 class="event-card__title">${escapeHtml(e.name || '')}</h3>
            <p class="event-card__place">📍 ${escapeHtml(e.place || '')}</p>
            <p class="event-card__desc">${escapeHtml(e.description || '')}</p>
            ${e.link ? `<a href="${e.link}" target="_blank" rel="noopener" class="event-card__link">Więcej informacji →</a>` : ''}
          </article>
        `;
      }).join('');
    })
    .catch(err => {
      console.error('Błąd ładowania wydarzeń:', err);
      grid.innerHTML = '<div class="events-loading"><p>Nie udało się załadować wydarzeń.</p></div>';
    });
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[m]));
}
