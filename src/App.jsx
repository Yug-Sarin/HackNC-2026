import { BrowserRouter as Router, Routes, Route, NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import Shop from "./pages/Shop";
import Delphin from "./pages/Delphin";
import api from "./api";
import { playBubbleSound, isSoundEnabled, setSoundEnabled } from "./utils/soundHelper";

const companionMessages = [
  "I believe in you — tiny eco actions add up! 🌊",
  "Let's find a volunteer event and make campus greener! 🌿",
  "Every sustainable choice counts. You're doing great! 🐬",
  "You've got this — keep building a cleaner tomorrow! ✨",
  "Collect cards, gain XP, and swim towards sustainability! 🪸",
];

export default function App() {
  const [speechOpen, setSpeechOpen] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [userStats, setUserStats] = useState({ username: null, xp: 0, money: 0 });

  useEffect(() => {
    const updateStats = async () => {
      const savedUser = localStorage.getItem("username");
      if (savedUser) {
        try {
          const [profRes, moneyRes] = await Promise.all([
            api.get(`/api/profile/${savedUser}`),
            api.get(`/api/profile/${savedUser}/money`),
          ]);
          setUserStats({
            username: savedUser,
            xp: profRes.data.xp || 0,
            money: moneyRes.data.money || 0,
          });
        } catch {
          setUserStats((prev) => ({ ...prev, username: savedUser }));
        }
      } else {
        setUserStats({ username: null, xp: 0, money: 0 });
      }
    };

    updateStats();
    // Poll or re-check stats periodically
    const interval = setInterval(updateStats, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCompanionClick = () => {
    playBubbleSound();
    setSpeechOpen(true);
    setMessageIndex((prev) => (prev + 1) % companionMessages.length);
  };

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
    if (nextState) playBubbleSound();
  };

  return (
    <Router>
      {/* Animated Frutiger Aero floating bubbles */}
      <div className="aero-bubbles-container" aria-hidden="true">
        <div className="aero-bubble" />
        <div className="aero-bubble" />
        <div className="aero-bubble" />
        <div className="aero-bubble" />
        <div className="aero-bubble" />
        <div className="aero-bubble" />
        <div className="aero-bubble" />
        <div className="aero-bubble" />
      </div>

      <nav className="nav">
        <div className="nav-inner">
          <Link
            to="/"
            className="logo"
            onClick={() => playBubbleSound()}
          >
            <span className="logo-dolphin-icon">🐬</span>
            <span>HackNC 2026</span>
          </Link>

          <div className="nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              🏠 Home
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              👤 Profile
            </NavLink>
            <NavLink
              to="/events"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              📅 Events
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              🛍️ Shop
            </NavLink>
            <NavLink
              to="/delphin"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              🐬 Delphin
            </NavLink>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {userStats.username && (
              <div className="nav-status-pill">
                <span className="nav-status-item">👤 {userStats.username}</span>
                <span className="nav-status-item">⭐ {userStats.xp} XP</span>
                <span className="nav-status-item">💰 ${userStats.money.toFixed(2)}</span>
              </div>
            )}

            <button
              className="sound-toggle-btn"
              onClick={toggleSound}
              title={soundOn ? "Sound Effects Enabled (Click to Mute)" : "Sound Effects Muted (Click to Unmute)"}
              aria-label="Toggle sound"
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/delphin" element={<Delphin />} />
        </Routes>
      </main>

      <div className="companion-container">
        {speechOpen && (
          <div className="companion-speech">
            <div>{companionMessages[messageIndex]}</div>
            <div className="companion-speech-actions">
              <Link
                to="/delphin"
                className="btn companion-speech-btn"
                onClick={() => {
                  playBubbleSound();
                  setSpeechOpen(false);
                }}
              >
                💬 Open Delphi Chat
              </Link>
              <button
                className="btn-secondary companion-speech-btn"
                onClick={() => setSpeechOpen(false)}
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}
        <div
          className="companion"
          onClick={handleCompanionClick}
          aria-label="Delphin companion"
          title="Click to talk to Delphin"
        >
          🐬
        </div>
      </div>
    </Router>
  );
}
