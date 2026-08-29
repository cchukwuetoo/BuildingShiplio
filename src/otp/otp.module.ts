import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpService } from './otp.service';

export const OTP_SERVICE = 'OTP_SERVICE';

@Module({
  imports: [ConfigModule],
  providers: [
    OtpService,
    {
      provide: OTP_SERVICE,
      useExisting: OtpService,
    },
  ],
  exports: [OtpService, OTP_SERVICE],
})
export class OtpModule {}