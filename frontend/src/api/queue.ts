import api from './api';

// 대기열 진입
export const enterQueue = async (eventId: number) => {
  const response = await api.post(`/queue/${eventId}/enter`);
  return response.data.data as {
    position: number;
    isNew: boolean;
    sessionId: string;
  };
};

// 대기열 상태 조회
export const getQueueStatus = async (eventId: number) => {
  const response = await api.get(`/queue/${eventId}/status`);
  return response.data.data as {
    position: number | null;
    totalWaiting: number;
    hasToken: boolean;
    inQueue: boolean;
    tokenExpiresAt: number | null;
  };
};
