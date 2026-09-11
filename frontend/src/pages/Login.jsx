import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, UserCheck, Shield, ShieldAlert, Sparkles, MapPin } from "lucide-react";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("citizen@sih.gov.in");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password123");
    setLoading(true);
    setError("");
    try {
      await login(demoEmail, "password123");
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-dark)" }}>
      {/* Left Side: Hero Image & Branding */}
      <div style={{ 
        flex: 1, 
        position: "relative",
        backgroundImage: 'linear-gradient(to bottom, rgba(5, 150, 105, 0.8), rgba(6, 78, 59, 0.9)), url("https://images.unsplash.com/photo-1596422846543-74c6fc1e004a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem",
        color: "white"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ background: "white", padding: "0.5rem", borderRadius: "10px", color: "var(--accent-blue)" }}>
            <ShieldAlert size={32} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "white" }}>JanSahay AI</h1>
        </div>

        <div>
          <h2 style={{ fontSize: "3rem", fontWeight: "700", lineHeight: "1.1", marginBottom: "1.5rem" }}>
            Empowering Citizens.<br/>Building Better Cities.
          </h2>
          <p style={{ fontSize: "1.2rem", opacity: "0.9", maxWidth: "600px", lineHeight: "1.6", marginBottom: "2rem" }}>
            Experience the next generation of civic governance. Lodge complaints conversationally in your own language, and let Local AI instantly route and escalate issues to the right officials.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "1rem", borderRadius: "12px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>100%</div>
              <div style={{ fontSize: "0.85rem", opacity: "0.8" }}>Local Offline AI Privacy</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "1rem", borderRadius: "12px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>&lt; 30s</div>
              <div style={{ fontSize: "0.85rem", opacity: "0.8" }}>Automated SLA Escalations</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "1rem", borderRadius: "12px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>9</div>
              <div style={{ fontSize: "0.85rem", opacity: "0.8" }}>Connected Departments</div>
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", opacity: "0.7" }}>
          <MapPin size={16} /> Proudly Built for Smart India Hackathon 2026
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div style={{ 
        flex: "0 0 500px", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        padding: "3rem",
        backgroundColor: "var(--bg-dark)"
      }}>
        <div className="card" style={{ boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "none" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Welcome Back</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid #ef4444", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="preview-label">Email Address</label>
              <input
                type="email"
                className="chat-input"
                style={{ width: "100%", marginTop: "0.4rem", padding: "0.9rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="preview-label">Password</label>
              <input
                type="password"
                className="chat-input"
                style={{ width: "100%", marginTop: "0.4rem", padding: "0.9rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem", padding: "0.9rem", fontSize: "1rem" }} disabled={loading}>
              <LogIn size={20} /> {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textAlign: "center", marginBottom: "1rem", letterSpacing: "1px" }}>
              QUICK DEMO LOGIN ACCOUNTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.85rem", justifyContent: "flex-start", padding: "0.75rem 1rem", backgroundColor: "white" }}
                onClick={() => handleQuickLogin("citizen@sih.gov.in")}
              >
                <UserCheck size={16} style={{ color: "var(--accent-blue)" }} /> Citizen Portal Demo
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.85rem", justifyContent: "flex-start", padding: "0.75rem 1rem", backgroundColor: "white" }}
                onClick={() => handleQuickLogin("officer@sih.gov.in")}
              >
                <Shield size={16} style={{ color: "#d97706" }} /> Water Officer Demo
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.85rem", justifyContent: "flex-start", padding: "0.75rem 1rem", backgroundColor: "white" }}
                onClick={() => handleQuickLogin("admin@sih.gov.in")}
              >
                <Sparkles size={16} style={{ color: "#7c3aed" }} /> Executive Super Admin Demo
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: "600" }}>Register Citizen Account</Link>
        </div>
      </div>
    </div>
  );
}
