const bcrypt = require("bcryptjs");
const db = require("./db");
const { generateGrievanceId } = require("./services/idGenerator");

async function seedData() {
  await db.initDatabase();
  console.log("Seeding database");

  await db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM grievance_status_history;
    DELETE FROM ai_analysis;
    DELETE FROM locations;
    DELETE FROM incident_grievances;
    DELETE FROM escalations;
    DELETE FROM incidents;
    DELETE FROM grievances;
    DELETE FROM sla_rules;
    DELETE FROM grievance_categories;
    DELETE FROM users;
    DELETE FROM departments;
  `);

  // 1. Departments
  const deptStmt = db.prepare("INSERT INTO departments (name, code, description) VALUES (?, ?, ?)");
  const depts = [
    { name: "Water Department", code: "WATER", description: "Potable water supply, pipe leaks, pipeline maintenance" },
    { name: "Public Works Department", code: "PWD", description: "Road construction, potholes, bridge repairs, footpaths" },
    { name: "Electricity Department", code: "ELEC", description: "Power supply outages, electrical wiring hazards, transformers" },
    { name: "Sanitation Department", code: "SAN", description: "Public toilets, sanitation, sewage cleanup" },
    { name: "Municipal Drainage Department", code: "DRAIN", description: "Stormwater drains, waterlogging, gutter overflow" },
    { name: "Electrical & Lighting Department", code: "LIGHT", description: "Streetlights, public lighting poles" },
    { name: "Sanitation & Waste Department", code: "WASTE", description: "Solid waste management, garbage collection, dumping" },
    { name: "Public Health Department", code: "HEALTH", description: "Vector control, public health hazards, pest control" },
    { name: "Municipal Transport Department", code: "TRANS", description: "Public bus stops, traffic signals, transport facilities" },
  ];

  const deptIds = {};
  for (const d of depts) {
    const res = await deptStmt.run(d.name, d.code, d.description);
    deptIds[d.name] = res.lastInsertRowid;
  }

  // 2. Categories & SLA rules
  const catStmt = db.prepare(`
    INSERT INTO grievance_categories (department_id, name, description, default_priority, sla_hours)
    VALUES (?, ?, ?, ?, ?)
  `);
  const slaStmt = db.prepare(`
    INSERT INTO sla_rules (category, priority, sla_hours, escalation_threshold_hours)
    VALUES (?, ?, ?, 4)
  `);

  const categories = [
    { name: "Water Supply", dept: "Water Department", priority: "HIGH", sla: 24 },
    { name: "Roads / PWD", dept: "Public Works Department", priority: "MEDIUM", sla: 48 },
    { name: "Electricity", dept: "Electricity Department", priority: "HIGH", sla: 12 },
    { name: "Sanitation", dept: "Sanitation Department", priority: "MEDIUM", sla: 48 },
    { name: "Drainage", dept: "Municipal Drainage Department", priority: "HIGH", sla: 24 },
    { name: "Street Lighting", dept: "Electrical & Lighting Department", priority: "MEDIUM", sla: 48 },
    { name: "Waste Management", dept: "Sanitation & Waste Department", priority: "MEDIUM", sla: 48 },
    { name: "Public Health", dept: "Public Health Department", priority: "HIGH", sla: 24 },
    { name: "Transport", dept: "Municipal Transport Department", priority: "LOW", sla: 72 },
  ];

  for (const c of categories) {
    await catStmt.run(deptIds[c.dept], c.name, `${c.name} civic issue`, c.priority, c.sla);
    for (const p of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]) {
      const hours = p === "CRITICAL" ? 6 : p === "HIGH" ? 24 : p === "MEDIUM" ? 48 : 72;
      await slaStmt.run(c.name, p, hours);
    }
  }

  // 3. Users
  const passwordHash = bcrypt.hashSync("password123", 10);
  const userStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department_id, phone, zone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const c1 = (await userStmt.run("Rahul Sharma", "citizen@sih.gov.in", passwordHash, "CITIZEN", null, "9876543210", "Zone 4")).lastInsertRowid;
  const c2 = (await userStmt.run("Priya Verma", "priya@sih.gov.in", passwordHash, "CITIZEN", null, "9876543211", "Zone 2")).lastInsertRowid;
  const c3 = (await userStmt.run("Amit Patel", "amit@sih.gov.in", passwordHash, "CITIZEN", null, "9876543214", "Zone 4")).lastInsertRowid;

  const oWater = (await userStmt.run("Officer Vikram (Water)", "officer@sih.gov.in", passwordHash, "OFFICER", deptIds["Water Department"], "9876543212", "Zone 4")).lastInsertRowid;
  const oPWD = (await userStmt.run("Officer Rajesh (PWD)", "pwd_officer@sih.gov.in", passwordHash, "OFFICER", deptIds["Public Works Department"], "9876543215", "Zone 2")).lastInsertRowid;
  const oElec = (await userStmt.run("Officer Sunita (Electricity)", "elec_officer@sih.gov.in", passwordHash, "OFFICER", deptIds["Electricity Department"], "9876543216", "Zone 1")).lastInsertRowid;

  await userStmt.run("Super Admin Executive", "admin@sih.gov.in", passwordHash, "SUPER_ADMIN", null, "9876543213", "All Zones");

  // 4. Grievances
  const grievanceStmt = db.prepare(`
    INSERT INTO grievances (
      tracking_number, citizen_id, category, subcategory, department,
      priority, description, location_text, latitude, longitude, language,
      status, ai_confidence, assigned_officer_id, sla_deadline, is_escalated, escalation_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en', ?, ?, ?, ?, ?, ?)
  `);

  const locationStmt = db.prepare(`
    INSERT INTO locations (grievance_id, location_text, latitude, longitude, city, state)
    VALUES (?, ?, ?, ?, 'New Delhi', 'Delhi')
  `);

  const historyStmt = db.prepare(`
    INSERT INTO grievance_status_history (grievance_id, previous_status, new_status, changed_by_user_id, notes)
    VALUES (?, NULL, ?, ?, ?)
  `);

  const now = Date.now();
  const pastSLA = new Date(now - 3600000).toISOString(); // SLA Breached 1 hour ago
  const futureSLA = new Date(now + 86400000).toISOString(); // 24 hours remaining

  const seedGrievances = [
    {
      citizenId: c1,
      category: "Water Supply",
      subcategory: "No Water Supply",
      department: "Water Department",
      priority: "HIGH",
      description: "There has been no water supply in my locality for three days.",
      location_text: "Model Town, Sector 4",
      lat: 28.7041,
      lng: 77.1025,
      status: "ASSIGNED",
      officerId: oWater,
      sla: futureSLA,
      isEscalated: 0,
      escLevel: 0,
    },
    {
      citizenId: c3,
      category: "Water Supply",
      subcategory: "Water Pipeline Leakage",
      department: "Water Department",
      priority: "HIGH",
      description: "Major water pipeline leaking heavily beside main market road, wasting clean water.",
      location_text: "Model Town Market",
      lat: 28.7055,
      lng: 77.1038,
      status: "SUBMITTED",
      officerId: oWater,
      sla: futureSLA,
      isEscalated: 0,
      escLevel: 0,
    },
    {
      citizenId: c2,
      category: "Roads / PWD",
      subcategory: "Dangerous Pothole",
      department: "Public Works Department",
      priority: "HIGH",
      description: "Large deep pothole causing severe traffic congestion near railway station gate 2.",
      location_text: "Railway Station Road",
      lat: 28.6448,
      lng: 77.2197,
      status: "ESCALATED",
      officerId: oPWD,
      sla: pastSLA,
      isEscalated: 1,
      escLevel: 1,
    },
    {
      citizenId: c1,
      category: "Electricity",
      subcategory: "Exposed Electrical Hazard",
      department: "Electricity Department",
      priority: "CRITICAL",
      description: "Exposed live electrical wire dangling near school entrance gate.",
      location_text: "Civil Lines, Block B",
      lat: 28.6814,
      lng: 77.2228,
      status: "IN_PROGRESS",
      officerId: oElec,
      sla: futureSLA,
      isEscalated: 0,
      escLevel: 0,
    },
    {
      citizenId: c2,
      category: "Street Lighting",
      subcategory: "Streetlight Off",
      department: "Electrical & Lighting Department",
      priority: "MEDIUM",
      description: "All streetlights turned off for 4 consecutive nights creating safety concerns.",
      location_text: "Vasant Kunj, Sector B",
      lat: 28.5293,
      lng: 77.1539,
      status: "RESOLVED",
      officerId: oElec,
      sla: futureSLA,
      isEscalated: 0,
      escLevel: 0,
    },
  ];

  for (const sg of seedGrievances) {
    const trackingId = generateGrievanceId();
    const res = await grievanceStmt.run(
      trackingId,
      sg.citizenId,
      sg.category,
      sg.subcategory,
      sg.department,
      sg.priority,
      sg.description,
      sg.location_text,
      sg.lat,
      sg.lng,
      sg.status,
      0.96,
      sg.officerId,
      sg.sla,
      sg.isEscalated,
      sg.escLevel
    );
    const grvId = res.lastInsertRowid;
    await locationStmt.run(grvId, sg.location_text, sg.lat, sg.lng);
    await historyStmt.run(grvId, sg.status, sg.citizenId, `Seeded grievance ${trackingId}`);
  }

  console.log("Full database seeded successfully!");
}

seedData();
