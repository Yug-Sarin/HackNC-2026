import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { playBubbleSound, playChimeSound } from "../utils/soundHelper";

const EVENT_PRESETS = [
  { name: "🌊 Campus Stream & Pond Cleanup", duration: 2.5 },
  { name: "🌳 Native Trees & Garden Planting", duration: 2.0 },
  { name: "🍱 Dining Hall Surplus Food Rescue", duration: 1.0 },
  { name: "🔋 Student E-Waste Recycling Drive", duration: 1.5 },
  { name: "☀️ Campus Solar Array Maintenance", duration: 3.5 },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(1.5);
  const [eventId, setEventId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("username");
    setUsername(saved);
    if (saved) {
      loadUserProfile(saved);
    }
    loadEvents();
  }, []);

  async function loadUserProfile(name) {
    try {
      const res = await api.get(`/api/profile/${name}`);
      setUserProfile(res.data);
    } catch {
      // User profile may not exist yet
    }
  }

  async function loadEvents() {
    try {
      const res = await api.get("/api/events");
      setEvents(res.data);
      // Determine next available event ID
      if (res.data.length > 0) {
        const maxId = Math.max(...res.data.map((e) => e.event_id || 0));
        setEventId(maxId + 1);
      }
    } catch {
      setMessage("Error connecting to backend API. Please make sure the server is running!");
    }
  }

  const applyPreset = (preset) => {
    playBubbleSound();
    setName(preset.name);
    setDuration(preset.duration);
  };

  async function createEvent() {
    if (!name.trim() || !duration) {
      setMessage("Please fill in event name and duration");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/events/create", {
        name: name.trim(),
        event_id: parseInt(eventId, 10),
        duration: parseFloat(duration),
      });
      setMessage(`Event "${name}" created successfully! 🌟`);
      setName("");
      setDuration(1.5);
      setEventId((prev) => prev + 1);
      playBubbleSound();
      loadEvents();
    } catch {
      setMessage("Error creating event");
    } finally {
      setLoading(false);
    }
  }

  async function rsvpEvent(id) {
    if (!username) {
      setMessage("Please create or sign into a profile first!");
      return;
    }
    try {
      const res = await api.post(`/api/profile/${username}/rsvp/${id}`);
      setMessage(res.data.message || "RSVP successful! 📅");
      playBubbleSound();
      loadUserProfile(username);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Error RSVP-ing to event");
    }
  }

  async function completeEvent(id) {
    if (!username) {
      setMessage("Please create or sign into a profile first!");
      return;
    }
    try {
      const res = await api.post(`/api/profile/${username}/complete/${id}`);
      setMessage(res.data.message || "Event completed! You earned XP! 🎉");
      playChimeSound();
      loadUserProfile(username);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Error completing event");
    }
  }

  const isRsvped = (id) => userProfile?.rsvped_events?.includes(id);
  const isCompleted = (id) => userProfile?.completed_events?.includes(id);

  return (
    <div>
      {/* Create New Event Window */}
      <div className="card">
        <div className="window-header">
          <div className="window-dots">
            <span className="window-dot dot-red" />
            <span className="window-dot dot-yellow" />
            <span className="window-dot dot-green" />
          </div>
          <span className="window-title">🌱 Event Creator • Campus Sustainability</span>
          <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 700 }}>Host Action</span>
        </div>

        {message && <div className="message">{message}</div>}

        <p style={{ marginBottom: "0.8rem", color: "#0f4c6e", fontWeight: 600 }}>
          Quick-select a campus sustainability template or configure your own initiative:
        </p>

        <div className="template-pills">
          {EVENT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              className="template-pill"
              onClick={() => applyPreset(preset)}
              type="button"
            >
              + {preset.name}
            </button>
          ))}
        </div>

        <div className="stack">
          <div className="form-row">
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#034f84", marginBottom: "0.3rem" }}>
                Event Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Campus Stream Cleanup"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#034f84", marginBottom: "0.3rem" }}>
                Event ID
              </label>
              <input
                type="number"
                value={eventId}
                onChange={(e) => setEventId(parseInt(e.target.value, 10) || 1)}
                placeholder="Unique ID"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#034f84", marginBottom: "0.3rem" }}>
                Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2.0"
              />
            </div>
          </div>

          <button onClick={createEvent} disabled={loading} style={{ alignSelf: "flex-start" }}>
            {loading ? "Adding to Campus Hub..." : "✨ Publish Event"}
          </button>
        </div>
      </div>

      {/* Available Events Listing Window */}
      <div className="card">
        <div className="window-header">
          <div className="window-dots">
            <span className="window-dot dot-red" />
            <span className="window-dot dot-yellow" />
            <span className="window-dot dot-green" />
          </div>
          <span className="window-title">📅 Campus Volunteer Opportunities ({events.length})</span>
          <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700 }}>
            {username ? `Signed in as ${username}` : "Sign in to RSVP"}
          </span>
        </div>

        {!username && (
          <div style={{ marginBottom: "1.2rem", padding: "0.8rem 1.2rem", borderRadius: "12px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <span>💡 <strong>Tip:</strong> </span>
            <Link to="/profile" style={{ color: "#0284c7", fontWeight: 700 }}>
              Create or sign into your profile
            </Link>{" "}
            to RSVP and earn sustainability XP!
          </div>
        )}

        {events.length === 0 ? (
          <div className="empty">
            <p>No active campus events yet. Create the first one above!</p>
          </div>
        ) : (
          <div className="grid">
            {events.map((event) => {
              const completed = isCompleted(event.event_id);
              const rsvped = isRsvped(event.event_id);

              return (
                <div key={event.event_id} className="event-card">
                  <div>
                    <h4>{event.name}</h4>

                    <div className="event-meta">
                      <span className="aero-badge" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
                        ⏱️ {event.duration}h
                      </span>
                      <span className="aero-badge xp-badge">
                        ⭐ +{event.xp} XP
                      </span>
                      <span className={`aero-badge difficulty-${event.difficulty}`}>
                        {event.difficulty.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.88rem", color: "#334155", margin: "0.6rem 0", lineHeight: "1.4" }}>
                      {event.description}
                    </p>
                  </div>

                  <div>
                    {completed ? (
                      <div
                        style={{
                          background: "linear-gradient(180deg, #dcfce7 0%, #86efac 100%)",
                          color: "#166534",
                          padding: "0.45rem 0.8rem",
                          borderRadius: "10px",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          textAlign: "center",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        ✓ Completed & XP Awarded!
                      </div>
                    ) : username ? (
                      <div className="button-group">
                        {!rsvped ? (
                          <button
                            onClick={() => rsvpEvent(event.event_id)}
                            style={{ flex: 1 }}
                          >
                            📅 RSVP
                          </button>
                        ) : (
                          <button
                            onClick={() => completeEvent(event.event_id)}
                            className="btn-success"
                            style={{ flex: 1 }}
                          >
                            🏆 Mark Complete (+{event.xp} XP)
                          </button>
                        )}
                      </div>
                    ) : (
                      <Link
                        to="/profile"
                        className="btn btn-secondary"
                        style={{ width: "100%" }}
                        onClick={() => playBubbleSound()}
                      >
                        Sign in to Join
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
