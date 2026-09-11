const { parseGrievanceLocalML, VALID_CATEGORIES, CATEGORY_TO_DEPARTMENT, VALID_PRIORITIES } = require("./localAIService");

/**
 * Main AI Analysis Service for Grievance Lodging
 * Uses 100% Local Self-Trained Scikit-Learn Machine Learning Model (Offline)
 */
async function parseGrievanceText(userText, existingLocation = null, conversationHistory = []) {
  return await parseGrievanceLocalML(userText, existingLocation);
}

module.exports = {
  parseGrievanceText,
  VALID_CATEGORIES,
  CATEGORY_TO_DEPARTMENT,
  VALID_PRIORITIES,
};
