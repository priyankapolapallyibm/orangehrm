import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVacancyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  department!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  positions!: number;
}

export class CreateCandidateDto {
  @IsInt()
  vacancyId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class UpdateCandidateStatusDto {
  @IsIn(['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED'])
  status!: string;
}

export class UpdateVacancyStatusDto {
  @IsIn(['OPEN', 'CLOSED'])
  status!: string;
}
