// api/chatbot.js
const express = require("express");
const dotenv = require("dotenv");
const { fromExpress } = require("@vercel/node");

let Bytez, sdk, model;

// Load env vars
dotenv.config();

try {
  Bytez = require("bytez.js");

  if (process.env.BYTEZ_API_KEY) {
    sdk = new Bytez(process.env.BYTEZ_API_KEY);
    model = sdk.model("Qwen/Qwen3-4B");
    console.log("✅ Bytez SDK initialized");
  } else {
    console.warn("⚠️ BYTEZ_API_KEY is not set. Falling back to dummy mode.");
  }
} catch (err) {
  console.error("❌ Failed to load Bytez SDK:", err.message);
}

const app = express();

// Root route
app.get("/", (req, res) => {
  res.send("Axentra is Running");
});

// Main endpoint
app.get("/chatbot", async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).json({
      status: false,
      result: [{ response: "Prompt is required" }]
    });
  }

  // If SDK not ready, fallback response
  if (!model) {
    return res.json({
      status: true,
      result: [{ response: `Echo: ${prompt}` }]
    });
  }

  try {
    const { error, output } = await model.run([
      { role: "system", content: "You are Axentra (version 4), a helpful AI assistant." },
      { role: "user", content: prompt }
    ]);

    if (error) {
      let cleanError = error;
      if (typeof cleanError === "string" && /^Rejected:/i.test(cleanError)) {
        cleanError = "Rejected: Try again later!";
      }
      return res.status(500).json({ status: false, result: [{ response: cleanError }] });
    }

    let responseText =
      typeof output === "object" && output.content ? output.content : output;

    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    if (/^Rejected:/i.test(responseText)) {
      return res.json({
        status: false,
        result: [{ response: "Rejected: Try again later!" }]
      });
    }

    res.json({ status: true, result: [{ response: responseText }] });
  } catch (err) {
    console.error("❌ Chatbot error:", err);
    res.status(500).json({
      status: false,
      result: [{ response: "Something went wrong" }]
    });
  }
});

// ✅ Export wrapped app as a Vercel serverless handler
module.exports = fromExpress(app);
