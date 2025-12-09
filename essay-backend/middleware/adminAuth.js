import User from "../models/User.js";
import logger from "../utils/logger.js";

const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      logger.warn("User not found for admin check", { userId: req.user.userId });
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "admin" && user.role !== "teacher") {
      logger.warn("Non-admin/teacher attempted admin action", { userId: req.user.userId, role: user.role });
      return res.status(403).json({ message: "Admin or teacher access required" });
    }

    req.user.role = user.role;
    req.user.section = user.section;
    next();
  } catch (err) {
    logger.error("Admin auth error", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
};

export default adminAuth;

