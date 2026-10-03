import mongoose from "mongoose";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const ROLES = ["user", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ROLES, default: "user", index: true },
    isActive: { type: Boolean, default: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS },
    city: { type: String, trim: true, maxlength: 80 },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

const User = mongoose.model("User", userSchema);
export default User;
