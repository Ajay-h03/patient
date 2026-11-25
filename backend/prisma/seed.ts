import { PrismaClient, BillStatus, Gender, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function money(amount: number, taxRate = 18) {
  const taxAmount = Math.round(amount * taxRate) / 100;
  const roundedTax = Math.round(taxAmount * 100) / 100;
  const total = Math.round((amount + roundedTax) * 100) / 100;
  return { amount, taxRate, taxAmount: roundedTax, total };
}

async function main() {
  const password = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medicore.local' },
    update: {},
    create: {
      name: 'Clinic Admin',
      email: 'admin@medicore.local',
      password,
    },
  });

  const existingPatients = await prisma.patient.count();
  if (existingPatients > 0) {
    console.log('Seed skipped: patients already exist.');
    console.log('Login with admin@medicore.local / Admin@123');
    return;
  }

  const people: Array<{ name: string; age: number; gender: Gender; phone: string; email: string; address: string }> = [
    { name: 'Ananya Sharma', age: 29, gender: Gender.FEMALE, phone: '9876543210', email: 'ananya.sharma@example.com', address: '12 Lake View Road, Bengaluru' },
    { name: 'Rohan Mehta', age: 46, gender: Gender.MALE, phone: '9820011122', email: 'rohan.mehta@example.com', address: '88 MG Road, Pune' },
    { name: 'Fatima Khan', age: 34, gender: Gender.FEMALE, phone: '9811122233', email: 'fatima.khan@example.com', address: '4 Civil Lines, Lucknow' },
    { name: 'Arjun Nair', age: 52, gender: Gender.MALE, phone: '9847012345', email: 'arjun.nair@example.com', address: '19 Marine Drive, Kochi' },
    { name: 'Priya Iyer', age: 8, gender: Gender.FEMALE, phone: '9900012345', email: 'priya.iyer@example.com', address: '27 Temple Street, Chennai' },
    { name: 'Kabir Singh', age: 67, gender: Gender.MALE, phone: '9810098765', email: 'kabir.singh@example.com', address: '3 Model Town, Delhi' },
    { name: 'Meera Joshi', age: 41, gender: Gender.FEMALE, phone: '9765432109', email: 'meera.joshi@example.com', address: '55 CG Road, Ahmedabad' },
    { name: 'Dev Patel', age: 23, gender: Gender.OTHER, phone: '9898989898', email: 'dev.patel@example.com', address: '9 Satellite Road, Ahmedabad' },
  ];

  const patients = [];
  for (const person of people) {
    patients.push(
      await prisma.patient.create({
        data: { ...person, createdById: admin.id },
      }),
    );
  }

  const samples = [
    { patient: patients[0], description: 'General consultation and vitals', amount: 800, status: BillStatus.PAID, daysAgo: 20 },
    { patient: patients[1], description: 'Blood panel and lipid profile', amount: 2200, status: BillStatus.PAID, daysAgo: 12 },
    { patient: patients[2], description: 'Physiotherapy session', amount: 1500, status: BillStatus.PENDING, daysAgo: 2 },
    { patient: patients[3], description: 'ECG and cardiology review', amount: 3200, status: BillStatus.PAID, daysAgo: 40 },
    { patient: patients[4], description: 'Paediatric follow-up', amount: 600, status: BillStatus.FAILED, daysAgo: 5 },
    { patient: patients[5], description: 'Diabetes care package', amount: 4500, status: BillStatus.PENDING, daysAgo: 1 },
    { patient: patients[6], description: 'Dental cleaning', amount: 1800, status: BillStatus.CANCELLED, daysAgo: 8 },
    { patient: patients[1], description: 'Follow-up consultation', amount: 700, status: BillStatus.PAID, daysAgo: 3 },
  ];

  for (const sample of samples) {
    const totals = money(sample.amount);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - sample.daysAgo);
    const paidAt = sample.status === BillStatus.PAID ? createdAt : null;

    const bill = await prisma.bill.create({
      data: {
        patientId: sample.patient.id,
        serviceDescription: sample.description,
        amount: totals.amount,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        status: sample.status,
        paidAt,
        createdById: admin.id,
        createdAt,
      },
    });

    if (sample.status === BillStatus.PAID) {
      await prisma.payment.create({
        data: {
          billId: bill.id,
          razorpayOrderId: `order_seed_${bill.id.replace(/-/g, '').slice(0, 12)}`,
          razorpayPaymentId: `pay_seed_${bill.id.replace(/-/g, '').slice(0, 12)}`,
          razorpaySignature: 'seed-signature',
          amount: totals.total,
          status: PaymentStatus.PAID,
          createdAt,
        },
      });
    }
  }

  console.log('Seed complete.');
  console.log('Login with admin@medicore.local / Admin@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
