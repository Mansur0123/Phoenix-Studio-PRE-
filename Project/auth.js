// Verbindung zum Backend.
// Nutzt denselben Hostnamen wie das Frontend (localhost ODER 127.0.0.1),
// damit der Session-Cookie korrekt mitgesendet wird (SameSite-Schutz).
export const BACKEND_URL = `http://${window.location.hostname || 'localhost'}:3000`;

let currentUser = null;
let serverConfig = { googleEnabled: false };
let backendReachable = false;

export function isBackendReachable() {
  return backendReachable;
}

const BACKEND_DOWN_MSG =
  `Backend nicht erreichbar (${BACKEND_URL}). Läuft das Backend? In einem Terminal: "cd backend && npm start"`;

async function safeFetch(url, opts) {
  try {
    return await fetch(url, opts);
  } catch (e) {
    throw new Error(BACKEND_DOWN_MSG);
  }
}

export function getUser() {
  return currentUser;
}

export function isLoggedIn() {
  return !!currentUser;
}

// Status vom Backend abrufen (am Seitenstart aufrufen)
export async function fetchUser() {
  try {
    const [meRes, cfgRes] = await Promise.all([
      fetch(`${BACKEND_URL}/auth/me`, { credentials: 'include' }),
      fetch(`${BACKEND_URL}/auth/config`),
    ]);
    const me = await meRes.json();
    const cfg = await cfgRes.json();
    currentUser = me.user;
    serverConfig = cfg;
    backendReachable = true;
    return currentUser;
  } catch (e) {
    backendReachable = false;
    currentUser = null;
    return null;
  }
}

export async function registerLocal(email, password, name) {
  const res = await safeFetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registrierung fehlgeschlagen');
  currentUser = data.user;
  return data.user;
}

export async function loginLocal(email, password) {
  const res = await safeFetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen');
  currentUser = data.user;
  return data.user;
}

export function loginWithGoogle() {
  window.location.href = `${BACKEND_URL}/auth/google`;
}

export async function logout() {
  await fetch(`${BACKEND_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  currentUser = null;
  location.reload();
}

// Helper für authentifizierte API-Calls
export async function api(path, opts = {}) {
  const res = await safeFetch(`${BACKEND_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Warnbanner anzeigen wenn das Backend down ist
export function renderBackendBanner() {
  let banner = document.getElementById('backendBanner');
  if (backendReachable) {
    banner?.remove();
    return;
  }
  if (banner) return; // schon da

  banner = document.createElement('div');
  banner.id = 'backendBanner';
  banner.className = 'backend-banner';
  banner.innerHTML = `
    ⚠ Backend nicht erreichbar (${BACKEND_URL}).
    Login & Watchlist funktionieren erst wenn das Backend läuft:
    <code>cd backend &amp;&amp; npm start</code>
  `;
  document.body.prepend(banner);
}

// UI: Navbar-Button updaten (Login → Avatar mit Dropdown)
export function renderAuthUI() {
  const slot = document.getElementById('authSlot');
  if (!slot) return;
  renderBackendBanner();

  if (currentUser) {
    const initial = (currentUser.name || '?').charAt(0).toUpperCase();
    const avatar = currentUser.picture
      ? `<img src="${currentUser.picture}" alt="${currentUser.name}" referrerpolicy="no-referrer">`
      : `<span class="avatar-fallback">${initial}</span>`;

    slot.innerHTML = `
      <div class="user-menu">
        <button class="user-pill" onclick="toggleUserMenu()">
          ${avatar}
          <span class="user-name">${currentUser.name}</span>
        </button>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-email">${currentUser.email}</div>
          <button class="user-dropdown-item" onclick="window.location.href='watchlist.html'">🔖 Meine Watchlists</button>
          <button class="user-dropdown-item logout" onclick="doLogout()">🚪 Abmelden</button>
        </div>
      </div>
    `;
  } else {
    slot.innerHTML = `
      <button class="nav-pill login-btn" onclick="openAuthModal()">
        <span style="margin-right:0.4rem;">🔐</span> Anmelden
      </button>
    `;
  }
}

// ── Auth Modal (Login + Registrierung) ────────────────────
export function openAuthModal(mode = 'login') {
  closeAuthModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open auth-modal-overlay';
  overlay.id = 'authModal';

  const googleBtn = serverConfig.googleEnabled
    ? `<button class="btn-google" onclick="doGoogleLogin()">
         <span class="g-icon">G</span> Mit Google anmelden
       </button>
       <div class="auth-divider"><span>oder</span></div>`
    : '';

  overlay.innerHTML = `
    <div class="modal auth-modal">
      <div class="modal-inner">
        <div class="auth-tabs">
          <button class="auth-tab ${mode==='login'?'active':''}" data-mode="login">Anmelden</button>
          <button class="auth-tab ${mode==='register'?'active':''}" data-mode="register">Registrieren</button>
        </div>

        ${googleBtn}

        <form class="auth-form" id="authForm">
          <div class="auth-field reg-only" style="${mode==='login'?'display:none;':''}">
            <label>Name</label>
            <input type="text" name="name" placeholder="Dein Name" autocomplete="name">
          </div>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" name="email" placeholder="du@beispiel.de" autocomplete="email" required>
          </div>
          <div class="auth-field">
            <label>Passwort</label>
            <input type="password" name="password" placeholder="••••••" autocomplete="${mode==='login'?'current-password':'new-password'}" required>
          </div>

          <div class="auth-error" id="authError"></div>

          <button type="submit" class="btn-primary auth-submit">
            ${mode==='login' ? 'Anmelden' : 'Account erstellen'}
          </button>
        </form>

        <button class="auth-close" onclick="closeAuthModal()">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAuthModal();
  });

  overlay.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const newMode = tab.dataset.mode;
      closeAuthModal();
      openAuthModal(newMode);
    });
  });

  overlay.querySelector('#authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email');
    const password = fd.get('password');
    const name = fd.get('name');
    const errEl = overlay.querySelector('#authError');
    errEl.textContent = '';

    try {
      if (mode === 'register') {
        await registerLocal(email, password, name);
      } else {
        await loginLocal(email, password);
      }
      closeAuthModal();
      location.reload();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
}

export function closeAuthModal() {
  document.getElementById('authModal')?.remove();
}

function toggleUserMenu() {
  document.getElementById('userDropdown')?.classList.toggle('open');
}

window.toggleUserMenu = toggleUserMenu;
window.doLogin = () => openAuthModal('login');
window.doGoogleLogin = loginWithGoogle;
window.doLogout = logout;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;

// Klick außerhalb des Menüs schließt es
document.addEventListener('click', (e) => {
  const menu = document.getElementById('userDropdown');
  if (!menu) return;
  if (!e.target.closest('.user-menu')) {
    menu.classList.remove('open');
  }
});
