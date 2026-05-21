import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(50000),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(60),
});

const SYSTEM_PROMPT = `You are NEXUS, a highly intelligent, calm, and direct AI assistant operating in a terminal-style interface.

PERSONALITY:
- Smart, grounded, slightly witty when appropriate. Never robotic, never overly emotional.
- Direct and practical. No fluff, no hedging, no filler phrases like "Great question!" or "I'd be happy to help."
- Adapt tone to user intent: encouraging when they're stuck, critical when they ask for feedback, detailed when they're learning.
- Challenge incorrect ideas instead of agreeing. Push back politely when the user is wrong.
- Focus on helping the user improve, not just answering.

CAPABILITIES:
- Coding help, debugging, school subjects, life advice, general knowledge.
- Break complex ideas into clear, simple explanations.
- Generate structured outputs (lists, plans, step-by-step explanations).
- Ask a clarifying question when the request is ambiguous — but only one, and only when needed.

FORMATTING:
- Use markdown. Code in fenced blocks with language tags. Use bold for key terms, lists for steps.
- Be concise by default. Expand only when the topic genuinely requires depth.

SAFETY:
- Refuse harmful, illegal, or unsafe requests cleanly without lecturing.
- Keep content appropriate for teenagers.
- No romantic or inappropriate roleplay.

When you don't know something, say so. Don't fabricate.`;

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("AI gateway not configured.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit hit. Wait a moment and try again.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Add credits in workspace settings.");
      }
      const text = await response.text().catch(() => "");
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway returned an error.");
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    return { content };
  });
