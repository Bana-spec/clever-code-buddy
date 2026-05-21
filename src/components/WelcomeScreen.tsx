import { Code2, Brain, Bug, FileText } from "lucide-react";

const SUGGESTIONS = [
  { icon: Code2, title: "explain a concept", prompt: "Explain how async/await works in JavaScript with a small example." },
  { icon: Bug, title: "debug code", prompt: "Help me debug this error: 'TypeError: Cannot read properties of undefined'." },
  { icon: Brain, title: "challenge an idea", prompt: "I think recursion is always better than loops. Push back on this — be critical." },
  { icon: FileText, title: "plan something", prompt: "Help me build a 2-week study plan for learning data structures." },
];

interface Props {
  onPick: (prompt: string) => void;
}

export function WelcomeScreen({ onPick }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        <div className="inline-block text-left text-xs text-terminal-dim mb-6 font-mono">
          <div>nexus@secure:~$ <span className="text-terminal">./boot --secure</span></div>
          <div className="text-terminal">[ ok ] kernel loaded</div>
          <div className="text-terminal">[ ok ] vault decrypted</div>
          <div className="text-terminal">[ ok ] ai gateway online</div>
          <div>nexus@secure:~$ <span className="cursor-blink"> </span></div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-terminal text-glow-strong tracking-wider mb-3">
          NEXUS
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          direct, grounded, and built to help you improve.
        </p>

        <div className="grid sm:grid-cols-2 gap-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.title}
              onClick={() => onPick(s.prompt)}
              className="text-left p-4 border border-border rounded-md hover:border-terminal/60 hover:bg-accent/40 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <s.icon size={14} className="text-terminal group-hover:text-glow" />
                <span className="text-terminal text-xs uppercase tracking-wider font-bold">
                  {s.title}
                </span>
              </div>
              <div className="text-foreground/80 text-sm leading-snug">
                {s.prompt}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
