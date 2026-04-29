import { fetchUser, isLoggedIn, renderAuthUI } from './auth.js';
import {
  getWatchlists, createWatchlist, renameWatchlist, deleteWatchlist,
  getItems, removeItem,
} from './watchlist.js';
import { IMG_SM, escHtml, showToast } from './api.js';

let activeListId = null;
let lists = [];

window.addEventListener('DOMContentLoaded', async () => {
  await fetchUser();
  renderAuthUI();

  if (!isLoggedIn()) {
    document.getElementById('notLoggedIn').style.display = 'block';
    return;
  }

  document.getElementById('loggedInView').style.display = 'block';
  await loadAndRender();
});

async function loadAndRender() {
  try {
    lists = await getWatchlists(true);
  } catch (e) {
    showToast('Fehler beim Laden: ' + e.message);
    return;
  }

  if (!lists.length) {
    document.getElementById('watchlistTabs').innerHTML =
      '<p class="muted">Noch keine Watchlist. Lege eine an!</p>';
    document.getElementById('itemsContainer').innerHTML = '';
    document.getElementById('watchlistActions').innerHTML = '';
    return;
  }

  if (!activeListId || !lists.find(l => l.id === activeListId)) {
    activeListId = lists[0].id;
  }

  renderTabs();
  renderActions();
  await renderItems();
}

function renderTabs() {
  const wrap = document.getElementById('watchlistTabs');
  wrap.innerHTML = lists.map(l => `
    <button class="watchlist-tab ${l.id === activeListId ? 'active' : ''}"
            data-id="${l.id}">
      📋 ${escHtml(l.name)}
      <span class="tab-count">${l.item_count}</span>
    </button>
  `).join('');

  wrap.querySelectorAll('.watchlist-tab').forEach(btn => {
    btn.addEventListener('click', async () => {
      activeListId = Number(btn.dataset.id);
      renderTabs();
      renderActions();
      await renderItems();
    });
  });
}

function renderActions() {
  const wrap = document.getElementById('watchlistActions');
  const list = lists.find(l => l.id === activeListId);
  if (!list) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = `
    <span class="active-list-name">${escHtml(list.name)}</span>
    <button class="btn-secondary btn-small" onclick="renameList()">✏️ Umbenennen</button>
    <button class="btn-danger btn-small" onclick="deleteList()">🗑️ Liste löschen</button>
  `;
}

async function renderItems() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  let items;
  try {
    items = await getItems(activeListId);
  } catch (e) {
    container.innerHTML = `<p class="muted">Fehler: ${e.message}</p>`;
    return;
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎬</div>
        <h3>Diese Watchlist ist leer</h3>
        <p>Geh auf <a href="index.html" style="color:var(--accent);">Entdecken</a> und füge Filme hinzu.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="grid">
      ${items.map(it => buildItemCard(it)).join('')}
    </div>
  `;

  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.itemId);
      if (!confirm('Wirklich entfernen?')) return;
      try {
        await removeItem(activeListId, id);
        showToast('Entfernt');
        await loadAndRender();
      } catch (err) {
        showToast('Fehler: ' + err.message);
      }
    });
  });
}

function buildItemCard(item) {
  const poster = item.poster_path
    ? `<img class="card-img" src="${IMG_SM}${item.poster_path}" alt="${escHtml(item.title)}" loading="lazy">`
    : `<div class="card-img-placeholder">🎬</div>`;

  return `
<div class="card">
  <div class="card-img-wrap">
    ${poster}
    <span class="card-type-badge ${item.media_type === 'movie' ? 'badge-movie' : 'badge-tv'}">${item.media_type === 'movie' ? 'Film' : 'Serie'}</span>
    <button class="remove-btn" data-item-id="${item.id}" title="Aus Watchlist entfernen">✕</button>
  </div>
  <div class="card-body">
    <div class="card-title">${escHtml(item.title)}</div>
    <div class="card-meta">
      <span>${item.release_year || '–'}</span>
    </div>
  </div>
</div>`;
}

async function newWatchlist() {
  const name = prompt('Name der neuen Watchlist:');
  if (!name || !name.trim()) return;
  try {
    await createWatchlist(name.trim());
    showToast('Watchlist erstellt');
    await loadAndRender();
  } catch (e) {
    showToast('Fehler: ' + e.message);
  }
}

async function renameList() {
  const list = lists.find(l => l.id === activeListId);
  if (!list) return;
  const name = prompt('Neuer Name:', list.name);
  if (!name || !name.trim() || name === list.name) return;
  try {
    await renameWatchlist(activeListId, name.trim());
    showToast('Umbenannt');
    await loadAndRender();
  } catch (e) {
    showToast('Fehler: ' + e.message);
  }
}

async function deleteList() {
  const list = lists.find(l => l.id === activeListId);
  if (!list) return;
  if (!confirm(`"${list.name}" wirklich löschen? Alle Filme darin gehen verloren.`)) return;
  try {
    await deleteWatchlist(activeListId);
    activeListId = null;
    showToast('Gelöscht');
    await loadAndRender();
  } catch (e) {
    showToast('Fehler: ' + e.message);
  }
}

window.newWatchlist = newWatchlist;
window.renameList = renameList;
window.deleteList = deleteList;
