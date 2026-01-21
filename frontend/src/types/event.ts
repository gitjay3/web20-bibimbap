export type Track = 'COMMON' | 'WEB' | 'IOS' | 'ANDROID';
export type Status = 'ONGOING' | 'UPCOMING' | 'ENDED';
export type ApplicationUnit = 'INDIVIDUAL' | 'TEAM';
export type SlotFieldType = 'text' | 'number' | 'time';

export interface Event {
  id: number;
  title: string;
  description: string | null;
  track: Track;
  applicationUnit: ApplicationUnit;
  startTime: Date;
  endTime: Date;
  status: Status;
}

export interface EventSlot {
  id: number;
  eventId: number;
  maxCapacity: number;
  currentCount: number;
  version: number;
  extraInfo: Record<string, string>;
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
}
