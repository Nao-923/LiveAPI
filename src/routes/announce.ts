import { Router, Request, Response } from "express";
import { RconClient } from "../services/rconClient";

const router = Router();

router.get("/tellraw", async (req: Request, res: Response): Promise<void> => {
  const message = req.query.message as string;
  const color = (req.query.color as string) || "yellow";

  if (!message) {
    res.status(400).json({ error: "アナウンス内容が指定されていません" });
    return;
  }

  const rcon = new RconClient();
  const response = await rcon.sendCommand(`/tellraw @a {"text":"${message}","color":"${color}"}`);
  res.json({ response });
});

router.get("/say", async (req: Request, res: Response): Promise<void> => {
  const message = req.query.message as string;

  if (!message) {
    res.status(400).json({ error: "アナウンス内容が指定されていません" });
    return;
  }

  const rcon = new RconClient();
  const response = await rcon.sendCommand(`/say ${message}`);
  res.json({ response });
});

export default router;
