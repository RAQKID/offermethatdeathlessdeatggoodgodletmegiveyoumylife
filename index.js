const express = require("express");
const Bytez = require("bytez.js");

const app = express();

if (!process.env.BYTEZ_API_KEY) {
  console.error("❌ BYTEZ_API_KEY is not set");
}

const sdk = new Bytez(process.env.BYTEZ_API_KEY);
const model = sdk.model("Qwen/Qwen1.5-1.8B-Chat");

// Root route
app.get("/", (req, res) => {
  res.send("Axentra is Running ✅");
});

// Ask endpoint
app.get("/ask", async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).json({
      status: false,
      result: [{ response: "Prompt is required" }]
    });
  }

  try {
    const { error, output } = await model.run([
      { role: "system", content: "You are Axentra (version 4), a helpful AI assistant." },
      { role: "user", content: prompt }
    ]);

    if (error) {
      console.error("❌ Bytez SDK error:", error);
      return res.status(500).json({ status: false, result: [{ response: String(error) }] });
    }

    let responseText = typeof output === "object" && output.content ? output.content : output;
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    res.json({ status: true, result: [{ response: responseText }] });
  } catch (err) {
    console.error("🔥 Unexpected error:", err);
    res.status(500).json({ status: false, result: [{ response: err.message || "Internal error" }] });
  }
});

// ❌ Do not use app.listen() on Vercel
module.exports = app;
