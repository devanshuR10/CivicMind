const express = require("express");
const db = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { generateGrievanceId } = require("../services/idGenerator");
const { VALID_CATEGORIES, VALID_PRIORITIES, CATEGORY_TO_DEPARTMENT } = require("../services/aiService");
const { routeAndAssignGrievance } = require("../services/routingService");
const { setSLAForGrievance } = require("../services/slaService");
const { findDuplicatesForGrievance } = require("../services/duplicateService");

const router = express.Router();

/**
 * POST /api/grievances
 * Create a new grievance after citizen confirmation
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const citizen_id = req.user.id;
    const {
      category,
      subcategory,
      department,
      priority,
      description,
      location_text,
      latitude,
      longitude,
      language = "en",
      ai_confidence = 0.9,
    } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: "Grievance description is required." });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
    }

    const validatedPriority = VALID_PRIORITIES.includes(priority) ? priority : "MEDIUM";
    const validatedDepartment = CATEGORY_TO_DEPARTMENT[category] || "Municipal Administration";
    const tracking_number = generateGrievanceId();

    const insertStmt = db.prepare(`
      INSERT INTO grievances (
        tracking_number, citizen_id, category, subcategory, department,
        priority, description, location_text, latitude, longitude, language,
        status, ai_confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)
    `);

    const result = await insertStmt.run(
      tracking_number,
      citizen_id,
      category,
      subcategory || "General Complaint",
      validatedDepartment,
      validatedPriority,
      description.trim(),
      location_text ? location_text.trim() : null,
      latitude || null,
      longitude || null,
      language,
      ai_confidence
    );

    const grievanceId = result.lastInsertRowid;

    if (location_text) {
      await db.prepare(`
        INSERT INTO locations (grievance_id, location_text, latitude, longitude)
        VALUES (?, ?, ?, ?)
      `).run(grievanceId, location_text.trim(), latitude || null, longitude || null);
    }

    await db.prepare(`
      INSERT INTO ai_analysis (grievance_id, extracted_json, confidence)
      VALUES (?, ?, ?)
    `).run(
      grievanceId,
      JSON.stringify({ category, subcategory, department: validatedDepartment, priority: validatedPriority, description, location_text }),
      ai_confidence
    );

    await db.prepare(`
      INSERT INTO grievance_status_history (grievance_id, previous_status, new_status, changed_by_user_id, notes)
      VALUES (?, NULL, 'SUBMITTED', ?, 'Grievance submitted by citizen via AI Assistant')
    `).run(grievanceId, citizen_id);

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_name, entity_id, details)
      VALUES (?, 'GRIEVANCE_CREATED', 'grievances', ?, ?)
    `).run(citizen_id, tracking_number, `Created grievance ${tracking_number}`);

    // Set SLA Countdown Timer
    setSLAForGrievance(grievanceId, validatedPriority);

    // Automatic Department Routing & Officer Assignment
    routeAndAssignGrievance(grievanceId);

    // Run FAISS Vector Duplicate Check asynchronously
    const targetGrv = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(grievanceId);
    const duplicates = await findDuplicatesForGrievance(targetGrv);

    if (duplicates && duplicates.length > 0) {
      const topDup = duplicates[0];
      await db.prepare(`
        UPDATE grievances
        SET is_duplicate = 1, duplicate_of_id = ?, duplicate_confidence = ?
        WHERE id = ?
      `).run(topDup.duplicate_grievance_id, topDup.confidence, grievanceId);
    }

    const createdGrievance = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(grievanceId);

    return res.status(201).json({
      message: "Grievance registered successfully.",
      tracking_number,
      grievance: createdGrievance,
      duplicates_detected: duplicates || [],
    });
  } catch (err) {
    console.error("Error creating grievance:", err);
    return res.status(500).json({ error: "Internal server error creating grievance." });
  }
});

/**
 * GET /api/grievances
 * Retrieve grievance list based on active user role
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    let grievances = [];

    if (req.user.role === "CITIZEN") {
      grievances = await db
        .prepare(`
        SELECT g.*, u.name as citizen_name
        FROM grievances g
        JOIN users u ON g.citizen_id = u.id
        WHERE g.citizen_id = ?
        ORDER BY g.created_at DESC
      `)
        .all(req.user.id);
    } else if (req.user.role === "OFFICER") {
      grievances = await db
        .prepare(`
        SELECT g.*, u.name as citizen_name
        FROM grievances g
        JOIN users u ON g.citizen_id = u.id
        WHERE g.assigned_officer_id = ? OR g.department = (SELECT name FROM departments WHERE id = ?)
        ORDER BY g.created_at DESC
      `)
        .all(req.user.id, req.user.department_id);
    } else {
      grievances = await db
        .prepare(`
        SELECT g.*, u.name as citizen_name, off.name as officer_name
        FROM grievances g
        JOIN users u ON g.citizen_id = u.id
        LEFT JOIN users off ON g.assigned_officer_id = off.id
        ORDER BY g.created_at DESC
      `)
        .all();
    }

    return res.json({ grievances });
  } catch (err) {
    console.error("Error fetching grievances:", err);
    return res.status(500).json({ error: "Failed to fetch grievances." });
  }
});

/**
 * GET /api/grievances/:id
 * Retrieve single grievance with timeline history
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const idOrTracking = req.params.id;

    let grievance = isNaN(idOrTracking)
      ? await db.prepare("SELECT * FROM grievances WHERE tracking_number = ?").get(idOrTracking)
      : await db.prepare("SELECT * FROM grievances WHERE id = ?").get(idOrTracking);

    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found." });
    }

    if (req.user.role === "CITIZEN" && grievance.citizen_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden. Access restricted to complaint owner." });
    }

    const history = await db
      .prepare(`
      SELECT h.*, u.name as changed_by_name
      FROM grievance_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.grievance_id = ?
      ORDER BY h.created_at ASC
    `)
      .all(grievance.id);

    return res.json({ grievance, history });
  } catch (err) {
    console.error("Error fetching detail:", err);
    return res.status(500).json({ error: "Failed to fetch detail." });
  }
});

/**
 * PATCH /api/grievances/:id/status
 * Update grievance status lifecycle (Officer / Admin workflow)
 */
