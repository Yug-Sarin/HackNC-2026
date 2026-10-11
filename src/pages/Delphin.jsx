import { useState, useRef, useEffect } from "react";
import api from "../api";
import { playBubbleSound } from "../utils/soundHelper";

const QUICK_PROMPTS = [
  "💡 Give me a quick campus eco tip!",
  "⭐ How do I earn the most XP today?",
  "🦈 What is the rarest card in the shop?",
  "🐬 Tell me a cool dolphin fact!",
  "🌿 Why does campus sustainability matter?",
];

export default function Delphin() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "delphin",
      content: "Hey there! 🐬 I'm Delphin, your campus sustainability companion. How can I help you make our campus cleaner and greener today?",
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
          content: "Delphin is taking a quick swim break in the campus stream! Make sure the backend server is running and try again in a moment. 🌊",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Messenger Aero Window */}
      <div className="card chat-window" style={{ padding: 0 }}>
        {/* Title Bar */}
        <div className="window-header" style={{ margin: 0, borderRadius: 0 }}>
          <div className="window-dots">
            <span className="window-dot dot-red" />
            <span className="window-dot dot-yellow" />
            <span className="window-dot dot-green" />
          </div>
          <span className="window-title">🐬 Delphin Live Messenger • Sustainability Companion</span>
          <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700 }}>v2026.1</span>
        </div>

        {/* Messenger Contact Status Bar */}
        <div className="chat-messenger-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #ffffff 0%, #bae6fd 60%, #0284c7 100%)",
                border: "1.5px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
              }}
            >
              🐬
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "#034f84", fontSize: "1.05rem" }}>
                Delphi the Dolphin
              </div>
              <div className="delphin-status-badge">
                <span className="status-dot-online" />
                <span>Online • Swimming in Campus Waters 🌊</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Powered by HackNC 2026
          </div>
        </div>

        {/* Chat Stream */}
        <div style={{ padding: "1.5rem" }}>
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
                      fontSize: "0.72rem",
                      color: "#64748b",
                      marginTop: "0.2rem",
                      textAlign: msg.role === "user" ? "right" : "left",
                      padding: "0 0.4rem",
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
                <div className="message-bubble" style={{ fontStyle: "italic", color: "#0284c7" }}>
                  Delphi is thinking & splashing water... 🫧
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ marginBottom: "0.8rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#034f84", display: "block", marginBottom: "0.4rem" }}>
              💡 Quick Prompts:
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
              placeholder="Ask Delphi about campus events, tips, or sustainable living... (Press Enter to send)"
              rows="2"
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line
              </span>
              <button
                onClick={() => handleSend()}
                disabled={!message.trim() || loading}
              >
                {loading ? "Splashing..." : "💬 Send to Delphi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
