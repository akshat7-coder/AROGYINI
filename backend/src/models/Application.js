import mongoose from "mongoose";

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
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

applicationSchema.index({ user: 1, job: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
