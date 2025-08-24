import React from "react";

interface ChatHeaderProps {
  peerUsername: string;
}
export const ChatHeader: React.FC<ChatHeaderProps> = ({ peerUsername }) => (
  <div className="flex justify-between items-center px-4 py-5 border-b bg-white">
    <div className="font-semibold">
      Бесіда з: {peerUsername || "Користувач невідомий"}
    </div>
  </div>
);