import type { Track } from '@/types/event';

export interface Camper {
  id: string;
  name: string;
  githubId: string;
  track: Track;
}

export const trackOptions: { key: Track; label: string }[] = [
  { key: 'WEB', label: 'WEB' },
  { key: 'ANDROID', label: 'ANDROID' },
  { key: 'IOS', label: 'IOS' },
] as const;
