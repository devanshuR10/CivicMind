const express = require("express");
const { processUserMessage } = require("../services/localAIService");
const { authenticateToken, requireRole } = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

/**
 * POST /api/ai/parse-complaint
 * Two-Stage Conversational Grievance Parser Endpoint (100% Local Offline AI Pipeline)
 */
router.post("/parse-complaint", authenticateToken, async (req, res) => {
  try {
    const { text, location_text, conversation_state } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text description is required." });
    }

    const state = conversation_state || {};
    if (location_text && !state.pendingGrievance?.location_text) {
      state.pendingGrievance = { ...state.pendingGrievance, location_text };
    }

    const pipelineResult = await processUserMessage(text, state);

    return res.json({
      success: true,
      is_grievance: pipelineResult.is_grievance,
      intent: pipelineResult.intent,
      ai_message: pipelineResult.ai_message,
      extracted_data: pipelineResult.extracted_data,
      conversation_state: pipelineResult.conversation_state,
    });
  } catch (err) {
    console.error("Local AI Parse error:", err);
    return res.status(500).json({ error: "Failed to process message with local AI pipeline.", details: err.message });
  }
});

/**
 * POST /api/ai/admin-assistant
 * Database-Grounded Local Analytics Assistant
 */
router.post("/admin-assistant", authenticateToken, requireRole("DEPARTMENT_ADMIN", "SUPER_ADMIN", "OFFICER"), async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "Question is required." });
    }

    const totalCount = (await db.prepare("SELECT COUNT(*) as cnt FROM grievances").get()).cnt;
    const pendingCount = (await db.prepare("SELECT COUNT(*) as cnt FROM grievances WHERE status IN ('SUBMITTED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED')").get()).cnt;
    const resolvedCount = (await db.prepare("SELECT COUNT(*) as cnt FROM grievances WHERE status IN ('RESOLVED', 'CITIZEN_VERIFIED', 'CLOSED')").get()).cnt;
    const escalatedCount = (await db.prepare("SELECT COUNT(*) as cnt FROM grievances WHERE is_escalated = 1 OR status = 'ESCALATED'").get()).cnt;

    const categoryBreakdown = await db.prepare("SELECT category, COUNT(*) as count FROM grievances GROUP BY category ORDER BY count DESC").all();
    const departmentBreakdown = await db.prepare("SELECT department, COUNT(*) as count FROM grievances GROUP BY department ORDER BY count DESC").all();

    const dbContext = {
      total_grievances: totalCount,
      pending_grievances: pendingCount,
      resolved_grievances: resolvedCount,
      escalated_grievances: escalatedCount,
      category_breakdown: categoryBreakdown,
      department_breakdown: departmentBreakdown,
    };

    const qLower = question.toLowerCase();
    let answer = "";

    if (qLower.includes("biggest") || qLower.includes("top") || qLower.includes("category")) {
      const topCat = categoryBreakdown[0] ? `${categoryBreakdown[0].category} (${categoryBreakdown[0].count} complaints)` : "None";
      const catList = categoryBreakdown.map((c) => `- ${c.category}: ${c.count}`).join("\n");
      answer = `Based on live database records, the largest grievance category is ${topCat}.\n\nCategory Distribution:\n${catList}`;
    } else if (qLower.includes("unresolved") || qLower.includes("pending")) {
      answer = `There are currently ${pendingCount} unresolved grievances pending officer action across departments out of ${totalCount} total registered complaints.`;
    } else if (qLower.includes("breach") || qLower.includes("escalat")) {
      answer = `There are currently ${escalatedCount} grievances that have breached SLA timelines and been automatically escalated to senior department officers.`;
    } else if (qLower.includes("department")) {
      const deptList = departmentBreakdown.map((d) => `- ${d.department}: ${d.count} complaints`).join("\n");
      answer = `Departmental Breakdown:\n${deptList}`;
    } else {
      answer = `Executive Summary (Live Database Metrics):\n- Total Grievances: ${totalCount}\n- Pending Resolution: ${pendingCount}\n- Resolved & Verified: ${resolvedCount}\n- Escalated / SLA Breached: ${escalatedCount}`;
    }

    return res.json({ answer, metrics: dbContext });
  } catch (err) {
    console.error("Admin Assistant Error:", err);
    return res.status(500).json({ error: "Failed to generate admin assistant response." });
  }
});

/**
 * POST /api/ai/semantic-search
 */
router.post("/semantic-search", authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required." });

    const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    const allGrievances = await db.prepare("SELECT * FROM grievances").all();

    const matches = allGrievances
      .map((g) => {
        const text = `${g.description || ""} ${g.category} ${g.department} ${g.location_text || ""}`.toLowerCase();
        const score = keywords.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
        return { ...g, score };
      })
      .filter((g) => g.score > 0)
      .sort((a, b) => b.score - a.score);

    return res.json({ query, results: matches.slice(0, 15) });
  } catch (err) {
    console.error("Semantic search error:", err);
    return res.status(500).json({ error: "Failed to execute semantic search." });
  }
});

module.exports = router;
