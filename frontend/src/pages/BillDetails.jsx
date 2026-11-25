import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { deleteBill, fetchBill, updateBillStatus } from '../store/billSlice';
import { createPaymentOrder, failPayment, verifyPayment } from '../store/paymentSlice';
import PageLoader from '../components/PageLoader';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { formatDateTime, formatINR, shortId } from '../utils/format';
import { openRazorpayCheckout } from '../utils/razorpay';

export default function BillDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, loading, error } = useSelector((state) => state.bills);
  const processing = useSelector((state) => state.payments.processing);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchBill(id));
  }, [dispatch, id]);

  async function changeStatus(status) {
    try {
      await dispatch(updateBillStatus({ id, status })).unwrap();
      toast.success(`Bill marked ${status.toLowerCase()}`);
      dispatch(fetchBill(id));
    } catch (message) {
      toast.error(message);
    }
  }

  async function pay() {
    try {
      const order = await dispatch(createPaymentOrder(id)).unwrap();
      await openRazorpayCheckout({
        order,
        onSuccess: async (response) => {
          try {
            await dispatch(verifyPayment({
              paymentId: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })).unwrap();
            toast.success('Payment verified');
            dispatch(fetchBill(id));
          } catch (message) {
            toast.error(message);
            dispatch(fetchBill(id));
          }
        },
        onFailure: async (reason) => {
          await dispatch(failPayment({ id: order.id, reason }));
          toast.error(reason);
          dispatch(fetchBill(id));
        },
        onDismiss: () => toast.info('Checkout closed'),
      });
    } catch (message) {
      toast.error(message);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await dispatch(deleteBill(id)).unwrap();
      toast.success('Bill deleted');
      navigate('/billing');
    } catch (message) {
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading && current?.id !== id) return <PageLoader label="Loading bill" />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!current) return null;

  const editable = current.status === 'PENDING' || current.status === 'FAILED';
  const payable = current.status === 'PENDING' || current.status === 'FAILED';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bill {shortId(current.id)}</h1>
          <p>{current.serviceDescription}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {payable ? (
            <button type="button" className="btn btn-teal" onClick={pay} disabled={processing}>
              {processing ? 'Opening checkout…' : 'Pay with Razorpay'}
            </button>
          ) : null}
          {editable ? <Link className="btn btn-outline-quiet" to={`/billing/${current.id}/edit`}>Edit</Link> : null}
          {current.status === 'PENDING' ? (
            <button type="button" className="btn btn-outline-quiet" onClick={() => changeStatus('FAILED')}>Mark failed</button>
          ) : null}
          {current.status === 'FAILED' || current.status === 'CANCELLED' ? (
            <button type="button" className="btn btn-outline-quiet" onClick={() => changeStatus('PENDING')}>Mark pending</button>
          ) : null}
          {current.status !== 'PAID' && current.status !== 'CANCELLED' ? (
            <button type="button" className="btn btn-outline-quiet" onClick={() => changeStatus('CANCELLED')}>Cancel bill</button>
          ) : null}
          {current.status !== 'PAID' ? (
            <button type="button" className="btn btn-outline-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          ) : null}
        </div>
      </div>

      <div className="detail-grid">
        <section className="card-surface panel">
          <h2>Summary</h2>
          <ul className="detail-list">
            <li><span>Status</span><StatusBadge value={current.status} /></li>
            <li><span>Patient</span><Link to={`/patients/${current.patient?.id}`}>{current.patient?.name}</Link></li>
            <li><span>Amount</span><strong>{formatINR(current.amount)}</strong></li>
            <li><span>Tax ({current.taxRate}%)</span><strong>{formatINR(current.taxAmount)}</strong></li>
            <li><span>Total</span><strong>{formatINR(current.total)}</strong></li>
            <li><span>Created</span><strong>{formatDateTime(current.createdAt)}</strong></li>
            <li><span>Paid at</span><strong>{formatDateTime(current.paidAt)}</strong></li>
          </ul>
        </section>
        <section className="card-surface table-card">
          <div className="p-3"><h2 className="h6 mb-0">Payment attempts</h2></div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {current.payments?.length ? current.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="small">{payment.razorpayOrderId}</td>
                    <td className="small">{payment.razorpayPaymentId || '—'}</td>
                    <td>{formatINR(payment.amount)}</td>
                    <td><StatusBadge value={payment.status} /></td>
                    <td>{formatDateTime(payment.createdAt)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="text-muted">No payment attempts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete bill"
        message="This permanently removes the bill."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
