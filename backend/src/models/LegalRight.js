import mongoose from "mongoose";

export const LEGAL_CATEGORIES = ["workplace", "domestic", "marriage", "cyber", "criminal", "media"];

const faqSchema = new mongoose.Schema({ q: { type: String, required: true }, a: { type: String, required: true } }, { _id: false });

const legalRightSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    actName: { type: String, required: true, trim: true, maxlength: 200 },
    year: { type: Number, min: 1800, max: 2200 },
    category: { type: String, enum: LEGAL_CATEGORIES, required: true, index: true },
    summary: { type: String, required: true, maxlength: 2000 },
    keyProtections: [String],
    howToFile: [String],
    penalties: { type: String, maxlength: 2000 },
    helplines: [String],
    faqs: [faqSchema],
    isPublished: { type: Boolean, default: true, index: true },
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

legalRightSchema.index({ title: "text", actName: "text", summary: "text" });

const LegalRight = mongoose.model("LegalRight", legalRightSchema);
export default LegalRight;
