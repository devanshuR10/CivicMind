const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "sih_super_secret_jwt_key_2026_grievance_portal";

/**
 * Middleware to authenticate requests via Bearer JWT token.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user record from DB to verify user exists and active
    const user = await db.prepare("SELECT id, name, email, role, department_id FROM users WHERE id = ?").get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User account no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired authorization token." });
  }
}

/**
 * Middleware to enforce specific user roles (e.g. 'CITIZEN', 'OFFICER', 'SUPER_ADMIN').
 */
function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Requires one of the following roles: ${roles.join(", ")}` });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
};
