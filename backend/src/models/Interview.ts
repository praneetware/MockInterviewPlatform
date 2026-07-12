import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "active"
    },

    messages: [
      {
        role: String,
        content: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],

    feedback: {
      overallScore: Number,

      communication: Number,

      technical: Number,

      problemSolving: Number,

      strengths: [String],

      weaknesses: [String],

      summary: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Interview",
  interviewSchema
);