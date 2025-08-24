import React, { useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";
import type { Json, Listener } from "./wsTypes";
import { WebSocketContext } from "./WebSocketContext";

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<Listener>>(new Set());

  useEffect(() => {
    if (!user) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws/${user.id}`);
    wsRef.current = ws;

    ws.onmessage = evt => {
      let parsed: unknown = evt.data;
      try { parsed = JSON.parse(evt.data); } catch {/* raw */}
      listenersRef.current.forEach(l => l({ data: parsed }));
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user]);

  const addListener = useCallback((fn: Listener) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  const sendJson = useCallback((data: Json) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ addListener, sendJson }}>
      {children}
    </WebSocketContext.Provider>
  );
};