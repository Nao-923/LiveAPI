import { Router } from "express";
import { getDeathLogs } from "../services/notionService";

const router = Router();

/**
 * 💀 プレイヤーの死亡データ取得エンドポイント
 * GET /api/deathlog
 */
router.get("/", async (_req, res) => {
  const logs = await getDeathLogs();
  res.json({ status: "success", data: logs });
});

export default router;
