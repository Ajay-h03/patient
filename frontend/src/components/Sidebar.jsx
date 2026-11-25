import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: 'bi-grid-1x2', end: true },
  { to: '/patients', label: 'Patients', icon: 'bi-people' },
  { to: '/billing', label: 'Billing', icon: 'bi-receipt' },
  { to: '/payments', label: 'Payments', icon: 'bi-credit-card' },
];

export default function Sidebar({ open, onNavigate, onLogout }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <strong>MediCore</strong>
          <small>PATIENT CARE</small>
        </div>
      </div>
      <nav className="side-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <i className={`bi ${link.icon}`} />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="logout-btn" onClick={onLogout}>
          <i className="bi bi-box-arrow-right me-2" />
          Log out
        </button>
      </div>
    </aside>
  );
}
