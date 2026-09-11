const db = require("../db");

const DEFAULT_SLA_HOURS = {
  CRITICAL: 6,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
};

/**
 * Calculates and sets SLA deadline timestamp for a grievance
 */
async function setSLAForGrievance(grievanceId, priority = "MEDIUM") {
  const hours = DEFAULT_SLA_HOURS[priority] || 48;
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  await db.prepare(`
    UPDATE grievances SET sla_deadline = ? WHERE id = ?
  `).run(deadline, grievanceId);

  return deadline;
}

/**
 * Background SLA Monitoring & Auto-Escalation Worker
 */
async function processSLAEscalations() {
  const now = new Date().toISOString();

  // Find un-closed, un-resolved grievances where SLA deadline has passed
  const breached = await db
    .prepare(`
      SELECT g.*, u.name as officer_name, u.department_id
      FROM grievances g
      LEFT JOIN users u ON g.assigned_officer_id = u.id
      WHERE g.sla_deadline IS NOT NULL
        AND g.sla_deadline < ?
        AND g.status NOT IN ('RESOLVED', 'CITIZEN_VERIFIED', 'CLOSED', 'REJECTED')
        AND g.is_escalated = 0
    `)
    .all(now);

  for (const g of breached) {
    const nextLevel = (g.escalation_level || 0) + 1;

    // Find senior officer / dept head for escalation
    const deptHead = await db
      .prepare(`
        SELECT id, name FROM users
        WHERE role IN ('DEPARTMENT_ADMIN', 'SUPER_ADMIN')
        ORDER BY id ASC LIMIT 1
      `)
      .get();

    const escOfficerId = deptHead ? deptHead.id : null;

    await db.prepare(`
      UPDATE grievances
      SET is_escalated = 1, escalation_level = ?, status = 'ESCALATED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextLevel, g.id);

    // Record in escalations table
    await db.prepare(`
      INSERT INTO escalations (grievance_id, escalated_from_officer_id, escalated_to_officer_id, reason, level, status)
      VALUES (?, ?, ?, 'SLA Breach: Officer failed to resolve within allocated timeframe', ?, 'ESCALATED')
    `).run(g.id, g.assigned_officer_id || null, escOfficerId, nextLevel);

    // Record status history
    await db.prepare(`
      INSERT INTO grievance_status_history (grievance_id, previous_status, new_status, notes)
      VALUES (?, ?, 'ESCALATED', ?)
    `).run(g.id, g.status, `AUTOMATIC SLA BREACH ESCALATION (Level ${nextLevel})`);

    console.log(`AUTOMATIC SLA ESCALATION: Grievance ${g.tracking_number} escalated to Level ${nextLevel}`);
  }

  return breached.length;
}

module.exports = {
  DEFAULT_SLA_HOURS,
  setSLAForGrievance,
  processSLAEscalations,
};
