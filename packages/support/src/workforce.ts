/**
 * AI Customer Experience / Support workforce
 */

export type SupportAgentRole =
  | "customer_support"
  | "technical_support"
  | "billing_support"
  | "product_support"
  | "complaint_resolution"
  | "customer_success"
  | "retention"
  | "escalation"
  | "knowledge_base"
  | "qa"
  | "supervisor";

export type Sentiment =
  | "frustrated"
  | "confused"
  | "urgent"
  | "angry"
  | "disappointed"
  | "satisfied"
  | "uncertain"
  | "neutral";

export interface SupportTicket {
  id: string;
  customerId?: string;
  subject: string;
  body: string;
  sentiment: Sentiment;
  assignedRole: SupportAgentRole;
  status: "open" | "pending" | "resolved" | "escalated";
  history: string[];
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

const tickets: SupportTicket[] = [];
const customerHistory = new Map<string, string[]>();

function detectSentiment(text: string): Sentiment {
  const t = text.toLowerCase();
  if (/angry|furious|unacceptable|lawsuit/.test(t)) return "angry";
  if (/urgent|asap|immediately|down|outage/.test(t)) return "urgent";
  if (/frustrat|ridiculous|again/.test(t)) return "frustrated";
  if (/confus|don't understand|unclear/.test(t)) return "confused";
  if (/disappoint|not happy|unhappy/.test(t)) return "disappointed";
  if (/thank|great|love|perfect/.test(t)) return "satisfied";
  if (/\?|maybe|not sure/.test(t)) return "uncertain";
  return "neutral";
}

function assignRole(text: string, sentiment: Sentiment): SupportAgentRole {
  const t = text.toLowerCase();
  if (/bill|invoice|charge|refund|payment/.test(t)) return "billing_support";
  if (/bug|error|crash|api|timeout|technical/.test(t)) return "technical_support";
  if (/cancel|churn|leaving|switch/.test(t)) return "retention";
  if (/complaint|escalate|manager/.test(t) || sentiment === "angry") return "complaint_resolution";
  if (/how do i|feature|product/.test(t)) return "product_support";
  return "customer_support";
}

export function openTicket(input: {
  subject: string;
  body: string;
  customerId?: string;
}): SupportTicket {
  const sentiment = detectSentiment(input.subject + " " + input.body);
  const assignedRole = assignRole(input.subject + " " + input.body, sentiment);
  const history: string[] = [];
  if (input.customerId && customerHistory.has(input.customerId)) {
    history.push(...(customerHistory.get(input.customerId) ?? []).slice(-5));
  }

  const ticket: SupportTicket = {
    id: `tkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    customerId: input.customerId,
    subject: input.subject,
    body: input.body,
    sentiment,
    assignedRole,
    status: sentiment === "angry" || sentiment === "urgent" ? "escalated" : "open",
    history,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Draft response guidance (not a fake resolution)
  const guidance = craftGuidance(ticket);
  ticket.history.push(`Agent(${assignedRole}): ${guidance}`);
  tickets.push(ticket);

  if (input.customerId) {
    const h = customerHistory.get(input.customerId) ?? [];
    h.push(`${ticket.id}: ${input.subject}`);
    customerHistory.set(input.customerId, h.slice(-20));
  }
  return ticket;
}

function craftGuidance(t: SupportTicket): string {
  const tone =
    t.sentiment === "angry" || t.sentiment === "frustrated"
      ? "Acknowledge impact first; be direct; offer concrete next step."
      : t.sentiment === "confused"
        ? "Use plain language; one step at a time; confirm understanding."
        : "Be clear and helpful; minimize questions.";
  return `[${tone}] Understand → Identify → Verify → Explain → Solve → Confirm. Do not ask customer to repeat known history (${t.history.length} prior notes).`;
}

export function resolveTicket(id: string, resolution: string): SupportTicket | null {
  const t = tickets.find((x) => x.id === id);
  if (!t) return null;
  t.status = "resolved";
  t.resolution = resolution;
  t.updatedAt = new Date().toISOString();
  t.history.push(`Resolved: ${resolution}`);
  return t;
}

export function listTickets(): SupportTicket[] {
  return [...tickets].reverse();
}

export function supportTrendAlerts(): string[] {
  const open = tickets.filter((t) => t.status !== "resolved");
  const bySubject = new Map<string, number>();
  for (const t of open) {
    const key = t.subject.toLowerCase().slice(0, 40);
    bySubject.set(key, (bySubject.get(key) ?? 0) + 1);
  }
  const alerts: string[] = [];
  for (const [k, n] of bySubject) {
    if (n >= 3) alerts.push(`Trend: ${n} open tickets related to "${k}" → notify Product + Engineering`);
  }
  return alerts;
}

export interface KbArticle {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
}

const kb: KbArticle[] = [];

export function upsertKbArticle(input: { title: string; body: string; tags?: string[] }): KbArticle {
  const existing = kb.find((a) => a.title.toLowerCase() === input.title.toLowerCase());
  if (existing) {
    existing.body = input.body;
    existing.tags = input.tags ?? existing.tags;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }
  const article: KbArticle = {
    id: `kb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: input.body,
    tags: input.tags ?? [],
    updatedAt: new Date().toISOString(),
  };
  kb.push(article);
  return article;
}

export function searchKb(query: string): KbArticle[] {
  const q = query.toLowerCase();
  return kb.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.body.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function listKb(): KbArticle[] {
  return [...kb];
}

export function draftSupportReply(ticketSubject: string, ticketBody: string): {
  reply: string;
  steps: string[];
  disclaimer: string;
} {
  return {
    reply: `Thank you for contacting us about "${ticketSubject}". We've reviewed your message and will address it step by step.`,
    steps: [
      "Acknowledge the issue and impact",
      "Restate understanding",
      "Provide next action or timeline",
      "Offer confirmation path",
    ],
    disclaimer: "Draft only — verify account-specific facts before sending. Do not invent policy exceptions.",
  };
}
