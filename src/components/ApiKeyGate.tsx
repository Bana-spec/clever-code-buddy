import { useState } from "react";
import { setApiKey } from "@/lib/api-key";

interface Props {
  onReady: () => void;
}

export function ApiKeyGate({ onReady }: Props) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const k = key.trim();
    if (k.length < 10) {
      setError("API key looks too short.");
      return;
    }
    setApiKey(k);
    onReady();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background terminal-grid p-6">
      <div className="absolute top-4 left-6 text-xs text-terminal-dim font-mono">
        forge@local:~$ provision-key<span className="text-terminal cursor-blink"> </span>
      </div>

      <form onSubmit={submit} className="w-full max-w-md space-y-5 animate-fade-in">
        <div className="text-center">
          <div className="text-4xl font-bold text-terminal text-glow-strong tracking-widest">FORGE</div>
          <div className="text-xs uppercase tracking-[0.3em] text-terminal-dim mt-2">
            idea → code
          </div>
        </div>

        <div className="text-xs text-muted-foreground leading-relaxed border border-border rounded-md p-3 bg-card/50">
          <span className="text-amber">⚠</span> Paste your <strong className="text-terminal-bright">Anthropic API key</strong> to
          activate the code generator. The key is stored locally in your browser only — never uploaded
          anywhere except Anthropic when you send a message.
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-terminal-dim">API key</span>
          <input
            type="password"
            value={key}
            autoFocus
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-..."
            className="mt-1 w-full bg-input border border-border rounded-md px-3 py-2 text-terminal text-glow font-mono focus:outline-none focus:border-terminal focus:border-glow"
          />
        </label>

        {error && (
          <div className="text-danger text-sm font-bold border border-danger/50 rounded-md p-2 bg-danger/10">
            ✗ {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:bg-terminal-bright transition-colors border-glow"
        >
          ACTIVATE ▸
        </button>

        <div className="text-[10px] text-terminal-dim text-center">
          stored in localStorage · change anytime from sidebar
        </div>
      </form>
    </div>
  );
}
