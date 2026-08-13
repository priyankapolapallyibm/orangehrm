import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  displayName!: string;

  @IsIn(['ADMIN', 'EMPLOYEE'])
  role!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  employeeId?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsIn(['ADMIN', 'EMPLOYEE'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
