import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, RefreshCw, Check, User, Terminal } from "lucide-react";
import type { ChatMessage as Msg } from "@/lib/chat-storage";

interface Props {
  message: Msg;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}

export function ChatMessageView({ message, onRegenerate, canRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="animate-fade-in group">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-8 h-8 rounded-md border flex items-center justify-center text-xs font-bold ${
          isUser
            ? "border-amber/60 text-amber bg-amber/10"
            : "border-terminal/60 text-terminal bg-terminal/10 text-glow"
        }`}>
          {isUser ? <User size={14} /> : <Terminal size={14} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs uppercase tracking-wider font-bold ${
              isUser ? "text-amber" : "text-terminal text-glow"
            }`}>
              {isUser ? "USER" : "NEXUS"}
            </span>
            <span className="text-[10px] text-terminal-dim">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {isUser ? (
            <div className="text-foreground whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div className="prose-terminal">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}

          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copy}
              className="flex items-center gap-1 text-[11px] text-terminal-dim hover:text-terminal px-2 py-1 rounded border border-transparent hover:border-border"
              title="Copy"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? "copied" : "copy"}</span>
            </button>
            {!isUser && canRegenerate && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-[11px] text-terminal-dim hover:text-terminal px-2 py-1 rounded border border-transparent hover:border-border"
                title="Regenerate"
              >
                <RefreshCw size={12} />
                <span>regenerate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
