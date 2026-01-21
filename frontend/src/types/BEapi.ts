export type CreateEventRequest = {
  track: 'ALL' | 'COMMON' | 'WEB' | 'ANDROID' | 'IOS';
  applicationUnit: 'INDIVIDUAL' | 'TEAM';
  organizationId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  slotSchema: {
    fields: Array<{ id: string; name: string; type: 'text' | 'number' | 'time' }>;
  };
  slots: Array<Record<string, unknown>>;
};

export type CreateEventResponse = {
  id: string;
};

export interface EventSlotExtraInfo {
  content?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  mentor?: string;
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
  applicationUnit: 'INDIVIDUAL' | 'TEAM';
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
  applicationUnit: 'INDIVIDUAL' | 'TEAM';
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
  eventTrack?: 'ANDROID' | 'IOS' | 'WEB' | 'COMMON';
  applicationUnit?: 'INDIVIDUAL' | 'TEAM';
  extraInfo?: {
    mentor?: string;
    location?: string;
    content?: string;
    startTime?: string;
    endTime?: string;
    [key: string]: unknown;
  };
}

export interface ApplyReservationDto {
  slotId: number;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
}
