import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { CreateAdminInvitationDto } from './dto/create-admin-invitation.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('invitations')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '운영진 초대' })
  @ApiResponse({ status: 201, description: '초대 성공' })
  @ApiResponse({ status: 409, description: '이미 운영진이거나 초대가 존재함' })
  createInvitation(
    @Body() dto: CreateAdminInvitationDto,
    @CurrentUser('id') inviterId: string,
  ) {
    return this.adminService.createInvitation(dto.githubUsername, inviterId);
  }

  @Get('invitations')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '초대 목록 조회' })
  @ApiResponse({ status: 200, description: '초대 목록' })
  getInvitations() {
    return this.adminService.getInvitations();
  }

  @Delete('invitations/:id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '초대 취소' })
  @ApiResponse({ status: 200, description: '취소 성공' })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  revokeInvitation(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.revokeInvitation(id);
  }

  @Get('members')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '운영진 목록 조회' })
  @ApiResponse({ status: 200, description: '운영진 목록' })
  getAdminMembers() {
    return this.adminService.getAdminMembers();
  }

  @Delete('members/:id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '운영진 권한 해제' })
  @ApiResponse({ status: 200, description: '권한 해제 성공' })
  @ApiResponse({ status: 400, description: '자기 자신 또는 마지막 운영진' })
  removeAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.adminService.removeAdmin(id, currentUserId);
  }
}
