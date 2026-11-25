import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { createPatient, fetchPatient, updatePatient } from '../store/patientSlice';
import { validatePatient } from '../utils/validators';
import PageLoader from '../components/PageLoader';

const empty = { name: '', age: '', gender: 'FEMALE', phone: '', email: '', address: '' };

export default function PatientForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const saving = useSelector((state) => state.patients.saving);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return undefined;
    let active = true;
    dispatch(fetchPatient(id))
      .unwrap()
      .then((patient) => {
        if (!active) return;
        setValues({
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
        });
      })
      .catch((message) => toast.error(message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch, editing, id]);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = { ...values, age: Number(values.age) };
    const nextErrors = validatePatient(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      if (editing) {
        await dispatch(updatePatient({ id, payload })).unwrap();
        toast.success('Patient updated');
        navigate(`/patients/${id}`);
      } else {
        const created = await dispatch(createPatient(payload)).unwrap();
        toast.success('Patient added');
        navigate(`/patients/${created.id}`);
      }
    } catch (message) {
      toast.error(message);
    }
  }

  if (loading) return <PageLoader label="Loading patient" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{editing ? 'Edit patient' : 'Add patient'}</h1>
          <p>Name, contact details, and address are required.</p>
        </div>
        <Link to="/patients" className="btn btn-outline-quiet">Back to list</Link>
      </div>
      <form className="card-surface form-card" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label" htmlFor="name">Full name</label>
            <input id="name" name="name" className="form-control" value={values.name} onChange={update} />
            {errors.name ? <div className="field-error">{errors.name}</div> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="age">Age</label>
            <input id="age" name="age" type="number" min="0" max="120" className="form-control" value={values.age} onChange={update} />
            {errors.age ? <div className="field-error">{errors.age}</div> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="gender">Gender</label>
            <select id="gender" name="gender" className="form-select" value={values.gender} onChange={update}>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.gender ? <div className="field-error">{errors.gender}</div> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" className="form-control" value={values.phone} onChange={update} placeholder="9876543210" />
            {errors.phone ? <div className="field-error">{errors.phone}</div> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="form-control" value={values.email} onChange={update} />
            {errors.email ? <div className="field-error">{errors.email}</div> : null}
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="address">Address</label>
            <textarea id="address" name="address" rows="3" className="form-control" value={values.address} onChange={update} />
            {errors.address ? <div className="field-error">{errors.address}</div> : null}
          </div>
        </div>
        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-teal" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create patient'}
          </button>
          <Link to="/patients" className="btn btn-outline-quiet">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
