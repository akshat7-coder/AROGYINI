import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { signupSchema, signinSchema, updateMeSchema, changePasswordSchema } from "../validators/auth.js";
import { signup, signin, getMe, updateMe, changePassword } from "../controllers/authController.js";

const router = Router();

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/signin", authLimiter, validate(signinSchema), signin);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, validate(updateMeSchema), updateMe);
router.patch("/password", authenticate, validate(changePasswordSchema), changePassword);

export default router;
