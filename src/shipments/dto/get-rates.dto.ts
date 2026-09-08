import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Parcel details for a courier rate search.
 * Field names mirror the frontend booking form exactly so the
 * client payload needs zero conversion.
 */
export class GetRatesDto {
  @IsString()
  @IsNotEmpty()
  pickupCity: string;

  @IsString()
  @IsNotEmpty()
  pickupState: string;

  @IsString()
  @IsNotEmpty()
  deliveryCity: string;

  @IsString()
  @IsNotEmpty()
  deliveryState: string;

  @IsString()
  @IsNotEmpty()
  packageType: string;

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
}
