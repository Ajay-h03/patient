import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateBillDto {
  @IsUUID()
  patientId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  serviceDescription: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(10000000)
  amount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRate?: number;
}
