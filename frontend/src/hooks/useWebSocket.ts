import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  shouldReconnect?: () => boolean;
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        setIsConnected(true);
      };

      if (options.onMessage) {
        ws.onmessage = options.onMessage;
      }

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Exponential backoff reconnect
        if (options.shouldReconnect?.() && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [url]);

  const sendJsonMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { sendJsonMessage, isConnected };
}
