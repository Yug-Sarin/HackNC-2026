import { useState, useEffect } from "react";
import axios from "axios";

export default function Shop() {
  const [username, setUsername] = useState(null);
  const [cards, setCards] = useState([]);
  const [money, setMoney] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const packs = [
    { type: "basic", name: "🐟 Basic Pack", price: 10, description: "Common creatures" },
    { type: "premium", name: "🦈 Premium Pack", price: 25, description: "Rare creatures" },
    { type: "legendary", name: "👑 Legendary Pack", price: 50, description: "Epic & Legendary" },
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
      const moneyRes = await axios.get(`/api/profile/${name}/money`);
      setMoney(moneyRes.data.money);
      const cardsRes = await axios.get(`/api/profile/${name}/cards`);
      setCards(cardsRes.data.cards);
    } catch (error) {
      setMessage("Error loading data");
    }
  }

  async function buyPack(packType) {
    if (!username) return;
    setLoading(true);
    try {
      const res = await axios.post(`/api/shop/buy-pack/${username}`, { pack_type: packType });
      if (res.data.success) {
        setMessage(`You got: ${res.data.card_gained}! 🎉`);
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
                <div key={pack.type} className="pack-card">
                  <h4>{pack.name}</h4>
                  <p>{pack.description}</p>
                  <p className="price">${pack.price}</p>
                  <button
                    onClick={() => buyPack(pack.type)}
                    disabled={money < pack.price || loading}
                    className={money < pack.price ? "btn-disabled" : ""}
                  >
                    {money < pack.price ? "Not Enough $" : "Buy Pack"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>🎴 Your Collection ({cards.length})</h2>
            {cards.length === 0 ? (
              <p className="empty">No cards yet. Buy a pack!</p>
            ) : (
              <div className="grid">
                {cards.map((card, idx) => (
                  <div key={idx} className="card-item">{card}</div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
