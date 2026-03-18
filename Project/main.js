import { apiFetch, showLoading, showError } from './api.js';
import { renderGrid } from './cards.js';
import { setItems, filterItems, setType, applySort, currentType } from './filters.js';
import { closeModal } from './modal.js';

// ── EXPOSE GLOBALS (needed by inline HTML onclick handlers) ──

window.closeModal  = closeModal;
window.setType     = setType;
window.applySort   = applySort;
window.doSearch    = doSearch;
window.resetFilters = resetFilters;

// ── INIT ─────────────────────────────────────────────────
window.onload = () => loadTrending();

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
  document.querySelectorAll('.filter-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  document.getElementById('sortSel').value     = 'popularity';
  document.getElementById('searchInput').value = '';
  document.querySelector('.section-title').innerHTML = 'Trending Today <small id="resultCount"></small>';
  loadTrending();
}