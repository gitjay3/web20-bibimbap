import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FieldDto {
  @ApiProperty({ description: '필드 이름', example: '시작 시간' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '필드 타입',
    enum: ['text', 'number', 'time'],
    example: 'time',
  })
  @IsString()
  @IsIn(['text', 'number', 'time'])
  type: string;
}

class SlotSchemaDto {
  @ApiProperty({ type: [FieldDto], description: '슬롯 필드 정의' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDto)
  fields: FieldDto[];
}

export class CreateTemplateDto {
  @ApiProperty({ description: '템플릿 제목', example: '코드 리뷰 멘토링' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: '템플릿 설명',
    example: '멘토와 함께하는 코드 리뷰 세션',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '슬롯 스키마 정의',
    example: {
      fields: [
        { name: '시작 시간', type: 'time' },
        { name: '멘토명', type: 'text' },
        { name: '정원', type: 'number' },
      ],
    },
  })
  @ValidateNested()
  @Type(() => SlotSchemaDto)
  slotSchema: SlotSchemaDto;
}
