//// /api/ask.js
import Bytez from "bytez.js";
import dotenv from "dotenv";

dotenv.config();

const sdk = new Bytez(process.env.BYTEZ_API_KEY);
const model = sdk.model("Qwen/Qwen3-0.6B");

export default async function handler(req, res) {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).json({
      status: false,
      result: [{ response: "Prompt is required" }]
    });
  }

  try {
    const { error, output } = await model.run([
      { role: "system", content: "You are Axentra, a helpful AI assistant." },
      { role: "user", content: prompt }
    ]);

    if (error) throw error;

    let responseText =
      typeof output === "object" && output.content ? output.content : output;
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

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
}
