import { apiFetch, showLoading, showError, showToast } from './api.js';
import { renderGrid } from './cards.js';
import { setItems, filterItems, setType, applySort, currentType, allItems } from './filters.js';
import { closeModal, openModal, setRating, saveReview, deleteReview } from './modal.js';
import { setGenre } from './filters.js';
import { fetchUser, renderAuthUI } from './auth.js';
import { addToWatchlistFlow } from './watchlist.js';

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
window.applyGenreFilter = applyGenreFilter;
window.addToWatchlistFlow = addToWatchlistFlow;
window.addToWatchlistFromCard = addToWatchlistFromCard;

function addToWatchlistFromCard(id, type) {
  const item = allItems.find(i => i.id === id && i.media_type === type);
  if (!item) return;
  addToWatchlistFlow({
    tmdb_id: item.id,
    media_type: type,
    title: item.title || item.name || 'Unbekannt',
    poster_path: item.poster_path || null,
    release_year: (item.release_date || item.first_air_date || '').slice(0, 4) || null,
  });
}

// ── INIT ─────────────────────────────────────────────────
window.onload = async () => {
  await fetchUser();
  renderAuthUI();

  // Toast nach erfolgreichem Login (?login=ok)
  const params = new URLSearchParams(location.search);
  if (params.get('login') === 'ok') {
    showToast('✓ Erfolgreich angemeldet');
    history.replaceState({}, '', location.pathname);
  } else if (params.get('login') === 'fail') {
    showToast('✗ Anmeldung fehlgeschlagen');
    history.replaceState({}, '', location.pathname);
  }

  loadTrending();
};

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

