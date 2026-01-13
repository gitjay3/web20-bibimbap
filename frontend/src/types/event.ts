export type EventCategory = 'WEB' | 'ANDROID' | 'IOS' | 'COMMON';
export type EventStatus = 'ONGOING' | 'UPCOMING' | 'ENDED';
export type ApplicationUnit = 'INDIVIDUAL' | 'TEAM';

export interface Event {
  id: number;
  category: EventCategory;
  status: EventStatus;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  applicationUnit: ApplicationUnit;
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
