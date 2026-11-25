export default function EmptyState({ icon = 'bi-inbox', title, text }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} />
      <h3 className="h6 mt-3 text-dark">{title}</h3>
      <p className="mb-0">{text}</p>
    </div>
  );
}
