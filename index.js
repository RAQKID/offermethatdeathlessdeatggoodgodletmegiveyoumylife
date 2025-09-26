import express from "express";
import Bytez from "bytez.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Bytez SDK using API key from .env
const sdk = new Bytez(process.env.BYTEZ_API_KEY);

// Choose your model
const model = sdk.model("Qwen/Qwen3-0.6B");

// Root route
app.get("/", (req, res) => {
  res.send("Axentra is running!");
});

// API endpoint: /api/ask?prompt=YOUR_PROMPT
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
      {
        role: "system",
        content:
          "You are Axentra (version 4) (developed by Raqkid505 AI), a helpful AI assistant that answers concisely and clearly."
      },
      {
        role: "user",
        content: prompt
      },
    ]);

    // Handle SDK errors
    if (error) {
      let cleanError = error;
      if (typeof cleanError === "string" && /^Rejected:/i.test(cleanError)) {
        cleanError = "Rejected: Try again later!";
      }
      return res.status(500).json({
        status: false,
        result: [{ response: cleanError }]
      });
    }

    // Extract response text
    let responseText =
      typeof output === "object" && output.content ? output.content : output;

    // Remove <think>...</think> blocks
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // If model output is a rejection → force status false
    if (/^Rejected:/i.test(responseText)) {
      responseText = "Rejected: Try again later!";
      return res.json({
        status: false,
        result: [{ response: responseText }]
      });
    }

    // Normal successful response
    res.json({
      status: true,
      result: [{ response: responseText }]
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
