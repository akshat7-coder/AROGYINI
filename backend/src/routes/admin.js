import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, listUsersQuerySchema, userRoleSchema, userStatusSchema } from "../validators/admin.js";
import { adminSosQuerySchema } from "../validators/sos.js";
import { createLegalRightSchema, updateLegalRightSchema } from "../validators/legal.js";
import {
  adminJobsQuerySchema,
  createJobSchema,
  updateJobSchema,
  createScholarshipSchema,
  updateScholarshipSchema,
  applicationsQuerySchema,
  applicationStatusSchema,
} from "../validators/career.js";
import { listUsers, setUserRole, setUserStatus, getStats } from "../controllers/adminUserController.js";
import { listAllSosEvents, resolveSosEvent } from "../controllers/adminSosController.js";
import { createRight, updateRight, deleteRight } from "../controllers/legalController.js";
import {
  listJobs as listAdminJobs,
  createJob,
  updateJob,
  deleteJob,
  listScholarships as listAdminScholarships,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  listJobApplications,
  setApplicationStatus,
} from "../controllers/adminCareerController.js";

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
router.get("/jobs", validate({ query: adminJobsQuerySchema }), listAdminJobs);
router.post("/jobs", validate(createJobSchema), createJob);
router.patch("/jobs/:id", validate({ params: idParamSchema, body: updateJobSchema }), updateJob);
router.delete("/jobs/:id", validate({ params: idParamSchema }), deleteJob);
router.get(
  "/jobs/:id/applications",
  validate({ params: idParamSchema, query: applicationsQuerySchema }),
  listJobApplications
);

router.get("/scholarships", listAdminScholarships);
router.post("/scholarships", validate(createScholarshipSchema), createScholarship);
router.patch("/scholarships/:id", validate({ params: idParamSchema, body: updateScholarshipSchema }), updateScholarship);
router.delete("/scholarships/:id", validate({ params: idParamSchema }), deleteScholarship);

router.patch(
  "/applications/:id",
  validate({ params: idParamSchema, body: applicationStatusSchema }),
  setApplicationStatus
);

router.get("/stats", getStats);

export default router;
