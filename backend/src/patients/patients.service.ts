import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { mapBill } from '../common/money';
import { rethrowPrisma } from '../common/prisma-error';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPatientsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const where: Prisma.PatientWhereInput = {
      ...(search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {}),
      ...(query.gender ? { gender: query.gender } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { bills: true } } },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        bills: {
          orderBy: { createdAt: 'desc' },
          include: { payments: { orderBy: { createdAt: 'desc' } } },
        },
      },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return {
      ...patient,
      bills: patient.bills.map((bill) => mapBill(bill)),
    };
  }

  async create(dto: CreatePatientDto, userId: string) {
    try {
      return await this.prisma.patient.create({
        data: { ...dto, createdById: userId },
      });
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.patient.update({ where: { id }, data: dto });
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const billCount = await this.prisma.bill.count({ where: { patientId: id } });
    if (billCount > 0) {
      throw new BadRequestException('Delete this patient\'s bills before removing the patient');
    }
    try {
      await this.prisma.patient.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  private async ensureExists(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }
}
