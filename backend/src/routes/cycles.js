import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/admin.js";
import { createCycleSchema, updateCycleSchema, cycleListQuerySchema } from "../validators/cycles.js";
import { listCycles, createCycle, updateCycle, deleteCycle, getSummary } from "../controllers/cycleController.js";

const router = Router();

router.use(authenticate);

router.get("/summary", getSummary);
router.get("/", validate({ query: cycleListQuerySchema }), listCycles);
router.post("/", validate(createCycleSchema), createCycle);
router.patch("/:id", validate({ params: idParamSchema, body: updateCycleSchema }), updateCycle);
router.delete("/:id", validate({ params: idParamSchema }), deleteCycle);

export default router;