router.patch("/:id/status", authenticateToken, requireRole("OFFICER", "DEPARTMENT_ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const grievanceId = req.params.id;
    const { status, notes } = req.body;

    const grievance = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(grievanceId);
    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found." });
    }

    const prevStatus = grievance.status;
    let resolvedAt = grievance.resolved_at;
    if (status === "RESOLVED") {
      resolvedAt = new Date().toISOString();
    }

    await db.prepare(`
      UPDATE grievances
      SET status = ?, resolution_notes = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, notes || null, resolvedAt, grievanceId);

    await db.prepare(`
      INSERT INTO grievance_status_history (grievance_id, previous_status, new_status, changed_by_user_id, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(grievanceId, prevStatus, status, req.user.id, notes || `Status changed from ${prevStatus} to ${status}`);

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_name, entity_id, details)
      VALUES (?, 'STATUS_UPDATE', 'grievances', ?, ?)
    `).run(req.user.id, grievance.tracking_number, `Status updated to ${status}`);

    const updated = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(grievanceId);
    return res.json({ message: "Status updated successfully.", grievance: updated });
  } catch (err) {
    console.error("Error updating status:", err);
    return res.status(500).json({ error: "Failed to update grievance status." });
  }
});

/**
 * POST /api/grievances/:id/verify
 * Citizen Resolution Verification Feedback Loop (Prevents false resolution)
 */
router.post("/:id/verify", authenticateToken, async (req, res) => {
  try {
    const grievanceId = req.params.id;
    const { verified, reason } = req.body;

    const grievance = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(grievanceId);
    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found." });
    }

    if (grievance.citizen_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden. Only the complaint author can verify resolution." });
    }

    if (verified) {
      await db.prepare(`
        UPDATE grievances
        SET status = 'CITIZEN_VERIFIED', verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(grievanceId);

      await db.prepare(`
        INSERT INTO grievance_status_history (grievance_id, previous_status, new_status, changed_by_user_id, notes)
        VALUES (?, 'RESOLVED', 'CITIZEN_VERIFIED', ?, 'Citizen confirmed resolution: YES, RESOLVED')
      `).run(grievanceId, req.user.id);

      return res.json({ message: "Grievance marked as Citizen Verified & Closed.", status: "CITIZEN_VERIFIED" });
    } else {
      // Citizen indicates issue persists → REOPEN & ESCALATE
      const newReopenCount = (grievance.reopen_count || 0) + 1;

      await db.prepare(`
        UPDATE grievances
        SET status = 'REOPENED', is_escalated = 1, escalation_level = 2, reopen_count = ?, reopen_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newReopenCount, reason || "Citizen stated issue persists after resolution attempt", grievanceId);

      await db.prepare(`
        INSERT INTO grievance_status_history (grievance_id, previous_status, new_status, changed_by_user_id, notes)
        VALUES (?, 'RESOLVED', 'REOPENED', ?, ?)
      `).run(grievanceId, req.user.id, `CITIZEN REOPENED: ${reason || "Issue persists"}`);

      await db.prepare(`
        INSERT INTO escalations (grievance_id, escalated_from_officer_id, reason, level, status)
        VALUES (?, ?, 'Reopened by citizen after false resolution marking', 2, 'REOPENED')
      `).run(grievanceId, grievance.assigned_officer_id || null);

      return res.json({ message: "Grievance reopened and escalated to department senior officer.", status: "REOPENED" });
    }
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ error: "Failed to verify resolution." });
  }
});

module.exports = router;
