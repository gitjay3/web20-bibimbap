export type Track = 'ALL' | 'COMMON' | 'WEB' | 'IOS' | 'ANDROID';
export type Status = 'ONGOING' | 'UPCOMING' | 'ENDED';
export type ApplicationUnit = 'INDIVIDUAL' | 'TEAM';
export type SlotFieldType = 'text' | 'number' | 'date' | 'time';

export interface Event {
  id: number;
  title: string;
  description: string | null;
  track: Track;
  applicationUnit: ApplicationUnit;
  startTime: Date;
  endTime: Date;
  status: Status;
  myNotification: { notificationTime: number } | null;
}

export interface EventSlot {
  id: number;
  eventId: number;
  maxCapacity: number;
  currentCount: number;
  version: number;
  extraInfo: Record<string, string>;
  reservations?: {
    name: string;
    username: string;
    avatarUrl: string | null;
    groupNumber?: number;
    teamMembers?: TeamMember[];
  }[];
}

export interface SlotSchemaField {
  id: string;
  name: string;
  type: SlotFieldType;
}

export interface SlotSchema {
  fields: SlotSchemaField[];
}

export interface EventDetail extends Event {
  slotSchema: SlotSchema;
  slots: EventSlot[];
  canReserveByTrack?: boolean;
}

export interface TeamMember {
  name: string;
  username: string;
  avatarUrl: string | null;
}
