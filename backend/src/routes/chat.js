import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { chatLimiter } from "../middleware/rateLimiters.js";
import { idParamSchema } from "../validators/admin.js";
import {
  createConversationSchema,
  conversationsQuerySchema,
  sendMessageSchema,
  reportMessageSchema,
} from "../validators/chat.js";
import {
  listBots,
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage,
  reportMessage,
} from "../controllers/chatController.js";

const router = Router();

router.use(authenticate);

router.get("/bots", listBots);

router.post("/conversations", validate(createConversationSchema), createConversation);
router.get("/conversations", validate({ query: conversationsQuerySchema }), listConversations);
router.get("/conversations/:id", validate({ params: idParamSchema }), getConversation);
router.delete("/conversations/:id", validate({ params: idParamSchema }), deleteConversation);
router.post(
  "/conversations/:id/messages",
  chatLimiter,
  validate({ params: idParamSchema, body: sendMessageSchema }),
  sendMessage
);

router.post("/messages/:id/report", validate({ params: idParamSchema, body: reportMessageSchema }), reportMessage);

export default router;
