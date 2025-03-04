import { Router } from "express";
import { getUserLogs } from "../services/notionService";

const router = Router();

/**
 * 🎮 プレイヤーのセッションデータ取得エンドポイント
 * GET /api/userlog
 */
router.get("/", async (_req, res) => {
  const logs = await getUserLogs();
  res.json({ status: "success", data: logs });
});

export default router;
