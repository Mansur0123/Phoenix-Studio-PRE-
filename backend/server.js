require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { passport, requireAuth, googleEnabled } = require('./auth');
const watchlistsRouter = require('./routes/watchlists');
const localAuthRouter = require('./routes/local-auth');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// Erlaubt jeden localhost / 127.0.0.1 Origin auf jedem Port (für Live Server etc.)
// + zusätzlich die explizit konfigurierte FRONTEND_URL
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl, Postman, server-to-server
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (origin === FRONTEND_URL) return callback(null, true);
    console.warn(`CORS blockiert: ${origin}`);
    callback(new Error('Origin nicht erlaubt: ' + origin));
  },
  credentials: true,
}));

// Hilfreiches Logging beim Start jeder Anfrage
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,        // in Produktion mit HTTPS auf true setzen
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,  // 1 Woche
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── LOCAL AUTH (Email/Passwort) ───────────────────────────
app.use('/auth', localAuthRouter);

// ── GOOGLE AUTH ROUTES (nur wenn konfiguriert) ────────────
if (googleEnabled) {
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${FRONTEND_URL}/index.html?login=fail`,
    }),
    (req, res) => {
      res.redirect(`${FRONTEND_URL}/index.html?login=ok`);
    }
  );
} else {
  app.get('/auth/google', (req, res) => {
    res.status(503).send('Google-Login ist nicht konfiguriert. Verwende Email/Passwort.');
  });
}

// Frontend kann hier nachschauen ob Google verfügbar ist
app.get('/auth/config', (req, res) => {
  res.json({ googleEnabled });
});

app.post('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  });
});

app.get('/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// ── WATCHLIST ROUTES ──────────────────────────────────────
app.use('/api/watchlists', watchlistsRouter);

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`✦ Phoenix Backend läuft auf http://localhost:${PORT}`);
  console.log(`✦ Frontend erwartet auf ${FRONTEND_URL}`);
});
