import mongoose from "mongoose";

export const JOB_TYPES = ["full-time", "part-time", "remote", "returnship", "internship"];

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    company: { type: String, required: true, trim: true, maxlength: 160 },
    location: { type: String, trim: true, maxlength: 160 },
    type: { type: String, enum: JOB_TYPES, required: true, index: true },
    category: { type: String, trim: true, maxlength: 80, index: true },
    salaryRange: { type: String, trim: true, maxlength: 120 },
    experienceLevel: { type: String, trim: true, maxlength: 80 },
    description: { type: String, required: true, maxlength: 5000 },
    requirements: [{ type: String, trim: true, maxlength: 400 }],
    benefits: [{ type: String, trim: true, maxlength: 400 }],
    careerBreakFriendly: { type: Boolean, default: false, index: true },
    applyUrl: { type: String, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true, index: true },
    postedAt: { type: Date, default: Date.now },
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

const Job = mongoose.model("Job", jobSchema);
export default Job;
