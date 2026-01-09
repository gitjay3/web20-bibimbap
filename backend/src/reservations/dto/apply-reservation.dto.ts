import { IsInt, IsNotEmpty } from 'class-validator';

export class ApplyReservationDto {
  @IsInt()
  @IsNotEmpty()
  slotId: number;
}
