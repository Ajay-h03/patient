import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatient } from '../store/patientSlice';
import PageLoader from '../components/PageLoader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { formatDate, formatINR, genderLabel } from '../utils/format';

export default function PatientDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, loading, error } = useSelector((state) => state.patients);

  useEffect(() => {
    dispatch(fetchPatient(id));
  }, [dispatch, id]);

  if (loading && current?.id !== id) return <PageLoader label="Loading patient" />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!current) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{current.name}</h1>
          <p>Patient profile and related bills.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/billing/new?patientId=${current.id}`} className="btn btn-teal">Create bill</Link>
          <Link to={`/patients/${current.id}/edit`} className="btn btn-outline-quiet">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <section className="card-surface panel">
          <h2>Profile</h2>
          <ul className="detail-list">
            <li><span>Age</span><strong>{current.age}</strong></li>
            <li><span>Gender</span><strong>{genderLabel(current.gender)}</strong></li>
            <li><span>Phone</span><strong>{current.phone}</strong></li>
            <li><span>Email</span><strong>{current.email}</strong></li>
            <li><span>Address</span><strong className="text-end">{current.address}</strong></li>
            <li><span>Added</span><strong>{formatDate(current.createdAt)}</strong></li>
          </ul>
        </section>
        <section className="card-surface table-card">
          <div className="p-3 d-flex justify-content-between">
            <h2 className="h6 mb-0">Bills</h2>
          </div>
          {current.bills?.length ? (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {current.bills.map((bill) => (
                    <tr key={bill.id}>
                      <td><Link to={`/billing/${bill.id}`}>{bill.serviceDescription}</Link></td>
                      <td>{formatINR(bill.total)}</td>
                      <td><StatusBadge value={bill.status} /></td>
                      <td>{formatDate(bill.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="bi-receipt" title="No bills yet" text="Create a bill when this patient receives a service." />
          )}
        </section>
      </div>
    </div>
  );
}
