const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const auth = require('../middleware/authMiddleware');

// GET messages
process.env.REACT_APP_API_URL('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    }).sort({ createdAt: 1 }); // oldest to newest
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST message
router.post('/', auth, async (req, res) => {
  const { receiver, content } = req.body;
  try {
    const message = new Message({
      sender: req.user.id,
      receiver,
      content,
      status: "sent"
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
