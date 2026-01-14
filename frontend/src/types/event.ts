export type Track = 'COMMON' | 'WEB' | 'IOS' | 'ANDROID';
export type Status = 'ONGOING' | 'UPCOMING' | 'ENDED';
export type ApplicationUnit = 'INDIVIDUAL' | 'TEAM';

export interface Event {
  id: number;
  title: string;
  description: string;
  track: Track;
  startTime: Date;
  endTime: Date;
  stauts: Status;
  applicationUnit: ApplicationUnit;
}

export interface EventSlot {
  id: number;
  eventId: number;
  maxCapacity: number;
  currentCount: number;
  version: number;
  extraInfo: Record<string, string>;
}

export type SlotSchema = Record<string, { type: 'string' | 'number' | 'boolean'; label: string }>;

export interface EventDetail extends Event {
  slotSchema: SlotSchema;
  EventSlot: EventSlot[]; // TODO: slot으로 수정되면 좋을듯 ..
}