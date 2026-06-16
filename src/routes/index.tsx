import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { MatrixRain } from "@/components/MatrixRain";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessageView } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import {
  loadConversations, saveConversations, newConversation, titleFrom,
  type Conversation, type ChatMessage,
} from "@/lib/chat-storage";
import { getApiKey, clearApiKey } from "@/lib/api-key";
import { sendChat } from "@/lib/chat.functions";

export const Route = createFileRoute("/")({
  component: ForgeApp,
  head: () => ({
    meta: [
      { title: "FORGE // Idea → Code AI" },
      { name: "description", content: "AI code generator that turns ideas into complete, runnable code with full project structure. Conversation memory keeps your project context across turns." },
    ],
  }),
});

function ForgeApp() {
  const [hasKey, setHasKey] = useState<boolean>(() => !!getApiKey());

  return (
    <div className="min-h-screen text-foreground relative">
      <MatrixRain />
      {!hasKey && <ApiKeyGate onReady={() => setHasKey(true)} />}
      {hasKey && (
        <ChatApp
          onChangeApiKey={() => { clearApiKey(); setHasKey(false); }}
        />
      )}
    </div>
  );
}

function ChatApp({ onChangeApiKey }: { onChangeApiKey: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const callChat = useServerFn(sendChat);

  useEffect(() => {
    const list = loadConversations();
    setConversations(list);
    if (list.length) setActiveId(list[0].id);
  }, []);

  useEffect(() => {
    if (conversations.length > 0 || loadConversations().length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, busy]);

  const upsert = (conv: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      return exists ? prev.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...prev];
    });
  };

  const handleNew = () => {
    const c = newConversation();
    upsert(c);
    setActiveId(c.id);
    setSidebarOpen(false);
  };

  const handleDelete = (id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const runChat = async (conv: Conversation, history: ChatMessage[]) => {
    setBusy(true);
    setError(null);
    try {
      const payload = history.map((m) => ({ role: m.role, content: m.content }));
      const apiKey = getApiKey() ?? undefined;
      const res = await callChat({ data: { messages: payload, apiKey } });
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.content || "(no response)",
        createdAt: Date.now(),
      };
      upsert({ ...conv, messages: [...history, assistantMsg], updatedAt: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async (text: string) => {
    let conv = active;
    if (!conv) conv = newConversation();
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    const history = [...conv.messages, userMsg];
    const titled: Conversation = {
      ...conv,
      title: conv.messages.length === 0 ? titleFrom(text) : conv.title,
      messages: history,
      updatedAt: Date.now(),
    };
    upsert(titled);
    setActiveId(titled.id);
    await runChat(titled, history);
  };

  const handleRegenerate = async () => {
    if (!active || active.messages.length === 0) return;
    const msgs = [...active.messages];
    if (msgs[msgs.length - 1]?.role === "assistant") msgs.pop();
    if (msgs.length === 0) return;
    const updated = { ...active, messages: msgs };
    upsert(updated);
    await runChat(updated, msgs);
  };

  const lastAssistantIdx = active
    ? [...active.messages].map((m) => m.role).lastIndexOf("assistant")
    : -1;

  return (
    <div className="flex h-screen scanlines">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => { setActiveId(id); setSidebarOpen(false); }}
        onNew={handleNew}
        onDelete={handleDelete}
        onChangeApiKey={onChangeApiKey}
        open={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="border-b border-border bg-background/60 backdrop-blur px-4 py-3 flex items-center gap-3">
          <button
            className="md:hidden text-terminal p-1"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="text-xs text-terminal-dim font-mono truncate flex-1">
            <span className="text-terminal">~/projects/</span>
            <span>{active?.title ?? "new"}</span>
            <span className="cursor-blink"> </span>
          </div>
          <div className="text-[10px] text-terminal-dim hidden sm:block">
            model: claude-haiku-4-5
          </div>
        </header>

        {active && active.messages.length > 0 ? (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {active.messages.map((m, i) => (
                <ChatMessageView
                  key={m.id}
                  message={m}
                  canRegenerate={i === lastAssistantIdx && !busy}
                  onRegenerate={handleRegenerate}
                />
              ))}
              {busy && <TypingIndicator />}
              {error && (
                <div className="text-danger text-sm border border-danger/50 rounded-md p-3 bg-danger/10">
                  ✗ {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          <WelcomeScreen onPick={handleSend} />
        )}

        <ChatInput onSend={handleSend} disabled={busy} />
      </div>
    </div>
  );
}
