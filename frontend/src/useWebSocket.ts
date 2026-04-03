import { useEffect, useRef, useCallback } from 'react';

interface WebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  shouldReconnect?: () => boolean;
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws = new WebSocket(url);
    wsRef.current = ws;

    if (options.onMessage) {
      ws.onmessage = options.onMessage;
    }

    ws.onclose = () => {
      // Very basic reconnect
      if (options.shouldReconnect && options.shouldReconnect()) {
        setTimeout(() => {
          ws = new WebSocket(url);
          wsRef.current = ws;
          if (options.onMessage) ws.onmessage = options.onMessage;
        }, 2000);
      }
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendJsonMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { sendJsonMessage };
}
