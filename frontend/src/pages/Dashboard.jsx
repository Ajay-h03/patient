import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchDashboard } from '../store/dashboardSlice';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PageLoader from '../components/PageLoader';
import { formatDate, formatINR, genderLabel } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, revenueChart, recentPatients, recentTransactions, loading, error } = useSelector(
    (state) => state.dashboard,
  );

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading && !stats) return <PageLoader label="Loading clinic summary" />;

  const chartData = {
    labels: revenueChart?.labels || [],
    datasets: [
      {
        label: `Paid revenue ${revenueChart?.year || ''}`,
        data: revenueChart?.data || [],
        backgroundColor: '#0f766e',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Live counts from patients, bills, and collected payments.</p>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <section className="stat-grid">
        <StatCard label="Total patients" value={stats?.totalPatients ?? 0} icon="bi-people" tone="icon-blue" hint="Registered records" />
        <StatCard label="Total bills" value={stats?.totalBills ?? 0} icon="bi-receipt" tone="icon-teal" hint="All billing records" />
        <StatCard label="Total revenue" value={formatINR(stats?.totalRevenue)} icon="bi-graph-up-arrow" tone="icon-green" hint="Collected on paid bills" />
        <StatCard label="Pending payments" value={formatINR(stats?.pendingPayments)} icon="bi-hourglass-split" tone="icon-amber" hint={`${stats?.pendingCount ?? 0} bills waiting`} />
      </section>

      <section className="dashboard-grid">
        <div className="card-surface panel">
          <h2>Revenue this year</h2>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { callback: (value) => `₹${value}` } } },
            }}
          />
        </div>
        <div className="card-surface panel">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h2 className="mb-0">Recent patients</h2>
            <Link to="/patients">View all</Link>
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <tbody>
                {recentPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <Link to={`/patients/${patient.id}`} className="fw-semibold">{patient.name}</Link>
                      <div className="small text-muted">{genderLabel(patient.gender)} · {patient.age} yrs</div>
                    </td>
                    <td className="text-end text-muted small">{formatDate(patient.createdAt)}</td>
                  </tr>
                ))}
                {recentPatients.length === 0 ? (
                  <tr><td className="text-muted">No patients yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card-surface panel mt-3">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Recent transactions</h2>
          <Link to="/billing">Open billing</Link>
        </div>
        <div className="table-responsive mt-2">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Service</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((bill) => (
                <tr key={bill.id}>
                  <td>{bill.patient?.name}</td>
                  <td>{bill.serviceDescription}</td>
                  <td>{formatINR(bill.total)}</td>
                  <td><StatusBadge value={bill.status} /></td>
                  <td>{formatDate(bill.createdAt)}</td>
                </tr>
              ))}
              {recentTransactions.length === 0 ? (
                <tr><td colSpan="5" className="text-muted">No bills yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
