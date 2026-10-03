import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, listUsersQuerySchema, userRoleSchema, userStatusSchema } from "../validators/admin.js";
import { adminSosQuerySchema } from "../validators/sos.js";
import { createLegalRightSchema, updateLegalRightSchema } from "../validators/legal.js";
import { listUsers, setUserRole, setUserStatus, getStats } from "../controllers/adminUserController.js";
import { listAllSosEvents, resolveSosEvent } from "../controllers/adminSosController.js";
import { createRight, updateRight, deleteRight } from "../controllers/legalController.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/users", validate({ query: listUsersQuerySchema }), listUsers);
router.patch("/users/:id/role", validate({ params: idParamSchema, body: userRoleSchema }), setUserRole);
router.patch("/users/:id/status", validate({ params: idParamSchema, body: userStatusSchema }), setUserStatus);
router.get("/sos", validate({ query: adminSosQuerySchema }), listAllSosEvents);
router.patch("/sos/:id/resolve", validate({ params: idParamSchema }), resolveSosEvent);
router.post("/legal", validate(createLegalRightSchema), createRight);
router.patch("/legal/:id", validate({ params: idParamSchema, body: updateLegalRightSchema }), updateRight);
router.delete("/legal/:id", validate({ params: idParamSchema }), deleteRight);
router.get("/stats", getStats);

export default router;
