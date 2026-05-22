import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { MatrixRain } from "@/components/MatrixRain";
import { PasswordGate } from "@/components/PasswordGate";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessageView } from "@/components/ChatMessage";
import { ChatInput, type SendMode } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import {
  loadConversations, saveConversations, newConversation, titleFrom,
  type Conversation, type ChatMessage,
} from "@/lib/chat-storage";
import { getApiKey, clearApiKey } from "@/lib/api-key";
import { sendChat } from "@/lib/chat.functions";
import { humanizeText, detectAiText } from "@/lib/tools.functions";

export const Route = createFileRoute("/")({
  component: NexusApp,
  head: () => ({
    meta: [
      { title: "NEXUS // Secure AI Terminal" },
      { name: "description", content: "Direct, terminal-style AI assistant with encrypted local sessions and self-destruct privacy controls." },
    ],
  }),
});

function NexusApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(() => !!getApiKey());

  return (
    <div className="min-h-screen text-foreground relative">
      <MatrixRain />
      {!unlocked && <PasswordGate onUnlock={() => setUnlocked(true)} />}
      {unlocked && !hasKey && <ApiKeyGate onReady={() => setHasKey(true)} />}
      {unlocked && hasKey && (
        <ChatApp
          onLock={() => setUnlocked(false)}
          onChangeApiKey={() => { clearApiKey(); setHasKey(false); }}
        />
      )}
    </div>
  );
}

function ChatApp({ onLock, onChangeApiKey }: { onLock: () => void; onChangeApiKey: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const callChat = useServerFn(sendChat);
  const callHumanize = useServerFn(humanizeText);
  const callDetect = useServerFn(detectAiText);
  useEffect(() => {
    const list = loadConversations();
    setConversations(list);
    if (list.length) setActiveId(list[0].id);
  }, []);

  // Persist on change
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
      const next = exists ? prev.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...prev];
      return next;
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
      const res = await callChat({ data: { messages: payload } });
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.content || "(no response)",
        createdAt: Date.now(),
      };
      const updated: Conversation = {
        ...conv,
        messages: [...history, assistantMsg],
        updatedAt: Date.now(),
      };
      upsert(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const runTool = async (conv: Conversation, history: ChatMessage[], mode: "humanize" | "detect", text: string) => {
    setBusy(true);
    setError(null);
    try {
      let content = "";
      if (mode === "humanize") {
        const res = await callHumanize({ data: { text } });
        content = "**[ humanized output ]**\n\n" + (res.content || "(empty)");
      } else {
        const res = await callDetect({ data: { text } });
        if (res.result) {
          const r = res.result;
          const bar = "█".repeat(Math.round(r.ai_probability / 5)).padEnd(20, "░");
          content =
            `**[ AI-detection scan ]**\n\n` +
            `\`${bar}\` **${r.ai_probability}%** AI\n\n` +
            `- verdict: **${r.verdict}**\n` +
            `- confidence: ${r.confidence}\n` +
            `- signals: ${r.signals?.map((s: string) => `\`${s}\``).join(", ") || "—"}\n\n` +
            `${r.notes || ""}`;
        } else {
          content = "**[ AI-detection scan ]**\n\n" + res.raw;
        }
      }
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        createdAt: Date.now(),
      };
      upsert({ ...conv, messages: [...history, assistantMsg], updatedAt: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async (text: string, mode: SendMode = "chat") => {
    let conv = active;
    if (!conv) {
      conv = newConversation();
    }
    const label =
      mode === "humanize" ? `/humanize\n\n${text}` :
      mode === "detect" ? `/detect\n\n${text}` : text;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: label,
      createdAt: Date.now(),
    };
    const history = [...conv.messages, userMsg];
    const titled: Conversation = {
      ...conv,
      title: conv.messages.length === 0 ? titleFrom(mode === "chat" ? text : `${mode}: ${text}`) : conv.title,
      messages: history,
      updatedAt: Date.now(),
    };
    upsert(titled);
    setActiveId(titled.id);
    if (mode === "chat") {
      await runChat(titled, history);
    } else {
      await runTool(titled, history, mode, text);
    }
  };

  const handleRegenerate = async () => {
    if (!active || active.messages.length === 0) return;
    // Strip the last assistant message if present
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
        onLogout={onLock}
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
            <span className="text-terminal">~/sessions/</span>
            <span>{active?.title ?? "new"}</span>
            <span className="cursor-blink"> </span>
          </div>
          <div className="text-[10px] text-terminal-dim hidden sm:block">
            model: gemini-2.5-pro
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
