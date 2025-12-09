import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    logger.warn("Missing auth token", { path: req.originalUrl });
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains userId
    
    // Fetch user to get role and section
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user.role = user.role;
      req.user.section = user.section;
    }
    
    return next();
  } catch (err) {
    logger.warn("Invalid auth token", { path: req.originalUrl, error: err.message });
    return res.status(401).json({ message: "Token is not valid" });
  }
};

export default auth; // ✅ ES6 export
