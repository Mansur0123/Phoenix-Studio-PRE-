 
const API_KEY = '1007519da66987ea4598d9e2e7a97bcc';
const BASE    = 'https://api.themoviedb.org/3';
export const IMG_SM = 'https://image.tmdb.org/t/p/w500';
export const IMG_LG = 'https://image.tmdb.org/t/p/w780';

 
export async function apiFetch(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}api_key=${API_KEY}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

 
export function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

export function showLoading() {
  document.getElementById('content').innerHTML =
    `<div class="loading"><div class="spinner"></div><div>Lade Daten von TMDB…</div></div>`;
}

export function showError(msg) {
  document.getElementById('content').innerHTML =
    `<div class="empty"><div class="empty-icon">⚠️</div><h3>Fehler</h3><p>${msg}</p></div>`;
}