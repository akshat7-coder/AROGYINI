import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, listUsersQuerySchema, userRoleSchema, userStatusSchema } from "../validators/admin.js";
import { adminSosQuerySchema } from "../validators/sos.js";
import { listUsers, setUserRole, setUserStatus, getStats } from "../controllers/adminUserController.js";
import { listAllSosEvents, resolveSosEvent } from "../controllers/adminSosController.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/users", validate({ query: listUsersQuerySchema }), listUsers);
router.patch("/users/:id/role", validate({ params: idParamSchema, body: userRoleSchema }), setUserRole);
router.patch("/users/:id/status", validate({ params: idParamSchema, body: userStatusSchema }), setUserStatus);
router.get("/sos", validate({ query: adminSosQuerySchema }), listAllSosEvents);
router.patch("/sos/:id/resolve", validate({ params: idParamSchema }), resolveSosEvent);
router.get("/stats", getStats);

export default router;
