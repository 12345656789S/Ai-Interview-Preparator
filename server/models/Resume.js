import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    extractedText: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Resume", resumeSchema);