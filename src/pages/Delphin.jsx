import { useState, useRef, useEffect } from "react";
import api from "../api";
import { playBubbleSound } from "../utils/soundHelper";

const QUICK_PROMPTS = [
  "💡 Give me a quick campus eco tip!",
  "⭐ How do I earn the most XP today?",
  "🦈 What is the rarest card in the shop?",
  "🐬 Tell me a cool dolphin fact!",
  "🌿 How can students reduce food waste on campus?",
];

export default function Delphin() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "delphin",
      content: "Hey there! 🐬 I'm Delphi, your campus sustainability mascot. How can I help you complete your eco quests today?",
      time: "Just now",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend(textToSend) {
    const text = (textToSend || message).trim();
    if (!text || loading) return;

    playBubbleSound();
    const userMsg = {
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/api/delphin/chat", { message: text });
      playBubbleSound();
      setMessages((prev) => [
        ...prev,
        {
          role: "delphin",
          content: res.data.response,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "delphin",
          content: "Delphi is taking a quick swim break in the campus stream! Make sure the backend server is running and try again in a moment. 🌊",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Windows Messenger Window */}
      <div className="card chat-window">
        {/* Title Bar */}
        <div className="window-header" style={{ margin: 0 }}>
          <span className="window-title">
            <span>🐬</span>
            <span>Delphi Instant Messenger - Campus Mascot Edition</span>
          </span>
          <div className="window-dots">
            <span className="xp-btn-ctrl xp-btn-min">_</span>
            <span className="xp-btn-ctrl xp-btn-max">□</span>
            <span className="xp-btn-ctrl xp-btn-close">✕</span>
          </div>
        </div>

        {/* Messenger Contact Status Bar */}
        <div className="chat-messenger-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "3px",
                background: "#ffffff",
                border: "1px solid #7f9db9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
              }}
            >
              🐬
            </div>
            <div>
              <div style={{ fontWeight: "bold", color: "#003c74", fontSize: "12px" }}>
                Delphi the Dolphin
              </div>
              <div className="delphin-status-badge">
                <span className="status-dot-online" />
                <span>Online • Swimming in Campus Waters 🌊</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: "11px", color: "#555" }}>
            Windows XP Messenger v5.1
          </div>
        </div>

        {/* Chat Stream */}
        <div style={{ padding: "12px" }}>
          <div className="chat-container">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-row ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "delphin" ? "🐬" : "👤"}
                </div>
                <div>
                  <div className="message-bubble">{msg.content}</div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#777",
                      marginTop: "2px",
                      textAlign: msg.role === "user" ? "right" : "left",
                    }}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-row delphin">
                <div className="message-avatar">🐬</div>
                <div className="message-bubble" style={{ fontStyle: "italic", color: "#003c74" }}>
                  Delphi is splashing water & thinking... 🫧
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#003c74", display: "block", marginBottom: "4px" }}>
              Suggested Messages:
            </span>
            <div className="chat-prompt-chips">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  className="prompt-chip"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Stack */}
          <div className="stack">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message here... (Press Enter to send)"
              rows="2"
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "#666" }}>
                Press <strong>Enter</strong> to send
              </span>
              <button
                onClick={() => handleSend()}
                disabled={!message.trim() || loading}
                className="btn btn-primary"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
