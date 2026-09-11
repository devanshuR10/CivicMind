import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { MapPin, Building2, AlertTriangle, Layers, Navigation } from "lucide-react";

export default function GISMap() {
  const { token } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);

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
        setGrievances(data.grievances.filter((g) => g.latitude && g.longitude));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers style={{ color: "#3b82f6" }} /> GIS Spatial Grievance Map & Hotspots
        </h3>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          📍 {grievances.length} Geocoded Grievance Markers Active
        </span>
      </div>

      {/* Spatial Map Canvas Container */}
      <div
        style={{
          height: "400px",
          background: "linear-gradient(135deg, #0b1329, #1e293b)",
          borderRadius: "10px",
          border: "1px solid var(--border-color)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Map Grid Lines Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Render Map Markers */}
        {grievances.map((g, idx) => {
          // Normalize lat/lng relative position on map canvas
          const topPercent = Math.min(85, Math.max(15, ((28.75 - g.latitude) / 0.3) * 100));
          const leftPercent = Math.min(85, Math.max(15, ((g.longitude - 77.05) / 0.3) * 100));

          const pinColor = g.priority === "CRITICAL" ? "#ef4444" : g.priority === "HIGH" ? "#f87171" : g.priority === "MEDIUM" ? "#f59e0b" : "#10b981";

          return (
            <div
              key={g.id}
              style={{
                position: "absolute",
                top: `${topPercent}%`,
                left: `${leftPercent}%`,
                cursor: "pointer",
                transform: "translate(-50%, -50%)",
                zIndex: selectedPin?.id === g.id ? 20 : 10,
              }}
              onClick={() => setSelectedPin(g)}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: pinColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: `0 0 12px ${pinColor}`,
                  border: "2px solid #ffffff",
                }}
              >
                <MapPin size={16} />
              </div>
            </div>
          );
        })}

        {/* Selected Marker Popup */}
        {selectedPin && (
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              right: "1rem",
              width: "320px",
              background: "#0f172a",
              border: "1px solid #3b82f6",
              borderRadius: "10px",
              padding: "1rem",
              zIndex: 30,
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span className="tracking-id" style={{ fontSize: "0.9rem" }}>{selectedPin.tracking_number}</span>
              <span className={`badge badge-${selectedPin.priority.toLowerCase()}`}>{selectedPin.priority}</span>
            </div>

            <h4 style={{ fontSize: "0.95rem", marginBottom: "0.2rem" }}>{selectedPin.category}</h4>
            <div style={{ fontSize: "0.8rem", color: "#60a5fa" }}>{selectedPin.department}</div>
            <p style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: "0.5rem 0" }}>{selectedPin.description}</p>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>📍 {selectedPin.location_text}</div>

            <button
              className="btn btn-outline"
              style={{ width: "100%", marginTop: "0.75rem", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              onClick={() => setSelectedPin(null)}
            >
              Close Popup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
