import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { WarehouseService } from './warehouse.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.WAREHOUSE)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('shipments')
  findQueue(@Req() req: any) {
    return this.warehouseService.findQueue(req.user.userId);
  }

  @Patch('shipments/:id/receive')
  receive(@Req() req: any, @Param('id') shipmentId: string) {
    return this.warehouseService.receive(req.user.userId, shipmentId);
  }

  @Patch('shipments/:id/process')
  startProcessing(@Req() req: any, @Param('id') shipmentId: string) {
    return this.warehouseService.startProcessing(req.user.userId, shipmentId);
  }

  @Patch('shipments/:id/ready')
  markReady(@Req() req: any, @Param('id') shipmentId: string) {
    return this.warehouseService.markReady(req.user.userId, shipmentId);
  }
}