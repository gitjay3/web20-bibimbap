import type { SlotAvailabilityApiResponse } from '@/types/BEapi';
import api from './api';

// 특정 이벤트의 실시간 슬롯 정원 조회
export async function getSlotAvailability(eventId: number): Promise<SlotAvailabilityApiResponse> {
  const { data } = await api.get<SlotAvailabilityApiResponse>('/event-slots/availability', {
    params: { eventId },
  });
  return data;
}

// 특정 슬롯들의 실시간 정원 조회 ( 내 예약 등 )
export async function getSlotAvailabilityByIds(
  slotIds: number[],
): Promise<SlotAvailabilityApiResponse> {
  const { data } = await api.get<SlotAvailabilityApiResponse>('/event-slots/availability', {
    params: { slotIds: slotIds.join(',') },
  });
  return data;
}
