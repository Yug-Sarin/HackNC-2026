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
    color: "#22c55e",
    foilBorder: "rgba(134, 239, 172, 0.9)",
    gradient: "linear-gradient(135deg, rgba(187, 247, 208, 0.8) 0%, rgba(34, 197, 94, 0.4) 100%)",
    icon: "🐟",
    chances: "Fish, Crab, Turtle (Common) • Octopus (Rare)",
  },
  {
    type: "premium",
    name: "🦈 Oceanic Premium Pack",
    price: 25,
    description: "Rare & Epic marine creatures",
    color: "#0284c7",
    foilBorder: "rgba(125, 211, 252, 0.9)",
    gradient: "linear-gradient(135deg, rgba(186, 230, 253, 0.8) 0%, rgba(2, 132, 199, 0.4) 100%)",
    icon: "🦈",
    chances: "Shark, Dolphin (Rare) • Whale (Epic) • Kraken (Legendary)",
  },
  {
    type: "legendary",
    name: "🔱 Abyssal Legendary Pack",
    price: 50,
    description: "Epic & Mythic sea deities",
    color: "#f59e0b",
    foilBorder: "rgba(253, 224, 71, 0.9)",
    gradient: "linear-gradient(135deg, rgba(254, 240, 138, 0.8) 0%, rgba(245, 158, 11, 0.4) 100%)",
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
        setMessage(`✨ Pulled ${res.data.card_gained}! Added to your collection.`);
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
            <div className="window-dots">
              <span className="window-dot dot-red" />
              <span className="window-dot dot-yellow" />
              <span className="window-dot dot-green" />
            </div>
            <span className="window-title">🛍️ Aquatic Card Shop</span>
          </div>
          <div className="empty">
            <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
              Please create or sign into your profile to browse and buy card packs!
            </p>
            <Link
              to="/profile"
              className="btn"
              onClick={() => playBubbleSound()}
            >
              👤 Go to Profile
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Shop Header & Booster Packs Window */}
          <div className="card">
            <div className="window-header">
              <div className="window-dots">
                <span className="window-dot dot-red" />
                <span className="window-dot dot-yellow" />
                <span className="window-dot dot-green" />
              </div>
              <span className="window-title">🛍️ Delphin Card Exchange • Aquatic Packs</span>
              <span style={{ fontSize: "0.85rem", color: "#0284c7", fontWeight: 700 }}>
                💰 Balance: ${money.toFixed(2)}
              </span>
            </div>

            {message && <div className="message">{message}</div>}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <p style={{ color: "#0f4c6e", fontWeight: 600 }}>
                Spend your earned sustainability eco-funds on holographic marine booster packs.
              </p>
              <div
                style={{
                  background: "linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)",
                  padding: "0.5rem 1.2rem",
                  borderRadius: "9999px",
                  border: "1.5px solid #7dd3fc",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#034f84",
                  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.2)",
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
                    style={{
                      borderColor: pack.foilBorder,
                      background: pack.gradient,
                    }}
                  >
                    <div>
                      <div className="pack-icon">{pack.icon}</div>
                      <h4>{pack.name}</h4>
                      <p style={{ color: "#334155", margin: "0.4rem 0 0.8rem", fontSize: "0.95rem" }}>
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
                        className={!canAfford ? "btn-disabled" : ""}
                        style={{ width: "100%", marginTop: "0.8rem" }}
                      >
                        {loading
                          ? "Opening..."
                          : !canAfford
                          ? "Insufficient Funds"
                          : `✨ Open Pack ($${pack.price})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grand Holographic Pull Celebration Modal */}
          {showAnimation && pulledCard && (
            <div
              className="card-pull-animation"
              onClick={() => setShowAnimation(false)}
            >
              <div
                className="card-pull-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#034f84", marginBottom: "0.5rem" }}>
                  🎉 NEW CREATURE UNLOCKED!
                </div>
                <div className="card-pull-emoji">{pulledCard.emoji}</div>
                <h2 style={{ color: "#034f84", marginBottom: "0.4rem" }}>
                  {pulledCard.name}
                </h2>
                <div
                  className="aero-badge"
                  style={{
                    background: pulledCard.config.gradient,
                    color: "#fff",
                    fontSize: "0.95rem",
                    padding: "0.4rem 1rem",
                    margin: "0.6rem auto",
                    display: "inline-flex",
                  }}
                >
                  {pulledCard.rarity}
                </div>
                <p style={{ color: "#475569", margin: "1rem 0" }}>
                  Added to your collection and saved to your profile!
                </p>
                <button
                  className="btn"
                  onClick={() => setShowAnimation(false)}
                  style={{ width: "100%" }}
                >
                  ✓ Collect & Continue
                </button>
              </div>
            </div>
          )}

          {/* User's Card Collection Preview */}
          <div className="card">
            <div className="window-header">
              <div className="window-dots">
                <span className="window-dot dot-red" />
                <span className="window-dot dot-yellow" />
                <span className="window-dot dot-green" />
              </div>
              <span className="window-title">🎴 Your Aquatic Collection ({cards.length})</span>
              <Link
                to="/profile"
                style={{ fontSize: "0.85rem", color: "#0284c7", fontWeight: 700, textDecoration: "none" }}
                onClick={() => playBubbleSound()}
              >
                View Full Profile →
              </Link>
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
