import { api, isLoggedIn, openAuthModal } from './auth.js';
import { showToast } from './api.js';

// Cache der Watchlists des Users
let cachedLists = null;

export async function getWatchlists(force = false) {
  if (cachedLists && !force) return cachedLists;
  cachedLists = await api('/api/watchlists');
  return cachedLists;
}

export async function createWatchlist(name) {
  const created = await api('/api/watchlists', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  cachedLists = null;
  return created;
}

export async function renameWatchlist(id, name) {
  await api(`/api/watchlists/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
  cachedLists = null;
}

export async function deleteWatchlist(id) {
  await api(`/api/watchlists/${id}`, { method: 'DELETE' });
  cachedLists = null;
}

export async function getItems(listId) {
  return api(`/api/watchlists/${listId}/items`);
}

export async function addItem(listId, item) {
  return api(`/api/watchlists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function removeItem(listId, itemId) {
  return api(`/api/watchlists/${listId}/items/${itemId}`, { method: 'DELETE' });
}

// Wird vom Modal aufgerufen, wenn der User "Zur Watchlist" klickt
export async function addToWatchlistFlow(item) {
  if (!isLoggedIn()) {
    showToast('Bitte zuerst anmelden');
    openAuthModal('login');
    return;
  }

  let lists;
  try {
    lists = await getWatchlists(true);
  } catch (e) {
    showToast('Fehler: ' + e.message);
    return;
  }

  // Wenn nur eine Watchlist existiert, direkt dort hinzufügen
  let targetId;
  if (lists.length === 1) {
    targetId = lists[0].id;
  } else {
    targetId = await pickListDialog(lists);
    if (!targetId) return;
  }

  try {
    await addItem(targetId, item);
    const listName = lists.find(l => l.id === targetId)?.name || 'Watchlist';
    showToast(`✓ "${item.title}" zu "${listName}" hinzugefügt`);
  } catch (e) {
    showToast('Fehler: ' + e.message);
  }
}

// Mini-Dialog zur Auswahl der Watchlist
function pickListDialog(lists) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.style.zIndex = '500';

    const buttons = lists.map(l =>
      `<button class="picker-item" data-id="${l.id}">📋 ${escapeHtml(l.name)} <span class="picker-count">(${l.item_count})</span></button>`
    ).join('');

    overlay.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-inner">
          <h3 style="margin-bottom:1rem;">Welche Watchlist?</h3>
          <div class="picker-list">${buttons}</div>
          <div class="modal-footer" style="margin-top:1rem;">
            <button class="btn-secondary" id="pickCancel">Abbrechen</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(null);
      const btn = e.target.closest('.picker-item');
      if (btn) cleanup(Number(btn.dataset.id));
      if (e.target.id === 'pickCancel') cleanup(null);
    });

    function cleanup(value) {
      overlay.remove();
      resolve(value);
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}
