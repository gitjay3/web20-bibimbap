import api from './api';

export interface NotificationResponse {
  notificationTime: number; // 5, 10, 30, 60
}

export const getMyNotification = async (
  orgId: string,
  eventId: number,
): Promise<NotificationResponse | null> => {
  const { data } = await api.get<NotificationResponse | null>(
    `/organizations/${orgId}/events/${eventId}/notifications/me`,
  );
  return data;
};

export const setNotification = async (
  orgId: string,
  eventId: number,
  notificationTime: number,
): Promise<NotificationResponse> => {
  const { data } = await api.post<NotificationResponse>(
    `/organizations/${orgId}/events/${eventId}/notifications`,
    { notificationTime },
  );
  return data;
};

export const deleteNotification = async (
  orgId: string,
  eventId: number,
): Promise<void> => {
  await api.delete(`/organizations/${orgId}/events/${eventId}/notifications`);
};

