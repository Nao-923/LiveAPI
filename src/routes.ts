// src/routes.ts
import { Request, Response, Router } from "express";
import { RconClient } from "./services/rconClient";

const router = Router();

/**
 * `/list` エンドポイント（現在のオンラインプレイヤー取得）
 */
router.get("/list", async (_req: Request, res: Response): Promise<void> => {
  try {
    const rcon = new RconClient();
    const response = await rcon.sendCommand("/list");

    if (typeof response !== "string") {
      throw new Error("Invalid RCON response");
    }

    // カラーコードを削除
    const cleanResponse = response.replace(/§[0-9a-fk-or]/gi, "").trim();
    console.log(`Cleaned RCON response: ${cleanResponse}`);

    // `/list` のレスポンスを解析
    const lines = cleanResponse.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    console.log("🔍 Parsed Lines:", lines);

    if (lines.length === 0) {
      throw new Error("Empty RCON response");
    }

    // プレイヤー数の取得
    const match = lines[0].match(/There are (\d+) out of maximum (\d+) players online\./);
    if (!match) {
      console.error("❌ Failed to parse RCON response:", cleanResponse);
      res.status(500).json({ error: "Failed to parse RCON response" });
      return;
    }

    const playerCount = parseInt(match[1], 10);
    const maxPlayers = parseInt(match[2], 10);

    // プレイヤーリストの取得（2行目以降）
    const players = lines.slice(1)
      .map(line => line.replace(/^[^:]+:\s*/, "").trim()) // "default: fnetnon" → "fnetnon"
      .filter(name => name.length > 0); // 空データを除外

    const result = { playerCount, maxPlayers, players };
    console.log("✅ Parsed JSON response:", result);
    res.json(result);
  } catch (error) {
    console.error("❌ Error in /list:", error);
    res.status(500).json({ error: "Failed to fetch player list" });
  }
});

/**
 * `/tellraw` エンドポイント（`tellraw` を使用）
 */
router.get("/announce", async (req: Request, res: Response): Promise<void> => {
  try {
    const message = req.query.message as string;
    const color = (req.query.color as string) || "yellow"; // デフォルト: 黄色

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
    console.error("❌ Error in /tellraw:", error);
    res.status(500).json({ error: "Failed to send tellraw message" });
  }
});

/**
 * `/say` エンドポイント（`say` を使用）
 */
router.get("/say", async (req: Request, res: Response): Promise<void> => {
  try {
    const message = req.query.message as string;

    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: "アナウンス内容が指定されていません" });
      return;
    }

    const rcon = new RconClient();
    const sayCommand = `/say ${message}`;
    console.log("Executing say command:", sayCommand);
    const response = await rcon.sendCommand(sayCommand);
    res.json({ response });
  } catch (error) {
    console.error("❌ Error in /say:", error);
    res.status(500).json({ error: "Failed to send say message" });
  }
});

export default router;