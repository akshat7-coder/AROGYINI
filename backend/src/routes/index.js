import { Router } from "express";
import { isDBConnected } from "../config/db.js";
import { ok } from "../utils/apiResponse.js";

const router = Router();

router.get("/health", (req, res) =>
  ok(res, {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: isDBConnected() ? "connected" : "disconnected",
  })
);

export default router;
