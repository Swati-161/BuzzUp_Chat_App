const express = require('express');
const Message = require('../models/message');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

process.env.REACT_APP_API_URL('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });

    const userIds = new Set();
    messages.forEach(msg => {
      if (msg.sender.toString() !== req.user.id) userIds.add(msg.sender.toString());
      if (msg.receiver.toString() !== req.user.id) userIds.add(msg.receiver.toString());
    });

    res.json(Array.from(userIds));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
