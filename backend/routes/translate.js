const express = require("express");
const { Translate } = require("@google-cloud/translate").v2;
const router = express.Router();

// Load credentials from environment variable
const googleCredentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const translate = new Translate({
  credentials: {
    client_email: googleCredentials.client_email,
    private_key: googleCredentials.private_key,
  },
  projectId: googleCredentials.project_id,
});

// POST /api/translate
router.post("/", async (req, res) => {
  const { text, targetLanguage } = req.body;
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const [translation] = await translate.translate(text, targetLanguage);
    res.json({ translatedText: translation });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;
