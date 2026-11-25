const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[6-9]\d{9}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function validateAuth(values, mode) {
  const errors = {};
  if (mode === 'register') {
    if (!values.name || values.name.trim().length < 2) {
      errors.name = 'Enter your full name';
    }
  }
  if (!emailPattern.test(values.email || '')) {
    errors.email = 'Enter a valid email address';
  }
  if (mode === 'register') {
    if (!passwordPattern.test(values.password || '')) {
      errors.password = 'Use at least 8 characters with a letter and a number';
    }
  } else if (!values.password || values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  return errors;
}

export function validatePatient(values) {
  const errors = {};
  if (!values.name || values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  const age = Number(values.age);
  if (!Number.isInteger(age) || age < 0 || age > 120) errors.age = 'Age must be a whole number from 0 to 120';
  if (!['MALE', 'FEMALE', 'OTHER'].includes(values.gender)) errors.gender = 'Select a gender';
  if (!phonePattern.test(values.phone || '')) errors.phone = 'Enter a 10-digit mobile number';
  if (!emailPattern.test(values.email || '')) errors.email = 'Enter a valid email address';
  if (!values.address || values.address.trim().length < 5) errors.address = 'Address must be at least 5 characters';
  return errors;
}

export function validateBill(values) {
  const errors = {};
  if (!values.patientId) errors.patientId = 'Select a patient';
  if (!values.serviceDescription || values.serviceDescription.trim().length < 3) {
    errors.serviceDescription = 'Describe the service (at least 3 characters)';
  }
  const amount = Number(values.amount);
  if (!Number.isFinite(amount) || amount < 1) errors.amount = 'Amount must be at least ₹1';
  const taxRate = Number(values.taxRate);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) errors.taxRate = 'Tax rate must be between 0 and 100';
  return errors;
}
