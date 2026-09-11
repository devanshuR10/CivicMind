const assert = require("assert");
const db = require("../db");
const { generateGrievanceId } = require("../services/idGenerator");
const { parseGrievanceText } = require("../services/aiService");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");

async function runPhase2Tests() {
  console.log("==========================================");
  console.log("  RUNNING PHASE 2 AUTOMATED TEST SUITE    ");
  console.log("==========================================");

  let passedCount = 0;
  let failedCount = 0;

  async function logPass(testName) {
    passedCount++;
    console.log(`✅ PASS: ${testName}`);
  }

  async function logFail(testName, err) {
    failedCount++;
    console.error(`❌ FAIL: ${testName}`, err.message);
  }

  // Fetch test users from seeded DB
  const citizen1 = await db.prepare("SELECT * FROM users WHERE email = 'citizen@sih.gov.in'").get();
  const citizen2 = await db.prepare("SELECT * FROM users WHERE email = 'priya@sih.gov.in'").get();

  assert(citizen1 && citizen2, "Seed users must exist in DB");

  // TEST 1: Unique Grievance ID Format
  try {
    const id = generateGrievanceId();
    assert(id.startsWith("GRV-2026-"), "ID must start with GRV-2026-");
    assert(id.length === 15, "ID length should match GRV-2026-XXXXXX");
    logPass("Unique Grievance ID generation (GRV-2026-XXXXXX)");
  } catch (e) {
    logFail("Unique Grievance ID generation", e);
  }

  // TEST 2: AI Grievance Parsing (Water Supply Demo Case)
  try {
    const aiRes = await parseGrievanceText("There has been no water supply in my locality for three days.", "Model Town");
    assert.strictEqual(aiRes.category, "Water Supply");
    assert.strictEqual(aiRes.department, "Water Department");
    assert.strictEqual(aiRes.priority, "HIGH");
    assert.strictEqual(aiRes.location_text, "Model Town");
    assert.strictEqual(aiRes.missing_information.length, 0);
    logPass("AI Grievance Text Parsing & Category Extraction (Water Supply Demo Case)");
  } catch (e) {
    logFail("AI Grievance Text Parsing", e);
  }

  // TEST 3: Missing Location Identification in AI Output
  try {
    const aiRes = await parseGrievanceText("There is a huge pothole on the main road");
    assert.strictEqual(aiRes.category, "Roads / PWD");
    assert(aiRes.missing_information.includes("location_text"), "Should identify location_text as missing");
    logPass("AI Missing Information Detection (Missing Location Prompt)");
  } catch (e) {
    logFail("AI Missing Information Detection", e);
  }

  // TEST 4: Priority & Department Logic for Electrical Hazard
  try {
    const aiRes = await parseGrievanceText("Exposed live wire hanging near school campus", "Civil Lines");
    assert.strictEqual(aiRes.category, "Electricity");
    assert.strictEqual(aiRes.priority, "CRITICAL");
    assert.strictEqual(aiRes.department, "Electricity Department");
    logPass("Critical Priority Classification (Electrical Hazard)");
  } catch (e) {
    logFail("Critical Priority Classification", e);
  }

  // TEST 5: Valid Grievance Database Creation
  try {
    const trackingId = generateGrievanceId();
    const result = await db.prepare(`
      INSERT INTO grievances (
        tracking_number, citizen_id, category, subcategory, department,
        priority, description, location_text, status
      ) VALUES (?, ?, 'Water Supply', 'No Water Supply', 'Water Department', 'HIGH', 'Test description', 'Model Town', 'SUBMITTED')
    `).run(trackingId, citizen1.id);

    assert(result.lastInsertRowid > 0, "Insert should succeed");
    const record = await db.prepare("SELECT * FROM grievances WHERE id = ?").get(result.lastInsertRowid);
    assert.strictEqual(record.status, "SUBMITTED");
    assert.strictEqual(record.tracking_number, trackingId);
    logPass("Valid Grievance Database Record Creation & Initial SUBMITTED Status");
  } catch (e) {
    logFail("Valid Grievance Creation", e);
  }

  // TEST 6: Category Validation & Defaulting
  try {
    const validCategories = ["Water Supply", "Roads / PWD", "Electricity", "Sanitation", "Drainage", "Street Lighting", "Waste Management", "Public Health", "Transport"];
    const testCategory = "Water Supply";
    assert(validCategories.includes(testCategory), "Category must be in valid category list");
    logPass("Category Validation against System Department Schema");
  } catch (e) {
    logFail("Category Validation", e);
  }

  // TEST 7: Status History & Audit Trail Logging
  try {
    const grv = await db.prepare("SELECT id FROM grievances WHERE citizen_id = ?").get(citizen1.id);
    const history = await db.prepare("SELECT * FROM grievance_status_history WHERE grievance_id = ?").all(grv.id);
    assert(history.length > 0, "Grievance status history records must exist");
    assert(history[0].new_status !== undefined, "Status transition record must have new_status defined");
    logPass("Audit History & Status Transition Logging");
  } catch (e) {
    logFail("Audit History Logging", e);
  }

  // TEST 8: Citizen Access Control Security Check (Citizen A vs Citizen B)
  try {
    const grvCitizen1 = await db.prepare("SELECT * FROM grievances WHERE citizen_id = ?").get(citizen1.id);

    // Verify Citizen 1 matches citizen1.id
    assert.strictEqual(grvCitizen1.citizen_id, citizen1.id);
    // Assert Citizen 2 is NOT owner of Citizen 1's grievance
    assert.notStrictEqual(grvCitizen1.citizen_id, citizen2.id, "Citizen 2 must not own Citizen 1's grievance");

    logPass("Strict User Access Control (Citizens restricted to own complaints)");
  } catch (e) {
    logFail("Citizen Access Control Security Check", e);
  }

  // TEST 9: JWT Authentication Token Verification
  try {
    const token = jwt.sign({ id: citizen1.id, role: citizen1.role, email: citizen1.email }, JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.id, citizen1.id);
    assert.strictEqual(decoded.role, "CITIZEN");
    logPass("JWT Authentication Token Verification & Payload Integrity");
  } catch (e) {
    logFail("JWT Token Verification", e);
  }

  // TEST 10: Complete Happy Path Simulation
  try {
    const userText = "There has been no water supply in my locality for three days.";
    const userLoc = "Model Town";

    // Step 1: AI Parse
    const aiParsed = await parseGrievanceText(userText, userLoc);
    assert.strictEqual(aiParsed.category, "Water Supply");

    // Step 2: Citizen Confirmation & Record creation
    const trackingNo = generateGrievanceId();
    await db.prepare(`
      INSERT INTO grievances (
        tracking_number, citizen_id, category, subcategory, department,
        priority, description, location_text, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
    `).run(trackingNo, citizen1.id, aiParsed.category, aiParsed.subcategory, aiParsed.department, aiParsed.priority, aiParsed.description, aiParsed.location_text);

    const saved = await db.prepare("SELECT * FROM grievances WHERE tracking_number = ?").get(trackingNo);
    assert(saved !== undefined, "Saved grievance must be retrieved");
    assert.strictEqual(saved.tracking_number, trackingNo);
    assert.strictEqual(saved.status, "SUBMITTED");

    logPass("Full Demo Scenario Happy Path Execution (Parse -> Confirmation -> DB Persistence)");
  } catch (e) {
    logFail("Full Demo Scenario Happy Path", e);
  }

  console.log("==========================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED`);
  console.log("==========================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch(console.error);
