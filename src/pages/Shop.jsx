import { useState, useEffect } from "react";
import api from "../api";

const cardEmojis = {
  "🐟": { rarity: "common", color: "#86efac" },
  "🐠": { rarity: "common", color: "#86efac" },
  "🦑": { rarity: "uncommon", color: "#5ac8fa" },
  "🦈": { rarity: "rare", color: "#f59e0b" },
  "🐙": { rarity: "rare", color: "#f59e0b" },
  "🦐": { rarity: "common", color: "#86efac" },
  "🦞": { rarity: "uncommon", color: "#5ac8fa" },
  "🐚": { rarity: "uncommon", color: "#5ac8fa" },
  "👑": { rarity: "legendary", color: "#ff3b30" },
};

export default function Shop() {
  const [username, setUsername] = useState(null);
  const [cards, setCards] = useState([]);
  const [money, setMoney] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pulledCard, setPulledCard] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const packs = [
    { type: "basic", name: "🐟 Basic Pack", price: 10, description: "Common creatures", color: "#86efac" },
    { type: "premium", name: "🦈 Premium Pack", price: 25, description: "Rare creatures", color: "#5ac8fa" },
    { type: "legendary", name: "👑 Legendary Pack", price: 50, description: "Epic & Legendary", color: "#ff3b30" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("username");
    if (saved) {
      setUsername(saved);
      loadUserData(saved);
    }
  }, []);

  async function loadUserData(name) {
    try {
      const moneyRes = await api.get(`/api/profile/${name}/money`);
      setMoney(moneyRes.data.money);
      const cardsRes = await api.get(`/api/profile/${name}/cards`);
      setCards(cardsRes.data.cards);
    } catch (error) {
      setMessage("Error loading data");
    }
  }

  async function buyPack(packType) {
    if (!username) return;
    setLoading(true);
    setShowAnimation(false);
    try {
      const res = await api.post(`/api/shop/buy-pack/${username}`, { pack_type: packType });
      if (res.data.success) {
        setPulledCard(res.data.card_gained);
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 3000);
        setMessage(`You pulled: ${res.data.card_gained}! 🎉`);
        setMoney(res.data.money_remaining);
        setCards(res.data.cards);
      } else {
        setMessage(res.data.message);
      }
    } catch (error) {
      setMessage("Error buying pack");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!username ? (
        <div className="card">
          <p className="empty">Please create a profile first to shop!</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h2>🛍️ Card Shop</h2>
            {message && <div className="message">{message}</div>}
            <p className="money">💰 Your Money: <strong>${money.toFixed(2)}</strong></p>
            <div className="grid">
              {packs.map((pack) => (
                <div key={pack.type} className="pack-card" style={{ borderColor: pack.color }}>
                  <h4>{pack.name}</h4>
                  <p>{pack.description}</p>
                  <p className="price">${pack.price}</p>
                  <button
                    onClick={() => buyPack(pack.type)}
                    disabled={money < pack.price || loading}
                    className={money < pack.price ? "btn-disabled" : ""}
                  >
                    {loading ? "Opening..." : "Buy Pack"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {showAnimation && pulledCard && (
            <div className="card-pull-animation">
              <div className="card-pull-container">
                <div className="card-pull-emoji">{pulledCard}</div>
                <p>You got a rare card!</p>
              </div>
            </div>
          )}

          <div className="card">
            <h2>🎴 Your Collection ({cards.length})</h2>
            {cards.length === 0 ? (
              <p className="empty">No cards yet. Buy a pack!</p>
            ) : (
              <div className="cards-grid">
                {cards.map((card, idx) => {
                  const cardInfo = cardEmojis[card] || { rarity: "unknown", color: "#888" };
                  return (
                    <div key={idx} className="card-display" style={{ borderColor: cardInfo.color }}>
                      <div className="card-emoji">{card}</div>
                      <div className="card-rarity">{cardInfo.rarity}</div>
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
