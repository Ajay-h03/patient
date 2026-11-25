import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPayments } from '../store/paymentSlice';
import PaginationBar from '../components/PaginationBar';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatINR } from '../utils/format';

export default function Payments() {
  const dispatch = useDispatch();
  const { items, meta, loading, error } = useSelector((state) => state.payments);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchPayments({
        search: search.trim() || undefined,
        status: status || undefined,
        page,
        limit: 8,
      }));
    }, 250);
    return () => clearTimeout(handle);
  }, [dispatch, search, status, page]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payment history</h1>
          <p>Razorpay orders, verified payments, and failed attempts.</p>
        </div>
      </div>
      <div className="filters">
        <input
          className="form-control"
          placeholder="Search by patient name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="form-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="CREATED">Created</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="card-surface table-card">
        {loading ? <PageLoader label="Loading payments" /> : null}
        {!loading && error ? <div className="alert alert-danger m-3">{error}</div> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState icon="bi-credit-card" title="No payments yet" text="Payments appear here after a Razorpay order is created." />
        ) : null}
        {!loading && items.length > 0 ? (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Bill</th>
                  <th>Order</th>
                  <th>Payment id</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((payment) => (
                  <tr key={payment.id}>
                    <td className="fw-semibold">{payment.bill?.patient?.name}</td>
                    <td><Link to={`/billing/${payment.billId}`}>{payment.bill?.serviceDescription}</Link></td>
                    <td className="small">{payment.razorpayOrderId}</td>
                    <td className="small">{payment.razorpayPaymentId || '—'}</td>
                    <td>{formatINR(payment.amount)}</td>
                    <td>
                      <StatusBadge value={payment.status} />
                      {payment.failureReason ? <div className="small text-muted">{payment.failureReason}</div> : null}
                    </td>
                    <td>{formatDateTime(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <PaginationBar page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPage={setPage} />
      </div>
    </div>
  );
}
