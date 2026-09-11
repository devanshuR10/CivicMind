import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ShieldAlert, PlusCircle, LayoutDashboard, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="brand-icon">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="brand-title">JanSeva AI</div>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Unified Grievance Portal</div>
          </div>
        </Link>
      </div>

      {user && (
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          >
            <LayoutDashboard size={18} /> My Grievances
          </Link>

          <Link
            to="/citizen/grievance/new"
            className={`nav-item ${location.pathname === "/citizen/grievance/new" ? "active" : ""}`}
          >
            <PlusCircle size={18} /> Report a Grievance
          </Link>

          <div className="user-badge" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <User size={14} /> {user.name} ({user.role})
          </div>

          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "0.4rem 0.8rem" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
