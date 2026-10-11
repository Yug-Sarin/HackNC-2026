import { BrowserRouter as Router, Routes, Route, NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import Shop from "./pages/Shop";
import api from "./api";
import { playBubbleSound, isSoundEnabled, setSoundEnabled } from "./utils/soundHelper";

export default function App() {
  const [speechOpen, setSpeechOpen] = useState(false);
  const [speechText, setSpeechText] = useState("");
  const [speechLoading, setSpeechLoading] = useState(false);
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
    const interval = setInterval(updateStats, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCompanionClick = async () => {
    playBubbleSound();
    setSpeechOpen(true);
    setSpeechLoading(true);
    try {
      const res = await api.post("/api/delphin/chat", {
        message: "Give a quick sustainability tip, fact about the environment, or encouragement",
      });
      setSpeechText(res.data.response || "Small eco actions create big waves! 🐬");
    } catch {
      setSpeechText("Delphi loves clean waters! Keep making campus greener. 🌊");
    } finally {
      setSpeechLoading(false);
    }
  };

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
    if (nextState) playBubbleSound();
  };

  return (
    <Router>
      {/* Windows XP Luna Taskbar */}
      <nav className="nav">
        <div className="nav-inner">
          <Link
            to="/"
            className="logo"
            onClick={() => playBubbleSound()}
          >
            <span className="logo-dolphin-icon">🐬</span>
            <span>start</span>
          </Link>

          <div className="nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              <span>🏠</span>
              <span>Home Hub</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              <span>👤</span>
              <span>User Profile</span>
            </NavLink>
            <NavLink
              to="/events"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              <span>📅</span>
              <span>Volunteer Events</span>
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => playBubbleSound()}
            >
              <span>🛍️</span>
              <span>Card Shop</span>
            </NavLink>
          </div>

          {/* Windows XP System Tray */}
          <div className="nav-status-pill">
            {userStats.username && (
              <>
                <span className="nav-status-item">{userStats.username}</span>
                <span className="nav-status-item">⭐ {userStats.xp} XP</span>
                <span className="nav-status-item">💰 ${userStats.money.toFixed(2)}</span>
              </>
            )}

            <button
              className="sound-toggle-btn"
              onClick={toggleSound}
              title={soundOn ? "Mute Sound" : "Enable Sound"}
              aria-label="Toggle sound"
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home onTalkToDelphi={handleCompanionClick} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/shop" element={<Shop />} />
        </Routes>
      </main>

      {/* Delphi the Search Assistant Companion (Windows XP Style) */}
      <div className="companion-container">
        {speechOpen && (
          <div className="companion-speech">
            <div className="companion-speech-title">
              <span>🐬 Delphi Assistant</span>
              <span
                style={{ cursor: "pointer", color: "#666", fontSize: "10px" }}
                onClick={() => setSpeechOpen(false)}
              >
                ✕
              </span>
            </div>
            <div>
              {speechLoading ? (
                <span style={{ fontStyle: "italic", color: "#003c74" }}>
                  Delphi is splashing water & thinking... 🫧
                </span>
              ) : (
                speechText
              )}
            </div>
            <div className="companion-speech-actions">
              <button
                className="btn btn-primary"
                style={{ fontSize: "10px", padding: "2px 8px" }}
                onClick={handleCompanionClick}
                disabled={speechLoading}
              >
                Next Tip 🐬
              </button>
              <button
                className="btn"
                style={{ fontSize: "10px", padding: "2px 8px" }}
                onClick={() => setSpeechOpen(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div
          className="companion"
          onClick={handleCompanionClick}
          aria-label="Delphi Dolphin Assistant"
          title="Click to get an eco-tip from Delphi"
        >
          🐬
        </div>
      </div>
    </Router>
  );
}
