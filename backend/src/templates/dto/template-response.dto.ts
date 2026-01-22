import { Template } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class FieldResponseDto {
  @ApiProperty({ description: '필드 ID', example: 'field-1' })
  id: string;

  @ApiProperty({ description: '필드 이름', example: '시작 시간' })
  name: string;

  @ApiProperty({
    description: '필드 타입',
    enum: ['text', 'number', 'time', 'datetime'],
    example: 'time',
  })
  type: string;
}

class SlotSchemaResponseDto {
  @ApiProperty({
    type: [FieldResponseDto],
    description: '슬롯 필드 정의',
  })
  fields: FieldResponseDto[];
}

export class TemplateResponseDto {
  @ApiProperty({
    description: '템플릿 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '템플릿 제목',
    example: '코드 리뷰 멘토링',
  })
  title: string;

  @ApiProperty({
    description: '템플릿 설명',
    example: '멘토와 함께하는 코드 리뷰 세션',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: '슬롯 스키마 정의',
    type: SlotSchemaResponseDto,
    example: {
      fields: [
        { id: 'field-1', name: '시작 시간', type: 'time' },
        { id: 'field-2', name: '멘토명', type: 'text' },
      ],
    },
  })
  slotSchema: SlotSchemaResponseDto;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-10T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-10T12:00:00Z',
  })
  updatedAt: Date;

  constructor(template: Template) {
    this.id = template.id;
    this.title = template.title;
    this.description = template.description;
    this.slotSchema = template.slotSchema as unknown as SlotSchemaResponseDto;
    this.createdAt = template.createdAt;
    this.updatedAt = template.updatedAt;
  }
}
