import { apiFetch, showLoading, showError } from './api.js';
import { renderGrid } from './cards.js';
import { setItems, filterItems, setType, applySort, currentType } from './filters.js';
import { closeModal, openModal, setRating, saveReview, deleteReview } from './modal.js';
import { setGenre } from './filters.js';

// ── EXPOSE GLOBALS (needed by inline HTML onclick handlers) ──
window.closeModal  = closeModal;
window.openModal   = openModal;
window.setType     = setType;
window.applySort   = applySort;
window.doSearch    = doSearch;
window.resetFilters = resetFilters;
window.setRating   = setRating;
window.saveReview  = saveReview;
window.deleteReview = deleteReview;
window.goHome      = goHome;
window.applyTypeFilter = applyTypeFilter;
window.showWatchlistToast = showWatchlistToast;
window.applyGenreFilter = applyGenreFilter;
// ── INIT ─────────────────────────────────────────────────
window.onload = () => loadTrending();

// ── GO HOME (Entdecken-Button) ────────────────────────────
function goHome() {
  document.getElementById('searchInput').value = '';
  document.getElementById('sortSel').value = 'popularity';
  document.getElementById('typeSel').value = 'all';
  setType(null, 'all');
  document.querySelector('.section-title').innerHTML = 'Trending Today <small id="resultCount"></small>';
  loadTrending();
}

function applyGenreFilter() {
  const sel = document.getElementById('genreSel');
  setGenre(sel.value);
}

// ── WATCHLIST TOAST ───────────────────────────────────────
function showWatchlistToast() {
  const t = document.getElementById('toast');
  t.textContent = '🔖 Watchlist kommt bald!';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── TYPE FILTER VIA DROPDOWN ──────────────────────────────
function applyTypeFilter(sel) {
  setType(null, sel.value);
}

// ── LOAD TRENDING ─────────────────────────────────────────
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
  } catch (e) {
    showError('TMDB konnte nicht geladen werden: ' + e.message);
  }
}

// ── SEARCH ────────────────────────────────────────────────
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
  } catch (e) {
    showError('Suche fehlgeschlagen.');
  }
}

// ── RESET ─────────────────────────────────────────────────
function resetFilters() {
  document.getElementById('sortSel').value = 'popularity';
  document.getElementById('typeSel').value = 'all';
  document.getElementById('searchInput').value = '';
  document.querySelector('.section-title').innerHTML = 'Trending Today <small id="resultCount"></small>';
  document.getElementById('genreSel').value = 'all';
  setGenre('all');
  setType(null, 'all');
  loadTrending();
}

