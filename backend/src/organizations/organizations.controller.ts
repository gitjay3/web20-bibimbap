import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateCamperDto } from './dto/create-camper.dto';
import { CamperDto } from './dto/camper.dto';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: '내 조직 목록 조회' })
  @ApiResponse({ status: 200, description: '내 조직 목록 조회 성공' })
  findMyOrganizations(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.organizationsService.findMyOrganizations(userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: '조직 정보 조회' })
  @ApiResponse({ status: 200, description: '조직 정보 조회 성공' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get(':id/campers')
  @ApiOperation({ summary: '조직 캠퍼 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '조직 캠퍼 목록 조회 성공',
    type: [CamperDto],
  })
  findCampers(@Param('id') id: string): Promise<CamperDto[]> {
    return this.organizationsService.findCampers(id);
  }

  @Post(':id/campers')
  @ApiOperation({ summary: '조직 캠퍼 추가' })
  @ApiResponse({
    status: 201,
    description: '조직 캠퍼 추가 성공',
    type: CamperDto,
  })
  @ApiResponse({ status: 409, description: '이미 존재하는 ID' })
  createCamper(
    @Param('id') id: string,
    @Body() dto: CreateCamperDto,
  ): Promise<CamperDto> {
    return this.organizationsService.createCamper(id, dto);
  }
}
