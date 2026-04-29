const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

// Echte Google-Client-IDs enden immer auf .apps.googleusercontent.com
const googleEnabled = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com') &&
  process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_SECRET.startsWith('dein_')
);

if (googleEnabled) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email    = profile.emails?.[0]?.value || '';
    const name     = profile.displayName || email;
    const picture  = profile.photos?.[0]?.value || null;

    const [rows] = await db.query(
      'SELECT id FROM users WHERE google_id = ?',
      [googleId]
    );

    let userId;
    if (rows.length) {
      userId = rows[0].id;
      await db.query(
        'UPDATE users SET email = ?, name = ?, picture = ? WHERE id = ?',
        [email, name, picture, userId]
      );
    } else {
      const [result] = await db.query(
        'INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)',
        [googleId, email, name, picture]
      );
      userId = result.insertId;

      // Default-Watchlist anlegen
      await db.query(
        'INSERT INTO watchlists (user_id, name) VALUES (?, ?)',
        [userId, 'Meine Watchlist']
      );
    }

    return done(null, { id: userId, email, name, picture });
  } catch (err) {
    return done(err);
  }
}));
} else {
  console.warn('⚠ Google OAuth deaktiviert: GOOGLE_CLIENT_ID/SECRET fehlen in .env');
}

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, name, picture FROM users WHERE id = ?',
      [id]
    );
    if (!rows.length) return done(null, false);
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Nicht eingeloggt' });
}

module.exports = { passport, requireAuth, googleEnabled };
