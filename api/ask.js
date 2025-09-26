const express = require("express");
const { fromExpress } = require("@vercel/node");
const Bytez = require("bytez.js");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const sdk = new Bytez(process.env.BYTEZ_API_KEY);
const model = sdk.model("Qwen/Qwen3-4B");

// Root check
app.get("/", (req, res) => {
  res.send("Axentra is Running");
});

// Main endpoint
app.get("/chatbot", async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).json({ status: false, result: [{ response: "Prompt is required" }] });
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

    let responseText = typeof output === "object" && output.content ? output.content : output;
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    if (/^Rejected:/i.test(responseText)) {
      return res.json({ status: false, result: [{ response: "Rejected: Try again later!" }] });
    }

    res.json({ status: true, result: [{ response: responseText }] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, result: [{ response: "Something went wrong" }] });
  }
});

module.exports = fromExpress(app);
