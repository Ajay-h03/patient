const base = process.env.API_URL || 'http://localhost:3000/api';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

const stamp = Date.now();
const email = `tester.${stamp}@medicore.local`;

const health = await request('/health');
assert(health.status === 200, `health failed: ${health.status}`);

const unauth = await request('/patients');
assert(unauth.status === 401, `expected 401 without token, got ${unauth.status}`);

const badRegister = await request('/auth/register', {
  method: 'POST',
  body: { name: 'A', email: 'not-an-email', password: 'short' },
});
assert(badRegister.status === 400, `expected 400 for invalid register, got ${badRegister.status}`);

const registered = await request('/auth/register', {
  method: 'POST',
  body: { name: 'API Tester', email, password: 'Tester@123' },
});
assert(registered.status === 201, `register failed: ${registered.status} ${JSON.stringify(registered.data)}`);
const token = registered.data.accessToken;
assert(token, 'missing access token');

const duplicate = await request('/auth/register', {
  method: 'POST',
  body: { name: 'API Tester', email, password: 'Tester@123' },
});
assert(duplicate.status === 409, `expected 409 duplicate email, got ${duplicate.status}`);

const badLogin = await request('/auth/login', {
  method: 'POST',
  body: { email, password: 'WrongPass1' },
});
assert(badLogin.status === 401, `expected 401 bad password, got ${badLogin.status}`);

const me = await request('/auth/me', { token });
assert(me.status === 200 && me.data.email === email, 'me endpoint failed');

const badPatient = await request('/patients', {
  method: 'POST',
  token,
  body: { name: 'X', age: 200, gender: 'MALE', phone: '123', email: 'bad', address: 'no' },
});
assert(badPatient.status === 400, `expected 400 invalid patient, got ${badPatient.status}`);

const created = await request('/patients', {
  method: 'POST',
  token,
  body: {
    name: `Test Patient ${stamp}`,
    age: 31,
    gender: 'FEMALE',
    phone: '9876501234',
    email: `patient.${stamp}@example.com`,
    address: '100 Test Street, Pune',
  },
});
assert(created.status === 201, `create patient failed: ${JSON.stringify(created.data)}`);
const patientId = created.data.id;

const listed = await request(`/patients?search=${encodeURIComponent(`Test Patient ${stamp}`)}&gender=FEMALE`, { token });
assert(listed.status === 200 && listed.data.meta.total >= 1, 'patient search failed');

const updated = await request(`/patients/${patientId}`, {
  method: 'PATCH',
  token,
  body: { age: 32, address: '101 Test Street, Pune' },
});
assert(updated.status === 200 && updated.data.age === 32, 'patient update failed');

const bill = await request('/bills', {
  method: 'POST',
  token,
  body: {
    patientId,
    serviceDescription: 'Consultation and dressing',
    amount: 1000,
    taxRate: 18,
  },
});
assert(bill.status === 201, `create bill failed: ${JSON.stringify(bill.data)}`);
assert(bill.data.taxAmount === 180, `tax mismatch: ${bill.data.taxAmount}`);
assert(bill.data.total === 1180, `total mismatch: ${bill.data.total}`);
assert(bill.data.status === 'PENDING', 'new bill should be pending');
const billId = bill.data.id;

const edited = await request(`/bills/${billId}`, {
  method: 'PATCH',
  token,
  body: { amount: 500, taxRate: 5 },
});
assert(edited.status === 200 && edited.data.total === 525, `bill update total mismatch: ${edited.data.total}`);

const failed = await request(`/bills/${billId}/status`, {
  method: 'PATCH',
  token,
  body: { status: 'FAILED' },
});
assert(failed.status === 200 && failed.data.status === 'FAILED', 'status update failed');

const reopened = await request(`/bills/${billId}/status`, {
  method: 'PATCH',
  token,
  body: { status: 'PENDING' },
});
assert(reopened.status === 200 && reopened.data.status === 'PENDING', 'reopen failed');

const paidBlocked = await request(`/bills/${billId}/status`, {
  method: 'PATCH',
  token,
  body: { status: 'PAID' },
});
assert(paidBlocked.status === 400, 'manual paid status should be rejected');

const dashboard = await request('/dashboard', { token });
assert(dashboard.status === 200, 'dashboard failed');
assert(typeof dashboard.data.stats.totalPatients === 'number', 'dashboard patients not numeric');
assert(Array.isArray(dashboard.data.revenueChart.data) && dashboard.data.revenueChart.data.length === 12, 'chart missing');
assert(dashboard.data.stats.totalPatients >= 1, 'dashboard did not read database patients');

const order = await request('/payments/orders', {
  method: 'POST',
  token,
  body: { billId },
});
assert(order.status === 503 || order.status === 201, `unexpected payment order status ${order.status}`);

const payments = await request('/payments', { token });
assert(payments.status === 200 && Array.isArray(payments.data.data), 'payment history failed');

const removedBill = await request(`/bills/${billId}`, { method: 'DELETE', token });
assert(removedBill.status === 200, `delete bill failed ${removedBill.status}`);

const blockedDelete = await request(`/patients/${patientId}`, { method: 'DELETE', token });
assert(blockedDelete.status === 200, `delete patient failed ${blockedDelete.status} ${JSON.stringify(blockedDelete.data)}`);

console.log('API checks passed.');
