import {
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TerminalAddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class TerminalParcelDto {
  @IsNumber()
  @Min(0.0001)
  weight_kg: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  length_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  width_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  height_cm?: number;

  @IsBoolean()
  is_fragile: boolean;

  @IsOptional()
  @IsString()
  package_type?: string;
}

export class GetTerminalRatesDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => TerminalAddressDto)
  pickup: TerminalAddressDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => TerminalAddressDto)
  delivery: TerminalAddressDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => TerminalParcelDto)
  parcel: TerminalParcelDto;
}
