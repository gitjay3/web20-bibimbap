import type { Event } from '@/types/event';

function calcStatus(startTime: Date, endTime: Date): Event['status'] {
  const now = new Date();

  if (now < startTime) return 'UPCOMING';
  if (now >= endTime) return 'ENDED';
  return 'ONGOING';
}

export default calcStatus;
