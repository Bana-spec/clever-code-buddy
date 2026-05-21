import { Plus, MessageSquare, Trash2, LogOut } from "lucide-react";
import type { Conversation } from "@/lib/chat-storage";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
  open: boolean;
  onCloseMobile: () => void;
}

export function ChatSidebar({
  conversations, activeId, onSelect, onNew, onDelete, onLogout, open, onCloseMobile,
}: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-background/70 z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-72 bg-card/80 backdrop-blur border-r border-border
        flex flex-col
        transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-terminal animate-pulse" />
            <span className="text-xs text-terminal-dim tracking-widest uppercase">online</span>
            <span className="ml-auto text-[10px] text-terminal-dim">v1.0</span>
          </div>
          <div className="text-xl font-bold text-terminal text-glow tracking-wider">
            NEXUS
          </div>
          <div className="text-[10px] text-terminal-dim uppercase tracking-widest">
            ai · terminal
          </div>
        </div>

        <button
          onClick={onNew}
          className="m-3 flex items-center justify-center gap-2 py-2.5 border border-terminal/40 rounded-md text-terminal hover:bg-terminal/10 hover:border-terminal transition-colors text-sm font-bold"
        >
          <Plus size={14} /> new session
        </button>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="text-[10px] text-terminal-dim uppercase tracking-widest px-2 py-2">
            ── sessions ──
          </div>
          {conversations.length === 0 && (
            <div className="px-3 py-4 text-xs text-terminal-dim italic">
              no sessions yet. start one above.
            </div>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm mb-0.5 border ${
                activeId === c.id
                  ? "bg-accent border-terminal/30 text-terminal"
                  : "border-transparent text-foreground/80 hover:bg-accent/50"
              }`}
              onClick={() => onSelect(c.id)}
            >
              <MessageSquare size={12} className="shrink-0 opacity-60" />
              <span className="truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-danger hover:text-danger/80 p-1"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onLogout}
          className="m-3 flex items-center justify-center gap-2 py-2 border border-border rounded-md text-terminal-dim hover:text-danger hover:border-danger/50 transition-colors text-xs"
        >
          <LogOut size={12} /> lock vault
        </button>
      </aside>
    </>
  );
}
