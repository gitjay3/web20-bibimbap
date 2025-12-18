import { useEffect, useRef, useState, useCallback } from "react";

interface UseSSEOptions<TData> {
  url: string;
  onMessage?: (event: TData) => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export function useSSE<TData = unknown>({
  url,
  onMessage,
  onError,
  enabled = true,
}: UseSSEOptions<TData>) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messageHandlerRef = useRef<typeof onMessage>();
  const errorHandlerRef = useRef<typeof onError>();

  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    errorHandlerRef.current = onError;
  }, [onError]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // 기존 연결이 있으면 닫기
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TData;
          messageHandlerRef.current?.(data);
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = (err) => {
        setError(err);
        setIsConnected(false);
        errorHandlerRef.current?.(err);
      };
    } catch (err) {
      console.error("Failed to create EventSource:", err);
      setError(err as Event);
    }
  }, [url, enabled]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
  };
}
