import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(UserRole.USER)
  async getMe(@Req() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }
}
