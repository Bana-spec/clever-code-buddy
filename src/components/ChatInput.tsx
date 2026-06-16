import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
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
    onSend(t);
    setValue("");
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="relative border border-border rounded-lg bg-card focus-within:border-terminal focus-within:border-glow transition-all">
          <div className="absolute left-3 top-3 text-terminal-dim text-xs select-none pointer-events-none font-mono">
            $&gt;
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
            placeholder={disabled ? "generating..." : "describe an app, feature, or script — I'll build it. (Enter to send, Shift+Enter newline)"}
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
          FORGE · idea → code · sessions remembered locally
        </div>
      </div>
    </div>
  );
}
