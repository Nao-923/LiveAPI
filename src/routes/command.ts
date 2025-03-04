import { Router, Request, Response } from "express";
import { RconClient } from "../services/rconClient";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { command } = req.body;

  if (!command) {
    res.status(400).json({ error: "コマンドが指定されていません" });
    return;
  }

  const rcon = new RconClient();
  const response = await rcon.sendCommand(command);
  res.json({ response });
});

export default router;
