import express from "express";
import Student from "../models/Student.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import logger from "../utils/logger.js";

const router = express.Router();
const log = logger.child("StudentRoutes");

// Add student
router.post("/", auth, async (req, res) => {
  try {
    const { name, email, roll } = req.body;
    const existing = await Student.findOne({ $or: [{ email }, { roll }] });
    if (existing)
      return res.status(400).json({ message: "Student already exists" });

    const student = new Student({ name, email, roll });
    await student.save();
    log.info("Student added", { studentId: student._id, roll });
    res.status(201).json({ message: "Student added", student });
  } catch (err) {
    log.error("Failed to add student", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Get all students (with optional section filter for admin)
router.get("/", auth, async (req, res) => {
  try {
    let query = {};
    
    // If admin filters by section
    if (req.query.section && req.user.role === "admin") {
      query.section = req.query.section;
    }
    
    const students = await Student.find(query);
    log.debug("Fetched students", { count: students.length, section: req.query.section });
    res.json(students);
  } catch (err) {
    log.error("Failed to fetch students", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Update student section (admin only)
router.patch("/:id/section", auth, adminAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { section } = req.body;
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.section = section || "";
    await student.save();

    // Also update user section if exists
    const User = (await import("../models/User.js")).default;
    const user = await User.findOne({ email: student.email });
    if (user) {
      user.section = section || "";
      await user.save();
    }

    log.info("Student section updated", { studentId: student._id, section });
    res.json({ message: "Section updated successfully", student });
  } catch (err) {
    log.error("Failed to update student section", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
