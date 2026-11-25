import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BillStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { QueryBillsDto } from './dto/query-bills.dto';
import { calculateBill, mapBill } from '../common/money';
import { rethrowPrisma } from '../common/prisma-error';

const billInclude = {
  patient: { select: { id: true, name: true, phone: true, email: true, gender: true } },
  payments: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBillsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const where: Prisma.BillWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(search
        ? {
            OR: [
              { serviceDescription: { contains: search, mode: 'insensitive' } },
              { patient: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.bill.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: billInclude,
      }),
      this.prisma.bill.count({ where }),
    ]);

    return {
      data: rows.map((bill) => mapBill(bill)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id }, include: billInclude });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }
    return mapBill(bill);
  }

  async create(dto: CreateBillDto, userId: string) {
    await this.ensurePatient(dto.patientId);
    const totals = calculateBill(dto.amount, dto.taxRate ?? 18);
    try {
      const bill = await this.prisma.bill.create({
        data: {
          patientId: dto.patientId,
          serviceDescription: dto.serviceDescription.trim(),
          ...totals,
          createdById: userId,
        },
        include: billInclude,
      });
      return mapBill(bill);
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async update(id: string, dto: UpdateBillDto) {
    const existing = await this.prisma.bill.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Bill not found');
    }
    if (existing.status === BillStatus.PAID || existing.status === BillStatus.CANCELLED) {
      throw new BadRequestException('Paid and cancelled bills cannot be edited');
    }
    if (dto.patientId) {
      await this.ensurePatient(dto.patientId);
    }

    const totals = calculateBill(
      dto.amount ?? Number(existing.amount),
      dto.taxRate ?? Number(existing.taxRate),
    );

    try {
      const bill = await this.prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { billId: id, status: PaymentStatus.CREATED },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: 'Bill was updated before payment completed',
          },
        });
        return tx.bill.update({
          where: { id },
          data: {
            ...(dto.patientId ? { patientId: dto.patientId } : {}),
            ...(dto.serviceDescription ? { serviceDescription: dto.serviceDescription.trim() } : {}),
            ...totals,
          },
          include: billInclude,
        });
      });
      return mapBill(bill);
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async updateStatus(id: string, status: BillStatus) {
    const existing = await this.prisma.bill.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Bill not found');
    }
    if (status === BillStatus.PAID) {
      throw new BadRequestException('Use Razorpay checkout to mark a bill as paid');
    }
    if (existing.status === BillStatus.PAID) {
      throw new BadRequestException('A paid bill cannot change status');
    }

    const allowed: Record<BillStatus, BillStatus[]> = {
      PENDING: [BillStatus.FAILED, BillStatus.CANCELLED],
      FAILED: [BillStatus.PENDING, BillStatus.CANCELLED],
      CANCELLED: [BillStatus.PENDING],
      PAID: [],
    };

    if (!allowed[existing.status].includes(status)) {
      throw new BadRequestException(`Cannot change a ${existing.status.toLowerCase()} bill to ${status.toLowerCase()}`);
    }

    const bill = await this.prisma.$transaction(async (tx) => {
      if (status === BillStatus.CANCELLED || status === BillStatus.FAILED) {
        await tx.payment.updateMany({
          where: { billId: id, status: PaymentStatus.CREATED },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: `Bill marked ${status.toLowerCase()}`,
          },
        });
      }
      return tx.bill.update({
        where: { id },
        data: { status },
        include: billInclude,
      });
    });

    return mapBill(bill);
  }

  async remove(id: string) {
    const existing = await this.prisma.bill.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Bill not found');
    }
    if (existing.status === BillStatus.PAID) {
      throw new BadRequestException('Paid bills cannot be deleted');
    }
    await this.prisma.bill.delete({ where: { id } });
    return { success: true };
  }

  private async ensurePatient(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }
}
