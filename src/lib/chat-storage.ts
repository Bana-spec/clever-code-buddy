export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const KEY = "nexus.conversations.v1";

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversations(list: Conversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function newConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New session",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function wipeAllLocalData() {
  if (typeof window === "undefined") return;
  // Nuke everything for this app
  const keysToKill: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("nexus.")) keysToKill.push(k);
  }
  keysToKill.forEach((k) => localStorage.removeItem(k));
}

export function titleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 48 ? t.slice(0, 45) + "…" : t || "New session";
}
