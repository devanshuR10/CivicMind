const crypto = require("crypto");

/**
 * Generates a unique, non-sequential grievance tracking ID formatted as GRV-2026-XXXXXX.
 * Does not expose underlying database auto-increment row IDs.
 */
function generateGrievanceId() {
  const currentYear = new Date().getFullYear();
  // Generate 3 random bytes (6 hex chars)
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `GRV-${currentYear}-${randomHex}`;
}

module.exports = {
  generateGrievanceId,
};
