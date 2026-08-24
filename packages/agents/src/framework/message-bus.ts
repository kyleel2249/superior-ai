/**
 * In-process agent message bus.
 */

export type AgentMessageType =
  | "task_assign"
  | "task_result"
  | "ask"
  | "inform"
  | "escalate"
  | "handoff";

export interface AgentMessage {
  id: string;
  from: string;
  to: string; // agent id or "*"
  type: AgentMessageType;
  payload: Record<string, unknown>;
  correlationId?: string;
  createdAt: string;
}

type Handler = (msg: AgentMessage) => void | Promise<void>;

const handlers = new Map<string, Set<Handler>>();
const inbox = new Map<string, AgentMessage[]>();
const history: AgentMessage[] = [];
const MAX = 500;

function mid() {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function subscribeAgent(agentId: string, handler: Handler): () => void {
  if (!handlers.has(agentId)) handlers.set(agentId, new Set());
  handlers.get(agentId)!.add(handler);
  return () => handlers.get(agentId)?.delete(handler);
}

export async function sendAgentMessage(
  partial: Omit<AgentMessage, "id" | "createdAt">
): Promise<AgentMessage> {
  const msg: AgentMessage = {
    ...partial,
    id: mid(),
    createdAt: new Date().toISOString(),
  };
  history.push(msg);
  if (history.length > MAX) history.shift();

  const targets =
    msg.to === "*"
      ? [...handlers.keys()]
      : [msg.to];

  for (const t of targets) {
    if (!inbox.has(t)) inbox.set(t, []);
    inbox.get(t)!.push(msg);
    const set = handlers.get(t);
    if (set) {
      for (const h of set) {
        try {
          await h(msg);
        } catch (err) {
          console.error(JSON.stringify({ level: "error", msg: "agent bus handler", error: String(err) }));
        }
      }
    }
  }
  return msg;
}

export function readInbox(agentId: string, clear = false): AgentMessage[] {
  const list = inbox.get(agentId) ?? [];
  if (clear) inbox.set(agentId, []);
  return [...list];
}

export function messageHistory(limit = 50): AgentMessage[] {
  return history.slice(-limit);
}

export function clearBus(): void {
  handlers.clear();
  inbox.clear();
  history.length = 0;
}
