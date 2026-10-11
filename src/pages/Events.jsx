import { useEffect, useState } from "react";
import api from "../api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(1);
  const [eventId, setEventId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("username");
    setUsername(saved);
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const res = await api.get("/api/events");
      setEvents(res.data);
    } catch (error) {
      setMessage("Error loading events");
    }
  }

  async function createEvent() {
    if (!name.trim() || !duration) {
      setMessage("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/events/create", {
        name,
        event_id: eventId,
        duration: parseFloat(duration),
      });
      setMessage("Event created! ✅");
      setName("");
      setEventId((prev) => prev + 1);
      loadEvents();
    } catch (error) {
      setMessage("Error creating event");
    } finally {
      setLoading(false);
    }
  }

  async function rsvpEvent(id) {
    if (!username) {
      setMessage("Please create a profile first");
      return;
    }
    try {
      await api.post(`/api/profile/${username}/rsvp/${id}`);
      setMessage("RSVP successful! ✅");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Error RSVP-ing");
    }
  }

  async function completeEvent(id) {
    if (!username) {
      setMessage("Please create a profile first");
      return;
    }
    try {
      await api.post(`/api/profile/${username}/complete/${id}`);
      setMessage("Event completed! You earned XP! ✅");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Error completing event");
    }
  }

  return (
    <div>
      <div className="card">
        <h2>📅 Create New Event</h2>
        {message && <div className="message">{message}</div>}
        <div className="stack">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event name"
          />
          <input
            type="number"
            value={eventId}
            onChange={(e) => setEventId(parseInt(e.target.value) || 1)}
            placeholder="Event ID"
          />
          <input
            type="number"
            step="0.5"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (hours)"
          />
          <button onClick={createEvent} disabled={loading}>
            {loading ? "Creating..." : "Add Event"}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Available Events ({events.length})</h2>
        {events.length === 0 ? (
          <p className="empty">No events yet. Create one!</p>
        ) : (
          <div className="grid">
            {events.map((event) => (
              <div key={event.event_id} className="event-card">
                <h4>{event.name}</h4>
                <p><strong>Duration:</strong> {event.duration}h</p>
                <p><strong>XP Reward:</strong> <span className="xp-badge">{event.xp}</span></p>
                <p><strong>Difficulty:</strong> <span className={`difficulty-${event.difficulty}`}>{event.difficulty.toUpperCase()}</span></p>
                <small>{event.description}</small>
                {username && (
                  <div className="button-group">
                    <button onClick={() => rsvpEvent(event.event_id)}>RSVP</button>
                    <button onClick={() => completeEvent(event.event_id)} className="btn-success">Complete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
