import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Track, ApplicationUnit } from '@prisma/client';

export class UpdateEventDto {
  @ApiPropertyOptional({ description: '이벤트 제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '이벤트 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Track, description: '트랙' })
  @IsOptional()
  @IsEnum(Track)
  track?: Track;

  @ApiPropertyOptional({ enum: ApplicationUnit, description: '신청 단위' })
  @IsOptional()
  @IsEnum(ApplicationUnit)
  applicationUnit?: ApplicationUnit;

  @ApiPropertyOptional({ description: '시작 시간' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: '종료 시간' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: '슬롯 스키마' })
  @IsOptional()
  @IsObject()
  slotSchema?: Record<string, unknown>;
}
