import { initials } from '../utils/format';

export default function Topbar({ title, user, onMenu }) {
  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-2">
        <button type="button" className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
          <i className="bi bi-list" />
        </button>
        <div>
          <div className="fw-semibold">{title}</div>
          <small className="text-muted">Clinic operations</small>
        </div>
      </div>
      <div className="user-chip">
        <div className="text-end d-none d-sm-block">
          <div className="fw-semibold">{user?.name}</div>
          <small className="text-muted">{user?.email}</small>
        </div>
        <div className="avatar" aria-hidden="true">{initials(user?.name)}</div>
      </div>
    </header>
  );
}
