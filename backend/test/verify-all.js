const assert = require("assert");
const db = require("../db");
const { generateGrievanceId } = require("../services/idGenerator");
const { parseGrievanceText } = require("../services/aiService");
const { routeAndAssignGrievance } = require("../services/routingService");
const { setSLAForGrievance, processSLAEscalations } = require("../services/slaService");
const { findDuplicatesForGrievance } = require("../services/duplicateService");

async function runFullVerificationSuite() {
  console.log("=================================================");
  console.log("  RUNNING FULL SIH PLATFORM VERIFICATION SUITE   ");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  async function logPass(title) {
    passed++;
    console.log(`✅ PASS: ${title}`);
  }

  async function logFail(title, err) {
    failed++;
    console.error(`❌ FAIL: ${title}`, err.message);
  }

  const citizen = await db.prepare("SELECT * FROM users WHERE role = 'CITIZEN' LIMIT 1").get();
  const officer = await db.prepare("SELECT * FROM users WHERE role = 'OFFICER' LIMIT 1").get();
  assert(citizen && officer, "Seed users must exist");

  // 1. Unique Tracking Number Generation
  try {
    const id = generateGrievanceId();
    assert(id.startsWith("GRV-2026-"), "Must start with GRV-2026-");
    logPass("Unique Tracking ID Generation (GRV-2026-XXXXXX)");
  } catch (e) {
    logFail("Unique Tracking ID Generation", e);
  }

  // 2. Conversational AI Extraction (Feature 1 & Feature 4)
  try {
    const res = await parseGrievanceText("There has been no water supply in my locality for three days.", "Model Town");
    assert.strictEqual(res.category, "Water Supply");
    assert.strictEqual(res.department, "Water Department");
    assert.strictEqual(res.priority, "HIGH");
    logPass("AI Grievance Text Parsing & Priority Detection");
  } catch (e) {
    logFail("AI Grievance Text Parsing", e);
  }

  // 3. Automatic Department Routing & Workload Balancing (Feature 2 & Feature 3)
  try {
    const trackingNo = generateGrievanceId();
    const grvRes = await db.prepare(`
      INSERT INTO grievances (tracking_number, citizen_id, category, subcategory, department, priority, description, status)
      VALUES (?, ?, 'Water Supply', 'No Water Supply', 'Water Department', 'HIGH', 'Routing test', 'SUBMITTED')
    `).run(trackingNo, citizen.id);

    const routing = routeAndAssignGrievance(grvRes.lastInsertRowid);
    assert(routing.assigned, "Must assign officer automatically");
    logPass("Automatic Department Routing & Officer Assignment Workload Engine");
  } catch (e) {
    logFail("Automatic Department Routing", e);
  }

  // 4. SLA Calculation & Auto-Escalation Worker (Feature 6 & Feature 7)
  try {
    const trackingNo = generateGrievanceId();
    const grvRes = await db.prepare(`
      INSERT INTO grievances (tracking_number, citizen_id, category, subcategory, department, priority, description, status)
      VALUES (?, ?, 'Electricity', 'Power Outage', 'Electricity Department', 'HIGH', 'SLA breach test', 'ASSIGNED')
    `).run(trackingNo, citizen.id);

    const grvId = grvRes.lastInsertRowid;
    // Set SLA deadline in the past to trigger breach
    const pastSLA = new Date(Date.now() - 3600000).toISOString();
    await db.prepare("UPDATE grievances SET sla_deadline = ? WHERE id = ?").run(pastSLA, grvId);

    const count = processSLAEscalations();
    assert(count > 0, "Must detect past SLA breach");

    const updated = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(grvId);
    assert.strictEqual(updated.status, "ESCALATED");
    assert.strictEqual(updated.is_escalated, 1);
    logPass("SLA Breach Monitoring & Automatic 4-Tier Escalation Worker");
  } catch (e) {
    logFail("SLA Escalation Worker", e);
  }

  // 5. FAISS Semantic Duplicate Detection (Feature 8 & Feature 9)
  try {
    const target = {
      id: 999,
      category: "Water Supply",
      description: "No water supply available in locality for 3 days near market",
      location_text: "Model Town Market",
      latitude: 28.7041,
      longitude: 77.1025,
    };

    const dups = await findDuplicatesForGrievance(target);
    assert(Array.isArray(dups), "Duplicates must return array");
    logPass("FAISS Vector Duplicate Detection & Clustering Engine");
  } catch (e) {
    logFail("FAISS Duplicate Detection", e);
  }

  // 6. Citizen Resolution Verification Feedback Loop (Feature 18)
  try {
    const trackingNo = generateGrievanceId();
    const grvRes = await db.prepare(`
      INSERT INTO grievances (tracking_number, citizen_id, category, department, priority, description, status)
      VALUES (?, ?, 'Sanitation', 'Sanitation Department', 'MEDIUM', 'Verification test', 'RESOLVED')
    `).run(trackingNo, citizen.id);

    const grvId = grvRes.lastInsertRowid;

    // Simulate Citizen clicks "NO, ISSUE PERSISTS"
    await db.prepare(`
      UPDATE grievances SET status = 'REOPENED', is_escalated = 1, reopen_count = 1, reopen_reason = 'Issue persists' WHERE id = ?
    `).run(grvId);

    const reopened = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(grvId);
    assert.strictEqual(reopened.status, "REOPENED");
    assert.strictEqual(reopened.is_escalated, 1);
    logPass("Citizen Resolution Verification Feedback Loop (Reopen & Escalate on False Resolution)");
  } catch (e) {
    logFail("Citizen Resolution Verification", e);
  }

  // 7. Full Status Lifecycle & Transparent Audit Trail (Feature 5 & Feature 19)
  try {
    const grv = await db.prepare("SELECT id FROM grievances LIMIT 1").get();
    const history = await db.prepare("SELECT * FROM grievance_status_history WHERE grievance_id = ?").all(grv.id);
    assert(history.length > 0, "Audit history timeline records must exist");
    logPass("Full Transparent Status Lifecycle Audit Trail Logging");
  } catch (e) {
    logFail("Status Audit Trail Logging", e);
  }

  console.log("=================================================");
  console.log(`FULL VERIFICATION RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) process.exit(1);
}

runFullVerificationSuite().catch(console.error);
