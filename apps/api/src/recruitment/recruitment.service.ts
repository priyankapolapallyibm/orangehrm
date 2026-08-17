import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../database/prisma.service';
import {
  CreateCandidateDto,
  CreateVacancyDto,
  UpdateCandidateStatusDto,
  UpdateVacancyStatusDto,
} from './dto/recruitment.dto';

@Injectable()
export class RecruitmentService {
  constructor(private readonly prisma: PrismaService) {}

  listVacancies() {
    return this.prisma.vacancy.findMany({
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createVacancy(input: CreateVacancyDto) {
    return this.prisma.vacancy.create({ data: input });
  }

  async updateVacancyStatus(id: number, input: UpdateVacancyStatusDto) {
    await this.requireVacancy(id);
    return this.prisma.vacancy.update({ where: { id }, data: input });
  }

  listCandidates() {
    return this.prisma.candidate.findMany({
      include: { vacancy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCandidate(input: CreateCandidateDto) {
    const vacancy = await this.requireVacancy(input.vacancyId);
    if (vacancy.status !== 'OPEN') {
      throw new BadRequestException(
        'Candidates can only apply to open vacancies',
      );
    }
    try {
      return await this.prisma.candidate.create({
        data: { ...input, phone: input.phone || null },
        include: { vacancy: true },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This email is already registered for the vacancy',
        );
      }
      throw error;
    }
  }

  async updateCandidateStatus(id: number, input: UpdateCandidateStatusDto) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return this.prisma.candidate.update({
      where: { id },
      data: input,
      include: { vacancy: true },
    });
  }

  private async requireVacancy(id: number) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id } });
    if (!vacancy) {
      throw new NotFoundException('Vacancy not found');
    }
    return vacancy;
  }
}
