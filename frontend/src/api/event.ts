import type { Event, EventDetail } from '@/types/event';
import calcStatus from '@/utils/calcStatus';
import api from './api';

export async function getEvents(organizationId?: string): Promise<Event[]> {
  const { data } = await api.get<Omit<Event, 'status'>[]>(`/events`, {
    params: { organizationId },
  });

  return data.map((event) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    return {
      ...event,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: calcStatus(startTime, endTime),
    };
  });
}

export async function getEvent(id: number): Promise<EventDetail> {
  const { data } = await api.get<Omit<EventDetail, 'status'>>(`/events/${id}`);

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  return {
    ...data,
    startTime,
    endTime,
    status: calcStatus(startTime, endTime),
  };
}
