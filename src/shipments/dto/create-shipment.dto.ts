import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @IsString()
  @IsNotEmpty()
  pickupCity: string;

  @IsString()
  @IsNotEmpty()
  pickupState: string;

  @IsString()
  @IsNotEmpty()
  pickupContactName: string;

  @IsString()
  @IsNotEmpty()
  pickupPhone: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsString()
  @IsNotEmpty()
  deliveryCity: string;

  @IsString()
  @IsNotEmpty()
  deliveryState: string;

  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @IsString()
  @IsNotEmpty()
  packageType: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.0001)
  estimatedWeight: number;

  @IsString()
  @IsNotEmpty()
  weightUnit: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  height?: number;

  @IsOptional()
  @IsString()
  dimensionUnit?: string;

  @IsBoolean()
  isFragile: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  declaredValue?: number;
}
