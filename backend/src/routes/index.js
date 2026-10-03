import { Router } from "express";
import { isDBConnected } from "../config/db.js";
import { ok } from "../utils/apiResponse.js";
import authRoutes from "./auth.js";
import adminRoutes from "./admin.js";
import contactRoutes from "./contacts.js";
import sosRoutes from "./sos.js";
import safetyRoutes from "./safety.js";

const router = Router();

router.get("/health", (req, res) =>
  ok(res, {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: isDBConnected() ? "connected" : "disconnected",
  })
);

router.use("/auth", authRoutes);
router.use("/contacts", contactRoutes);
router.use("/sos", sosRoutes);
router.use("/safety", safetyRoutes);
router.use("/admin", adminRoutes);

export default router;
