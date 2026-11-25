export default function PageLoader({ label = 'Loading' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="spinner-border text-success" role="status" />
      <span className="mt-3 text-muted">{label}</span>
    </div>
  );
}
