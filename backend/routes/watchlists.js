const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// Alle Watchlists des eingeloggten Users
router.get('/', requireAuth, async (req, res) => {
  try {
    const [lists] = await db.query(
      `SELECT w.id, w.name, w.created_at,
              (SELECT COUNT(*) FROM watchlist_items i WHERE i.watchlist_id = w.id) AS item_count
       FROM watchlists w
       WHERE w.user_id = ?
       ORDER BY w.created_at ASC`,
      [req.user.id]
    );
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB-Fehler' });
  }
});

// Neue Watchlist anlegen
router.post('/', requireAuth, async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name fehlt' });
  if (name.length > 120) return res.status(400).json({ error: 'Name zu lang' });

  try {
    const [result] = await db.query(
      'INSERT INTO watchlists (user_id, name) VALUES (?, ?)',
      [req.user.id, name]
    );
    res.json({ id: result.insertId, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB-Fehler' });
  }
});

// Watchlist umbenennen
router.put('/:id', requireAuth, async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name fehlt' });

  try {
    const [result] = await db.query(
      'UPDATE watchlists SET name = ? WHERE id = ? AND user_id = ?',
      [name, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB-Fehler' });
  }
});

// Watchlist löschen
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM watchlists WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB-Fehler' });
  }
});

// Items einer Watchlist abrufen
router.get('/:id/items', requireAuth, async (req, res) => {
  try {
    // Owner-Check
    const [own] = await db.query(
      'SELECT id FROM watchlists WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'Nicht gefunden' });

    const [items] = await db.query(
      `SELECT id, tmdb_id, media_type, title, poster_path, release_year, added_at
       FROM watchlist_items
       WHERE watchlist_id = ?
       ORDER BY added_at DESC`,
      [req.params.id]
    );
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB-Fehler' });
  }
});

// Item zur Watchlist hinzufügen
router.post('/:id/items', requireAuth, async (req, res) => {
  const { tmdb_id, media_type, title, poster_path, release_year } = req.body;

  if (!tmdb_id || !['movie', 'tv'].includes(media_type) || !title) {
    return res.status(400).json({ error: 'Ungültige Daten' });
  }

  try {
    // Owner-Check
    const [own] = await db.query(
      'SELECT id FROM watchlists WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'Watchlist nicht gefunden' });

    await db.query(
      `INSERT INTO watchlist_items
         (watchlist_id, tmdb_id, media_type, title, poster_path, release_year)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`,
      [req.params.id, tmdb_id, media_type, title, poster_path || null, release_year || null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB-Fehler' });
  }
});

// Item entfernen
router.delete('/:listId/items/:itemId', requireAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE i FROM watchlist_items i
       JOIN watchlists w ON w.id = i.watchlist_id
       WHERE i.id = ? AND w.id = ? AND w.user_id = ?`,
      [req.params.itemId, req.params.listId, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB-Fehler' });
  }
});

module.exports = router;
