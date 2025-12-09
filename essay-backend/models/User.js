import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "teacher", "student"], default: "student" },
  section: { type: String, default: "" },
  securityQuestion: { type: String, default: "" },
  securityAnswer: { type: String, default: "" } // Hashed answer
});

export default mongoose.model("User", userSchema);
