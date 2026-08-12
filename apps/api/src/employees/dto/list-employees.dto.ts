import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { EMPLOYMENT_STATUSES } from './create-employee.dto';

export class ListEmployeesDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  status?: (typeof EMPLOYMENT_STATUSES)[number];
}
