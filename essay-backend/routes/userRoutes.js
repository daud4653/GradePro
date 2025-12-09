import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import logger from "../utils/logger.js";

const router = express.Router();
const log = logger.child("UserRoutes");

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, section, role, securityQuestion, securityAnswer } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = securityAnswer ? await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10) : "";
    
    const newUser = new User({ 
      email, 
      password: hashedPassword,
      section: section || "",
      role: role || "student", // Default to student
      securityQuestion: securityQuestion || "",
      securityAnswer: hashedSecurityAnswer
    });
    await newUser.save();

    log.info("User registered", { userId: newUser._id, email, role: newUser.role, hasSecurityQuestion: !!securityQuestion });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    log.error("Registration failed", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    log.info("User logged in", { userId: user._id, email, role: user.role });
    res.json({ token, user: { role: user.role, section: user.section, email: user.email } });
  } catch (err) {
    log.error("Login failed", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    log.error("Failed to fetch user profile", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Update current user's section (for students)
router.patch("/me/section", auth, async (req, res) => {
  try {
    const { section } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only students can update their own section
    if (user.role !== "student") {
      return res.status(403).json({ message: "Only students can update their section" });
    }

    user.section = section || "";
    await user.save();

    // Also update student record if exists
    const Student = (await import("../models/Student.js")).default;
    const student = await Student.findOne({ email: user.email });
    if (student) {
      student.section = section || "";
      await student.save();
    }

    log.info("User section updated", { userId: user._id, email: user.email, section });
    res.json({ message: "Section updated successfully", user: { role: user.role, section: user.section, email: user.email } });
  } catch (err) {
    log.error("Failed to update user section", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});


// Get security question for password reset
router.post("/forgot-password/question", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    
    // Always return same response to prevent email enumeration
    if (!user || !user.securityQuestion) {
      return res.json({ 
        hasSecurityQuestion: false,
        message: "Security question not available for this account" 
      });
    }

    res.json({ 
      hasSecurityQuestion: true,
      securityQuestion: user.securityQuestion 
    });
  } catch (err) {
    log.error("Get security question failed", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password using security question
router.post("/reset-password/question", async (req, res) => {
  try {
    const { email, securityAnswer, password } = req.body;
    
    if (!email || !securityAnswer || !password) {
      return res.status(400).json({ message: "Email, security answer, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.securityQuestion || !user.securityAnswer) {
      return res.status(400).json({ message: "Security question not set for this account" });
    }

    // Verify security answer (case-insensitive, trimmed)
    const isAnswerCorrect = await bcrypt.compare(
      securityAnswer.toLowerCase().trim(),
      user.securityAnswer
    );

    if (!isAnswerCorrect) {
      log.warn("Incorrect security answer", { email });
      return res.status(400).json({ message: "Incorrect security answer" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    log.info("Password reset successful via security question", { email });
    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    log.error("Reset password via security question failed", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
