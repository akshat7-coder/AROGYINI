import mongoose from "mongoose";
import { toJSON } from "./toJSON.js";

export const MESSAGE_ROLES = ["user", "assistant"];
export const MESSAGE_BOTS = ["medical", "legal", "general", "fallback"];
export const MESSAGE_STATUSES = ["ok", "failed"];
export const INTENTS = ["health", "legal", "career", "safety", "general"];

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true, maxlength: 20000 },
    bot: { type: String, enum: MESSAGE_BOTS },
    intent: { type: String, enum: INTENTS },
    emergency: { type: Boolean, default: false },
    // Citations from the medical and legal RAG bots; empty for the general LLM and fallbacks.
    sources: {
      type: [{ _id: false, title: { type: String, maxlength: 200 }, source: { type: String, maxlength: 200 } }],
      default: undefined,
    },
    status: { type: String, enum: MESSAGE_STATUSES, default: "ok", index: true },
    latencyMs: Number,
  },
  {
    timestamps: true,
    toJSON,
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

messageSchema.index({ conversation: 1, status: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, role: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
