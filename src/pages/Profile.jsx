import { useState, useEffect } from "react";
import api from "../api";

const cardRarities = {
  "🐟": "common",
  "🐠": "common",
  "🦑": "uncommon",
  "🦈": "rare",
  "🐙": "rare",
  "🦐": "common",
  "🦞": "uncommon",
  "🐚": "uncommon",
  "👑": "legendary",
};

const getRarityColor = (card) => {
  const rarity = cardRarities[card] || "unknown";
  const colors = {
    common: "#86efac",
    uncommon: "#5ac8fa",
    rare: "#f59e0b",
    legendary: "#ff3b30",
    unknown: "#888",
  };
  return colors[rarity];
};

const getRarityLabel = (card) => {
  return cardRarities[card] || "unknown";
};

export default function Profile() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState([]);
  const [money, setMoney] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      setCards(cardsRes.data.cards);
      const moneyRes = await api.get(`/api/profile/${name}/money`);
      setMoney(moneyRes.data.money);
    } catch (error) {
      setMessage("Error loading profile");
    }
  }

  async function createProfile() {
    if (!username.trim()) {
      setMessage("Please enter a username");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/profile/create", { username });
      setProfile(res.data);
      localStorage.setItem("username", username);
      setMessage("Profile created! ✅");
      setCards([]);
      setMoney(100);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Error creating profile");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setProfile(null);
    setUsername("");
    setCards([]);
    localStorage.removeItem("username");
  }

  return (
    <div>
      <div className="card">
        <h2>👤 Profile</h2>
        {message && <div className="message">{message}</div>}

        {!profile ? (
          <div className="stack">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
            <button onClick={createProfile} disabled={loading}>
              {loading ? "Creating..." : "Create Profile"}
            </button>
          </div>
        ) : (
          <div>
            <h3>Welcome, {profile.username}! 🎉</h3>
            <button onClick={logout} className="btn-secondary">Logout</button>
          </div>
        )}
      </div>

      {profile && (
        <>
          <div className="card">
            <h2>📊 Your Stats</h2>
            <div className="grid stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total XP</div>
                <div className="stat-value">{profile.xp}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">RSVP'd</div>
                <div className="stat-value">{profile.rsvped_events.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{profile.completed_events.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">💰 Money</div>
                <div className="stat-value">${money.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>🎴 Your Cards ({cards.length})</h2>
            {cards.length === 0 ? (
              <p className="empty">No cards yet. Visit the shop to buy packs.</p>
            ) : (
              <div className="cards-grid">
                {cards.map((card, idx) => (
                  <div key={idx} className="card-display" style={{ borderColor: getRarityColor(card) }}>
                    <div className="card-emoji">{card}</div>
                    <div className="card-rarity">{getRarityLabel(card)}</div>
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
