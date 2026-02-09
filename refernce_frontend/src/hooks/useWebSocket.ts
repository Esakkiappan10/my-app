import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage } from '@/types';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(
  taskId: string | null,
  options: UseWebSocketOptions = {}
) {
  const { onMessage, onConnect, onDisconnect, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!taskId) return;

    const wsUrl = `ws://localhost:8000/ws/tasks/${taskId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message:', message);
        onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      onDisconnect?.();

      // Attempt to reconnect after 3 seconds
      if (taskId) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    wsRef.current = ws;
  }, [taskId, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  useEffect(() => {
    if (taskId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [taskId, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect
  };
}
