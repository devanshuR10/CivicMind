import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Bot, Send, Database, AlertCircle, Sparkles } from "lucide-react";

export default function AIAdminAssistant() {
  const { token } = useContext(AuthContext);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello Executive Administrator! Ask me any question regarding complaint trends, department workloads, SLA breaches, or regional hotspot statistics.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const q = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { sender: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/admin-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.answer,
          metrics: data.metrics,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I had trouble querying live database metrics." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", height: "550px", padding: "0", overflow: "hidden" }}>
      <div className="chat-header" style={{ background: "linear-gradient(135deg, #1e1b4b, #0f172a)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div className="avatar ai" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: "700", color: "#f8fafc" }}>JanSeva AI Admin Analyst</div>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Database size={10} /> Grounded in Live SQL Database Metrics
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages" style={{ flex: 1, padding: "1.25rem", overflowY: "auto" }}>
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-message ${m.sender}`}>
            <div className={`avatar ${m.sender}`}>{m.sender === "ai" ? "AI" : "Admin"}</div>
            <div className="message-bubble" style={{ whiteSpace: "pre-wrap" }}>
              {m.text}
              {m.metrics && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem", color: "#94a3b8" }}>
                  📊 Context: {m.metrics.total_grievances} Total Grievances | {m.metrics.escalated_grievances} Escalated
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Querying database analytics...</div>}
      </div>

      <form onSubmit={handleAsk} className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask analytical question (e.g. 'What are the biggest problems in Zone 4?')..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !question.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
