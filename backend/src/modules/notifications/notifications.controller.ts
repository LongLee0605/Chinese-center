import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { RolesGuard } from '../../core/guards/roles.guard';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get('counts')
  getCounts(@Request() req: { user: { role: string } }) {
    return this.notifications.getCounts(req.user.role);
  }
}
