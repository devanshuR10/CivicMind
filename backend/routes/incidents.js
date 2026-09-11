const express = require("express");
const db = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { findDuplicatesForGrievance } = require("../services/duplicateService");

const router = express.Router();

/**
 * GET /api/incidents
 * List clustered master incidents
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const incidents = await db.prepare("SELECT * FROM incidents ORDER BY created_at DESC").all();
    return res.json({ incidents });
  } catch (err) {
    console.error("Error fetching incidents:", err);
    return res.status(500).json({ error: "Failed to fetch incidents." });
  }
});

/**
 * POST /api/incidents/cluster-duplicates
 * Scan and create INCIDENT-XXXX master tickets for grouped duplicate complaints
 */
router.post("/cluster-duplicates", authenticateToken, requireRole("DEPARTMENT_ADMIN", "SUPER_ADMIN", "OFFICER"), async (req, res) => {
  try {
    const unclustered = await db.prepare("SELECT * FROM grievances WHERE incident_id IS NULL ORDER BY created_at DESC").all();
    let clusterCount = 0;

    for (const g of unclustered) {
      const duplicates = await findDuplicatesForGrievance(g);

      if (duplicates && duplicates.length > 0) {
        const topDup = duplicates[0];
        const dupGrv = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(topDup.duplicate_grievance_id);

        if (dupGrv) {
          let incidentId = dupGrv.incident_id;

          // If no incident cluster exists for duplicate yet, create INCIDENT-XXXX
          if (!incidentId) {
            const incNum = `INCIDENT-${Math.floor(1000 + Math.random() * 9000)}`;
            const incRes = await db.prepare(`
              INSERT INTO incidents (incident_number, title, description, category, department, priority, primary_location, affected_citizens_count)
              VALUES (?, ?, ?, ?, ?, ?, ?, 2)
            `).run(incNum, `Master Incident: ${g.category} at ${g.location_text || 'Locality'}`, g.description, g.category, g.department, g.priority, g.location_text || null);

            incidentId = incRes.lastInsertRowid;
            clusterCount++;

            await db.prepare("UPDATE grievances SET incident_id = ? WHERE id = ?").run(incidentId, dupGrv.id);
            await db.prepare("INSERT OR IGNORE INTO incident_grievances (incident_id, grievance_id) VALUES (?, ?)").run(incidentId, dupGrv.id);
          } else {
            await db.prepare("UPDATE incidents SET affected_citizens_count = affected_citizens_count + 1 WHERE id = ?").run(incidentId);
          }

          await db.prepare("UPDATE grievances SET incident_id = ?, is_duplicate = 1, duplicate_of_id = ? WHERE id = ?").run(incidentId, dupGrv.id, g.id);
          await db.prepare("INSERT OR IGNORE INTO incident_grievances (incident_id, grievance_id) VALUES (?, ?)").run(incidentId, g.id);
        }
      }
    }

    const incidents = await db.prepare("SELECT * FROM incidents ORDER BY created_at DESC").all();
    return res.json({ message: `Clustered duplicate grievances into incidents. Created ${clusterCount} new master tickets.`, incidents });
  } catch (err) {
    console.error("Clustering error:", err);
    return res.status(500).json({ error: "Failed to cluster duplicate complaints." });
  }
});

module.exports = router;
