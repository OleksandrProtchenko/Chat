import { useContext } from "react";
import { WebSocketContext } from "./WebSocketContext";

export function useWs() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWs must be used inside WebSocketProvider");
  return ctx;
}