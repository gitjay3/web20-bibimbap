import { IsInt, Min, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventSlotDto {
  @ApiProperty({ description: '이벤트 ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  eventId: number;

  @ApiProperty({ description: '최대 정원', example: 10 })
  @IsInt()
  @Min(1)
  maxCapacity: number;

  @ApiPropertyOptional({
    description: '추가 정보',
    example: { startTime: '10:00', location: '회의실A' },
  })
  @IsObject()
  extraInfo: Record<string, unknown>;
}
