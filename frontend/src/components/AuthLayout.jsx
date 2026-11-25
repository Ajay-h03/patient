export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="brand mb-4">
          <div className="brand-mark">M</div>
          <div>
            <strong>MediCore</strong>
            <small>PATIENT CARE</small>
          </div>
        </div>
        <h1>A calmer way to run the clinic day.</h1>
        <ul className="auth-points">
          <li><i className="bi bi-check2-circle me-2" /> Patient records with search and filters</li>
          <li><i className="bi bi-check2-circle me-2" /> Bills with automatic tax totals</li>
          <li><i className="bi bi-check2-circle me-2" /> Razorpay test checkout and payment history</li>
        </ul>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="text-muted">{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
