import React from "react";
import { CheckCircle2, Clock, ArrowRight, UserCheck, AlertTriangle } from "lucide-react";

export default function GrievanceTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No timeline events recorded yet.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "relative", paddingLeft: "1.5rem" }}>
      {/* Vertical line connecting events */}
      <div
        style={{
          position: "absolute",
          left: "7px",
          top: "8px",
          bottom: "8px",
          width: "2px",
          backgroundColor: "#334155",
        }}
      />

      {history.map((event, idx) => (
        <div key={idx} style={{ position: "relative" }}>
          {/* Bullet node */}
          <div
            style={{
              position: "absolute",
              left: "-1.5rem",
              top: "2px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: event.new_status === "CITIZEN_VERIFIED" ? "#10b981" : event.new_status === "ESCALATED" ? "#ef4444" : "#3b82f6",
              border: "3px solid #0f172a",
            }}
          />

          <div style={{ fontSize: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="badge badge-submitted" style={{ padding: "0.15rem 0.45rem", fontSize: "0.7rem" }}>
                {event.new_status}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                {new Date(event.created_at).toLocaleString()}
              </span>
            </div>

            <div style={{ color: "#cbd5e1", marginTop: "0.25rem", fontWeight: "500" }}>
              {event.notes || `Status transitioned to ${event.new_status}`}
            </div>

            {event.changed_by_name && (
              <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.1rem" }}>
                Action by: {event.changed_by_name}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
