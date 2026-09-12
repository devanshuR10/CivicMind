import React, { useState, useContext, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Database,
  AlertCircle,
  Sparkles,
  BarChart3,
  Clock3,
  ShieldCheck,
  User,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const QUICK_QUESTIONS = [
  "What are the biggest complaint problems right now?",
  "Which departments have the highest workload?",
  "Which grievances have breached their SLA?",
  "What are the main regional hotspots?",
];

export default function AIAdminAssistant() {
  const { token } = useContext(AuthContext);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text:
        "Hello Executive Administrator. I can help you understand complaint trends, department workloads, SLA breaches, and regional hotspots using live grievance data.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const askQuestion = async (questionText) => {
    if (!questionText.trim() || loading) return;

    const q = questionText.trim();
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }

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
        {
          sender: "ai",
          text:
            "I couldn't retrieve the live analytics right now. Please try again in a moment.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    await askQuestion(question);
  };

  return (
    <section className="card admin-ai-panel">
      {/* Assistant header */}
      <header className="chat-header admin-ai-header">
        <div className="admin-ai-title-group">
          <div className="avatar ai admin-ai-avatar" aria-hidden="true">
            <Sparkles size={18} />
          </div>

          <div>
            <div className="admin-ai-title">
              JanSewa AI Admin Analyst
            </div>

            <div className="admin-ai-status">
              <span className="status-dot" />
              <Database size={12} />
              Live SQL-grounded analytics
            </div>
          </div>
        </div>

        <div className="admin-ai-secure">
          <ShieldCheck size={15} />
          Admin data
        </div>
      </header>

      {/* Conversation */}
      <div
        className="chat-messages admin-ai-messages"
        role="log"
        aria-live="polite"
        aria-label="JanSewa AI admin conversation"
      >
        <div className="admin-ai-intro">
          <div className="admin-ai-intro-icon">
            <BarChart3 size={17} />
          </div>

          <div>
            <strong>Ask about civic operations</strong>
            <p>
              Get insights from current grievance and SLA data without
              manually searching through records.
            </p>
          </div>
        </div>

        {messages.map((m, idx) => (
          <div key={idx} className={`chat-message ${m.sender}`}>
            <div className={`avatar ${m.sender}`}>
              {m.sender === "ai" ? (
                <Bot size={17} />
              ) : (
                <User size={16} />
              )}
            </div>

            <div className="admin-ai-message-content">
              <div className="admin-ai-message-label">
                {m.sender === "ai" ? "JanSewa AI" : "Administrator"}
              </div>

              <div
                className={`message-bubble ${
                  m.error ? "admin-ai-error-bubble" : ""
                }`}
              >
                {m.error && (
                  <AlertCircle
                    size={15}
                    className="admin-ai-error-icon"
                    aria-hidden="true"
                  />
                )}

                <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>

                {m.metrics && (
                  <div className="admin-ai-metrics">
                    <div className="admin-ai-metrics-title">
                      <BarChart3 size={13} />
                      Live context
                    </div>

                    <div className="admin-ai-metric-row">
                      <span>
                        <Database size={12} />
                        Total grievances
                      </span>
                      <strong>{m.metrics.total_grievances ?? 0}</strong>
                    </div>

                    <div className="admin-ai-metric-row">
                      <span>
                        <AlertCircle size={12} />
                        Escalated
                      </span>
                      <strong>{m.metrics.escalated_grievances ?? 0}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message ai">
            <div className="avatar ai">
              <Bot size={17} />
            </div>

            <div className="admin-ai-message-content">
              <div className="admin-ai-message-label">JanSewa AI</div>

              <div className="message-bubble admin-ai-thinking">
                <span className="admin-ai-thinking-dots">
                  <i />
                  <i />
                  <i />
                </span>
                Querying live database analytics
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      {!loading && messages.length <= 1 && (
        <div className="admin-ai-quick-actions">
          <span className="admin-ai-quick-label">Suggested questions</span>

          <div className="admin-ai-quick-list">
            {QUICK_QUESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className="admin-ai-quick-btn"
                onClick={() => askQuestion(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleAsk}
        className="chat-input-area admin-ai-input-area"
      >
        <div className="admin-ai-input-wrap">
          <Clock3 size={16} aria-hidden="true" />

          <input
            type="text"
            className="chat-input admin-ai-input"
            placeholder="Ask about trends, workloads, SLA breaches or hotspots..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            aria-label="Ask JanSewa AI an analytical question"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary admin-ai-send"
          disabled={loading || !question.trim()}
          aria-label="Send question"
        >
          <Send size={16} />
          <span className="admin-ai-send-label">Ask AI</span>
        </button>
      </form>
    </section>
  );
}
