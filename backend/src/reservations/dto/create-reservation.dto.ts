export class CreateReservationDto {
  eventId: string;
  userId: string;
  slotId: number; // 예약할 슬롯 ID
}
