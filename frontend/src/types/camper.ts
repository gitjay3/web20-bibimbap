import type { Track } from '@/types/event';

export type { Track };

export type RegistrationStatus = 'INVITED' | 'CLAIMED' | 'REVOKED'

export interface Camper {
  id: string;
  camperId: string;
  name: string;
  username: string;
  track: Track;
  status: RegistrationStatus;
  groupNumber: number | null;
}

export const trackOptions: { key: Track; label: string }[] = [
  { key: 'WEB', label: 'WEB' },
  { key: 'ANDROID', label: 'ANDROID' },
  { key: 'IOS', label: 'IOS' },
] as const;
