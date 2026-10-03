import mongoose from "mongoose";
import { toJSON } from "./toJSON.js";

export const BOT_KEYS = ["medical", "legal", "general"];

const botConfigSchema = new mongoose.Schema(
  {
    key: { type: String, enum: BOT_KEYS, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    url: { type: String, trim: true, maxlength: 500 },
    enabled: { type: Boolean, default: true },
    timeoutMs: { type: Number, default: 30000, min: 1000, max: 120000 },
  },
  {
    timestamps: true,
    toJSON,
  }
);

const BotConfig = mongoose.model("BotConfig", botConfigSchema);
export default BotConfig;
