import mongoose from "mongoose";
import { toJSON } from "./toJSON.js";

export const ISSUE_TYPES = ["provider_error", "timeout", "user_report"];
export const ISSUE_STATUSES = ["open", "in_progress", "resolved"];

const chatIssueSchema = new mongoose.Schema(
  {
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message", index: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: ISSUE_TYPES, required: true, index: true },
    reason: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ISSUE_STATUSES, default: "open", index: true },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  {
    timestamps: true,
    toJSON,
  }
);

const ChatIssue = mongoose.model("ChatIssue", chatIssueSchema);
export default ChatIssue;
