// models/Essay.js
import mongoose from "mongoose";

const essaySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentRoll: { type: String, required: true },
    studentSection: { type: String, default: "" },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
    grade: { type: Number, default: null },
    gradeLetter: { type: String, default: null },
    gpa: { type: Number, default: null },
    feedback: { type: String, default: "" },
    evaluation: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// Index to prevent duplicate submissions (only one submission per student per assignment)
essaySchema.index({ studentRoll: 1, assignment: 1 }, { unique: true, sparse: true });

export default mongoose.model("Essay", essaySchema);
