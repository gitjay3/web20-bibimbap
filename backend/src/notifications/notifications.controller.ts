import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';

import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller(':orgId/events/:eventId/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  async getMyNotification(
    @Req() req: AuthenticatedRequest,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.notificationsService.getNotification(req.user.id, eventId);
  }

  @Post()
  async setNotification(
    @Req() req: AuthenticatedRequest,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.setNotification(req.user.id, eventId, dto);
  }

  @Delete()
  async deleteNotification(
    @Req() req: AuthenticatedRequest,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.notificationsService.deleteNotification(req.user.id, eventId);
  }
}
