import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../database/prisma.service';
import { CreateLeaveRequestDto, ReviewLeaveRequestDto } from './dto/leave.dto';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.leaveRequest.findMany({
      include: { employee: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(input: CreateLeaveRequestDto) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after start date');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: input.employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const overlapping = await transaction.leaveRequest.findFirst({
              where: {
                employeeId: input.employeeId,
                status: { in: ['PENDING', 'APPROVED'] },
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
            });
            if (overlapping) {
              throw new BadRequestException(
                'Employee already has an overlapping leave request',
              );
            }

            return transaction.leaveRequest.create({
              data: { ...input, startDate, endDate },
              include: { employee: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable as any },
        );
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2003'
        ) {
          throw new NotFoundException('Employee not found');
        }
        const retryable =
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (!retryable || attempt === 1) {
          if (retryable) {
            throw new ConflictException(
              'Leave request conflicted with another submission; retry',
            );
          }
          throw error;
        }
      }
    }

    throw new ConflictException('Unable to create leave request');
  }

  async review(id: number, input: ReviewLeaveRequestDto) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending leave requests can be reviewed',
      );
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: input.status },
      include: { employee: true },
    });
  }
}
