import { IsOptional, IsInt, Min, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEventSlotDto {
  @ApiPropertyOptional({ description: '최대 정원', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: '추가 정보',
    example: { time: '10:00', location: '회의실A' },
  })
  @IsOptional()
  @IsObject()
  extraInfo?: Record<string, unknown>;
}
