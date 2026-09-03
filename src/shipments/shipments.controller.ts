import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateShipmentDto } from './dto/create-shipment.dto';
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

  @Post('verify-driver-otp')
  @Roles(UserRole.USER)
  async verifyDriverOtp(@Req() req: any, @Body() body: { shipmentId: string; code: string }) {
    return this.shipmentsService.verifyDriverOtp(req.user.userId, body.shipmentId, body.code);
  }

  @Get()
  @Roles(UserRole.USER)
  async findAll(@Req() req: any) {
    return this.shipmentsService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  @Roles(UserRole.USER)
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.shipmentsService.findOneForUser(req.user.userId, id);
  }
}
