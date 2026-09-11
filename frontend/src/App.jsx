import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import OfficerDashboard from "./components/OfficerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import NewGrievancePage from "./pages/NewGrievancePage";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  if (user.role === "OFFICER") {
    return <OfficerDashboard />;
  }

  if (user.role === "SUPER_ADMIN" || user.role === "DEPARTMENT_ADMIN") {
    return <AdminDashboard />;
  }

  return <CitizenDashboard />;
};

function AppContent() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/grievance/new"
            element={
              <ProtectedRoute>
                <NewGrievancePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
