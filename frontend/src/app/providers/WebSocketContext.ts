import { createContext } from "react";
import type { Json, Listener } from "./wsTypes";

export interface WsCtx {
  addListener: (fn: Listener) => () => void;
  sendJson: (data: Json) => void;
}

export const WebSocketContext = createContext<WsCtx | null>(null);