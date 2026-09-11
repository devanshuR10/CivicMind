import React, { useState } from "react";
import { CheckCircle2, Edit3, MapPin, Building2, AlertTriangle, FileText, Send } from "lucide-react";

export default function GrievancePreviewCard({ data, onSubmit, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...data });

  const priorityClass = {
    LOW: "badge-low",
    MEDIUM: "badge-medium",
    HIGH: "badge-high",
    CRITICAL: "badge-critical",
  }[editedData.priority || "MEDIUM"];

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit(editedData);
  };

  return (
    <div className="preview-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#60a5fa" }}>
          <CheckCircle2 size={20} /> Grievance Confirmation Preview
        </h3>
        <span className={`badge ${priorityClass}`}>{editedData.priority} Priority</span>
      </div>

      <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
        Please review the AI-extracted details below before submitting your official grievance.
      </p>

      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <div>
            <label className="preview-label">Location</label>
            <input
              type="text"
              className="chat-input"
              style={{ width: "100%", marginTop: "0.25rem" }}
              value={editedData.location_text || ""}
              onChange={(e) => setEditedData({ ...editedData, location_text: e.target.value })}
            />
          </div>
          <div>
            <label className="preview-label">Description</label>
            <textarea
              className="chat-input"
              style={{ width: "100%", height: "80px", marginTop: "0.25rem", fontFamily: "inherit" }}
              value={editedData.description || ""}
              onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-primary" onClick={handleSaveEdit}>
              Save Changes
            </button>
            <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Category</span>
              <span className="preview-value">{editedData.category}</span>
            </div>

            <div className="preview-item">
              <span className="preview-label">Subcategory</span>
              <span className="preview-value">{editedData.subcategory}</span>
            </div>

            <div className="preview-item">
              <span className="preview-label" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Building2 size={12} /> Assigned Department
              </span>
              <span className="preview-value" style={{ color: "#60a5fa" }}>{editedData.department}</span>
            </div>

            <div className="preview-item">
              <span className="preview-label" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <MapPin size={12} /> Location
              </span>
              <span className="preview-value">{editedData.location_text || "Not Specified"}</span>
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.9rem", borderRadius: "8px", marginBottom: "1.25rem" }}>
            <div className="preview-label" style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.3rem" }}>
              <FileText size={12} /> Complaint Summary
            </div>
            <div style={{ fontSize: "0.95rem", color: "#f8fafc" }}>{editedData.description}</div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
              <Edit3 size={16} /> Edit Details
            </button>
            <button className="btn btn-success" onClick={() => onSubmit(editedData)}>
              <Send size={16} /> Confirm & Submit Grievance
            </button>
          </div>
        </>
      )}
    </div>
  );
}
