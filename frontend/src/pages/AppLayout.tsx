import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ProfileModal from "../components/ProfileModal";
import { useAuth } from "../app/providers/useAuth";
import { useWs } from "../app/providers/useWs";
import { useConversations } from "../features/conversations/useConversations";

interface UserShort {
  id: number;
  username: string;
  email?: string;
  gender?: "male" | "female";
}

interface WsBaseEvent {
  type: string;
  [key: string]: unknown;
}

function isWsBaseEvent(data: unknown): data is WsBaseEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    typeof (data as Record<string, unknown>).type === "string"
  );
}

export default function AppLayout() {
  const { user, loading, logout, updateUser } = useAuth();
  const { addListener } = useWs();
  const { conversations, refresh } = useConversations();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const off = addListener(evt => {
      if (!isWsBaseEvent(evt.data)) return;
      if (
        evt.data.type === "new_message" ||
        evt.data.type === "conversation_updated" ||
        evt.data.type === "message_deleted"
      ) {
        refresh();
      }
    });
    return off;
  }, [addListener, refresh]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => logout();

  const selectedPeerUser: UserShort | null = (() => {
    const u = conversations.find(conv => conv.id === selectedConversationId)?.user;
    if (!u) return null;
    return { id: u.id, username: u.username };
  })();

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Завантаження...
      </div>
    );
  }

  const currentUserForChat = {
    id: user.id,
    username: user.username,
    email: user.email ?? "",
    gender: user.gender
  };

  const handleProfileUpdate = (patch: {
    username?: string;
    email?: string;
    gender?: string;
  }) => {
    updateUser({
      id: user.id,
      username: patch.username ?? user.username,
      email: patch.email ?? user.email ?? "",
      gender: patch.gender ?? user.gender
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 bg-blue-600 text-white">
        <div className="font-bold text-xl">БЕСІДНИК</div>
        <button
          className="md:hidden text-3xl px-2 py-1 rounded hover:bg-blue-700 transition"
          onClick={() => setSidebarOpen(true)}
          aria-label="Відкрити меню"
          type="button"
        >
          &#9776;
        </button>
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center space-x-2 rounded-full bg-white text-blue-600 px-3 py-1 hover:bg-blue-100 transition"
            onClick={() => setMenuOpen(v => !v)}
            type="button"
          >
            <span>👤</span>
            <span>{user.username}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-gray-800 rounded shadow-lg z-10">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => setProfileModalOpen(true)}
                type="button"
              >
                Налаштування
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleLogout}
                type="button"
              >
                Вийти
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />
        <main className="flex-1 flex flex-col min-h-0 h-full">
          {selectedConversationId && selectedPeerUser ? (
            <ChatWindow
              conversationId={selectedConversationId}
              currentUser={currentUserForChat}
              peerUser={selectedPeerUser}
            />
          ) : (
            <div className="text-gray-400 flex-1 flex items-center justify-center">
              Виберіть співрозмовника
            </div>
          )}
        </main>
      </div>
      {profileModalOpen && (
        <ProfileModal
          user={currentUserForChat}
          onClose={() => setProfileModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}