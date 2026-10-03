import mongoose from "mongoose";
import { toJSON } from "./toJSON.js";

export const MAX_CONTACTS_PER_USER = 5;

const emergencyContactSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    relation: { type: String, trim: true, maxlength: 40 },
    phone: { type: String, required: true, trim: true },
    priority: { type: Number, min: 1, max: 5, default: 1 },
  },
  {
    timestamps: true,
    toJSON,
  }
);

emergencyContactSchema.index({ user: 1, phone: 1 }, { unique: true });

const EmergencyContact = mongoose.model("EmergencyContact", emergencyContactSchema);
export default EmergencyContact;
