import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { deletePatient, fetchPatients } from '../store/patientSlice';
import PaginationBar from '../components/PaginationBar';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import { genderLabel } from '../utils/format';

export default function Patients() {
  const dispatch = useDispatch();
  const { items, meta, loading, error } = useSelector((state) => state.patients);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchPatients({
        search: search.trim() || undefined,
        gender: gender || undefined,
        page,
        limit: 8,
      }));
    }, 250);
    return () => clearTimeout(handle);
  }, [dispatch, search, gender, page]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await dispatch(deletePatient(pendingDelete.id)).unwrap();
      toast.success('Patient removed');
      setPendingDelete(null);
      dispatch(fetchPatients({
        search: search.trim() || undefined,
        gender: gender || undefined,
        page,
        limit: 8,
      }));
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
          <h1>Patients</h1>
          <p>Search by name, filter by gender, and keep records current.</p>
        </div>
        <Link to="/patients/new" className="btn btn-teal">Add patient</Link>
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
          value={gender}
          onChange={(event) => {
            setGender(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="card-surface table-card">
        {loading ? <PageLoader label="Loading patients" /> : null}
        {!loading && error ? <div className="alert alert-danger m-3">{error}</div> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState icon="bi-person-plus" title="No patients found" text="Add a patient or change the search filters." />
        ) : null}
        {!loading && items.length > 0 ? (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Bills</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((patient) => (
                  <tr key={patient.id}>
                    <td className="fw-semibold">{patient.name}</td>
                    <td>{patient.age}</td>
                    <td><span className={`soft-badge badge-${patient.gender.toLowerCase()}`}>{genderLabel(patient.gender)}</span></td>
                    <td>{patient.phone}</td>
                    <td>{patient.email}</td>
                    <td>{patient._count?.bills ?? 0}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <Link className="icon-btn" to={`/patients/${patient.id}`} title="View"><i className="bi bi-eye" /></Link>
                        <Link className="icon-btn" to={`/patients/${patient.id}/edit`} title="Edit"><i className="bi bi-pencil" /></Link>
                        <button type="button" className="icon-btn danger" title="Delete" onClick={() => setPendingDelete(patient)}>
                          <i className="bi bi-trash" />
                        </button>
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
        title="Delete patient"
        message={`Remove ${pendingDelete?.name}? This is only allowed when the patient has no bills.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
