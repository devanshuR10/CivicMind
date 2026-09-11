const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const db = require("./db");
const authRoutes = require("./routes/auth");
const aiRoutes = require("./routes/ai");
const grievanceRoutes = require("./routes/grievances");
const departmentRoutes = require("./routes/departments");
const incidentRoutes = require("./routes/incidents");
const { processSLAEscalations } = require("./services/slaService");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for React frontend
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/incidents", incidentRoutes);

// Background SLA Monitoring Cron Job (Runs every 30 seconds)
setInterval(() => {
  try {
    processSLAEscalations();
  } catch (e) {
    console.error("SLA Worker Error:", e.message);
  }
}, 30000);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    platform: "SIH AI Multi-Department Grievance Platform",
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error.",
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SIH Backend Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
