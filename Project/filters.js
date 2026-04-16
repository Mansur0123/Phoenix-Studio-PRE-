import { renderGrid } from './cards.js';

export let allItems    = [];
export let currentType = 'all';

// ── SET ITEMS (used by main.js after fetch) ───────────────
export function setItems(items) {
  allItems = items;
}

// ── TYPE FILTER ───────────────────────────────────────────
export function setType(btn, type) {
  currentType = type;
  // sync dropdown if it exists
  const sel = document.getElementById('typeSel');
  if (sel) sel.value = type;
  renderGrid(filterItems());
}

// ── SORT / APPLY ──────────────────────────────────────────
export function applySort() {
  renderGrid(filterItems());
}

// ── FILTER LOGIC ──────────────────────────────────────────
export function filterItems() {
  let items = [...allItems];

  if (currentType !== 'all') {
    items = items.filter(i => i.media_type === currentType);
  }

  const sort = document.getElementById('sortSel').value;
  if (sort === 'rating') {
    items.sort((a, b) => b.vote_average - a.vote_average);
  } else if (sort === 'name') {
    items.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
  } else if (sort === 'year') {
    const y = x => parseInt((x.release_date || x.first_air_date || '0').slice(0, 4));
    items.sort((a, b) => y(b) - y(a));
  } else {
    items.sort((a, b) => b.popularity - a.popularity);
  }

  return items;
}