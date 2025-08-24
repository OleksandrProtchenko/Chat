import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./app/providers/AuthProvider.js";
import { WebSocketProvider } from "./app/providers/WebSocketProvider";
import ConversationsProvider from "./features/conversations/ConversationsProvider.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <WebSocketProvider>
        <ConversationsProvider>
          <App />
        </ConversationsProvider>
      </WebSocketProvider>
    </AuthProvider>
  </React.StrictMode>
);