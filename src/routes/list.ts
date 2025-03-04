import { Router, Request, Response } from "express";
import { RconClient } from "../services/rconClient";

const router = Router();

router.get("/list", async (_req: Request, res: Response): Promise<void> => {
  const rcon = new RconClient();
  const response = await rcon.sendCommand("/list");
  console.log(`🔍 RCON raw response:`, response); // 追加
  
  if (typeof response !== "string") {
    res.status(500).json({ error: "Invalid RCON response" });
    return;
  }

  // カラーコードを削除
  const cleanResponse = response.replace(/§[0-9a-fk-or]/g, "").trim();
  console.log(`Cleaned RCON response: ${cleanResponse}`);

  // `/list` のレスポンスを解析
  const match = cleanResponse.match(/(\d+) 人のプレイヤーが接続中です。最大接続可能人数: (\d+)\n?\s*(.*)/);

  if (!match) {
    res.status(500).json({ error: "Failed to parse RCON response" });
    return;
  }

  const playerCount = parseInt(match[1], 10);
  const maxPlayers = parseInt(match[2], 10);

  // プレイヤーリストを整形（"default: " などのグループ情報を削除）
  const players = match[3]
    ? match[3]
        .split(",")
        .map(name => name.trim().replace(/^[^:]+:\s*/, "")) // "default: fnetnon" → "fnetnon"
        .filter(name => name.length > 0) // 空データを除外
    : [];

  // 整形後のデータを JSON 形式で返す
  const result = {
    playerCount,
    maxPlayers,
    players
  };

  console.log(`Parsed JSON response:`, result);
  res.json(result);
});

export default router;
