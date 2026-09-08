import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { TerminalService } from './terminal/terminal.service';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [OtpModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, TerminalService],
  exports: [ShipmentsService, TerminalService],
})
export class ShipmentsModule {}
