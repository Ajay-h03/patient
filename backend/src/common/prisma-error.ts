import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function rethrowPrisma(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException('A record with this value already exists');
    }
    if (error.code === 'P2025') {
      throw new NotFoundException('Record not found');
    }
    if (error.code === 'P2003') {
      throw new BadRequestException('This record is linked to other data and cannot be changed');
    }
  }
  throw error;
}
