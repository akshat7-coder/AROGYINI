import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/admin.js";
import {
  jobsQuerySchema,
  scholarshipsQuerySchema,
  applySchema,
  applicationsQuerySchema,
} from "../validators/career.js";
import {
  listJobs,
  getJob,
  toggleSavedJob,
  listSavedJobs,
  applyToJob,
  listApplications,
  listScholarships,
} from "../controllers/careerController.js";

const router = Router();

router.get("/jobs", validate({ query: jobsQuerySchema }), listJobs);
router.get("/scholarships", validate({ query: scholarshipsQuerySchema }), listScholarships);

router.get("/saved", authenticate, listSavedJobs);
router.get("/applications", authenticate, validate({ query: applicationsQuerySchema }), listApplications);

router.get("/jobs/:id", validate({ params: idParamSchema }), getJob);
router.post("/jobs/:id/save", authenticate, validate({ params: idParamSchema }), toggleSavedJob);
router.post("/jobs/:id/apply", authenticate, validate({ params: idParamSchema, body: applySchema }), applyToJob);

export default router;
