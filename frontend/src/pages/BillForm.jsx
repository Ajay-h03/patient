import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { createBill, fetchBill, updateBill } from '../store/billSlice';
import { fetchPatientOptions } from '../store/patientSlice';
import { validateBill } from '../utils/validators';
import { calculateTotals, formatINR } from '../utils/format';
import PageLoader from '../components/PageLoader';

const empty = { patientId: '', serviceDescription: '', amount: '', taxRate: '18' };

export default function BillForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const saving = useSelector((state) => state.bills.saving);
  const options = useSelector((state) => state.patients.options);
  const [patientQuery, setPatientQuery] = useState('');
  const [values, setValues] = useState({ ...empty, patientId: searchParams.get('patientId') || '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchPatientOptions(patientQuery.trim()));
    }, 250);
    return () => clearTimeout(handle);
  }, [dispatch, patientQuery]);

  useEffect(() => {
    if (!editing) return undefined;
    let active = true;
    dispatch(fetchBill(id))
      .unwrap()
      .then((bill) => {
        if (!active) return;
        if (bill.status === 'PAID' || bill.status === 'CANCELLED') {
          toast.error('This bill can no longer be edited');
          navigate(`/billing/${bill.id}`);
          return;
        }
        setValues({
          patientId: bill.patientId,
          serviceDescription: bill.serviceDescription,
          amount: String(bill.amount),
          taxRate: String(bill.taxRate),
        });
        setPatientQuery(bill.patient?.name || '');
      })
      .catch((message) => toast.error(message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch, editing, id, navigate]);

  const totals = useMemo(
    () => calculateTotals(values.amount, values.taxRate),
    [values.amount, values.taxRate],
  );

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      patientId: values.patientId,
      serviceDescription: values.serviceDescription.trim(),
      amount: Number(values.amount),
      taxRate: Number(values.taxRate),
    };
    const nextErrors = validateBill(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      if (editing) {
        await dispatch(updateBill({ id, payload })).unwrap();
        toast.success('Bill updated');
        navigate(`/billing/${id}`);
      } else {
        const created = await dispatch(createBill(payload)).unwrap();
        toast.success('Bill created');
        navigate(`/billing/${created.id}`);
      }
    } catch (message) {
      toast.error(message);
    }
  }

  if (loading) return <PageLoader label="Loading bill" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{editing ? 'Edit bill' : 'Create bill'}</h1>
          <p>Tax and total are calculated from the amount and tax rate.</p>
        </div>
        <Link to="/billing" className="btn btn-outline-quiet">Back to billing</Link>
      </div>

      <form className="card-surface form-card" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="patientQuery">Find patient</label>
          <input
            id="patientQuery"
            className="form-control"
            placeholder="Type a patient name"
            value={patientQuery}
            onChange={(event) => setPatientQuery(event.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="patientId">Patient</label>
          <select id="patientId" name="patientId" className="form-select" value={values.patientId} onChange={update}>
            <option value="">Select a patient</option>
            {options.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} · {patient.phone}
              </option>
            ))}
          </select>
          {errors.patientId ? <div className="field-error">{errors.patientId}</div> : null}
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="serviceDescription">Service description</label>
          <textarea
            id="serviceDescription"
            name="serviceDescription"
            rows="3"
            className="form-control"
            value={values.serviceDescription}
            onChange={update}
          />
          {errors.serviceDescription ? <div className="field-error">{errors.serviceDescription}</div> : null}
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="amount">Amount (₹)</label>
            <input id="amount" name="amount" type="number" min="1" step="0.01" className="form-control" value={values.amount} onChange={update} />
            {errors.amount ? <div className="field-error">{errors.amount}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="taxRate">Tax rate (%)</label>
            <input id="taxRate" name="taxRate" type="number" min="0" max="100" step="0.01" className="form-control" value={values.taxRate} onChange={update} />
            {errors.taxRate ? <div className="field-error">{errors.taxRate}</div> : null}
          </div>
        </div>
        <div className="summary-box mt-3">
          <div><span>Tax</span><span>{formatINR(totals.taxAmount)}</span></div>
          <div><span>Total</span><strong>{formatINR(totals.total)}</strong></div>
        </div>
        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-teal" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save bill' : 'Create bill'}
          </button>
          <Link to="/billing" className="btn btn-outline-quiet">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
