import { Code2, Rocket, Wrench, Boxes } from "lucide-react";

const SUGGESTIONS = [
  { icon: Rocket, title: "build an app", prompt: "Build a small URL shortener web app with a React frontend and a Node/Express backend using SQLite. Give me the full file structure and all file contents." },
  { icon: Code2, title: "generate a script", prompt: "Write a Python script that watches a folder for new images and automatically compresses them to WebP, preserving originals in a backup folder." },
  { icon: Wrench, title: "fix / refactor", prompt: "Refactor this code for clarity and performance:\n\n```js\n// paste your code here\n```" },
  { icon: Boxes, title: "add a feature", prompt: "I have a Next.js app. Add JWT-based authentication with login, signup, and a protected /dashboard route. Show all new and changed files." },
];

interface Props {
  onPick: (prompt: string) => void;
}

export function WelcomeScreen({ onPick }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto py-10">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        <div className="inline-block text-left text-xs text-terminal-dim mb-6 font-mono">
          <div>forge@local:~$ <span className="text-terminal">./forge --ready</span></div>
          <div className="text-terminal">[ ok ] model online</div>
          <div className="text-terminal">[ ok ] context memory loaded</div>
          <div>forge@local:~$ <span className="cursor-blink"> </span></div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-terminal text-glow-strong tracking-wider mb-3">
          FORGE
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          describe the idea — get the code. from concept to working files.
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
              <div className="text-foreground/80 text-sm leading-snug line-clamp-3">
                {s.prompt}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
