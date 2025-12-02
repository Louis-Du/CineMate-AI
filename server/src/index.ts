import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

// FRONTEND_ORIGIN: limita CORS al dominio de tu frontend en producción
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
app.use(cors({ origin: FRONTEND_ORIGIN }));

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("ERROR: API_KEY not set in environment!");
}
const client = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Opcional: poner la instrucción de sistema en env var SYSTEM_INSTRUCTION
const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION || "";

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) return res.status(500).json({ error: "Server not configured (missing API_KEY)" });
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const chat = client.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
      history: history || []
    });

    const result = await chat.sendMessage({ message });
    return res.json({ text: result.text, raw: result });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`CineMate-AI backend listening on ${port}`);
});
