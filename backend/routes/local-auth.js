const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REGISTRIERUNG
router.post('/register', async (req, res, next) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const name = (req.body.name || '').trim();

  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Ungültige Email' });
  if (password.length < 6) return res.status(400).json({ error: 'Passwort muss mind. 6 Zeichen lang sein' });
  if (!name) return res.status(400).json({ error: 'Name fehlt' });

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Diese Email ist bereits registriert' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
      [email, name, hash]
    );
    const userId = result.insertId;

    // Default-Watchlist anlegen (gleich wie bei Google-Login)
    await db.query(
      'INSERT INTO watchlists (user_id, name) VALUES (?, ?)',
      [userId, 'Meine Watchlist']
    );

    const user = { id: userId, email, name, picture: null };
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ user });
    });
  } catch (err) {
    console.error('AUTH ERROR:', err.code, err.message);
    res.status(500).json({
      error: `DB-Fehler: ${err.code || ''} ${err.message || err}`.trim(),
    });
  }
});

// LOGIN
router.post('/login', async (req, res, next) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) return res.status(400).json({ error: 'Email und Passwort erforderlich' });

  try {
    const [rows] = await db.query(
      'SELECT id, email, name, picture, password_hash FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length || !rows[0].password_hash) {
      return res.status(401).json({ error: 'Email oder Passwort falsch' });
    }

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Email oder Passwort falsch' });

    const user = {
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
      picture: rows[0].picture,
    };
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ user });
    });
  } catch (err) {
    console.error('AUTH ERROR:', err.code, err.message);
    res.status(500).json({
      error: `DB-Fehler: ${err.code || ''} ${err.message || err}`.trim(),
    });
  }
});

module.exports = router;
