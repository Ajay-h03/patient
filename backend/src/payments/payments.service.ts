import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillStatus, PaymentStatus, Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { mapBill, mapPayment, toNumber } from '../common/money';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

const paymentInclude = {
  bill: {
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
    },
  },
};

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAll(query: QueryPaymentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const where: Prisma.PaymentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? { bill: { patient: { name: { contains: search, mode: 'insensitive' } } } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: paymentInclude,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: rows.map((payment) => this.present(payment)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return this.present(payment);
  }

  async createOrder(dto: CreateOrderDto) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: dto.billId },
      include: { patient: true },
    });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }
    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('This bill is already paid');
    }
    if (bill.status === BillStatus.CANCELLED) {
      throw new BadRequestException('Cancelled bills cannot be paid');
    }

    const client = this.getClient();
    const amountPaise = Math.round(toNumber(bill.total) * 100);
    if (amountPaise < 100) {
      throw new BadRequestException('Razorpay requires a minimum payable amount of ₹1');
    }

    const order = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `bill_${bill.id.replace(/-/g, '').slice(0, 24)}`,
      notes: {
        billId: bill.id,
        patientId: bill.patientId,
      },
    });

    const payment = await this.prisma.$transaction(async (tx) => {
      if (bill.status === BillStatus.FAILED) {
        await tx.bill.update({
          where: { id: bill.id },
          data: { status: BillStatus.PENDING },
        });
      }
      return tx.payment.create({
        data: {
          billId: bill.id,
          razorpayOrderId: order.id,
          amount: bill.total,
          currency: 'INR',
          status: PaymentStatus.CREATED,
        },
        include: paymentInclude,
      });
    });

    return {
      ...this.present(payment),
      keyId: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      bill: mapBill(bill),
    };
  }

  async verify(dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { bill: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status === PaymentStatus.PAID) {
      return this.findOne(payment.id);
    }
    if (payment.razorpayOrderId !== dto.razorpay_order_id) {
      throw new BadRequestException('Payment order does not match this record');
    }
    if (payment.bill.status === BillStatus.CANCELLED) {
      throw new BadRequestException('This bill was cancelled');
    }

    const secret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Razorpay is not configured on the server');
    }

    const valid = this.signaturesMatch(
      `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`,
      dto.razorpay_signature,
      secret,
    );

    if (!valid) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: 'Signature verification failed',
          razorpayPaymentId: dto.razorpay_payment_id,
        },
      });
      throw new BadRequestException('Payment signature could not be verified');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          razorpayPaymentId: dto.razorpay_payment_id,
          razorpaySignature: dto.razorpay_signature,
          failureReason: null,
        },
        include: paymentInclude,
      });
      await tx.bill.update({
        where: { id: payment.billId },
        data: { status: BillStatus.PAID, paidAt: new Date() },
      });
      await tx.payment.updateMany({
        where: {
          billId: payment.billId,
          status: PaymentStatus.CREATED,
          id: { not: payment.id },
        },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: 'Superseded by a successful payment',
        },
      });
      return saved;
    });

    return this.present(updated);
  }

  async markFailed(id: string, reason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('A completed payment cannot be marked failed');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: reason?.trim() || 'Payment was not completed',
        },
        include: paymentInclude,
      });
      if (saved.bill.status === BillStatus.PENDING) {
        await tx.bill.update({
          where: { id: saved.billId },
          data: { status: BillStatus.FAILED },
        });
      }
      return saved;
    });

    return this.present(updated);
  }

  private present(payment: {
    amount: Prisma.Decimal | number | string;
    bill?: {
      amount: Prisma.Decimal | number | string;
      taxRate: Prisma.Decimal | number | string;
      taxAmount: Prisma.Decimal | number | string;
      total: Prisma.Decimal | number | string;
      payments?: never;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }) {
    const mapped = mapPayment(payment);
    if (payment.bill) {
      return { ...mapped, bill: mapBill(payment.bill) };
    }
    return mapped;
  }

  private getClient() {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException(
        'Razorpay test keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env and restart the API.',
      );
    }
    if (!this.razorpay) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return this.razorpay;
  }

  private signaturesMatch(payload: string, signature: string, secret: string) {
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
