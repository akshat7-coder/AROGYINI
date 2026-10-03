import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, listUsersQuerySchema, userRoleSchema, userStatusSchema } from "../validators/admin.js";
import { listUsers, setUserRole, setUserStatus, getStats } from "../controllers/adminUserController.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/users", validate({ query: listUsersQuerySchema }), listUsers);
router.patch("/users/:id/role", validate({ params: idParamSchema, body: userRoleSchema }), setUserRole);
router.patch("/users/:id/status", validate({ params: idParamSchema, body: userStatusSchema }), setUserStatus);
router.get("/stats", getStats);

export default router;
