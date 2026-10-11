import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { playBubbleSound } from "../utils/soundHelper";

export default function Home() {
  const [eventCount, setEventCount] = useState(0);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("username");
    setUsername(saved);

    api.get("/api/events")
      .then((res) => {
        setEventCount(res.data.length);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Window */}
      <div className="card hero-card">
        <div className="window-header">
          <div className="window-dots">
            <span className="window-dot dot-red" />
            <span className="window-dot dot-yellow" />
            <span className="window-dot dot-green" />
          </div>
          <span className="window-title">🐬 Delphin OS • Campus Sustainability Hub</span>
          <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 700 }}>v2026.1</span>
        </div>

        <h1>🌍 Campus Sustainability Hub</h1>
        <p className="subtitle">
          Experience the future of campus eco-action with nostalgic 2000s optimism. 
          Discover volunteer opportunities, earn XP, open holographic aquatic card packs, 
          and bond with your dolphin companion while restoring the planet.
        </p>

        <div className="hero-actions">
          {!username ? (
            <Link
              to="/profile"
              className="btn"
              onClick={() => playBubbleSound()}
            >
              🚀 Create Your Profile
            </Link>
          ) : (
            <Link
              to="/profile"
              className="btn"
              onClick={() => playBubbleSound()}
            >
              👤 Welcome back, {username}!
            </Link>
          )}

          <Link
            to="/events"
            className="btn btn-secondary"
            onClick={() => playBubbleSound()}
          >
            📅 Browse Events ({eventCount})
          </Link>

          <Link
            to="/shop"
            className="btn btn-secondary"
            onClick={() => playBubbleSound()}
          >
            🛍️ Open Card Packs
          </Link>
        </div>
      </div>

      {/* Feature Grid with Frutiger Aero Glass Cards */}
      <div className="grid">
        <Link
          to="/events"
          className="feature-card"
          onClick={() => playBubbleSound()}
        >
          <div className="feature-icon">📅</div>
          <h3>Volunteer Events</h3>
          <p>Find local cleanups, tree planting, and green campus initiatives.</p>
        </Link>

        <Link
          to="/profile"
          className="feature-card"
          onClick={() => playBubbleSound()}
        >
          <div className="feature-icon">⭐</div>
          <h3>XP & Level Meter</h3>
          <p>Complete eco-challenges, gain XP, and level up from Eco-Sprout to Ocean Sovereign.</p>
        </Link>

        <Link
          to="/shop"
          className="feature-card"
          onClick={() => playBubbleSound()}
        >
          <div className="feature-icon">🎴</div>
          <h3>Aquatic Card Packs</h3>
          <p>Collect rare sea creatures from Common Clownfish to Mythic Leviathans.</p>
        </Link>

        <Link
          to="/delphin"
          className="feature-card"
          onClick={() => playBubbleSound()}
        >
          <div className="feature-icon">🐬</div>
          <h3>Delphin Companion</h3>
          <p>Your cheerful AI companion giving you tailored eco-coaching and optimism.</p>
        </Link>
      </div>

      {/* How It Works Section */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="window-header">
          <div className="window-dots">
            <span className="window-dot dot-red" />
            <span className="window-dot dot-yellow" />
            <span className="window-dot dot-green" />
          </div>
          <span className="window-title">✨ How It Works • 5 Simple Steps</span>
          <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700 }}>● Active</span>
        </div>

        <div className="steps-container">
          {[
            { num: 1, text: "Create your student profile and receive $100 starting eco-funds." },
            { num: 2, text: "Explore available sustainability events or create your own." },
            { num: 3, text: "RSVP to events and mark them complete to gain XP." },
            { num: 4, text: "Visit the shop to open Basic, Premium, and Legendary card packs." },
            { num: 5, text: "Chat with Delphin anytime for tips, encouragement, and ocean facts." },
          ].map((step) => (
            <div key={step.num} className="step">
              <div className="step-number">{step.num}</div>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
