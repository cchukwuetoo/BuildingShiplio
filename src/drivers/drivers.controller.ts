import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { DriversService } from './drivers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('shipments')
  findAvailableAndAssigned(@Req() req: any) {
    return this.driversService.findAvailableAndAssigned(req.user.userId);
  }

  @Patch('shipments/:id/accept')
  accept(@Req() req: any, @Param('id') shipmentId: string) {
    return this.driversService.accept(req.user.userId, shipmentId);
  }

  @Patch('shipments/:id/pickup')
  markPickedUp(@Req() req: any, @Param('id') shipmentId: string) {
    return this.driversService.markPickedUp(req.user.userId, shipmentId);
  }
}