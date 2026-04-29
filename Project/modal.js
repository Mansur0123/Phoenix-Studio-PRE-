import { apiFetch, escHtml, showToast, IMG_LG } from './api.js';

export let currentModal = null;

export async function openModal(id, type) {
  const modalOverlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  
  if (!content) return;
  
  // Loading anzeigen
  content.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="spinner" style="margin: 0 auto;"></div>
      <p style="margin-top: 1rem;">Lade Details...</p>
    </div>
  `;
  
  modalOverlay.classList.add('open');
  
  try {
    // Details von TMDB laden
    const details = await apiFetch(`/${type}/${id}?language=de-DE&append_to_response=videos,credits`);
    
    // Gespeicherte Bewertung laden
    const savedRating = localStorage.getItem(`rating_${type}_${id}`);
    const savedReview = localStorage.getItem(`review_${type}_${id}`);
    
    // Modal Content rendern
    renderModalContent(details, type, savedRating, savedReview);
    
  } catch (error) {
    content.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #ff6b35;">Fehler beim Laden der Details: ${error.message}</p>
        <button class="close-btn" onclick="closeModal()" style="margin-top: 1rem;">Schließen</button>
      </div>
    `;
  }
}

function renderModalContent(details, type, savedRating, savedReview) {
  const content = document.getElementById('modalContent');
  if (!content) return;
  
  const title = details.title || details.name || 'Unbekannt';
  const poster = details.poster_path ? `${IMG_LG}${details.poster_path}` : '';
  const backdrop = details.backdrop_path ? `${IMG_LG}${details.backdrop_path}` : '';
  const year = (details.release_date || details.first_air_date || '').slice(0, 4);
  const runtime = details.runtime ? `${details.runtime} min` : details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min` : '–';
  const genres = details.genres?.map(g => g.name).join(', ') || '–';
  const overview = details.overview || 'Keine Beschreibung verfügbar.';
  const voteAverage = details.vote_average ? details.vote_average.toFixed(1) : '–';
  const voteCount = details.vote_count || 0;
  
  // Cast (erste 5 Schauspieler)
  const cast = details.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || '–';
  
  // Trailer finden
  const trailer = details.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  
  content.innerHTML = `
    <div class="modal-inner">
      ${backdrop ? `<div class="modal-backdrop" style="background-image: url('${backdrop}')"></div>` : ''}
      
      <div class="modal-top">
        ${poster ? `<img class="modal-poster" src="${poster}" alt="${escHtml(title)}">` : `<div class="modal-poster-placeholder">🎬</div>`}
        
        <div class="modal-info">
          <div class="modal-toprow">
            <h2 class="modal-title">${escHtml(title)}</h2>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>
          
          <div class="modal-tags">
            <span class="modal-tag">${type === 'movie' ? 'Film' : 'Serie'}</span>
            <span class="modal-tag">${year || '–'}</span>
            <span class="modal-tag">${runtime}</span>
          </div>

          <button class="btn-watchlist" onclick='addToWatchlistFlow(${JSON.stringify({
            tmdb_id: details.id,
            media_type: type,
            title: title,
            poster_path: details.poster_path || null,
            release_year: year || null,
          }).replace(/'/g, "&#39;")})'>
            🔖 Zur Watchlist hinzufügen
          </button>
          
          <div class="modal-meta-row">
            <div class="tmdb-big">
              <span class="tmdb-big-score">${voteAverage}</span>
              <span class="tmdb-big-max">/10</span>
              <div class="tmdb-big-stars">${renderStars(voteAverage)}</div>
            </div>
            <div class="tmdb-info">
              <div>⭐ ${voteCount} Bewertungen</div>
              <div>🎭 ${genres}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-body">
        <div class="modal-section">
          <h3 class="modal-section-title">📖 Beschreibung</h3>
          <p class="modal-desc">${escHtml(overview)}</p>
        </div>
        
        <div class="modal-section">
          <h3 class="modal-section-title">🎭 Besetzung</h3>
          <p class="modal-cast">${escHtml(cast)}</p>
        </div>
        
        ${trailer ? `
        <div class="modal-section">
          <h3 class="modal-section-title">🎬 Trailer</h3>
          <div class="modal-trailer">
            <iframe 
              width="100%" 
              height="315" 
              src="https://www.youtube.com/embed/${trailer.key}" 
              frameborder="0" 
              allowfullscreen>
            </iframe>
          </div>
        </div>
        ` : ''}
        
        <!-- REVIEW SECTION -->
        <div class="modal-section review-section">
          <h3 class="modal-section-title">✍️ Deine Bewertung</h3>
          
          <div class="rating-container">
            <div class="rating-stars" id="ratingStars">
              ${renderRatingStars(savedRating)}
            </div>
            <div class="rating-value" id="ratingValue">${savedRating ? `${savedRating}/10` : 'Nicht bewertet'}</div>
          </div>
          
          <textarea 
            id="reviewText" 
            class="review-textarea" 
            placeholder="Schreibe hier deine Review... (optional)"
            rows="4"
          >${savedReview || ''}</textarea>
          
          <div class="review-actions">
            <button class="btn-primary" onclick="saveReview('${type}', ${details.id})">
              💾 Bewertung speichern
            </button>
            <button class="btn-secondary" onclick="deleteReview('${type}', ${details.id})">
              🗑️ Löschen
            </button>
          </div>
          
          <div id="reviewMessage" class="review-message"></div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Schließen</button>
      </div>
    </div>
  `;
}

function renderStars(rating) {
  const stars = Math.round(rating / 2);
  let starsHtml = '';
  for (let i = 0; i < 5; i++) {
    starsHtml += i < stars ? '⭐' : '☆';
  }
  return starsHtml;
}

function renderRatingStars(savedRating) {
  let starsHtml = '';
  for (let i = 1; i <= 10; i++) {
    starsHtml += `
      <span class="star ${savedRating && i <= savedRating ? 'active' : ''}" 
            data-value="${i}" 
            onclick="setRating(${i})">
        ${i <= savedRating ? '★' : '☆'}
      </span>
    `;
  }
  return starsHtml;
}

export function setRating(value) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < value) {
      star.innerHTML = '★';
      star.classList.add('active');
    } else {
      star.innerHTML = '☆';
      star.classList.remove('active');
    }
  });
  document.getElementById('ratingValue').textContent = `${value}/10`;
}

export function saveReview(type, id) {
  const ratingStars = document.querySelectorAll('.star.active');
  const rating = ratingStars.length;
  const review = document.getElementById('reviewText')?.value || '';
  const messageEl = document.getElementById('reviewMessage');
  
  if (rating === 0) {
    messageEl.innerHTML = '<span style="color: #ff6b35;">⚠️ Bitte wähle eine Bewertung (1-10 Sterne)</span>';
    setTimeout(() => { messageEl.innerHTML = ''; }, 3000);
    return;
  }
  
  // In localStorage speichern
  localStorage.setItem(`rating_${type}_${id}`, rating);
  localStorage.setItem(`review_${type}_${id}`, review);
  
  messageEl.innerHTML = '<span style="color: #e8c547;">✅ Bewertung gespeichert!</span>';
  setTimeout(() => { messageEl.innerHTML = ''; }, 3000);
  
  showToast('Deine Bewertung wurde gespeichert!');
}

export function deleteReview(type, id) {
  localStorage.removeItem(`rating_${type}_${id}`);
  localStorage.removeItem(`review_${type}_${id}`);
  
  // Stars zurücksetzen
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.innerHTML = '☆';
    star.classList.remove('active');
  });
  document.getElementById('ratingValue').textContent = 'Nicht bewertet';
  document.getElementById('reviewText').value = '';
  
  const messageEl = document.getElementById('reviewMessage');
  messageEl.innerHTML = '<span style="color: #e8c547;">🗑️ Bewertung gelöscht</span>';
  setTimeout(() => { messageEl.innerHTML = ''; }, 3000);
  
  showToast('Bewertung wurde gelöscht');
}

export function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  currentModal = null;
}

// Globale Funktionen für onclick-Handler
window.openModal = openModal;
window.closeModal = closeModal;
window.setRating = setRating;
window.saveReview = saveReview;
window.deleteReview = deleteReview;