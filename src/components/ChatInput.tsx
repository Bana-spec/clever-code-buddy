import { useEffect, useRef, useState } from "react";
import { Send, Bot, Sparkles, MessageSquare } from "lucide-react";

export type SendMode = "chat" | "humanize" | "detect";

interface Props {
  onSend: (text: string, mode: SendMode) => void;
  disabled?: boolean;
}

const MODES: { id: SendMode; label: string; icon: typeof Send; hint: string }[] = [
  { id: "chat", label: "chat", icon: MessageSquare, hint: "normal AI chat" },
  { id: "humanize", label: "humanize", icon: Sparkles, hint: "rewrite text as natural human prose" },
  { id: "detect", label: "ai-detect", icon: Bot, hint: "estimate AI-generated probability" },
];

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<SendMode>("chat");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [value]);

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t, mode);
    setValue("");
  };

  const placeholder =
    mode === "humanize"
      ? "paste AI text to humanize…"
      : mode === "detect"
      ? "paste text to scan for AI authorship…"
      : "type your query…  (Enter to send, Shift+Enter for new line)";

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-1 mb-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                title={m.hint}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                  active
                    ? "border-terminal text-terminal bg-terminal/10"
                    : "border-border text-terminal-dim hover:text-terminal hover:border-terminal/50"
                }`}
              >
                <Icon size={11} />
                {m.label}
              </button>
            );
          })}
        </div>
        <div className="relative border border-border rounded-lg bg-card focus-within:border-terminal focus-within:border-glow transition-all">
          <div className="absolute left-3 top-3 text-terminal-dim text-xs select-none pointer-events-none">
            {mode === "humanize" ? "~>" : mode === "detect" ? "?>" : "$>"}
          </div>
          <textarea
            ref={ref}
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={disabled ? "processing..." : placeholder}
            className="w-full bg-transparent text-foreground placeholder:text-terminal-dim/60 resize-none outline-none px-9 pr-12 py-3 text-sm leading-relaxed font-mono"
          />
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="absolute right-2 bottom-2 w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-terminal-bright transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Send"
          >
            <Send size={15} />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-terminal-dim text-center">
          NEXUS may produce inaccurate output · keys cached locally · session-isolated
        </div>
      </div>
    </div>
  );
}
