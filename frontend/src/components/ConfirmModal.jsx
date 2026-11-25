export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0" style={{ borderRadius: 18 }}>
            <div className="modal-header border-0 pb-0">
              <h2 className="modal-title h5">{title}</h2>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body text-secondary">{message}</div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-outline-quiet" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${danger ? 'btn-danger' : 'btn-teal'}`}
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? 'Please wait…' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
