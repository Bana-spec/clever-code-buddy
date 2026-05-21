import { useEffect, useRef } from "react";

/**
 * Animated Matrix-style background. Renders into a fixed canvas.
 * Subtle so it doesn't compete with the chat content.
 */
export function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let drops: number[] = [];
    const fontSize = 14;
    const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]()=+-*&|!?#@$%/\\".split("");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.ceil(canvas.width / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    };
    resize();
    window.addEventListener("resize", resize);

    let last = 0;
    const draw = (t: number) => {
      if (t - last > 55) {
        last = t;
        ctx.fillStyle = "rgba(10, 14, 12, 0.10)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px JetBrains Mono, monospace`;
        for (let i = 0; i < drops.length; i++) {
          const ch = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;
          // Bright leading char
          ctx.fillStyle = "rgba(180, 255, 200, 0.85)";
          ctx.fillText(ch, x, y);
          // Trail
          ctx.fillStyle = "rgba(60, 200, 120, 0.35)";
          ctx.fillText(ch, x, y - fontSize);

          if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.18]"
      aria-hidden
    />
  );
}
