import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import GrievanceTimeline from "./GrievanceTimeline";
import { CheckCircle2, Clock, AlertTriangle, Shield, MapPin, FileText, Send, User } from "lucide-react";

export default function OfficerDashboard() {
  const { token, user } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [history, setHistory] = useState([]);
  const [notesText, setNotesText] = useState("");
  const [newStatus, setNewStatus] = useState("IN_PROGRESS");

  useEffect(() => {
    fetchOfficerGrievances();
  }, [token]);

  const fetchOfficerGrievances = async () => {
    try {
      const res = await fetch("/api/grievances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data.grievances);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (g) => {
    setSelectedGrievance(g);
    try {
      const res = await fetch(`/api/grievances/${g.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notesText || `Officer updated status to ${newStatus}`,
        }),
      });

      if (res.ok) {
        setNotesText("");
        fetchOfficerGrievances();
        handleOpenDetail(selectedGrievance);
        alert(`Status updated to ${newStatus}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const assignedCount = grievances.filter((g) => g.status === "ASSIGNED").length;
  const inProgressCount = grievances.filter((g) => g.status === "IN_PROGRESS" || g.status === "ACKNOWLEDGED").length;
  const escalatedCount = grievances.filter((g) => g.is_escalated === 1 || g.status === "ESCALATED").length;
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED" || g.status === "CITIZEN_VERIFIED").length;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Shield style={{ color: "#3b82f6" }} /> Department Officer Portal
        </h2>
        <p style={{ color: "#94a3b8" }}>
          Manage assigned complaints, record work progress, and resolve civic grievances
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <span className="preview-label">NEWLY ASSIGNED</span>
          <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "#60a5fa" }}>{assignedCount}</div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <span className="preview-label">IN PROGRESS</span>
          <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "#fbbf24" }}>{inProgressCount}</div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
          <span className="preview-label">ESCALATED / BREACHED</span>
          <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "#f87171" }}>{escalatedCount}</div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
          <span className="preview-label">RESOLVED</span>
          <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "#34d399" }}>{resolvedCount}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: selectedGrievance ? "1fr 420px" : "1fr", gap: "1.5rem" }}>
        <div>
          <h3 style={{ marginBottom: "1rem" }}>Assigned Department Grievances</h3>
          {loading ? (
            <div>Loading assigned grievances...</div>
          ) : (
            <div className="grievance-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {grievances.map((g) => (
                <div
                  key={g.id}
                  className="grievance-card"
                  style={{
                    cursor: "pointer",
                    borderColor: selectedGrievance?.id === g.id ? "#3b82f6" : "var(--border-color)",
                  }}
                  onClick={() => handleOpenDetail(g)}
                >
                  <div className="tracking-header">
                    <span className="tracking-id">{g.tracking_number}</span>
                    <span className={`badge badge-${g.priority.toLowerCase()}`}>{g.priority}</span>
                  </div>

                  <h4 style={{ fontSize: "1rem" }}>{g.category}</h4>
                  <p style={{ fontSize: "0.85rem", color: "#cbd5e1", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {g.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid var(--border-color)" }}>
                    <span style={{ color: "#94a3b8" }}>{g.location_text || "No Location"}</span>
                    <span className="badge badge-submitted">{g.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Grievance Detail & Action Panel */}
        {selectedGrievance && (
          <div className="card" style={{ height: "fit-content", position: "sticky", top: "80px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="tracking-id">{selectedGrievance.tracking_number}</span>
              <button className="btn btn-outline" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }} onClick={() => setSelectedGrievance(null)}>
                Close
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "1.1rem" }}>{selectedGrievance.category}</h4>
              <div style={{ fontSize: "0.8rem", color: "#60a5fa", marginBottom: "0.5rem" }}>{selectedGrievance.department}</div>
              <p style={{ fontSize: "0.9rem", color: "#e2e8f0", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "6px" }}>
                {selectedGrievance.description}
              </p>
            </div>

            {/* Update Status Form */}
            <form onSubmit={handleUpdateStatus} style={{ background: "#0f172a", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#60a5fa", marginBottom: "0.5rem" }}>
                Update Grievance Status
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label className="preview-label">Next Status</label>
                <select
                  className="chat-input"
                  style={{ width: "100%", marginTop: "0.25rem" }}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label className="preview-label">Progress / Resolution Notes</label>
                <textarea
                  className="chat-input"
                  style={{ width: "100%", height: "60px", marginTop: "0.25rem", fontFamily: "inherit" }}
                  placeholder="Enter officer notes..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                <Send size={14} /> Update Status
              </button>
            </form>

            {/* Audit History Timeline */}
            <div>
              <h5 style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "0.75rem" }}>Audit Status Timeline</h5>
              <GrievanceTimeline history={history} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
