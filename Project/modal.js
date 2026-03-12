import { apiFetch, escHtml, showToast, IMG_LG } from './api.js';

export let currentModal = null;


export async function openModal(id, type) {
  try {
    const data = await apiFetch(`/${type}/${id}?language=de-DE`);
    data.media_type = type;
    currentModal = data;

    const title  = data.title || data.name;
    const year   = (data.release_date || data.first_air_date || '').slice(0, 4);
    const score  = data.vote_average ? data.vote_average.toFixed(1) : '–';
    const genres = (data.genres || []).map(g => `<span class="mtag">${escHtml(g.name)}</span>`).join('');
    const meta   = [
      year,
      data.runtime
        ? data.runtime + ' min'
        : data.number_of_seasons
          ? data.number_of_seasons + ' Staffel(n)'
          : null,
      data.original_language?.toUpperCase()
    ].filter(Boolean).join(' · ');

    document.getElementById('mTitle').textContent = title;
    document.getElementById('mPoster').src        = data.poster_path ? IMG_LG + data.poster_path : '';
    document.getElementById('mTags').innerHTML    = genres + `<span class="mtag">${type === 'movie' ? 'Film' : 'Serie'}</span>`;
    document.getElementById('mMeta').textContent  = meta;
    document.getElementById('mScore').textContent = score;
    document.getElementById('mDesc').textContent  = data.overview || 'Keine Beschreibung verfügbar.';


    updateWatchlistBtn(data.id);

    document.getElementById('modalOverlay').classList.add('open');
  } catch {
    
  }
}


export function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  currentModal = null;
}


export function toggleWatchlist() {
  if (!currentModal) return;
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const idx = watchlist.findIndex(i => i.id === currentModal.id);
  if (idx === -1) {
    watchlist.push(currentModal);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showToast('✅ Zur Watchlist hinzugefügt');
  } else {
    watchlist.splice(idx, 1);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showToast('🗑️ Von Watchlist entfernt');
  }
  updateWatchlistBtn(currentModal.id);
}

function updateWatchlistBtn(id) {
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const btn = document.getElementById('btnWatchlist');
  if (!btn) return;
  const inList = watchlist.some(i => i.id === id);
  btn.textContent = inList ? '✅ In Watchlist' : '🔖 Zur Watchlist';
  btn.style.borderColor = inList ? 'var(--accent)' : '';
  btn.style.color       = inList ? 'var(--accent)' : '';
}
