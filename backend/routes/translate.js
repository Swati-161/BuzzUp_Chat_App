const express = require("express");
const router = express.Router();

let translate = null;

// Load Google Translate credentials from env (same pattern as Firebase)
try {
  const { Translate } = require("@google-cloud/translate").v2;

  if (!process.env.GOOGLE_TRANSLATE_CREDENTIALS) {
    console.warn("⚠️  GOOGLE_TRANSLATE_CREDENTIALS not set — translation disabled.");
  } else {
    const googleCredentials = JSON.parse(process.env.GOOGLE_TRANSLATE_CREDENTIALS);
    translate = new Translate({
      credentials: {
        client_email: googleCredentials.client_email,
        private_key:  googleCredentials.private_key,
      },
      projectId: googleCredentials.project_id,
    });
    console.log("✅ Google Translate ready");
  }
} catch (err) {
  console.error("❌ Google Translate init failed:", err.message);
}

// POST /api/translate
router.post("/", async (req, res) => {
  const { text, targetLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: "Missing text or targetLanguage" });
  }

  if (!translate) {
    return res.status(503).json({
      error: "Translation service not configured.",
      translatedText: "[Translation unavailable — Google API not set up]"
    });
  }

  try {
    const [translation] = await translate.translate(text, targetLanguage);
    res.json({ translatedText: translation });
  } catch (err) {
    console.error("Translation error:", err.message);
    res.status(500).json({
      error: "Translation failed",
      translatedText: "[Translation failed]"
    });
  }
});

module.exports = router;