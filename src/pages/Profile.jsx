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

  // Filter cards if rarity is selected
  const parsedCards = cards.map((c) => parseCard(c));
  const filteredCards =
    selectedRarity === "all"
      ? parsedCards
      : parsedCards.filter(
          (c) => c.rarity.toLowerCase() === selectedRarity.toLowerCase()
        );

  return (
    <div>
      {/* Profile Account Window */}
      <div className="card">
        <div className="window-header">
          <div className="window-dots">
            <span className="window-dot dot-red" />
            <span className="window-dot dot-yellow" />
            <span className="window-dot dot-green" />
          </div>
          <span className="window-title">👤 User Identity • Profile Manager</span>
          <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 700 }}>
            {profile ? "Signed In" : "Guest Mode"}
          </span>
        </div>

        {message && <div className="message">{message}</div>}

        {!profile ? (
          <div>
            <p style={{ marginBottom: "1rem", color: "#0f4c6e", fontWeight: 600 }}>
              Enter your student handle to create a new profile or sync your existing campus account.
            </p>
            <div className="form-row">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createProfile();
                }}
                placeholder="Enter your username (e.g. EcoHero)"
              />
              <button onClick={createProfile} disabled={loading} style={{ width: "auto" }}>
                {loading ? "Creating..." : "✨ Create / Sign In"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ color: "#034f84", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Welcome back, {profile.username}! 🌟
              </h2>
              <p style={{ color: "#0284c7", fontWeight: 700 }}>
                Rank: {levelInfo.title} • Level {levelInfo.level}
              </p>
            </div>
            <button onClick={logout} className="btn-danger">
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {profile && (
        <>
          {/* XP Progress & Level Meter Window */}
          <div className="card">
            <div className="window-header">
              <div className="window-dots">
                <span className="window-dot dot-red" />
                <span className="window-dot dot-yellow" />
                <span className="window-dot dot-green" />
              </div>
              <span className="window-title">⭐ Sustainability XP & Rank Meter</span>
              <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700 }}>
                Level {levelInfo.level}
              </span>
            </div>

            <div className="xp-meter-container">
              <div className="xp-meter-header">
                <span>{levelInfo.title}</span>
                <span>
                  {profile.xp} XP / {levelInfo.nextLevelXp} XP to next milestone
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
                <div className="stat-label">📅 RSVP'd Events</div>
                <div className="stat-value">{profile.rsvped_events.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">🏆 Completed</div>
                <div className="stat-value">{profile.completed_events.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">💰 Eco-Funds</div>
                <div className="stat-value" style={{ color: "#0284c7" }}>
                  ${money.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Aquatic Card Collection Window */}
          <div className="card">
            <div className="window-header">
              <div className="window-dots">
                <span className="window-dot dot-red" />
                <span className="window-dot dot-yellow" />
                <span className="window-dot dot-green" />
              </div>
              <span className="window-title">🎴 Holographic Aquatic Collection ({cards.length})</span>
              <Link
                to="/shop"
                style={{ fontSize: "0.85rem", color: "#0284c7", fontWeight: 700, textDecoration: "none" }}
                onClick={() => playBubbleSound()}
              >
                + Buy Packs in Shop →
              </Link>
            </div>

            {/* Rarity filter pills */}
            <div className="template-pills">
              {["all", "common", "rare", "epic", "legendary", "mythic"].map((rarity) => (
                <button
                  key={rarity}
                  className={`template-pill ${selectedRarity === rarity ? "active" : ""}`}
                  style={{
                    background: selectedRarity === rarity ? "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)" : "",
                    color: selectedRarity === rarity ? "#fff" : "",
                  }}
                  onClick={() => {
                    playBubbleSound();
                    setSelectedRarity(rarity);
                  }}
                >
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </button>
              ))}
            </div>

            {filteredCards.length === 0 ? (
              <div className="empty">
                {cards.length === 0 ? (
                  <div>
                    <p>No cards in your collection yet.</p>
                    <Link
                      to="/shop"
                      className="btn"
                      style={{ marginTop: "1rem" }}
                      onClick={() => playBubbleSound()}
                    >
                      🛍️ Visit Shop to Open Packs
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
                    style={{
                      borderColor: card.config.border,
                      boxShadow: `0 8px 20px ${card.config.glow}, inset 0 1px 1px rgba(255, 255, 255, 0.85)`,
                    }}
                    onClick={() => playBubbleSound()}
                    title={`${card.name} (${card.rarity})`}
                  >
                    <div className="card-name">{card.name}</div>
                    <div className="card-emoji">{card.emoji}</div>
                    <div
                      className="card-rarity"
                      style={{
                        background: card.config.gradient,
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                      }}
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
