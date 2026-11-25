import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { logout } from '../store/authSlice';

const titles = {
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/patients/new': 'Add patient',
  '/billing': 'Billing',
  '/billing/new': 'Create bill',
  '/payments': 'Payment history',
};

function titleFor(pathname) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.includes('/edit') && pathname.startsWith('/patients')) return 'Edit patient';
  if (pathname.includes('/edit') && pathname.startsWith('/billing')) return 'Edit bill';
  if (pathname.startsWith('/patients/')) return 'Patient details';
  if (pathname.startsWith('/billing/')) return 'Bill details';
  return 'MediCore';
}

export default function Layout() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <Sidebar open={open} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
      <div className="main-wrap">
        <Topbar title={titleFor(location.pathname)} user={user} onMenu={() => setOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
