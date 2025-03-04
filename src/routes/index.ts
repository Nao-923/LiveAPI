import { Router } from "express";
import listRoutes from "./list";
import commandRoutes from "./command";
import announceRoutes from "./announce";
import userlogRoutes from "./userlog";
import deathlogRoutes from "./deathlog";
const router = Router();

router.use("/list", listRoutes);
router.use("/command", commandRoutes);
router.use("/announce", announceRoutes);
router.use("/userlog", userlogRoutes);
router.use("/deathlog", deathlogRoutes);

export default router;
