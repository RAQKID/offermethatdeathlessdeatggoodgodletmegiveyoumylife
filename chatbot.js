// Install dependencies first:
// npm i express bytez.js
// or
// yarn add express bytez.js

import express from "express";
import Bytez from "bytez.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Bytez SDK
const sdk = new Bytez("d4a9f21b7259ba6686d4cc91e900ffa0");

// Choose your model
const model = sdk.model("Qwen/Qwen3-4B");

// API endpoint: /api/ask?prompt=YOUR_PROMPT
app.get("/api/ask", async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).json({
      status: false,
      result: [{ response: "Prompt is required" }]
    });
  }

  try {
    const { error, output } = await model.run([
      {
        role: "system",
        content: "You are Axel (version 4) (based on Axel 4v program developed by Raqkid AI), a helpful AI assistant that answers concisely and clearly."
      },
      {
        role: "user",
        content: prompt
      },
    ]);

    if (error) {
      return res.status(500).json({
        status: false,
        result: [{ response: error }]
      });
    }

    // If output is an object (e.g., {role, content}), extract content
    let responseText = output;
    if (typeof output === "object" && output.content) {
      responseText = output.content;
    }

    res.json({
      status: true,
      result: [
        { response: responseText }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      result: [{ response: "Something went wrong" }]
    });
  }
});

// Handle unknown routes with JSON 404
app.use((req, res) => {
  res.status(404).json({
    status: false,
    result: [{ response: "Route not found" }]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});