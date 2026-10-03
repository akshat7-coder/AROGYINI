import mongoose from "mongoose";
import { toJSON } from "./toJSON.js";

export const APPLICATION_STATUSES = ["submitted", "reviewed", "accepted", "rejected"];

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    coverNote: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: APPLICATION_STATUSES, default: "submitted", index: true },
  },
  {
    timestamps: true,
    toJSON,
  }
);

applicationSchema.index({ user: 1, job: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
