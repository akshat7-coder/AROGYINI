import { Router } from "express";
import { HELPLINES } from "../data/helplines.js";
import { ok } from "../utils/apiResponse.js";

const router = Router();

router.get("/helplines", (req, res) => ok(res, { helplines: HELPLINES }));

export default router;
