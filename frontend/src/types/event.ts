export type EventCategory = 'WEB' | 'ANDROID' | 'IOS' | 'COMMON';
export type EventStatus = 'ONGOING' | 'UPCOMING' | 'ENDED';

export interface Event {
  id: string;
  category: EventCategory;
  status: EventStatus;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
}

export interface EventSession {
  id: string;
  content: string;
  startTime: string;
  endTime: string;
  location: string;
  currentCount: number;
  maxCount: number;
  isClosed: boolean;
}

export interface EventDetail extends Event {
  sessions: EventSession[];
}
