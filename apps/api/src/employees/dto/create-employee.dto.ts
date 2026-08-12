import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const EMPLOYMENT_STATUSES = [
  'ACTIVE',
  'ON_LEAVE',
  'TERMINATED',
] as const;

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  employeeNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  jobTitle!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  department!: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  employmentStatus?: (typeof EMPLOYMENT_STATUSES)[number];

  @IsDateString({ strict: true })
  dateOfJoining!: string;
}
