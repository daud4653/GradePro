import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    roll: { type: String, required: true, unique: true },
    section: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
