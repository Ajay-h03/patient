import { Transform, Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  age: number;

  @IsEnum(Gender)
  gender: Gender;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[6-9]\d{9}$/, { message: 'Phone must be a 10-digit Indian mobile number' })
  phone: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  address: string;
}
