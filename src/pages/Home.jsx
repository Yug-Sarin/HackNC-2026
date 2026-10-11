export default function Home() {
  return (
    <div>
      <div className="card hero-card">
        <h1>🌍 Campus Sustainability Hub</h1>
        <p className="subtitle">
          Discover volunteer opportunities, earn XP, open card packs, and talk to your dolphin companion while helping the environment.
        </p>
      </div>

      <div className="grid features-grid">
        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>Volunteer Finder</h3>
          <p>Search for local opportunities and community actions.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⭐</div>
          <h3>XP System</h3>
          <p>Earn XP from completed events and become more active.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎴</div>
          <h3>Card Packs</h3>
          <p>Collect rare cards by spending in-game money.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🐬</div>
          <h3>Delphin</h3>
          <p>Get playful motivation to keep doing good work.</p>
        </div>
      </div>

      <div className="card how-it-works">
        <h2>How it works</h2>
        <div className="steps-container">
          {[
            { num: 1, text: "Create a profile." },
            { num: 2, text: "Browse or create events." },
            { num: 3, text: "RSVP and complete events to earn XP." },
            { num: 4, text: "Buy card packs with your money." },
            { num: 5, text: "Chat with Delphin for encouragement." },
          ].map((step) => (
            <div key={step.num} className="step">
              <div className="step-number">{step.num}</div>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
