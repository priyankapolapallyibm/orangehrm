import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export const LEAVE_TYPES = ['ANNUAL', 'SICK', 'PERSONAL'] as const;
export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export class CreateLeaveRequestDto {
  @IsInt()
  employeeId!: number;

  @IsIn(LEAVE_TYPES)
  leaveType!: (typeof LEAVE_TYPES)[number];

  @IsDateString({ strict: true })
  startDate!: string;

  @IsDateString({ strict: true })
  endDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class ReviewLeaveRequestDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';
}
