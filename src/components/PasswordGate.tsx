import { useEffect, useState } from "react";
import { sha256, timingSafeEqual } from "@/lib/crypto";
import { wipeAllLocalData } from "@/lib/chat-storage";

const PRIMARY_KEY = "nexus.auth.primary";
const DESTRUCT_KEY = "nexus.auth.destruct";

type Stage = "loading" | "setup" | "login" | "unlocked";

interface Props {
  onUnlock: () => void;
}

export function PasswordGate({ onUnlock }: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const hasCreds = localStorage.getItem(PRIMARY_KEY) && localStorage.getItem(DESTRUCT_KEY);
    setStage(hasCreds ? "login" : "setup");
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (p1.length < 4) return setError("Passcode must be at least 4 characters.");
    if (p1 !== p2) return setError("Passcode confirmation does not match.");
    if (d1.length < 4) return setError("Recovery passcode must be at least 4 characters.");
    if (d1 !== d2) return setError("Recovery confirmation does not match.");
    if (p1 === d1) return setError("Passcodes must be different.");

    setBusy(true);
    const [ph, dh] = await Promise.all([sha256(p1), sha256(d1)]);
    localStorage.setItem(PRIMARY_KEY, ph);
    localStorage.setItem(DESTRUCT_KEY, dh);
    setBusy(false);
    onUnlock();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const storedPrimary = localStorage.getItem(PRIMARY_KEY) ?? "";
    const storedDestruct = localStorage.getItem(DESTRUCT_KEY) ?? "";
    const hash = await sha256(passcode);

    // Silent wipe — no UI cue, no alert. Reload to a fresh setup state.
    if (timingSafeEqual(hash, storedDestruct)) {
      wipeAllLocalData();
      localStorage.removeItem(PRIMARY_KEY);
      localStorage.removeItem(DESTRUCT_KEY);
      // Tiny delay to mimic auth latency, then hard reload.
      setTimeout(() => {
        window.location.reload();
      }, 400 + Math.random() * 300);
      return;
    }

    if (!timingSafeEqual(hash, storedPrimary)) {
      // Same latency as wipe path so timing leaks nothing.
      setTimeout(() => {
        setBusy(false);
        setError("ACCESS DENIED // invalid passcode");
      }, 400 + Math.random() * 300);
      return;
    }

    setBusy(false);
    onUnlock();
  };

  if (stage === "loading") return null;

  if (stage === "setup") {
    return (
      <Shell>
        <form onSubmit={handleSetup} className="w-full max-w-md space-y-5 animate-fade-in">
          <Header subtitle="initialize secure vault" />
          <div className="text-xs text-muted-foreground leading-relaxed border border-border rounded-md p-3 bg-card/50">
            <span className="text-amber">⚠</span> Choose a <strong className="text-terminal-bright">passcode</strong> to unlock the vault.
            Also set a <strong className="text-terminal-bright">recovery passcode</strong> — keep it private and distinct.
            There is no key recovery service.
          </div>

          <Field label="Passcode" type="password" value={p1} onChange={setP1} autoFocus />
          <Field label="Confirm passcode" type="password" value={p2} onChange={setP2} />

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-[11px] text-terminal-dim hover:text-terminal underline-offset-2 hover:underline transition-colors"
          >
            {showAdvanced ? "▾ hide advanced" : "▸ advanced options"}
          </button>

          {showAdvanced && (
            <div className="space-y-4 border-l-2 border-border pl-4 animate-fade-in">
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                The <strong className="text-danger">recovery passcode</strong>, if entered at the unlock prompt,
                will <strong>silently wipe all local data</strong> — conversations, credentials, history.
                No confirmation, no trace. Use only if compromise is imminent.
              </div>
              <Field label="Recovery passcode" type="password" value={d1} onChange={setD1} />
              <Field label="Confirm recovery passcode" type="password" value={d2} onChange={setD2} />
            </div>
          )}

          {!showAdvanced && (
            <>
              <input type="hidden" />
              {/* Auto-generate hidden state hint */}
              <div className="hidden">
                <Field label="r1" type="password" value={d1} onChange={setD1} />
                <Field label="r2" type="password" value={d2} onChange={setD2} />
              </div>
            </>
          )}

          {error && <Error msg={error} />}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:bg-terminal-bright transition-colors border-glow disabled:opacity-50"
          >
            {busy ? "INITIALIZING…" : "INITIALIZE VAULT ▸"}
          </button>
        </form>
      </Shell>
    );
  }

  // login — single innocuous passcode field. No mention of self-destruct.
  return (
    <Shell>
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-5 animate-fade-in">
        <Header subtitle="authentication required" />

        <Field label="Passcode" type="password" value={passcode} onChange={setPasscode} autoFocus />

        {error && <Error msg={error} />}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:bg-terminal-bright transition-colors border-glow disabled:opacity-50"
        >
          {busy ? "VERIFYING…" : "AUTHENTICATE ▸"}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background terminal-grid p-6">
      <div className="absolute top-4 left-6 text-xs text-terminal-dim font-mono">
        nexus@secure:~$ <span className="text-terminal cursor-blink"> </span>
      </div>
      <div className="absolute bottom-4 right-6 text-xs text-terminal-dim">
        [encrypted local vault · sha-256]
      </div>
      {children}
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-terminal text-glow-strong tracking-widest">
        NEXUS
      </div>
      <div className="text-xs uppercase tracking-[0.3em] text-terminal-dim mt-2">
        {subtitle}
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, autoFocus,
}: { label: string; type: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-terminal-dim">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-input border border-border rounded-md px-3 py-2 text-terminal text-glow font-mono focus:outline-none focus:border-terminal focus:border-glow"
      />
    </label>
  );
}

function Error({ msg }: { msg: string }) {
  return (
    <div className="text-danger text-sm font-bold border border-danger/50 rounded-md p-2 bg-danger/10">
      ✗ {msg}
    </div>
  );
}
