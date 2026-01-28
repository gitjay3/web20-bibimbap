import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Res,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateCamperDto } from './dto/create-camper.dto';
import { UpdateCamperDto } from './dto/update-camper.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateMyCamperProfileDto } from './dto/update-my-camper-profile.dto';
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

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '조직 생성' })
  @ApiResponse({ status: 201, description: '조직 생성 성공' })
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '조직 정보 조회' })
  @ApiResponse({ status: 200, description: '조직 정보 조회 성공' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '조직 정보 수정' })
  @ApiResponse({ status: 200, description: '조직 정보 수정 성공' })
  updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(id, dto);
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

  @Get(':id/campers/template')
  @ApiOperation({ summary: '조직 캠퍼 추가용 엑셀 템플릿 다운로드' })
  @ApiResponse({ status: 200, description: '템플릿 다운로드 성공' })
  async getCamperTemplate(@Res() res: Response) {
    const buffer = await this.organizationsService.getCamperTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=camper_template.xlsx',
    );

    res.send(buffer);
  }

  @Post(':id/campers')
  @Auth(Role.ADMIN)
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

  @Get(':orgId/campers/me')
  @ApiOperation({ summary: '내 캠퍼 프로필 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  getMyCamperProfile(
    @Param('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationsService.getMyCamperProfile(userId, orgId);
  }

  @Patch(':orgId/campers/me')
  @ApiOperation({ summary: '내 캠퍼 프로필 수정 (슬랙 ID 등)' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  updateMyCamperProfile(
    @Param('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMyCamperProfileDto,
  ) {
    return this.organizationsService.updateMyCamperProfile(userId, orgId, dto);
  }

  @Patch(':orgId/campers/:id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '캠퍼 정보 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '캠퍼를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '중복된 데이터' })
  updateCamper(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCamperDto,
  ) {
    return this.organizationsService.updateCamper(orgId, id, dto);
  }

  @Delete(':orgId/campers/:id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '캠퍼 정보 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '캠퍼를 찾을 수 없음' })
  deleteCamper(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.organizationsService.removeCamper(orgId, id);
  }

  @Post(':id/campers/upload')
  @Auth(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '캠퍼 일괄 업로드 (엑셀)' })
  @ApiResponse({ status: 201, description: '업로드 및 Upsert 성공' })
  uploadCampers(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType:
              /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.organizationsService.uploadCampers(id, file.buffer);
  }
}
