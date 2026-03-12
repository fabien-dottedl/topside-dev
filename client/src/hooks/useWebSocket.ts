import { useEffect, useRef, useCallback, useState } from "react";
import type { FileChangeEvent } from "../types";

type FileChangeHandler = (event: FileChangeEvent) => void;

interface UseFileWatcherOptions {
  onFileChange: FileChangeHandler;
  onReconnect?: () => void;
}

export function useFileWatcher(options: UseFileWatcherOptions) {
  const { onFileChange, onReconnect } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectDelayRef = useRef(2000);
  const wasConnectedRef = useRef(false);
  const [connected, setConnected] = useState(false);

  // Keep callbacks in refs so WebSocket handlers always see the latest
  const onFileChangeRef = useRef(onFileChange);
  onFileChangeRef.current = onFileChange;
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/files`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelayRef.current = 2000; // reset backoff
      setConnected(true);

      // If we were previously connected, this is a reconnect
      if (wasConnectedRef.current) {
        onReconnectRef.current?.();
      }
      wasConnectedRef.current = true;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as FileChangeEvent;
        if (data.type === "file-change") {
          onFileChangeRef.current(data);
        }
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 30000);
        connect();
      }, reconnectDelayRef.current);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { connected };
}
