export default function Home() {
  return (
    <div className="card">
      <h1>🌍 Campus Sustainability Hub</h1>
      <p className="subtitle">
        Discover volunteer opportunities, earn XP, open card packs, and talk to your dolphin companion while helping the environment.
      </p>

      <div className="grid">
        <div className="feature-card">
          <h3>📅 Volunteer Finder</h3>
          <p>Search for local opportunities and community actions.</p>
        </div>
        <div className="feature-card">
          <h3>⭐ XP System</h3>
          <p>Earn XP from completed events and become more active.</p>
        </div>
        <div className="feature-card">
          <h3>🎴 Card Packs</h3>
          <p>Collect rare cards by spending in-game money.</p>
        </div>
        <div className="feature-card">
          <h3>🐬 Delphin</h3>
          <p>Get playful motivation to keep doing good work.</p>
        </div>
      </div>

      <div className="card-content">
        <h2>How it works</h2>
        <ol>
          <li>Create a profile.</li>
          <li>Browse or create events.</li>
          <li>RSVP and complete events to earn XP.</li>
          <li>Buy card packs with your money.</li>
          <li>Chat with Delphin for encouragement.</li>
        </ol>
      </div>
    </div>
  );
}
