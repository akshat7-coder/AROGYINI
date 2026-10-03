import mongoose from "mongoose";

export const SOS_STATUSES = ["active", "resolved", "cancelled"];

const notificationSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    status: { type: String, enum: ["sent", "failed"], required: true },
    providerSid: String,
    error: String,
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sosEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
      accuracy: Number,
    },
    mapsUrl: { type: String, required: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: SOS_STATUSES, default: "active", index: true },
    notifications: [notificationSchema],
    resolvedAt: Date,
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

const SosEvent = mongoose.model("SosEvent", sosEventSchema);
export default SosEvent;
