import express from "express";
import Essay from "../models/Essay.js";
import Student from "../models/Student.js";
import Assignment from "../models/Assignment.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import logger from "../utils/logger.js";
import { calculateGradeAndGPA } from "../utils/gradeCalculator.js";

const router = express.Router();
const log = logger.child("EssayRoutes");

// Student submission (no grading)
router.post("/submit", auth, async (req, res) => {
  try {
    const {
      title,
      content,
      assignmentId,
    } = req.body;

    if (!title || !content || !assignmentId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Only students can submit
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit assignments" });
    }

    // Get user info for student
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.section) {
      return res.status(400).json({ message: "Section is required. Please update your profile." });
    }

    // Check assignment exists and is available to student's section
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if assignment is for student's section
    if (assignment.sections.length > 0 && !assignment.sections.includes(user.section)) {
      return res.status(403).json({ message: "This assignment is not available for your section" });
    }

    // Find or create student first to get proper roll
    let student = await Student.findOne({ email: user.email });
    if (!student) {
      student = await Student.create({ 
        name: user.email.split("@")[0], // Use email prefix as name
        email: user.email, 
        roll: user.email, // Use email as roll for now
        section: user.section
      });
      log.info("Student auto-created for submission", { studentId: student._id, email: user.email });
    } else {
      // Update section if needed
      if (student.section !== user.section) {
        student.section = user.section;
        await student.save();
      }
    }

    // Check if student already submitted
    const existingSubmission = await Essay.findOne({ 
      studentRoll: student.roll,
      assignment: assignmentId 
    });

    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this assignment" });
    }


    // Create submission without grade
    const essay = await Essay.create({
      student: student._id,
      studentName: student.name,
      studentEmail: student.email,
      studentRoll: student.roll,
      studentSection: student.section,
      title,
      content,
      assignment: assignment._id,
      grade: null, // No grade on submission
      gradeLetter: null,
      gpa: null,
      feedback: "",
      evaluation: null,
    });

    log.info("Essay submitted", { essayId: essay._id, studentRoll: student.roll });
    res.status(201).json({ message: "Assignment submitted successfully", essay });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: "You have already submitted this assignment" });
    }
    log.error("Essay submission failed", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Admin grading endpoint
router.post("/", auth, adminAuth, async (req, res) => {
  try {
    const {
      studentName,
      studentEmail,
      studentRoll,
      title,
      content,
      grade,
      feedback,
      evaluation,
      assignmentId,
    } = req.body;

    if (!studentName || !studentEmail || !studentRoll || !title || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let student = await Student.findOne({ roll: studentRoll });
    if (!student) {
      student = await Student.create({ name: studentName, email: studentEmail, roll: studentRoll });
      log.info("Student auto-created for essay", { studentId: student._id, roll: studentRoll });
    } else if (student.name !== studentName || student.email !== studentEmail) {
      student.name = studentName;
      student.email = studentEmail;
      await student.save();
      log.debug("Student metadata updated from essay submission", { studentId: student._id });
    }

    let assignment = null;
    if (assignmentId) {
      assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
    }

    // Check for existing submission
    const existingEssay = await Essay.findOne({ studentRoll, assignment: assignmentId });
    
    // Calculate grade letter and GPA
    let gradeLetter = null;
    let gpa = null;
    if (typeof grade === "number" && assignment?.totalMarks) {
      const gradeInfo = calculateGradeAndGPA(grade, assignment.totalMarks);
      gradeLetter = gradeInfo.gradeLetter;
      gpa = gradeInfo.gpa;
    }

    let essay;
    if (existingEssay) {
      // Update existing submission with grade
      existingEssay.grade = typeof grade === "number" ? grade : null;
      existingEssay.gradeLetter = gradeLetter;
      existingEssay.gpa = gpa;
      existingEssay.feedback = feedback ?? "";
      existingEssay.evaluation = evaluation ?? null;
      existingEssay.content = content; // Update content if changed
      await existingEssay.save();
      essay = existingEssay;
      log.info("Essay graded (updated)", { essayId: essay._id, studentRoll });
    } else {
      // Create new essay with grade
      essay = await Essay.create({
        student: student._id,
        studentName,
        studentEmail,
        studentRoll,
        studentSection: student.section || "",
        title,
        content,
        assignment: assignment ? assignment._id : undefined,
        grade: typeof grade === "number" ? grade : null,
        gradeLetter,
        gpa,
        feedback: feedback ?? "",
        evaluation: evaluation ?? null,
      });
      log.info("Essay saved with grade", { essayId: essay._id, studentRoll });
    }

    res.status(201).json({ message: "Essay saved", essay });
  } catch (err) {
    log.error("Essay save failed", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Get all essays (most recent first)
router.get("/", auth, async (_req, res) => {
  try {
    const essays = await Essay.find().sort({ createdAt: -1 }).populate("assignment");
    log.debug("Fetched essays", { count: essays.length });
    res.json(essays);
  } catch (err) {
    log.error("Essay list failed", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Get essays by student roll (for students to see their own submissions)
router.get("/student/:roll", auth, async (req, res) => {
  try {
    // Students can only see their own submissions
    if (req.user.role === "student") {
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(req.user.userId);
      if (!user || user.email !== req.params.roll) {
        return res.status(403).json({ message: "You can only view your own submissions" });
      }
    }
    
    const essays = await Essay.find({ studentRoll: req.params.roll }).sort({ createdAt: -1 }).populate("assignment");
    log.debug("Fetched essays for student", { roll: req.params.roll, count: essays.length });
    res.json(essays);
  } catch (err) {
    log.error("Essay fetch by student failed", { error: err.message, roll: req.params.roll });
    res.status(500).json({ message: "Server error" });
  }
});

// Get all submissions for a specific assignment (admin only)
router.get("/assignment/:assignmentId", auth, adminAuth, async (req, res) => {
  try {
    const essays = await Essay.find({ assignment: req.params.assignmentId })
      .sort({ createdAt: -1 })
      .populate("student")
      .populate("assignment");
    log.debug("Fetched essays for assignment", { assignmentId: req.params.assignmentId, count: essays.length });
    res.json(essays);
  } catch (err) {
    log.error("Essay fetch by assignment failed", { error: err.message, assignmentId: req.params.assignmentId });
    res.status(500).json({ message: "Server error" });
  }
});

// Get current student's submissions (for student portal)
router.get("/my-submissions", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can access their submissions" });
    }

    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.user.userId);
    if (!user || !user.email) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find student by email
    const student = await Student.findOne({ email: user.email });
    if (!student) {
      return res.json([]); // No submissions yet
    }

    const essays = await Essay.find({ studentRoll: student.roll })
      .sort({ createdAt: -1 })
      .populate("assignment");
    
    log.debug("Fetched student's own submissions", { studentEmail: user.email, count: essays.length });
    res.json(essays);
  } catch (err) {
    log.error("Failed to fetch student submissions", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
