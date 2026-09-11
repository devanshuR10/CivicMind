const { spawn } = require("child_process");
const path = require("path");
const db = require("../db");

/**
 * Runs duplicate detection over existing grievances in database
 */
async function findDuplicatesForGrievance(targetGrievance) {
  // Fetch existing candidate grievances in same/all categories
  const candidates = await db
    .prepare(`
      SELECT id, tracking_number, category, subcategory, description, location_text, latitude, longitude, created_at
      FROM grievances
      WHERE id != ? AND status NOT IN ('CLOSED', 'REJECTED')
      ORDER BY created_at DESC
      LIMIT 100
    `)
    .all(targetGrievance.id || 0);

  if (candidates.length === 0) {
    return [];
  }

  return new Promise((resolve) => {
    const pyScript = path.join(__dirname, "../ml/duplicate_detector.py");
    const pyProcess = spawn("python", [pyScript]);

    let stdoutData = "";
    let stderrData = "";

    pyProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pyProcess.on("close", (code) => {
      if (code === 0 && stdoutData) {
        try {
          const parsed = JSON.parse(stdoutData);
          if (parsed.success) {
            return resolve(parsed.duplicates);
          }
        } catch (e) {
          console.error("Failed to parse Python duplicate output:", e);
        }
      }

      // JS Fallback Duplicate Detection if Python fails
      const fallbackResults = jsFallbackDuplicates(targetGrievance, candidates);
      resolve(fallbackResults);
    });

    // Write input JSON to stdin
    pyProcess.stdin.write(JSON.stringify({ target: targetGrievance, candidates }));
    pyProcess.stdin.end();
  });
}

async function jsFallbackDuplicates(target, candidates) {
  const results = [];
  const targetWords = new Set((target.description || "").toLowerCase().split(/\s+/));

  for (const c of candidates) {
    const cWords = new Set((c.description || "").toLowerCase().split(/\s+/));
    const common = [...targetWords].filter((w) => cWords.has(w) && w.length > 3);
    const score = common.length / Math.max(targetWords.size, cWords.size);

    if (score >= 0.25 || (c.category === target.category && common.length >= 2)) {
      results.append?.({
        duplicate_grievance_id: c.id,
        tracking_number: c.tracking_number,
        category: c.category,
        location_text: c.location_text,
        description: c.description,
        confidence: Math.min(0.95, score + 0.5),
        recommendation: "POSSIBLE DUPLICATE",
      });
      results.push({
        duplicate_grievance_id: c.id,
        tracking_number: c.tracking_number,
        category: c.category,
        location_text: c.location_text,
        description: c.description,
        confidence: Math.min(0.95, score + 0.5),
        recommendation: "POSSIBLE DUPLICATE",
      });
    }
  }
  return results;
}

module.exports = {
  findDuplicatesForGrievance,
};
