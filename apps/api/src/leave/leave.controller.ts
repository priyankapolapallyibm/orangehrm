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
import { CreateLeaveRequestDto, ReviewLeaveRequestDto } from './dto/leave.dto';
import { LeaveService } from './leave.service';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  findAll() {
    return this.leaveService.findAll();
  }

  @Post()
  create(@Body() input: CreateLeaveRequestDto) {
    return this.leaveService.create(input);
  }

  @Patch(':id/status')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: ReviewLeaveRequestDto,
  ) {
    return this.leaveService.review(id, input);
  }
}
