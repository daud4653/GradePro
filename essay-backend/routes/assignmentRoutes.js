import express from "express";
import Assignment from "../models/Assignment.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import logger from "../utils/logger.js";

const router = express.Router();
const log = logger.child("AssignmentRoutes");

// Create assignment (admin only)
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const { title, description, dueDate, totalMarks, instructions, attachmentName, sections } = req.body;

    if (!title || !dueDate || !totalMarks) {
      return res.status(400).json({ message: "Title, due date, and total marks are required" });
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      totalMarks,
      instructions,
      attachmentName,
      sections: sections || [], // Empty array means all sections
    });

    log.info("Assignment created", { assignmentId: assignment._id, title, sections: assignment.sections });
    res.status(201).json(assignment);
  } catch (err) {
    log.error("Assignment create error", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// List assignments (filtered by section for students)
router.get("/", auth, async (req, res) => {
  try {
    let query = {};
    
    // If user is a student, only show assignments for their section (or all sections if sections array is empty)
    if (req.user.role === "student" && req.user.section) {
      query = {
        $or: [
          { sections: { $size: 0 } }, // All sections
          { sections: req.user.section } // Their specific section
        ]
      };
    }
    
    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    log.debug("Fetched assignments", { count: assignments.length, userRole: req.user.role });
    res.json(assignments);
  } catch (err) {
    log.error("Assignment list error", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Get single assignment
router.get("/:id", auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      log.warn("Assignment not found", { assignmentId: req.params.id });
      return res.status(404).json({ message: "Assignment not found" });
    }
    res.json(assignment);
  } catch (err) {
    log.error("Assignment fetch error", { error: err.message, assignmentId: req.params.id });
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

