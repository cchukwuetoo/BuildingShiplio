import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';

export class ResendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsIn(['REGISTRATION', 'PASSWORD_RESET'])
  purpose: 'REGISTRATION' | 'PASSWORD_RESET';
}
