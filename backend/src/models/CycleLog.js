import mongoose from "mongoose";
import { toJSON } from "./toJSON.js";

export const FLOW_LEVELS = ["spotting", "light", "medium", "heavy"];

const cycleLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: Date,
    flow: { type: String, enum: FLOW_LEVELS, default: "medium" },
    symptoms: [{ type: String, trim: true, maxlength: 40 }],
    mood: { type: String, trim: true, maxlength: 40 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON,
  }
);

cycleLogSchema.index({ user: 1, startDate: -1 });

const CycleLog = mongoose.model("CycleLog", cycleLogSchema);
export default CycleLog;
