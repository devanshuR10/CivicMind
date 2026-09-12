import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import GrievancePreviewCard from "./GrievancePreviewCard";
import {
  Bot,
  Send,
  MapPin,
  CheckCircle,
  Mic,
  MicOff,
  RefreshCw,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

export default function AIGrievanceAssistant() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text:
        "Hello! 👋 I'm JanSewa AI. Tell me about the civic problem you are facing in your locality. You can type or use voice input.",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("en-IN");
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

  const speechLanguages = [
    { code: "en-IN", label: "English" },
    { code: "hi-IN", label: "Hindi" },
    { code: "bn-IN", label: "Bengali" },
    { code: "ta-IN", label: "Tamil" },
    { code: "te-IN", label: "Telugu" },
    { code: "mr-IN", label: "Marathi" },
  ];

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use text input."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "language-not-supported") {
        alert(
          "This language is not supported by your browser's speech recognition service. Please select another language or type your complaint."
        );
      }
    };

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
            const updated = {
              ...extractedData,
              location_text: locText,
              latitude: lat,
              longitude: lng,
              missing_information: [],
            };

            setExtractedData(updated);
            setShowPreview(true);

            setMessages((prev) => [
              ...prev,
              { sender: "user", text: "Used my current GPS location" },
              {
                sender: "ai",
                text: `Got it! I've set the grievance location to ${locText}. Please review the details below before submitting.`,
              },
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

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userQuery },
    ]);

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

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze message");
      }

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
              text:
                data.ai_message ||
                `I understand this is a ${result.category} issue. Where is the problem occurring?`,
              showLocButton: true,
            },
          ]);

          setShowPreview(false);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text:
                data.ai_message ||
                `Thank you. I've prepared your ${result.category} grievance for the ${result.department}. Please review and confirm the details below.`,
            },
          ]);

          setShowPreview(true);
        }
      } else {
        setExtractedData(null);
        setShowPreview(false);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text:
              data.ai_message ||
              "I can help you report civic and government service problems. Please describe the issue you are facing.",
          },
        ]);
      }
    } catch (err) {
      console.error("AI Parse Error:", err);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            "Sorry, I couldn't process that message right now. Please describe your civic issue again.",
          error: true,
        },
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit grievance");
      }

      setCreatedGrievance(data.grievance);
      setShowPreview(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAssistant = () => {
    setCreatedGrievance(null);
    setExtractedData(null);
    setConversationState({});
    setGeoCoords({ lat: null, lng: null });
    setShowPreview(false);
    setMessages([
      {
        sender: "ai",
        text:
          "Hello! 👋 I'm JanSewa AI. Tell me about the civic problem you are facing in your locality.",
      },
    ]);
  };

  return (
    <div className="ai-grievance-page">
      {/* Page heading */}
      <div className="ai-grievance-heading">
        <div className="ai-grievance-heading-icon">
          <Bot size={22} />
        </div>

        <div>
          <h2>JanSewa AI Civic Assistant</h2>
          <p>
            Describe your civic problem naturally. Our local AI helps identify
            the issue, department and required grievance details.
          </p>
        </div>
      </div>

      {createdGrievance ? (
        <div className="grievance-success-card">
          <div className="grievance-success-heading">
            <div className="grievance-success-icon">
              <CheckCircle size={28} />
            </div>

            <div>
              <h3>Grievance Successfully Registered</h3>
              <p>Your complaint has been recorded and routed to the appropriate department.</p>
            </div>
          </div>

          <div className="grievance-ticket-card">
            <div className="grievance-ticket-header">
              <span>TRACKING ID</span>
              <strong>{createdGrievance.tracking_number}</strong>
            </div>

            <div className="grievance-ticket-grid">
              <div>
                <span className="preview-label">Category</span>
                <strong>{createdGrievance.category}</strong>
              </div>

              <div>
                <span className="preview-label">Department</span>
                <strong>{createdGrievance.department}</strong>
              </div>

              <div>
                <span className="preview-label">Priority</span>
                <span
                  className={`badge badge-${String(
                    createdGrievance.priority || "medium"
                  ).toLowerCase()}`}
                >
                  {createdGrievance.priority}
                </span>
              </div>

              <div>
                <span className="preview-label">Status</span>
                <span className="badge badge-submitted">
                  {createdGrievance.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grievance-success-actions">
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              View My Grievances
            </button>

            <button className="btn btn-secondary" onClick={resetAssistant}>
              <RefreshCw size={16} />
              File Another Grievance
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-container ai-grievance-chat">
          {/* Chat header */}
          <div className="chat-header ai-grievance-chat-header">
            <div className="ai-chat-identity">
              <div className="avatar ai">
                <Bot size={17} />
              </div>

              <div>
                <div className="ai-chat-name">
                  JanSewa AI
                </div>

                <div className="ai-chat-status">
                  <span className="status-dot" />
                  Local intent & grievance models active
                </div>
              </div>
            </div>

            <div className="ai-chat-badge">
              <ShieldCheck size={14} />
              Local AI
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages ai-grievance-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message ${msg.sender}`}
              >
                <div className={`avatar ${msg.sender}`}>
                  {msg.sender === "ai" ? (
                    <Bot size={16} />
                  ) : (
                    "You"
                  )}
                </div>

                <div className="ai-message-content">
                  <div className="ai-message-label">
                    {msg.sender === "ai" ? "JanSewa AI" : "You"}
                  </div>

                  <div
                    className={`message-bubble ${
                      msg.error ? "ai-message-error" : ""
                    }`}
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {msg.error && (
                      <span className="ai-message-error-icon">
                        <RefreshCw size={14} />
                      </span>
                    )}

                    {msg.text}
                  </div>

                  {msg.showLocButton && (
                    <button
                      className="btn btn-outline ai-location-button"
                      onClick={handleUseMyLocation}
                      type="button"
                    >
                      <MapPin size={14} />
                      Use My Current Location
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message ai">
                <div className="avatar ai">
                  <Bot size={16} />
                </div>

                <div className="ai-message-content">
                  <div className="ai-message-label">JanSewa AI</div>

                  <div className="message-bubble ai-thinking">
                    <span className="ai-thinking-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    Understanding your complaint...
                  </div>
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

          {/* Input */}
          <form onSubmit={handleSendMessage} className="chat-input-area ai-grievance-input-area">
            <button
              type="button"
              className={`btn btn-outline ai-voice-button ${
                isListening ? "is-listening" : ""
              }`}
              onClick={handleVoiceInput}
              title="Speak your complaint"
              aria-label="Speak your complaint"
              disabled={loading || showPreview}
            >
              {isListening ? (
                <MicOff size={19} />
              ) : (
                <Mic size={19} />
              )}
            </button>

            <select
              className="chat-input ai-language-select"
              value={speechLanguage}
              onChange={(e) => setSpeechLanguage(e.target.value)}
              disabled={loading || showPreview || isListening}
              aria-label="Speech input language"
              title="Choose your voice input language"
            >
              {speechLanguages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>

            <div className="ai-text-input-wrap">
              <MessageSquare size={15} />
              <input
                type="text"
                className="chat-input ai-text-input"
                placeholder={
                  isListening
                    ? "Listening... Speak your complaint"
                    : "Describe your civic problem..."
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading || showPreview}
                aria-label="Describe your civic problem"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary ai-send-button"
              disabled={loading || !inputText.trim() || showPreview}
              aria-label="Send complaint"
            >
              <Send size={17} />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
