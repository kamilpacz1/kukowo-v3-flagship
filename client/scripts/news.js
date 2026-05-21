document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('[data-news-page]');
  if (!section) return;

  const pageKey = section.getAttribute('data-news-page');
  const listEl = document.getElementById('news-list');
  if (!listEl) return;

  fetch('data/news.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(allNews => {
      const pageNews = (allNews || [])
        .filter(item => item.page === pageKey)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (pageNews.length === 0) {
        listEl.innerHTML = '<li class="news-loading">Brak aktualności w tej chwili.</li>';
        return;
      }

      listEl.innerHTML = pageNews.map(item => {
        const date = new Date(item.date).toLocaleDateString('pl-PL', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        return `
          <li class="news-item">
            <time class="news-item__date" datetime="${item.date}">${date}</time>
            <div>
              <h3 class="news-item__title">${escapeHtml(item.title || '')}</h3>
              <p class="news-item__text">${escapeHtml(item.summary || '')}</p>
            </div>
          </li>
        `;
      }).join('');
    })
    .catch(err => {
      console.error('Błąd ładowania aktualności:', err);
      listEl.innerHTML = '<li class="news-loading">Nie udało się pobrać aktualności.</li>';
    });
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[m]));
}
