import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { sosLimiter } from "../middleware/rateLimiters.js";
import { idParamSchema } from "../validators/admin.js";
import { triggerSosSchema, sosListQuerySchema, resolveQuerySchema } from "../validators/sos.js";
import {
  triggerSos,
  listSosEvents,
  getSosEvent,
  resolveSosEvent,
  cancelSosEvent,
} from "../controllers/sosController.js";

const router = Router();


router.post("/", sosLimiter, validate(triggerSosSchema), triggerSos);
router.get("/", validate({ query: sosListQuerySchema }), listSosEvents);
router.get("/:id", validate({ params: idParamSchema }), getSosEvent);
router.patch("/:id/resolve", validate({ params: idParamSchema, query: resolveQuerySchema }), resolveSosEvent);
router.patch("/:id/cancel", validate({ params: idParamSchema }), cancelSosEvent);

export default router;
