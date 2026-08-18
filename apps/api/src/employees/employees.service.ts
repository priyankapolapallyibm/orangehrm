import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: ListEmployeesDto) {
    const search = query.search?.trim();

    return this.prisma.employee.findMany({
      where: {
        employmentStatus: query.status,
        ...(search
          ? {
              OR: [
                { employeeNumber: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { department: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async create(input: CreateEmployeeDto) {
    try {
      return await this.prisma.employee.create({
        data: {
          ...input,
          middleName: input.middleName || null,
          employmentStatus: input.employmentStatus ?? 'ACTIVE',
          dateOfJoining: new Date(input.dateOfJoining),
        },
      });
    } catch (error) {
      this.throwForDatabaseConflict(error);
      throw error;
    }
  }

  async update(id: number, input: UpdateEmployeeDto) {
    await this.findOne(id);

    try {
      return await this.prisma.employee.update({
        where: { id },
        data: {
          ...input,
          ...(input.middleName !== undefined
            ? { middleName: input.middleName || null }
            : {}),
          ...(input.dateOfJoining
            ? { dateOfJoining: new Date(input.dateOfJoining) }
            : {}),
        },
      });
    } catch (error) {
      this.throwForDatabaseConflict(error);
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.employee.delete({ where: { id } });
  }

  private throwForDatabaseConflict(error: unknown): void {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Employee number or email is already in use');
    }
  }
}
