export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-terminal-dim text-sm animate-fade-in">
      <span className="text-terminal">NEXUS</span>
      <span>is thinking</span>
      <span className="flex gap-1">
        <Dot delay="0s" />
        <Dot delay="0.15s" />
        <Dot delay="0.3s" />
      </span>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-terminal"
      style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: delay }}
    />
  );
}
