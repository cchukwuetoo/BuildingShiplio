import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { GetRatesDto } from './dto/get-rates.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { ShipmentsService } from './shipments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles(UserRole.USER)
  async create(@Req() req: any, @Body() dto: CreateShipmentDto) {
    return this.shipmentsService.create(req.user.userId, dto, req.user.role);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.USER)
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.shipmentsService.cancel(req.user.userId, id);
  }

  @Post('verify-driver-otp')
  @Roles(UserRole.USER)
  async verifyDriverOtp(@Req() req: any, @Body() body: { shipmentId: string; code: string }) {
    return this.shipmentsService.verifyDriverOtp(req.user.userId, body.shipmentId, body.code);
  }

  @Post('rates')
  @Roles(UserRole.USER)
  async getRates(@Body() dto: GetRatesDto) {
    return this.shipmentsService.getRates(dto);
  }

  @Patch(':id/confirm-payment')
  @Roles(UserRole.USER)
  async confirmPayment(@Req() req: any, @Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    return this.shipmentsService.confirmPayment(req.user.userId, id, dto.paymentReference);
  }

  @Get()
  @Roles(UserRole.USER)
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shipmentsService.findAllForUser(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id/pickup-code')
  @Roles(UserRole.USER)
  async getPickupCode(@Req() req: any, @Param('id') id: string) {
    return this.shipmentsService.getPickupCode(req.user.userId, id);
  }

  @Get(':id')
  @Roles(UserRole.USER)
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.shipmentsService.findOneForUser(req.user.userId, id);
  }
}
