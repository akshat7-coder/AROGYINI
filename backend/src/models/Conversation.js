import mongoose from "mongoose";
import { toJSON } from "./toJSON.js";

export const TITLE_MAX = 60;
export const DEFAULT_TITLE = "New conversation";

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, maxlength: TITLE_MAX, default: DEFAULT_TITLE },
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON,
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
