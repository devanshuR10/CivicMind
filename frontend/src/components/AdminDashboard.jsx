import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import AIAdminAssistant from "./AIAdminAssistant";
import GISMap from "./GISMap";
import { LayoutDashboard, Users, AlertTriangle, CheckCircle2, Layers, Sparkles, RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const gRes = await fetch("/api/grievances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const iRes = await fetch("/api/incidents", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (gRes.ok) {
        const gData = await gRes.json();
        setGrievances(gData.grievances);
      }

      if (iRes.ok) {
        const iData = await iRes.json();
        setIncidents(iData.incidents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClusterDuplicates = async () => {
    setClustering(true);
    try {
      const res = await fetch("/api/incidents/cluster-duplicates", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClustering(false);
    }
  };

  const total = grievances.length;
  const pending = grievances.filter((g) => ["SUBMITTED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "REOPENED"].includes(g.status)).length;
  const resolved = grievances.filter((g) => ["RESOLVED", "CITIZEN_VERIFIED", "CLOSED"].includes(g.status)).length;
  const escalated = grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LayoutDashboard style={{ color: "#3b82f6" }} /> Executive Administration Dashboard
          </h2>
          <p style={{ color: "#94a3b8" }}>
            Multi-department civic oversight, SLA monitoring, spatial GIS maps, and AI analytics
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleClusterDuplicates} disabled={clustering}>
          <Layers size={18} /> {clustering ? "Scanning Duplicates..." : "Run FAISS Duplicate Clustering"}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <span className="preview-label">TOTAL GRIEVANCES</span>
          <div style={{ fontSize: "2rem", fontWeight: "700" }}>{total}</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <span className="preview-label">PENDING RESOLUTION</span>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#fbbf24" }}>{pending}</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
          <span className="preview-label">RESOLVED & VERIFIED</span>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#34d399" }}>{resolved}</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
          <span className="preview-label">SLA BREACHED / ESCALATED</span>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#f87171" }}>{escalated}</div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
        <button
          className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
          style={{ paddingBottom: "0.75rem", borderBottom: activeTab === "overview" ? "2px solid #3b82f6" : "none" }}
          onClick={() => setActiveTab("overview")}
        >
          Overview & Incidents
        </button>
        <button
          className={`nav-item ${activeTab === "gis" ? "active" : ""}`}
          style={{ paddingBottom: "0.75rem", borderBottom: activeTab === "gis" ? "2px solid #3b82f6" : "none" }}
          onClick={() => setActiveTab("gis")}
        >
          GIS Spatial Map
        </button>
        <button
          className={`nav-item ${activeTab === "ai" ? "active" : ""}`}
          style={{ paddingBottom: "0.75rem", borderBottom: activeTab === "ai" ? "2px solid #3b82f6" : "none" }}
          onClick={() => setActiveTab("ai")}
        >
          AI Admin Analyst
        </button>
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Incident Master Clusters */}
          <div className="card">
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers style={{ color: "#3b82f6" }} /> Clustered Master Incidents ({incidents.length})
            </h3>
            {incidents.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                No duplicate incident clusters formed yet. Click "Run FAISS Duplicate Clustering" above to automatically scan complaints.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {incidents.map((inc) => (
                  <div key={inc.id} style={{ background: "#0f172a", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span className="tracking-id">{inc.incident_number}</span>
                      <span className="badge badge-high">{inc.affected_citizens_count} Citizens Affected</span>
                    </div>
                    <h4 style={{ fontSize: "1rem" }}>{inc.title}</h4>
                    <div style={{ fontSize: "0.8rem", color: "#60a5fa" }}>{inc.department} • {inc.primary_location}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SLA Alerts Stream */}
          <div className="card">
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertTriangle style={{ color: "#ef4444" }} /> Active SLA Breach Alerts
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED").length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No active SLA breaches currently recorded.</p>
              ) : (
                grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED").map((g) => (
                  <div key={g.id} style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", padding: "0.75rem", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: "700", color: "#f87171" }}>{g.tracking_number}</span>
                      <span className="badge badge-critical">LEVEL {g.escalation_level} ESCALATION</span>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#f8fafc", marginTop: "0.2rem" }}>{g.category} - {g.department}</div>
                    <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>{g.location_text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "gis" && <GISMap />}

      {activeTab === "ai" && <AIAdminAssistant />}
    </div>
  );
}
