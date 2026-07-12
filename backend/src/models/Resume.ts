import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    rawText: {
      type: String,
      required: true
    },

    skills: [String],

    strengths: [String],

    gaps: [String]
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Resume",
  resumeSchema
);