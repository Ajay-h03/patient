export default function StatCard({ label, value, hint, icon, tone }) {
  return (
    <article className="card-surface stat-card">
      <div className="d-flex justify-content-between align-items-start">
        <span>{label}</span>
        <div className={`icon-bubble ${tone}`}>
          <i className={`bi ${icon}`} />
        </div>
      </div>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}
