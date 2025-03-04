import { Client } from "@notionhq/client";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { RconClient } from "./rconClient";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_SESSIONS_DB_ID = process.env.NOTION_SESSIONS_DB_ID;
const NOTION_BOT_DB_ID = process.env.NOTION_BOT_DB_ID;

const notion = new Client({ auth: NOTION_API_KEY });

/**
 * `/list` エンドポイント（現在のオンラインプレイヤー取得）
 */
app.get("/list", async (_req, res) => {
  try {
    const rcon = new RconClient();
    const response = await rcon.sendCommand("/list");

    if (typeof response !== "string") {
      throw new Error("Invalid RCON response");
    }

    const cleanResponse = response.replace(/§[0-9a-fk-or]/gi, "").trim();
    console.log(`Cleaned RCON response: ${cleanResponse}`);

    const lines = cleanResponse.split("\n").map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new Error("Empty RCON response");
    }

    const match = lines[0].match(/There are (\d+) out of maximum (\d+) players online\./);
    if (!match) {
      res.status(500).json({ error: "Failed to parse RCON response" });
      return;
    }

    const playerCount = parseInt(match[1], 10);
    const maxPlayers = parseInt(match[2], 10);
    const players = lines.slice(1).map(line => line.replace(/^[^:]+:\s*/, "").trim()).filter(name => name.length > 0);

    res.json({ playerCount, maxPlayers, players });
  } catch (error) {
    console.error("❌ Error in /list:", error);
    res.status(500).json({ error: "Failed to fetch player list" });
  }
});

/**
 * `/announce` エンドポイント（`tellraw` を使用）
 */
app.get("/announce", async (req, res) => {
  try {
    const message = req.query.message as string;
    const color = (req.query.color as string) || "yellow";

    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: "アナウンス内容が指定されていません" });
      return;
    }

    const rcon = new RconClient();
    const tellrawCommand = `/tellraw @a {"text":"${message}","color":"${color}"}`;
    console.log("Executing tellraw command:", tellrawCommand);
    const response = await rcon.sendCommand(tellrawCommand);
    res.json({ response });
  } catch (error) {
    console.error("❌ Error in /announce:", error);
    res.status(500).json({ error: "Failed to send tellraw message" });
  }
});

/**
 * `/sessionlog` エンドポイント（セッションログ取得用）
 */
app.get("/sessionlog", async (_req, res) => {
try {
    const response = await notion.databases.query({ database_id: NOTION_SESSIONS_DB_ID || "" });
    res.json(response.results);
} catch (error) {
    console.error("❌ Error in /sessionlog:", error);
    res.status(500).json({ error: "Failed to fetch session log" });
}
});

/**
 * `/botlog` エンドポイント（Botログ取得用）
 */
app.get("/botlog", async (_req, res) => {
try {
    const response = await notion.databases.query({ database_id: NOTION_BOT_DB_ID || "" });
    res.json(response.results);
} catch (error) {
    console.error("❌ Error in /botlog:", error);
    res.status(500).json({ error: "Failed to fetch bot log" });
}
});

const PORT = process.env.API_PROT || 3000;
app.listen(PORT, () => {
console.log(`✅ LiveAPI server is running on http://localhost:${PORT}`);
});