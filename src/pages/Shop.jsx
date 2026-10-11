import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { parseCard } from "../utils/cardHelper";
import { playBubbleSound, playChimeSound } from "../utils/soundHelper";

const PACK_DEFINITIONS = [
  {
    type: "basic",
    name: "🐟 Tidal Basic Pack",
    price: 10,
    description: "Common & Rare aquatic life",
    color: "#28a428",
    icon: "🐟",
    chances: "Fish, Crab, Turtle (Common) • Octopus (Rare)",
  },
  {
    type: "premium",
    name: "🦈 Oceanic Premium Pack",
    price: 25,
    description: "Rare & Epic marine creatures",
    color: "#0055ea",
    icon: "🦈",
    chances: "Shark, Dolphin (Rare) • Whale (Epic) • Kraken (Legendary)",
  },
  {
    type: "legendary",
    name: "🔱 Abyssal Legendary Pack",
    price: 50,
    description: "Epic & Mythic sea deities",
    color: "#d67b29",
    icon: "🔱",
    chances: "Mermaid, Sea Serpent (Epic) • Poseidon (Legendary) • Leviathan (Mythic)",
  },
];

export default function Shop() {
  const [username, setUsername] = useState(null);
  const [cards, setCards] = useState([]);
  const [money, setMoney] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pulledCard, setPulledCard] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("username");
    if (saved) {
      setUsername(saved);
      loadUserData(saved);
    }
  }, []);

  async function loadUserData(name) {
    try {
      const [moneyRes, cardsRes] = await Promise.all([
        api.get(`/api/profile/${name}/money`),
        api.get(`/api/profile/${name}/cards`),
      ]);
      setMoney(moneyRes.data.money || 0);
      setCards(cardsRes.data.cards || []);
    } catch {
      setMessage("Error loading shop data. Make sure backend is running!");
    }
  }

  async function buyPack(packType) {
    if (!username) return;
    setLoading(true);
    setShowAnimation(false);
    try {
      const res = await api.post(`/api/shop/buy-pack/${username}`, {
        pack_type: packType,
      });

      if (res.data.success) {
        const parsed = parseCard(res.data.card_gained);
        setPulledCard(parsed);
        setShowAnimation(true);
        playChimeSound();
        setMessage(`You pulled ${res.data.card_gained}! Saved to your collection.`);
        setMoney(res.data.money_remaining);
        setCards(res.data.cards || []);
      } else {
        setMessage(res.data.message || "Failed to purchase pack");
      }
    } catch {
      setMessage("Error opening pack");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!username ? (
        <div className="card">
          <div className="window-header">
            <span className="window-title">
              <span>🛍️</span>
              <span>Shop Properties</span>
            </span>
            <div className="window-dots">
              <span className="xp-btn-ctrl xp-btn-min">_</span>
              <span className="xp-btn-ctrl xp-btn-max">□</span>
              <span className="xp-btn-ctrl xp-btn-close">✕</span>
            </div>
          </div>
          <div className="empty">
            <p style={{ marginBottom: "10px" }}>
              Please log on or create your profile to browse and buy creature card packs!
            </p>
            <Link
              to="/profile"
              className="btn btn-primary"
              onClick={() => playBubbleSound()}
            >
              Go to Profile
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Shop Window */}
          <div className="card">
            <div className="window-header">
              <span className="window-title">
                <span>🛍️</span>
                <span>Aquatic Card Exchange - Booster Pack Shop</span>
              </span>
              <div className="window-dots">
                <span className="xp-btn-ctrl xp-btn-min">_</span>
                <span className="xp-btn-ctrl xp-btn-max">□</span>
                <span className="xp-btn-ctrl xp-btn-close">✕</span>
              </div>
            </div>

            {message && <div className="message">{message}</div>}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <p style={{ color: "#333", fontSize: "11px" }}>
                Spend your earned sustainability eco-funds on collectible marine creature booster packs.
              </p>
              <div
                style={{
                  background: "#ffffff",
                  padding: "4px 10px",
                  border: "1px solid #7f9db9",
                  fontWeight: "bold",
                  color: "#003c74",
                  fontSize: "12px",
                }}
              >
                💰 Available Funds: ${money.toFixed(2)}
              </div>
            </div>

            <div className="grid">
              {PACK_DEFINITIONS.map((pack) => {
                const canAfford = money >= pack.price;

                return (
                  <div
                    key={pack.type}
                    className="pack-card"
                    style={{ borderColor: pack.color }}
                  >
                    <div>
                      <div className="pack-icon">{pack.icon}</div>
                      <h4>{pack.name}</h4>
                      <p style={{ color: "#555", margin: "4px 0 8px", fontSize: "11px" }}>
                        {pack.description}
                      </p>
                      <div className="pack-contents-preview">
                        <strong>Contains:</strong> {pack.chances}
                      </div>
                    </div>

                    <div>
                      <div className="price">${pack.price.toFixed(2)}</div>
                      <button
                        onClick={() => buyPack(pack.type)}
                        disabled={!canAfford || loading}
                        className={!canAfford ? "btn-disabled" : "btn-primary"}
                        style={{ width: "100%", marginTop: "6px" }}
                      >
                        {loading
                          ? "Opening Pack..."
                          : !canAfford
                          ? "Insufficient Funds"
                          : `Buy Pack ($${pack.price})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Windows XP Dialog Box for Card Pull */}
          {showAnimation && pulledCard && (
            <div
              className="card-pull-animation"
              onClick={() => setShowAnimation(false)}
            >
              <div
                className="card-pull-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="window-header" style={{ margin: "-2rem -2rem 1rem -2rem" }}>
                  <span className="window-title">
                    <span>🎉</span>
                    <span>New Card Discovered!</span>
                  </span>
                  <div className="window-dots">
                    <span className="xp-btn-ctrl xp-btn-close" onClick={() => setShowAnimation(false)}>✕</span>
                  </div>
                </div>

                <div className="card-pull-emoji">{pulledCard.emoji}</div>
                <h2 style={{ color: "#003c74", fontSize: "16px", marginBottom: "4px" }}>
                  {pulledCard.name}
                </h2>
                <div
                  className="aero-badge"
                  style={{
                    background: pulledCard.config.gradient,
                    color: "#fff",
                    fontSize: "11px",
                    padding: "3px 8px",
                    margin: "4px auto",
                    display: "inline-flex",
                  }}
                >
                  {pulledCard.rarity}
                </div>
                <p style={{ color: "#444", margin: "8px 0 14px", fontSize: "11px" }}>
                  Added to your collection and saved to your profile!
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAnimation(false)}
                  style={{ minWidth: "100px" }}
                >
                  OK / Collect
                </button>
              </div>
            </div>
          )}

          {/* User's Card Collection Preview */}
          <div className="card">
            <div className="window-header">
              <span className="window-title">
                <span>🎴</span>
                <span>My Collection ({cards.length})</span>
              </span>
              <div className="window-dots">
                <span className="xp-btn-ctrl xp-btn-min">_</span>
                <span className="xp-btn-ctrl xp-btn-max">□</span>
                <span className="xp-btn-ctrl xp-btn-close">✕</span>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="empty">
                <p>No cards yet! Choose a pack above to start your collection.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {cards.map((cardString, idx) => {
                  const card = parseCard(cardString);
                  return (
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
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
