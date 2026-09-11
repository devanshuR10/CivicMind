import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import GrievancePreviewCard from "./GrievancePreviewCard";
import { Bot, Send, MapPin, CheckCircle, Mic, MicOff, RefreshCw } from "lucide-react";

export default function AIGrievanceAssistant() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! 👋 I'm the Civic AI Assistant. Tell me what problem you are facing in your locality.",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [conversationState, setConversationState] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [createdGrievance, setCreatedGrievance] = useState(null);
  const [geoCoords, setGeoCoords] = useState({ lat: null, lng: null });
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showPreview, createdGrievance]);

  // Voice Recognition Handler (Web Speech API for English & Hindi)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use text input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Supports Hindi & English code-switching
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGeoCoords({ lat, lng });

          const locText = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          if (extractedData) {
            const updated = { ...extractedData, location_text: locText, latitude: lat, longitude: lng, missing_information: [] };
            setExtractedData(updated);
            setShowPreview(true);

            setMessages((prev) => [
              ...prev,
              { sender: "user", text: "Used current GPS location" },
              { sender: "ai", text: `Got it! Set location to ${locText}. Please confirm the details below:` },
            ]);
          }
        },
        () => alert("Location permission denied. Please type your location manually.")
      );
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userQuery = inputText.trim();
    setInputText("");

    setMessages((prev) => [...prev, { sender: "user", text: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/parse-complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: userQuery,
          location_text: extractedData?.location_text || null,
          conversation_state: conversationState,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze message");

      const newState = data.conversation_state || {};
      setConversationState(newState);

      if (data.is_grievance && data.extracted_data) {
        const result = data.extracted_data;
        setExtractedData(result);

        if (newState.awaitingField === "location_text") {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: data.ai_message || `I understand this is a ${result.category} issue. Where is the problem occurring?`,
              showLocButton: true,
            },
          ]);
          setShowPreview(false);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: data.ai_message || `Thank you. I have prepared your ${result.category} grievance for the ${result.department}. Please confirm below:`,
            },
          ]);
          setShowPreview(true);
        }
      } else {
        // Conversational non-grievance response (Greeting, Capabilities, Thanks, etc.)
        setExtractedData(null);
        setShowPreview(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.ai_message,
          },
        ]);
        setShowPreview(false);
      }
    } catch (err) {
      console.error("AI Parse Error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I had trouble processing that. Please describe your issue again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrievance = async (finalData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...finalData,
          latitude: geoCoords.lat || finalData.latitude || null,
          longitude: geoCoords.lng || finalData.longitude || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit grievance");

      setCreatedGrievance(data.grievance);
      setShowPreview(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bot style={{ color: "#3b82f6" }} /> AI Grievance Assistant
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
          Describe your civic problem naturally in English or Hindi (Text or Voice). Local AI will automatically route it to the right department.
        </p>
      </div>

      {createdGrievance ? (
        <div className="card" style={{ border: "1px solid #10b981", background: "linear-gradient(135deg, #064e3b, #0f172a)", padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <CheckCircle size={32} style={{ color: "#34d399" }} />
            <div>
              <h3 style={{ fontSize: "1.3rem", color: "#f8fafc" }}>Grievance Successfully Registered</h3>
              <div style={{ fontSize: "0.85rem", color: "#a7f3d0" }}>Your ticket has been recorded and routed</div>
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "10px", padding: "1.25rem", margin: "1.5rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>TRACKING ID</span>
              <span className="tracking-id" style={{ fontSize: "1.2rem", letterSpacing: "1px" }}>{createdGrievance.tracking_number}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              <div>
                <span className="preview-label">Category</span>
                <div style={{ fontWeight: "600" }}>{createdGrievance.category}</div>
              </div>
              <div>
                <span className="preview-label">Department</span>
                <div style={{ color: "#60a5fa" }}>{createdGrievance.department}</div>
              </div>
              <div>
                <span className="preview-label">Priority</span>
                <span className={`badge badge-${createdGrievance.priority.toLowerCase()}`}>{createdGrievance.priority}</span>
              </div>
              <div>
                <span className="preview-label">Status</span>
                <span className="badge badge-submitted">{createdGrievance.status}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              View My Grievances Dashboard
            </button>
            <button className="btn btn-outline" onClick={() => { setCreatedGrievance(null); setExtractedData(null); setConversationState({}); setShowPreview(false); setMessages([{ sender: "ai", text: "Hello! 👋 Tell me what problem you are facing in your locality." }]); }}>
              <RefreshCw size={16} /> File Another Grievance
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div className="avatar ai" style={{ width: "30px", height: "30px" }}>AI</div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>Civic AI Lodging Bot (Local ML)</div>
                <div style={{ fontSize: "0.75rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span> Offline Intent & Grievance Models Active
                </div>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                <div className={`avatar ${msg.sender}`}>{msg.sender === "ai" ? "AI" : "You"}</div>
                <div>
                  <div className="message-bubble" style={{ whiteSpace: "pre-line" }}>{msg.text}</div>
                  {msg.showLocButton && (
                    <button className="btn btn-outline" style={{ marginTop: "0.5rem", fontSize: "0.8rem", padding: "0.35rem 0.75rem" }} onClick={handleUseMyLocation}>
                      <MapPin size={14} /> Use My Current GPS Location
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message ai">
                <div className="avatar ai">AI</div>
                <div className="message-bubble" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8" }}>
                  <RefreshCw className="spin" size={16} /> Local AI understanding message...
                </div>
              </div>
            )}

            {showPreview && extractedData && (
              <GrievancePreviewCard
                data={extractedData}
                onEdit={(updated) => setExtractedData(updated)}
                onSubmit={handleSubmitGrievance}
              />
            )}

            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-area">
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: "0.6rem", color: isListening ? "#ef4444" : "#94a3b8" }}
              onClick={handleVoiceInput}
              title="Speak complaint (Voice Input in Hindi / English)"
            >
              {isListening ? <MicOff size={20} className="spin" /> : <Mic size={20} />}
            </button>

            <input
              type="text"
              className="chat-input"
              placeholder={isListening ? "Listening... Speak your complaint" : "Type a message (e.g. 'hi', 'what can you do', 'No water supply in Model Town')..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading || showPreview}
            />

            <button type="submit" className="btn btn-primary" disabled={loading || !inputText.trim() || showPreview}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
