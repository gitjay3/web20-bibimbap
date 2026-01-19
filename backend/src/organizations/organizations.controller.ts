import { Controller, Get, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: '내 조직 목록 조회' })
  @ApiResponse({ status: 200, description: '내 조직 목록 조회 성공' })
  findMyOrganizations(@CurrentUser('id') userId: string) {
    return this.organizationsService.findMyOrganizations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '조직 정보 조회' })
  @ApiResponse({ status: 200, description: '조직 정보 조회 성공' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }
}
