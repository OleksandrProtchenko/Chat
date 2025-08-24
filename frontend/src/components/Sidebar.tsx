import { useEffect, useState } from "react";
import { useConversations } from "../features/conversations/useConversations";
import { useUserSearch } from "../features/conversations/hooks/useUserSearch";
import { SearchUsers } from "../features/conversations/components/SearchUsers";
import { ConversationList } from "../features/conversations/components/ConversationList";
import { ConfirmModal } from "./ConfirmModal";

interface SidebarProps {
  selectedConversationId: number | null;
  onSelectConversation: (id: number | null) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  selectedConversationId,
  onSelectConversation,
  mobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  const {
    conversations,
    startConversation,
    hideConversation,
    clearConversation
  } = useConversations();

  const {
    query,
    setQuery,
    results: searchResults,
    loading: loadingSearch,
    error: searchError
  } = useUserSearch();

  const [deleteConvId, setDeleteConvId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        onCloseMobile &&
        e.target instanceof HTMLElement &&
        e.target.closest("#sidebar-panel") === null
      ) {
        onCloseMobile();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen, onCloseMobile]);

  const handleStartConversation = async (userId: number) => {
    const cid = await startConversation(userId);
    if (cid) {
      onSelectConversation(cid);
      setQuery("");
      onCloseMobile?.();
      setError(null);
    } else {
      setError("Не вдалося створити діалог");
    }
  };

  const handleHide = async (conversationId: number) => {
    await hideConversation(conversationId);
    if (selectedConversationId === conversationId) onSelectConversation(null);
  };

  const handleClear = async (conversationId: number) => {
    await clearConversation(conversationId);
    if (selectedConversationId === conversationId) onSelectConversation(null);
  };

  const sidebarContent = (
    <>
      <SearchUsers
        value={query}
        onChange={setQuery}
        loading={loadingSearch}
        error={searchError}
        results={searchResults}
        onSelectUser={handleStartConversation}
      />
      {error && <div className="text-red-500 text-xs px-4 -mt-2 mb-2">{error}</div>}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelect={id => onSelectConversation(id)}
          onDeleteRequest={id => setDeleteConvId(id)}
          onCloseMobile={onCloseMobile}
        />
      </div>
    </>
  );

  return (
    <>
      <aside className="w-80 bg-white border-r flex flex-col h-full hidden md:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 backdrop-blur-sm bg-black/10" />
            <aside
              id="sidebar-panel"
              className="relative w-full max-w-full bg-white border-r flex flex-col h-full z-50"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer z-10"
                onClick={onCloseMobile}
                aria-label="Скасувати"
                type="button"
              >
                &times;
              </button>
              <div className="pt-12">{sidebarContent}</div>
            </aside>
        </div>
      )}

      <ConfirmModal
        open={deleteConvId !== null}
        title="Видалити співрозмовника"
        message="Оберіть дію:"
        actions={[
          {
            label: "Сховати діалог",
            variant: "secondary",
            onClick: () => deleteConvId && handleHide(deleteConvId)
          },
          {
            label: "Видалити разом з повідомленнями",
            variant: "danger",
            onClick: () => deleteConvId && handleClear(deleteConvId)
          }
        ]}
        onClose={() => setDeleteConvId(null)}
      />
    </>
  );
}