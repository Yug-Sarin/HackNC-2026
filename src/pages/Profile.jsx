import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { parseCard, calculateLevel } from "../utils/cardHelper";
import { playBubbleSound, playChimeSound } from "../utils/soundHelper";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState([]);
  const [money, setMoney] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("username");
    if (saved) {
      setUsername(saved);
      loadProfile(saved);
    }
  }, []);

  async function loadProfile(name) {
    try {
      const res = await api.get(`/api/profile/${name}`);
      setProfile(res.data);
      const cardsRes = await api.get(`/api/profile/${name}/cards`);
      setCards(cardsRes.data.cards || []);
      const moneyRes = await api.get(`/api/profile/${name}/money`);
      setMoney(moneyRes.data.money || 0);
    } catch {
      setMessage("Error loading profile. Make sure the backend server is running!");
    }
  }

  async function createProfile() {
    if (!username.trim()) {
      setMessage("Please enter a username");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/profile/create", { username: username.trim() });
      setProfile(res.data);
      localStorage.setItem("username", username.trim());
      setMessage("Profile created! You received $100.00 starting eco-funds! 🎉");
      setCards([]);
      setMoney(100.0);
      playChimeSound();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Error creating profile");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    playBubbleSound();
    setProfile(null);
    setUsername("");
    setCards([]);
    setMoney(0);
    localStorage.removeItem("username");
    setMessage("Logged out successfully");
  }

  const levelInfo = calculateLevel(profile?.xp || 0);

  const parsedCards = cards.map((c) => parseCard(c));
  const filteredCards =
    selectedRarity === "all"
      ? parsedCards
      : parsedCards.filter(
          (c) => c.rarity.toLowerCase() === selectedRarity.toLowerCase()
        );

  return (
    <div>
      {/* Profile Dialog Window */}
      <div className="card">
        <div className="window-header">
          <span className="window-title">
            <span>👤</span>
            <span>User Accounts - Profile Properties</span>
          </span>
          <div className="window-dots">
            <span className="xp-btn-ctrl xp-btn-min">_</span>
            <span className="xp-btn-ctrl xp-btn-max">□</span>
            <span className="xp-btn-ctrl xp-btn-close">✕</span>
          </div>
        </div>

        {message && <div className="message">{message}</div>}

        {!profile ? (
          <fieldset className="xp-groupbox">
            <legend className="xp-legend">Log On / Create Account</legend>
            <p style={{ marginBottom: "8px", color: "#333" }}>
              Type your student handle below to access your campus sustainability account.
            </p>
            <div className="form-row">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createProfile();
                }}
                placeholder="User name (e.g. EcoExplorer)"
              />
              <button
                onClick={createProfile}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "auto" }}
              >
                {loading ? "Logging in..." : "OK / Create"}
              </button>
            </div>
          </fieldset>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ color: "#003c74", fontSize: "14px", fontWeight: "bold" }}>
                Welcome back, {profile.username}!
              </h2>
              <p style={{ color: "#444", fontSize: "11px", marginTop: "2px" }}>
                Rank: <strong>{levelInfo.title}</strong> • Level {levelInfo.level}
              </p>
            </div>
            <button onClick={logout} className="btn btn-danger">
              Log Off
            </button>
          </div>
        )}
      </div>

      {profile && (
        <>
          {/* XP Progress & Level Meter Window */}
          <div className="card">
            <div className="window-header">
              <span className="window-title">
                <span>⭐</span>
                <span>Performance - Sustainability XP Monitor</span>
              </span>
              <div className="window-dots">
                <span className="xp-btn-ctrl xp-btn-min">_</span>
                <span className="xp-btn-ctrl xp-btn-max">□</span>
                <span className="xp-btn-ctrl xp-btn-close">✕</span>
              </div>
            </div>

            <fieldset className="xp-groupbox">
              <legend className="xp-legend">XP Milestone Status</legend>
              <div className="xp-meter-container">
                <div className="xp-meter-header">
                  <span>{levelInfo.title} (Level {levelInfo.level})</span>
                  <span>
                    {profile.xp} / {levelInfo.nextLevelXp} XP to next level
                  </span>
                </div>
                <div className="xp-bar-track">
                  <div
                    className="xp-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(5, levelInfo.progressPercent))}%` }}
                  />
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total XP</div>
                  <div className="stat-value">{profile.xp}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">RSVP'd Events</div>
                  <div className="stat-value">{profile.rsvped_events.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{profile.completed_events.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Eco-Funds</div>
                  <div className="stat-value" style={{ color: "#0055ea" }}>
                    ${money.toFixed(2)}
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Creature Card Collection Window */}
          <div className="card">
            <div className="window-header">
              <span className="window-title">
                <span>🎴</span>
                <span>My Collection - Marine Creatures ({cards.length})</span>
              </span>
              <div className="window-dots">
                <span className="xp-btn-ctrl xp-btn-min">_</span>
                <span className="xp-btn-ctrl xp-btn-max">□</span>
                <span className="xp-btn-ctrl xp-btn-close">✕</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
              <div className="template-pills">
                {["all", "common", "rare", "epic", "legendary", "mythic"].map((rarity) => (
                  <button
                    key={rarity}
                    className={`template-pill ${selectedRarity === rarity ? "btn-primary" : ""}`}
                    onClick={() => {
                      playBubbleSound();
                      setSelectedRarity(rarity);
                    }}
                  >
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </button>
                ))}
              </div>

              <Link
                to="/shop"
                className="btn"
                onClick={() => playBubbleSound()}
              >
                + Open Packs in Shop →
              </Link>
            </div>

            {filteredCards.length === 0 ? (
              <div className="empty">
                {cards.length === 0 ? (
                  <div>
                    <p>No cards in your collection yet.</p>
                    <Link
                      to="/shop"
                      className="btn btn-primary"
                      style={{ marginTop: "8px" }}
                      onClick={() => playBubbleSound()}
                    >
                      Open Creature Packs
                    </Link>
                  </div>
                ) : (
                  <p>No {selectedRarity} cards found.</p>
                )}
              </div>
            ) : (
              <div className="cards-grid">
                {filteredCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="card-display"
                    style={{ borderColor: card.config.border }}
                    onClick={() => playBubbleSound()}
                    title={`${card.name} (${card.rarity})`}
                  >
                    <div className="card-name">{card.name}</div>
                    <div className="card-emoji">{card.emoji}</div>
                    <div
                      className="card-rarity"
                      style={{ background: card.config.gradient }}
                    >
                      {card.rarity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
