import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { playBubbleSound, playChimeSound } from "../utils/soundHelper";

const EVENT_PRESETS = [
  { name: "🌊 Campus Stream & Pond Cleanup", duration: 2.5 },
  { name: "🌳 Fetzer Native Tree Planting", duration: 2.0 },
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
  const [nearbyOpportunities, setNearbyOpportunities] = useState([]);
  const [nearbyLocation, setNearbyLocation] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyMessage, setNearbyMessage] = useState("");

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

  async function findNearbyOpportunities() {
    if (!navigator.geolocation) {
      setNearbyMessage("Location access is not available in this browser.");
      return;
    }
    setNearbyLoading(true);
    setNearbyMessage("Getting your location and searching nearby volunteer listings...");
    setNearbyOpportunities([]);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000,
        });
      });
      const { latitude, longitude } = position.coords;
      const result = await api.post("/api/opportunities/nearby", {
        latitude,
        longitude,
        radius_km: 25,
      }, { timeout: 180000 });
      setNearbyOpportunities(result.data.opportunities || []);
      setNearbyLocation(result.data.location);
      setNearbyMessage(
        result.data.opportunities?.length
          ? `Found ${result.data.opportunities.length} volunteer listing(s) near ${result.data.location?.city || "you"}.`
          : `No listings were found near ${result.data.location?.city || "you"}. Try again later or check local organizations directly.`
      );
    } catch (error) {
      const detail = error.response?.data?.detail;
      const geoError = error.code;
      setNearbyMessage(
        detail || (geoError === 1
          ? "Location permission was denied. Allow location access in your browser and try again."
          : geoError === 3
            ? "Your location took too long to load. Please try again."
            : "Could not find nearby listings. Check your connection and try again.")
      );
    } finally {
      setNearbyLoading(false);
    }
  }

  const isRsvped = (id) => userProfile?.rsvped_events?.includes(id);
  const isCompleted = (id) => userProfile?.completed_events?.includes(id);

  return (
    <div>
      {/* Event Creator Window */}
      <div className="card">
        <div className="window-header">
          <span className="window-title">
            <span>🌱</span>
            <span>Task Manager - Create Volunteer Event Wizard</span>
          </span>
          <div className="window-dots">
            <span className="xp-btn-ctrl xp-btn-min">_</span>
            <span className="xp-btn-ctrl xp-btn-max">□</span>
            <span className="xp-btn-ctrl xp-btn-close">✕</span>
          </div>
        </div>

        {message && <div className="message">{message}</div>}

        <fieldset className="xp-groupbox">
          <legend className="xp-legend">Event Templates</legend>
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

          <div className="stack" style={{ marginTop: "10px" }}>
            <div className="form-row">
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#003c74", marginBottom: "3px" }}>
                  Event Name:
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Campus Stream Cleanup"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#003c74", marginBottom: "3px" }}>
                  Event ID:
                </label>
                <input
                  type="number"
                  value={eventId}
                  onChange={(e) => setEventId(parseInt(e.target.value, 10) || 1)}
                  placeholder="Unique ID"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#003c74", marginBottom: "3px" }}>
                  Duration (Hours):
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

            <button
              onClick={createEvent}
              disabled={loading}
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", marginTop: "4px" }}
            >
              {loading ? "Adding Event..." : "Add to Calendar"}
            </button>
          </div>
        </fieldset>
      </div>

      {/* Available Events Listing Window */}
      <div className="card">
        <div className="window-header">
          <span className="window-title">
            <span>📅</span>
            <span>Campus Volunteer Opportunities ({events.length})</span>
          </span>
          <div className="window-dots">
            <span className="xp-btn-ctrl xp-btn-min">_</span>
            <span className="xp-btn-ctrl xp-btn-max">□</span>
            <span className="xp-btn-ctrl xp-btn-close">✕</span>
          </div>
        </div>

        {!username && (
          <div style={{ marginBottom: "10px", padding: "6px 10px", background: "#fff", border: "1px solid #7f9db9" }}>
            <span>💡 <strong>Tip:</strong> </span>
            <Link to="/profile" style={{ color: "#0055ea", fontWeight: "bold" }}>
              Log on or create your profile
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
                      <span className="aero-badge">
                        ⏱️ {event.duration}h
                      </span>
                      <span className="aero-badge xp-badge">
                        ⭐ +{event.xp} XP
                      </span>
                      <span className={`aero-badge difficulty-${event.difficulty}`}>
                        {event.difficulty.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ fontSize: "11px", color: "#444", margin: "6px 0", lineHeight: "1.4" }}>
                      {event.description}
                    </p>
                  </div>

                  <div>
                    {completed ? (
                      <div
                        style={{
                          background: "#e6f9e6",
                          color: "#1a571a",
                          padding: "4px 8px",
                          borderRadius: "2px",
                          fontWeight: "bold",
                          fontSize: "10px",
                          textAlign: "center",
                          border: "1px solid #52a652",
                        }}
                      >
                        ✓ Completed & XP Awarded!
                      </div>
                    ) : username ? (
                      <div className="button-group">
                        {!rsvped ? (
                          <button
                            onClick={() => rsvpEvent(event.event_id)}
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                          >
                            RSVP
                          </button>
                        ) : (
                          <button
                            onClick={() => completeEvent(event.event_id)}
                            className="btn btn-success"
                            style={{ flex: 1 }}
                          >
                            Mark Complete (+{event.xp} XP)
                          </button>
                        )}
                      </div>
                    ) : (
                      <Link
                        to="/profile"
                        className="btn"
                        style={{ width: "100%" }}
                        onClick={() => playBubbleSound()}
                      >
                        Log on to Join
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="window-header">
          <span className="window-title">
            <span>📍</span>
            <span>Volunteer Finder - Opportunities Near You</span>
          </span>
          <div className="window-dots">
            <span className="xp-btn-ctrl xp-btn-min">_</span>
            <span className="xp-btn-ctrl xp-btn-max">□</span>
            <span className="xp-btn-ctrl xp-btn-close">✕</span>
          </div>
        </div>
        <p style={{ marginBottom: "8px", color: "#333" }}>
          Search local volunteer organizations and event listings within about 25 km. Your browser will ask before sharing your location.
        </p>
        <button className="btn btn-primary" onClick={findNearbyOpportunities} disabled={nearbyLoading}>
          {nearbyLoading ? "Searching nearby..." : "📍 Find Events Near Me"}
        </button>
        {nearbyMessage && <div className="message" role="status" style={{ marginTop: "8px" }}>{nearbyMessage}</div>}
        {nearbyLocation && nearbyOpportunities.length > 0 && (
          <div className="grid" style={{ marginTop: "12px" }}>
            {nearbyOpportunities.map((opportunity, index) => (
              <article className="event-card" key={`${opportunity.title}-${opportunity.date || "ongoing"}-${index}`}>
                <div>
                  <h4>{opportunity.title}</h4>
                  <div className="event-meta">
                    <span className="aero-badge">{opportunity.org}</span>
                    {opportunity.date && <span className="aero-badge">📅 {opportunity.date}{opportunity.time ? ` · ${opportunity.time}` : ""}</span>}
                    {opportunity.schedule && <span className="aero-badge">{opportunity.schedule}</span>}
                  </div>
                  {(opportunity.location || opportunity.org_address) && (
                    <p style={{ fontSize: "11px", color: "#444", margin: "6px 0" }}>
                      📍 {opportunity.location || opportunity.org_address}
                    </p>
                  )}
                  {opportunity.description && <p style={{ fontSize: "11px", color: "#444", margin: "6px 0", lineHeight: "1.4" }}>{opportunity.description}</p>}
                  <p style={{ fontSize: "10px", color: "#555" }}>{opportunity.category}</p>
                </div>
                {/^https?:\/\//i.test(opportunity.link || "") && (
                  <a className="btn btn-primary" href={opportunity.link} target="_blank" rel="noreferrer">
                    Details & Sign Up ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
        {nearbyLocation && nearbyOpportunities.length === 0 && !nearbyLoading && (
          <p style={{ marginTop: "8px", fontSize: "11px", color: "#555" }}>
            The finder scanned nearby organization websites. Listings may be missing when a site blocks automated access or loads events dynamically.
          </p>
        )}
      </div>
    </div>
  );
}
