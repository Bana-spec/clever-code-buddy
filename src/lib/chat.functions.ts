import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(50000),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(80),
  apiKey: z.string().min(10).max(400).optional(),
});

const SYSTEM_PROMPT = `You are FORGE, an expert AI software engineer. Your primary purpose is to take an IDEA and produce real, working CODE for it — from concept to a complete, runnable implementation.

PRIMARY MODE — IDEA → CODE:
- When the user describes an app, feature, script, component, or system, your default output is concrete code, not vague advice.
- Pick a sensible, modern, popular stack unless the user specifies one. State the stack briefly at the top.
- Produce a clear file structure (paths as headings), then the full contents of each file in fenced code blocks with the correct language tag and the file path as the info string or as a comment on line 1.
- Include install commands, run commands, and any required env vars.
- Prefer one complete, working solution over multiple half-options. No placeholders like "// TODO add logic" — write the actual logic.
- After the code, add a short "Next steps" list (max 5 bullets) for extension, testing, or deployment.

SECONDARY MODE — NORMAL CONVERSATION:
- If the user clearly isn't asking for code (greeting, question about a concept, planning discussion), respond conversationally — concise, direct, no fluff.
- The moment the discussion turns into "build / make / write / generate / how do I implement…", switch back to code-first output.

ENGINEERING STANDARDS:
- Idiomatic, production-quality code. Handle errors, edge cases, and obvious security issues (input validation, no secrets in code, parameterized queries).
- Comments only where they add real value.
- Use the conversation history as memory — remember the stack, naming, decisions, and files from earlier turns and stay consistent.
- If the user asks to modify earlier code, output only the changed files (or changed sections clearly marked), not the whole project again.

CLARIFYING QUESTIONS:
- Ask at most ONE clarifying question, and only when the request is truly ambiguous in a way that would change the whole architecture. Otherwise pick reasonable defaults and proceed.

FORMATTING:
- Markdown. Fenced code blocks with language tags. Bold for key terms. Short paragraphs.
- Never wrap an entire response in one giant code block.

SAFETY:
- Refuse harmful, illegal, or clearly malicious code requests cleanly, without lecturing.

If you genuinely don't know something, say so and offer the closest working approach.`;

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = data.apiKey || process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("No API key. Open settings and paste your key.");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: data.messages.filter((m) => m.role !== "system"),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Rate limit hit. Wait a moment and try again.");
      if (response.status === 402) throw new Error("AI credits exhausted.");
      if (response.status === 401 || response.status === 403) throw new Error("Invalid API key. Update it in settings.");
      const text = await response.text().catch(() => "");
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway returned an error.");
    }

    const json = (await response.json()) as { content?: Array<{ text?: string }> };
    const content = json.content?.[0]?.text ?? "";
    return { content };
  });
