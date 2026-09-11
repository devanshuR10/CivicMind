import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import GrievanceTimeline from "../components/GrievanceTimeline";
import { PlusCircle, MapPin, Calendar, CheckCircle2, XCircle, ShieldCheck, RefreshCw } from "lucide-react";

export default function CitizenDashboard() {
  const { token, user } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [history, setHistory] = useState([]);
  const [verifyReason, setVerifyReason] = useState("");

  useEffect(() => {
    fetchGrievances();
  }, [token]);

  const fetchGrievances = async () => {
    try {
      const res = await fetch("/api/grievances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data.grievances);
      }
    } catch (err) {
      console.error("Fetch grievances error:", err);
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

  const handleVerifyResolution = async (verified) => {
    if (!selectedGrievance) return;

    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verified,
          reason: verifyReason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setVerifyReason("");
        fetchGrievances();
        handleOpenDetail(selectedGrievance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem" }}>Citizen Grievance Dashboard</h2>
          <p style={{ color: "#94a3b8" }}>Track your registered civic complaints and live resolution timelines</p>
        </div>
        <Link to="/citizen/grievance/new" className="btn btn-primary">
          <PlusCircle size={18} /> Report New Grievance
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedGrievance ? "1fr 420px" : "1fr", gap: "1.5rem" }}>
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading your grievances...</div>
          ) : grievances.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <ShieldCheck size={48} style={{ color: "#3b82f6", margin: "0 auto 1rem" }} />
              <h3>No Registered Grievances</h3>
              <p style={{ color: "#94a3b8", margin: "0.5rem 0 1.5rem" }}>You haven't filed any civic complaints yet.</p>
              <Link to="/citizen/grievance/new" className="btn btn-primary">
                <PlusCircle size={18} /> Report a Grievance Now
              </Link>
            </div>
          ) : (
            <div className="grievance-grid">
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

                  <div>
                    <h4 style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>{g.category}</h4>
                    <div style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: "500" }}>{g.department}</div>
                  </div>

                  <p style={{ fontSize: "0.9rem", color: "#cbd5e1", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {g.description}
                  </p>

                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <MapPin size={14} /> {g.location_text || "Location Unspecified"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Calendar size={14} /> {new Date(g.created_at).toLocaleDateString()}
                      </span>
                      <span className="badge badge-submitted">{g.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Grievance Detail Side Panel */}
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
              <div style={{ fontSize: "0.85rem", color: "#60a5fa", marginBottom: "0.5rem" }}>{selectedGrievance.department}</div>
              <p style={{ fontSize: "0.9rem", color: "#e2e8f0", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "6px" }}>
                {selectedGrievance.description}
              </p>
            </div>

            {/* Citizen Resolution Verification Prompt */}
            {selectedGrievance.status === "RESOLVED" && (
              <div style={{ background: "linear-gradient(135deg, #064e3b, #0f172a)", border: "1px solid #10b981", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#34d399", marginBottom: "0.4rem" }}>
                  Officer Marked Issue as RESOLVED
                </div>
                <p style={{ fontSize: "0.8rem", color: "#a7f3d0", marginBottom: "0.75rem" }}>
                  Is the issue actually fixed in your locality? Please verify:
                </p>

                <div style={{ marginBottom: "0.75rem" }}>
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="If issue persists, explain reason..."
                    value={verifyReason}
                    onChange={(e) => setVerifyReason(e.target.value)}
                    style={{ width: "100%", fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-success" style={{ flex: 1, fontSize: "0.8rem" }} onClick={() => handleVerifyResolution(true)}>
                    <CheckCircle2 size={14} /> YES, RESOLVED
                  </button>
                  <button className="btn btn-outline" style={{ flex: 1, fontSize: "0.8rem", borderColor: "#ef4444", color: "#f87171" }} onClick={() => handleVerifyResolution(false)}>
                    <XCircle size={14} /> NO, ISSUE PERSISTS
                  </button>
                </div>
              </div>
            )}

            {/* Audit History Timeline */}
            <div>
              <h5 style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "0.75rem" }}>Grievance Lifecycle Audit Trail</h5>
              <GrievanceTimeline history={history} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
