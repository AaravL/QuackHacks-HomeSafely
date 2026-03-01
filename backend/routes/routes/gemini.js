// routes/gemini.js
const express = require("express");
const router = express.Router();

const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in environment");
}

const client = new GoogleGenAI({ apiKey });

function extractGeminiText(result) {
  // Most common in @google/genai: result.response.text() (function)
  if (result?.response?.text) {
    try {
      return typeof result.response.text === "function"
        ? result.response.text()
        : String(result.response.text);
    } catch (_) {
      // fall through
    }
  }

  // Some variants: result.text (string or function)
  if (result?.text) {
    try {
      return typeof result.text === "function" ? result.text() : String(result.text);
    } catch (_) {
      // fall through
    }
  }

  // Candidates fallback
  const parts =
    result?.candidates?.[0]?.content?.parts ||
    result?.response?.candidates?.[0]?.content?.parts;

  if (Array.isArray(parts)) {
    return parts.map((p) => p?.text).filter(Boolean).join("");
  }

  return "";
}

// POST /api/gemini/chat
router.post("/chat", async (req, res) => {
  try {
    const { message, history = [], mode = "walk-home-companion" } = req.body || {};
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const model = "gemini-2.5-flash";

    // Stronger system instruction for your use case
    const systemInstruction = `
You are a warm "walk-home phone companion" speaking in a caring-parent tone.
Goal: keep the user company while they walk home. Natural, short turns. Ask 1 question at a time.
Do NOT claim you are literally their mom or a real person; instead say you can talk "like a caring parent".
Every 1-2 minutes, do a gentle check-in: ask if they’re still walking, how far they are, if they feel okay.
If user expresses fear or being followed: switch to calm + action mode:
- suggest going to a lit/public place
- suggest calling a trusted contact or emergency services if needed
- keep them talking while they act
Mode: ${mode}
`.trim();

    // Normalize history strictly to Gemini roles: "user" or "model"
    const contents = Array.isArray(history)
      ? history.slice(-12).map((h) => ({
          role: h?.role === "assistant" ? "model" : "user",
          parts: [{ text: String(h?.text ?? "") }],
        }))
      : [];

    contents.push({ role: "user", parts: [{ text: message }] });

    const result = await client.models.generateContent({
      model,
      systemInstruction,
      contents,
    });

    const reply = extractGeminiText(result).trim() || "I’m here — say that again for me?";
    return res.json({ reply });
  } catch (err) {
    console.error("Gemini /chat error:", err);

    return res.status(500).json({
      error: "Gemini failed",
      message: err?.message ?? String(err),
      name: err?.name ?? "Error",
    });
  }
});

module.exports = router;