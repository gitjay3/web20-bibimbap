const CONFIG = {
  polling: {
    queueStatus: Number(import.meta.env.VITE_QUEUE_POLLING_INTERVAL) || 3000,
    eventDetail: Number(import.meta.env.VITE_EVENT_POLLING_INTERVAL) || 1000,
  },
};

export default CONFIG;
