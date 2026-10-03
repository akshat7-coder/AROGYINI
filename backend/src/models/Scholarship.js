import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    provider: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: String, trim: true, maxlength: 160 },
    eligibility: [{ type: String, trim: true, maxlength: 400 }],
    // Optional: rolling schemes such as Stand-Up India have no closing date.
    deadline: { type: Date, index: true },
    link: { type: String, trim: true, maxlength: 500 },
    domain: { type: String, trim: true, maxlength: 80, index: true },
    isActive: { type: Boolean, default: true, index: true },
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

const Scholarship = mongoose.model("Scholarship", scholarshipSchema);
export default Scholarship;
