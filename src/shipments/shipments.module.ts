import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { PricingService } from './pricing/pricing.service';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [OtpModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, PricingService],
  exports: [ShipmentsService, PricingService],
})
export class ShipmentsModule {}
