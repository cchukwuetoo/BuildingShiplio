import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
