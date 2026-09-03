import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [OtpModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
