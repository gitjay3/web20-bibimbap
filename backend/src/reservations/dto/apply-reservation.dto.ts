import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyReservationDto {
  @ApiProperty({
    description: '예약할 이벤트 ID',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  eventId: number;

  @IsInt()
  @IsNotEmpty()
  slotId: number;
}
