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
      {/* Windows XP Program Window */}
      <div className="card hero-card">
        <div className="window-header">
          <span className="window-title">
            <span>🐬</span>
            <span>Campus Sustainability Hub - Microsoft Windows XP Edition</span>
          </span>
          <div className="window-dots">
            <span className="xp-btn-ctrl xp-btn-min">_</span>
            <span className="xp-btn-ctrl xp-btn-max">□</span>
            <span className="xp-btn-ctrl xp-btn-close">✕</span>
          </div>
        </div>

        <div className="hero-layout">
          <div className="hero-banner-icon">
            🐬
          </div>
          <div style={{ flex: 1 }}>
            <h1>Campus Sustainability Hub</h1>
            <p className="subtitle">
              Welcome to the official campus eco-initiative! Search and join volunteer cleanup drives,
              earn sustainability XP, open collectible creature card packs, and hang out with Delphi the dolphin mascot.
            </p>

            <div className="hero-actions">
              {!username ? (
                <Link
                  to="/profile"
                  className="btn btn-primary"
                  onClick={() => playBubbleSound()}
                >
                  Create User Profile
                </Link>
              ) : (
                <Link
                  to="/profile"
                  className="btn btn-primary"
                  onClick={() => playBubbleSound()}
                >
                  Logged in as {username}
                </Link>
              )}

              <Link
                to="/events"
                className="btn"
                onClick={() => playBubbleSound()}
              >
                Browse Events ({eventCount})
              </Link>

              <Link
                to="/shop"
                className="btn"
                onClick={() => playBubbleSound()}
              >
                Card Pack Shop
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid with Windows XP Panels */}
      <div className="grid">
        <Link
          to="/events"
          className="feature-card"
          onClick={() => playBubbleSound()}
        >
          <div className="feature-icon">📅</div>
          <h3>Volunteer Events</h3>
          <p>Find local cleanups, tree plantings, and community eco-actions.</p>
        </Link>

        <Link
          to="/profile"
          className="feature-card"
          onClick={() => playBubbleSound()}
        >
          <div className="feature-icon">⭐</div>
          <h3>XP & Level Meter</h3>
          <p>Complete events, gain XP points, and climb the sustainability ranks.</p>
        </Link>

        <Link
          to="/shop"
          className="feature-card"
          onClick={() => playBubbleSound()}
        >
          <div className="feature-icon">🎴</div>
          <h3>Creature Card Packs</h3>
          <p>Collect rare marine creatures from common crabs to mythical leviathans.</p>
        </Link>

        <Link
          to="/delphin"
          className="feature-card"
          onClick={() => playBubbleSound()}
        >
          <div className="feature-icon">🐬</div>
          <h3>Delphi Mascot</h3>
          <p>Chat with your cheerful dolphin companion for quick tips and motivation.</p>
        </Link>
      </div>

      {/* How It Works Section */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="window-header">
          <span className="window-title">
            <span>ℹ️</span>
            <span>Instructions - How It Works</span>
          </span>
          <div className="window-dots">
            <span className="xp-btn-ctrl xp-btn-min">_</span>
            <span className="xp-btn-ctrl xp-btn-max">□</span>
            <span className="xp-btn-ctrl xp-btn-close">✕</span>
          </div>
        </div>

        <fieldset className="xp-groupbox">
          <legend className="xp-legend">Step-by-Step Overview</legend>
          <div className="steps-container">
            {[
              { num: 1, text: "Create your student profile and receive $100.00 starting eco-funds." },
              { num: 2, text: "Browse campus sustainability volunteer events or create a new event." },
              { num: 3, text: "RSVP to events and mark them complete to gain sustainability XP." },
              { num: 4, text: "Visit the shop to buy Basic, Premium, and Legendary creature packs." },
              { num: 5, text: "Talk to Delphi the dolphin mascot anytime for encouragement and advice." },
            ].map((step) => (
              <div key={step.num} className="step">
                <div className="step-number">{step.num}</div>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
