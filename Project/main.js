import { apiFetch, showLoading, showError } from './api.js';
import { renderGrid } from './cards.js';
import { setItems, filterItems, setType, applySort } from './filters.js';
import { openModal, closeModal, toggleWatchlist } from './modal.js';


window.openModal      = openModal;
window.closeModal     = closeModal;
window.toggleWatchlist = toggleWatchlist;
window.setType        = setType;
window.applySort      = applySort;
window.doSearch       = doSearch;
window.resetFilters   = resetFilters;
window.showWatchlist  = showWatchlist;
window.showBewertungen = showBewertungen;


window.onload = () => loadTrending();

async function loadTrending() {
  showLoading();
  try {
    const [mov, tv] = await Promise.all([
      apiFetch('/trending/movie/day?language=de-DE'),
      apiFetch('/trending/tv/day?language=de-DE')
    ]);
    const items = [
      ...mov.results.map(m => ({ ...m, media_type: 'movie' })),
      ...tv.results.map(t => ({ ...t, media_type: 'tv' }))
    ];
    setItems(items);
    renderGrid(filterItems());
  } catch {

    showError('Trending konnte nicht geladen werden.');
  }
}


async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) { loadTrending(); return; }
  showLoading();
  try {
    const data = await apiFetch(`/search/multi?language=de-DE&query=${encodeURIComponent(q)}`);
    const items = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    setItems(items);
    document.querySelector('.section-title').innerHTML =
      `Ergebnisse für „${q}" <small id="resultCount"></small>`;
    renderGrid(filterItems());
  } catch {
    showError('Suche konnte nicht ausgeführt werden.');
  }
}


function resetFilters() {
  document.querySelectorAll('.filter-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  document.getElementById('sortSel').value     = 'popularity';
  document.getElementById('searchInput').value = '';
  document.querySelector('.section-title').innerHTML =
    `Trending Today <small id="resultCount"></small>`;
  loadTrending();
}

function showWatchlist() {
  document.querySelector('.section-title').innerHTML =
    `Meine Watchlist <small id="resultCount"></small>`;
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  setItems(watchlist);
  renderGrid(filterItems());
  document.getElementById('navWatchlist').classList.add('active');
  document.getElementById('navBewertungen').classList.remove('active');
}


function showBewertungen() {
  document.querySelector('.section-title').innerHTML =
    `Meine Bewertungen <small id="resultCount"></small>`;

  document.getElementById('content').innerHTML =
    `<div class="empty"><div class="empty-icon">⭐</div><h3>Noch keine Bewertungen</h3><p>Öffne einen Film oder eine Serie und bewerte ihn.</p></div>`;
  document.getElementById('navBewertungen').classList.add('active');
  document.getElementById('navWatchlist').classList.remove('active');
}
