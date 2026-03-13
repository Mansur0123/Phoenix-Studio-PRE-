import { apiFetch, escHtml, showToast, IMG_LG } from './api.js';

export let currentModal = null;



export function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  currentModal = null;
}