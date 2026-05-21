import { useEffect, useState } from "react";
import { sha256, timingSafeEqual } from "@/lib/crypto";
import { wipeAllLocalData } from "@/lib/chat-storage";

const PRIMARY_KEY = "nexus.auth.primary";
const DESTRUCT_KEY = "nexus.auth.destruct";

type Stage = "loading" | "setup" | "login" | "wiping" | "unlocked";

interface Props {
  onUnlock: () => void;
}

export function PasswordGate({ onUnlock }: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [primary, setPrimary] = useState("");
  const [second, setSecond] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hasCreds = localStorage.getItem(PRIMARY_KEY) && localStorage.getItem(DESTRUCT_KEY);
    setStage(hasCreds ? "login" : "setup");
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (p1.length < 4) return setError("Primary key must be at least 4 characters.");
    if (p1 !== p2) return setError("Primary key confirmation does not match.");
    if (d1.length < 4) return setError("Self-destruct key must be at least 4 characters.");
    if (d1 !== d2) return setError("Self-destruct confirmation does not match.");
    if (p1 === d1) return setError("Keys must be different.");

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
    const [primaryHash, secondHash] = await Promise.all([sha256(primary), sha256(second)]);

    // Self-destruct match wipes everything silently.
    if (timingSafeEqual(secondHash, storedDestruct)) {
      setStage("wiping");
      wipeAllLocalData();
      localStorage.removeItem(PRIMARY_KEY);
      localStorage.removeItem(DESTRUCT_KEY);
      setTimeout(() => {
        setP1(""); setP2(""); setD1(""); setD2("");
        setPrimary(""); setSecond("");
        setBusy(false);
        setStage("setup");
      }, 2600);
      return;
    }

    if (!timingSafeEqual(primaryHash, storedPrimary)) {
      setBusy(false);
      setError("ACCESS DENIED // invalid keys");
      return;
    }

    // primary correct, second wrong (not destruct) — also deny
    setBusy(false);
    setError("ACCESS DENIED // invalid second key");
  };

  // Special handler: primary correct + second key NOT destruct but matches primary → unlock
  // Simpler model: require primary correct AND second key correct.
  // We use: primary = primary key; second = either primary again OR destruct.
  // Per spec: user must enter both. We'll require: second key = primary key for normal unlock,
  // OR second key = destruct → wipe.
  // Refactor: when second matches storedPrimary too, unlock.
  const handleLoginV2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const storedPrimary = localStorage.getItem(PRIMARY_KEY) ?? "";
    const storedDestruct = localStorage.getItem(DESTRUCT_KEY) ?? "";
    const [primaryHash, secondHash] = await Promise.all([sha256(primary), sha256(second)]);

    if (timingSafeEqual(secondHash, storedDestruct)) {
      setStage("wiping");
      wipeAllLocalData();
      localStorage.removeItem(PRIMARY_KEY);
      localStorage.removeItem(DESTRUCT_KEY);
      setTimeout(() => {
        setPrimary(""); setSecond("");
        setBusy(false);
        setStage("setup");
      }, 2600);
      return;
    }

    if (!timingSafeEqual(primaryHash, storedPrimary)) {
      setBusy(false);
      return setError("ACCESS DENIED // primary key invalid");
    }
    if (!timingSafeEqual(secondHash, storedPrimary)) {
      setBusy(false);
      return setError("ACCESS DENIED // second key invalid");
    }

    setBusy(false);
    onUnlock();
  };

  if (stage === "loading") return null;

  if (stage === "wiping") {
    return (
      <Shell>
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-danger text-3xl font-bold tracking-widest text-glow-strong">
            ⚠ SECURE WIPE INITIATED
          </div>
          <div className="text-muted-foreground text-sm">
            Purging conversations and credentials…
          </div>
          <div className="text-terminal text-xs cursor-blink">rm -rf ~/.nexus</div>
        </div>
      </Shell>
    );
  }

  if (stage === "setup") {
    return (
      <Shell>
        <form onSubmit={handleSetup} className="w-full max-w-md space-y-5 animate-fade-in">
          <Header subtitle="initialize new vault" />
          <div className="text-xs text-muted-foreground leading-relaxed border border-border rounded-md p-3 bg-card/50">
            <span className="text-amber">⚠</span> Set two keys. The <strong className="text-terminal-bright">primary key</strong> unlocks the app.
            The <strong className="text-danger">self-destruct key</strong>, if entered as the second key at login,
            silently wipes all conversations and credentials. Choose distinct, memorable phrases — there is no recovery.
          </div>

          <Field label="Primary key" type="password" value={p1} onChange={setP1} autoFocus />
          <Field label="Confirm primary key" type="password" value={p2} onChange={setP2} />
          <Field label="Self-destruct key" type="password" value={d1} onChange={setD1} />
          <Field label="Confirm self-destruct key" type="password" value={d2} onChange={setD2} />

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

  // login
  return (
    <Shell>
      <form onSubmit={handleLoginV2} className="w-full max-w-md space-y-5 animate-fade-in">
        <Header subtitle="authentication required" />
        <div className="text-xs text-muted-foreground border border-border rounded-md p-3 bg-card/50">
          Enter your <strong className="text-terminal-bright">primary key</strong> twice to unlock.
          Entering the <strong className="text-danger">self-destruct key</strong> as the second key will purge everything.
        </div>

        <Field label="Primary key" type="password" value={primary} onChange={setPrimary} autoFocus />
        <Field label="Second key" type="password" value={second} onChange={setSecond} />

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
