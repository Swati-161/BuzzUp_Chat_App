// translate.js
const express = require("express");
const { Translate } = require("@google-cloud/translate").v2;
const path = require("path");
const router = express.Router();

// Load credentials
const CREDENTIALS = require("../google-credentials.json");

const translate = new Translate({
  credentials: CREDENTIALS,
  projectId: CREDENTIALS.project_id,
});

// POST /api/translate
router.post("/", async (req, res) => {
  const { text, targetLanguage } = req.body;
  if (!text || !targetLanguage) return res.status(400).json({ error: "Missing data" });

  try {
    const [translation] = await translate.translate(text, targetLanguage);
    res.json({ translatedText: translation });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;
