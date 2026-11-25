import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { deleteBill, fetchBills } from '../store/billSlice';
import PaginationBar from '../components/PaginationBar';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatINR } from '../utils/format';

export default function Bills() {
  const dispatch = useDispatch();
  const { items, meta, loading, error } = useSelector((state) => state.bills);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchBills({
        search: search.trim() || undefined,
        status: status || undefined,
        page,
        limit: 8,
      }));
    }, 250);
    return () => clearTimeout(handle);
  }, [dispatch, search, status, page]);

  async function confirmDelete() {
    setBusy(true);
    try {
      await dispatch(deleteBill(pendingDelete.id)).unwrap();
      toast.success('Bill deleted');
      setPendingDelete(null);
      dispatch(fetchBills({ search: search.trim() || undefined, status: status || undefined, page, limit: 8 }));
    } catch (message) {
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p>Create bills, track status, and open a record to collect payment.</p>
        </div>
        <Link to="/billing/new" className="btn btn-teal">Create bill</Link>
      </div>

      <div className="filters">
        <input
          className="form-control"
          placeholder="Search patient or service"
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
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card-surface table-card">
        {loading ? <PageLoader label="Loading bills" /> : null}
        {!loading && error ? <div className="alert alert-danger m-3">{error}</div> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState icon="bi-receipt" title="No bills found" text="Create a bill for a patient visit or service." />
        ) : null}
        {!loading && items.length > 0 ? (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((bill) => (
                  <tr key={bill.id}>
                    <td className="fw-semibold">{bill.patient?.name}</td>
                    <td>{bill.serviceDescription}</td>
                    <td>{formatINR(bill.amount)}</td>
                    <td>{formatINR(bill.taxAmount)}</td>
                    <td>{formatINR(bill.total)}</td>
                    <td><StatusBadge value={bill.status} /></td>
                    <td>{formatDate(bill.createdAt)}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <Link className="icon-btn" to={`/billing/${bill.id}`} title="View"><i className="bi bi-eye" /></Link>
                        {bill.status === 'PENDING' || bill.status === 'FAILED' ? (
                          <Link className="icon-btn" to={`/billing/${bill.id}/edit`} title="Edit"><i className="bi bi-pencil" /></Link>
                        ) : null}
                        {bill.status !== 'PAID' ? (
                          <button type="button" className="icon-btn danger" title="Delete" onClick={() => setPendingDelete(bill)}>
                            <i className="bi bi-trash" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <PaginationBar page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPage={setPage} />
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete bill"
        message="This removes the bill and any unfinished payment attempts."
        confirmLabel="Delete bill"
        danger
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
