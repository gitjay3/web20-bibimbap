export interface EventSlotExtraInfo {
  content?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export interface EventSlotApiResponse {
  id: number;
  maxCapacity: number;
  currentCount: number;
  remainingSeats: number;
  isAvailable: boolean;
  extraInfo: EventSlotExtraInfo;
}

export interface EventDetailApiResponse {
  id: number;
  title: string;
  description: string | null;
  track: 'WEB' | 'ANDROID' | 'IOS' | 'COMMON';
  startTime: string; // ISO 8601 날짜 문자열
  endTime: string;
  creatorId: string;
  slotSchema: Record<string, unknown>; // JSON 타입
  createdAt: string;
  updatedAt: string;
  slots: EventSlotApiResponse[];
}

export interface EventListItemApiResponse {
  id: number;
  title: string;
  description: string | null;
  track: 'WEB' | 'ANDROID' | 'IOS' | 'COMMON';
  creatorId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventSlotsApiResponse {
  eventId: number;
  eventTitle: string;
  slots: EventSlotApiResponse[];
}

export interface SlotAvailabilityItem {
  slotId: number;
  currentCount: number;
  remainingSeats: number;
  isAvailable: boolean;
}

export interface SlotAvailabilityApiResponse {
  slots: SlotAvailabilityItem[];
  timestamp: string;
}

export interface ReservationApiResponse {
  id: number;
  userId: string;
  slotId: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  reservedAt: string;
  eventTitle?: string;
  eventStartTime?: string;
  eventEndTime?: string;
}

export interface ApplyReservationDto {
  slotId: number;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
}
