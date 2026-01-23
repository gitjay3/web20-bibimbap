import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: '템플릿 생성',
    description: '관리자 권한으로 이벤트 템플릿을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '템플릿 생성 성공',
    type: TemplateResponseDto,
  })
  @ApiForbiddenResponse({ description: '권한 없음' })
  async create(@Body() dto: CreateTemplateDto): Promise<TemplateResponseDto> {
    const template = await this.templatesService.create(dto);
    return new TemplateResponseDto(template);
  }

  @Get()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: '템플릿 목록 조회',
    description: '모든 템플릿 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '템플릿 목록 조회 성공',
    type: [TemplateResponseDto],
  })
  @ApiForbiddenResponse({ description: '권한 없음' })
  async findAll(): Promise<TemplateResponseDto[]> {
    const templates = await this.templatesService.findAll();
    return templates.map((t) => new TemplateResponseDto(t));
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: '템플릿 상세 조회',
    description: '템플릿 ID로 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '템플릿 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '템플릿 상세 조회 성공',
    type: TemplateResponseDto,
  })
  @ApiForbiddenResponse({ description: '권한 없음' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TemplateResponseDto> {
    const template = await this.templatesService.findOne(id);
    return new TemplateResponseDto(template);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: '템플릿 수정',
    description: '템플릿을 수정합니다.',
  })
  @ApiParam({ name: 'id', description: '템플릿 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '템플릿 수정 성공',
    type: TemplateResponseDto,
  })
  @ApiForbiddenResponse({ description: '권한 없음' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.templatesService.update(id, dto);
    return new TemplateResponseDto(template);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: '템플릿 삭제',
    description: '템플릿을 삭제합니다.',
  })
  @ApiParam({ name: 'id', description: '템플릿 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '템플릿 삭제 성공',
    type: TemplateResponseDto,
  })
  @ApiForbiddenResponse({ description: '권한 없음' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TemplateResponseDto> {
    const template = await this.templatesService.remove(id);
    return new TemplateResponseDto(template);
  }
}
