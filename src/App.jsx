import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import Shop from "./pages/Shop";

const companionMessages = [
  "I believe in you — tiny eco actions add up!",
  "Let's find a volunteer event and make campus greener.",
  "Every sustainable choice counts.",
  "You've got this — keep building a better world.",
  "Small steps today create a cleaner tomorrow."
];

export default function App() {
  const [speechOpen, setSpeechOpen] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const handleCompanionClick = () => {
    setSpeechOpen(true);
    setMessageIndex((prev) => (prev + 1) % companionMessages.length);
    setTimeout(() => setSpeechOpen(false), 4000);
  };

  return (
    <Router>
      <nav className="nav">
        <div className="nav-inner">
          <div className="logo">🐬 HackNC 2026</div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/events">Events</Link>
            <Link to="/shop">Shop</Link>
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/shop" element={<Shop />} />
        </Routes>
      </main>

      <div className="companion-container">
        {speechOpen && (
          <div className="companion-speech">
            {companionMessages[messageIndex]}
          </div>
        )}
        <div
          className="companion"
          onClick={handleCompanionClick}
          aria-label="Delphin companion"
          title="Talk to Delphin"
        >
          🐬
        </div>
      </div>
    </Router>
  );
}
