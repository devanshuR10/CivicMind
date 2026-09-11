const express = require("express");
const db = require("../db");
const { VALID_CATEGORIES, CATEGORY_TO_DEPARTMENT } = require("../services/aiService");

const router = express.Router();

/**
 * GET /api/departments
 * Fetch all available departments & categories
 */
router.get("/", async (req, res) => {
  try {
    const departments = await db.prepare("SELECT * FROM departments ORDER BY name ASC").all();
    const categories = await db.prepare("SELECT * FROM grievance_categories ORDER BY name ASC").all();

    return res.json({
      departments,
      categories,
      valid_categories: VALID_CATEGORIES,
      category_to_department: CATEGORY_TO_DEPARTMENT,
    });
  } catch (err) {
    console.error("Error fetching departments:", err);
    return res.status(500).json({ error: "Failed to fetch departments." });
  }
});

module.exports = router;
