import Link from 'next/link';

export default function RoutinesPage() {
  return (
    <main style={{ padding: '2rem' }}>
      <header className="header" style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 'bold' }}>&larr; Back to Planner</Link>
        <h1 style={{ marginTop: '1rem' }}>My Routines</h1>
        <p>Manage your recurring daily routines.</p>
      </header>

      <section className="glass-panel">
        <p style={{ opacity: 0.7 }}>Routine configuration coming soon! (This is the placeholder for Sprint 4).</p>
      </section>
    </main>
  );
}
