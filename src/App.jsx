import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import Shop from "./pages/Shop";
import Delphin from "./pages/Delphin";

export default function App() {
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
            <Link to="/delphin">Delphin</Link>
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
    </Router>
  );
}
