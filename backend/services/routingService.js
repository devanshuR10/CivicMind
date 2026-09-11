const db = require("../db");

/**
 * Configurable multi-department routing layer
 * Automatically routes grievance to active officer in target department based on workload.
 */
async function routeAndAssignGrievance(grievanceId) {
  const grievance = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(grievanceId);
  if (!grievance) return null;

  // Find department ID for grievance category
  const dept = await db.prepare("SELECT id FROM departments WHERE name = ?").get(grievance.department);
  let deptId = dept ? dept.id : null;

  // Find active officer in department with lowest active workload
  let assignedOfficer = null;
  if (deptId) {
    assignedOfficer = await db
      .prepare(`
        SELECT u.id, u.name, u.email, COUNT(g.id) as active_workload
        FROM users u
        LEFT JOIN grievances g ON u.id = g.assigned_officer_id AND g.status IN ('ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS')
        WHERE u.role = 'OFFICER' AND u.department_id = ?
        GROUP BY u.id
        ORDER BY active_workload ASC
        LIMIT 1
      `)
      .get(deptId);
  }

  // Fallback to any active officer if department officer not assigned
  if (!assignedOfficer) {
    assignedOfficer = await db
      .prepare(`
        SELECT id, name, email FROM users WHERE role = 'OFFICER' LIMIT 1
      `)
      .get();
  }

  if (assignedOfficer) {
    await db.prepare(`
      UPDATE grievances
      SET assigned_officer_id = ?, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(assignedOfficer.id, grievanceId);

    // Record status history transition
    await db.prepare(`
      INSERT INTO grievance_status_history (grievance_id, previous_status, new_status, notes)
      VALUES (?, 'SUBMITTED', 'ASSIGNED', ?)
    `).run(grievanceId, `Automatically routed to ${grievance.department} and assigned to Officer ${assignedOfficer.name}`);

    console.log(`Grievance ${grievance.tracking_number} routed to ${grievance.department} (Officer: ${assignedOfficer.name})`);
    return { assigned: true, officer: assignedOfficer };
  }

  return { assigned: false, reason: "No available officer in department" };
}

module.exports = {
  routeAndAssignGrievance,
};
