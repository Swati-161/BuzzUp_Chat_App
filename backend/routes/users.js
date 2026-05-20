const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const { db } = require('../firebase');

// GET /api/users/search?q=query
// Searches users stored in Firebase Realtime DB under /users
router.get('/search', verifyFirebaseToken, async (req, res) => {
  try {
    const q = req.query.q?.trim().toLowerCase();
    if (!q) return res.json([]);

    const snapshot = await db.ref('users').once('value');
    const data = snapshot.val();
    if (!data) return res.json([]);

    const currentUid = req.user.uid;

    const results = Object.values(data)
      .filter((u) =>
        u.uid !== currentUid &&
        (
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        )
      )
      .slice(0, 10)
      .map((u) => ({
        firebaseUid: u.uid,
        username: u.username,
        email: u.email,
      }));

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users — list all users (Firebase DB)
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const snapshot = await db.ref('users').once('value');
    const data = snapshot.val();
    if (!data) return res.json([]);

    const currentUid = req.user.uid;
    const users = Object.values(data)
      .filter((u) => u.uid !== currentUid)
      .map((u) => ({ firebaseUid: u.uid, username: u.username, email: u.email }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;