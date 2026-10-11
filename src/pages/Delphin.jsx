import { useState } from "react";
import api from "../api";

export default function Delphin() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { role: "delphin", content: "Hey there! 🐬 I'm Delphin, your sustainability companion. How can I help?" },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim()) return;

    const userMsg = message;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/api/delphin/chat", { message: userMsg });
      setMessages((prev) => [...prev, { role: "delphin", content: res.data.response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "delphin", content: "Delphin is taking a swim break! Try again later. 🌊" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="card">
        <h2>🐬 Chat with Delphin</h2>
        <p className="subtitle">Your AI companion for motivation and sustainability encouragement.</p>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className="message-bubble">{msg.content}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="stack">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            rows="3"
          />
          <button onClick={sendMessage} disabled={!message.trim() || loading}>
            {loading ? "Delphin is thinking..." : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
