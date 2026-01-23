import type { Event, EventDetail } from '@/types/event';
import calcStatus from '@/utils/calcStatus';
import type { CreateEventRequest } from '@/types/BEapi';
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

export async function createEvent(body: CreateEventRequest) {
  const { data } = await api.post('/events', body);
  return data;
}

export async function updateEvent(
  id: number,
  data: {
    title?: string;
    description?: string;
    track?: string;
    applicationUnit?: string;
    startTime?: string;
    endTime?: string;
    slotSchema?: Record<string, unknown>;
  },
) {
  const { data: result } = await api.patch(`/events/${id}`, data);
  return result;
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/events/${id}`);
}
