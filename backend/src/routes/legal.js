import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { rightsQuerySchema, slugParamSchema, draftSchema } from "../validators/legal.js";
import { listRights, getRight, createDraft } from "../controllers/legalController.js";

const router = Router();

router.get("/rights", validate({ query: rightsQuerySchema }), listRights);
router.get("/rights/:slug", validate({ params: slugParamSchema }), getRight);
router.post("/drafts", authenticate, validate(draftSchema), createDraft);

export default router;
