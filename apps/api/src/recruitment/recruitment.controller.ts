import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateCandidateDto,
  CreateVacancyDto,
  UpdateCandidateStatusDto,
  UpdateVacancyStatusDto,
} from './dto/recruitment.dto';
import { RecruitmentService } from './recruitment.service';

@Controller('recruitment')
@UseGuards(JwtAuthGuard, AdminGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('vacancies')
  listVacancies() {
    return this.recruitmentService.listVacancies();
  }

  @Post('vacancies')
  createVacancy(@Body() input: CreateVacancyDto) {
    return this.recruitmentService.createVacancy(input);
  }

  @Patch('vacancies/:id/status')
  updateVacancyStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateVacancyStatusDto,
  ) {
    return this.recruitmentService.updateVacancyStatus(id, input);
  }

  @Get('candidates')
  listCandidates() {
    return this.recruitmentService.listCandidates();
  }

  @Post('candidates')
  createCandidate(@Body() input: CreateCandidateDto) {
    return this.recruitmentService.createCandidate(input);
  }

  @Patch('candidates/:id/status')
  updateCandidateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateCandidateStatusDto,
  ) {
    return this.recruitmentService.updateCandidateStatus(id, input);
  }
}
