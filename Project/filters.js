import { renderGrid } from './cards.js';

export let allItems = [];
export let currentType = 'all';
export let currentGenre = 'all';

// SET ITEMS
export function setItems(items) {
  allItems = items;
}

// TYPE
export function setType(btn, type) {
  currentType = type;
  const sel = document.getElementById('typeSel');
  if (sel) sel.value = type;
  renderGrid(filterItems());
}

// GENRE
export function setGenre(genre) {
  currentGenre = genre;
  renderGrid(filterItems());
}

// SORT
export function applySort() {
  renderGrid(filterItems());
}

// FILTER
export function filterItems() {
  let items = [...allItems];

  if (currentType !== 'all') {
    items = items.filter(i => i.media_type === currentType);
  }

  if (currentGenre !== 'all') {
    items = items.filter(i =>
      i.genre_ids && i.genre_ids.includes(Number(currentGenre))
    );
  }

  const sort = document.getElementById('sortSel').value;

  if (sort === 'rating') {
    items.sort((a, b) => b.vote_average - a.vote_average);
  } else if (sort === 'name') {
    items.sort((a, b) =>
      (a.title || a.name || '').localeCompare(b.title || b.name || '')
    );
  } else if (sort === 'year') {
    const y = x => parseInt((x.release_date || x.first_air_date || '0').slice(0, 4));
    items.sort((a, b) => y(b) - y(a));
  } else {
    items.sort((a, b) => b.popularity - a.popularity);
  }

  return items;
}