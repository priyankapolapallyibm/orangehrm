import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { randomBytes, scrypt } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        active: true,
        employeeId: true,
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        createdAt: true,
      },
      orderBy: { username: 'asc' },
    });
  }

  async create(input: CreateUserDto) {
    if (input.employeeId !== undefined) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: input.employeeId },
        include: { user: true },
      });
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }
      if (employee.user) {
        throw new ConflictException('Employee already has a user account');
      }
    }

    const salt = randomBytes(16).toString('hex');
    const passwordHash = await this.hashPassword(input.password, salt);
    try {
      const user = await this.prisma.user.create({
        data: {
          username: input.username,
          passwordHash,
          passwordSalt: salt,
          displayName: input.displayName,
          role: input.role,
          employeeId: input.employeeId,
        },
      });
      return this.sanitize(user);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Username or employee account is already in use',
        );
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('Employee not found');
      }
      throw error;
    }
  }

  async update(id: number, actorId: number, input: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (id === actorId && input.active === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    if (id === actorId && input.role && input.role !== user.role) {
      throw new BadRequestException('You cannot change your own role');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: input,
    });
    return this.sanitize(updated);
  }

  private hashPassword(password: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, 64, (error, hash) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(hash.toString('base64'));
      });
    });
  }

  private sanitize(user: {
    id: number;
    username: string;
    displayName: string;
    role: string;
    active: boolean;
    employeeId: number | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      active: user.active,
      employeeId: user.employeeId,
      createdAt: user.createdAt,
    };
  }
}
