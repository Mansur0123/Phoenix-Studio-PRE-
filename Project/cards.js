import { IMG_SM, escHtml } from './api.js';

// ── RENDER GRID ───────────────────────────────────────────
export function renderGrid(items, containerId = 'content') {
  const el = document.getElementById(containerId);
  const rc = document.getElementById('resultCount');
  if (rc) rc.textContent = items.length ? `${items.length} Ergebnisse` : '';

  if (!items.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🎬</div><h3>Keine Ergebnisse</h3><p>Versuche eine andere Suche oder ändere die Filter.</p></div>`;
    return;
  }
  el.innerHTML = `<div class="grid">${items.map((item, i) => buildCard(item, i)).join('')}</div>`;
}

// ── BUILD CARD ────────────────────────────────────────────
export function buildCard(item, i) {
  const title = item.title || item.name || 'Unbekannt';
  const type  = item.media_type;
  const year  = (item.release_date || item.first_air_date || '').slice(0, 4);
  const score = item.vote_average ? item.vote_average.toFixed(1) : '–';

  const poster = item.poster_path
    ? `<img class="card-img" src="${IMG_SM}${item.poster_path}" alt="${escHtml(title)}" loading="lazy">`
    : `<div class="card-img-placeholder">🎬</div>`;

  return `
<div class="card" style="animation-delay:${i * 0.04}s" onclick="openModal(${item.id},'${type}')">
  <div class="card-img-wrap">
    ${poster}
    <span class="card-type-badge ${type === 'movie' ? 'badge-movie' : 'badge-tv'}">${type === 'movie' ? 'Film' : 'Serie'}</span>
  </div>
  <div class="card-body">
    <div class="card-title">${escHtml(title)}</div>
    <div class="card-meta">
      <span>${year || '–'}</span>
      <span class="tmdb-score">⭐ ${score}</span>
    </div>
  </div>
</div>`;
}