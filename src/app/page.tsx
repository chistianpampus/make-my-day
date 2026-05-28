export default function Home() {
  return (
    <main>
      <header className="header">
        <h1>Make My Day</h1>
        <p>Your Voice-Controlled Daily Planner</p>
      </header>

      <section className="glass-panel schedule-container">
        <div className="task">
          <span className="time">09:00</span>
          <span className="title">Morning Routine</span>
        </div>
        <div className="task blocked">
          <span className="time">10:00</span>
          <span className="title">Project Sync (Google Calendar)</span>
        </div>
        <div className="task">
          <span className="time">11:00</span>
          <span className="title">Install lawnmower</span>
        </div>
      </section>

      <button className="mic-button" aria-label="Add voice task">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>
    </main>
  );
}
