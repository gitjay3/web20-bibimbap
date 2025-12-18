export class UpdateSlotCapacityDto {
  // 슬롯 최대 정원 (선택 입력, 생략 시 기존 값 유지)
  maxCapacity?: number;

  // 현재 예약 수 (선택 입력, 생략 시 기존 값 유지)
  currentCount?: number;

  // 어떤 이벤트에 대한 업데이트인지 전달하고 싶을 때 사용
  eventId?: string;
}
